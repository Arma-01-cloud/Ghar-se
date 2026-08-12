import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { fetchShopkeeperOrders, updateOrderStatusInSupabase } from '../../services/orderService';
import { validateStatusTransition } from '../services/shopkeeperService';
import { get10DigitPhone } from '../../services/authService';

const ShopkeeperContext = createContext();

export const ShopkeeperProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  
  // Persist isLoggedIn state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('gharsee_shopkeeper_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [hasStore, setHasStore] = useState(() => {
    try {
      return localStorage.getItem('gharsee_has_store') === 'true';
    } catch {
      return false;
    }
  });

  const [isCheckingStore, setIsCheckingStore] = useState(true);

  // Store profile initialized to null (no mock Sri Lakshmi store fallback!)
  const [storeProfile, setStoreProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_store_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Initialize orders with localStorage backup for instant persistence across page refreshes
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_shopkeeper_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeShopkeeperTab, setActiveShopkeeperTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Query Supabase for store owned by authenticated user via 10-digit phone or owner_id
  const loadUserStoreFromSupabase = async (userId, userPhone) => {
    if (!isSupabaseConfigured) return;

    try {
      const cleanDigits = get10DigitPhone(userPhone);
      const { data: allShops, error } = await supabase.from('shops').select('*');

      let matchedShop = null;
      if (!error && allShops && allShops.length > 0) {
        matchedShop = allShops.find(s => 
          (userId && s.owner_id === userId) || 
          (cleanDigits && get10DigitPhone(s.phone) === cleanDigits)
        );
      }

      if (matchedShop) {
        setHasStore(true);
        const prof = {
          id: matchedShop.id,
          name: matchedShop.name,
          ownerName: matchedShop.owner_name || 'Store Owner',
          phone: matchedShop.phone || userPhone,
          email: matchedShop.email || 'store@gharsee.app',
          address: matchedShop.address || 'Chikkamagaluru, Karnataka',
          isOpen: matchedShop.status === 'open' || matchedShop.status === 'active' || true,
          ...matchedShop
        };
        setStoreProfile(prof);
        try {
          localStorage.setItem('gharsee_has_store', 'true');
          localStorage.setItem('gharsee_store_profile', JSON.stringify(prof));
        } catch {}
      } else {
        setHasStore(false);
        setStoreProfile(null);
        try {
          localStorage.setItem('gharsee_has_store', 'false');
          localStorage.removeItem('gharsee_store_profile');
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching shopkeeper store from Supabase:', err);
    }
  };

  // Check Supabase Authentication & Store Registration on Mount
  useEffect(() => {
    async function checkShopkeeperAuthAndStore() {
      setIsCheckingStore(true);

      if (!isSupabaseConfigured) {
        setIsCheckingStore(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setAuthUser(user);
          setIsLoggedIn(true);
          try { localStorage.setItem('gharsee_shopkeeper_logged_in', 'true'); } catch {}
          await loadUserStoreFromSupabase(user.id, user.phone || user.user_metadata?.phone);
        } else {
          // If no active auth session, rely on local session state or reset
          if (!localStorage.getItem('gharsee_shopkeeper_logged_in')) {
            setIsLoggedIn(false);
            setHasStore(false);
            setStoreProfile(null);
          }
        }
      } catch (err) {
        console.error('Error checking shopkeeper auth:', err);
      } finally {
        setIsCheckingStore(false);
      }
    }

    checkShopkeeperAuthAndStore();

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          setIsLoggedIn(true);
          try { localStorage.setItem('gharsee_shopkeeper_logged_in', 'true'); } catch {}
          await loadUserStoreFromSupabase(session.user.id, session.user.phone || session.user.user_metadata?.phone);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setIsLoggedIn(false);
          setHasStore(false);
          setStoreProfile(null);
          try {
            localStorage.removeItem('gharsee_shopkeeper_logged_in');
            localStorage.removeItem('gharsee_has_store');
            localStorage.removeItem('gharsee_store_profile');
          } catch {}
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Fetch real shopkeeper orders & derive live notifications from Supabase
  const loadLiveOrders = async () => {
    const shopId = storeProfile?.id || null;
    const live = await fetchShopkeeperOrders(shopId);
    if (live && live.length > 0) {
      setOrders(live);
      try {
        localStorage.setItem('gharsee_shopkeeper_orders', JSON.stringify(live));
      } catch {}

      // Build LIVE Notifications from real Supabase order pipeline
      const liveAlerts = live.slice(0, 10).map(o => ({
        id: `notif_${o.id}`,
        title: `Order #${o.id} • ${o.status.toUpperCase()}`,
        message: `Customer ${o.customerName} (${o.customerPhone || o.phone}) ordered ${o.items?.length || 1} items totaling ₹${o.total}`,
        time: new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: o.status === 'pending' ? 'alert' : 'info'
      }));
      setNotifications(liveAlerts);
    }
  };

  useEffect(() => {
    if (storeProfile?.id) {
      loadLiveOrders();
    }

    if (isSupabaseConfigured) {
      const orderChannel = supabase
        .channel('public:orders:shopkeeper')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          loadLiveOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(orderChannel);
      };
    }
  }, [storeProfile]);

  const addShopkeeperToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeShopkeeperToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Toggle Store Status (🟢 OPEN / 🔴 CLOSED)
  const toggleStoreStatus = () => {
    setStoreProfile(prev => {
      if (!prev) return prev;
      const newStatus = !prev.isOpen;
      const updated = { ...prev, isOpen: newStatus };
      try { localStorage.setItem('gharsee_store_profile', JSON.stringify(updated)); } catch {}
      addShopkeeperToast(`Store status updated: ${newStatus ? '🟢 STORE OPEN' : '🔴 STORE CLOSED'}`, 'info');
      return updated;
    });
  };

  const updateStoreProfile = (newDetails) => {
    setStoreProfile(prev => {
      const updated = { ...prev, ...newDetails };
      try { localStorage.setItem('gharsee_store_profile', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addShopkeeperToast('Store profile updated successfully!', 'success');
  };

  // Order Workflow Actions (Persisted directly to Supabase & localStorage)
  const acceptOrder = async (orderId) => {
    const updated = orders.map(o => {
      if (o.id === orderId) return { ...o, status: 'accepted' };
      return o;
    });
    setOrders(updated);
    try { localStorage.setItem('gharsee_shopkeeper_orders', JSON.stringify(updated)); } catch {}

    await updateOrderStatusInSupabase(orderId, 'accepted');
    addShopkeeperToast(`Order #${orderId} accepted successfully! ✓`, 'success');
  };

  const rejectOrder = async (orderId, reason) => {
    const updated = orders.map(o => {
      if (o.id === orderId) return { ...o, status: 'rejected', rejectionReason: reason };
      return o;
    });
    setOrders(updated);
    try { localStorage.setItem('gharsee_shopkeeper_orders', JSON.stringify(updated)); } catch {}

    await updateOrderStatusInSupabase(orderId, 'rejected');
    addShopkeeperToast(`Order #${orderId} rejected.`, 'error');
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        if (validateStatusTransition(o.status, nextStatus)) {
          return { ...o, status: nextStatus };
        }
      }
      return o;
    });
    setOrders(updated);
    try { localStorage.setItem('gharsee_shopkeeper_orders', JSON.stringify(updated)); } catch {}

    await updateOrderStatusInSupabase(orderId, nextStatus);
    addShopkeeperToast(`Order #${orderId} status updated to ${nextStatus.replace(/_/g, ' ').toUpperCase()}`, 'success');
  };

  // Dashboard Stats Calculations
  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const totalSales = orders.filter(o => o.status !== 'rejected').reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = todayOrders > 0 ? Math.round(totalSales / todayOrders) : 0;
  const lowStockProducts = products.filter(p => p.stock <= p.minThreshold);

  const loginShopkeeper = async (userObj) => {
    setAuthUser(userObj);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('gharsee_shopkeeper_logged_in', 'true');
    } catch {}
    await loadUserStoreFromSupabase(userObj.id, userObj.phone);
  };

  const logoutShopkeeper = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
    setHasStore(false);
    setStoreProfile(null);
    try {
      localStorage.removeItem('gharsee_shopkeeper_logged_in');
      localStorage.removeItem('gharsee_has_store');
      localStorage.removeItem('gharsee_store_profile');
      localStorage.removeItem('gharsee_shopkeeper_orders');
    } catch {}
    addShopkeeperToast('Logged out of Store Partner Portal', 'info');
    window.location.href = '/';
  };

  return (
    <ShopkeeperContext.Provider
      value={{
        authUser,
        isLoggedIn,
        setIsLoggedIn,
        hasStore,
        setHasStore,
        isCheckingStore,
        storeProfile,
        setStoreProfile,
        orders,
        products,
        notifications,
        activeShopkeeperTab,
        selectedOrderId,
        toasts,
        todayOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        totalSales,
        avgOrderValue,
        lowStockProducts,
        setActiveShopkeeperTab,
        setSelectedOrderId,
        toggleStoreStatus,
        updateStoreProfile,
        acceptOrder,
        rejectOrder,
        updateOrderStatus,
        addShopkeeperToast,
        removeShopkeeperToast,
        loginShopkeeper,
        logoutShopkeeper
      }}
    >
      {children}
    </ShopkeeperContext.Provider>
  );
};

export const useShopkeeper = () => {
  const context = useContext(ShopkeeperContext);
  if (!context) throw new Error('useShopkeeper must be used within a ShopkeeperProvider');
  return context;
};
