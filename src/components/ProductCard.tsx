import React from 'react';
import { ShoppingCart, Heart, ShieldCheck, Zap, MessageCircle, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { settings } = useSettings();

  const isFavorited = isInWishlist(product.id);
  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  const savings = product.original_price - product.selling_price;

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Salam iBs Slayer! I would like to order this smartphone:\n\n` +
      `📱 Model: ${product.name}\n` +
      `🛡️ PTA Status: ${product.pta_status}\n` +
      `⚙️ Specs: ${product.ram || ''} / ${product.storage || ''} (${product.color || ''})\n` +
      `💰 Price: Rs. ${product.selling_price.toLocaleString('en-PK')}\n` +
      `SKU: ${product.sku}\n\n` +
      `Is this available for same-day dispatch?`
    );
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
      onNavigate('checkout');
    }
  };

  return (
    <div
      onClick={() => onNavigate('product', product.slug)}
      className="group relative bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-700 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* BADGES ROW */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {/* PTA STATUS BADGE */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 ${
              product.pta_status === 'PTA approved'
                ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
                : product.pta_status === 'Non-PTA'
                ? 'bg-amber-500 text-zinc-950 shadow-amber-500/20'
                : 'bg-zinc-700 text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {product.pta_status}
          </span>

          {/* DISCOUNT BADGE */}
          {product.discount_percentage > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded tracking-tight">
              SAVE {Math.round(product.discount_percentage)}%
            </span>
          )}
        </div>

        {/* WISHLIST TOGGLE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md transition ${
            isFavorited
              ? 'bg-rose-500 text-white shadow-lg'
              : 'bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-950'
          }`}
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* PRODUCT IMAGE */}
      <div className="relative aspect-square w-full bg-zinc-950/80 p-6 flex items-center justify-center overflow-hidden">
        <img
          src={product.main_image_url}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* CONDITION BADGE OVERLAY */}
        <div className="absolute bottom-2 left-3">
          <span className="px-2 py-0.5 bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 rounded text-[10px] font-semibold">
            {product.condition}
          </span>
        </div>

        {/* STOCK STATUS */}
        <div className="absolute bottom-2 right-3">
          {product.stock > 0 ? (
            product.stock <= 5 ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                Only {product.stock} Left!
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                In Stock
              </span>
            )
          ) : (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* CONTENT & DETAILS */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold text-zinc-300">{product.brand}</span>
            <span className="text-[11px] font-mono text-zinc-500">{product.sku}</span>
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* KEY SPECS CHIPS */}
          {(product.ram || product.storage || product.color) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {product.ram && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium">
                  {product.ram} RAM
                </span>
              )}
              {product.storage && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium">
                  {product.storage}
                </span>
              )}
              {product.color && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium truncate max-w-[100px]">
                  {product.color}
                </span>
              )}
            </div>
          )}
        </div>

        {/* PRICING (PKR) */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">
              Rs. {product.selling_price.toLocaleString('en-PK')}
            </span>
            {savings > 0 && (
              <span className="text-xs text-zinc-500 line-through font-mono">
                Rs. {product.original_price.toLocaleString('en-PK')}
              </span>
            )}
          </div>
          {savings > 0 && (
            <div className="text-[10px] font-semibold text-emerald-500 mt-0.5">
              Save Rs. {savings.toLocaleString('en-PK')}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>

        {/* WHATSAPP ORDER BUTTON */}
        <button
          onClick={handleWhatsAppOrder}
          className="w-full py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>Order on WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
