import React, { useState, useEffect } from 'react';
import { Flame, Tag } from 'lucide-react';
import { Product, Coupon } from '../types';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticFallback';

interface DealsPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/products').then(r => (r.ok ? r.json() : [])),
      apiFetch('/api/coupons').then(r => (r.ok ? r.json() : []))
    ])
      .then(([pData, cData]) => {
        setProducts(Array.isArray(pData) ? pData : []);
        setCoupons(Array.isArray(cData) ? cData : []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const discountedPhones = products
    .filter(p => p.discount_percentage > 0)
    .sort((a, b) => b.discount_percentage - a.discount_percentage);

  return (
    <div className="space-y-8 sm:space-y-10 pb-10 sm:pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-zinc-900 to-black rounded-2xl sm:rounded-3xl border border-rose-900/50 p-5 sm:p-8 text-center space-y-2.5 sm:space-y-3 shadow-2xl">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Mega Smartphone Price Drops</span>
        </div>
        <h1 className="text-2xl sm:text-5xl font-black text-white font-['Outfit']">
          Flash Deals &amp; Promotions
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Save up to Rs. 35,000 on official PTA-approved phones with guaranteed lowest market rates in Pakistan.
        </p>
      </div>

      {/* Active Coupon Codes Grid */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          <span>Pakistani Discount Vouchers</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 px-2.5 py-1 bg-emerald-950 rounded border border-emerald-800">
                  {coupon.code}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active</span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                {coupon.description}
              </p>
              <div className="text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-800 flex justify-between gap-2">
                <span>Min: Rs. {coupon.min_order_amount.toLocaleString('en-PK')}</span>
                <span>Used {coupon.times_used}×</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounted Products Grid */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
            Discounted Smartphones ({discountedPhones.length} live)
          </h3>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
          >
            Browse All Phones →
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-72 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : discountedPhones.length > 0 ? (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {discountedPhones.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-400 text-xs">
            No active discount items right now.
          </div>
        )}
      </div>
    </div>
  );
};
