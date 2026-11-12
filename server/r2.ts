import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

export interface R2ConfigStatus {
  isConfigured: boolean;
  bucketName?: string;
  publicBaseUrl?: string;
  missingVars: string[];
  statusMessage: string;
}

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  folder: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrivate: boolean;
  provider: 'cloudflare_r2' | 'local_storage';
  error?: string;
}

const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

class R2StorageService {
  private s3Client: S3Client | null = null;
  private isConfigured: boolean = false;
  private missingVars: string[] = [];
  private bucketName: string = '';
  private publicBaseUrl: string = '';

  constructor() {
    this.init();
  }

  public init() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_BASE_URL;

    this.missingVars = [];
    if (!accountId) this.missingVars.push('R2_ACCOUNT_ID');
    if (!accessKeyId) this.missingVars.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) this.missingVars.push('R2_SECRET_ACCESS_KEY');
    if (!bucket) this.missingVars.push('R2_BUCKET_NAME');

    if (this.missingVars.length === 0 && accountId && accessKeyId && secretAccessKey) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.bucketName = bucket || '';
        this.publicBaseUrl = (publicUrl || '').replace(/\/$/, '');
        this.isConfigured = true;
        console.log('✓ Cloudflare R2 client initialized successfully for bucket:', this.bucketName);
      } catch (err) {
        console.error('Failed to initialize Cloudflare R2 client:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.warn('⚠️ Cloudflare R2 not configured. Missing variables:', this.missingVars.join(', '));
    }
  }

  public getStatus(): R2ConfigStatus {
    return {
      isConfigured: this.isConfigured,
      bucketName: this.bucketName,
      publicBaseUrl: this.publicBaseUrl,
      missingVars: this.missingVars,
      statusMessage: this.isConfigured
        ? `Connected to Cloudflare R2 bucket: ${this.bucketName}`
        : `Cloudflare R2 is not configured. Missing: ${this.missingVars.join(', ')}. Local uploads fallback active.`
    };
  }

  /**
   * Upload file to Cloudflare R2 or local directory fallback
   */
  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
    isPrivate: boolean = false
  ): Promise<UploadResult> {
    // Validate folder
    const validFolders = [
      'products',
      'product-gallery',
      'logos',
      'banners',
      'brands',
      'promotions',
      'giveaways',
      'payment-receipts',
      'customer-uploads'
    ];

    const safeFolder = validFolders.includes(folder) ? folder : 'products';

    // Sanitize file name & extension
    const ext = path.extname(fileName).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'];
    if (!allowedExts.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed. Only JPG, PNG, WebP, SVG, and PDF are supported.`);
    }

    const cleanBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueKey = `${safeFolder}/${Date.now()}-${cleanBaseName}${ext}`;

    if (this.isConfigured && this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueKey,
          Body: buffer,
          ContentType: mimeType,
          Metadata: {
            'original-name': fileName,
            'is-private': isPrivate ? 'true' : 'false',
            'uploaded-at': new Date().toISOString()
          }
        });

        await this.s3Client.send(command);

        // Build public URL or signed URL
        let fileUrl = '';
        if (isPrivate) {
          // Generate temporary presigned URL for private receipt
          const getCmd = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueKey
          });
          fileUrl = await getSignedUrl(this.s3Client, getCmd, { expiresIn: 3600 * 24 }); // 24 hours
        } else {
          fileUrl = this.publicBaseUrl
            ? `${this.publicBaseUrl}/${uniqueKey}`
            : `https://${this.bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueKey}`;
        }

        return {
          success: true,
          key: uniqueKey,
          url: fileUrl,
          folder: safeFolder,
          fileName,
          fileSize: buffer.length,
          mimeType,
          isPrivate,
          provider: 'cloudflare_r2'
        };
      } catch (err: any) {
        console.error('Cloudflare R2 PutObject error:', err);
        throw new Error(`Failed to upload to Cloudflare R2: ${err.message}`);
      }
    } else {
      // Local fallback for local preview/development
      const localFolder = path.join(LOCAL_UPLOADS_DIR, safeFolder);
      if (!fs.existsSync(localFolder)) {
        fs.mkdirSync(localFolder, { recursive: true });
      }
      const localFilePath = path.join(localFolder, `${Date.now()}-${cleanBaseName}${ext}`);
      fs.writeFileSync(localFilePath, buffer);

      const localUrl = `/uploads/${safeFolder}/${path.basename(localFilePath)}`;

      return {
        success: true,
        key: uniqueKey,
        url: localUrl,
        folder: safeFolder,
        fileName,
        fileSize: buffer.length,
        mimeType,
        isPrivate,
        provider: 'local_storage'
      };
    }
  }

  /**
   * Delete an object from Cloudflare R2
   */
  public async deleteFile(key: string): Promise<boolean> {
    if (this.isConfigured && this.s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
        await this.s3Client.send(command);
        return true;
      } catch (err) {
        console.error('Error deleting from R2:', err);
        return false;
      }
    } else {
      // Local file delete
      const localPath = path.join(LOCAL_UPLOADS_DIR, key);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    }
  }

  /**
   * Get secure signed URL for private receipts
   */
  public async getPrivateSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    if (this.isConfigured && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err: any) {
        console.error('Failed to generate presigned URL:', err);
        return '';
      }
    } else {
      // Local fallback URL
      return `/uploads/${key}`;
    }
  }
}

export const r2Service = new R2StorageService();
