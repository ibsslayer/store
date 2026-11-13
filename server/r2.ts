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

export interface StorageConfigStatus {
  isConfigured: boolean;
  provider: 'backblaze_b2' | 'cloudflare_r2' | 'local_storage';
  region?: string;
  endpoint?: string;
  bucketName?: string;
  publicBaseUrl?: string;
  missingVars: string[];
  statusMessage: string;
}

export type R2ConfigStatus = StorageConfigStatus;

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  folder: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrivate: boolean;
  provider: 'backblaze_b2' | 'cloudflare_r2' | 'local_storage';
  error?: string;
}

const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

function normalizeEndpoint(rawEndpoint: string): string {
  const trimmed = rawEndpoint.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function extractB2RegionFromEndpoint(endpoint: string): string {
  const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  return match?.[1] || '';
}

class B2StorageService {
  private s3Client: S3Client | null = null;
  private isConfigured: boolean = false;
  private provider: 'backblaze_b2' | 'cloudflare_r2' | 'local_storage' = 'local_storage';
  private missingVars: string[] = [];
  private region: string = '';
  private endpoint: string = '';
  private bucketName: string = '';
  private publicBaseUrl: string = '';

  constructor() {
    this.init();
  }

  public init() {
    // Primary Backblaze B2 configuration with fallback mapping to legacy R2_* env vars
    const accessKeyId = process.env.B2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';
    const bucket = process.env.B2_BUCKET_NAME || process.env.R2_BUCKET_NAME || '';
    const publicUrl = process.env.B2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || '';

    const rawB2Endpoint = process.env.B2_ENDPOINT ? normalizeEndpoint(process.env.B2_ENDPOINT) : '';
    const rawB2Region = (process.env.B2_REGION || '').trim();
    const legacyR2AccountId = (process.env.R2_ACCOUNT_ID || '').trim();

    let resolvedEndpoint = rawB2Endpoint;
    let resolvedRegion = rawB2Region || (rawB2Endpoint ? extractB2RegionFromEndpoint(rawB2Endpoint) : '');
    let targetProvider: 'backblaze_b2' | 'cloudflare_r2' = 'backblaze_b2';

    if (!resolvedEndpoint && resolvedRegion) {
      resolvedEndpoint = `https://s3.${resolvedRegion}.backblazeb2.com`;
    } else if (!resolvedEndpoint && !resolvedRegion && legacyR2AccountId) {
      // Optional backwards-compatible R2 fallback if only R2_ACCOUNT_ID is supplied
      targetProvider = 'cloudflare_r2';
      resolvedRegion = 'auto';
      resolvedEndpoint = `https://${legacyR2AccountId}.r2.cloudflarestorage.com`;
    }

    this.missingVars = [];
    if (!resolvedRegion && !resolvedEndpoint) this.missingVars.push('B2_REGION');
    if (!accessKeyId) this.missingVars.push('B2_ACCESS_KEY_ID');
    if (!secretAccessKey) this.missingVars.push('B2_SECRET_ACCESS_KEY');
    if (!bucket) this.missingVars.push('B2_BUCKET_NAME');

    if (this.missingVars.length === 0 && resolvedEndpoint && accessKeyId && secretAccessKey && bucket) {
      try {
        const signingRegion = resolvedRegion || 'us-west-004';
        this.s3Client = new S3Client({
          region: signingRegion,
          endpoint: resolvedEndpoint,
          forcePathStyle: targetProvider === 'backblaze_b2',
          // Prevent AWS SDK v3 >= 3.729 from injecting default CRC32 checksum headers unsupported by B2 presigned/upload requests
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
          credentials: {
            accessKeyId,
            secretAccessKey
          }
        });

        this.provider = targetProvider;
        this.region = signingRegion;
        this.endpoint = resolvedEndpoint;
        this.bucketName = bucket;
        this.publicBaseUrl = publicUrl.replace(/\/+$/, '');
        this.isConfigured = true;

        console.log(
          `✓ ${targetProvider === 'backblaze_b2' ? 'Backblaze B2' : 'Cloudflare R2'} S3 client initialized for bucket "${this.bucketName}" (${this.region} @ ${this.endpoint})`
        );
      } catch (err) {
        console.error('Failed to initialize Backblaze B2 S3 client:', err);
        this.s3Client = null;
        this.isConfigured = false;
        this.provider = 'local_storage';
      }
    } else {
      this.s3Client = null;
      this.isConfigured = false;
      this.provider = 'local_storage';
      console.warn('⚠️ Backblaze B2 not configured. Missing variables:', this.missingVars.join(', '));
    }
  }

  public getStatus(): StorageConfigStatus {
    const providerLabel = this.provider === 'backblaze_b2' ? 'Backblaze B2' : 'Cloudflare R2';
    return {
      isConfigured: this.isConfigured,
      provider: this.provider,
      region: this.region || undefined,
      endpoint: this.endpoint || undefined,
      bucketName: this.bucketName,
      publicBaseUrl: this.publicBaseUrl,
      missingVars: this.missingVars,
      statusMessage: this.isConfigured
        ? `Connected to ${providerLabel} bucket: ${this.bucketName} (${this.region})`
        : `Backblaze B2 is not configured. Missing: ${this.missingVars.join(', ')}. Local uploads fallback active.`
    };
  }

  private buildPublicObjectUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    if (this.provider === 'backblaze_b2') {
      // Standard B2 friendly/S3 object URL
      return `https://${this.bucketName}.s3.${this.region}.backblazeb2.com/${key}`;
    }
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * Upload file to Backblaze B2 S3-compatible bucket or local directory fallback
   */
  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
    isPrivate: boolean = false
  ): Promise<UploadResult> {
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
            'original-name': cleanBaseName + ext,
            'is-private': isPrivate ? 'true' : 'false',
            'uploaded-at': new Date().toISOString()
          }
        });

        await this.s3Client.send(command);

        let fileUrl = '';
        if (isPrivate) {
          // Temporary presigned URL (24 hours) for private payment receipts
          fileUrl = await this.getPrivateSignedUrl(uniqueKey, 3600 * 24);
        } else {
          fileUrl = this.buildPublicObjectUrl(uniqueKey);
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
          provider: this.provider === 'cloudflare_r2' ? 'cloudflare_r2' : 'backblaze_b2'
        };
      } catch (err: any) {
        console.error('Backblaze B2 PutObject error:', err);
        throw new Error(`Failed to upload to Backblaze B2: ${err.message}`);
      }
    } else {
      // Local fallback for local preview/development
      const localFolder = path.join(LOCAL_UPLOADS_DIR, safeFolder);
      if (!fs.existsSync(localFolder)) {
        fs.mkdirSync(localFolder, { recursive: true });
      }
      const uniqueFileName = path.basename(uniqueKey);
      const localFilePath = path.join(localFolder, uniqueFileName);
      fs.writeFileSync(localFilePath, buffer);

      const localUrl = `/uploads/${safeFolder}/${uniqueFileName}`;

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
   * Delete an object from Backblaze B2 or local fallback
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
        console.error('Error deleting from Backblaze B2:', err);
        return false;
      }
    } else {
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
   * Check whether an object exists in Backblaze B2 or local fallback
   */
  public async fileExists(key: string): Promise<boolean> {
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key
          })
        );
        return true;
      } catch {
        return false;
      }
    }
    return fs.existsSync(path.join(LOCAL_UPLOADS_DIR, key));
  }

  /**
   * List keys under an optional prefix in Backblaze B2
   */
  public async listFiles(prefix?: string): Promise<string[]> {
    if (this.isConfigured && this.s3Client) {
      try {
        const res = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix
          })
        );
        return (res.Contents || []).map(obj => obj.Key || '').filter(Boolean);
      } catch (err) {
        console.error('Error listing Backblaze B2 objects:', err);
        return [];
      }
    }
    return [];
  }

  /**
   * Generate a multi-region AWS SigV4 presigned GET URL for private receipts
   */
  public async getPrivateSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    if (this.isConfigured && this.s3Client) {
      try {
        // Backblaze B2 S3 presigned URLs support up to 7 days (604800 seconds)
        const clampedExpiry = Math.max(60, Math.min(expiresInSeconds, 604800));
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: clampedExpiry });
      } catch (err: any) {
        console.error('Failed to generate Backblaze B2 presigned URL:', err);
        return '';
      }
    } else {
      return `/uploads/${key}`;
    }
  }
}

export const b2Service = new B2StorageService();
export const r2Service = b2Service;
