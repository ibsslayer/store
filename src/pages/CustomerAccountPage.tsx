import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Truck,
  ShieldCheck,
  UploadCloud,
  LogOut,
  MapPin,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

interface CustomerAccountPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ onNavigate }) => {
  const { user, logout, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setOrders(data || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Sign In Required</h2>
        <p className="text-xs text-zinc-400">Please sign in to view your profile and order history.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Account Profile Card */}
      <div className="p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-2xl">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white font-['Outfit']">{user.full_name}</h1>
            <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3">
              <span>{user.email}</span>
              <span>•</span>
              <span className="font-mono text-zinc-300">{user.phone}</span>
              {user.whatsapp && (
                <span className="text-emerald-400 font-mono">WA: {user.whatsapp}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('track')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Track Parcel</span>
          </button>
          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>My Order History ({orders.length})</span>
          </h2>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
          >
            Shop More Phones →
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            Loading your order records...
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="p-5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-md"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
                  <div>
                    <span className="font-bold text-white font-mono text-sm tracking-wide">
                      {order.order_number}
                    </span>
                    <span className="text-zinc-500 ml-2">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase text-[10px]">
                      {order.payment_method.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.payment_status === 'paid'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : order.payment_status === 'awaiting_verification'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {order.payment_status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="p-3 bg-zinc-950 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.image_url} alt={item.product_name} className="w-10 h-10 object-contain rounded" />
                        <div>
                          <div className="font-bold text-white">{item.product_name}</div>
                          <div className="text-[11px] text-zinc-400">
                            {item.pta_status} • Quantity: {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400">
                        Rs. {item.total_price.toLocaleString('en-PK')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
                  <div className="text-zinc-400">
                    Delivering to: <strong className="text-zinc-200">{order.shipping_address}, {order.city}</strong>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="font-bold text-white text-sm">
                      Total: <span className="text-emerald-400 font-mono">Rs. {order.total_amount.toLocaleString('en-PK')}</span>
                    </div>

                    <button
                      onClick={() => onNavigate('track')}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Track</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-3xl text-center space-y-3">
            <Package className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="font-bold text-white">No Orders Placed Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your confirmed orders and live courier tracking numbers will appear right here.
            </p>
            <button
              onClick={() => onNavigate('shop')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
            >
              Browse Mobile Phones
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
