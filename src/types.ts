export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  model: string;
  sku: string;
  description: string;
  original_price: number;
  selling_price: number;
  discount_percentage: number;
  stock: number;
  ram?: string;
  storage?: string;
  color?: string;
  condition: 'Brand new' | 'Box packed' | 'Used' | 'Refurbished';
  pta_status: 'PTA approved' | 'Non-PTA' | 'PTA status not applicable' | 'To be verified';
  warranty: string;
  delivery_info: string;
  specs: Record<string, string>;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_published: boolean;
  main_image_url: string;
  main_image_key?: string;
  gallery: Array<{ url: string; r2_key?: string; alt_text?: string }>;
  views_count: number;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  logo_key?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url: string;
  image_key?: string;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedStorage?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_model: string;
  product_sku: string;
  pta_status: string;
  ram?: string;
  storage?: string;
  color?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
  province: string;
  postal_code?: string;
  delivery_instructions?: string;
  subtotal: number;
  delivery_charges: number;
  discount_amount: number;
  coupon_code?: string;
  total_amount: number;
  payment_method: 'cash_on_delivery' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
  payment_status: 'pending' | 'awaiting_verification' | 'paid' | 'failed' | 'refunded';
  order_status: 'new_order' | 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  courier_company?: string;
  courier_tracking_number?: string;
  tracking_history: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  branch_name: string;
  instructions: string;
  logo_url: string;
  qr_code_url?: string;
  is_enabled: boolean;
}

export interface PaymentReceipt {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  r2_key: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  transaction_reference?: string;
  notes?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  end_date: string;
}

export interface Giveaway {
  id: string;
  title: string;
  slug: string;
  description: string;
  prize_details: string;
  image_url: string;
  image_key?: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  winner_name?: string;
  winner_city?: string;
  winner_announced_at?: string;
  total_entries: number;
  entries: Array<{
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    city: string;
    why_win_reason?: string;
    created_at: string;
  }>;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  r2_key: string;
  url: string;
  file_name: string;
  folder: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface WebsiteSettings {
  store_name: string;
  store_logo_url: string;
  store_logo_key?: string;
  tagline: string;
  contact_number: string;
  whatsapp_number: string;
  support_email: string;
  business_address: string;
  announcement_bar: string;
  free_shipping_threshold: number;
  standard_shipping_rate: number;
  jazzcash_details: {
    enabled: boolean;
    title: string;
    account_number: string;
    mobile_number: string;
    instructions: string;
    qr_code_url?: string;
  };
  easypaisa_details: {
    enabled: boolean;
    title: string;
    account_number: string;
    mobile_number: string;
    instructions: string;
    qr_code_url?: string;
  };
  hero_banners: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    cta_text: string;
    cta_link: string;
    image_url: string;
    image_key?: string;
    bg_gradient: string;
  }>;
  policies: {
    about_us: string;
    shipping_policy: string;
    return_policy: string;
    privacy_policy: string;
    terms_conditions: string;
    faqs: Array<{ question: string; answer: string }>;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  role: 'customer' | 'admin' | 'super_admin';
  must_change_password?: boolean;
}

export interface R2StorageStatus {
  isConfigured: boolean;
  bucketName?: string;
  publicBaseUrl?: string;
  missingVars: string[];
  statusMessage: string;
  totalFiles?: number;
  totalBytes?: number;
  totalFormattedSize?: string;
  folderBreakdown?: Record<string, { count: number; bytes: number }>;
}
