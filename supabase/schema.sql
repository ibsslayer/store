-- =========================================================================
-- PAKMOBILE - COMPLETE POSTGRESQL & SUPABASE DATABASE SCHEMA WITH RLS
-- Currency: PKR (Pakistani Rupee)
-- Primary Object Storage: Cloudflare R2
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ROLES & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 2. CUSTOMER DETAILS & ADDRESSES
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    address_title TEXT DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANDS & CATEGORIES
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_key TEXT, -- Cloudflare R2 object key (brands/...)
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_key TEXT, -- Cloudflare R2 key
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS & VARIANTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    original_price NUMERIC(12, 2) NOT NULL, -- PKR
    selling_price NUMERIC(12, 2) NOT NULL,  -- PKR
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    ram TEXT, -- e.g. '8GB', '12GB', '16GB'
    storage TEXT, -- e.g. '128GB', '256GB', '512GB', '1TB'
    color TEXT,
    condition TEXT NOT NULL CHECK (condition IN ('Brand new', 'Box packed', 'Used', 'Refurbished')),
    pta_status TEXT NOT NULL CHECK (pta_status IN ('PTA approved', 'Non-PTA', 'PTA status not applicable', 'To be verified')),
    warranty TEXT DEFAULT '1 Year Official Warranty',
    delivery_info TEXT DEFAULT 'Free express delivery across Pakistan (2-4 business days)',
    specs JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    main_image_key TEXT, -- Cloudflare R2 key
    main_image_url TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    r2_key TEXT NOT NULL, -- Cloudflare R2 key e.g. 'product-gallery/xyz.webp'
    url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVENTORY & STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'sale', 'restock', 'return', 'adjustment', 'cancelled_order')),
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CARTS & ITEMS
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g. PKM-2026-10492
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_whatsapp TEXT,
    customer_email TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    delivery_instructions TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    delivery_charges NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    coupon_code TEXT,
    total_amount NUMERIC(12, 2) NOT NULL, -- PKR
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'jazzcash', 'easypaisa', 'bank_transfer')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'new_order' CHECK (order_status IN ('new_order', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
    courier_company TEXT,
    courier_tracking_number TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_model TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    pta_status TEXT NOT NULL,
    ram TEXT,
    storage TEXT,
    color TEXT,
    unit_price NUMERIC(12, 2) NOT NULL, -- Snapshot at order time
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENT METHODS, BANK ACCOUNTS & RECEIPTS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_title TEXT NOT NULL,
    account_number TEXT NOT NULL,
    iban TEXT NOT NULL,
    branch_name TEXT,
    logo_key TEXT, -- R2 key
    logo_url TEXT,
    qr_code_key TEXT, -- R2 key
    qr_code_url TEXT,
    instructions TEXT,
    is_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    r2_key TEXT NOT NULL, -- Cloudflare R2 key: payment-receipts/... (PRIVATE)
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    transaction_reference TEXT,
    notes TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COUPONS & PROMOTIONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(12, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(12, 2),
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_key TEXT, -- R2 key
    banner_url TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'bogo', 'bundle')),
    discount_value NUMERIC(10, 2),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_flash_deal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GIVEAWAYS
CREATE TABLE IF NOT EXISTS public.giveaways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    image_key TEXT, -- R2 key
    image_url TEXT,
    prize_details TEXT NOT NULL,
    eligibility_conditions TEXT,
    rules TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    winner_name TEXT,
    winner_city TEXT,
    winner_announced_at TIMESTAMPTZ,
    total_entries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.giveaway_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    why_win_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(giveaway_id, phone)
);

-- 11. REVIEWS & WISHLISTS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 12. WEBSITE SETTINGS & CLOUDFLARE R2 MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.website_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    r2_key TEXT UNIQUE NOT NULL, -- e.g. 'logos/store-logo.webp'
    url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    folder TEXT NOT NULL, -- 'products', 'logos', 'banners', 'brands', 'promotions', 'giveaways', 'payment-receipts'
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Products are readable by anyone
CREATE POLICY "Public products view" ON public.products FOR SELECT USING (is_published = true);

-- Orders: Customers can only view their own orders; admins can view all
CREATE POLICY "Customer view own orders" ON public.orders FOR SELECT
USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- Payment receipts: Strictly private, only customer owner or admin
CREATE POLICY "Private receipt view" ON public.payment_receipts FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = payment_receipts.order_id AND (o.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    ))
));
