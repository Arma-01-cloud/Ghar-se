import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { fetchProductsByStore } from '../services/productService';
import { 
  ShoppingBag, Search, Upload, Plus, Minus, 
  MapPin, AlertCircle, ArrowRight, Loader2, RefreshCw, ShoppingCart 
} from 'lucide-react';

export default function AnyStoreOrderBuilder() {
  const { 
    setActiveTab, currentLocation, setIsLocationModalOpen, 
    addToast, placeAnyStoreOrder 
  } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Custom items cart state for "Shop From Any Store" request
  const [requestCart, setRequestCart] = useState([]);

  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Meadows Apartment, Indiranagar, Bengaluru - 560038');
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'All',
    'Fruits & Vegetables',
    'Dairy & Eggs',
    'Atta & Rice',
    'Pulses',
    'Oil & Masala',
    'Snacks',
    'Beverages',
    'Personal Care',
    'Household'
  ];

  const loadLiveProducts = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const fetchedProducts = await fetchProductsByStore();
      if (!fetchedProducts || fetchedProducts.length === 0) {
        setProducts([]);
      } else {
        setProducts(fetchedProducts);
      }
    } catch {
      setErrorMsg('Unable to load live grocery products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveProducts();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'All' || (p.category || '').toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const handleAddToCart = (product) => {
    setRequestCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit || '1 unit',
        price: product.price || 50,
        image: product.image || '/images/cat_veg_fruits.jpg'
      }];
    });
    addToast(`Added "${product.name}" to your grocery request!`, 'success');
  };

  const handleUpdateQuantity = (productId, delta) => {
    setRequestCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const subtotal = requestCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 49;
  const estimatedTotal = subtotal + deliveryFee;

  const handlePlaceRequest = async () => {
    if (requestCart.length === 0) {
      addToast('Please add at least one product to your grocery request.', 'error');
      return;
    }

    setIsSubmitting(true);

    const newOrder = placeAnyStoreOrder(requestCart, {
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      totalAmount: estimatedTotal,
      address: deliveryAddress,
      paymentMethod: paymentMethod,
      locationName: currentLocation?.name || 'Indiranagar, Bengaluru'
    });

    setIsSubmitting(false);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* PAGE HEADER */}
      <div className="bg-gradient-to-r from-[#0E382B] via-[#134E3A] to-[#0A2E23] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border border-emerald-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHOP FROM ANY STORE • SUPABASE LIVE PRODUCTS</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
              Shop From Any Store
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Tell us what groceries you need. We'll find them from a suitable local store in your area.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* SMALL SECONDARY ACTION: UPLOAD GROCERY LIST */}
            <button
              onClick={() => setActiveTab('upload')}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md backdrop-blur-md"
              title="Upload handwritten grocery list image"
            >
              <Upload className="w-4 h-4 text-emerald-300" />
              <span>📷 Upload Grocery List</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CATALOG & CART CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRODUCT SEARCH, CATEGORIES & CATALOG GRID */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SEARCH STRIP */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search groceries (e.g. Tomatoes, Milk, Rice)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>
          </div>

          {/* CATEGORY CHIPS SCROLLER */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-md'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-700 mx-auto" />
              <p className="text-stone-500 font-bold text-xs">Loading live products from Supabase...</p>
            </div>
          )}

          {/* ERROR STATE */}
          {errorMsg && !isLoading && (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3 max-w-md mx-auto">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h4 className="font-display font-extrabold text-base text-rose-900">{errorMsg}</h4>
              <button
                onClick={loadLiveProducts}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* EMPTY PRODUCTS STATE */}
          {!isLoading && !errorMsg && filteredProducts.length === 0 && (
            <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto space-y-2">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-1" />
              <h3 className="font-display text-lg font-bold text-stone-900">No products available right now.</h3>
              <p className="text-stone-500 text-xs">Try selecting another category or searching for something else.</p>
            </div>
          )}

          {/* PRODUCT CARDS GRID */}
          {!isLoading && !errorMsg && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => {
                const cartItem = requestCart.find(i => i.id === product.id);
                const qty = cartItem ? cartItem.quantity : 0;

                return (
                  <div 
                    key={product.id}
                    className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-square">
                        <img 
                          src={product.image || '/images/cat_veg_fruits.jpg'} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">{product.category || 'Grocery'}</span>
                        <h4 className="font-display font-extrabold text-sm text-stone-900 line-clamp-1">{product.name}</h4>
                        <p className="text-[11px] text-stone-400 font-medium">{product.unit || '1 kg'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="font-display font-black text-base text-stone-900">₹{product.price}</span>

                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="py-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-emerald-800 text-white px-2 py-1 rounded-xl font-bold text-xs shadow-xs">
                          <button onClick={() => handleUpdateQuantity(product.id, -1)} className="hover:text-emerald-300">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span>{qty}</span>
                          <button onClick={() => handleUpdateQuantity(product.id, 1)} className="hover:text-emerald-300">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: "ANY STORE" GROCERY REQUEST CART */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5 sticky top-24">
            
            {/* CART HEADER */}
            <div className="border-b border-stone-100 pb-3 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-lg text-stone-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-700" />
                  <span>Your Grocery Request</span>
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  ANY_STORE
                </span>
              </div>
              <p className="text-stone-500 text-xs font-medium">
                Store: Fulfilling from a suitable local store
              </p>
            </div>

            {/* CART ITEMS LIST */}
            {requestCart.length === 0 ? (
              <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-1">
                <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs font-bold text-stone-700">Your grocery request is empty.</p>
                <p className="text-[11px] text-stone-500">Browse the catalog on the left to add products.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {requestCart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <img src={item.image} alt="" className="w-9 h-9 rounded-xl object-cover bg-stone-100" onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }} />
                      <div>
                        <span className="font-bold text-stone-900 block truncate max-w-[130px]">{item.name}</span>
                        <span className="text-[11px] text-stone-400 font-medium">{item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-lg text-stone-800 font-bold">
                        <button onClick={() => handleUpdateQuantity(item.id, -1)} className="hover:text-rose-600">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, 1)} className="hover:text-emerald-700">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-stone-900">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DELIVERY ADDRESS */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Deliver To
                </span>
                <button onClick={() => setIsLocationModalOpen(true)} className="text-emerald-700 font-extrabold text-[11px] underline">
                  Change
                </button>
              </div>
              <p className="text-[11px] text-stone-600 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                {currentLocation?.name || deliveryAddress}
              </p>
            </div>

            {/* TOTAL & SUBMIT */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="space-y-1 text-xs font-semibold text-stone-500">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-stone-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Delivery Fee</span>
                  <span className="font-bold text-emerald-800">₹{deliveryFee}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-black text-stone-900 border-t border-stone-200 pt-2">
                <span>Estimated Total</span>
                <span className="text-emerald-950 text-base font-black">₹{estimatedTotal}</span>
              </div>

              <button
                onClick={handlePlaceRequest}
                disabled={isSubmitting || requestCart.length === 0}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                <span>PLACE GROCERY REQUEST</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
