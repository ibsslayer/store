import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check
} from 'lucide-react';
import { Product, Brand, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticFallback';

interface ShopPageProps {
  onNavigate: (page: string, param?: string) => void;
  initialQuery?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, initialQuery }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPtaStatus, setSelectedPtaStatus] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(600000);
  const [selectedRam, setSelectedRam] = useState('All');
  const [selectedStorage, setSelectedStorage] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse initialQuery
  useEffect(() => {
    if (initialQuery) {
      const params = new URLSearchParams(initialQuery);
      setSelectedBrand(params.get('brand') || 'All');
      setSelectedCategory(params.get('category') || 'All');
      setSelectedPtaStatus(params.get('pta_status') || 'All');
      setSearch(params.get('search') || '');
      setMinPrice(params.get('min_price') ? Number(params.get('min_price')) : 0);
      setMaxPrice(params.get('max_price') ? Number(params.get('max_price')) : 600000);
    }
  }, [initialQuery]);

  useEffect(() => {
    fetchProducts();
    apiFetch('/api/brands').then(r => (r.ok ? r.json() : [])).then(b => setBrands(Array.isArray(b) ? b : [])).catch(() => {});
    apiFetch('/api/categories').then(r => (r.ok ? r.json() : [])).then(c => setCategories(Array.isArray(c) ? c : [])).catch(() => {});
  }, []);

  // Close mobile drawer on Escape + lock body scroll
  useEffect(() => {
    if (!mobileFilterOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileFilterOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileFilterOpen]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/products');
      const data = res.ok ? await res.json() : [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter(p => {
    if (selectedBrand !== 'All' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
    if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedPtaStatus !== 'All' && p.pta_status !== selectedPtaStatus) return false;
    if (selectedCondition !== 'All' && p.condition !== selectedCondition) return false;
    if (p.selling_price < minPrice || p.selling_price > maxPrice) return false;
    if (selectedRam !== 'All' && p.ram !== selectedRam) return false;
    if (selectedStorage !== 'All' && p.storage !== selectedStorage) return false;
    if (inStockOnly && p.stock <= 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  filteredProducts.sort((a, b) => {
    if (sortBy === 'price_asc') return a.selling_price - b.selling_price;
    if (sortBy === 'price_desc') return b.selling_price - a.selling_price;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'discount') return (b.discount_percentage || 0) - (a.discount_percentage || 0);
    return (b.views_count || 0) - (a.views_count || 0);
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedBrand('All');
    setSelectedCategory('All');
    setSelectedPtaStatus('All');
    setSelectedCondition('All');
    setMinPrice(0);
    setMaxPrice(600000);
    setSelectedRam('All');
    setSelectedStorage('All');
    setInStockOnly(false);
    setSortBy('popular');
  };

  const activeFilterCount =
    (selectedBrand !== 'All' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPtaStatus !== 'All' ? 1 : 0) +
    (selectedCondition !== 'All' ? 1 : 0) +
    (minPrice > 0 || maxPrice < 600000 ? 1 : 0) +
    (selectedRam !== 'All' ? 1 : 0) +
    (selectedStorage !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const ramOptions = ['All', '4GB', '6GB', '8GB', '12GB', '16GB'];
  const storageOptions = ['All', '64GB', '128GB', '256GB', '512GB', '1TB'];

  const renderFilterControls = () => (
    <div className="space-y-5">
      {/* Search inside catalog */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
          Search by Keyword / SKU:
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="e.g. iPhone, S24, 256GB..."
            className="w-full min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* PTA STATUS FILTER */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
          PTA Compliance Status:
        </label>
        <div className="space-y-1.5">
          {['All', 'PTA approved', 'Non-PTA'].map(status => (
            <button
              type="button"
              key={status}
              onClick={() => setSelectedPtaStatus(status)}
              className={`w-full min-h-[40px] text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                selectedPtaStatus === status
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                  : 'text-zinc-300 bg-zinc-950/60 border border-zinc-800/60 hover:bg-zinc-800'
              }`}
            >
              <span>{status === 'All' ? 'All PTA Types' : status}</span>
              {selectedPtaStatus === status && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY FILTER */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* BRAND FILTER */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
          Brand:
        </label>
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          className="w-full min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Brands</option>
          {brands.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* PRICE RANGE FILTER */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1.5 gap-2">
          <span>Max Price:</span>
          <span className="text-emerald-400 font-mono truncate">
            Rs. {maxPrice.toLocaleString('en-PK')}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={600000}
          step={10000}
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-emerald-500 h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
          <span>Rs. 0</span>
          <span>Rs. 600,000</span>
        </div>
      </div>

      {/* CONDITION FILTER */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
          Device Condition:
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {['All', 'Brand new', 'Box packed', 'Used'].map(cond => (
            <button
              type="button"
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`min-h-[40px] p-2 rounded-xl text-center text-xs font-semibold transition ${
                selectedCondition === cond
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* RAM & STORAGE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">RAM:</label>
          <select
            value={selectedRam}
            onChange={e => setSelectedRam(e.target.value)}
            className="w-full min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white"
          >
            {ramOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Storage:</label>
          <select
            value={selectedStorage}
            onChange={e => setSelectedStorage(e.target.value)}
            className="w-full min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white"
          >
            {storageOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* IN STOCK ONLY TOGGLE */}
      <div className="pt-2 border-t border-zinc-800">
        <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-zinc-300 min-h-[40px]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
            className="w-5 h-5 rounded accent-emerald-500 bg-zinc-950"
          />
          <span>In Stock Devices Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-10 sm:pb-16">
      {/* Header bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white font-['Outfit']">
            All Mobile Phones &amp; Tech
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 sm:mt-1">
            Official prices in PKR with real-time stock and PTA transparency
          </p>
        </div>

        {/* Results count & Mobile filter trigger */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-800/60 font-mono">
            {filteredProducts.length} devices
          </span>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden min-h-[42px] px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-zinc-700 active:scale-95 transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Filter Pills */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        <button
          onClick={resetFilters}
          className={`flex-shrink-0 min-h-[36px] px-3 rounded-xl text-xs font-bold border transition ${
            activeFilterCount === 0
              ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800'
          }`}
        >
          All Devices
        </button>
        <button
          onClick={() => setSelectedPtaStatus(selectedPtaStatus === 'PTA approved' ? 'All' : 'PTA approved')}
          className={`flex-shrink-0 min-h-[36px] px-3 rounded-xl text-xs font-bold border transition ${
            selectedPtaStatus === 'PTA approved'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
              : 'bg-zinc-900 text-emerald-400 border-zinc-800'
          }`}
        >
          PTA Approved
        </button>
        <button
          onClick={() => setSelectedPtaStatus(selectedPtaStatus === 'Non-PTA' ? 'All' : 'Non-PTA')}
          className={`flex-shrink-0 min-h-[36px] px-3 rounded-xl text-xs font-bold border transition ${
            selectedPtaStatus === 'Non-PTA'
              ? 'bg-amber-500 text-zinc-950 border-amber-500'
              : 'bg-zinc-900 text-amber-400 border-zinc-800'
          }`}
        >
          Non-PTA
        </button>
        {['Apple', 'Samsung', 'Xiaomi', 'Google Pixel'].map(b => (
          <button
            key={b}
            onClick={() => setSelectedBrand(selectedBrand === b ? 'All' : b)}
            className={`flex-shrink-0 min-h-[36px] px-3 rounded-xl text-xs font-bold border transition ${
              selectedBrand === b
                ? 'bg-white text-zinc-950 border-white'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 1. FILTER SIDEBAR (Desktop) */}
        <aside className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" /> Filter Selection
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          {renderFilterControls()}
        </aside>

        {/* 2. PRODUCT GRID & SORT CONTROLS */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort Controls Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <span className="text-zinc-400 flex-shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 sm:flex-initial min-h-[40px] bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Latest Arrivals</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {search.trim() && (
                  <button
                    onClick={() => setSearch('')}
                    className="min-h-[28px] px-2.5 py-0.5 bg-zinc-800 text-zinc-200 rounded-lg flex items-center gap-1"
                  >
                    <span>&ldquo;{search}&rdquo;</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedBrand !== 'All' && (
                  <button
                    onClick={() => setSelectedBrand('All')}
                    className="min-h-[28px] px-2.5 py-0.5 bg-zinc-800 text-zinc-200 rounded-lg flex items-center gap-1"
                  >
                    <span>Brand: {selectedBrand}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCategory !== 'All' && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="min-h-[28px] px-2.5 py-0.5 bg-zinc-800 text-zinc-200 rounded-lg flex items-center gap-1"
                  >
                    <span>{selectedCategory}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedPtaStatus !== 'All' && (
                  <button
                    onClick={() => setSelectedPtaStatus('All')}
                    className="min-h-[28px] px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg flex items-center gap-1"
                  >
                    <span>PTA: {selectedPtaStatus}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCondition !== 'All' && (
                  <button
                    onClick={() => setSelectedCondition('All')}
                    className="min-h-[28px] px-2.5 py-0.5 bg-zinc-800 text-zinc-200 rounded-lg flex items-center gap-1"
                  >
                    <span>{selectedCondition}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {(minPrice > 0 || maxPrice < 600000) && (
                  <button
                    onClick={() => { setMinPrice(0); setMaxPrice(600000); }}
                    className="min-h-[28px] px-2.5 py-0.5 bg-zinc-800 text-zinc-200 rounded-lg flex items-center gap-1"
                  >
                    <span>Max: Rs. {maxPrice.toLocaleString('en-PK')}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={resetFilters}
                  className="min-h-[28px] px-2 text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Product Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-72 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Smartphones Matched Your Filters</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Try loosening your budget, clearing brand constraints, or switching PTA compliance options.
              </p>
              <button
                onClick={resetFilters}
                className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER (Synced 100% with Desktop Sidebar) */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-[90vw] max-w-sm bg-zinc-900 h-full border-l border-zinc-800 flex flex-col justify-between shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Filter Phones
              </span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {renderFilterControls()}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-2 flex-shrink-0 pb-safe">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full min-h-[44px] py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl transition"
              >
                Show {filteredProducts.length} Devices
              </button>
              <button
                onClick={resetFilters}
                className="w-full min-h-[40px] py-2 bg-zinc-800 text-zinc-300 text-xs rounded-xl font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
