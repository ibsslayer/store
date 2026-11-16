import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCw,
  Download,
  Menu,
  X,
  Smartphone,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { apiFetch } from '../lib/staticFallback';
import { Product, Order, BankAccount, PaymentReceipt, Giveaway, MediaAsset } from '../types';

interface AdminDashboardPageProps {
  onNavigate: (page: string, param?: string) => void;
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'storage'
  | 'payments'
  | 'giveaways'
  | 'settings'
  | 'analytics';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, logout, token } = useAuth();
  const { settings, storageStatus, refreshSettings, refreshStorageStatus } = useSettings();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Toast & inline confirmation states (no window.alert / window.confirm / window.prompt)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [confirmDrawGiveawayId, setConfirmDrawGiveawayId] = useState<string | null>(null);
  const [rejectingReceiptId, setRejectingReceiptId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Core Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaAsset[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productPtaFilter, setProductPtaFilter] = useState('all');

  // Modals & Selected Order Courier Form
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierInput, setCourierInput] = useState('TCS Express');
  const [trackingInput, setTrackingInput] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

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
  const [pPtaStatus, setPPtaStatus] = useState<
    'PTA approved' | 'Non-PTA' | 'PTA status not applicable' | 'To be verified'
  >('PTA approved');
  const [pWarranty, setPWarranty] = useState('1 Year Official Warranty');
  const [pDescription, setPDescription] = useState('');
  const [pMainImageUrl, setPMainImageUrl] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Backblaze B2 Media Upload State
  const [uploadFolder, setUploadFolder] = useState('products');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (selectedOrder) {
      setCourierInput(selectedOrder.courier_company || 'TCS Express');
      setTrackingInput(selectedOrder.courier_tracking_number || '');
    }
  }, [selectedOrder]);

  // Body scroll lock & Escape key handling for mobile drawer + modals
  useEffect(() => {
    const hasOverlay =
      mobileDrawerOpen || Boolean(selectedOrder) || isAddProductModalOpen || Boolean(confirmDeleteProduct);
    if (!hasOverlay) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteProduct) setConfirmDeleteProduct(null);
        else if (isAddProductModalOpen) setIsAddProductModalOpen(false);
        else if (selectedOrder) setSelectedOrder(null);
        else if (mobileDrawerOpen) setMobileDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileDrawerOpen, selectedOrder, isAddProductModalOpen, confirmDeleteProduct]);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const loadAllData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [anRes, ordRes, prdRes, rcpRes, bnkRes, gwyRes, medRes, hltRes] = await Promise.all([
        apiFetch('/api/analytics', { headers: authHeaders }).then(r => (r.ok ? r.json() : null)),
        apiFetch('/api/orders', { headers: authHeaders }).then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/products').then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/receipts', { headers: authHeaders }).then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/bank-accounts').then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/giveaways').then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/storage/files').then(r => (r.ok ? r.json() : [])),
        apiFetch('/api/health').then(r => (r.ok ? r.json() : null))
      ]);

      if (anRes) setAnalytics(anRes);
      if (hltRes) setHealthInfo(hltRes);
      setOrders(ordRes || []);
      setProducts(prdRes || []);
      setReceipts(rcpRes || []);
      setBankAccounts(bnkRes || []);
      setGiveaways(gwyRes || []);
      setMediaFiles(medRes || []);
      refreshStorageStatus();
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('error', 'Failed to refresh admin data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await apiFetch('/api/products/export-csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'CSV export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'ibsslayer-products.csv';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showToast('success', 'Products CSV exported.');
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to export products CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_phone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q);
      const matchesStatus = orderStatusFilter === 'all' || order.order_status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = productSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchesPta = productPtaFilter === 'all' || p.pta_status === productPtaFilter;
      return matchesSearch && matchesPta;
    });
  }, [products, productSearch, productPtaFilter]);

  const pendingReceiptsCount = receipts.filter(r => r.verification_status === 'pending').length;

  const navItems: {
    id: AdminTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    dot?: boolean;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      shortLabel: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'orders',
      label: 'Orders Management',
      shortLabel: 'Orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: orders.length,
      badgeColor: 'bg-zinc-950 text-white'
    },
    {
      id: 'products',
      label: 'Product & Inventory',
      shortLabel: 'Products',
      icon: <Package className="w-4 h-4" />,
      badge: products.length,
      badgeColor: 'bg-zinc-950 text-white'
    },
    {
      id: 'storage',
      label: 'Backblaze B2 Media',
      shortLabel: 'B2 Media',
      icon: <CloudUpload className="w-4 h-4" />,
      dot: true
    },
    {
      id: 'payments',
      label: 'Payments & Receipts',
      shortLabel: 'Receipts',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingReceiptsCount > 0 ? pendingReceiptsCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'giveaways',
      label: 'Giveaways',
      shortLabel: 'Giveaways',
      icon: <Gift className="w-4 h-4" />
    },
    {
      id: 'settings',
      label: 'Store Branding',
      shortLabel: 'Branding',
      icon: <Settings className="w-4 h-4" />
    },
    {
      id: 'analytics',
      label: 'Reports & Audit',
      shortLabel: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />
    }
  ];

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: string,
    courierName?: string,
    trackingNo?: string,
    toastText?: string
  ) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          order_status: status,
          courier_company: courierName,
          courier_tracking_number: trackingNo
        })
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated.order);
        }
        await loadAllData();
        showToast('success', toastText || `Order updated to ${status.replace(/_/g, ' ')}.`);
      } else {
        showToast('error', 'Could not update order status.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error updating order.');
    }
  };

  // Verify Payment Receipt
  const handleVerifyReceipt = async (receiptId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const res = await apiFetch(`/api/receipts/${receiptId}/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ status, rejection_reason: reason })
      });
      if (res.ok) {
        setRejectingReceiptId(null);
        setRejectionReason('');
        await loadAllData();
        showToast('success', status === 'approved' ? 'Payment receipt approved!' : 'Payment receipt rejected.');
      } else {
        showToast('error', 'Failed to update receipt status.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error verifying receipt.');
    }
  };

  const openAddProductModal = () => {
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
  };

  const openEditProductModal = (p: Product) => {
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
  };

  // Handle Product Save (Add / Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
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
      const res = editingProduct
        ? await apiFetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(payload)
          })
        : await apiFetch('/api/products', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload)
          });

      if (res.ok) {
        setIsAddProductModalOpen(false);
        setEditingProduct(null);
        await loadAllData();
        showToast('success', editingProduct ? 'Smartphone updated!' : 'New smartphone added!');
      } else {
        showToast('error', 'Could not save smartphone record.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving smartphone.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete product (called from inline confirm modal)
  const handleConfirmDeleteProduct = async () => {
    if (!confirmDeleteProduct) return;
    const target = confirmDeleteProduct;
    setConfirmDeleteProduct(null);
    try {
      const res = await apiFetch(`/api/products/${target.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await loadAllData();
        showToast('success', `${target.name} deleted from inventory.`);
      } else {
        showToast('error', 'Failed to delete smartphone.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error deleting smartphone.');
    }
  };

  // Adjust stock directly
  const handleStockAdjust = async (id: string, delta: number) => {
    try {
      const res = await apiFetch(`/api/products/${id}/stock`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ adjustment: delta, reason: 'Quick admin adjustment' })
      });
      if (res.ok) {
        await loadAllData();
        showToast('success', `Inventory adjusted (${delta > 0 ? `+${delta}` : delta}).`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to adjust stock.');
    }
  };

  // Media Manager upload to Backblaze B2
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadFolder);

    try {
      const res = await apiFetch('/api/storage/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const providerLabel =
        data.result.provider === 'backblaze_b2'
          ? 'Backblaze B2'
          : data.result.provider === 'cloudflare_r2'
          ? 'Cloudflare R2'
          : 'Local Media';

      setUploadMessage(`Uploaded successfully to ${providerLabel}: ${data.asset.file_name}`);
      showToast('success', `Uploaded ${data.asset.file_name} to ${providerLabel}.`);
      loadAllData();
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message}`);
      showToast('error', err.message || 'Upload failed');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Save Website Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        refreshSettings();
        showToast('success', 'Store branding & settings updated!');
      } else {
        showToast('error', 'Could not save settings.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Draw giveaway winner
  const handleDrawGiveaway = async (id: string) => {
    try {
      const res = await apiFetch(`/api/giveaways/${id}/draw`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmDrawGiveawayId(null);
        await loadAllData();
        showToast('success', `Winner drawn: ${data.winner.full_name} (${data.winner.city})!`);
      } else {
        showToast('error', data.error || 'Could not draw winner.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error drawing giveaway winner.');
    }
  };

  const renderSidebarContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black flex-shrink-0">
            iB
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm font-['Outfit'] truncate">Admin Portal</div>
            <div className="text-[11px] text-emerald-400 font-semibold truncate">
              {user?.email || 'ibsslayer@gmail.com'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(false)}
          className="lg:hidden w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center flex-shrink-0"
          aria-label="Close Admin Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="space-y-1 text-xs font-semibold">
        {navItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectTab(item.id)}
            className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
              activeTab === item.id
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
            {typeof item.badge === 'number' && (
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] flex-shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
            {item.dot && (
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  storageStatus?.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Backblaze B2 & Supabase Status Card */}
      <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-[11px] space-y-2">
        <div className="flex items-center justify-between gap-2 font-bold">
          <span className="text-zinc-300">Backblaze B2:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              storageStatus?.isConfigured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {storageStatus?.isConfigured ? 'Connected' : 'Local Mode'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 font-bold">
          <span className="text-zinc-300">Supabase DB:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              healthInfo?.supabase?.connected
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {healthInfo?.supabase?.connected ? 'Synced' : 'Local Mode'}
          </span>
        </div>
        <p className="text-zinc-500 text-[10px] leading-tight break-words">
          {storageStatus?.isConfigured
            ? `Bucket: ${storageStatus.bucketName}`
            : 'Local fallback active; set SUPABASE_* & B2_* env vars for cloud sync.'}
        </p>
      </div>

      {/* Storefront & Logout */}
      <div className="pt-2 border-t border-zinc-800 space-y-2">
        <button
          type="button"
          onClick={() => {
            setMobileDrawerOpen(false);
            onNavigate('home');
          }}
          className="w-full min-h-[42px] py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Customer Store</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileDrawerOpen(false);
            logout();
            onNavigate('admin-login');
          }}
          className="w-full min-h-[42px] py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const activeNavTitle = navItems.find(n => n.id === activeTab)?.label || 'Admin Portal';

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 pb-20 items-start relative">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[70] p-3.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="break-words">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-zinc-300 hover:text-white flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MOBILE TOP ADMIN BAR + QUICK TAB PILLS (< lg) */}
      <div className="w-full lg:hidden space-y-2.5">
        <div className="bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center flex-shrink-0"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                iBs Slayer Admin
              </div>
              <div className="text-sm font-black text-white truncate font-['Outfit']">
                {activeNavTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={loadAllData}
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center"
              title="Refresh Data"
              aria-label="Refresh Admin Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"
              title="Open Storefront"
              aria-label="Open Customer Store"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Mobile Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 border transition ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {item.icon}
              <span>{item.shortLabel}</span>
              {typeof item.badge === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === item.id ? 'bg-zinc-950/80 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER (< lg) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/75 backdrop-blur-sm flex"
          onClick={e => {
            if (e.target === e.currentTarget) setMobileDrawerOpen(false);
          }}
        >
          <aside className="w-[86vw] max-w-[300px] h-full bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (lg+) */}
      <aside className="hidden lg:block w-64 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sticky top-24 shadow-2xl flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* MAIN ADMIN CONTENT CONTAINER */}
      <main className="flex-1 w-full min-w-0 space-y-5 sm:space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW METRICS */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3.5 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-1 shadow-lg">
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block">
                  Total Pakistani Sales
                </span>
                <div className="text-base min-[375px]:text-lg sm:text-2xl font-black text-emerald-400 font-mono tracking-tight tabular-nums break-words">
                  Rs. {(analytics?.totalRevenue || 0).toLocaleString('en-PK')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-medium">
                  Fulfilled & active orders
                </div>
              </div>

              <div className="p-3.5 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-1 shadow-lg">
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block">
                  Total Orders Placed
                </span>
                <div className="text-lg sm:text-2xl font-black text-white font-mono tabular-nums">
                  {analytics?.totalOrders || orders.length}
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold">
                  Today: {analytics?.todayOrders || 0} new
                </div>
              </div>

              <div className="p-3.5 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-1 shadow-lg">
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block">
                  Pending Orders
                </span>
                <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono tabular-nums">
                  {analytics?.pendingOrders || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-400">Awaiting packing</div>
              </div>

              <div className="p-3.5 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-1 shadow-lg">
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block">
                  Pending Receipts
                </span>
                <div className="text-lg sm:text-2xl font-black text-rose-400 font-mono tabular-nums">
                  {analytics?.pendingVerificationCount ?? pendingReceiptsCount}
                </div>
                <div className="text-[10px] sm:text-[11px] text-rose-400/80">JazzCash / Bank</div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                  Recent Customer Orders
                </h3>
                <button
                  type="button"
                  onClick={() => handleSelectTab('orders')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex-shrink-0"
                >
                  View All →
                </button>
              </div>

              {/* Mobile Recent Orders Cards */}
              <div className="md:hidden space-y-2.5">
                {orders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-white">{order.order_number}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold uppercase">
                        {order.order_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-zinc-300 font-semibold">{order.customer_name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {order.city} • {order.customer_phone}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                      <div className="font-mono font-bold text-emerald-400 tabular-nums">
                        Rs. {order.total_amount.toLocaleString('en-PK')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setActiveTab('orders');
                        }}
                        className="min-h-[38px] px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="py-6 text-center text-xs text-zinc-500">No orders placed yet.</div>
                )}
              </div>

              {/* Desktop Recent Orders Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5 pr-3">Order #</th>
                      <th className="py-2.5 pr-3">Customer & City</th>
                      <th className="py-2.5 pr-3">Payment</th>
                      <th className="py-2.5 pr-3">Amount</th>
                      <th className="py-2.5 pr-3">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 pr-3 font-mono font-bold text-white">{order.order_number}</td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-zinc-200">{order.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">
                            {order.city} • {order.customer_phone}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-semibold uppercase text-zinc-300">
                            {order.payment_method.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-mono font-bold text-emerald-400 tabular-nums">
                          Rs. {order.total_amount.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3 pr-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold uppercase">
                            {order.order_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setActiveTab('orders');
                            }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
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
              <div className="p-4 sm:p-6 bg-amber-950/20 border border-amber-900/60 rounded-2xl sm:rounded-3xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Low Inventory Alerts (&lt; 10 Units in Stock)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  {analytics.lowStockProducts.map((p: Product) => (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{p.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Stock: <strong className="text-amber-400">{p.stock}</strong> left
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(p.id, 10)}
                        className="min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-[11px] rounded-xl flex-shrink-0"
                      >
                        +10
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
          <div className="space-y-4 sm:space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Order Management ({filteredOrders.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Update statuses, confirm payments, and save courier tracking numbers.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAllData}
                className="min-h-[42px] px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Mobile + Desktop Order Search & Status Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer name, phone or city..."
                  className="w-full min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="w-full min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Order Statuses</option>
                <option value="new_order">New Order</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing / Packing</option>
                <option value="dispatched">Dispatched to Courier</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Orders List */}
            <div className="p-3.5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              {/* Mobile Order Cards (< md) */}
              <div className="md:hidden space-y-3">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-white text-sm">{order.order_number}</div>
                        <div className="text-[11px] text-zinc-500">
                          {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400 text-sm tabular-nums">
                          Rs. {order.total_amount.toLocaleString('en-PK')}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-zinc-400">
                          {order.items?.length || 0} item(s)
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 space-y-1">
                      <div className="font-bold text-zinc-100">{order.customer_name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {order.city} • <span className="font-mono">{order.customer_phone}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-semibold uppercase text-zinc-300">
                          {order.payment_method.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <select
                        value={order.order_status}
                        onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="w-full min-h-[42px] bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                        aria-label={`Status for ${order.order_number}`}
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

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="w-full min-h-[42px] px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Manage Order & Courier Tracking
                      </button>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    No matching orders found.
                  </div>
                )}
              </div>

              {/* Desktop Orders Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5 pr-3">Order #</th>
                      <th className="py-2.5 pr-3">Date</th>
                      <th className="py-2.5 pr-3">Customer</th>
                      <th className="py-2.5 pr-3">Items</th>
                      <th className="py-2.5 pr-3">Total (PKR)</th>
                      <th className="py-2.5 pr-3">Payment</th>
                      <th className="py-2.5 pr-3">Order Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 pr-3 font-mono font-bold text-white">{order.order_number}</td>
                        <td className="py-3.5 pr-3 text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'short' })}
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="font-bold text-zinc-200">{order.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">
                            {order.city} • {order.customer_phone}
                          </div>
                        </td>
                        <td className="py-3.5 pr-3 font-semibold text-zinc-300">
                          {order.items?.length || 0} phone(s)
                        </td>
                        <td className="py-3.5 pr-3 font-mono font-bold text-emerald-400 tabular-nums">
                          Rs. {order.total_amount.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-semibold uppercase text-zinc-300">
                              {order.payment_method.replace(/_/g, ' ')}
                            </span>
                            <div>
                              <span
                                className={`text-[10px] font-bold ${
                                  order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {order.payment_status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3">
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
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
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
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={e => {
                  if (e.target === e.currentTarget) setSelectedOrder(null);
                }}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-7 max-w-2xl w-full max-h-[92dvh] overflow-y-auto space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                    <div>
                      <span className="text-[11px] text-zinc-400 font-semibold">Order Details</span>
                      <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                        {selectedOrder.order_number}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center flex-shrink-0"
                      aria-label="Close Order Details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                      <div className="text-zinc-200 break-words">{selectedOrder.shipping_address}</div>
                      <div className="text-zinc-400 font-bold">
                        {selectedOrder.city}, {selectedOrder.province}
                      </div>
                    </div>
                  </div>

                  {/* Order Status & Courier tracking update */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 text-xs">
                    <div className="font-bold text-white">Order Status & Courier Tracking</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-zinc-400 mb-1">Status:</label>
                        <select
                          value={selectedOrder.order_status}
                          onChange={e => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                          className="w-full min-h-[42px] bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-2 text-white font-semibold"
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
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">Courier Partner:</label>
                        <input
                          type="text"
                          value={courierInput}
                          onChange={e => setCourierInput(e.target.value)}
                          className="w-full min-h-[42px] bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">AWB Tracking #:</label>
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={e => setTrackingInput(e.target.value)}
                          placeholder="e.g. TCS-PK-9812739"
                          className="w-full min-h-[42px] bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingTracking}
                      onClick={async () => {
                        setIsSavingTracking(true);
                        await handleUpdateOrderStatus(
                          selectedOrder.id,
                          selectedOrder.order_status,
                          courierInput,
                          trackingInput,
                          'Courier tracking updated!'
                        );
                        setIsSavingTracking(false);
                      }}
                      className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-zinc-950 font-bold rounded-xl text-xs transition"
                    >
                      {isSavingTracking ? 'Saving...' : 'Save Courier Tracking'}
                    </button>
                  </div>

                  {/* Ordered Items */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-white">Items in Order:</div>
                    {selectedOrder.items?.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-950 rounded-xl flex items-center justify-between gap-3 border border-zinc-800/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-10 h-10 object-contain rounded bg-zinc-900 p-0.5 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{item.product_name}</div>
                            <div className="text-[11px] text-zinc-400">
                              {item.pta_status} • Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400 flex-shrink-0 tabular-nums">
                          Rs. {item.total_price.toLocaleString('en-PK')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline font-bold text-sm">
                    <span className="text-zinc-400">Total Payable:</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono tabular-nums">
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
          <div className="space-y-4 sm:space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Product & Stock ({filteredProducts.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Manage smartphone catalogue, PTA status, PKR prices, and stock levels.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={isExportingCsv}
                  className="min-h-[42px] px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="min-h-[42px] px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Smartphone</span>
                </button>
              </div>
            </div>

            {/* Product Search & PTA Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search model, brand, or SKU..."
                  className="w-full min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={productPtaFilter}
                onChange={e => setProductPtaFilter(e.target.value)}
                className="w-full min-h-[44px] bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All PTA Statuses</option>
                <option value="PTA approved">PTA approved</option>
                <option value="Non-PTA">Non-PTA</option>
                <option value="PTA status not applicable">PTA status N/A</option>
                <option value="To be verified">To be verified</option>
              </select>
            </div>

            {/* Products List */}
            <div className="p-3.5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              {/* Mobile Product Cards (< md) */}
              <div className="md:hidden space-y-3">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 p-1.5 flex items-center justify-center flex-shrink-0">
                        {p.main_image_url ? (
                          <img
                            src={p.main_image_url}
                            alt={p.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Smartphone className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-bold text-white text-sm leading-snug line-clamp-2">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {p.brand} • {p.sku}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.pta_status === 'PTA approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {p.pta_status}
                          </span>
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-300">
                            {p.condition}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                      <div className="font-mono font-black text-emerald-400 text-sm tabular-nums">
                        Rs. {p.selling_price.toLocaleString('en-PK')}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-400 mr-1">Stock:</span>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, -1)}
                          className="min-w-[38px] min-h-[38px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold flex items-center justify-center"
                          aria-label={`Decrease stock for ${p.name}`}
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-white px-1.5 min-w-[24px] text-center tabular-nums">
                          {p.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(p.id, 1)}
                          className="min-w-[38px] min-h-[38px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold flex items-center justify-center"
                          aria-label={`Increase stock for ${p.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditProductModal(p)}
                        className="min-h-[40px] px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteProduct(p)}
                        className="min-h-[40px] px-3 py-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/70 text-rose-300 rounded-xl font-bold flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    No smartphones match your search.
                  </div>
                )}
              </div>

              {/* Desktop Products Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5 pr-3">Device</th>
                      <th className="py-2.5 pr-3">Brand</th>
                      <th className="py-2.5 pr-3">PTA Status</th>
                      <th className="py-2.5 pr-3">Condition</th>
                      <th className="py-2.5 pr-3">Selling Price</th>
                      <th className="py-2.5 pr-3">Stock</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.main_image_url}
                              alt={p.name}
                              className="w-10 h-10 object-contain rounded bg-zinc-950 p-1 flex-shrink-0"
                            />
                            <div className="truncate max-w-[200px]">
                              <div className="font-bold text-white truncate">{p.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-semibold text-zinc-300">{p.brand}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.pta_status === 'PTA approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {p.pta_status}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-zinc-400">{p.condition}</td>
                        <td className="py-3 pr-3 font-mono font-bold text-emerald-400 tabular-nums">
                          Rs. {p.selling_price.toLocaleString('en-PK')}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(p.id, -1)}
                              className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-bold flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-white px-1 tabular-nums">{p.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(p.id, 1)}
                              className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-bold flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProduct(p)}
                            className="p-2 bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-400 rounded-lg"
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

            {/* Delete Confirmation Modal (Replaces window.confirm) */}
            {confirmDeleteProduct && (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={e => {
                  if (e.target === e.currentTarget) setConfirmDeleteProduct(null);
                }}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white font-['Outfit']">
                        Delete Smartphone?
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Are you sure you want to remove{' '}
                        <strong className="text-white">{confirmDeleteProduct.name}</strong> from the
                        storefront catalogue?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProduct(null)}
                      className="min-h-[42px] px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteProduct}
                      className="min-h-[42px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Product Modal */}
            {isAddProductModalOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={e => {
                  if (e.target === e.currentTarget) setIsAddProductModalOpen(false);
                }}
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-7 max-w-2xl w-full max-h-[92dvh] overflow-y-auto space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                    <h3 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
                      {editingProduct ? 'Edit Smartphone' : 'Add New Smartphone'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddProductModalOpen(false)}
                      className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center flex-shrink-0"
                      aria-label="Close Product Modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
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
                        className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Brand:</label>
                        <input
                          type="text"
                          value={pBrand}
                          onChange={e => setPBrand(e.target.value)}
                          placeholder="Apple, Samsung, etc."
                          required
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Category:</label>
                        <input
                          type="text"
                          value={pCategory}
                          onChange={e => setPCategory(e.target.value)}
                          placeholder="PTA-Approved Phones"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">SKU:</label>
                        <input
                          type="text"
                          value={pSku}
                          onChange={e => setPSku(e.target.value)}
                          placeholder="APL-16PM-256"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Original Price (PKR):</label>
                        <input
                          type="number"
                          value={pOriginalPrice}
                          onChange={e => setPOriginalPrice(Number(e.target.value))}
                          required
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Selling Price (PKR):</label>
                        <input
                          type="number"
                          value={pSellingPrice}
                          onChange={e => setPSellingPrice(Number(e.target.value))}
                          required
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Stock Units:</label>
                        <input
                          type="number"
                          value={pStock}
                          onChange={e => setPStock(Number(e.target.value))}
                          required
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">RAM:</label>
                        <input
                          type="text"
                          value={pRam}
                          onChange={e => setPRam(e.target.value)}
                          placeholder="8GB / 12GB"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Storage:</label>
                        <input
                          type="text"
                          value={pStorage}
                          onChange={e => setPStorage(e.target.value)}
                          placeholder="256GB"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Color:</label>
                        <input
                          type="text"
                          value={pColor}
                          onChange={e => setPColor(e.target.value)}
                          placeholder="Titanium"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">PTA Status:</label>
                        <select
                          value={pPtaStatus}
                          onChange={e => setPPtaStatus(e.target.value as any)}
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white"
                        >
                          <option value="PTA approved">PTA approved</option>
                          <option value="Non-PTA">Non-PTA</option>
                          <option value="PTA status not applicable">PTA status not applicable</option>
                          <option value="To be verified">To be verified</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Condition:</label>
                        <select
                          value={pCondition}
                          onChange={e => setPCondition(e.target.value as any)}
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white"
                        >
                          <option value="Brand new">Brand new</option>
                          <option value="Box packed">Box packed</option>
                          <option value="Used">Used</option>
                          <option value="Refurbished">Refurbished</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-300 mb-1">Warranty:</label>
                        <input
                          type="text"
                          value={pWarranty}
                          onChange={e => setPWarranty(e.target.value)}
                          placeholder="1 Year Official Warranty"
                          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">
                        Main Image URL (or upload in Backblaze B2 Media):
                      </label>
                      <input
                        type="url"
                        value={pMainImageUrl}
                        onChange={e => setPMainImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Description:</label>
                      <textarea
                        value={pDescription}
                        onChange={e => setPDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white"
                      />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddProductModalOpen(false)}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProduct}
                        className="w-full sm:flex-1 min-h-[44px] py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-black text-xs rounded-xl transition"
                      >
                        {isSavingProduct ? 'Saving...' : 'Save Smartphone Record'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: BACKBLAZE B2 MEDIA STORAGE */}
        {/* ======================================================== */}
        {activeTab === 'storage' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Backblaze B2 Object Storage Manager
                </h2>
                <p className="text-xs text-zinc-400">
                  Primary S3-compatible object storage for product photos, store logos, banners, and receipts.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAllData}
                className="min-h-[42px] px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Storage</span>
              </button>
            </div>

            {/* B2 Configuration Banner */}
            <div
              className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                storageStatus?.isConfigured
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CloudUpload className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="break-words">{storageStatus?.statusMessage}</span>
                </div>
                {!storageStatus?.isConfigured && (
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl break-words">
                    To connect a live Backblaze B2 bucket: specify <code>B2_REGION</code> (or{' '}
                    <code>B2_ENDPOINT</code>), <code>B2_ACCESS_KEY_ID</code>,{' '}
                    <code>B2_SECRET_ACCESS_KEY</code>, and <code>B2_BUCKET_NAME</code> in your environment
                    variables. Local emulation is currently active.
                  </p>
                )}
              </div>

              <div className="sm:text-right flex-shrink-0">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    storageStatus?.isConfigured ? 'bg-emerald-500 text-zinc-950' : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  {storageStatus?.isConfigured ? 'B2 ACTIVE' : 'LOCAL EMULATION'}
                </span>
                <div className="text-[11px] text-zinc-400 font-mono mt-1.5">
                  Files: {storageStatus?.totalFiles || mediaFiles.length} (
                  {storageStatus?.totalFormattedSize || '0 MB'})
                </div>
              </div>
            </div>

            {/* Upload Component */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
                <span className="font-bold text-white text-sm">Upload New Media Asset to Backblaze B2</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Target Folder:</span>
                  <select
                    value={uploadFolder}
                    onChange={e => setUploadFolder(e.target.value)}
                    className="min-h-[40px] bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white"
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
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-emerald-400 text-xs font-semibold break-words">
                  {uploadMessage}
                </div>
              )}

              <div className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-5 sm:p-8 text-center bg-zinc-950/60 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="admin-media-file-input"
                />
                <label htmlFor="admin-media-file-input" className="cursor-pointer space-y-2 block">
                  <CloudUpload className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-400 mx-auto" />
                  <div className="text-xs sm:text-sm font-bold text-white">
                    {isUploadingMedia
                      ? 'Uploading & Processing in Backblaze B2...'
                      : 'Tap to Browse or Drag & Drop Smartphone Images'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-zinc-500">
                    Supports JPG, PNG, WebP, SVG (Max 15MB) • Stored under <code>{uploadFolder}/</code>
                  </div>
                </label>
              </div>
            </div>

            {/* Media Files Grid */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                Stored Media Assets ({mediaFiles.length})
              </h3>

              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {mediaFiles.map(file => (
                    <div
                      key={file.id}
                      className="p-2.5 sm:p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 group relative"
                    >
                      <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={file.url}
                          alt={file.file_name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="font-bold text-white truncate" title={file.file_name}>
                          {file.file_name}
                        </div>
                        <div className="text-zinc-500 font-mono text-[10px] truncate">
                          {file.folder} • {(file.file_size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await apiFetch('/api/settings', {
                            method: 'PUT',
                            headers: authHeaders,
                            body: JSON.stringify({ store_logo_url: file.url, store_logo_key: file.r2_key })
                          });
                          if (res.ok) {
                            refreshSettings();
                            showToast('success', 'Store logo updated from Backblaze B2 asset!');
                          } else {
                            showToast('error', 'Could not update store logo.');
                          }
                        }}
                        className="w-full min-h-[36px] py-1.5 bg-zinc-800 hover:bg-emerald-600 hover:text-zinc-950 text-zinc-200 text-[11px] font-bold rounded-xl transition"
                      >
                        Set as Logo
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No uploaded media files yet. Upload phone images or banners using the uploader above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PAYMENTS & RECEIPTS VERIFICATION */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Payments & Receipt Verification Desk
              </h2>
              <p className="text-xs text-zinc-400">
                Audit and approve JazzCash, Easypaisa, and Pakistani bank transfer screenshots stored in Backblaze B2.
              </p>
            </div>

            {/* Pending Receipts Queue */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                Receipts Verification Queue ({receipts.length})
              </h3>

              {receipts.length > 0 ? (
                <div className="space-y-3">
                  {receipts.map(rcp => (
                    <div
                      key={rcp.id}
                      className="p-3.5 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <a
                            href={rcp.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 group"
                          >
                            <img
                              src={rcp.file_url}
                              alt="Receipt"
                              className="w-full h-full object-cover group-hover:scale-110 transition"
                            />
                          </a>

                          <div className="space-y-1 text-xs min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-white font-mono">{rcp.order_number}</span>
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] uppercase font-bold text-zinc-300">
                                {rcp.payment_method.replace(/_/g, ' ')}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  rcp.verification_status === 'approved'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : rcp.verification_status === 'rejected'
                                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}
                              >
                                {rcp.verification_status}
                              </span>
                            </div>
                            <div className="text-zinc-300 break-words">
                              Customer: <strong>{rcp.customer_name}</strong> ({rcp.customer_phone})
                            </div>
                            {rcp.transaction_reference && (
                              <div className="text-emerald-400 font-mono break-all">
                                TID / Ref: {rcp.transaction_reference}
                              </div>
                            )}
                            {rcp.notes && <div className="text-zinc-400 italic break-words">"{rcp.notes}"</div>}
                          </div>
                        </div>

                        {/* Verification buttons */}
                        {rcp.verification_status === 'pending' ? (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleVerifyReceipt(rcp.id, 'approved')}
                              className="flex-1 sm:flex-none min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingReceiptId(rejectingReceiptId === rcp.id ? null : rcp.id);
                                setRejectionReason('');
                              }}
                              className="flex-1 sm:flex-none min-h-[42px] px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500 flex-shrink-0">
                            Verified: {rcp.verified_at ? new Date(rcp.verified_at).toLocaleDateString('en-PK') : 'Done'}
                          </div>
                        )}
                      </div>

                      {/* Inline Rejection Reason Form (replaces window.prompt) */}
                      {rejectingReceiptId === rcp.id && (
                        <div className="p-3 bg-zinc-900 border border-rose-900/60 rounded-xl space-y-2.5 text-xs">
                          <label className="block font-semibold text-rose-300">
                            Rejection reason for customer (e.g. Blurry screenshot / Wrong TID):
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={e => setRejectionReason(e.target.value)}
                              placeholder="Enter rejection reason..."
                              className="flex-1 min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!rejectionReason.trim()) {
                                    showToast('error', 'Please enter a rejection reason.');
                                    return;
                                  }
                                  handleVerifyReceipt(rcp.id, 'rejected', rejectionReason.trim());
                                }}
                                className="flex-1 sm:flex-none min-h-[42px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                              >
                                Confirm Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingReceiptId(null);
                                  setRejectionReason('');
                                }}
                                className="min-h-[42px] px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
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
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                Configured Pakistani Bank Accounts ({bankAccounts.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {bankAccounts.map(b => (
                  <div key={b.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                    <div className="font-bold text-white text-sm">{b.bank_name}</div>
                    <div className="text-zinc-400">
                      Title: <strong>{b.account_title}</strong>
                    </div>
                    <div className="font-mono text-zinc-200 break-all">A/C: {b.account_number}</div>
                    <div className="font-mono text-emerald-400 text-[11px] break-all">IBAN: {b.iban}</div>
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
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Smartphone Giveaways Manager
              </h2>
              <p className="text-xs text-zinc-400">
                Audit entries, view registered phone numbers, and draw transparent random winners.
              </p>
            </div>

            <div className="space-y-4">
              {giveaways.map(g => (
                <div
                  key={g.id}
                  className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold uppercase">
                        {g.is_closed ? 'Closed Campaign' : 'Active Campaign'}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">{g.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs font-mono font-bold text-white bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
                        {g.total_entries} Entries
                      </span>
                      {!g.is_closed && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDrawGiveawayId(confirmDrawGiveawayId === g.id ? null : g.id)
                          }
                          className="min-h-[42px] px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition"
                        >
                          Conduct Random Winner Draw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Giveaway Draw Confirmation (Replaces window.confirm) */}
                  {confirmDrawGiveawayId === g.id && (
                    <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <span className="text-amber-200 font-semibold">
                        Draw a transparent random winner from all {g.total_entries} Pakistani entries?
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDrawGiveaway(g.id)}
                          className="min-h-[38px] px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Draw</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDrawGiveawayId(null)}
                          className="min-h-[38px] px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {g.winner_name && (
                    <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-xs space-y-1">
                      <div className="font-bold text-amber-300">Announced Winner:</div>
                      <div className="text-white font-bold text-sm">
                        {g.winner_name} ({g.winner_city})
                      </div>
                      <div className="text-zinc-400">
                        Drawn on: {new Date(g.winner_announced_at!).toLocaleString('en-PK')}
                      </div>
                    </div>
                  )}

                  {/* Entries sample */}
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-zinc-400">Recent Registered Entries:</div>
                    <div className="divide-y divide-zinc-800 max-h-52 overflow-y-auto">
                      {g.entries?.map(e => (
                        <div key={e.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-zinc-300">
                          <div className="min-w-0">
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
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Store Branding & Contact Configuration
              </h2>
              <p className="text-xs text-zinc-400">
                Edit store identity, configure WhatsApp hotlines, shipping rates, and announcement bar copy.
              </p>
            </div>

            <form
              onSubmit={handleSaveSettings}
              className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-5 shadow-xl text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Store Name:</label>
                  <input
                    type="text"
                    value={settingsForm.store_name}
                    onChange={e => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Official WhatsApp Number:</label>
                  <input
                    type="tel"
                    value={settingsForm.whatsapp_number}
                    onChange={e => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Store Calling Phone:</label>
                  <input
                    type="tel"
                    value={settingsForm.contact_number}
                    onChange={e => setSettingsForm({ ...settingsForm, contact_number: e.target.value })}
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Support Email:</label>
                  <input
                    type="email"
                    value={settingsForm.support_email}
                    onChange={e => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">Top Announcement Bar Text:</label>
                <input
                  type="text"
                  value={settingsForm.announcement_bar}
                  onChange={e => setSettingsForm({ ...settingsForm, announcement_bar: e.target.value })}
                  className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Physical Store Address (Pakistan):
                </label>
                <input
                  type="text"
                  value={settingsForm.business_address}
                  onChange={e => setSettingsForm({ ...settingsForm, business_address: e.target.value })}
                  className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Free Shipping Threshold (PKR):
                  </label>
                  <input
                    type="number"
                    value={settingsForm.free_shipping_threshold}
                    onChange={e =>
                      setSettingsForm({ ...settingsForm, free_shipping_threshold: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Standard Courier Rate (PKR):
                  </label>
                  <input
                    type="number"
                    value={settingsForm.standard_shipping_rate}
                    onChange={e =>
                      setSettingsForm({ ...settingsForm, standard_shipping_rate: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full min-h-[46px] py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-[0.99]"
              >
                {isSavingSettings ? 'Saving Settings...' : 'Save Live Branding & Settings'}
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: AUDIT & REPORTS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Reports & Administrative Audit Logs
              </h2>
              <p className="text-xs text-zinc-400">
                Action logging, rate tracking, and payment method statistics.
              </p>
            </div>

            {/* Payment Method Distribution */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                Orders by Payment Method
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                {Object.entries(analytics?.paymentMethodCount || {}).map(([method, count]) => (
                  <div key={method} className="p-3.5 sm:p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold block truncate">
                      {method.replace(/_/g, ' ')}
                    </span>
                    <div className="text-lg sm:text-xl font-black text-white font-mono tabular-nums">
                      {String(count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit']">
                System Audit Trail (Security & Operations)
              </h3>
              <div className="divide-y divide-zinc-800 text-xs">
                {analytics?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white break-words">{act.action}</div>
                      <div className="text-[11px] text-zinc-500 break-all">
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
