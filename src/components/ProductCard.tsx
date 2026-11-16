import React, { useState } from 'react';
import { ShoppingCart, Heart, ShieldCheck, Zap, MessageCircle, Smartphone } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
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
      {/* TOP BADGES ROW */}
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex items-start justify-between gap-1 pointer-events-none">
        <div className="flex flex-col gap-1 items-start min-w-0">
          {/* PTA STATUS BADGE */}
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 max-w-full ${
              product.pta_status === 'PTA approved'
                ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
                : product.pta_status === 'Non-PTA'
                ? 'bg-amber-500 text-zinc-950 shadow-amber-500/20'
                : 'bg-zinc-700 text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
            <span className="truncate">
              {product.pta_status === 'PTA status not applicable' ? 'Accessory' : product.pta_status}
            </span>
          </span>

          {/* DISCOUNT BADGE */}
          {product.discount_percentage > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black rounded tracking-tight">
              -{Math.round(product.discount_percentage)}%
            </span>
          )}
        </div>

        {/* WISHLIST TOGGLE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`pointer-events-auto min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl backdrop-blur-md transition flex-shrink-0 ${
            isFavorited
              ? 'bg-rose-500 text-white shadow-lg'
              : 'bg-zinc-950/70 text-zinc-400 hover:text-white hover:bg-zinc-950'
          }`}
          aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* PRODUCT IMAGE */}
      <div className="relative aspect-square w-full bg-zinc-950/80 p-3.5 min-[360px]:p-3 sm:p-5 flex items-center justify-center overflow-hidden">
        {!imgError && product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
            <Smartphone className="w-10 h-10" />
            <span className="text-[10px] font-medium">{product.brand}</span>
          </div>
        )}

        {/* CONDITION & STOCK BADGES (Prevent collision in 2-up mobile cards) */}
        <div className="absolute bottom-1.5 left-2 right-2 sm:bottom-2 sm:left-3 sm:right-3 flex items-center justify-between gap-1 pointer-events-none">
          <span className="px-1.5 py-0.5 bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 rounded text-[9px] sm:text-[10px] font-semibold truncate">
            {product.condition}
          </span>

          {product.stock > 0 ? (
            product.stock <= 5 ? (
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-950/85 px-1.5 py-0.5 rounded border border-amber-800/60 whitespace-nowrap">
                {product.stock} Left
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-950/85 px-1.5 py-0.5 rounded border border-emerald-800/60 whitespace-nowrap">
                In Stock
              </span>
            )
          ) : (
            <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 bg-rose-950/85 px-1.5 py-0.5 rounded border border-rose-800/60 whitespace-nowrap">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* CONTENT & DETAILS */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400 mb-0.5 sm:mb-1 gap-1">
            <span className="font-semibold text-zinc-300 truncate">{product.brand}</span>
            <span className="hidden sm:inline text-[11px] font-mono text-zinc-500 truncate">{product.sku}</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* KEY SPECS CHIPS */}
          {(product.ram || product.storage || product.color) && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {product.ram && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[9px] sm:text-[10px] font-medium">
                  {product.ram}
                </span>
              )}
              {product.storage && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[9px] sm:text-[10px] font-medium">
                  {product.storage}
                </span>
              )}
              {product.color && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium truncate max-w-[90px]">
                  {product.color}
                </span>
              )}
            </div>
          )}
        </div>

        {/* PRICING (PKR) */}
        <div className="pt-1.5 sm:pt-2 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono tracking-tight tabular-nums">
              Rs. {product.selling_price.toLocaleString('en-PK')}
            </span>
            {savings > 0 && (
              <span className="text-[10px] sm:text-xs text-zinc-500 line-through font-mono tabular-nums">
                Rs. {product.original_price.toLocaleString('en-PK')}
              </span>
            )}
          </div>
          {savings > 0 && (
            <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-500 mt-0.5 truncate">
              Save Rs. {savings.toLocaleString('en-PK')}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full min-h-[38px] sm:min-h-[40px] px-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 ${
                justAdded
                  ? 'bg-emerald-900 text-emerald-300 border border-emerald-600'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{justAdded ? 'Added!' : 'Add'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full min-h-[38px] sm:min-h-[40px] px-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-black text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current flex-shrink-0" />
              <span>Buy</span>
            </button>
          </div>

          {/* WHATSAPP ORDER BUTTON */}
          <button
            onClick={handleWhatsAppOrder}
            className="w-full min-h-[36px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current flex-shrink-0" />
            <span className="sm:hidden">WhatsApp Order</span>
            <span className="hidden sm:inline">Order on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
