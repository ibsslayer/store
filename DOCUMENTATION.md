# PAKMOBILE — COMPLETE PAKISTANI MOBILE PHONE E-COMMERCE PLATFORM
## Production Architecture, Database Migrations, Cloudflare R2 & Setup Guide

---

### 1. PLATFORM OVERVIEW
PakMobile is a production-ready, full-stack smartphone and gadget e-commerce platform custom-engineered for the Pakistani market. It features:
- **Pakistani Currency & Taxes**: Real-time pricing in PKR (`Rs.`), explicit PTA status flags (**PTA Approved** with customs duty paid vs **Non-PTA** factory unlocked).
- **Payment Infrastructure**: Cash on Delivery (nationwide), JazzCash, Easypaisa, and Pakistani Bank Transfers (Meezan Bank, HBL, Bank Alfalah, Allied Bank) with private receipt upload & admin verification.
- **Primary Storage Provider**: **Cloudflare R2** S3-compatible object storage with signed URLs for private receipts and organized public folders.
- **Database & Authentication**: Supabase PostgreSQL schema with Row-Level Security (RLS) policies and embedded transaction-safe persistent engine.
- **WhatsApp Commerce**: Floating WhatsApp button, single-click product order links, itemized cart checkouts, and dispatch confirmation messages.
- **Logistics & Order Tracking**: 8-stage chronological tracking timeline with courier integration (TCS, Leopards, Trax).
- **Promotions & Giveaways**: Server-validated coupon codes, flash sales countdown timers, and monthly smartphone giveaways with transparent winner draws.
- **Gemini AI Smartphone Advisor**: Integrated Google GenAI smartphone advisor recommending models by Pakistani rupee budgets and PTA tax considerations.
- **Admin Portal**: Dedicated dashboard with orders management, product CRUD, inventory movement logs, Cloudflare R2 media manager, and live website branding controls.

---

### 2. INITIAL ADMINISTRATOR ACCOUNT
As specified in Section 18:
- **Email**: `ibsslayer@gmail.com`
- **Role**: `super_admin`
- **Temporary First-Time Password**: Configured via `ADMIN_INITIAL_PASSWORD` in `.env` (default: `ChangeMeOnFirstLogin2026!`).
- **First-Login Policy**: The system enforces a mandatory password change on the administrator's initial login. Once updated, `must_change_password` is set to `false` and hashed securely.

---

### 3. BACKBLAZE B2 S3-COMPATIBLE STORAGE SETUP INSTRUCTIONS
Backblaze B2 is the primary S3-compatible object storage service. All credentials remain secure on the server and are never exposed to browser requests.

1. Log into your **Backblaze B2 Dashboard** > **Buckets** and create a bucket (e.g. `ibsslayer-media`). Note your bucket's **Region** and **S3 Endpoint** (e.g. `s3.us-west-004.backblazeb2.com`).
2. Go to **Application Keys** > **Add a New Application Key** with Read/Write permissions for your bucket. Copy the `keyID` (`B2_ACCESS_KEY_ID`) and `applicationKey` (`B2_SECRET_ACCESS_KEY`).
3. Set the following environment variables in your server configuration or `.env`:
   ```bash
   B2_REGION="us-west-004"
   B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
   B2_ACCESS_KEY_ID="your_b2_key_id"
   B2_SECRET_ACCESS_KEY="your_b2_application_key"
   B2_BUCKET_NAME="ibsslayer-media"
   B2_PUBLIC_BASE_URL="https://f004.backblazeb2.com/file/ibsslayer-media"
   ```
4. **Storage Folders**: The application organizes uploads into:
   - `products/` & `product-gallery/`: Smartphone product photography
   - `logos/`: Store logo and brand emblems
   - `banners/`: Hero banners and flash promotion graphics
   - `payment-receipts/`: **Private folder** protected by server-side AWS SigV4 presigned URLs for payment verification
   - `giveaways/`: Giveaway prize banners and marketing graphics

*Note: If Backblaze B2 credentials are not set during initial preview, the server displays an active configuration banner in the Admin Media Manager and uses local media caching so testing is uninterrupted.*

---

### 4. SUPABASE POSTGRESQL DATABASE & MIGRATIONS
The complete PostgreSQL schema with Row-Level Security (RLS) is located at `/supabase/schema.sql`.

To deploy to Supabase:
1. Open your **Supabase Dashboard** > **SQL Editor**.
2. Run the script in `/supabase/schema.sql`.
3. Set the following environment variables in `.env`:
   ```bash
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

**Core Tables Included**:
- `profiles`, `user_roles`, `customers`, `customer_addresses`
- `products`, `product_variants`, `product_images`, `brands`, `categories`
- `inventory`, `inventory_movements`, `carts`, `cart_items`
- `orders`, `order_items` (with historical unit price snapshots)
- `bank_accounts`, `payment_receipts`, `coupons`, `promotions`
- `giveaways`, `giveaway_entries`, `reviews`, `wishlists`, `website_settings`, `media_assets`, `admin_activity_logs`

---

### 5. PAKISTANI PAYMENT CONFIGURATION
Administrators can configure all payment settings live in the Admin Portal under **Payments & Receipts**:
1. **JazzCash**: Set Merchant Account Title, Mobile/Till Number, QR Code URL, and custom instructions.
2. **Easypaisa**: Set Account Title, Mobile Number, QR Code URL, and custom instructions.
3. **Pakistani Bank Transfers**: Add or edit accounts for Meezan Bank, HBL, Bank Alfalah, UBL, MCB, Allied Bank, Faysal Bank, etc. Provide Bank Name, Account Title, Account Number, IBAN (`PK...`), Branch Name, and instructions.
4. **Manual Receipt Verification**: When customers select JazzCash, Easypaisa, or Bank Transfer, they can upload their payment receipt screenshot. The file is uploaded to Cloudflare R2 under `payment-receipts/`, and administrators can approve or reject the receipt with notes.

---

### 6. ACCEPTANCE TESTING CHECKLIST
- [x] **Store Setup**: Admin logs in with `ibsslayer@gmail.com`, changes temporary password, and can update store logo, phone, WhatsApp number, and banners.
- [x] **Product Catalog**: Add, edit, duplicate, stock adjustment, PTA status (PTA Approved vs Non-PTA), and CSV export.
- [x] **Shopping Flow**: Add to cart, live quantity adjustment, coupon application (`WELCOME5000`), city shipping calculation, and guest checkout.
- [x] **Order Placement**: Server-side stock deduction, price verification, unique order number generation (`PKM-2026-XXXX`).
- [x] **Payment Verification**: Bank transfer instructions, customer receipt upload to Cloudflare R2, admin approval queue, and payment status updates.
- [x] **WhatsApp Integration**: Single-click WhatsApp ordering on products, itemized cart WhatsApp checkout, and order confirmation links.
- [x] **Order Tracking**: Public verified tracking by Order # & Phone Number, displaying the 8 chronological tracking stages, courier tracking code, and item breakdown.
- [x] **Giveaways**: Customer entry registration, duplicate phone prevention, and transparent random winner draw.
- [x] **Security**: Passwords hashed with SHA-256 + salt, R2 credentials protected on server-side, private presigned URLs for payment receipts.
