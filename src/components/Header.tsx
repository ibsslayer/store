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
  Gift,
  Zap,
  ChevronDown,
  MapPin,
  LogIn,
  Smartphone,
  Home
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

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
          setSearchResults(data || []);
          setShowSearchDropdown(true);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside & Escape key handling
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktopSearch = desktopSearchRef.current?.contains(target);
      const inMobileSearch = mobileSearchRef.current?.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearchResultClick = (slug: string) => {
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
    setSearchQuery('');
    onNavigate('product', slug);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      setMobileMenuOpen(false);
      onNavigate('shop', `search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const waPhone = (settings.whatsapp_number || '+923001234567').replace(/[^0-9]/g, '');

  const renderSearchDropdown = () => {
    if (!showSearchDropdown) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50">
        <div className="px-3 py-2 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
          <span>Matching Phones &amp; Accessories</span>
          {isSearching && <span className="text-emerald-400 animate-pulse">Searching...</span>}
        </div>
        {searchResults.length > 0 ? (
          <div className="divide-y divide-zinc-800 max-h-72 sm:max-h-80 overflow-y-auto">
            {searchResults.map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleSearchResultClick(item.slug)}
                className="w-full text-left p-2.5 sm:p-3 hover:bg-zinc-800/80 cursor-pointer flex items-center gap-2.5 sm:gap-3 transition"
              >
                <img
                  src={item.main_image_url}
                  alt={item.name}
                  className="w-11 h-11 object-contain rounded-lg bg-zinc-950 p-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">{item.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.pta_status === 'PTA approved'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {item.pta_status}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate">{item.brand}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                    Rs. {item.selling_price.toLocaleString('en-PK')}
                  </div>
                  {item.original_price > item.selling_price && (
                    <div className="text-[10px] text-zinc-500 line-through font-mono">
                      Rs. {item.original_price.toLocaleString('en-PK')}
                    </div>
                  )}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full p-3 text-center text-xs font-semibold text-emerald-400 hover:bg-zinc-800 cursor-pointer transition"
            >
              View all results for &ldquo;{searchQuery}&rdquo; →
            </button>
          </div>
        ) : (
          <div className="p-5 text-center text-zinc-400 text-xs sm:text-sm">
            No phones found matching &ldquo;{searchQuery}&rdquo;. Try searching by brand, model or SKU.
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. NON-STICKY TOP ANNOUNCEMENT BAR (Keeps sticky mobile header compact!) */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white text-[11px] sm:text-xs font-medium py-1.5 sm:py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center sm:justify-start">
            <span className="bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase flex-shrink-0">
              Pakistan Wide
            </span>
            <span className="truncate">
              {settings.announcement_bar || '100% Official PTA Approved Phones • Free Insured Delivery over Rs. 50,000'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-emerald-100 flex-shrink-0">
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

      {/* 2. STICKY COMPACT HEADER */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md text-white shadow-xl border-b border-zinc-800">
        {/* MAIN HEADER ROW */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile menu trigger + Compact Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition flex-shrink-0"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="cursor-pointer flex items-center gap-2 select-none flex-shrink-0 text-left"
            >
              {settings.store_logo_url ? (
                <img
                  src={settings.store_logo_url}
                  alt={settings.store_name || 'iBs Slayer'}
                  className="h-8 sm:h-10 w-auto max-w-[130px] sm:max-w-[170px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-sm sm:text-lg text-zinc-950 shadow-lg shadow-emerald-500/20 flex-shrink-0">
                    iBs
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-lg sm:text-2xl tracking-tight leading-none text-white font-['Outfit'] whitespace-nowrap">
                      iBs <span className="text-emerald-400">SLAYER</span>
                    </span>
                    <span className="hidden sm:block text-[10px] tracking-widest text-zinc-400 uppercase font-semibold mt-0.5">
                      Pakistan&apos;s #1 Phone Store
                    </span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Desktop/Tablet Search Bar */}
          <div ref={desktopSearchRef} className="hidden md:flex flex-1 max-w-lg relative mx-2">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                placeholder="Search iPhone 16, Samsung S24, Xiaomi, PTA status, SKU..."
                className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-400 pl-10 pr-24 py-2.5 rounded-xl border border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg transition"
              >
                Search
              </button>
            </form>
            {renderSearchDropdown()}
          </div>

          {/* RIGHT QUICK ACTIONS */}
          <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
            {/* AI SMARTPHONE ADVISOR BUTTON */}
            <button
              onClick={onOpenAiAdvisor}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 text-xs font-semibold rounded-xl border border-purple-500/30 transition shadow-sm"
              title="Ask AI Phone Advisor"
              aria-label="AI Phone Advisor"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>

            {/* WISHLIST BUTTON (Shown on 375px+ top bar; always inside mobile drawer on 320px) */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="hidden min-[375px]:flex relative min-w-[40px] min-h-[40px] items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition"
              title="Wishlist"
              aria-label="Wishlist"
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
              className="relative min-w-[40px] min-h-[40px] px-2.5 sm:px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition border border-emerald-500/20 flex items-center justify-center gap-1.5"
              title="Shopping Cart"
              aria-label={`Shopping Cart (${itemCount} items)`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-bold font-mono">
                {itemCount > 0 ? `${itemCount} items` : 'Cart'}
              </span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 text-zinc-950 text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </button>

            {/* USER ACCOUNT / ADMIN DROPDOWN */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="min-w-[40px] min-h-[40px] px-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition flex items-center justify-center gap-0.5"
                title="Account"
                aria-label="Account menu"
                aria-expanded={userDropdownOpen}
              >
                <User className="w-5 h-5" />
                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 divide-y divide-zinc-800"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2.5">
                        <div className="text-[11px] text-zinc-400">Signed in as</div>
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
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          My Account &amp; Orders
                        </button>
                        <button
                          onClick={() => onNavigate('wishlist')}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition flex items-center justify-between"
                        >
                          <span>Saved Wishlist</span>
                          <span className="text-xs text-rose-400 font-mono font-bold">{wishlist.length}</span>
                        </button>
                        <button
                          onClick={() => onNavigate('track')}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          Track Order
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onNavigate('admin')}
                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 font-semibold hover:bg-zinc-800 transition flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Admin Dashboard
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-zinc-800 transition"
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
                          className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 font-bold hover:bg-zinc-800 transition flex items-center gap-2"
                        >
                          <LogIn className="w-4 h-4" /> Customer Sign In
                        </button>
                        <button
                          onClick={() => onNavigate('wishlist')}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition flex items-center justify-between"
                        >
                          <span>Wishlist</span>
                          <span className="text-xs text-zinc-400 font-mono">{wishlist.length}</span>
                        </button>
                        <button
                          onClick={() => onNavigate('track')}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          Track My Order
                        </button>
                        <button
                          onClick={() => onNavigate('admin-login')}
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-2"
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

        {/* ALWAYS-ACCESSIBLE MOBILE SEARCH BAR (< md) */}
        <div ref={mobileSearchRef} className="md:hidden px-3 pb-2.5 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Search iPhone 16, Samsung S24, PTA status..."
              className="w-full bg-zinc-900/95 text-sm text-zinc-100 placeholder-zinc-500 pl-9 pr-16 h-10 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500 transition"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-12 top-2 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg transition"
            >
              Go
            </button>
          </form>
          {renderSearchDropdown()}
        </div>

        {/* 3. DESKTOP CATEGORY & NAVIGATION MENU BAR */}
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
      </header>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-[86vw] max-w-xs bg-zinc-950 border-r border-zinc-800 h-full flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="p-4 space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xs text-zinc-950">
                    iBs
                  </div>
                  <span className="font-black text-base text-white font-['Outfit']">
                    iBs <span className="text-emerald-400">SLAYER</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Links */}
              <div className="space-y-1.5 text-sm font-semibold">
                <button
                  onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                  className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-left transition ${
                    currentPage === 'home' ? 'bg-emerald-500 text-zinc-950 font-black' : 'bg-zinc-900/70 text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Home className="w-4 h-4" /> Home
                </button>

                <button
                  onClick={() => { onNavigate('shop'); setMobileMenuOpen(false); }}
                  className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-left transition ${
                    currentPage === 'shop' ? 'bg-emerald-500 text-zinc-950 font-black' : 'bg-zinc-900/70 text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> All Smartphones &amp; Tech
                </button>

                <button
                  onClick={() => { onNavigate('shop', 'pta_status=PTA approved'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 flex items-center gap-3 text-left"
                >
                  <ShieldCheck className="w-4 h-4" /> PTA Approved Phones
                </button>

                <button
                  onClick={() => { onNavigate('shop', 'pta_status=Non-PTA'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center gap-3 text-left"
                >
                  <Zap className="w-4 h-4" /> Non-PTA Phones
                </button>

                <button
                  onClick={() => { onNavigate('deals'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400 flex items-center gap-3 text-left"
                >
                  <Zap className="w-4 h-4 fill-current" /> Flash Deals
                </button>

                <button
                  onClick={() => { onNavigate('giveaways'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-yellow-950/40 border border-yellow-800/40 text-yellow-400 flex items-center gap-3 text-left"
                >
                  <Gift className="w-4 h-4" /> Monthly Giveaways
                </button>
              </div>

              {/* Popular Brands */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
                  Popular Brands
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  {['Apple', 'Samsung', 'Xiaomi', 'Google Pixel', 'Vivo', 'Infinix'].map(b => (
                    <button
                      key={b}
                      onClick={() => { onNavigate('shop', `brand=${encodeURIComponent(b)}`); setMobileMenuOpen(false); }}
                      className="min-h-[40px] px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left text-zinc-200 truncate"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Utilities */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs font-semibold">
                <button
                  onClick={() => { onNavigate('track'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-zinc-900 text-zinc-200 flex items-center gap-2.5 text-left"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" /> Track My Order
                </button>
                <button
                  onClick={() => { onNavigate('wishlist'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-zinc-900 text-zinc-200 flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-400" /> Saved Wishlist
                  </span>
                  <span className="text-rose-400 font-mono">{wishlist.length}</span>
                </button>
                <button
                  onClick={() => { onNavigate('contact'); setMobileMenuOpen(false); }}
                  className="w-full min-h-[42px] px-3.5 rounded-xl bg-zinc-900 text-zinc-200 flex items-center gap-2.5 text-left"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> Contact Support
                </button>
              </div>
            </div>

            {/* Drawer Footer: Account & Admin */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2 text-xs">
              <button
                onClick={() => { onNavigate(user ? 'account' : 'login'); setMobileMenuOpen(false); }}
                className="w-full min-h-[44px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>{user ? `Account: ${user.full_name}` : 'Customer Sign In / Register'}</span>
              </button>
              <button
                onClick={() => { onNavigate(isAdmin ? 'admin' : 'admin-login'); setMobileMenuOpen(false); }}
                className="w-full min-h-[40px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-semibold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isAdmin ? 'Open Admin Dashboard' : 'Store Admin Portal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
