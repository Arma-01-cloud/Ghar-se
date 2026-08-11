import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { fetchStores } from '../services/storeService';
import { createOrderInSupabase, fetchCustomerOrders } from '../services/orderService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Current Customer Location (Default: Indiranagar, Bengaluru)
  const [currentLocation, setCurrentLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_current_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { name: 'Indiranagar, Bengaluru', latitude: 12.9784, longitude: 77.6408 };
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Available stores sorted by Haversine distance (defaults to empty array)
  const [availableStores, setAvailableStores] = useState([]);

  // Current Selected Store (defaults to null until selected)
  const [currentStore, setCurrentStoreState] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_current_store');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Favorite Stores IDs (defaults to empty array)
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

  // Orders state (defaults to empty array - NO mock orders!)
  const [orders, setOrders] = useState([]);

  const [toasts, setToasts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load customer orders from Supabase database
  useEffect(() => {
    async function loadLiveCustomerOrders() {
      const liveOrders = await fetchCustomerOrders();
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
      }
    }
    loadLiveCustomerOrders();
  }, []);

  // Fetch and sort stores by Haversine distance whenever customer location changes
  useEffect(() => {
    async function loadNearbyStores() {
      const res = await fetchStores(currentLocation.latitude, currentLocation.longitude, currentLocation.name);
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
    } catch (e) {}
  }, [currentLocation]);

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

  const setCustomerLocation = (locationObj) => {
    setCurrentLocationState(locationObj);
    addToast(`Delivery location updated to ${locationObj.name}! Stores re-sorted by distance.`, 'info');
  };

  const toggleFavoriteStore = (storeId) => {
    setFavoriteStores(prev => {
      const isFav = prev.includes(storeId);
      const storeObj = (availableStores || []).find(s => s.id === storeId);
      const name = storeObj ? storeObj.name : 'Store';
      if (isFav) {
        addToast(`Removed ${name} from favorites`, 'info');
        return prev.filter(id => id !== storeId);
      } else {
        addToast(`Added ${name} to your favorite stores ♥`, 'success');
        return [...prev, storeId];
      }
    });
  };

  const setCurrentStore = (store) => {
    if (cart.length > 0 && currentStore && currentStore.id !== store.id) {
      setStoreConflictModal({
        targetStore: store
      });
      return;
    }
    setCurrentStoreState(store);
    addToast(`Shopping from ${store.name} 🏪`, 'success');
  };

  const confirmSwitchStore = () => {
    if (storeConflictModal?.targetStore) {
      setCart([]);
      setCurrentStoreState(storeConflictModal.targetStore);
      addToast(`Switched store to ${storeConflictModal.targetStore.name}. Cart reset.`, 'info');
    }
    setStoreConflictModal(null);
  };

  const addToCart = (product, quantity = 1, targetStore = null) => {
    const storeForProduct = targetStore || currentStore;

    if (cart.length > 0 && currentStore && currentStore.id !== storeForProduct?.id) {
      setStoreConflictModal({
        targetStore: storeForProduct,
        pendingProduct: product,
        pendingQuantity: quantity
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
      return [...prev, { product, quantity, storeId: storeForProduct?.id }];
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

  // Specific Store Order Placement (Persisted to Supabase)
  const placeOrder = async (orderDetails) => {
    const newOrder = {
      id: `GK-${Math.floor(10000 + Math.random() * 90000)}`,
      fulfillment_mode: 'store_selected',
      store_id: currentStore ? currentStore.id : null,
      storeName: currentStore ? currentStore.name : 'Local Grocery Store',
      date: new Date().toISOString(),
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        image: item.product.image
      })),
      subtotal: orderDetails.subtotal,
      deliveryFee: orderDetails.deliveryFee,
      discount: orderDetails.discount,
      totalAmount: orderDetails.totalAmount,
      status: 'Order Placed',
      paymentMethod: orderDetails.paymentMethod,
      address: orderDetails.address
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    await createOrderInSupabase(newOrder);

    addToast(`Order #${newOrder.id} placed at ${newOrder.storeName}! 🎉`, 'success');

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setActiveTab('orders');
    return newOrder;
  };

  // "Shop From Any Store" Custom Order Placement (Persisted to Supabase)
  const placeAnyStoreOrder = async (groceryListItems, orderDetails) => {
    const newOrder = {
      id: `GS-${Math.floor(10000 + Math.random() * 90000)}`,
      fulfillment_mode: 'shop_any_store',
      store_id: null,
      storeName: 'Store Selection Pending (Rider Will Select)',
      date: new Date().toISOString(),
      items: groceryListItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        brand: item.brand,
        notes: item.notes,
        status: 'pending'
      })),
      subtotal: orderDetails.subtotal,
      deliveryFee: orderDetails.deliveryFee,
      totalAmount: orderDetails.totalAmount,
      status: 'SEARCHING_FOR_STORE',
      paymentMethod: orderDetails.paymentMethod,
      address: orderDetails.address
    };

    setOrders(prev => [newOrder, ...prev]);
    await createOrderInSupabase(newOrder);

    addToast(`"Shop From Any Store" Order #${newOrder.id} placed! Finding rider... 🛍️`, 'success');

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
