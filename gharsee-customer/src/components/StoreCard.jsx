import React from 'react';
import { useCart } from '../context/CartContext';
import { Star, MapPin, Clock, Heart, Store, ChevronRight, Phone } from 'lucide-react';

export default function StoreCard({ store, onSelectStore }) {
  const { currentStore, setCurrentStore, favoriteStores, toggleFavoriteStore, setActiveTab, setSelectedStoreId } = useCart();

  if (!store) return null;

  const isFavorite = favoriteStores ? favoriteStores.includes(store.id) : false;
  const isSelected = currentStore && currentStore.id === store.id;

  const handleShopNow = (e) => {
    e.stopPropagation();
    setCurrentStore(store);
    setSelectedStoreId(store.id);
    if (onSelectStore) {
      onSelectStore(store);
    } else {
      setActiveTab('store-detail');
    }
  };

  const shopkeeperPhone = store.phone || store.shopkeeperPhone || '+91 81238 21300';
  const categoriesList = Array.isArray(store.categories) && store.categories.length > 0 
    ? store.categories 
    : ['Groceries', 'Dairy & Eggs', 'Cooking Essentials'];

  const distanceText = typeof store.distance === 'string' && store.distance.includes('km')
    ? store.distance
    : `${store.distanceKm || store.distance || 1.2} km away`;

  const isStoreOpen = store.isOpen !== false && store.status !== 'Closed' && store.status !== 'closed' && store.is_open !== false;

  return (
    <div
      onClick={handleShopNow}
      className={`group relative bg-white rounded-3xl border p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-stone-200/80 hover:border-emerald-300 hover:shadow-xl'
      }`}
    >
      {/* STORE IMAGE & FAVORITE BUTTON */}
      <div className="relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden bg-stone-100 mb-3">
        <img
          src={store.image || store.image_url || '/images/store_lakshmi.jpg'}
          alt={store.name || 'Local Grocery Store'}
          className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ${!isStoreOpen ? 'grayscale-25 opacity-90' : ''}`}
        />

        {/* STATUS & RATING OVERLAYS */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`font-extrabold text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-xs ${
            isStoreOpen 
              ? 'bg-emerald-800/90 text-white' 
              : 'bg-rose-600/95 text-white'
          }`}>
            {isStoreOpen ? `🟢 ${store.status || 'Open'}` : '🔴 Closed'}
          </span>
          {isSelected && (
            <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs uppercase">
              SELECTED
            </span>
          )}
        </div>

        {/* FAVORITE BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteStore(store.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/80 text-stone-600 hover:text-rose-500 hover:bg-white'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorite stores'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* STORE DETAILS */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-black text-base sm:text-lg text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors">
            {store.name}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-900 font-extrabold text-xs px-2 py-0.5 rounded-md shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{store.rating || 5.0}</span>
            <span className="text-stone-400 font-normal text-[11px]">({store.reviews || 120})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {distanceText}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-700" /> {store.deliveryTime || 'Delivery after 4:00 PM'}
          </span>
        </div>

        {/* SHOPKEEPER PHONE BADGE & DIRECT ACTION LINKS */}
        <div className="flex items-center justify-between text-xs bg-emerald-50/90 p-2.5 rounded-2xl border border-emerald-200/90 mt-1">
          <div className="flex items-center gap-1.5 font-extrabold text-emerald-950 truncate">
            <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{shopkeeperPhone}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <a
              href={`tel:${shopkeeperPhone.replace(/\s+/g, '')}`}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1"
            >
              📞 Call
            </a>
            <a
              href={`https://wa.me/${shopkeeperPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1"
            >
              💬 WA
            </a>
          </div>
        </div>

        {/* CATEGORIES BADGES */}
        <div className="flex flex-wrap gap-1 pt-1">
          {categoriesList.slice(0, 3).map((cat, idx) => (
            <span key={idx} className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* SHOP NOW BUTTON */}
      <div className="pt-3 mt-3 border-t border-stone-100">
        <button
          type="button"
          onClick={handleShopNow}
          className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            isSelected
              ? 'bg-emerald-800 text-white shadow-md'
              : !isStoreOpen
              ? 'bg-stone-700 hover:bg-stone-800 text-white shadow-xs'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>
            {isSelected 
              ? (isStoreOpen ? 'SHOPPING HERE' : 'CURRENT STORE (CLOSED)') 
              : (isStoreOpen ? 'SHOP NOW' : 'VIEW STORE (CLOSED)')
            }
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
