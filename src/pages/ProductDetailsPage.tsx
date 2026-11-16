import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingCart,
  Zap,
  Heart,
  MessageCircle,
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  Share2,
  Smartphone
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticFallback';

interface ProductDetailsPageProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ slug, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { settings } = useSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'delivery'>('specs');

  const touchStartX = useRef<number | null>(null);

  // Review submission form
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setSelectedIndex(0);
    setImgError(false);
    setQuantity(1);
    apiFetch(`/api/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data.product);
        setRelated(data.related || []);
        setReviews(data.reviews || []);
      })
      .catch(err => {
        console.error(err);
        setProduct(null);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="text-sm font-semibold">Loading smartphone specifications &amp; stock...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Device Not Found</h2>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          The requested mobile phone may have been delisted or moved.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
        >
          Back to Phone Shop
        </button>
      </div>
    );
  }

  const allImages = [
    product.main_image_url,
    ...(product.gallery || []).map(g => g.url).filter(Boolean)
  ].filter((url, idx, arr) => url && arr.indexOf(url) === idx);

  const activeImage = allImages[selectedIndex] || product.main_image_url;
  const isFavorited = isInWishlist(product.id);
  const savings = product.original_price - product.selling_price;
  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || allImages.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setSelectedIndex((selectedIndex + 1) % allImages.length);
      } else {
        setSelectedIndex((selectedIndex - 1 + allImages.length) % allImages.length);
      }
      setImgError(false);
    }
    touchStartX.current = null;
  };

  const handleWhatsAppOrder = () => {
    const msg = encodeURIComponent(
      `Salam iBs Slayer! I want to order this phone right away:\n\n` +
      `📱 *${product.name}*\n` +
      `🛡️ PTA Status: ${product.pta_status}\n` +
      `⚙️ Specs: ${product.ram || ''} / ${product.storage || ''} (${product.color || ''})\n` +
      `💰 Selling Price: Rs. ${product.selling_price.toLocaleString('en-PK')}\n` +
      `Quantity: ${quantity}\n` +
      `SKU: ${product.sku}\n\n` +
      `Please confirm payment options (JazzCash/Easypaisa/Bank/COD) and dispatch schedule.`
    );
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = () => {
    if (product.stock > 0) {
      addToCart(product, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  };

  const handleBuyNow = () => {
    if (product.stock > 0) {
      addToCart(product, quantity);
      onNavigate('checkout');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      product_id: product.id,
      customer_name: reviewName,
      rating: reviewRating,
      title: 'Verified Customer',
      comment: reviewComment,
      created_at: new Date().toISOString()
    };
    setReviews([newRev, ...reviews]);
    setReviewSubmitted(true);
    setReviewName('');
    setReviewComment('');
  };

  return (
    <>
      <div className="space-y-8 sm:space-y-12 pb-28 md:pb-16">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto no-scrollbar py-1 whitespace-nowrap">
          <button onClick={() => onNavigate('home')} className="hover:text-white transition">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
          <button onClick={() => onNavigate('shop')} className="hover:text-white transition">Shop</button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
          <button onClick={() => onNavigate('shop', `brand=${encodeURIComponent(product.brand)}`)} className="hover:text-white transition">
            {product.brand}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
          <span className="text-zinc-200 font-semibold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left: Gallery with Swipe Support */}
          <div className="space-y-3 sm:space-y-4">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-square w-full rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-8 flex items-center justify-center overflow-hidden shadow-2xl"
            >
              {!imgError && activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <Smartphone className="w-16 h-16" />
                  <span className="text-xs">{product.name}</span>
                </div>
              )}

              {/* PTA Status Overlay */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 items-start">
                <span
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                    product.pta_status === 'PTA approved'
                      ? 'bg-emerald-500 text-zinc-950 font-black'
                      : product.pta_status === 'Non-PTA'
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'bg-zinc-700 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {product.pta_status}
                </span>
                <span className="px-2 py-0.5 bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-700 rounded text-[10px] sm:text-[11px] font-semibold">
                  {product.condition}
                </span>
              </div>

              {/* Wishlist and Share */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleCopyLink}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-zinc-950/80 backdrop-blur-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition border border-zinc-800"
                  aria-label="Share Device Link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl backdrop-blur-md transition border ${
                    isFavorited
                      ? 'bg-rose-500 text-white border-rose-600'
                      : 'bg-zinc-950/80 text-zinc-400 hover:text-white border-zinc-800'
                  }`}
                  aria-label={isFavorited ? 'In Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Prev/Next Arrows & Counter for multi-image galleries */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setSelectedIndex((selectedIndex - 1 + allImages.length) % allImages.length);
                      setImgError(false);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-zinc-950/80 border border-zinc-700 text-zinc-200 hover:text-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIndex((selectedIndex + 1) % allImages.length);
                      setImgError(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-zinc-950/80 border border-zinc-700 text-zinc-200 hover:text-white"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    {selectedIndex + 1} / {allImages.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnails list */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedIndex(i);
                      setImgError(false);
                    }}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 bg-zinc-900 border flex-shrink-0 transition ${
                      selectedIndex === i
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <img src={url} alt={`View ${i + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-1">
                <span className="font-bold text-emerald-400 uppercase tracking-wider">{product.brand}</span>
                <span>•</span>
                <span className="font-mono text-zinc-500">SKU: {product.sku}</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white font-['Outfit'] leading-tight">
                {product.name}
              </h1>

              {/* Reviews count & PTA verification badge */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-zinc-300 font-semibold ml-1">
                    ({reviews.length} Reviews)
                  </span>
                </div>
                <span className="text-zinc-600 hidden min-[375px]:inline">|</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Official Warranty Verified
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1.5">
              <div className="text-[11px] sm:text-xs text-zinc-400">Total Payable Amount (PKR):</div>
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">
                  Rs. {product.selling_price.toLocaleString('en-PK')}
                </span>
                {savings > 0 && (
                  <span className="text-sm sm:text-base text-zinc-500 line-through font-mono tabular-nums">
                    Rs. {product.original_price.toLocaleString('en-PK')}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span>⚡ You Save: Rs. {savings.toLocaleString('en-PK')} ({Math.round(product.discount_percentage)}% Off)</span>
                </div>
              )}
            </div>

            {/* PTA Notice Callout */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                product.pta_status === 'PTA approved'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {product.pta_status === 'PTA approved'
                    ? 'Official PTA Approved Guarantee'
                    : 'Non-PTA Factory Unlocked Device'}
                </span>
              </div>
              <p>
                {product.pta_status === 'PTA approved'
                  ? 'All customs duty and regulatory fees have been deposited. Works permanently on all Pakistani SIMs (Jazz, Zong, Telenor, Ufone).'
                  : 'Provides 60 days of free SIM activity upon first activation in Pakistan. Duty can be paid anytime via FBR / DIRBS portal.'}
              </p>
            </div>

            {/* Variant attributes: RAM, Storage, Color */}
            {(product.storage || product.ram || product.color) && (
              <div className="flex flex-wrap gap-3 pt-1">
                {product.storage && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Storage:</span>
                    <span className="inline-block px-3.5 py-2 bg-emerald-950/70 text-emerald-400 border border-emerald-500/50 rounded-xl text-xs font-bold font-mono">
                      {product.storage}
                    </span>
                  </div>
                )}

                {product.ram && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">RAM:</span>
                    <span className="inline-block px-3.5 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold font-mono">
                      {product.ram}
                    </span>
                  </div>
                )}

                {product.color && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Color:</span>
                    <span className="inline-block px-3.5 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold">
                      {product.color}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Stock Counter & Quantity Selector */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <div className="flex items-center border border-zinc-700 bg-zinc-950 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="min-w-[44px] min-h-[42px] hover:bg-zinc-800 text-zinc-300 font-bold transition"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-2 font-mono font-bold text-sm text-white tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(Math.max(1, product.stock), quantity + 1))}
                  className="min-w-[44px] min-h-[42px] hover:bg-zinc-800 text-zinc-300 font-bold transition"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <div className="text-xs">
                {product.stock > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4 flex-shrink-0" /> In Stock ({product.stock} ready to ship)
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">Currently Out of Stock</span>
                )}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="min-h-[46px] py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{justAdded ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="min-h-[46px] py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now (Express Checkout)</span>
                </button>
              </div>

              {/* Direct WhatsApp Ordering */}
              <button
                onClick={handleWhatsAppOrder}
                className="w-full min-h-[46px] py-3 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-5 h-5 fill-current flex-shrink-0" />
                <span className="truncate">Order via WhatsApp ({settings.whatsapp_number})</span>
              </button>
            </div>

            {/* Quick Dispatch Highlights */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-3 border-t border-zinc-800 text-[11px] sm:text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Free Delivery &gt; Rs. 50k</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>7-Day Replacement</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{product.warranty}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">JazzCash / Easypaisa</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS: Specifications, Reviews, Delivery Policy */}
        <div className="space-y-5 pt-4 sm:pt-6">
          <div className="flex items-center gap-5 border-b border-zinc-800 text-xs sm:text-sm font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              onClick={() => setActiveTab('specs')}
              className={`min-h-[44px] pb-3 transition flex-shrink-0 ${
                activeTab === 'specs' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`min-h-[44px] pb-3 transition flex-shrink-0 ${
                activeTab === 'reviews' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Customer Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`min-h-[44px] pb-3 transition flex-shrink-0 ${
                activeTab === 'delivery' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Delivery &amp; Warranty Policy
            </button>
          </div>

          {/* Tab 1: Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                {product.description}
              </p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left table-fixed">
                  <tbody className="divide-y divide-zinc-800">
                    <tr className="bg-zinc-950/50">
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400 w-2/5 sm:w-1/3">Brand &amp; Model</td>
                      <td className="px-3.5 sm:px-5 py-3 text-white font-bold break-words">{product.brand} {product.model}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400">PTA Status</td>
                      <td className="px-3.5 sm:px-5 py-3 text-emerald-400 font-bold break-words">{product.pta_status}</td>
                    </tr>
                    <tr className="bg-zinc-950/50">
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400">Condition</td>
                      <td className="px-3.5 sm:px-5 py-3 text-white break-words">{product.condition}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400">Storage</td>
                      <td className="px-3.5 sm:px-5 py-3 text-white break-words">{product.storage || 'Standard'}</td>
                    </tr>
                    <tr className="bg-zinc-950/50">
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400">RAM</td>
                      <td className="px-3.5 sm:px-5 py-3 text-white break-words">{product.ram || 'Standard'}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400">Warranty Term</td>
                      <td className="px-3.5 sm:px-5 py-3 text-white break-words">{product.warranty}</td>
                    </tr>
                    {Object.entries(product.specs || {}).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-zinc-950/50' : ''}>
                        <td className="px-3.5 sm:px-5 py-3 font-semibold text-zinc-400 break-words">{key}</td>
                        <td className="px-3.5 sm:px-5 py-3 text-white break-words">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <form onSubmit={handleAddReview} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 max-w-xl">
                <h4 className="font-bold text-white text-sm">Write a Customer Review</h4>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Your Name &amp; City:</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={e => setReviewName(e.target.value)}
                      placeholder="e.g. Asad Ali (Karachi)"
                      required
                      className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Rating:</label>
                    <select
                      value={reviewRating}
                      onChange={e => setReviewRating(Number(e.target.value))}
                      className="w-full min-h-[42px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">Your Experience:</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share details about delivery speed, packaging, and device condition..."
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="min-h-[42px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
                  >
                    Submit Review
                  </button>
                  {reviewSubmitted && (
                    <span className="text-xs text-emerald-400 font-semibold">
                      ✓ Thank you! Your review has been added.
                    </span>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-white flex flex-wrap items-center gap-2">
                        <span>{rev.customer_name}</span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                          Verified Purchase
                        </span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Delivery */}
          {activeTab === 'delivery' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white">Insured Courier Dispatch Across Pakistan</h4>
              <p>
                Every parcel sent by iBs Slayer is packaged in tamper-evident security containers with serial barcode tracking.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li><strong>Major Metros:</strong> Lahore, Karachi, Islamabad, Rawalpindi — 24 to 48 hours delivery.</li>
                <li><strong>Other Cities:</strong> Faisalabad, Multan, Peshawar, Quetta, Sialkot, Gujranwala, Hyderabad — 2 to 4 business days.</li>
                <li><strong>Free Shipping:</strong> Automatically applied to all orders above Rs. 50,000.</li>
                <li><strong>Courier Partners:</strong> TCS Express, Leopards, M&amp;P, Trax.</li>
              </ul>
            </div>
          )}
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit']">
                Similar Smartphones
              </h3>
              <button
                onClick={() => onNavigate('shop', `brand=${encodeURIComponent(product.brand)}`)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex-shrink-0"
              >
                More {product.brand} →
              </button>
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* MOBILE STICKY BOTTOM BUY BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 py-2.5 pb-safe shadow-2xl">
        <div className="flex items-center justify-between gap-2.5 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 truncate">{product.name}</div>
            <div className="text-sm font-black text-emerald-400 font-mono tabular-nums">
              Rs. {(product.selling_price * quantity).toLocaleString('en-PK')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="min-h-[42px] px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              aria-label="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{justAdded ? 'Added' : 'Cart'}</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="min-h-[42px] px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
