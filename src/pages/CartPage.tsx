import React, { useState } from 'react';
import {
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Tag,
  MessageCircle,
  Truck,
  RotateCcw,
  CheckCircle,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

interface CartPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryCharges,
    discountAmount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    destinationCity,
    setDestinationCity,
    generateWhatsAppOrderUrl
  } = useCart();
  const { settings } = useSettings();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const pakCities = [
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Quetta',
    'Sialkot',
    'Gujranwala',
    'Hyderabad',
    'Abbottabad',
    'Bahawalpur',
    'Sargodha',
    'Other Pakistani City'
  ];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponStatus(null);

    const res = await applyCoupon(couponInput);
    setIsApplying(false);
    setCouponStatus({ message: res.message, isError: !res.success });
    if (res.success) setCouponInput('');
  };

  const freeDeliveryThreshold = 50000;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl mx-auto flex items-center justify-center text-zinc-600">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white font-['Outfit']">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Looks like you haven't added any smartphones or gadgets to your cart yet. Explore our PTA-Approved flagships and specials!
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          Browse Smartphones
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Your Shopping Cart
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review your selected phones and accessories before checkout
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-400" />
            {remainingForFreeDelivery === 0 ? (
              <span className="text-emerald-400 font-bold">🎉 Congratulations! You have unlocked FREE Express Delivery!</span>
            ) : (
              <span>
                Add <strong className="text-emerald-400 font-mono">Rs. {remainingForFreeDelivery.toLocaleString('en-PK')}</strong> more to unlock FREE Delivery
              </span>
            )}
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">Free over Rs. 50,000</span>
        </div>
        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.product.id}
                className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-zinc-700"
              >
                {/* Product thumb & title */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img
                    src={item.product.main_image_url}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-zinc-950 p-2 flex-shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {item.product.pta_status}
                    </span>
                    <h3
                      onClick={() => onNavigate('product', item.product.slug)}
                      className="text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer truncate"
                    >
                      {item.product.name}
                    </h3>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span>Condition: {item.product.condition}</span>
                      {item.selectedStorage && <span>• {item.selectedStorage}</span>}
                      {item.selectedColor && <span>• {item.selectedColor}</span>}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400 sm:hidden">
                      Rs. {item.product.selling_price.toLocaleString('en-PK')}
                    </div>
                  </div>
                </div>

                {/* Controls & Price */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  {/* Quantity modifier */}
                  <div className="flex items-center border border-zinc-700 bg-zinc-950 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-zinc-300 hover:bg-zinc-800 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-mono font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-zinc-300 hover:bg-zinc-800 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <div className="text-sm font-black text-white font-mono">
                      Rs. {(item.product.selling_price * item.quantity).toLocaleString('en-PK')}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Rs. {item.product.selling_price.toLocaleString('en-PK')} each
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              ← Continue Shopping for More Devices
            </button>
          </div>
        </div>

        {/* Right Col: Order Summary & Checkout */}
        <div className="space-y-5">
          {/* Summary Box */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
            <h3 className="font-bold text-white text-base font-['Outfit'] pb-3 border-b border-zinc-800">
              Order Summary
            </h3>

            {/* City Delivery Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Destination City (Pakistan):
              </label>
              <select
                value={destinationCity}
                onChange={e => setDestinationCity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {pakCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Items Subtotal:</span>
                <span className="font-mono text-zinc-200">
                  Rs. {subtotal.toLocaleString('en-PK')}
                </span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Delivery Charges ({destinationCity}):</span>
                <span className="font-mono text-zinc-200">
                  {deliveryCharges === 0 ? (
                    <strong className="text-emerald-400">FREE</strong>
                  ) : (
                    `Rs. ${deliveryCharges.toLocaleString('en-PK')}`
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span className="font-mono">-Rs. {discountAmount.toLocaleString('en-PK')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                  Rs. {total.toLocaleString('en-PK')}
                </span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2 border-t border-zinc-800">
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> {appliedCoupon.code} Applied
                    </div>
                    <div className="text-[10px] text-zinc-400">{appliedCoupon.description}</div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon (e.g. WELCOME5000)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 uppercase font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                  {couponStatus && (
                    <div className={`text-[11px] font-semibold ${couponStatus.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {couponStatus.message}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate('checkout')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Order Whole Cart on WhatsApp */}
              <a
                href={generateWhatsAppOrderUrl(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Order Cart on WhatsApp</span>
              </a>
            </div>

            <div className="text-[11px] text-zinc-400 text-center space-y-1">
              <div>🔒 256-Bit SSL Encrypted Pakistani Checkout</div>
              <div>Accepting JazzCash, Easypaisa, Bank Transfer & COD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
