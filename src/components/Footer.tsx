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
  Lock,
  Send,
  ChevronDown
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
  hasBottomBar?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, hasBottomBar = true }) => {
  const { settings } = useSettings();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [openSection, setOpenSection] = useState<'brands' | 'care' | null>(null);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  return (
    <footer className={`bg-zinc-950 text-zinc-300 border-t border-zinc-800 text-sm ${hasBottomBar ? 'pb-16 md:pb-0' : ''}`}>
      {/* 1. TRUST BADGES ROW */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 p-3 sm:p-0 rounded-2xl bg-zinc-900/40 sm:bg-transparent border border-zinc-800/60 sm:border-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-base">100% PTA Approved</h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 leading-relaxed">
                Verified DIRBS IMEI stamp. Zero blocking risk.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 p-3 sm:p-0 rounded-2xl bg-zinc-900/40 sm:bg-transparent border border-zinc-800/60 sm:border-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-base">Express Courier</h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 leading-relaxed">
                24–48h insured delivery via TCS, Leopards &amp; Trax.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 p-3 sm:p-0 rounded-2xl bg-zinc-900/40 sm:bg-transparent border border-zinc-800/60 sm:border-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-base">7-Day Replacement</h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 leading-relaxed">
                Hassle-free replacement for transit or unboxing defects.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 p-3 sm:p-0 rounded-2xl bg-zinc-900/40 sm:bg-transparent border border-zinc-800/60 sm:border-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs sm:text-base">WhatsApp Support</h4>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 leading-relaxed">
                Live photos, IMEI checks &amp; instant order updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Brand and contact */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
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

          <div className="space-y-2 text-xs text-zinc-300 pt-1">
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

        {/* Categories (Collapsible on mobile, expanded on md+) */}
        <div className="border-t border-zinc-800/80 md:border-0 pt-3 md:pt-0 space-y-2 md:space-y-3">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'brands' ? null : 'brands')}
            className="w-full flex items-center justify-between md:cursor-default text-white font-bold text-sm uppercase tracking-wider py-1"
          >
            <span>Top Brands</span>
            <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${openSection === 'brands' ? 'rotate-180' : ''}`} />
          </button>
          <ul className={`${openSection === 'brands' ? 'grid grid-cols-2 gap-1' : 'hidden'} md:block md:space-y-2 text-xs text-zinc-400`}>
            <li><button onClick={() => onNavigate('shop', 'brand=Apple')} className="py-1.5 md:py-0 hover:text-white transition text-left">Apple iPhones</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Samsung')} className="py-1.5 md:py-0 hover:text-white transition text-left">Samsung Galaxy</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Xiaomi')} className="py-1.5 md:py-0 hover:text-white transition text-left">Xiaomi &amp; Redmi</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Google Pixel')} className="py-1.5 md:py-0 hover:text-white transition text-left">Google Pixel</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Vivo')} className="py-1.5 md:py-0 hover:text-white transition text-left">Vivo Smartphones</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=Infinix')} className="py-1.5 md:py-0 hover:text-white transition text-left">Infinix Mobile</button></li>
            <li><button onClick={() => onNavigate('shop', 'brand=OnePlus')} className="py-1.5 md:py-0 hover:text-white transition text-left">OnePlus Flagships</button></li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div className="border-t border-zinc-800/80 md:border-0 pt-3 md:pt-0 space-y-2 md:space-y-3">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'care' ? null : 'care')}
            className="w-full flex items-center justify-between md:cursor-default text-white font-bold text-sm uppercase tracking-wider py-1"
          >
            <span>Customer Care</span>
            <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${openSection === 'care' ? 'rotate-180' : ''}`} />
          </button>
          <ul className={`${openSection === 'care' ? 'grid grid-cols-2 gap-1' : 'hidden'} md:block md:space-y-2 text-xs text-zinc-400`}>
            <li><button onClick={() => onNavigate('track')} className="py-1.5 md:py-0 hover:text-white transition font-medium text-emerald-400 text-left">Track Your Order</button></li>
            <li><button onClick={() => onNavigate('delivery-info')} className="py-1.5 md:py-0 hover:text-white transition text-left">Shipping &amp; Delivery</button></li>
            <li><button onClick={() => onNavigate('returns-refunds')} className="py-1.5 md:py-0 hover:text-white transition text-left">Warranty &amp; Returns</button></li>
            <li><button onClick={() => onNavigate('faqs')} className="py-1.5 md:py-0 hover:text-white transition text-left">PTA Tax &amp; FAQs</button></li>
            <li><button onClick={() => onNavigate('giveaways')} className="py-1.5 md:py-0 hover:text-white transition text-yellow-400 text-left">Enter Giveaways</button></li>
            <li><button onClick={() => onNavigate('about')} className="py-1.5 md:py-0 hover:text-white transition text-left">About iBs Slayer</button></li>
            <li><button onClick={() => onNavigate('contact')} className="py-1.5 md:py-0 hover:text-white transition text-left">Contact Store</button></li>
            <li>
              <button onClick={() => onNavigate('admin-login')} className="py-1.5 md:py-0 hover:text-zinc-300 transition text-zinc-500 text-[11px] flex items-center gap-1 md:mt-2">
                <Lock className="w-3 h-3" /> Admin Portal
              </button>
            </li>
          </ul>
        </div>

        {/* Newsletter & PTA advisory */}
        <div className="space-y-3 sm:space-y-4 border-t border-zinc-800/80 md:border-0 pt-4 md:pt-0">
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
                className="w-full min-h-[44px] bg-zinc-900 text-xs text-zinc-100 placeholder-zinc-500 pl-3 pr-12 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs transition flex items-center"
              >
                <Send className="w-3.5 h-3.5" />
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
              Verify any phone&apos;s customs status via PTA DIRBS portal or SMS 15-digit IMEI to <strong>8484</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT METHODS & COURIER LOGOS ROW */}
      <div className="border-t border-zinc-900 bg-zinc-950/80 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Payments:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-bold text-amber-400">
                JazzCash
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-bold text-emerald-400">
                Easypaisa
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-200">
                Meezan Bank
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-200">
                HBL
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-200">
                COD
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Couriers:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-300">
                TCS Express
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-300">
                Leopards
              </span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-semibold text-zinc-300">
                Trax
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM COPYRIGHT & LEGAL */}
      <div className="border-t border-zinc-800/60 bg-black py-4 px-4 text-[11px] sm:text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {settings.store_name || 'iBs Slayer'}. All rights reserved. Dispatched across Pakistan.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-400">
            <button onClick={() => onNavigate('privacy')} className="hover:text-white transition">Privacy</button>
            <span>•</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition">Terms</button>
            <span>•</span>
            <button onClick={() => onNavigate('returns-refunds')} className="hover:text-white transition">Returns</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
