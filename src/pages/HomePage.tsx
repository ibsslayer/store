import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight,
  Sparkles,
  Truck,
  CheckCircle,
  Star,
  Flame,
  Phone,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Product, Brand, Category, Giveaway } from '../types';
import { ProductCard } from '../components/ProductCard';
import { HeroSlider } from '../components/HeroSlider';
import { useSettings } from '../context/SettingsContext';

interface HomePageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenAiAdvisor: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenAiAdvisor }) => {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Flash Sale Countdown (ends at midnight or 12 hours)
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/brands').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/giveaways').then(r => r.json())
    ])
      .then(([pData, bData, cData, gData]) => {
        setProducts(pData || []);
        setBrands(bData || []);
        setCategories(cData || []);
        setGiveaways(gData || []);
      })
      .catch(err => console.error('Failed to load homepage data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const featuredPhones = products.filter(p => p.is_featured).slice(0, 4);
  const bestSellers = products.filter(p => p.is_best_seller || p.views_count > 2000).slice(0, 4);
  const ptaApproved = products.filter(p => p.pta_status === 'PTA approved').slice(0, 4);
  const usedPhones = products.filter(p => p.condition === 'Used').slice(0, 4);
  const accessories = products.filter(p => p.category.includes('Chargers') || p.category.includes('Audio') || p.category.includes('Smartwatches')).slice(0, 4);

  const activeGiveaway = giveaways.find(g => !g.is_closed) || giveaways[0];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SLIDER */}
      <HeroSlider onNavigate={onNavigate} onOpenAiAdvisor={onOpenAiAdvisor} />

      {/* 2. FLASH SALE SECTION WITH LIVE COUNTDOWN */}
      <section className="bg-gradient-to-r from-rose-950/80 via-zinc-900 to-zinc-900 rounded-3xl border border-rose-900/50 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-lg uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-current" />
              <span>Limited Stock Flash Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              Today's Mega Discounts
            </h2>
            <p className="text-xs text-zinc-400">
              Prices guaranteed lowest in Pakistan. Valid until timer reaches zero or stock exhausts.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 text-center">
            <div className="bg-zinc-950 border border-rose-900/60 p-3 rounded-2xl min-w-[64px]">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Hours</div>
            </div>
            <span className="text-xl font-bold text-rose-500">:</span>
            <div className="bg-zinc-950 border border-rose-900/60 p-3 rounded-2xl min-w-[64px]">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Mins</div>
            </div>
            <span className="text-xl font-bold text-rose-500">:</span>
            <div className="bg-zinc-950 border border-rose-900/60 p-3 rounded-2xl min-w-[64px]">
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase">Secs</div>
            </div>
          </div>
        </div>

        {/* Flash sale cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 3. SHOP BY BRAND */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Shop by Official Brand
            </h2>
            <p className="text-xs text-zinc-400">
              Direct official distribution with authorized Pakistan warranty partners
            </p>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {brands.map(brand => (
            <div
              key={brand.id}
              onClick={() => onNavigate('shop', `brand=${encodeURIComponent(brand.name)}`)}
              className="p-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 group transition text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-950 p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition duration-300"
                />
              </div>
              <span className="text-xs font-bold text-zinc-300 group-hover:text-emerald-400 transition">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PTA APPROVED SMARTPHONES SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Tax Paid
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                PTA Approved Smartphones
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Guaranteed official customs tax cleared. Permanent SIM functionality on Jazz, Zong, Telenor & Ufone.
            </p>
          </div>

          <button
            onClick={() => onNavigate('shop', 'pta_status=PTA approved')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition self-start sm:self-auto"
          >
            <span>Browse All PTA Approved</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ptaApproved.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 5. SHOP BY PRICE BRACKET (PKR) */}
      <section className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Shop by Budget (Pakistani Rupees)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Filter devices that fit your pocket with guaranteed best market rates
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('shop', 'max_price=50000')}
            className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl text-left transition group"
          >
            <div className="text-xs text-zinc-400">Budget Range</div>
            <div className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 mt-1">
              Under Rs. 50,000
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              Explore 15+ models →
            </div>
          </button>

          <button
            onClick={() => onNavigate('shop', 'min_price=50000&max_price=100000')}
            className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl text-left transition group"
          >
            <div className="text-xs text-zinc-400">Mid-Range Kings</div>
            <div className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 mt-1">
              Rs. 50,000 - 100,000
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              Explore 25+ models →
            </div>
          </button>

          <button
            onClick={() => onNavigate('shop', 'min_price=100000&max_price=250000')}
            className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl text-left transition group"
          >
            <div className="text-xs text-zinc-400">Premium Tech</div>
            <div className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 mt-1">
              Rs. 100,000 - 250,000
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              Explore 18+ models →
            </div>
          </button>

          <button
            onClick={() => onNavigate('shop', 'min_price=250000')}
            className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl text-left transition group"
          >
            <div className="text-xs text-zinc-400">Ultra Flagships</div>
            <div className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 mt-1">
              Rs. 250,000+
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
              iPhone & Galaxy Ultra →
            </div>
          </button>
        </div>
      </section>

      {/* 6. GIVEAWAY TEASER HERO */}
      {activeGiveaway && (
        <section className="bg-gradient-to-r from-amber-950/70 via-zinc-950 to-zinc-900 rounded-3xl border border-amber-500/40 p-6 sm:p-10 shadow-2xl grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Gift className="w-4 h-4" />
              <span>Official Pakistan Tech Giveaway</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] leading-tight">
              Win an Apple iPhone 16 Pro Max (Official PTA Approved)
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {activeGiveaway.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>100% Free Entry</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <span>Total Registered Entries: <strong>{activeGiveaway.total_entries.toLocaleString('en-PK')}</strong></span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('giveaways')}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-95"
              >
                <span>Enter Giveaway for Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-950 shadow-2xl">
            <img
              src={activeGiveaway.image_url}
              alt={activeGiveaway.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-700/60 text-xs text-zinc-200">
              <div className="font-bold text-amber-400">Prize Details:</div>
              <div>{activeGiveaway.prize_details}</div>
            </div>
          </div>
        </section>
      )}

      {/* 7. BEST-SELLING PHONES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Best-Selling Smartphones in Pakistan
            </h2>
            <p className="text-xs text-zinc-400">
              High customer satisfaction, verified PTA approval, and immediate dispatch
            </p>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>See All Best-Sellers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bestSellers.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 8. ACCESSORIES & FAST CHARGERS */}
      {accessories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                Original Chargers, Audio & Gadgets
              </h2>
              <p className="text-xs text-zinc-400">
                Anker GaN fast chargers, Apple 20W adapters, AirPods Pro 2, Galaxy Buds
              </p>
            </div>
            <button
              onClick={() => onNavigate('shop', 'category=Chargers & Adapters')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <span>View Accessories</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accessories.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* 9. REAL PAKISTANI CUSTOMER REVIEWS */}
      <section className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Star className="w-4 h-4 fill-current" />
            <span>4.9 / 5.0 Rated by 12,000+ Customers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Trusted by Smartphone Lovers Nationwide
          </h2>
          <p className="text-xs text-zinc-400">
            Real feedback from verified Pakistani buyers across Karachi, Lahore, Islamabad, and Faisalabad.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h4 className="font-bold text-white text-sm">
              "100% Genuine PTA Approved & Super Fast Delivery"
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Received my iPhone 16 Pro Max in Lahore in under 24 hours. Checked IMEI on 8484 and DIRBS portal, official customs cleared. Sealed box with authentic warranty slip.
            </p>
            <div className="text-xs font-bold text-zinc-300 pt-2 border-t border-zinc-900 flex justify-between">
              <span>Zeeshan Malik</span>
              <span className="text-emerald-400">Gulberg, Lahore</span>
            </div>
          </div>

          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h4 className="font-bold text-white text-sm">
              "Paid via Bank Alfalah, Verified in 15 Mins"
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ordered the Galaxy S24 Ultra. Selected bank transfer at checkout, uploaded my receipt screenshot, and got instant WhatsApp confirmation from their accounts desk. Excellent service!
            </p>
            <div className="text-xs font-bold text-zinc-300 pt-2 border-t border-zinc-900 flex justify-between">
              <span>Dr. Tariq Mahmood</span>
              <span className="text-emerald-400">Clifton, Karachi</span>
            </div>
          </div>

          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <h4 className="font-bold text-white text-sm">
              "Smooth WhatsApp Ordering Experience"
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Clicked "Order on WhatsApp" and the sales agent immediately confirmed color availability and dispatched via Leopards courier to Islamabad with full insurance. Highly recommended!
            </p>
            <div className="text-xs font-bold text-zinc-300 pt-2 border-t border-zinc-900 flex justify-between">
              <span>Maryam Nawaz Khan</span>
              <span className="text-emerald-400">Sector F-10, Islamabad</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
