import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  CloudUpload,
  Settings,
  Gift,
  BarChart3,
  LogOut,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Download,
  Upload,
  AlertTriangle,
  Eye,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  Users,
  Check,
  RefreshCw,
  Folder,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Product, Order, BankAccount, PaymentReceipt, Giveaway, MediaAsset, R2StorageStatus } from '../types';

interface AdminDashboardPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, logout, token } = useAuth();
  const { settings, storageStatus, refreshSettings, refreshStorageStatus } = useSettings();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'storage' | 'payments' | 'giveaways' | 'settings' | 'analytics'
  >('overview');

  // Core Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Forms
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('Apple');
  const [pCategory, setPCategory] = useState('PTA-Approved Phones');
  const [pModel, setPModel] = useState('');
  const [pSku, setPSku] = useState('');
  const [pOriginalPrice, setPOriginalPrice] = useState(0);
  const [pSellingPrice, setPSellingPrice] = useState(0);
  const [pStock, setPStock] = useState(10);
  const [pRam, setPRam] = useState('8GB');
  const [pStorage, setPStorage] = useState('256GB');
  const [pColor, setPColor] = useState('Black');
  const [pCondition, setPCondition] = useState<'Brand new' | 'Box packed' | 'Used' | 'Refurbished'>('Brand new');
  const [pPtaStatus, setPPtaStatus] = useState<'PTA approved' | 'Non-PTA' | 'PTA status not applicable' | 'To be verified'>('PTA approved');
  const [pWarranty, setPWarranty] = useState('1 Year Official Warranty');
  const [pDescription, setPDescription] = useState('');
  const [pMainImageUrl, setPMainImageUrl] = useState('');

  // R2 Media Upload State
  const [uploadFolder, setUploadFolder] = useState('products');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [anRes, ordRes, prdRes, rcpRes, bnkRes, gwyRes, medRes] = await Promise.all([
        fetch('/api/analytics', { headers: authHeaders }).then(r => r.ok ? r.json() : null),
        fetch('/api/orders', { headers: authHeaders }).then(r => r.ok ? r.json() : []),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/receipts', { headers: authHeaders }).then(r => r.ok ? r.json() : []),
        fetch('/api/bank-accounts').then(r => r.json()),
        fetch('/api/giveaways').then(r => r.json()),
        fetch('/api/storage/files').then(r => r.json())
      ]);

      if (anRes) setAnalytics(anRes);
      setOrders(ordRes || []);
      setProducts(prdRes || []);
      setReceipts(rcpRes || []);
      setBankAccounts(bnkRes || []);
      setGiveaways(gwyRes || []);
      setMediaFiles(medRes || []);
      refreshStorageStatus();
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string, courierName?: string, trackingNo?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          order_status: status,
          courier_company: courierName,
          courier_tracking_number: trackingNo
        })
      });
      if (res.ok) {
        loadAllData();
        if (selectedOrder && selectedOrder.id === orderId) {
          const updated = await res.json();
          setSelectedOrder(updated.order);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Payment Receipt
  const handleVerifyReceipt = async (receiptId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const res = await fetch(`/api/receipts/${receiptId}/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ status, rejection_reason: reason })
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Product Save (Add / Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: pName,
      brand: pBrand,
      category: pCategory,
      model: pModel || pName,
      sku: pSku || `PKM-${Math.floor(10000 + Math.random() * 90000)}`,
      original_price: Number(pOriginalPrice),
      selling_price: Number(pSellingPrice),
      stock: Number(pStock),
      ram: pRam,
      storage: pStorage,
      color: pColor,
      condition: pCondition,
      pta_status: pPtaStatus,
      warranty: pWarranty,
      description: pDescription,
      main_image_url: pMainImageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800'
    };

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
      }
      setIsAddProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this smartphone from the database?')) return;
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust stock directly
  const handleStockAdjust = async (id: string, delta: number) => {
    try {
      await fetch(`/api/products/${id}/stock`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ adjustment: delta, reason: 'Quick admin adjustment' })
      });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Media Manager upload to Cloudflare R2
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadFolder);

    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadMessage(`✓ File uploaded successfully to ${data.result.provider === 'cloudflare_r2' ? 'Cloudflare R2' : 'Local Media'}: ${data.asset.file_name}`);
      loadAllData();
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message}`);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Save Website Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        refreshSettings();
        alert('Website settings & store branding updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Draw giveaway winner
  const handleDrawGiveaway = async (id: string) => {
    if (!window.confirm('Draw a transparent random winner from all registered Pakistani entries?')) return;
    try {
      const res = await fetch(`/api/giveaways/${id}/draw`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Winner drawn: ${data.winner.full_name} (${data.winner.city})!`);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 items-start">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-6 sticky top-24 shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
            P
          </div>
          <div>
            <div className="font-bold text-white text-sm font-['Outfit']">Admin Portal</div>
            <div className="text-[11px] text-emerald-400 font-semibold truncate max-w-[140px]">
              {user?.email || 'ibsslayer@gmail.com'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'orders'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Orders Management</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-950 text-white font-mono text-[10px]">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'products'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>Product & Inventory</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-950 text-white font-mono text-[10px]">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'storage'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CloudUpload className="w-4 h-4" />
              <span>Cloudflare R2 Media</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${storageStatus?.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'payments'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>Payments & Receipts</span>
            </span>
            {receipts.filter(r => r.verification_status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                {receipts.filter(r => r.verification_status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('giveaways')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'giveaways'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Gift className="w-4 h-4" />
              <span>Giveaways</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Store Branding</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" />
              <span>Reports & Audit</span>
            </span>
          </button>
        </nav>

        {/* Cloudflare R2 Status Card in Sidebar */}
        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between font-bold">
            <span className="text-zinc-300">Cloudflare R2:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              storageStatus?.isConfigured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {storageStatus?.isConfigured ? 'Connected' : 'Local Emulation'}
            </span>
          </div>
          <p className="text-zinc-500 text-[10px] leading-tight">
            {storageStatus?.isConfigured
              ? `Bucket: ${storageStatus.bucketName}`
              : 'Add R2_ACCESS_KEY_ID in .env for live Cloudflare R2 bucket.'}
          </p>
        </div>

        {/* Storefront & Logout */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <button
            onClick={() => onNavigate('home')}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Store</span>
          </button>
          <button
            onClick={() => {
              logout();
              onNavigate('admin-login');
            }}
            className="w-full py-2 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT CONTAINER */}
      <main className="flex-1 w-full space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW METRICS */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-1 shadow-lg">
                <span className="text-xs font-semibold text-zinc-400">Total Pakistani Sales</span>
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  Rs. {(analytics?.totalRevenue || 0).toLocaleString('en-PK')}
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">All fulfilled & active orders</div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-1 shadow-lg">
                <span className="text-xs font-semibold text-zinc-400">Total Orders Placed</span>
                <div className="text-2xl font-black text-white font-mono">
                  {analytics?.totalOrders || orders.length}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  Today: {analytics?.todayOrders || 0} new orders
                </div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-1 shadow-lg">
                <span className="text-xs font-semibold text-zinc-400">Pending Orders</span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {analytics?.pendingOrders || 0}
                </div>
                <div className="text-[11px] text-zinc-400">Awaiting packing or dispatch</div>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-1 shadow-lg">
                <span className="text-xs font-semibold text-zinc-400">Pending Receipts</span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {analytics?.pendingVerificationCount || receipts.filter(r => r.verification_status === 'pending').length}
                </div>
                <div className="text-[11px] text-rose-400/80">JazzCash / Bank transfers</div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="font-bold text-white text-base font-['Outfit']">
                  Recent Customer Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5">Order #</th>
                      <th className="py-2.5">Customer & City</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 font-mono font-bold text-white">{order.order_number}</td>
                        <td className="py-3">
                          <div className="font-bold text-zinc-200">{order.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">{order.city} • {order.customer_phone}</div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-semibold uppercase text-zinc-300">
                            {order.payment_method.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          Rs. {order.total_amount.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold uppercase">
                            {order.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActiveTab('orders');
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {analytics?.lowStockProducts?.length > 0 && (
              <div className="p-6 bg-amber-950/20 border border-amber-900/60 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Low Inventory Alerts (&lt; 10 Units in Stock)</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {analytics.lowStockProducts.map((p: Product) => (
                    <div key={p.id} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <div className="font-bold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">Stock: <strong className="text-amber-400">{p.stock}</strong> left</div>
                      </div>
                      <button
                        onClick={() => handleStockAdjust(p.id, 10)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-[11px] rounded-lg"
                      >
                        +10 Restock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white font-['Outfit']">
                  Order Management ({orders.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Update statuses, confirm bank payments, record courier tracking, and print invoices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAllData}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5">Order #</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Items</th>
                      <th className="py-2.5">Total (PKR)</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5">Order Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 font-mono font-bold text-white">{order.order_number}</td>
                        <td className="py-3.5 text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'short' })}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-zinc-200">{order.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">{order.city} • {order.customer_phone}</div>
                        </td>
                        <td className="py-3.5 font-semibold text-zinc-300">
                          {order.items?.length || 0} phone(s)
                        </td>
                        <td className="py-3.5 font-mono font-bold text-emerald-400">
                          Rs. {order.total_amount.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-semibold uppercase text-zinc-300">
                              {order.payment_method.replace(/_/g, ' ')}
                            </span>
                            <div>
                              <span className={`text-[10px] font-bold ${
                                order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {order.payment_status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <select
                            value={order.order_status}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-700 rounded-lg p-1.5 text-xs text-white font-semibold"
                          >
                            <option value="new_order">New Order</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing / Packing</option>
                            <option value="dispatched">Dispatched to Courier</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                          </select>
                        </td>
                        <td className="py-3.5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Order Detail Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-xs text-zinc-400 font-semibold">Order Details</span>
                      <h3 className="text-xl font-bold text-white font-mono">{selectedOrder.order_number}</h3>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-zinc-400 hover:text-white">
                      ✕
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase text-[10px]">Customer Info</div>
                      <div className="font-bold text-white">{selectedOrder.customer_name}</div>
                      <div className="text-zinc-300 font-mono">{selectedOrder.customer_phone}</div>
                      {selectedOrder.customer_whatsapp && (
                        <div className="text-emerald-400">WhatsApp: {selectedOrder.customer_whatsapp}</div>
                      )}
                    </div>

                    <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                      <div className="text-zinc-500 font-semibold uppercase text-[10px]">Delivery Address</div>
                      <div className="text-zinc-200">{selectedOrder.shipping_address}</div>
                      <div className="text-zinc-400 font-bold">{selectedOrder.city}, {selectedOrder.province}</div>
                    </div>
                  </div>

                  {/* Courier tracking update */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 text-xs">
                    <div className="font-bold text-white">Courier Tracking Info:</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 mb-1">Courier Partner:</label>
                        <input
                          type="text"
                          defaultValue={selectedOrder.courier_company || 'TCS Express'}
                          id={`courier-${selectedOrder.id}`}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">AWB Tracking #:</label>
                        <input
                          type="text"
                          defaultValue={selectedOrder.courier_tracking_number || ''}
                          id={`tracking-${selectedOrder.id}`}
                          placeholder="e.g. TCS-PK-9812739"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const c = (document.getElementById(`courier-${selectedOrder.id}`) as HTMLInputElement)?.value;
                        const t = (document.getElementById(`tracking-${selectedOrder.id}`) as HTMLInputElement)?.value;
                        handleUpdateOrderStatus(selectedOrder.id, selectedOrder.order_status, c, t);
                        alert('Courier tracking updated!');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs"
                    >
                      Save Courier Tracking
                    </button>
                  </div>

                  {/* Ordered Items */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-white">Items in Order:</div>
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="p-3 bg-zinc-950 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={item.image_url} alt={item.product_name} className="w-10 h-10 object-contain rounded" />
                          <div>
                            <div className="font-bold text-white">{item.product_name}</div>
                            <div className="text-[11px] text-zinc-400">{item.pta_status} • Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400">
                          Rs. {item.total_price.toLocaleString('en-PK')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-bold text-sm">
                    <span className="text-zinc-400">Total Payable:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      Rs. {selectedOrder.total_amount.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRODUCT MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white font-['Outfit']">
                  Product & Stock Management ({products.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Manage smartphone catalogue, PTA status, prices in PKR, and inventory movements.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/products/export-csv"
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setPName('');
                    setPBrand('Apple');
                    setPCategory('PTA-Approved Phones');
                    setPModel('');
                    setPSku('');
                    setPOriginalPrice(150000);
                    setPSellingPrice(140000);
                    setPStock(15);
                    setPRam('8GB');
                    setPStorage('256GB');
                    setPColor('Black');
                    setPCondition('Brand new');
                    setPPtaStatus('PTA approved');
                    setPWarranty('1 Year Official Warranty');
                    setPDescription('');
                    setPMainImageUrl('');
                    setIsAddProductModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Smartphone</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5">Device</th>
                      <th className="py-2.5">Brand</th>
                      <th className="py-2.5">PTA Status</th>
                      <th className="py-2.5">Condition</th>
                      <th className="py-2.5">Selling Price</th>
                      <th className="py-2.5">Stock</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.main_image_url} alt={p.name} className="w-10 h-10 object-contain rounded bg-zinc-950 p-1 flex-shrink-0" />
                            <div className="truncate max-w-[200px]">
                              <div className="font-bold text-white truncate">{p.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-zinc-300">{p.brand}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.pta_status === 'PTA approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {p.pta_status}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400">{p.condition}</td>
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          Rs. {p.selling_price.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStockAdjust(p.id, -1)}
                              className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-white px-1">{p.stock}</span>
                            <button
                              onClick={() => handleStockAdjust(p.id, 1)}
                              className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setPName(p.name);
                              setPBrand(p.brand);
                              setPCategory(p.category);
                              setPModel(p.model);
                              setPSku(p.sku);
                              setPOriginalPrice(p.original_price);
                              setPSellingPrice(p.selling_price);
                              setPStock(p.stock);
                              setPRam(p.ram || '8GB');
                              setPStorage(p.storage || '256GB');
                              setPColor(p.color || 'Black');
                              setPCondition(p.condition);
                              setPPtaStatus(p.pta_status);
                              setPWarranty(p.warranty);
                              setPDescription(p.description);
                              setPMainImageUrl(p.main_image_url);
                              setIsAddProductModalOpen(true);
                            }}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-400 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add / Edit Product Modal */}
            {isAddProductModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <h3 className="text-xl font-bold text-white font-['Outfit']">
                      {editingProduct ? 'Edit Smartphone' : 'Add New Smartphone'}
                    </h3>
                    <button onClick={() => setIsAddProductModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Product Title:</label>
                      <input
                        type="text"
                        value={pName}
                        onChange={e => setPName(e.target.value)}
                        placeholder="e.g. Apple iPhone 16 Pro Max 256GB"
                        required
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Brand:</label>
                        <input
                          type="text"
                          value={pBrand}
                          onChange={e => setPBrand(e.target.value)}
                          placeholder="Apple, Samsung, etc."
                          required
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Category:</label>
                        <input
                          type="text"
                          value={pCategory}
                          onChange={e => setPCategory(e.target.value)}
                          placeholder="PTA-Approved Phones"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">SKU:</label>
                        <input
                          type="text"
                          value={pSku}
                          onChange={e => setPSku(e.target.value)}
                          placeholder="APL-16PM-256"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Original Price (PKR):</label>
                        <input
                          type="number"
                          value={pOriginalPrice}
                          onChange={e => setPOriginalPrice(Number(e.target.value))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Selling Price (PKR):</label>
                        <input
                          type="number"
                          value={pSellingPrice}
                          onChange={e => setPSellingPrice(Number(e.target.value))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Stock Units:</label>
                        <input
                          type="number"
                          value={pStock}
                          onChange={e => setPStock(Number(e.target.value))}
                          required
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">RAM:</label>
                        <input
                          type="text"
                          value={pRam}
                          onChange={e => setPRam(e.target.value)}
                          placeholder="8GB / 12GB"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Storage:</label>
                        <input
                          type="text"
                          value={pStorage}
                          onChange={e => setPStorage(e.target.value)}
                          placeholder="256GB"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Color:</label>
                        <input
                          type="text"
                          value={pColor}
                          onChange={e => setPColor(e.target.value)}
                          placeholder="Titanium"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">PTA Status:</label>
                        <select
                          value={pPtaStatus}
                          onChange={e => setPPtaStatus(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                        >
                          <option value="PTA approved">PTA approved</option>
                          <option value="Non-PTA">Non-PTA</option>
                          <option value="PTA status not applicable">PTA status not applicable</option>
                          <option value="To be verified">To be verified</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Main Image URL (or upload to R2):</label>
                      <input
                        type="url"
                        value={pMainImageUrl}
                        onChange={e => setPMainImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Description:</label>
                      <textarea
                        value={pDescription}
                        onChange={e => setPDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition"
                    >
                      Save Smartphone Record
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CLOUDFLARE R2 VISUAL MEDIA STORAGE */}
        {/* ======================================================== */}
        {activeTab === 'storage' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white font-['Outfit']">
                  Cloudflare R2 Object Storage Manager
                </h2>
                <p className="text-xs text-zinc-400">
                  Primary object storage provider for product photos, store logos, banners, and private payment receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAllData}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Storage</span>
                </button>
              </div>
            </div>

            {/* R2 Configuration Banner */}
            <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              storageStatus?.isConfigured
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CloudUpload className="w-5 h-5 text-emerald-400" />
                  <span>{storageStatus?.statusMessage}</span>
                </div>
                {!storageStatus?.isConfigured && (
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    To connect to live Cloudflare R2 bucket: specify <code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, and <code>R2_BUCKET_NAME</code> in your environment variables. The built-in storage service currently emulates storage locally.
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  storageStatus?.isConfigured
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-amber-500 text-zinc-950'
                }`}>
                  {storageStatus?.isConfigured ? 'R2 ACTIVE' : 'LOCAL EMULATION'}
                </span>
                <div className="text-[11px] text-zinc-400 font-mono mt-1">
                  Files: {storageStatus?.totalFiles || mediaFiles.length} ({storageStatus?.totalFormattedSize || '0 MB'})
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload Component */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
                <span className="font-bold text-white text-sm">Upload New Media Asset to Cloudflare R2</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Target Folder:</span>
                  <select
                    value={uploadFolder}
                    onChange={e => setUploadFolder(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl p-1.5 text-white"
                  >
                    <option value="products">products/</option>
                    <option value="product-gallery">product-gallery/</option>
                    <option value="logos">logos/</option>
                    <option value="banners">banners/</option>
                    <option value="brands">brands/</option>
                    <option value="promotions">promotions/</option>
                    <option value="giveaways">giveaways/</option>
                  </select>
                </div>
              </div>

              {uploadMessage && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 text-xs font-semibold">
                  {uploadMessage}
                </div>
              )}

              <div className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-8 text-center bg-zinc-950/60 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="admin-media-file-input"
                />
                <label htmlFor="admin-media-file-input" className="cursor-pointer space-y-2 block">
                  <CloudUpload className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-white">
                    {isUploadingMedia ? 'Uploading & Processing in Cloudflare R2...' : 'Click to Browse or Drag & Drop Smartphone Images'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Supports JPG, PNG, WebP, SVG (Max 15MB) • Stored under <code>{uploadFolder}/</code>
                  </div>
                </label>
              </div>
            </div>

            {/* Media Files Grid */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                Stored Media Assets ({mediaFiles.length})
              </h3>

              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {mediaFiles.map(file => (
                    <div
                      key={file.id}
                      className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 group relative"
                    >
                      <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center p-2">
                        <img src={file.url} alt={file.file_name} className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="font-bold text-white truncate" title={file.file_name}>{file.file_name}</div>
                        <div className="text-zinc-500 font-mono text-[10px]">
                          {file.folder} • {(file.file_size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                      {/* Set as logo shortcut */}
                      <button
                        onClick={async () => {
                          await fetch('/api/settings', {
                            method: 'PUT',
                            headers: authHeaders,
                            body: JSON.stringify({ store_logo_url: file.url, store_logo_key: file.r2_key })
                          });
                          refreshSettings();
                          alert('Store logo updated from Cloudflare R2 asset!');
                        }}
                        className="w-full py-1 bg-zinc-800 hover:bg-emerald-600 hover:text-zinc-950 text-zinc-300 text-[10px] font-bold rounded-lg transition"
                      >
                        Set as Logo
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No uploaded media files yet. Upload phone images or banners using the drag-and-drop tool above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PAYMENTS & RECEIPTS VERIFICATION */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">
                Payments & Receipt Verification Desk
              </h2>
              <p className="text-xs text-zinc-400">
                Audit and approve JazzCash, Easypaisa, and Pakistani bank transfer screenshots stored in R2.
              </p>
            </div>

            {/* Pending Receipts Queue */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center justify-between">
                <span>Receipts Verification Queue ({receipts.length})</span>
              </h3>

              {receipts.length > 0 ? (
                <div className="space-y-3">
                  {receipts.map(rcp => (
                    <div
                      key={rcp.id}
                      className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <a
                          href={rcp.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 group"
                        >
                          <img src={rcp.file_url} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition" />
                        </a>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">{rcp.order_number}</span>
                            <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] uppercase font-bold text-zinc-300">
                              {rcp.payment_method.replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rcp.verification_status === 'approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : rcp.verification_status === 'rejected'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {rcp.verification_status}
                            </span>
                          </div>
                          <div className="text-zinc-300">Customer: <strong>{rcp.customer_name}</strong> ({rcp.customer_phone})</div>
                          {rcp.transaction_reference && (
                            <div className="text-emerald-400 font-mono">TID / Ref: {rcp.transaction_reference}</div>
                          )}
                          {rcp.notes && <div className="text-zinc-400 italic">"{rcp.notes}"</div>}
                        </div>
                      </div>

                      {/* Verification buttons */}
                      {rcp.verification_status === 'pending' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleVerifyReceipt(rcp.id, 'approved')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve Payment</span>
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('Enter rejection reason for customer (e.g. Invalid screenshot):');
                              if (reason) handleVerifyReceipt(rcp.id, 'rejected', reason);
                            }}
                            className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500">
                          Verified: {rcp.verified_at ? new Date(rcp.verified_at).toLocaleDateString('en-PK') : 'Done'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No payment receipts submitted yet.
                </div>
              )}
            </div>

            {/* Bank Accounts List */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                Configured Pakistani Bank Accounts ({bankAccounts.length})
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                {bankAccounts.map(b => (
                  <div key={b.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="font-bold text-white text-sm">{b.bank_name}</div>
                    <div className="text-zinc-400">Title: <strong>{b.account_title}</strong></div>
                    <div className="font-mono text-zinc-200">A/C: {b.account_number}</div>
                    <div className="font-mono text-emerald-400 text-[11px] truncate">IBAN: {b.iban}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: GIVEAWAYS MANAGER */}
        {/* ======================================================== */}
        {activeTab === 'giveaways' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">
                Smartphone Giveaways Manager
              </h2>
              <p className="text-xs text-zinc-400">
                Audit entries, view registered phone numbers, and draw transparent random winners.
              </p>
            </div>

            <div className="space-y-4">
              {giveaways.map(g => (
                <div key={g.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold uppercase">{g.is_closed ? 'Closed Campaign' : 'Active Campaign'}</span>
                      <h3 className="text-lg font-bold text-white font-['Outfit']">{g.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-white bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                        {g.total_entries} Total Entries
                      </span>
                      {!g.is_closed && (
                        <button
                          onClick={() => handleDrawGiveaway(g.id)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition"
                        >
                          🎲 Conduct Random Winner Draw
                        </button>
                      )}
                    </div>
                  </div>

                  {g.winner_name && (
                    <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-xs space-y-1">
                      <div className="font-bold text-amber-300">Announced Winner:</div>
                      <div className="text-white font-bold text-sm">🏆 {g.winner_name} ({g.winner_city})</div>
                      <div className="text-zinc-400">Drawn on: {new Date(g.winner_announced_at!).toLocaleString('en-PK')}</div>
                    </div>
                  )}

                  {/* Entries sample */}
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-zinc-400">Recent Registered Entries:</div>
                    <div className="divide-y divide-zinc-800 max-h-48 overflow-y-auto">
                      {g.entries?.map(e => (
                        <div key={e.id} className="py-2 flex items-center justify-between text-zinc-300">
                          <div>
                            <span className="font-bold text-white">{e.full_name}</span>
                            <span className="text-zinc-500 ml-2 font-mono">{e.phone}</span>
                          </div>
                          <span className="text-emerald-400 font-semibold">{e.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: STORE BRANDING & SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">
                Store Branding & Contact Configuration
              </h2>
              <p className="text-xs text-zinc-400">
                Edit store identity, upload logos to Cloudflare R2, configure WhatsApp hotlines, and edit policies.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-xl text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Store Name:</label>
                  <input
                    type="text"
                    value={settingsForm.store_name}
                    onChange={e => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Official WhatsApp Number:</label>
                  <input
                    type="tel"
                    value={settingsForm.whatsapp_number}
                    onChange={e => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Store Calling Phone:</label>
                  <input
                    type="tel"
                    value={settingsForm.contact_number}
                    onChange={e => setSettingsForm({ ...settingsForm, contact_number: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Support Email:</label>
                  <input
                    type="email"
                    value={settingsForm.support_email}
                    onChange={e => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Top Announcement Bar Text:</label>
                <input
                  type="text"
                  value={settingsForm.announcement_bar}
                  onChange={e => setSettingsForm({ ...settingsForm, announcement_bar: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Physical Store Address (Pakistan):</label>
                <input
                  type="text"
                  value={settingsForm.business_address}
                  onChange={e => setSettingsForm({ ...settingsForm, business_address: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Free Shipping Threshold (PKR):</label>
                  <input
                    type="number"
                    value={settingsForm.free_shipping_threshold}
                    onChange={e => setSettingsForm({ ...settingsForm, free_shipping_threshold: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Standard Courier Rate (PKR):</label>
                  <input
                    type="number"
                    value={settingsForm.standard_shipping_rate}
                    onChange={e => setSettingsForm({ ...settingsForm, standard_shipping_rate: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95"
              >
                Save Live Branding & Settings
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: AUDIT & REPORTS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">
                Reports & Administrative Audit Logs
              </h2>
              <p className="text-xs text-zinc-400">
                Action logging, rate tracking, and payment method statistics.
              </p>
            </div>

            {/* Payment Method Distribution */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                Orders by Payment Method
              </h3>
              <div className="grid sm:grid-cols-4 gap-3 text-xs">
                {Object.entries(analytics?.paymentMethodCount || {}).map(([method, count]) => (
                  <div key={method} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                      {method.replace(/_/g, ' ')}
                    </span>
                    <div className="text-xl font-black text-white font-mono">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                System Audit Trail (Security & Operations)
              </h3>
              <div className="divide-y divide-zinc-800 text-xs">
                {analytics?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-white">{act.action}</div>
                      <div className="text-[11px] text-zinc-500">
                        Admin: {act.admin_email} • {JSON.stringify(act.details)}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
