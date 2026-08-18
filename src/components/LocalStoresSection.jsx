import React from 'react';
import { useCart } from '../context/CartContext';
import StoreCard from './StoreCard';
import { Store, ChevronRight, MapPin } from 'lucide-react';

export default function LocalStoresSection() {
  const { setActiveTab, availableStores, currentLocation, setIsLocationModalOpen } = useCart();

  // Show only 4 stores on the Home page
  const displayedStores = (availableStores || []).slice(0, 4);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* LOCATION SELECTOR STRIP */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-extrabold block">Deliver To</span>
            <p className="font-extrabold text-sm text-white">{currentLocation?.name || 'Indiranagar, Bengaluru'}</p>
          </div>
        </div>

        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-900/80 px-3.5 py-2 rounded-xl border border-emerald-700/60 transition-colors cursor-pointer"
        >
          Change Location 📍
        </button>
      </div>

      {/* SECTION HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">LOCAL DARKSTORES • SORTED BY DISTANCE</span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900 mt-1">
            Shop From Your Favorite Store
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Choose a local store near you with delivery done after 4:00 PM.
          </p>
        </div>

        {availableStores.length > 4 && (
          <button
            onClick={() => setActiveTab('stores')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-800 hover:underline shrink-0 cursor-pointer"
          >
            <span>View All Stores ({availableStores.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {availableStores.length === 0 && (
        <div className="py-12 text-center bg-stone-50 rounded-3xl border border-stone-200 p-6 max-w-md mx-auto space-y-2">
          <Store className="w-10 h-10 text-stone-400 mx-auto" />
          <h4 className="font-display font-extrabold text-base text-stone-800">No stores found near this location.</h4>
          <p className="text-stone-500 text-xs">Please try changing your delivery location.</p>
        </div>
      )}

      {/* STORES GRID (SHOWS MAXIMUM 4 STORES ON HOME PAGE) */}
      {displayedStores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedStores.map(store => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {/* SHOW MORE STORES CTA BUTTON */}
      {availableStores.length > 4 && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setActiveTab('stores')}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-950 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl border-2 border-emerald-700/80 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 group cursor-pointer active:scale-95"
          >
            <Store className="w-4.5 h-4.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Show More</span>
            <ChevronRight className="w-4 h-4 text-emerald-300 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

    </section>
  );
}
