import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { fetchProductsByStore } from '../services/productService';
import AnyStoreCheckoutModal from './AnyStoreCheckoutModal';
import { 
  ShoppingBag, Search, Upload, Plus, Minus, 
  MapPin, AlertCircle, ArrowRight, Loader2, RefreshCw, ShoppingCart,
  Sparkles, FileText
} from 'lucide-react';
import { getUnitVariants, getProductWithVariant } from '../utils/unitVariants';

// Individual Product Card with grams, kg, ml, and liter variant selection
function AnyStoreItemCard({ product, requestCart, onAddToCart, onUpdateQuantity }) {
  const variants = getUnitVariants(product);
  const defaultVariant = variants.find(v => v.isBase) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  const activeProduct = getProductWithVariant(product, selectedVariant);
  const cartItem = requestCart.find(i => i.id === activeProduct.id);
  const qty = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 group">
      <div className="space-y-3">
        <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-square">
          <img 
            src={activeProduct.image || activeProduct.imageUrl || activeProduct.image_url || '/images/cat_veg_fruits.jpg'} 
            alt={activeProduct.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
          />
        </div>

        <div>
          <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">
            {activeProduct.category || 'Grocery'}
          </span>
          <h4 className="font-display font-extrabold text-sm text-stone-900 line-clamp-1">
            {activeProduct.name}
          </h4>
          
          {/* UNIT / WEIGHT SELECTOR CHIPS (GRAMS, KG, ML, LITER) */}
          {variants.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
              {variants.map(v => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-2xs scale-102 ring-1 ring-emerald-950'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PRICE & QUANTITY CONTROLS */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div>
          <span className="font-display font-black text-base text-stone-900 block leading-tight">
            ₹{activeProduct.price}
          </span>
          <span className="text-[10px] text-stone-400 font-semibold">
            {activeProduct.unit}
          </span>
        </div>

        {qty === 0 ? (
          <button
            onClick={() => onAddToCart(activeProduct)}
            className="py-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-800 text-white px-2 py-1 rounded-xl font-bold text-xs shadow-xs">
            <button onClick={() => onUpdateQuantity(activeProduct.id, -1)} className="hover:text-emerald-300 cursor-pointer">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span>{qty}</span>
            <button onClick={() => onUpdateQuantity(activeProduct.id, 1)} className="hover:text-emerald-300 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnyStoreOrderBuilder() {
  const { 
    setActiveTab, currentLocation, setIsLocationModalOpen, 
    customerName, customerPhone,
    addToast, placeAnyStoreOrder, cart, setCart, clearCart 
  } = useCart();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Custom items cart state for "Shop From Any Store" request
  const [requestCart, setRequestCart] = useState([]);

  // Manual Item Custom Input State
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemUnit, setManualItemUnit] = useState('250g');
  const [manualItemPrice, setManualItemPrice] = useState('40');

  // Real Dynamic Customer Delivery Address
  const customerAddress = useMemo(() => {
    if (!currentLocation) return 'Location not set';
    if (currentLocation.formattedAddress) return currentLocation.formattedAddress;
    const parts = [];
    if (currentLocation.flat) parts.push(currentLocation.flat);
    if (currentLocation.street) parts.push(currentLocation.street);
    if (currentLocation.area && currentLocation.area !== currentLocation.name) parts.push(currentLocation.area);
    if (currentLocation.name) parts.push(currentLocation.name);
    else if (currentLocation.city) parts.push(currentLocation.city);
    if (currentLocation.pincode) parts.push(currentLocation.pincode);
    return parts.filter(Boolean).join(', ') || 'Your current location';
  }, [currentLocation]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
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

  // Sync initial cart items into requestCart on mount
  useEffect(() => {
    if (cart && cart.length > 0) {
      const itemsFromCart = cart.map(item => ({
        id: item.product?.id || item.id,
        name: item.product?.name || item.name,
        price: item.product?.price || item.price || 50,
        unit: item.product?.unit || item.unit || '1 unit',
        quantity: item.quantity || 1,
        image: item.product?.image || item.image || '/images/cat_veg_fruits.jpg',
        isCustomManual: item.product?.isManual || item.isManual || false
      }));
      setRequestCart(itemsFromCart);
    }
  }, []);

  const handleAddToCart = (productWithVariant) => {
    const newItem = {
      id: productWithVariant.id,
      name: productWithVariant.name,
      quantity: 1,
      unit: productWithVariant.unit || '1 unit',
      price: productWithVariant.price || 50,
      image: productWithVariant.image || productWithVariant.imageUrl || productWithVariant.image_url || '/images/cat_veg_fruits.jpg'
    };

    setRequestCart(prev => {
      const idx = prev.findIndex(item => item.id === productWithVariant.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, newItem];
    });

    // Real-time sync to CartContext global cart
    setCart(prev => {
      const existingIdx = prev.findIndex(ci => (ci.product?.id || ci.id) === productWithVariant.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + 1
        };
        return updated;
      }
      return [...prev, {
        product: {
          id: productWithVariant.id,
          name: productWithVariant.name,
          price: productWithVariant.price || 50,
          unit: productWithVariant.unit || '1 unit',
          image: productWithVariant.image || productWithVariant.imageUrl || productWithVariant.image_url || '/images/cat_veg_fruits.jpg',
          isManual: false
        },
        quantity: 1
      }];
    });

    addToast(`Added "${productWithVariant.name} (${productWithVariant.unit})" to cart! 🛒`, 'success');
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

    // Real-time sync to CartContext global cart
    setCart(prev => {
      return prev.map(ci => {
        const cId = ci.product?.id || ci.id;
        if (cId === productId) {
          const newQty = (ci.quantity || 1) + delta;
          return newQty > 0 ? { ...ci, quantity: newQty } : null;
        }
        return ci;
      }).filter(Boolean);
    });
  };

  const handleAddManualCustomItem = (e) => {
    e.preventDefault();
    if (!manualItemName.trim()) {
      addToast('Please enter an item name (e.g. Fresh Tomatoes, Paneer)', 'error');
      return;
    }

    const priceNum = parseFloat(manualItemPrice) || 30;
    const manualId = `manual_${Date.now()}`;
    const customItem = {
      id: manualId,
      name: manualItemName.trim(),
      quantity: 1,
      unit: manualItemUnit,
      price: priceNum,
      image: '/images/cat_veg_fruits.jpg',
      isCustomManual: true
    };

    setRequestCart(prev => [...prev, customItem]);

    // Real-time sync to CartContext global cart
    setCart(prev => [
      ...prev,
      {
        product: {
          id: manualId,
          name: manualItemName.trim(),
          price: priceNum,
          unit: manualItemUnit,
          image: '/images/cat_veg_fruits.jpg',
          isManual: true
        },
        quantity: 1
      }
    ]);

    addToast(`Added custom item "${manualItemName} (${manualItemUnit})" to cart! 🛒`, 'success');
    setManualItemName('');
  };

  const subtotal = requestCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 49;
  const estimatedTotal = subtotal + deliveryFee;

  const handleOpenCheckoutModal = () => {
    if (requestCart.length === 0) {
      addToast('Please add at least one product to your grocery request.', 'error');
      return;
    }

    // Sync all selected products into the customer cart
    const formattedCartItems = requestCart.map(item => ({
      product: {
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit || '1 unit',
        image: item.image || '/images/cat_veg_fruits.jpg',
        isManual: item.isCustomManual
      },
      quantity: item.quantity
    }));
    setCart(formattedCartItems);

    setIsCheckoutModalOpen(true);
  };

  const handleConfirmOrderFromModal = async (confirmedDetails) => {
    setIsSubmitting(true);

    try {
      await placeAnyStoreOrder(requestCart, {
        fullName: confirmedDetails.fullName,
        phone: confirmedDetails.phone,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: estimatedTotal,
        address: confirmedDetails.address,
        paymentMethod: confirmedDetails.paymentMethod,
        locationName: confirmedDetails.address
      });

      setRequestCart([]);
      if (clearCart) clearCart();
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error('Error placing any store order:', err);
      addToast('Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* PAGE HEADER */}
      <div className="bg-gradient-to-r from-[#0E382B] via-[#134E3A] to-[#0A2E23] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border border-emerald-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHOP FROM ANY STORE • GRAMS & KG SELECTOR</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
              Shop From Any Store
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Select desired grams (100g, 250g, 500g, 1 kg) or volume (250ml, 500ml, 1 L) for any item. We'll fulfill it from nearest local stores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('upload')}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-md backdrop-blur-md cursor-pointer"
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
          
          {/* SEARCH STRIP & QUICK MANUAL ITEM CREATOR */}
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

          {/* QUICK MANUAL CUSTOM ITEM CARD */}
          <form onSubmit={handleAddManualCustomItem} className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h4 className="font-display font-extrabold text-xs sm:text-sm text-stone-900">
                Add Manual Custom Grocery Item (Custom Grams / Liters)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                placeholder="Item name (e.g. Fresh Ginger, Paneer, Cow Milk)..."
                value={manualItemName}
                onChange={(e) => setManualItemName(e.target.value)}
                className="sm:col-span-6 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-700"
              />

              <select
                value={manualItemUnit}
                onChange={(e) => setManualItemUnit(e.target.value)}
                className="sm:col-span-3 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-700 cursor-pointer"
              >
                <optgroup label="Weight (Grams / Kg / Sacks)">
                  <option value="100g">100 grams (100g)</option>
                  <option value="250g">250 grams (250g)</option>
                  <option value="500g">500 grams (500g)</option>
                  <option value="1 kg">1 kilogram (1 kg)</option>
                  <option value="2 kg">2 kilogram (2 kg)</option>
                  <option value="5 kg">5 kilogram (5 kg)</option>
                  <option value="10 kg">10 kilogram (10 kg)</option>
                  <option value="25 kg">25 kilogram (25 kg bag / bori)</option>
                </optgroup>
                <optgroup label="Liquid Volume (ml / Liter / Cans)">
                  <option value="250ml">250 ml (250ml)</option>
                  <option value="500ml">500 ml (500ml)</option>
                  <option value="1 L">1 Liter (1 L)</option>
                  <option value="2 L">2 Liter (2 L)</option>
                  <option value="5 L">5 Liter (5 L Can)</option>
                </optgroup>
                <optgroup label="Packs / Pieces">
                  <option value="1 pack">1 Pack</option>
                  <option value="2 pack">2 Pack</option>
                  <option value="6 pcs">6 Pcs</option>
                  <option value="12 pcs (1 dozen)">1 Dozen (12 pcs)</option>
                </optgroup>
              </select>

              <button
                type="submit"
                className="sm:col-span-3 py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>
          </form>

          {/* CATEGORY CHIPS SCROLLER */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 mx-auto cursor-pointer"
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
              <p className="text-stone-500 text-xs">Try selecting another category or adding a manual item above.</p>
            </div>
          )}

          {/* PRODUCT CARDS GRID WITH UNIT VARIANTS */}
          {!isLoading && !errorMsg && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => (
                <AnyStoreItemCard
                  key={product.id}
                  product={product}
                  requestCart={requestCart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
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
                Fulfilling customized weights from local stores
              </p>
            </div>

            {/* CART ITEMS LIST */}
            {requestCart.length === 0 ? (
              <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-1">
                <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs font-bold text-stone-700">Your grocery request is empty.</p>
                <p className="text-[11px] text-stone-500">Select items with your preferred grams/liters.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {requestCart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={item.image} 
                        alt="" 
                        className="w-9 h-9 rounded-xl object-cover bg-stone-100" 
                        onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }} 
                      />
                      <div>
                        <span className="font-bold text-stone-900 block truncate max-w-[130px]">{item.name}</span>
                        <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-lg text-stone-800 font-bold">
                        <button onClick={() => handleUpdateQuantity(item.id, -1)} className="hover:text-rose-600 cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, 1)} className="hover:text-emerald-700 cursor-pointer">
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
                <button onClick={() => setIsLocationModalOpen(true)} className="text-emerald-700 font-extrabold text-[11px] underline cursor-pointer">
                  Change
                </button>
              </div>
              <p className="text-[11px] text-stone-800 font-bold bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                {customerAddress}
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
                onClick={handleOpenCheckoutModal}
                disabled={isSubmitting || requestCart.length === 0}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>Place the Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* SHOP FROM ANY STORE CHECKOUT ADDRESS & DETAILS POPUP MODAL */}
      <AnyStoreCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        requestCart={requestCart}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        totalAmount={estimatedTotal}
        onConfirmOrder={handleConfirmOrderFromModal}
        isSubmitting={isSubmitting}
      />

    </div>
  );
}
