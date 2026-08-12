import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORES } from '../data/stores';
import { fetchStores } from '../services/storeService';
import { fetchCustomerAddressByPhone, saveCustomerPhoneAddress } from '../services/locationService';
import { fetchCustomerOrders, createOrderInSupabase } from '../services/orderService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Saved Customer Name State
  const [customerName, setCustomerNameState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_customer_name');
      return saved && saved !== 'Customer' ? saved : '';
    } catch {
      return '';
    }
  });

  // Saved Customer Phone Number State
  const [customerPhone, setCustomerPhoneState] = useState(() => {
    try {
      return localStorage.getItem('gharsee_customer_phone') || '';
    } catch {
      return '';
    }
  });

  // Onboarding Modal Trigger State
  const [isCustomerOnboardingOpen, setIsCustomerOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('gharsee_customer_phone');
    } catch {
      return true;
    }
  });

  // Customer Location State
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_current_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      latitude: 13.3161,
      longitude: 75.7720,
      name: 'Chikkamagaluru, Karnataka',
      flat: '',
      street: ''
    };
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [availableStores, setAvailableStores] = useState(STORES);

  // Selected Store
  const [currentStore, setCurrentStoreState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_current_store');
      if (saved) return JSON.parse(saved);
    } catch {}
    return STORES[0];
  });

  // Favorite Stores IDs
  const [favoriteStores, setFavoriteStores] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_favorite_stores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Store Switch Conflict Modal State
  const [storeConflictModal, setStoreConflictModal] = useState(null);

  // Cart items state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state initialized with localStorage for instant persistence across page refreshes
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_customer_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const setCustomerName = (nameVal) => {
    setCustomerNameState(nameVal);
    try {
      localStorage.setItem('gharsee_customer_name', nameVal);
    } catch {}
  };

  const setCustomerPhone = (phoneNum) => {
    setCustomerPhoneState(phoneNum);
    try {
      localStorage.setItem('gharsee_customer_phone', phoneNum);
    } catch {}
  };

  // Fetch returning customer address & profile when phone number changes
  useEffect(() => {
    async function loadSavedAddress() {
      if (!customerPhone) return;
      const savedAddress = await fetchCustomerAddressByPhone(customerPhone);
      if (savedAddress && savedAddress.address_text) {
        if (savedAddress.full_name) {
          setCustomerName(savedAddress.full_name);
        }
        setCurrentLocation(prev => ({
          ...prev,
          name: savedAddress.address_text || prev.name,
          latitude: savedAddress.latitude || prev.latitude,
          longitude: savedAddress.longitude || prev.longitude,
          flat: savedAddress.flat || prev.flat,
          street: savedAddress.street || prev.street
        }));
      }
    }
    loadSavedAddress();
  }, [customerPhone]);

  // Load Customer Orders & Realtime Sync from Supabase
  const loadLiveCustomerOrders = async () => {
    const live = await fetchCustomerOrders(customerPhone);
    if (live && live.length > 0) {
      setOrders(live);
      try {
        localStorage.setItem('gharsee_customer_orders', JSON.stringify(live));
      } catch {}
    }
  };

  useEffect(() => {
    loadLiveCustomerOrders();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('public:orders:customer')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadLiveCustomerOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [customerPhone]);

  // Fetch live stores from Supabase when location changes
  useEffect(() => {
    async function loadNearbyStores() {
      const lat = currentLocation?.latitude || 13.3161;
      const lon = currentLocation?.longitude || 75.7720;
      const locName = currentLocation?.name || '';

      const res = await fetchStores(lat, lon, locName);
      if (res.stores && res.stores.length > 0) {
        setAvailableStores(res.stores);
        if (!currentStore || !res.stores.some(s => s.id === currentStore.id)) {
          setCurrentStoreState(res.stores[0]);
        }
      } else {
        setAvailableStores([]);
      }
    }
    loadNearbyStores();
  }, [currentLocation]);

  // Save location
  useEffect(() => {
    try {
      localStorage.setItem('gharsee_current_location', JSON.stringify(currentLocation));
      if (customerPhone) {
        saveCustomerPhoneAddress(customerPhone, currentLocation);
      }
    } catch (e) {}
  }, [currentLocation, customerPhone]);

  // Save Current Store
  useEffect(() => {
    try {
      if (currentStore) {
        localStorage.setItem('gharsee_current_store', JSON.stringify(currentStore));
      }
    } catch (e) {}
  }, [currentStore]);

  // Save Favorites
  useEffect(() => {
    try {
      localStorage.setItem('gharsee_favorite_stores', JSON.stringify(favoriteStores));
    } catch (e) {}
  }, [favoriteStores]);

  // Save Cart
  useEffect(() => {
    try {
      localStorage.setItem('gharsee_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setCustomerLocation = (loc) => {
    setCurrentLocation(loc);
    addToast(`Delivery location updated to ${loc.name}`, 'info');
  };

  const setCurrentStore = (store) => {
    if (cart.length > 0 && currentStore && currentStore.id !== store.id) {
      setStoreConflictModal({
        targetStore: store,
        pendingItem: null
      });
      return;
    }
    setCurrentStoreState(store);
    addToast(`Selected store: ${store.name}`, 'info');
  };

  const confirmSwitchStore = (targetStore, itemToAdd = null) => {
    setCart([]);
    setCurrentStoreState(targetStore);
    setStoreConflictModal(null);
    if (itemToAdd) {
      setCart([{ product: itemToAdd.product, quantity: itemToAdd.quantity || 1, storeId: targetStore.id }]);
      addToast(`Switched to ${targetStore.name} & added ${itemToAdd.product.name}`, 'success');
    } else {
      addToast(`Switched active store to ${targetStore.name}`, 'info');
    }
  };

  const toggleFavoriteStore = (storeId) => {
    setFavoriteStores(prev => {
      const isFav = prev.includes(storeId);
      if (isFav) {
        addToast('Removed store from favorites', 'info');
        return prev.filter(id => id !== storeId);
      } else {
        addToast('Store added to favorites ❤️', 'success');
        return [...prev, storeId];
      }
    });
  };

  const addToCart = (product, quantity = 1, storeForProduct = null) => {
    const targetStore = storeForProduct || currentStore;

    if (cart.length > 0 && currentStore && currentStore.id !== targetStore?.id) {
      setStoreConflictModal({
        targetStore: targetStore,
        pendingItem: { product, quantity }
      });
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, storeId: targetStore?.id }];
    });
    addToast(`Added ${product.name} to cart!`, 'success');
  };

  const addMultipleToCart = (items, targetStore = null) => {
    const storeForProducts = targetStore || currentStore;
    let count = 0;

    if (cart.length > 0 && currentStore && currentStore.id !== storeForProducts?.id) {
      setStoreConflictModal({
        targetStore: storeForProducts,
        pendingItems: items
      });
      return;
    }

    setCart(prev => {
      let updated = [...prev];
      items.forEach(({ product, quantity }) => {
        if (!product) return;
        count++;
        const existingIndex = updated.findIndex(item => item.product.id === product.id);
        if (existingIndex > -1) {
          updated[existingIndex].quantity += (quantity || 1);
        } else {
          updated.push({ product, quantity: quantity || 1, storeId: storeForProducts?.id });
        }
      });
      return updated;
    });

    if (count > 0) {
      addToast(`Added ${count} items to your cart! 🛒`, 'success');
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}
    }
  };

  const removeFromCart = productId => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Specific Store Order Placement (Persisted to Supabase with real customerName & customerPhone)
  const placeOrder = async (orderDetails) => {
    const phoneNum = orderDetails.phone || customerPhone || localStorage.getItem('gharsee_customer_phone') || '';
    const cName = orderDetails.fullName || customerName || localStorage.getItem('gharsee_customer_name') || 'Customer';

    const newOrder = {
      id: `GK-${Math.floor(10000 + Math.random() * 90000)}`,
      fulfillment_mode: 'store_selected',
      store_id: currentStore ? currentStore.id : null,
      storeName: currentStore ? currentStore.name : 'Local Grocery Store',
      customerName: cName,
      customerPhone: phoneNum,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        qty: item.quantity,
        unit: item.product.unit || '1 unit',
        replacementPreference: item.product.replacementPreference || 'replace_brand',
        image: item.product.image
      })),
      subtotal: orderDetails.subtotal,
      deliveryFee: orderDetails.deliveryFee,
      discount: orderDetails.discount,
      totalAmount: orderDetails.totalAmount,
      status: 'pending',
      paymentMethod: orderDetails.paymentMethod,
      address: orderDetails.address
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('gharsee_customer_orders', JSON.stringify(updatedOrders));
    } catch {}

    clearCart();
    await createOrderInSupabase(newOrder);

    addToast(`Order #${newOrder.id} placed at ${newOrder.storeName}! 🎉`, 'success');

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setActiveTab('orders');
    return newOrder;
  };

  // "Shop From Any Store" Custom Order Placement
  const placeAnyStoreOrder = async (groceryListItems, orderDetails) => {
    const phoneNum = orderDetails.phone || customerPhone || localStorage.getItem('gharsee_customer_phone') || '';
    const cName = orderDetails.fullName || customerName || localStorage.getItem('gharsee_customer_name') || 'Customer';

    const newOrder = {
      id: `GS-${Math.floor(10000 + Math.random() * 90000)}`,
      fulfillment_mode: 'shop_any_store',
      store_id: null,
      storeName: 'Store Selection Pending (Rider Will Select)',
      customerName: cName,
      customerPhone: phoneNum,
      date: new Date().toISOString(),
      items: groceryListItems.map(item => ({
        id: item.id,
        name: item.name || item.itemName,
        price: item.price || 50,
        quantity: item.quantity || 1,
        qty: item.quantity || 1,
        unit: item.unit || item.quantityUnit || '1 unit',
        replacementPreference: item.replacementPreference || 'replace_brand',
        image: '/images/cat_veg_fruits.jpg'
      })),
      subtotal: orderDetails.subtotal,
      deliveryFee: orderDetails.deliveryFee,
      discount: 0,
      totalAmount: orderDetails.totalAmount,
      status: 'pending',
      paymentMethod: orderDetails.paymentMethod || 'Cash on Delivery',
      address: orderDetails.address
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('gharsee_customer_orders', JSON.stringify(updatedOrders));
    } catch {}

    await createOrderInSupabase(newOrder);

    addToast(`Custom order #${newOrder.id} placed! A nearby partner will fulfill it. 🛒`, 'success');

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setActiveTab('orders');
    return newOrder;
  };

  const toggleWishlist = productId => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('Removed from wishlist', 'info');
        return prev.filter(id => id !== productId);
      }
      addToast('Added to wishlist ❤️', 'success');
      return [...prev, productId];
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const deliveryFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 49;

  return (
    <CartContext.Provider
      value={{
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        isCustomerOnboardingOpen,
        setIsCustomerOnboardingOpen,
        cart,
        orders,
        toasts,
        wishlist,
        activeTab,
        currentStore,
        availableStores,
        favoriteStores,
        currentLocation,
        isLocationModalOpen,
        selectedStoreId,
        selectedProduct,
        storeConflictModal,
        cartSubtotal,
        totalItemCount,
        deliveryFee,
        setActiveTab,
        setCurrentStore,
        setCustomerLocation,
        setIsLocationModalOpen,
        setFavoriteStores,
        setSelectedStoreId,
        setSelectedProduct,
        toggleFavoriteStore,
        confirmSwitchStore,
        setStoreConflictModal,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        placeOrder,
        placeAnyStoreOrder,
        addToast,
        removeToast,
        toggleWishlist
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
