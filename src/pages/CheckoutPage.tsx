import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { BankAccount } from '../types';
import { apiFetch } from '../lib/staticFallback';

interface CheckoutPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOrderPlaced: (orderData: any, whatsappUrl: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, onOrderPlaced }) => {
  const { items, subtotal, deliveryCharges, discountAmount, total, appliedCoupon, clearCart, destinationCity } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();

  // Recipient form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState(destinationCity || 'Lahore');
  const [province, setProvince] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'jazzcash' | 'easypaisa' | 'bank_transfer'>('cash_on_delivery');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const provinces = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Gilgit-Baltistan',
    'Azad Jammu & Kashmir'
  ];

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
    'Sukkur',
    'Jhelum',
    'Sahiwal',
    'Mardan'
  ];

  useEffect(() => {
    apiFetch('/api/bank-accounts')
      .then(res => res.json())
      .then(data => {
        const active = (data || []).filter((b: BankAccount) => b.is_enabled);
        setBankAccounts(active);
        if (active.length > 0) setSelectedBankId(active[0].id);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-400">Please add mobile phones to your cart before proceeding to checkout.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
        >
          Browse Phones
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) return setErrorMessage('Please enter recipient full name');
    if (!phone.trim()) return setErrorMessage('Please enter a valid Pakistani mobile number (03xx-xxxxxxx)');
    if (!streetAddress.trim()) return setErrorMessage('Please enter complete delivery address (House/Shop #, Street, Area)');
    if (!city.trim()) return setErrorMessage('Please select destination city');

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: fullName.trim(),
        customer_phone: phone.trim(),
        customer_whatsapp: whatsapp ? whatsapp.trim() : phone.trim(),
        customer_email: email ? email.trim() : undefined,
        shipping_address: streetAddress.trim(),
        city: city.trim(),
        province,
        postal_code: postalCode ? postalCode.trim() : undefined,
        delivery_instructions: deliveryInstructions ? deliveryInstructions.trim() : undefined,
        items: items.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity
        })),
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code
      };

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order. Please check item stock.');
      }

      clearCart();
      onOrderPlaced(data.order, data.whatsappUrl);
      onNavigate('order-confirmation', data.order.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
          Secure Pakistani Checkout
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Guest checkout enabled. Fast nationwide dispatch with official warranty and PTA certification.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Delivery Information & Payment Method Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. RECIPIENT & DELIVERY ADDRESS */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5">
              <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>1. Delivery Destination & Contact Details</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Zeeshan"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Mobile Number (Calling) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    WhatsApp Number (for live updates):
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Email Address (Optional for Invoice):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Province & City */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Province <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    City <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {pakCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Complete Street Address */}
              <div className="text-xs">
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Complete Street Address (House/Flat/Shop #, Street, Block, Area) <span className="text-rose-400">*</span>:
                </label>
                <textarea
                  value={streetAddress}
                  onChange={e => setStreetAddress(e.target.value)}
                  rows={2}
                  placeholder="e.g. House # 14-B, Street 7, Sector F-8/2, Islamabad"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Special Delivery Instructions */}
              <div className="text-xs">
                <label className="block font-semibold text-zinc-300 mb-1.5">
                  Delivery Instructions (Optional):
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={e => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call before arrival, leave with security guard, deliver after 2 PM"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 2. PAYMENT METHODS SELECTION */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5">
              <h3 className="font-bold text-white text-base font-['Outfit'] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>2. Select Payment Method (Pakistan)</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Cash on Delivery */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'bg-zinc-800 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Cash on Delivery</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="accent-emerald-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Pay in cash upon physical receipt of parcel from the courier rider (Available nationwide).
                  </p>
                </label>

                {/* 2. JazzCash */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    paymentMethod === 'jazzcash'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-sm">JazzCash (Instant)</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'jazzcash'}
                      onChange={() => setPaymentMethod('jazzcash')}
                      className="accent-amber-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Transfer via JazzCash app or Till ID. Quick verification within 15 minutes.
                  </p>
                </label>

                {/* 3. Easypaisa */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    paymentMethod === 'easypaisa'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm">Easypaisa</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={() => setPaymentMethod('easypaisa')}
                      className="accent-emerald-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Direct transfer through Easypaisa mobile app. Upload receipt screenshot on confirmation.
                  </p>
                </label>

                {/* 4. Pakistani Bank Transfer */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-sm">Pakistani Bank Transfer</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="accent-indigo-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Meezan Bank, HBL, Bank Alfalah 1-Link / Raast transfer. Upload receipt after placing order.
                  </p>
                </label>
              </div>

              {/* Dynamic Instructions per payment method */}
              {paymentMethod === 'jazzcash' && (
                <div className="p-4 bg-amber-950/20 border border-amber-900/60 rounded-2xl space-y-2 text-xs text-amber-200">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> JazzCash Instructions:
                  </div>
                  <div>Account Title: <strong>{settings.jazzcash_details?.title || 'iBs Slayer Technologies'}</strong></div>
                  <div>Mobile / Till #: <strong className="font-mono text-white text-sm">{settings.jazzcash_details?.account_number || '03001234567'}</strong></div>
                  <p className="text-zinc-400 text-[11px]">{settings.jazzcash_details?.instructions}</p>
                </div>
              )}

              {paymentMethod === 'easypaisa' && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-2xl space-y-2 text-xs text-emerald-200">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Easypaisa Instructions:
                  </div>
                  <div>Account Title: <strong>{settings.easypaisa_details?.title || 'iBs Slayer Official Store'}</strong></div>
                  <div>Account #: <strong className="font-mono text-white text-sm">{settings.easypaisa_details?.account_number || '03459876543'}</strong></div>
                  <p className="text-zinc-400 text-[11px]">{settings.easypaisa_details?.instructions}</p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-zinc-300">Choose Bank Account:</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {bankAccounts.map(bank => (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer text-xs space-y-1 transition ${
                          selectedBankId === bank.id
                            ? 'bg-indigo-950/50 border-indigo-500'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div className="font-bold text-white text-sm">{bank.bank_name}</div>
                        <div className="text-zinc-400">Title: <strong>{bank.account_title}</strong></div>
                        <div className="font-mono text-zinc-300">A/C: {bank.account_number}</div>
                        <div className="font-mono text-indigo-300 text-[11px] truncate">IBAN: {bank.iban}</div>
                      </div>
                    ))}
                  </div>

                  {selectedBank && (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-300 space-y-1">
                      <div className="font-bold text-white">Transfer Note:</div>
                      <p className="text-zinc-400">{selectedBank.instructions || 'Upload receipt screenshot with Transaction ID on the next screen.'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Order Snapshot & Submit Button */}
          <div className="space-y-5">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
              <h3 className="font-bold text-white text-base font-['Outfit'] pb-3 border-b border-zinc-800">
                Order Review
              </h3>

              {/* Items List */}
              <div className="divide-y divide-zinc-800 max-h-60 overflow-y-auto space-y-2">
                {items.map(item => (
                  <div key={item.product.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate max-w-[200px]">
                      <span className="font-bold text-emerald-400 font-mono">{item.quantity}x</span>
                      <span className="truncate text-zinc-200">{item.product.name}</span>
                    </div>
                    <span className="font-mono text-zinc-300 font-bold">
                      Rs. {(item.product.selling_price * item.quantity).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Calculation */}
              <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-zinc-200">Rs. {subtotal.toLocaleString('en-PK')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery ({city}):</span>
                  <span className="font-mono text-zinc-200">
                    {deliveryCharges === 0 ? <strong className="text-emerald-400">FREE</strong> : `Rs. ${deliveryCharges}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-Rs. {discountAmount.toLocaleString('en-PK')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline font-bold text-white">
                  <span>Total Payable:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    Rs. {total.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/30 transition active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>Securing Stock & Placing Order...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Place Order</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  iBs Slayer Guarantee
                </div>
                <p>
                  100% PTA Approved & Officially Sealed Box. Track your parcel 24/7 with SMS alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
