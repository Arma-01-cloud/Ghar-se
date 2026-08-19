import React from 'react';
import { useCart } from '../context/CartContext';
import StoreCard from './StoreCard';
import { Heart, Store, ChevronRight } from 'lucide-react';

export default function FavoriteStoresSection() {
  const { favoriteStores, availableStores, setActiveTab } = useCart();

  const favStoreObjects = (availableStores || []).filter(s => favoriteStores.includes(s.id));

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-stone-200/60">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>QUICK ACCESS</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
            Your Favorite Stores
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Your go-to local stores, always within reach.
          </p>
        </div>

        {favStoreObjects.length > 0 && (
          <button
            onClick={() => setActiveTab('stores')}
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
          >
            <span>View All Stores ({(availableStores || []).length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {favStoreObjects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="font-display font-extrabold text-base text-stone-900">
            No favorite stores added yet
          </h4>
          <p className="text-stone-500 text-xs">
            Save your favorite local stores for faster ordering every morning.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('stores')}
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>EXPLORE STORES</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {favStoreObjects.map(store => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </section>
  );
}