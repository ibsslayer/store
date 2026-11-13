import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/staticFallback';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ShieldCheck,
  MessageCircle,
  Menu,
  X,
  Sparkles,
  PhoneCall,
  Gift,
  Zap,
  ChevronDown,
  Layers,
  MapPin,
  LogIn
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Product } from '../types';

interface HeaderProps {
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
  onOpenAiAdvisor: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onOpenAiAdvisor }) => {
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      apiFetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setShowSearchDropdown(true);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (slug: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    onNavigate('product', slug);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('shop', `search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  return (
    <header className="sticky top-0 z-40 bg-zinc-950 text-white shadow-xl border-b border-zinc-800">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white text-xs font-medium py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
              Pakistan Wide
            </span>
            <span className="truncate max-w-xl">
              {settings.announcement_bar || '100% Official PTA Approved Smartphones • Free Insured Delivery on orders over Rs. 50,000'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-emerald-100">
            <button
              onClick={() => onNavigate('track')}
              className="hover:text-white underline underline-offset-2 flex items-center gap-1 transition"
            >
              <MapPin className="w-3 h-3" /> Track Order
            </button>
            <span className="opacity-50">|</span>
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent('Salam iBs Slayer, I need assistance with smartphone prices & PTA status.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 font-semibold transition"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" /> WhatsApp: {settings.whatsapp_number}
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-zinc-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* LOGO (Uploaded via Cloudflare R2 or dynamic brand badge) */}
        <div
          onClick={() => onNavigate('home')}
          className="cursor-pointer flex items-center gap-3 select-none flex-shrink-0"
        >
          {settings.store_logo_url ? (
            <img
              src={settings.store_logo_url}
              alt={settings.store_name || 'iBs Slayer'}
              className="h-10 w-auto max-w-[170px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-lg text-zinc-950 shadow-lg shadow-emerald-500/20">
                iBs
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tight leading-none text-white font-['Outfit']">
                  iBs <span className="text-emerald-400">SLAYER</span>
                </span>
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-semibold mt-0.5">
                  Pakistan's #1 Phone Store
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH BAR WITH AUTO-SUGGEST */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg relative mx-2">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search iPhone 16, Samsung S24, Xiaomi, PTA status, SKU..."
              className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-400 pl-11 pr-24 py-2.5 rounded-xl border border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg transition"
            >
              Search
            </button>
          </form>

          {/* LIVE SEARCH AUTO-SUGGEST DROPDOWN */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
                <span>Matching Phones & Accessories</span>
                {isSearching && <span className="text-emerald-400 animate-pulse">Searching...</span>}
              </div>
              {searchResults.length > 0 ? (
                <div className="divide-y divide-zinc-800 max-h-80 overflow-y-auto">
                  {searchResults.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSearchResultClick(item.slug)}
                      className="p-3 hover:bg-zinc-800/80 cursor-pointer flex items-center gap-3 transition"
                    >
                      <img
                        src={item.main_image_url}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-zinc-950 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            item.pta_status === 'PTA approved'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          }`}>
                            {item.pta_status}
                          </span>
                          <span className="text-xs text-zinc-400">{item.brand}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          Rs. {item.selling_price.toLocaleString('en-PK')}
                        </div>
                        {item.original_price > item.selling_price && (
                          <div className="text-[11px] text-zinc-500 line-through">
                            Rs. {item.original_price.toLocaleString('en-PK')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={handleSearchSubmit}
                    className="p-2.5 text-center text-xs font-semibold text-emerald-400 hover:bg-zinc-800 cursor-pointer transition"
                  >
                    View all matching results for "{searchQuery}" →
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-400 text-sm">
                  No phones found matching "{searchQuery}". Try searching by brand, model or SKU.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT QUICK ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI SMARTPHONE ADVISOR BUTTON */}
          <button
            onClick={onOpenAiAdvisor}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 text-xs font-semibold rounded-xl border border-purple-500/30 transition shadow-sm"
            title="Ask AI Phone Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>

          {/* WISHLIST BUTTON */}
          <button
            onClick={() => onNavigate('wishlist')}
            className="relative p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* CART BUTTON */}
          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition border border-emerald-500/20 flex items-center gap-2"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-bold font-mono">
              {itemCount > 0 ? `${itemCount} items` : 'Cart'}
            </span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-zinc-950 text-xs font-black rounded-full flex items-center justify-center shadow">
                {itemCount}
              </span>
            )}
          </button>

          {/* USER ACCOUNT / ADMIN DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition flex items-center gap-1"
              title="Account"
            >
              <User className="w-5 h-5" />
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 divide-y divide-zinc-800"
                onClick={() => setUserDropdownOpen(false)}
              >
                {user ? (
                  <>
                    <div className="px-4 py-2.5">
                      <div className="text-xs text-zinc-400">Signed in as</div>
                      <div className="text-sm font-bold text-white truncate">{user.full_name}</div>
                      <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded">
                          Store Administrator
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => onNavigate('account')}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        My Account & Orders
                      </button>
                      <button
                        onClick={() => onNavigate('track')}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        Track Order
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => onNavigate('admin')}
                          className="w-full text-left px-4 py-2 text-sm text-emerald-400 font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Admin Dashboard
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-zinc-800 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-zinc-400">
                      Welcome to iBs Slayer
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => onNavigate('login')}
                        className="w-full text-left px-4 py-2 text-sm text-emerald-400 font-bold hover:bg-zinc-800 transition flex items-center gap-2"
                      >
                        <LogIn className="w-4 h-4" /> Customer Sign In / Register
                      </button>
                      <button
                        onClick={() => onNavigate('track')}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                      >
                        Track My Order
                      </button>
                      <button
                        onClick={() => onNavigate('admin-login')}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-zinc-500" /> Admin Portal Login
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY & NAVIGATION MENU BAR */}
      <nav className="bg-zinc-900 border-t border-zinc-800 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3.5 py-3 hover:text-white transition ${
                currentPage === 'home' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-zinc-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className={`px-3.5 py-3 hover:text-white transition ${
                currentPage === 'shop' ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold' : 'text-zinc-300'
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => onNavigate('shop', 'pta_status=PTA approved')}
              className="px-3.5 py-3 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> PTA Approved Phones
            </button>
            <button
              onClick={() => onNavigate('shop', 'pta_status=Non-PTA')}
              className="px-3.5 py-3 text-amber-400 hover:text-amber-300 transition"
            >
              Non-PTA Phones
            </button>
            <button
              onClick={() => onNavigate('shop', 'brand=Apple')}
              className="px-3.5 py-3 text-zinc-300 hover:text-white transition"
            >
              Apple iPhones
            </button>
            <button
              onClick={() => onNavigate('shop', 'brand=Samsung')}
              className="px-3.5 py-3 text-zinc-300 hover:text-white transition"
            >
              Samsung Galaxy
            </button>
            <button
              onClick={() => onNavigate('shop', 'category=Used Mobile Phones')}
              className="px-3.5 py-3 text-zinc-300 hover:text-white transition"
            >
              Used / Pre-Owned (10/10)
            </button>
            <button
              onClick={() => onNavigate('deals')}
              className="px-3.5 py-3 text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Flash Deals
            </button>
            <button
              onClick={() => onNavigate('giveaways')}
              className="px-3.5 py-3 text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition"
            >
              <Gift className="w-3.5 h-3.5" /> Giveaways
            </button>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Stock Updated
            </span>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-900 border-t border-zinc-800 px-4 py-4 space-y-3">
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search phones, brands, accessories..."
              className="w-full bg-zinc-950 text-sm text-zinc-100 pl-10 pr-4 py-2 rounded-lg border border-zinc-700"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2">
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-800 rounded-lg text-left text-zinc-200"
            >
              🏠 Home
            </button>
            <button
              onClick={() => { onNavigate('shop'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-800 rounded-lg text-left text-zinc-200"
            >
              📱 Shop All Phones
            </button>
            <button
              onClick={() => { onNavigate('shop', 'pta_status=PTA approved'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-left text-emerald-400"
            >
              🛡️ PTA Approved
            </button>
            <button
              onClick={() => { onNavigate('shop', 'pta_status=Non-PTA'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-amber-950/60 border border-amber-800/60 rounded-lg text-left text-amber-400"
            >
              ⚡ Non-PTA Phones
            </button>
            <button
              onClick={() => { onNavigate('deals'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-lg text-left text-rose-400"
            >
              🔥 Flash Deals
            </button>
            <button
              onClick={() => { onNavigate('giveaways'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-yellow-950/60 border border-yellow-800/60 rounded-lg text-left text-yellow-400"
            >
              🎁 Giveaways
            </button>
            <button
              onClick={() => { onNavigate('track'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-800 rounded-lg text-left text-zinc-200"
            >
              📍 Track Order
            </button>
            <button
              onClick={() => { onNavigate('cart'); setMobileMenuOpen(false); }}
              className="p-2.5 bg-zinc-800 rounded-lg text-left text-zinc-200 flex items-center justify-between"
            >
              <span>🛒 Cart</span>
              <span className="font-bold text-emerald-400">{itemCount}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
            <button
              onClick={() => { onNavigate(user ? 'account' : 'login'); setMobileMenuOpen(false); }}
              className="text-emerald-400 font-semibold"
            >
              {user ? `Account: ${user.full_name}` : 'Customer Sign In'}
            </button>
            <button
              onClick={() => { onNavigate('admin-login'); setMobileMenuOpen(false); }}
              className="text-zinc-500 hover:text-white"
            >
              Admin Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
