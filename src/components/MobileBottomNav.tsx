import React from 'react';
import { Home, Smartphone, Flame, MapPin, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentPage, onNavigate }) => {
  const { itemCount } = useCart();

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'shop', label: 'Shop', icon: Smartphone },
    { id: 'deals', label: 'Deals', icon: Flame },
    { id: 'track', label: 'Track', icon: MapPin },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: itemCount }
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 pb-safe"
    >
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition active:scale-95 ${
                isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-emerald-500 text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-6 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
