import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X,
  Check,
  CheckCircle2
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
      if (params.get('brand')) setSelectedBrand(params.get('brand')!);
      if (params.get('category')) setSelectedCategory(params.get('category')!);
      if (params.get('pta_status')) setSelectedPtaStatus(params.get('pta_status')!);
      if (params.get('search')) setSearch(params.get('search')!);
      if (params.get('min_price')) setMinPrice(Number(params.get('min_price')));
      if (params.get('max_price')) setMaxPrice(Number(params.get('max_price')));
    }
  }, [initialQuery]);

  useEffect(() => {
    fetchProducts();
    apiFetch('/api/brands').then(r => r.json()).then(b => setBrands(b || []));
    apiFetch('/api/categories').then(r => r.json()).then(c => setCategories(c || []));
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/products');
      const data = await res.json();
      setProducts(data || []);
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

  // Sorting
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

  const ramOptions = ['All', '4GB', '6GB', '8GB', '12GB', '16GB'];
  const storageOptions = ['All', '64GB', '128GB', '256GB', '512GB', '1TB'];

  return (
    <div className="space-y-6 pb-16">
      {/* Header bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Browse All Mobile Phones & Gadgets
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Official prices in PKR with real-time stock and customs duty transparency
          </p>
        </div>

        {/* Results count & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/60 font-mono">
            {filteredProducts.length} devices found
          </span>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-zinc-700"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 1. FILTER SIDEBAR (Desktop) */}
        <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6 sticky top-24">
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
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
            <div className="space-y-1">
              {['All', 'PTA approved', 'Non-PTA'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedPtaStatus(status)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    selectedPtaStatus === status
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{status === 'All' ? 'All PTA Types' : status}</span>
                  {selectedPtaStatus === status && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* BRAND FILTER */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Brand:
            </label>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* PRICE RANGE FILTER */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1.5">
              <span>Price Range:</span>
              <span className="text-emerald-400 font-mono">
                Rs. {minPrice.toLocaleString('en-PK')} - {maxPrice.toLocaleString('en-PK')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={600000}
              step={10000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-500"
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
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`p-2 rounded-xl text-center text-xs font-semibold transition ${
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white"
              >
                {storageOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* IN STOCK ONLY TOGGLE */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 bg-zinc-950"
              />
              <span>In Stock Devices Only</span>
            </label>
          </div>
        </div>

        {/* 2. PRODUCT GRID & SORT CONTROLS */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort Controls Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Latest Arrivals</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>

            {/* Active filter chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {selectedBrand !== 'All' && (
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-1">
                  Brand: {selectedBrand}
                  <button onClick={() => setSelectedBrand('All')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedPtaStatus !== 'All' && (
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-lg flex items-center gap-1">
                  PTA: {selectedPtaStatus}
                  <button onClick={() => setSelectedPtaStatus('All')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {maxPrice < 600000 && (
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-1">
                  Max: Rs. {maxPrice.toLocaleString('en-PK')}
                  <button onClick={() => setMaxPrice(600000)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          </div>

          {/* Product Cards */}
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p>Loading smartphone catalogue...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Smartphones Matched Your Filters</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Try loosening your budget, clearing brand constraints, or switching PTA compliance options.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xs bg-zinc-900 h-full p-6 overflow-y-auto space-y-6 border-l border-zinc-800 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="font-bold text-white text-base">Filter Phones</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PTA Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">PTA Status:</label>
                <select
                  value={selectedPtaStatus}
                  onChange={e => setSelectedPtaStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="All">All PTA Types</option>
                  <option value="PTA approved">PTA approved</option>
                  <option value="Non-PTA">Non-PTA</option>
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Brand:</label>
                <select
                  value={selectedBrand}
                  onChange={e => setSelectedBrand(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="All">All Brands</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Max Price: Rs. {maxPrice.toLocaleString('en-PK')}
                </label>
                <input
                  type="range"
                  min={0}
                  max={600000}
                  step={10000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Condition:</label>
                <select
                  value={selectedCondition}
                  onChange={e => setSelectedCondition(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="All">All Conditions</option>
                  <option value="Brand new">Brand new</option>
                  <option value="Box packed">Box packed</option>
                  <option value="Used">Used (10/10)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl"
              >
                Apply Filters ({filteredProducts.length} devices)
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2 bg-zinc-800 text-zinc-400 text-xs rounded-xl font-semibold"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
