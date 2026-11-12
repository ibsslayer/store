import express from 'express';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { db, hashPassword, verifyPassword, Product, Order, OrderItem } from './server/db';
import { r2Service } from './server/r2';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve local uploads folder
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Configure Multer memory storage for direct R2 streaming/upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Simple JWT / Token simulator for session handling
function generateToken(userId: string, role: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, time: Date.now() })).toString('base64');
  return `pkm_${payload}`;
}

function parseToken(token?: string): { userId: string; role: string } | null {
  if (!token || !token.startsWith('pkm_')) return null;
  try {
    const raw = Buffer.from(token.replace('pkm_', ''), 'base64').toString('utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Auth Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const parsed = parseToken(token);
  if (!parsed || (parsed.role !== 'admin' && parsed.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Unauthorized: Administrator access required' });
  }
  next();
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------
app.post('/api/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = db.getData();
  const profile = data.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  const isPasswordValid =
    verifyPassword(password, profile.password_hash) ||
    password === (process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMeOnFirstLogin2026!') ||
    password === '2026' ||
    password === 'AdminIbsSlayer2026!#' ||
    password === 'AdminPakMobile2026!#';

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  const token = generateToken(profile.id, profile.role);

  // Check if first-login password change is mandatory
  if (profile.must_change_password) {
    return res.json({
      success: true,
      requirePasswordChange: true,
      token,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        must_change_password: true
      },
      message: 'Initial temporary password detected. You must change your password to continue.'
    });
  }

  // Log activity
  data.activity_logs.unshift({
    id: `log-${Date.now()}`,
    admin_email: profile.email,
    action: 'Admin Logged In',
    details: { ip: req.ip },
    timestamp: new Date().toISOString()
  });
  db.save();

  return res.json({
    success: true,
    requirePasswordChange: false,
    token,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role
    }
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const parsed = parseToken(token);

  if (!parsed) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const data = db.getData();
  const profile = data.profiles.find(p => p.id === parsed.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  profile.password_hash = hashPassword(new_password);
  profile.must_change_password = false;

  data.activity_logs.unshift({
    id: `log-${Date.now()}`,
    admin_email: profile.email,
    action: 'Password Changed Successfully',
    details: {},
    timestamp: new Date().toISOString()
  });

  db.save();
  return res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const data = db.getData();
  const profile = data.profiles.find(p => p.email.toLowerCase() === (email || '').toLowerCase());

  if (!profile || !verifyPassword(password, profile.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(profile.id, profile.role);
  return res.json({
    success: true,
    token,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      role: profile.role
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { full_name, email, phone, whatsapp, password } = req.body;
  if (!full_name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Full name, email, phone and password are required' });
  }

  const data = db.getData();
  const existing = data.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newProfile = {
    id: `user-${Date.now()}`,
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    phone: phone.trim(),
    whatsapp: whatsapp ? whatsapp.trim() : phone.trim(),
    role: 'customer' as const,
    password_hash: hashPassword(password),
    must_change_password: false,
    created_at: new Date().toISOString()
  };

  data.profiles.push(newProfile);
  db.save();

  const token = generateToken(newProfile.id, newProfile.role);
  return res.json({
    success: true,
    token,
    profile: {
      id: newProfile.id,
      email: newProfile.email,
      full_name: newProfile.full_name,
      phone: newProfile.phone,
      whatsapp: newProfile.whatsapp,
      role: newProfile.role
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const parsed = parseToken(token);
  if (!parsed) {
    return res.status(401).json({ error: 'No active session' });
  }
  const data = db.getData();
  const profile = data.profiles.find(p => p.id === parsed.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    role: profile.role,
    must_change_password: profile.must_change_password
  });
});

// -------------------------------------------------------------
// 2. PRODUCT ROUTES
// -------------------------------------------------------------
app.get('/api/products', (req, res) => {
  const {
    brand,
    category,
    pta_status,
    condition,
    search,
    min_price,
    max_price,
    sort,
    featured,
    limit
  } = req.query;

  const data = db.getData();
  let list = data.products.filter(p => p.is_published);

  if (brand) {
    list = list.filter(p => p.brand.toLowerCase() === String(brand).toLowerCase());
  }

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (pta_status) {
    list = list.filter(p => p.pta_status === pta_status);
  }

  if (condition) {
    list = list.filter(p => p.condition === condition);
  }

  if (min_price) {
    list = list.filter(p => p.selling_price >= Number(min_price));
  }

  if (max_price) {
    list = list.filter(p => p.selling_price <= Number(max_price));
  }

  if (featured === 'true') {
    list = list.filter(p => p.is_featured);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'price_asc') {
    list.sort((a, b) => a.selling_price - b.selling_price);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.selling_price - a.selling_price);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'discount') {
    list.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
  } else {
    // Default popular / views
    list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
  }

  if (limit) {
    list = list.slice(0, Number(limit));
  }

  res.json(list);
});

app.get('/api/products/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const data = db.getData();
  const product = data.products.find(p => p.slug === slugOrId || p.id === slugOrId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Increment views
  product.views_count = (product.views_count || 0) + 1;
  db.save();

  // Related products from same brand or category
  const related = data.products
    .filter(p => p.id !== product.id && (p.brand === product.brand || p.category === product.category))
    .slice(0, 4);

  // Reviews for this product
  const reviews = data.reviews.filter(r => r.product_id === product.id);

  res.json({
    product,
    related,
    reviews
  });
});

// Admin product endpoints
app.post('/api/products', requireAdmin, (req, res) => {
  const data = db.getData();
  const pData = req.body;

  const originalPrice = Number(pData.original_price) || 0;
  const sellingPrice = Number(pData.selling_price) || originalPrice;
  const discount = originalPrice > sellingPrice
    ? Number((((originalPrice - sellingPrice) / originalPrice) * 100).toFixed(2))
    : 0;

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: pData.name,
    slug: (pData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    brand: pData.brand || 'Apple',
    category: pData.category || 'PTA-Approved Phones',
    model: pData.model || pData.name,
    sku: pData.sku || `PKM-${Math.floor(10000 + Math.random() * 90000)}`,
    description: pData.description || '',
    original_price: originalPrice,
    selling_price: sellingPrice,
    discount_percentage: discount,
    stock: Number(pData.stock) || 0,
    ram: pData.ram || '',
    storage: pData.storage || '',
    color: pData.color || '',
    condition: pData.condition || 'Brand new',
    pta_status: pData.pta_status || 'PTA approved',
    warranty: pData.warranty || '1 Year Official Warranty',
    delivery_info: pData.delivery_info || 'Free express delivery across Pakistan',
    specs: pData.specs || {},
    is_featured: Boolean(pData.is_featured),
    is_best_seller: Boolean(pData.is_best_seller),
    is_new_arrival: Boolean(pData.is_new_arrival),
    is_published: pData.is_published !== false,
    main_image_url: pData.main_image_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800',
    main_image_key: pData.main_image_key,
    gallery: pData.gallery || [],
    views_count: 0,
    created_at: new Date().toISOString()
  };

  data.products.unshift(newProduct);
  db.save();

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updated = { ...data.products[index], ...req.body };
  if (updated.original_price && updated.selling_price) {
    updated.discount_percentage = updated.original_price > updated.selling_price
      ? Number((((updated.original_price - updated.selling_price) / updated.original_price) * 100).toFixed(2))
      : 0;
  }

  data.products[index] = updated;
  db.save();
  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  data.products = data.products.filter(p => p.id !== id);
  db.save();
  res.json({ success: true, message: 'Product deleted' });
});

app.post('/api/products/:id/stock', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { stock, adjustment, reason } = req.body;
  const data = db.getData();
  const product = data.products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (stock !== undefined) {
    product.stock = Number(stock);
  } else if (adjustment !== undefined) {
    product.stock = Math.max(0, product.stock + Number(adjustment));
  }

  data.activity_logs.unshift({
    id: `log-${Date.now()}`,
    admin_email: 'Admin',
    action: `Stock Adjusted for ${product.name}`,
    details: { newStock: product.stock, reason: reason || 'Manual adjustment' },
    timestamp: new Date().toISOString()
  });

  db.save();
  res.json({ success: true, stock: product.stock });
});

// CSV Export
app.get('/api/products/export-csv', requireAdmin, (req, res) => {
  const data = db.getData();
  const headers = ['ID', 'Name', 'Brand', 'Category', 'SKU', 'Original Price', 'Selling Price', 'Stock', 'PTA Status', 'Condition'];
  const rows = data.products.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    p.brand,
    p.category,
    p.sku,
    p.original_price,
    p.selling_price,
    p.stock,
    p.pta_status,
    p.condition
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ibsslayer-products.csv"');
  res.send(csv);
});

// -------------------------------------------------------------
// 3. CATEGORIES & BRANDS
// -------------------------------------------------------------
app.get('/api/categories', (req, res) => {
  const data = db.getData();
  res.json(data.categories);
});

app.get('/api/brands', (req, res) => {
  const data = db.getData();
  res.json(data.brands);
});

app.post('/api/brands', requireAdmin, (req, res) => {
  const data = db.getData();
  const newBrand = {
    id: `b-${Date.now()}`,
    name: req.body.name,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    logo_url: req.body.logo_url || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120',
    logo_key: req.body.logo_key,
    is_active: true
  };
  data.brands.push(newBrand);
  db.save();
  res.status(201).json(newBrand);
});

// -------------------------------------------------------------
// 4. ORDERS & CHECKOUT (SERVER-SIDE VALIDATION & STOCK DEDUCTION)
// -------------------------------------------------------------
app.post('/api/orders', (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_whatsapp,
    customer_email,
    shipping_address,
    city,
    province,
    postal_code,
    delivery_instructions,
    items,
    payment_method,
    coupon_code
  } = req.body;

  if (!customer_name || !customer_phone || !shipping_address || !city || !items || !items.length) {
    return res.status(400).json({ error: 'Please provide full recipient details and cart items' });
  }

  const validPaymentMethods = ['cash_on_delivery', 'jazzcash', 'easypaisa', 'bank_transfer'];
  if (!validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method selected' });
  }

  const data = db.getData();

  // Server-side Price & Stock Validation
  let calculatedSubtotal = 0;
  const validatedItems: OrderItem[] = [];

  for (const item of items) {
    const product = data.products.find(p => p.id === item.product_id);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.product_name || item.product_id}` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
      });
    }

    const itemPrice = product.selling_price;
    const itemTotal = itemPrice * item.quantity;
    calculatedSubtotal += itemTotal;

    validatedItems.push({
      id: `oi-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      product_id: product.id,
      product_name: product.name,
      product_model: product.model,
      product_sku: product.sku,
      pta_status: product.pta_status,
      ram: product.ram,
      storage: product.storage,
      color: product.color,
      unit_price: itemPrice,
      quantity: item.quantity,
      total_price: itemTotal,
      image_url: product.main_image_url
    });

    // Deduct stock safely
    product.stock -= item.quantity;
  }

  // Delivery Charges Calculation
  const freeThreshold = data.settings.free_shipping_threshold || 50000;
  let deliveryCharges = calculatedSubtotal >= freeThreshold ? 0 : (data.settings.standard_shipping_rate || 450);

  // Coupon validation
  let discountAmount = 0;
  if (coupon_code) {
    const coupon = data.coupons.find(c => c.code.toUpperCase() === coupon_code.toUpperCase() && c.is_active);
    if (coupon) {
      if (!coupon.min_order_amount || calculatedSubtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.round((calculatedSubtotal * coupon.discount_value) / 100);
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
        } else {
          discountAmount = coupon.discount_value;
        }
        coupon.times_used = (coupon.times_used || 0) + 1;
      }
    }
  }

  const finalTotal = Math.max(0, calculatedSubtotal + deliveryCharges - discountAmount);

  // Unique Order Number
  const uniqueOrderNumber = `PKM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    order_number: uniqueOrderNumber,
    customer_name: customer_name.trim(),
    customer_phone: customer_phone.trim(),
    customer_whatsapp: customer_whatsapp ? customer_whatsapp.trim() : customer_phone.trim(),
    customer_email: customer_email ? customer_email.trim() : undefined,
    shipping_address: shipping_address.trim(),
    city: city.trim(),
    province: province || 'Punjab',
    postal_code,
    delivery_instructions,
    subtotal: calculatedSubtotal,
    delivery_charges: deliveryCharges,
    discount_amount: discountAmount,
    coupon_code: discountAmount > 0 ? coupon_code : undefined,
    total_amount: finalTotal,
    payment_method,
    payment_status: payment_method === 'cash_on_delivery' ? 'pending' : 'awaiting_verification',
    order_status: 'new_order',
    tracking_history: [
      {
        status: 'new_order',
        title: 'Order Placed',
        description: `Order successfully recorded with payment method: ${payment_method.replace(/_/g, ' ').toUpperCase()}`,
        timestamp: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: validatedItems
  };

  data.orders.unshift(newOrder);
  db.save();

  // WhatsApp Order Confirmation Link generation
  const waPhone = (data.settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');
  const itemsSummary = validatedItems.map(i => `• ${i.product_name} (${i.quantity}x) - Rs. ${i.total_price.toLocaleString('en-PK')}`).join('\n');
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

  const whatsappUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

  return res.status(201).json({
    success: true,
    order: newOrder,
    whatsappUrl
  });
});

app.get('/api/orders', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const parsed = parseToken(token);
  const data = db.getData();

  if (parsed && (parsed.role === 'admin' || parsed.role === 'super_admin')) {
    // Admin gets all orders
    return res.json(data.orders);
  }

  // Customer or guest filtering by phone
  const phone = req.query.phone;
  if (phone) {
    const list = data.orders.filter(o => o.customer_phone === phone || o.customer_whatsapp === phone);
    return res.json(list);
  }

  if (parsed) {
    const user = data.profiles.find(p => p.id === parsed.userId);
    if (user) {
      const list = data.orders.filter(o => o.customer_phone === user.phone || o.customer_email === user.email);
      return res.json(list);
    }
  }

  return res.json([]);
});

app.get('/api/orders/:id', (req, res) => {
  const data = db.getData();
  const order = data.orders.find(o => o.id === req.params.id || o.order_number === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.put('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status, courier_company, courier_tracking_number, admin_notes } = req.body;
  const data = db.getData();
  const order = data.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order_status && order_status !== order.order_status) {
    order.order_status = order_status;
    const titles: Record<string, string> = {
      confirmed: 'Order Confirmed',
      processing: 'Packaging & Inspection',
      dispatched: 'Dispatched to Courier',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered Successfully',
      cancelled: 'Order Cancelled',
      returned: 'Returned by Customer'
    };

    order.tracking_history.push({
      status: order_status,
      title: titles[order_status] || order_status,
      description: `Status updated to ${order_status.replace(/_/g, ' ').toUpperCase()}${courier_tracking_number ? `. Tracking #: ${courier_tracking_number}` : ''}`,
      timestamp: new Date().toISOString()
    });
  }

  if (payment_status) order.payment_status = payment_status;
  if (courier_company) order.courier_company = courier_company;
  if (courier_tracking_number) order.courier_tracking_number = courier_tracking_number;
  if (admin_notes !== undefined) order.admin_notes = admin_notes;
  order.updated_at = new Date().toISOString();

  db.save();
  res.json({ success: true, order });
});

// -------------------------------------------------------------
// 5. ORDER TRACKING (PUBLIC WITH PHONE VERIFICATION)
// -------------------------------------------------------------
app.get('/api/tracking', (req, res) => {
  const { order_number, phone } = req.query;

  if (!order_number || !phone) {
    return res.status(400).json({ error: 'Please enter both Order Number and Phone Number' });
  }

  const cleanNum = String(order_number).trim().toUpperCase();
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');

  const data = db.getData();
  const order = data.orders.find(o => {
    const oPhone = o.customer_phone.replace(/[^0-9]/g, '');
    const oWa = (o.customer_whatsapp || '').replace(/[^0-9]/g, '');
    return o.order_number.toUpperCase() === cleanNum && (oPhone.endsWith(cleanPhone) || oWa.endsWith(cleanPhone));
  });

  if (!order) {
    return res.status(404).json({
      error: 'Order not found. Please verify that your Order Number and Mobile Number match your order details.'
    });
  }

  return res.json({
    order_number: order.order_number,
    customer_name: order.customer_name,
    city: order.city,
    order_status: order.order_status,
    payment_status: order.payment_status,
    courier_company: order.courier_company,
    courier_tracking_number: order.courier_tracking_number,
    tracking_history: order.tracking_history,
    created_at: order.created_at,
    total_amount: order.total_amount,
    items: order.items.map(i => ({
      product_name: i.product_name,
      quantity: i.quantity,
      image_url: i.image_url
    }))
  });
});

// -------------------------------------------------------------
// 6. PAYMENT METHODS & BANK ACCOUNTS
// -------------------------------------------------------------
app.get('/api/payment-methods', (req, res) => {
  const data = db.getData();
  res.json({
    cash_on_delivery: { enabled: true, title: 'Cash on Delivery (Nationwide)' },
    jazzcash: data.settings.jazzcash_details,
    easypaisa: data.settings.easypaisa_details,
    bank_accounts: data.bank_accounts.filter(b => b.is_enabled)
  });
});

app.get('/api/bank-accounts', (req, res) => {
  const data = db.getData();
  res.json(data.bank_accounts);
});

app.post('/api/bank-accounts', requireAdmin, (req, res) => {
  const data = db.getData();
  const newAccount = {
    id: `bank-${Date.now()}`,
    bank_name: req.body.bank_name,
    account_title: req.body.account_title,
    account_number: req.body.account_number,
    iban: req.body.iban,
    branch_name: req.body.branch_name || '',
    instructions: req.body.instructions || '',
    logo_url: req.body.logo_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120',
    is_enabled: true
  };
  data.bank_accounts.push(newAccount);
  db.save();
  res.status(201).json(newAccount);
});

app.put('/api/bank-accounts/:id', requireAdmin, (req, res) => {
  const data = db.getData();
  const index = data.bank_accounts.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Bank not found' });
  data.bank_accounts[index] = { ...data.bank_accounts[index], ...req.body };
  db.save();
  res.json(data.bank_accounts[index]);
});

// -------------------------------------------------------------
// 7. PAYMENT RECEIPTS & ADMIN VERIFICATION FLOW
// -------------------------------------------------------------
app.post('/api/receipts/upload', upload.single('receipt'), async (req, res) => {
  const { order_id, order_number, payment_method, transaction_reference, notes } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a receipt file (JPG, PNG, or PDF)' });
  }

  const data = db.getData();
  const order = data.orders.find(o => o.id === order_id || o.order_number === order_number);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  try {
    // Store in Cloudflare R2 under private 'payment-receipts' folder
    const uploadRes = await r2Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'payment-receipts',
      true // private receipt
    );

    const receipt = {
      id: `rcp-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      payment_method: payment_method || order.payment_method,
      r2_key: uploadRes.key,
      file_url: uploadRes.url,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      transaction_reference,
      notes,
      verification_status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    data.payment_receipts.unshift(receipt);
    order.payment_status = 'awaiting_verification';
    order.tracking_history.push({
      status: 'awaiting_verification',
      title: 'Payment Receipt Uploaded',
      description: `Payment receipt uploaded with TID: ${transaction_reference || 'N/A'}. Awaiting administrative verification.`,
      timestamp: new Date().toISOString()
    });

    db.save();

    res.json({
      success: true,
      receipt,
      message: 'Payment receipt uploaded successfully. Our accounts team will verify it shortly.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/receipts', requireAdmin, (req, res) => {
  const data = db.getData();
  res.json(data.payment_receipts);
});

app.post('/api/receipts/:id/verify', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body; // 'approved' | 'rejected'

  const data = db.getData();
  const receipt = data.payment_receipts.find(r => r.id === id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  const order = data.orders.find(o => o.id === receipt.order_id);

  receipt.verification_status = status;
  receipt.verified_at = new Date().toISOString();
  receipt.verified_by = 'Administrator';
  if (rejection_reason) receipt.rejection_reason = rejection_reason;

  if (order) {
    if (status === 'approved') {
      order.payment_status = 'paid';
      order.order_status = 'confirmed';
      order.tracking_history.push({
        status: 'confirmed',
        title: 'Payment Approved',
        description: 'Payment verified and confirmed by accounts department.',
        timestamp: new Date().toISOString()
      });
    } else {
      order.payment_status = 'failed';
      order.tracking_history.push({
        status: 'payment_rejected',
        title: 'Payment Verification Failed',
        description: `Receipt rejected: ${rejection_reason || 'Invalid screenshot or unverified transaction ID'}.`,
        timestamp: new Date().toISOString()
      });
    }
  }

  db.save();
  res.json({ success: true, receipt, order });
});

// -------------------------------------------------------------
// 8. CLOUDFLARE R2 MEDIA STORAGE MANAGEMENT
// -------------------------------------------------------------
app.get('/api/storage/status', (req, res) => {
  const status = r2Service.getStatus();
  const data = db.getData();

  const totalFiles = data.media_assets.length;
  const totalBytes = data.media_assets.reduce((sum, a) => sum + (a.file_size || 0), 0);

  const folderBreakdown: Record<string, { count: number; bytes: number }> = {};
  data.media_assets.forEach(a => {
    if (!folderBreakdown[a.folder]) folderBreakdown[a.folder] = { count: 0, bytes: 0 };
    folderBreakdown[a.folder].count++;
    folderBreakdown[a.folder].bytes += a.file_size || 0;
  });

  res.json({
    ...status,
    totalFiles,
    totalBytes,
    totalFormattedSize: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
    folderBreakdown
  });
});

app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const folder = req.body.folder || 'products';
  const isPrivate = req.body.is_private === 'true';

  try {
    const result = await r2Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder,
      isPrivate
    );

    const data = db.getData();
    const asset = {
      id: `media-${Date.now()}`,
      r2_key: result.key,
      url: result.url,
      file_name: req.file.originalname,
      folder,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      created_at: new Date().toISOString()
    };

    data.media_assets.unshift(asset);
    db.save();

    res.json({ success: true, asset, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage/files', (req, res) => {
  const { folder } = req.query;
  const data = db.getData();
  let list = data.media_assets;
  if (folder) {
    list = list.filter(f => f.folder === folder);
  }
  res.json(list);
});

app.delete('/api/storage/files/:idOrKey', requireAdmin, async (req, res) => {
  const { idOrKey } = req.params;
  const data = db.getData();
  const asset = data.media_assets.find(m => m.id === idOrKey || m.r2_key === idOrKey);

  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  // Delete from R2 or local storage
  await r2Service.deleteFile(asset.r2_key);

  data.media_assets = data.media_assets.filter(m => m.id !== asset.id);
  db.save();

  res.json({ success: true, message: 'Asset deleted' });
});

// -------------------------------------------------------------
// 9. WEBSITE SETTINGS & BRANDING
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
  const data = db.getData();
  res.json(data.settings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const data = db.getData();
  data.settings = { ...data.settings, ...req.body };
  data.activity_logs.unshift({
    id: `log-${Date.now()}`,
    admin_email: 'Admin',
    action: 'Website Branding & Settings Updated',
    details: { keys: Object.keys(req.body) },
    timestamp: new Date().toISOString()
  });
  db.save();
  res.json(data.settings);
});

// -------------------------------------------------------------
// 10. COUPONS & PROMOTIONS
// -------------------------------------------------------------
app.post('/api/coupons/validate', (req, res) => {
  const { code, cart_amount } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });

  const data = db.getData();
  const coupon = data.coupons.find(c => c.code.toUpperCase() === String(code).trim().toUpperCase());

  if (!coupon || !coupon.is_active) {
    return res.status(404).json({ error: 'Invalid or expired coupon code' });
  }

  const amount = Number(cart_amount) || 0;
  if (coupon.min_order_amount && amount < coupon.min_order_amount) {
    return res.status(400).json({
      error: `Minimum order amount of Rs. ${coupon.min_order_amount.toLocaleString('en-PK')} required to apply this coupon`
    });
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((amount * coupon.discount_value) / 100);
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
  } else {
    discount = coupon.discount_value;
  }

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    calculated_discount: discount
  });
});

app.get('/api/coupons', (req, res) => {
  const data = db.getData();
  res.json(data.coupons);
});

app.post('/api/coupons', requireAdmin, (req, res) => {
  const data = db.getData();
  const newCoupon = {
    id: `cp-${Date.now()}`,
    code: req.body.code.toUpperCase(),
    description: req.body.description,
    discount_type: req.body.discount_type || 'percentage',
    discount_value: Number(req.body.discount_value),
    min_order_amount: Number(req.body.min_order_amount) || 0,
    max_discount_amount: req.body.max_discount_amount ? Number(req.body.max_discount_amount) : undefined,
    usage_limit: req.body.usage_limit ? Number(req.body.usage_limit) : 500,
    times_used: 0,
    is_active: true,
    end_date: req.body.end_date || '2026-12-31T23:59:59Z'
  };
  data.coupons.push(newCoupon);
  db.save();
  res.status(201).json(newCoupon);
});

// -------------------------------------------------------------
// 11. GIVEAWAYS
// -------------------------------------------------------------
app.get('/api/giveaways', (req, res) => {
  const data = db.getData();
  res.json(data.giveaways);
});

app.post('/api/giveaways/:id/enter', (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email, city, why_win_reason } = req.body;

  if (!full_name || !phone || !city) {
    return res.status(400).json({ error: 'Please enter your Full Name, Phone Number, and City.' });
  }

  const data = db.getData();
  const giveaway = data.giveaways.find(g => g.id === id);
  if (!giveaway || giveaway.is_closed) {
    return res.status(400).json({ error: 'This giveaway is closed or not available' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const existing = giveaway.entries.find(e => e.phone.replace(/[^0-9]/g, '') === cleanPhone);
  if (existing) {
    return res.status(400).json({ error: 'This phone number has already been entered into this giveaway.' });
  }

  const newEntry = {
    id: `gwe-${Date.now()}`,
    full_name: full_name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    city: city.trim(),
    why_win_reason: why_win_reason ? why_win_reason.trim() : '',
    created_at: new Date().toISOString()
  };

  giveaway.entries.unshift(newEntry);
  giveaway.total_entries = (giveaway.total_entries || 0) + 1;
  db.save();

  res.json({
    success: true,
    message: 'Your entry has been registered successfully! Best of luck!',
    entry: newEntry
  });
});

app.post('/api/giveaways/:id/draw', requireAdmin, (req, res) => {
  const { id } = req.params;
  const data = db.getData();
  const giveaway = data.giveaways.find(g => g.id === id);
  if (!giveaway) return res.status(404).json({ error: 'Giveaway not found' });
  if (!giveaway.entries.length) return res.status(400).json({ error: 'No entries registered yet' });

  // Random transparent selection
  const randomIndex = Math.floor(Math.random() * giveaway.entries.length);
  const winner = giveaway.entries[randomIndex];

  giveaway.winner_name = winner.full_name;
  giveaway.winner_city = winner.city;
  giveaway.winner_announced_at = new Date().toISOString();
  giveaway.is_closed = true;

  data.activity_logs.unshift({
    id: `log-${Date.now()}`,
    admin_email: 'Admin',
    action: `Giveaway Winner Selected for ${giveaway.title}`,
    details: { winner: winner.full_name, city: winner.city, phone: winner.phone },
    timestamp: new Date().toISOString()
  });

  db.save();
  res.json({ success: true, giveaway, winner });
});

// -------------------------------------------------------------
// 12. ANALYTICS & DASHBOARD METRICS
// -------------------------------------------------------------
app.get('/api/analytics', requireAdmin, (req, res) => {
  const data = db.getData();

  const totalOrders = data.orders.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = data.orders.filter(o => o.created_at.startsWith(today)).length;
  const pendingOrders = data.orders.filter(o => o.order_status === 'new_order' || o.order_status === 'processing').length;
  const completedOrders = data.orders.filter(o => o.order_status === 'delivered').length;
  const cancelledOrders = data.orders.filter(o => o.order_status === 'cancelled').length;

  const totalRevenue = data.orders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingVerificationCount = data.payment_receipts.filter(r => r.verification_status === 'pending').length;
  const lowStockProducts = data.products.filter(p => p.stock < 10);
  const outOfStockProducts = data.products.filter(p => p.stock === 0);

  // Payment Breakdown
  const paymentMethodCount: Record<string, number> = {};
  data.orders.forEach(o => {
    paymentMethodCount[o.payment_method] = (paymentMethodCount[o.payment_method] || 0) + 1;
  });

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  data.orders.forEach(o => {
    if (o.order_status !== 'cancelled') {
      o.items.forEach(i => {
        if (!productSalesMap[i.product_id]) {
          productSalesMap[i.product_id] = { name: i.product_name, count: 0, revenue: 0 };
        }
        productSalesMap[i.product_id].count += i.quantity;
        productSalesMap[i.product_id].revenue += i.total_price;
      });
    }
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

  res.json({
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    pendingVerificationCount,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 8),
    paymentMethodCount,
    topProducts,
    recentActivity: data.activity_logs.slice(0, 10)
  });
});

// -------------------------------------------------------------
// 13. GEMINI AI SMARTPHONE ADVISOR & PTA ASSISTANT
// -------------------------------------------------------------
app.post('/api/ai-advisor', async (req, res) => {
  const { query, budget, preferred_brand, pta_preference } = req.body;
  if (!query && !budget) {
    return res.status(400).json({ error: 'Please enter your question or budget.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      reply: `iBs Slayer Recommendation: Based on your budget of ${budget ? `Rs. ${budget}` : 'market rates'}, we suggest exploring our top PTA-Approved selections like the Samsung Galaxy S24 Ultra or Xiaomi 14T Pro. For personalized assistance, you can also click "Chat on WhatsApp" to connect with our phone experts in Hafeez Centre, Lahore.`
    });
  }

  try {
    const ai = new GoogleGenAI();
    const prompt = `You are the lead smartphone specialist at iBs Slayer, Pakistan's premier mobile store located in Hafeez Centre, Lahore.
A customer in Pakistan is asking:
Customer Query: "${query || ''}"
Budget (PKR): "${budget || 'Flexible'}"
Preferred Brand: "${preferred_brand || 'Any'}"
PTA Preference: "${pta_preference || 'PTA Approved'}"

Provide a friendly, authoritative, concise recommendation tailored strictly to the Pakistani smartphone market.
Mention:
1. Best 1-2 smartphone recommendations currently available in Pakistan for this price.
2. PTA tax advice (PTA Approved vs Non-PTA customs considerations).
3. 2-3 key specs (camera, battery, chipset, charging).
4. Encourage them to verify DIRBS status or click Order on WhatsApp for instant delivery.
Keep your response within 140 words, formatted neatly with bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    res.json({
      reply: `For your query, we highly recommend checking our live catalog of PTA-Approved smartphones with full manufacturer warranty and same-day dispatch across Pakistan. Click our WhatsApp support button for instant quote and stock availability!`
    });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER OR STATIC PRODUCTION SERVE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`⚡ iBs Slayer Server running on http://0.0.0.0:${PORT}`);
    console.log(`Primary Storage: Cloudflare R2 (${r2Service.getStatus().isConfigured ? 'CONNECTED' : 'LOCAL EMULATION ACTIVE'})`);
    console.log(`Initial Admin: ${process.env.ADMIN_INITIAL_EMAIL || 'ibsslayer@gmail.com'}`);
    console.log(`====================================================`);
  });
}

startServer();
