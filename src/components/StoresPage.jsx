import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { fetchStores } from '../services/storeService';
import StoreCard from './StoreCard';
import { Search, Store, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function StoresPage() {
  const { currentLocation, availableStores } = useCart();
  const [stores, setStores] = useState(availableStores || []);
  const [isLoading, setIsLoading] = useState(!availableStores || availableStores.length === 0);
  const [errorMsg, setErrorMsg] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(99); // Default to All Distances (no stores hidden)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // Nearest First

  const loadLiveStores = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const lat = currentLocation?.latitude;
      const lon = currentLocation?.longitude;
      const locName = currentLocation?.name || '';
      const cityName = currentLocation?.city || '';

      const { stores: fetchedStores, error } = await fetchStores(lat, lon, locName, cityName);

      if (error) {
        setErrorMsg('Unable to load local stores. Please check connection.');
        setStores([]);
      } else {
        setStores(fetchedStores || []);
      }
    } catch {
      setErrorMsg('Unable to load local stores. Please try again.');
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (availableStores && availableStores.length > 0) {
      setStores(availableStores);
      setIsLoading(false);
    } else {
      loadLiveStores();
    }
  }, [availableStores, currentLocation]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = store.name.toLowerCase().includes(q);
        const matchCat = store.categories && store.categories.some(c => c.toLowerCase().includes(q));
        const matchAddr = (store.address || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchAddr) return false;
      }

      if (store.rating < minRating) return false;
      if (store.distanceKm != null && store.distanceKm > maxDistance) return false;
      if (selectedCategory !== 'all' && (!store.categories || !store.categories.includes(selectedCategory))) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      }
      if (sortBy === 'delivery') return parseInt(a.deliveryTime || '0') - parseInt(b.deliveryTime || '0');
      return (b.reviews || 0) - (a.reviews || 0);
    });
  }, [stores, searchQuery, minRating, maxDistance, selectedCategory, sortBy]);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>LOCAL GROCERY STORES • REAL TIME PROXIMITY</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            All Local Grocery Stores
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Choose a nearby store to order fresh groceries directly to your home in <strong className="text-stone-800">{currentLocation?.name || 'your area'}</strong>
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative md:w-80">
          <input
            type="text"
            placeholder="Search stores by name, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs font-semibold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="text-stone-500 uppercase tracking-wider text-[11px]">Filter By:</span>
          
          {/* Rating filter */}
          <div className="flex gap-1">
            {[0, 4.5, 4.8].map(r => (
              <button
                key={r}
                onClick={() => setMinRating(r)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  minRating === r ? 'bg-amber-500 text-white border-amber-500' : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}
              >
                {r === 0 ? 'All Ratings' : `${r}★+`}
              </button>
            ))}
          </div>

          {/* Max Distance filter */}
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800"
          >
            <option value={99}>All Distances</option>
            <option value={1.5}>Within 1.5 km</option>
            <option value={3}>Within 3.0 km</option>
            <option value={5}>Within 5.0 km</option>
            <option value={10}>Within 10.0 km</option>
          </select>
        </div>

        {/* SORT BY */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-stone-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800"
          >
            <option value="distance">Nearest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="delivery">Fastest Delivery</option>
          </select>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-700 mx-auto" />
          <p className="text-stone-500 font-bold text-xs">Loading local stores from Supabase...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {errorMsg && !isLoading && (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h4 className="font-display font-extrabold text-base text-rose-900">{errorMsg}</h4>
          <button
            onClick={loadLiveStores}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* EMPTY STORES STATE */}
      {!isLoading && !errorMsg && filteredStores.length === 0 && (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto space-y-2">
          <Store className="w-12 h-12 text-stone-400 mx-auto mb-1" />
          <h3 className="font-display text-lg font-bold text-stone-900">No local stores available in your area yet.</h3>
          <p className="text-stone-500 text-xs">Please check back later or try changing your delivery location.</p>
        </div>
      )}

      {/* STORES GRID */}
      {!isLoading && !errorMsg && filteredStores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

    </div>
  );
}
