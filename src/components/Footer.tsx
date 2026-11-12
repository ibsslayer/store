import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Lock,
  CreditCard,
  Send
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-800 text-sm">
      {/* 1. TRUST BADGES ROW */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">100% PTA Approved</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Official customs duty paid with verified DIRBS IMEI stamp. Zero blocking risk.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Express Courier Delivery</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Fast 24-48h insured dispatch across Pakistan via TCS, Leopards & Trax with live tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">7-Day Replacement</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Hassle-free replacement for transit damage or unboxing defects with official warranty.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Instant WhatsApp Support</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Direct mobile specialists ready to send live photos, IMEI checks, and order updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand and contact */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-sm text-zinc-950">
              iBs
            </div>
            <span className="font-black text-2xl tracking-tight text-white font-['Outfit']">
              iBs <span className="text-emerald-400">SLAYER</span>
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Pakistan’s premier electronics and mobile technology destination. Sourcing 100% genuine, sealed smartphones with authentic PTA customs tax compliance and manufacturer warranty.
          </p>

          <div className="space-y-2 text-xs text-zinc-300 pt-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{settings.business_address || 'Hafeez Centre, Main Boulevard Gulberg III, Lahore, Pakistan'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{settings.contact_number || '+92 (042) 3578-9000'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <a
                href={`https://wa.me/${waPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300 font-semibold"
              >
                WhatsApp: {settings.whatsapp_number}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{settings.support_email || 'support@ibsslayer.pk'}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h5 className="text-white font-bold text-sm uppercase tracking-wider">Top Brands</h5>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li><button onClick={() => onNavigate('shop', 'brand=Apple')} className="hover:text-white transition">Apple iPhones</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Samsung')} className="hover:text-white transition">Samsung Galaxy</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Xiaomi')} className="hover:text-white transition">Xiaomi & Redmi</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Google Pixel')} className="hover:text-white transition">Google Pixel</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Vivo')} className="hover:text-white transition">Vivo Smartphones</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Infinix')} className="hover:text-white transition">Infinix Mobile</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=OnePlus')} className="hover:text-white transition">OnePlus Flagships</button></li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div className="space-y-3">
          <h5 className="text-white font-bold text-sm uppercase tracking-wider">Customer Care</h5>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li><button onClick={() => onNavigate('track')} className="hover:text-white transition font-medium text-emerald-400">Track Your Order</button></li>
            <li><button onClick={() => onNavigate('delivery-info')} className="hover:text-white transition">Shipping & Delivery Rates</button></li>
            <li><button onClick={() => onNavigate('returns-refunds')} className="hover:text-white transition">Warranty & Returns</button></li>
            <li><button onClick={() => onNavigate('faqs')} className="hover:text-white transition">PTA Tax & FAQs</button></li>
            <li><button onClick={() => onNavigate('giveaways')} className="hover:text-white transition text-yellow-400">Enter Giveaways</button></li>
            <li><button onClick={() => onNavigate('about')} className="hover:text-white transition">About iBs Slayer</button></li>
            <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition">Contact Store</button></li>
            <li><button onClick={() => onNavigate('admin-login')} className="hover:text-zinc-300 transition text-zinc-500 text-[11px] flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3" /> Admin Portal
            </button></li>
          </ul>
        </div>

        {/* Newsletter & PTA advisory */}
        <div className="space-y-4">
          <h5 className="text-white font-bold text-sm uppercase tracking-wider">Join iBs Slayer Club</h5>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Subscribe for flash price drops, coupon codes, and smartphone giveaways.
          </p>

          <form onSubmit={handleNewsletter} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-zinc-900 text-xs text-zinc-100 placeholder-zinc-500 px-3 py-2.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded text-xs transition flex items-center"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
            {newsletterSubscribed && (
              <div className="text-[11px] text-emerald-400 font-semibold">
                ✓ Thank you! Use coupon code <strong>WELCOME5000</strong> on your first order.
              </div>
            )}
          </form>

          {/* PTA Notice */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1 font-bold text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Official PTA Advisory
            </div>
            <p>
              Verify any phone's customs status via PTA DIRBS portal or SMS 15-digit IMEI to <strong>8484</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT METHODS & COURIER LOGOS ROW */}
      <div className="border-t border-zinc-900 bg-zinc-950/80 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Accepted Payments:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-bold text-amber-400">
                JazzCash
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-bold text-emerald-400">
                Easypaisa
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-200">
                Meezan Bank
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-200">
                HBL
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-200">
                Bank Alfalah
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-200">
                Cash on Delivery
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Courier Partners:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-300">
                TCS Express
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-300">
                Leopards
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-semibold text-zinc-300">
                Trax Logistics
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM COPYRIGHT & LEGAL */}
      <div className="border-t border-zinc-800/60 bg-black py-4 px-4 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {settings.store_name || 'iBs Slayer'}. All rights reserved. Sourced & Dispatched in Pakistan.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => onNavigate('privacy')} className="hover:text-white transition">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition">Terms & Conditions</button>
            <span>•</span>
            <button onClick={() => onNavigate('returns-refunds')} className="hover:text-white transition">Return Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
