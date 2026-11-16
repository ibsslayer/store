import {
  STATIC_PRODUCTS,
  STATIC_BRANDS,
  STATIC_CATEGORIES,
  STATIC_BANK_ACCOUNTS,
  STATIC_COUPONS,
  STATIC_GIVEAWAYS,
  STATIC_REVIEWS,
  STATIC_SETTINGS,
  STATIC_SAMPLE_ORDERS
} from '../data/staticData';
import { Order, Review } from '../types';

const ORDERS_STORAGE_KEY = 'ibs_static_orders';
const GIVEAWAY_ENTRIES_KEY = 'ibs_static_giveaway_entries';
const REVIEWS_STORAGE_KEY = 'ibs_static_reviews';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function isStaticShowcaseMode(): boolean {
  if (API_BASE) return false;
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io');
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const saved: Order[] = raw ? JSON.parse(raw) : [];
    return [...saved, ...STATIC_SAMPLE_ORDERS];
  } catch {
    return [...STATIC_SAMPLE_ORDERS];
  }
}

function saveLocalOrder(order: Order) {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const saved: Order[] = raw ? JSON.parse(raw) : [];
    saved.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

function getLocalReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    const saved: Review[] = raw ? JSON.parse(raw) : [];
    return [...saved, ...STATIC_REVIEWS];
  } catch {
    return [...STATIC_REVIEWS];
  }
}

async function handleStaticApiRequest(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const [pathname, queryString] = pathWithQuery.split('?');
  const params = new URLSearchParams(queryString || '');

  let body: any = {};
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {}
  }

  // Settings, Health & Storage Status
  if (pathname === '/api/health' && method === 'GET') {
    return jsonResponse({
      ok: true,
      mode: 'static_showcase',
      service: 'iBs Slayer Storefront (Static Mode)',
      timestamp: new Date().toISOString(),
      supabase: {
        configured: false,
        connected: false,
        statusMessage: 'Static Showcase Mode: configure VITE_API_BASE_URL to connect live Supabase backend.'
      },
      storage: {
        isConfigured: false,
        provider: 'local_storage',
        missingVars: [],
        statusMessage: 'Static Showcase Mode (GitHub Pages)'
      }
    });
  }
  if (pathname === '/api/settings' && method === 'GET') {
    return jsonResponse(STATIC_SETTINGS);
  }
  if (pathname === '/api/storage/status' && method === 'GET') {
    return jsonResponse({
      isConfigured: false,
      provider: 'local_storage',
      missingVars: [],
      statusMessage: 'Static Showcase Mode (GitHub Pages)'
    });
  }
  if (pathname === '/api/storage/files' && method === 'GET') {
    return jsonResponse([]);
  }

  // Products list & search
  if (pathname === '/api/products' && method === 'GET') {
    let list = STATIC_PRODUCTS.filter(p => p.is_published);
    const search = params.get('search')?.trim().toLowerCase();
    const limit = Number(params.get('limit') || 0);
    if (search) {
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.model.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search)
      );
    }
    if (limit > 0) list = list.slice(0, limit);
    return jsonResponse(list);
  }

  // Single product by slug
  if (pathname.startsWith('/api/products/') && method === 'GET') {
    const slugOrId = decodeURIComponent(pathname.replace('/api/products/', ''));
    const product = STATIC_PRODUCTS.find(p => p.slug === slugOrId || p.id === slugOrId);
    if (!product) return jsonResponse({ error: 'Product not found' }, 404);
    const related = STATIC_PRODUCTS.filter(p => p.id !== product.id && p.brand === product.brand).slice(0, 4);
    const reviews = getLocalReviews().filter(r => r.product_id === product.id);
    return jsonResponse({ product, related, reviews });
  }

  // Product review submission
  if (pathname === '/api/reviews' && method === 'POST') {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      product_id: body.product_id,
      customer_name: body.customer_name || 'Verified Buyer',
      rating: Number(body.rating) || 5,
      title: body.title || 'Customer Review',
      comment: body.comment || '',
      created_at: new Date().toISOString()
    };
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      const saved: Review[] = raw ? JSON.parse(raw) : [];
      saved.unshift(newReview);
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(saved));
    } catch {}
    return jsonResponse({ success: true, review: newReview }, 201);
  }

  // Brands, Categories, Bank Accounts, Coupons
  if (pathname === '/api/brands' && method === 'GET') {
    return jsonResponse(STATIC_BRANDS.filter(b => b.is_active));
  }
  if (pathname === '/api/categories' && method === 'GET') {
    return jsonResponse(STATIC_CATEGORIES.filter(c => c.is_active));
  }
  if (pathname === '/api/bank-accounts' && method === 'GET') {
    return jsonResponse(STATIC_BANK_ACCOUNTS);
  }
  if (pathname === '/api/coupons' && method === 'GET') {
    return jsonResponse(STATIC_COUPONS.filter(c => c.is_active));
  }

  // Validate coupon
  if (pathname === '/api/coupons/validate' && method === 'POST') {
    const code = String(body.code || '').trim().toUpperCase();
    const cartAmount = Number(body.cart_amount || 0);
    const coupon = STATIC_COUPONS.find(c => c.code === code && c.is_active);
    if (!coupon) return jsonResponse({ error: 'Invalid or expired coupon code' }, 404);
    if (cartAmount < coupon.min_order_amount) {
      return jsonResponse(
        { error: `Minimum order of Rs. ${coupon.min_order_amount.toLocaleString('en-PK')} required for ${coupon.code}` },
        400
      );
    }
    const calculated =
      coupon.discount_type === 'percentage'
        ? Math.min(
            Math.round((cartAmount * coupon.discount_value) / 100),
            coupon.max_discount_amount || Infinity
          )
        : coupon.discount_value;
    return jsonResponse({
      code: coupon.code,
      description: coupon.description,
      discount_value: coupon.discount_value,
      discount_type: coupon.discount_type,
      calculated_discount: calculated
    });
  }

  // Giveaways
  if (pathname === '/api/giveaways' && method === 'GET') {
    return jsonResponse(STATIC_GIVEAWAYS);
  }
  if (pathname.startsWith('/api/giveaways/') && pathname.endsWith('/enter') && method === 'POST') {
    const phone = String(body.phone || '').trim();
    if (!phone) return jsonResponse({ error: 'Phone number is required' }, 400);
    try {
      const raw = localStorage.getItem(GIVEAWAY_ENTRIES_KEY);
      const entries: string[] = raw ? JSON.parse(raw) : [];
      if (entries.includes(phone)) {
        return jsonResponse({ error: 'This mobile number has already entered this giveaway.' }, 400);
      }
      entries.push(phone);
      localStorage.setItem(GIVEAWAY_ENTRIES_KEY, JSON.stringify(entries));
    } catch {}
    return jsonResponse({ success: true, message: 'Entry confirmed!' });
  }

  // Place Order (static WhatsApp + localStorage persistence)
  if (pathname === '/api/orders' && method === 'POST') {
    const requestedItems: Array<{ product_id: string; quantity: number }> = body.items || [];
    const orderItems = requestedItems
      .map((item, idx) => {
        const prod = STATIC_PRODUCTS.find(p => p.id === item.product_id);
        if (!prod) return null;
        const qty = Math.max(1, Number(item.quantity) || 1);
        return {
          id: `oi-${Date.now()}-${idx}`,
          product_id: prod.id,
          product_name: prod.name,
          product_model: prod.model,
          product_sku: prod.sku,
          pta_status: prod.pta_status,
          ram: prod.ram,
          storage: prod.storage,
          color: prod.color,
          unit_price: prod.selling_price,
          quantity: qty,
          total_price: prod.selling_price * qty,
          image_url: prod.main_image_url
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    if (orderItems.length === 0) {
      return jsonResponse({ error: 'No valid items in order' }, 400);
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.total_price, 0);
    const deliveryCharges = subtotal >= STATIC_SETTINGS.free_shipping_threshold ? 0 : STATIC_SETTINGS.standard_shipping_rate;
    let discountAmount = 0;
    if (body.coupon_code) {
      const c = STATIC_COUPONS.find(x => x.code === String(body.coupon_code).toUpperCase() && x.is_active);
      if (c && subtotal >= c.min_order_amount) {
        discountAmount =
          c.discount_type === 'percentage'
            ? Math.min(Math.round((subtotal * c.discount_value) / 100), c.max_discount_amount || Infinity)
            : c.discount_value;
      }
    }
    const totalAmount = Math.max(0, subtotal + deliveryCharges - discountAmount);
    const now = new Date().toISOString();
    const orderNumber = `IBS-2026-${Math.floor(10000 + Math.random() * 89999)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_whatsapp: body.customer_whatsapp || body.customer_phone,
      customer_email: body.customer_email,
      shipping_address: body.shipping_address,
      city: body.city,
      province: body.province,
      postal_code: body.postal_code,
      delivery_instructions: body.delivery_instructions,
      subtotal,
      delivery_charges: deliveryCharges,
      discount_amount: discountAmount,
      coupon_code: body.coupon_code,
      total_amount: totalAmount,
      payment_method: body.payment_method || 'cash_on_delivery',
      payment_status: body.payment_method === 'cash_on_delivery' ? 'pending' : 'awaiting_verification',
      order_status: 'new_order',
      tracking_history: [
        {
          status: 'new_order',
          title: 'Order Placed',
          description: `Order recorded with payment method: ${String(body.payment_method || 'COD').toUpperCase()}`,
          timestamp: now
        }
      ],
      created_at: now,
      updated_at: now,
      items: orderItems
    };

    saveLocalOrder(newOrder);

    const waPhone = STATIC_SETTINGS.whatsapp_number.replace(/[^0-9]/g, '');
    const itemsSummary = orderItems
      .map(i => `• ${i.product_name} (${i.quantity}x) - Rs. ${i.total_price.toLocaleString('en-PK')}`)
      .join('\n');
    const waMessage = encodeURIComponent(
      `Salam iBs Slayer! I just placed Order #${newOrder.order_number}.\n\n` +
        `👤 Name: ${newOrder.customer_name}\n` +
        `📞 Phone: ${newOrder.customer_phone}\n` +
        `📍 City: ${newOrder.city}\n\n` +
        `📱 Items:\n${itemsSummary}\n\n` +
        `💰 Total Payable: Rs. ${newOrder.total_amount.toLocaleString('en-PK')}\n` +
        `💳 Payment: ${newOrder.payment_method.replace(/_/g, ' ').toUpperCase()}\n\n` +
        `Please confirm my order dispatch.`
    );

    return jsonResponse({
      success: true,
      order: newOrder,
      whatsappUrl: `https://wa.me/${waPhone}?text=${waMessage}`
    }, 201);
  }

  // Get single order or customer orders
  if (pathname === '/api/orders' && method === 'GET') {
    return jsonResponse(getLocalOrders());
  }
  if (pathname.startsWith('/api/orders/') && method === 'GET') {
    const id = pathname.replace('/api/orders/', '');
    const order = getLocalOrders().find(o => o.id === id || o.order_number === id);
    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    return jsonResponse(order);
  }

  // Order Tracking
  if (pathname === '/api/tracking' && method === 'GET') {
    const ordNum = (params.get('order_number') || '').trim().toUpperCase();
    const phone = (params.get('phone') || '').replace(/[^0-9]/g, '');
    const found = getLocalOrders().find(
      o =>
        o.order_number.toUpperCase() === ordNum &&
        o.customer_phone.replace(/[^0-9]/g, '').endsWith(phone.slice(-7))
    );
    if (!found) {
      return jsonResponse(
        { error: 'Order not found. Try sample order PKM-2026-8841 with phone 03218765432, or place a new order.' },
        404
      );
    }
    return jsonResponse(found);
  }

  // AI Phone Advisor offline/static fallback
  if (pathname === '/api/ai-advisor' && method === 'POST') {
    const budgetNum = Number(String(body.budget || '').replace(/[^0-9]/g, '')) || 0;
    const brandPref = String(body.preferred_brand || '').toLowerCase();
    const ptaPref = String(body.pta_preference || '');

    let candidates = STATIC_PRODUCTS.filter(p => !p.category.includes('Chargers') && !p.category.includes('Earbuds'));
    if (brandPref && brandPref !== 'any') {
      const byBrand = candidates.filter(p => p.brand.toLowerCase().includes(brandPref));
      if (byBrand.length > 0) candidates = byBrand;
    }
    if (ptaPref && ptaPref !== 'Any') {
      const byPta = candidates.filter(p => p.pta_status.toLowerCase() === ptaPref.toLowerCase());
      if (byPta.length > 0) candidates = byPta;
    }
    if (budgetNum > 0) {
      const within = candidates.filter(p => p.selling_price <= budgetNum);
      if (within.length > 0) candidates = within;
    }
    const topPicks = candidates.slice(0, 2);
    const listText = topPicks
      .map(
        p =>
          `• ${p.name} — Rs. ${p.selling_price.toLocaleString('en-PK')} (${p.pta_status}, ${p.ram || ''} ${p.storage || ''})`
      )
      .join('\n');

    return jsonResponse({
      reply: `iBs Slayer Specialist Recommendation:\n\n${listText}\n\n• PTA Advisory: Verify IMEI via *#06# -> SMS to 8484 (DIRBS) for lifetime Pakistani SIM support.\n• Need a live quote or instant booking? Click "Order on WhatsApp" on any phone card!`
    });
  }

  // Auth / Admin notice when running in static GitHub Pages mode
  if (
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/analytics' ||
    pathname.startsWith('/api/receipts')
  ) {
    return jsonResponse(
      {
        error:
          'Account sign-in & Admin Portal require a live Node.js backend (set VITE_API_BASE_URL in GitHub repository variables). Storefront browsing & WhatsApp ordering work directly here!'
      },
      503
    );
  }

  return jsonResponse({ error: 'Endpoint unavailable in static mode' }, 404);
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (!urlStr.startsWith('/api/')) {
    return window.fetch(input, init);
  }

  // On static hosts (GitHub Pages) with no VITE_API_BASE_URL configured, resolve directly without firing guaranteed 404 requests
  if (isStaticShowcaseMode()) {
    return handleStaticApiRequest(urlStr, init);
  }

  const targetUrl = API_BASE ? `${API_BASE}${urlStr}` : urlStr;

  try {
    const response = await window.fetch(targetUrl, init);
    const contentType = response.headers.get('content-type') || '';

    // If Express backend responded with JSON, CSV, or binary blob, return untouched
    if (
      contentType.includes('application/json') ||
      contentType.includes('text/csv') ||
      contentType.includes('application/octet-stream')
    ) {
      return response;
    }

    // Static host returning HTML 404 for /api/* -> use static fallback cleanly
    return handleStaticApiRequest(urlStr, init);
  } catch {
    return handleStaticApiRequest(urlStr, init);
  }
}
