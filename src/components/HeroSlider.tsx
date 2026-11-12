import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeroSliderProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenAiAdvisor: () => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate, onOpenAiAdvisor }) => {
  const { settings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultBanners = [
    {
      id: 'banner-1',
      title: 'iPhone 16 Pro Max',
      subtitle: 'Grade 5 Titanium. Official PTA Approved. 48MP Fusion Camera with Camera Control.',
      badge: 'OFFICIAL PAKISTAN STOCK • 100% DUTY PAID',
      cta_text: 'Shop iPhone 16 Pro Max',
      cta_link: 'product/apple-iphone-16-pro-max-256gb-desert-titanium',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80',
      price: 'Rs. 549,999'
    },
    {
      id: 'banner-2',
      title: 'Samsung Galaxy S24 Ultra',
      subtitle: 'Galaxy AI is here. 200MP ProVisual Engine, Flat Gorilla Armor Display & S-Pen.',
      badge: 'SAVE RS. 35,000 • OFFICIAL SAMSUNG WARRANTY',
      cta_text: 'Explore Galaxy S24 Ultra',
      cta_link: 'product/samsung-galaxy-s24-ultra-512gb-titanium-gray',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&auto=format&fit=crop&q=80',
      price: 'Rs. 414,999'
    },
    {
      id: 'banner-3',
      title: 'Xiaomi 14T Pro 5G',
      subtitle: 'Co-engineered with Leica. Dimensity 9300+ with 120W HyperCharge (0-100% in 19 mins).',
      badge: 'NEW ARRIVAL • LEICA CAMERA FLAGSHIP',
      cta_text: 'View Xiaomi 14T Pro',
      cta_link: 'product/xiaomi-14t-pro-512gb-titan-gray',
      image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&auto=format&fit=crop&q=80',
      price: 'Rs. 214,999'
    }
  ];

  const banners = settings.hero_banners?.length > 0 ? settings.hero_banners : defaultBanners;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const slide = banners[currentSlide] || banners[0];

  return (
    <div className="relative overflow-hidden bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl my-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent z-10" />

      {/* Banner Image */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 opacity-40 lg:opacity-85 mix-blend-lighten pointer-events-none">
        <img
          src={slide.image_url}
          alt={slide.title}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 lg:hidden" />
      </div>

      {/* Slide Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 sm:py-20 lg:py-24 grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>{slide.badge || 'PTA APPROVED FLAGSHIP'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-['Outfit']">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {slide.subtitle}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (slide.cta_link?.startsWith('product/')) {
                  onNavigate('product', slide.cta_link.replace('product/', ''));
                } else {
                  onNavigate('shop');
                }
              }}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all hover:gap-3 active:scale-95"
            >
              <span>{slide.cta_text || 'Shop Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAiAdvisor}
              className="px-5 py-3.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Ask AI Phone Advisor</span>
            </button>
          </div>

          {/* Quick Perks Bar */}
          <div className="flex items-center gap-6 pt-4 text-xs text-zinc-400 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Same-Day Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>JazzCash / Easypaisa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() => setCurrentSlide((currentSlide - 1 + banners.length) % banners.length)}
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 bg-emerald-400' : 'w-2 bg-zinc-700'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((currentSlide + 1) % banners.length)}
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
