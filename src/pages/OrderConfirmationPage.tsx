import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Truck,
  MessageCircle,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { apiFetch } from '../lib/staticFallback';

interface OrderConfirmationPageProps {
  orderId?: string;
  orderData?: Order | null;
  whatsappUrl?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
  orderData,
  whatsappUrl,
  onNavigate
}) => {
  const [order, setOrder] = useState<Order | null>(orderData || null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    // Fire celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    if (!order && orderId) {
      apiFetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(() => {});
    }
  }, [orderId]);

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !order) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('order_id', order.id);
    formData.append('order_number', order.order_number);
    formData.append('payment_method', order.payment_method);
    formData.append('transaction_reference', transactionRef);
    formData.append('notes', receiptNotes);

    try {
      const res = await apiFetch('/api/receipts/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload receipt');

      setUploadSuccess(true);
      setReceiptFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading receipt');
    } finally {
      setIsUploading(false);
    }
  };

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="animate-spin text-3xl">⏳</div>
        <p className="text-zinc-400 text-sm">Fetching order details...</p>
      </div>
    );
  }

  const isPrepaid = order.payment_method !== 'cash_on_delivery';

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* 1. SUCCESS HERO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Order Successfully Placed!
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
            Shukriya, {order.customer_name}!
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Your smartphone order has been reserved and registered in our central inventory system.
          </p>
        </div>

        {/* Order Number Badge */}
        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 max-w-sm mx-auto flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Unique Order Number</div>
            <div className="text-lg font-black text-emerald-400 font-mono tracking-wider">
              {order.order_number}
            </div>
          </div>
          <button
            onClick={() => onNavigate('track')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <span>Track Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* WhatsApp confirmation CTA */}
        {whatsappUrl && (
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Confirm on WhatsApp for Priority Dispatch</span>
            </a>
          </div>
        )}
      </div>

      {/* 2. PAYMENT RECEIPT UPLOAD (For JazzCash, Easypaisa, Bank Transfer) */}
      {isPrepaid && (
        <div className="p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <span>Upload Payment Receipt / Screenshot</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Saved securely in Backblaze B2 storage for verification by our accounts team.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
              Awaiting Verification
            </span>
          </div>

          {uploadSuccess ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
              <FileCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Receipt Successfully Uploaded!</h4>
              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                Our verification desk is reviewing your payment. You will receive an SMS and WhatsApp notification once approved.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReceiptUpload} className="space-y-4 text-xs">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300">
                  {uploadError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Transaction ID / Reference (TID):
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    placeholder="e.g. 1098234892 or Raast ID"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Notes / Bank Name:
                  </label>
                  <input
                    type="text"
                    value={receiptNotes}
                    onChange={e => setReceiptNotes(e.target.value)}
                    placeholder="e.g. Transferred from Meezan mobile app"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Drag and drop upload area */}
              <div>
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Receipt Image or PDF <span className="text-rose-400">*</span>:
                </label>
                <div className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-zinc-950/60 cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setReceiptFile(e.target.files[0]);
                      }
                    }}
                    required
                    className="hidden"
                    id="receipt-file-input"
                  />
                  <label htmlFor="receipt-file-input" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto" />
                    <div className="text-xs font-semibold text-zinc-200">
                      {receiptFile ? (
                        <span className="text-emerald-400 font-bold">{receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)</span>
                      ) : (
                        <span>Click to browse or drag & drop payment screenshot</span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Supports JPG, PNG, WebP or PDF (Max 15MB)
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !receiptFile}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                {isUploading ? (
                  <span>Uploading to Backblaze B2...</span>
                ) : (
                  <span>Submit Payment Receipt for Approval</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3. ORDER DETAILS BREAKDOWN */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 text-xs">
        <h3 className="font-bold text-white text-base font-['Outfit'] pb-3 border-b border-zinc-800">
          Order Summary & Delivery Address
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Recipient</span>
            <div className="font-bold text-white text-sm">{order.customer_name}</div>
            <div className="text-zinc-400 font-mono">{order.customer_phone}</div>
            {order.customer_whatsapp && (
              <div className="text-emerald-400">WhatsApp: {order.customer_whatsapp}</div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Delivery Destination</span>
            <div className="text-zinc-300">{order.shipping_address}</div>
            <div className="text-zinc-400">{order.city}, {order.province}</div>
          </div>
        </div>

        {/* Items list */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Ordered Phones</span>
          {order.items.map(item => (
            <div key={item.id} className="p-3 bg-zinc-950 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={item.image_url} alt={item.product_name} className="w-10 h-10 object-contain rounded" />
                <div>
                  <div className="font-bold text-white">{item.product_name}</div>
                  <div className="text-[11px] text-zinc-400">
                    {item.pta_status} • Qty: {item.quantity}
                  </div>
                </div>
              </div>
              <div className="font-mono font-bold text-emerald-400">
                Rs. {item.total_price.toLocaleString('en-PK')}
              </div>
            </div>
          ))}
        </div>

        {/* Total calculation */}
        <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-right font-mono">
          <div className="text-zinc-400">Subtotal: Rs. {order.subtotal.toLocaleString('en-PK')}</div>
          <div className="text-zinc-400">Delivery: {order.delivery_charges === 0 ? 'FREE' : `Rs. ${order.delivery_charges}`}</div>
          {order.discount_amount > 0 && (
            <div className="text-emerald-400">Discount: -Rs. {order.discount_amount.toLocaleString('en-PK')}</div>
          )}
          <div className="text-base font-black text-white pt-2 border-t border-zinc-800">
            Total Amount: <span className="text-emerald-400">Rs. {order.total_amount.toLocaleString('en-PK')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
