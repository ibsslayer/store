import React from 'react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';

interface WishlistPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist } = useWishlist();

  return (
    <div className="space-y-8 pb-16">
      <div className="pb-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Your Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Phones and accessories you've saved for future consideration
          </p>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
        >
          Browse More →
        </button>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Your Wishlist is Empty</h2>
          <p className="text-xs text-zinc-400">
            Click the heart icon on any smartphone to save it here for quick access.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg"
          >
            Explore Phones
          </button>
        </div>
      )}
    </div>
  );
};
