import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Order, Product, MediaAsset, PaymentReceipt, WebsiteSettings, Giveaway } from './db';

export interface SupabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  urlConfigured: boolean;
  anonKeyConfigured: boolean;
  serviceRoleConfigured: boolean;
  missingVars: string[];
  schemaReady: boolean;
  statusMessage: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(val?: string): boolean {
  return Boolean(val && UUID_REGEX.test(val));
}

class SupabaseService {
  private adminClient: SupabaseClient | null = null;
  private isConfigured = false;
  private isConnected = false;
  private schemaReady = false;
  private missingVars: string[] = [];
  private lastError = '';

  constructor() {
    this.init();
  }

  public init() {
    const url = (process.env.SUPABASE_URL || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    this.missingVars = [];
    if (!url || url.includes('your-project.supabase.co')) this.missingVars.push('SUPABASE_URL');
    if (!anonKey || anonKey === 'your-anon-key') this.missingVars.push('SUPABASE_ANON_KEY');
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
      this.missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (url && serviceRoleKey && !url.includes('your-project.supabase.co') && serviceRoleKey !== 'your-service-role-key') {
      try {
        this.adminClient = createClient(url, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        this.isConfigured = true;
        console.log('✓ Supabase server admin client initialized');
      } catch (err: any) {
        this.adminClient = null;
        this.isConfigured = false;
        this.lastError = err?.message || 'Initialization error';
        console.error('Failed to initialize Supabase client:', err);
      }
    } else {
      this.adminClient = null;
      this.isConfigured = false;
      console.warn('⚠️ Supabase not fully configured. Missing:', this.missingVars.join(', '));
    }
  }

  public getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  public async testConnectivity(): Promise<SupabaseStatus> {
    if (!this.adminClient || !this.isConfigured) {
      this.isConnected = false;
      this.schemaReady = false;
      return this.getStatus();
    }

    try {
      const { error } = await this.adminClient
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (error) {
        this.isConnected = true; // Reached Supabase, schema/table might be missing
        this.schemaReady = false;
        this.lastError = error.message;
      } else {
        this.isConnected = true;
        this.schemaReady = true;
        this.lastError = '';
      }
    } catch (err: any) {
      this.isConnected = false;
      this.schemaReady = false;
      this.lastError = err?.message || 'Connection failed';
    }

    return this.getStatus();
  }

  public getStatus(): SupabaseStatus {
    const url = (process.env.SUPABASE_URL || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    let statusMessage = '';
    if (!this.isConfigured) {
      statusMessage = `Supabase not configured (Missing: ${this.missingVars.join(', ')}). Using local persistence fallback.`;
    } else if (!this.isConnected) {
      statusMessage = `Supabase configured but unreachable: ${this.lastError || 'check SUPABASE_URL & network'}`;
    } else if (!this.schemaReady) {
      statusMessage = `Connected to Supabase, but schema tables not initialized yet (${this.lastError}). Run /supabase/schema.sql.`;
    } else {
      statusMessage = 'Connected to Supabase PostgreSQL & Auth (Schema Verified)';
    }

    return {
      isConfigured: this.isConfigured,
      isConnected: this.isConnected,
      urlConfigured: Boolean(url && !url.includes('your-project.supabase.co')),
      anonKeyConfigured: Boolean(anonKey && anonKey !== 'your-anon-key'),
      serviceRoleConfigured: Boolean(serviceRoleKey && serviceRoleKey !== 'your-service-role-key'),
      missingVars: this.missingVars,
      schemaReady: this.schemaReady,
      statusMessage
    };
  }

  public async fetchSupabaseProducts(): Promise<Product[] | null> {
    if (!this.adminClient || !this.schemaReady) return null;
    try {
      const { data, error } = await this.adminClient
        .from('products')
        .select('*, brands(name), categories(name)')
        .order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        brand: row.brands?.name || 'iBs Slayer',
        category: row.categories?.name || 'PTA-Approved Phones',
        model: row.model,
        sku: row.sku,
        description: row.description || '',
        original_price: Number(row.original_price) || 0,
        selling_price: Number(row.selling_price) || 0,
        discount_percentage: Number(row.discount_percentage) || 0,
        stock: Number(row.stock) || 0,
        ram: row.ram || undefined,
        storage: row.storage || undefined,
        color: row.color || undefined,
        condition: row.condition || 'Brand new',
        pta_status: row.pta_status || 'PTA approved',
        warranty: row.warranty || '1 Year Official Warranty',
        delivery_info: row.delivery_info || 'Free express delivery across Pakistan',
        specs: row.specs || {},
        is_featured: Boolean(row.is_featured),
        is_best_seller: Boolean(row.is_best_seller),
        is_new_arrival: Boolean(row.is_new_arrival),
        is_published: row.is_published !== false,
        main_image_url: row.main_image_url || '',
        main_image_key: row.main_image_key || undefined,
        gallery: [],
        views_count: Number(row.views_count) || 0,
        created_at: row.created_at
      }));
    } catch {
      return null;
    }
  }

  public async syncProduct(product: Product) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      const { error } = await this.adminClient.from('products').upsert(
        {
          ...(isUuid(product.id) ? { id: product.id } : {}),
          name: product.name,
          slug: product.slug,
          model: product.model,
          sku: product.sku,
          description: product.description,
          original_price: product.original_price,
          selling_price: product.selling_price,
          discount_percentage: product.discount_percentage,
          stock: product.stock,
          ram: product.ram,
          storage: product.storage,
          color: product.color,
          condition: product.condition,
          pta_status: product.pta_status,
          warranty: product.warranty,
          delivery_info: product.delivery_info,
          specs: product.specs,
          is_featured: product.is_featured,
          is_best_seller: product.is_best_seller,
          is_new_arrival: product.is_new_arrival,
          is_published: product.is_published,
          main_image_key: product.main_image_key,
          main_image_url: product.main_image_url,
          views_count: product.views_count
        },
        { onConflict: 'sku' }
      );
      if (error) console.warn('Supabase syncProduct warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncProduct error:', err);
    }
  }

  public async deleteProductBySku(sku: string) {
    if (!this.adminClient || !this.schemaReady || !sku) return;
    try {
      await this.adminClient.from('products').delete().eq('sku', sku);
    } catch {}
  }

  public async syncOrder(order: Order) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      const { data: upsertedOrder, error } = await this.adminClient
        .from('orders')
        .upsert(
          {
            ...(isUuid(order.id) ? { id: order.id } : {}),
            order_number: order.order_number,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_whatsapp: order.customer_whatsapp,
            customer_email: order.customer_email,
            shipping_address: order.shipping_address,
            city: order.city,
            province: order.province,
            postal_code: order.postal_code,
            delivery_instructions: order.delivery_instructions,
            subtotal: order.subtotal,
            delivery_charges: order.delivery_charges,
            discount_amount: order.discount_amount,
            coupon_code: order.coupon_code,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            order_status: order.order_status,
            courier_company: order.courier_company,
            courier_tracking_number: order.courier_tracking_number,
            admin_notes: order.admin_notes
          },
          { onConflict: 'order_number' }
        )
        .select('id')
        .single();

      if (error) {
        console.warn('Supabase syncOrder warning:', error.message);
        return;
      }

      if (upsertedOrder?.id && order.items?.length) {
        const { count } = await this.adminClient
          .from('order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', upsertedOrder.id);

        if ((count || 0) === 0) {
          await this.adminClient.from('order_items').insert(
            order.items.map(i => ({
              order_id: upsertedOrder.id,
              product_id: isUuid(i.product_id) ? i.product_id : null,
              product_name: i.product_name,
              product_model: i.product_model,
              product_sku: i.product_sku,
              pta_status: i.pta_status,
              ram: i.ram,
              storage: i.storage,
              color: i.color,
              unit_price: i.unit_price,
              quantity: i.quantity,
              total_price: i.total_price,
              image_url: i.image_url
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Supabase syncOrder error:', err);
    }
  }

  public async syncReceipt(receipt: PaymentReceipt) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      const { data: ord } = await this.adminClient
        .from('orders')
        .select('id')
        .eq('order_number', receipt.order_number)
        .maybeSingle();

      if (!ord?.id) return;

      await this.adminClient.from('payment_receipts').insert({
        order_id: ord.id,
        payment_method: receipt.payment_method,
        r2_key: receipt.r2_key,
        file_name: receipt.file_name,
        file_size: receipt.file_size,
        mime_type: receipt.mime_type,
        transaction_reference: receipt.transaction_reference,
        notes: receipt.notes,
        verification_status: receipt.verification_status,
        rejection_reason: receipt.rejection_reason
      });
    } catch (err) {
      console.warn('Supabase syncReceipt error:', err);
    }
  }

  public async syncMediaAsset(asset: MediaAsset) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      await this.adminClient.from('media_assets').upsert(
        {
          r2_key: asset.r2_key,
          url: asset.url,
          file_name: asset.file_name,
          folder: asset.folder,
          file_size: asset.file_size,
          mime_type: asset.mime_type
        },
        { onConflict: 'r2_key' }
      );
    } catch {}
  }

  public async deleteMediaAsset(r2Key: string) {
    if (!this.adminClient || !this.schemaReady || !r2Key) return;
    try {
      await this.adminClient.from('media_assets').delete().eq('r2_key', r2Key);
    } catch {}
  }

  public async syncSettings(settings: WebsiteSettings) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      await this.adminClient.from('website_settings').upsert(
        {
          key: 'storefront_config',
          value: settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    } catch {}
  }

  public async syncGiveaway(giveaway: Giveaway) {
    if (!this.adminClient || !this.schemaReady) return;
    try {
      await this.adminClient.from('giveaways').upsert(
        {
          title: giveaway.title,
          slug: giveaway.slug,
          description: giveaway.description,
          prize_details: giveaway.prize_details,
          image_key: giveaway.image_key,
          image_url: giveaway.image_url,
          start_date: giveaway.start_date,
          end_date: giveaway.end_date,
          is_closed: giveaway.is_closed,
          winner_name: giveaway.winner_name,
          winner_city: giveaway.winner_city,
          winner_announced_at: giveaway.winner_announced_at,
          total_entries: giveaway.total_entries
        },
        { onConflict: 'slug' }
      );
    } catch {}
  }
}

export const supabaseService = new SupabaseService();
