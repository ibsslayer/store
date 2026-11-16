import React, { useState } from 'react';
import {
  Search,
  Truck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../lib/staticFallback';

interface TrackingResult {
  order_number: string;
  customer_name: string;
  city: string;
  order_status: string;
  payment_status: string;
  courier_company?: string;
  courier_tracking_number?: string;
  created_at: string;
  total_amount: number;
  items: Array<{ product_name: string; quantity: number; image_url: string }>;
  tracking_history: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter both your Order Number (e.g. PKM-2026-8841) and Mobile Number.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch(
        `/api/tracking?order_number=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please verify your order number and phone.');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error tracking order.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusSteps = [
    { key: 'new_order', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Packed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'out_for_delivery', label: 'On Route' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStepIndex = (status: string) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const currentStepIdx = result ? getStepIndex(result.order_status) : -1;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          <Truck className="w-4 h-4" />
          <span>Real-Time Logistics Tracker</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
          Track Your Smartphone Order
        </h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Enter your Order Number and Mobile Number to view live TCS / Leopards tracking and parcel verification status.
        </p>
      </div>

      {/* Tracking Form */}
      <form onSubmit={handleTrack} className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4">
        <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">
              Order Number:
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. PKM-2026-8841"
              required
              className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1.5">
              Mobile Number (Checkout):
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0300-1234567"
              required
              className="w-full min-h-[44px] bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[46px] py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          {isLoading ? (
            <span>Locating Consignment...</span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Track Order Status</span>
            </>
          )}
        </button>
      </form>

      {/* Tracking Results Output */}
      {result && (
        <div className="p-4 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl space-y-6 shadow-2xl animate-in fade-in">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <div className="text-xs text-zinc-400">Tracking Consignment for</div>
              <div className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                {result.customer_name} ({result.city})
              </div>
              <div className="text-xs text-zinc-500 font-mono">Order: {result.order_number}</div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                {result.order_status.replace(/_/g, ' ')}
              </span>
              <div className="text-xs text-zinc-400 font-mono mt-1">
                Total: Rs. {result.total_amount.toLocaleString('en-PK')}
              </div>
            </div>
          </div>

          {/* Courier Details Card */}
          {result.courier_tracking_number && (
            <div className="p-3.5 sm:p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white">{result.courier_company || 'TCS Express'}</div>
                  <div className="font-mono text-emerald-400 break-all">
                    AWB: {result.courier_tracking_number}
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                Insured Transit
              </span>
            </div>
          )}

          {/* Stepper progress (Responsive 3x2 grid on mobile, horizontal bar on sm+) */}
          <div className="sm:hidden grid grid-cols-3 gap-2">
            {statusSteps.map((step, idx) => {
              const isPassed = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div
                  key={step.key}
                  className={`p-2 rounded-xl border text-center space-y-1 ${
                    isCurrent
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : isPassed
                      ? 'bg-zinc-950 border-emerald-800/60 text-zinc-200'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div
                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isPassed ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <div className="text-[10px] font-semibold leading-tight">{step.label}</div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block py-4">
            <div className="relative flex justify-between items-center text-center">
              <div className="absolute left-0 right-0 top-4 h-1 bg-zinc-800 z-0" />
              <div
                className="absolute left-0 top-4 h-1 bg-emerald-500 z-0 transition-all duration-500"
                style={{
                  width: `${Math.max(0, (Math.min(currentStepIdx, 5) / (statusSteps.length - 1)) * 100)}%`
                }}
              />

              {statusSteps.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-600 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-2 max-w-[75px] leading-tight font-medium ${
                        isPassed ? 'text-zinc-200' : 'text-zinc-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological History Timeline */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Tracking Timeline</span>
            </h4>

            <div className="space-y-3 relative pl-4 border-l-2 border-zinc-800 ml-2">
              {result.tracking_history?.map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-zinc-900" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-xs">
                    <span className="font-bold text-white">{event.title}</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(event.timestamp).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items Summary */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Enclosed Devices:
            </h4>
            <div className="space-y-2">
              {result.items?.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-950 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img src={item.image_url} alt={item.product_name} className="w-8 h-8 object-contain rounded flex-shrink-0" />
                    <span className="text-white font-medium truncate">{item.product_name}</span>
                  </div>
                  <span className="font-bold text-zinc-400 font-mono flex-shrink-0">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
