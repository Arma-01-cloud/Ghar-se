import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { STORES } from '../data/stores';
import { fetchCustomerProducts } from '../services/productService';
import ProductCard from './ProductCard';
import GroceryListSection from './GroceryListSection';
import { 
  Star, MapPin, Clock, Heart, Store, Search, ArrowLeft, 
  CheckCircle2, Phone, Package, RefreshCw 
} from 'lucide-react';

export default function StoreDetailPage() {
  const { 
    selectedStoreId, 
    currentStore, 
    setCurrentStore, 
    favoriteStores, 
    toggleFavoriteStore, 
    setActiveTab 
  } = useCart();

  const store = useMemo(() => {
    return STORES.find(s => s.id === selectedStoreId) || currentStore || STORES[0];
  }, [selectedStoreId, currentStore]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [liveProducts, setLiveProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isFavorite = favoriteStores ? favoriteStores.includes(store.id) : false;
  const isSelected = currentStore && currentStore.id === store.id;

  const handleSelectThisStore = () => {
    setCurrentStore(store);
  };

  // Fetch store-specific products from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      if (!store?.id) return;
      setIsLoading(true);
      const prods = await fetchCustomerProducts(store.id);
      if (isMounted) {
        setLiveProducts(prods || []);
        setIsLoading(false);
      }
    }
    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [store?.id]);

  // Filter products by search and category
  const storeProducts = useMemo(() => {
    return liveProducts.filter(product => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(q);
        const matchesCat = product.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      return true;
    });
  }, [liveProducts, searchQuery, selectedCategory]);

  const categoriesFromProducts = useMemo(() => {
    const cats = new Set();
    liveProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [liveProducts]);

  const shopkeeperPhone = store.phone || store.shopkeeperPhone || '+91 81238 21300';
  const categoriesList = categoriesFromProducts.length > 0 
    ? categoriesFromProducts 
    : (Array.isArray(store.categories) && store.categories.length > 0 ? store.categories : ['Groceries', 'Dairy & Eggs', 'Cooking Essentials']);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* BACK LINK & CURRENT STORE INDICATOR */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('stores')}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Stores
        </button>

        {!isSelected ? (
          <button
            onClick={handleSelectThisStore}
            className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Set as My Store
          </button>
        ) : (
          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-emerald-300">
            ✓ Currently Shopping Here
          </span>
        )}
      </div>

      {/* STORE HERO BANNER CARD */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-stone-200 shadow-md">
        <div className="h-48 sm:h-64 relative bg-stone-900">
          <img
            src={store.image || store.image_url || store.imageUrl || '/images/store_lakshmi.jpg'}
            alt={store.name}
            className="w-full h-full object-cover opacity-90"
            onError={(e) => { e.target.src = '/images/store_lakshmi.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />

          {/* FAVORITE BUTTON OVERLAY */}
          <button
            onClick={() => toggleFavoriteStore(store.id)}
            className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isFavorite ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/80 text-stone-700 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* STORE INFO FOOTER STRIP */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                  🟢 {store.status || 'Open'} • Closes {store.closingTime || '10:00 PM'}
                </span>
                <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-0.5 rounded-md">
                  📦 {liveProducts.length} Items in Store
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900">
                {store.name}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" /> {store.address || `${store.locality}, ${store.city}`} ({store.distance || '1.2 km'} away)
              </p>

              {/* SHOPKEEPER CONTACT BADGE */}
              <div className="inline-flex flex-wrap items-center gap-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-xs font-bold text-emerald-950 mt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-700" /> Shopkeeper: <strong>{shopkeeperPhone}</strong>
                </span>
                <div className="flex gap-1.5">
                  <a
                    href={`tel:${shopkeeperPhone.replace(/\s+/g, '')}`}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition-colors"
                  >
                    📞 Call
                  </a>
                  <a
                    href={`https://wa.me/${shopkeeperPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-extrabold rounded-xl transition-colors"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center shrink-0">
              <div>
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Rating</span>
                <span className="font-black text-lg text-amber-500 flex items-center gap-0.5 justify-center">
                  <Star className="w-4 h-4 fill-amber-400" /> {store.rating || 5.0}
                </span>
              </div>
              <div className="border-l border-stone-200 pl-4">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">Delivery</span>
                <span className="font-black text-base text-emerald-950 flex items-center gap-1 justify-center">
                  <Clock className="w-4 h-4 text-emerald-700" /> {store.deliveryTime || '15-25 min'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            {categoriesList.map((c, i) => (
              <span key={i} className="bg-stone-100 text-stone-700 text-xs font-extrabold px-3 py-1 rounded-lg">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH PRODUCTS IN STORE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-stone-900">
              Available Groceries at {store.name}
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Live inventory verified directly from this store.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder={`Search products in ${store.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-600 font-semibold placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* PRODUCTS GRID / EMPTY STATE */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">Loading products from {store.name}...</p>
          </div>
        ) : storeProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3 max-w-md mx-auto shadow-xs">
            <Package className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-display font-extrabold text-stone-900 text-lg">
              {searchQuery ? 'No matching items in this store' : 'No items added to this store yet'}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {searchQuery 
                ? 'Try searching with different terms or check other categories.'
                : 'The administrator or shopkeeper is currently preparing the catalog for this location.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {storeProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={{
                  ...product,
                  storeId: store.id,
                  storeName: store.name
                }} 
              />
            ))}
          </div>
        )}
      </div>

      {/* STORE GROCERY LIST BUILDER */}
      <div className="pt-8 border-t border-stone-200">
        <div className="text-center mb-6">
          <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">STORE LIST CONVERTER</span>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            Build Grocery List for {store.name}
          </h3>
        </div>
        <GroceryListSection />
      </div>

    </div>
  );
}
