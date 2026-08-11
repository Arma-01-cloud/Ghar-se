import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { fetchShopkeeperOrders, updateOrderStatusInSupabase } from '../../services/orderService';
import { INITIAL_NOTIFICATIONS } from '../data/notifications';
import { validateStatusTransition } from '../services/shopkeeperService';

const ShopkeeperContext = createContext();

export const ShopkeeperProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [isCheckingStore, setIsCheckingStore] = useState(true);

  const [storeProfile, setStoreProfile] = useState(null);

  // Shopkeeper orders & products
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeShopkeeperTab, setActiveShopkeeperTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Check Supabase Authentication and Store Registration
  useEffect(() => {
    async function checkShopkeeperAuthAndStore() {
      setIsCheckingStore(true);

      if (!isSupabaseConfigured) {
        setIsLoggedIn(false);
        setHasStore(false);
        setIsCheckingStore(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setAuthUser(user);
          setIsLoggedIn(true);

          // Query shop owned by authenticated user in Supabase shops table
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .limit(1);

          if (!error && data && data.length > 0) {
            setHasStore(true);
            setStoreProfile({
              id: data[0].id,
              name: data[0].name,
              ownerName: user.user_metadata?.full_name || 'Store Partner',
              phone: user.user_metadata?.phone || '+919876543210',
              email: user.email || 'store@gharsee.app',
              address: data[0].address || 'Indiranagar, Bengaluru',
              isOpen: data[0].status === 'open' || data[0].status === 'active' || true,
              ...data[0]
            });
          } else {
            setHasStore(false);
            setStoreProfile(null);
          }
        } else {
          setAuthUser(null);
          setIsLoggedIn(false);
          setHasStore(false);
          setStoreProfile(null);
        }
      } catch (err) {
        console.error('Error checking shopkeeper auth:', err);
        setAuthUser(null);
        setIsLoggedIn(false);
        setHasStore(false);
      } finally {
        setIsCheckingStore(false);
      }
    }

    checkShopkeeperAuthAndStore();

    // Listen for real-time auth state changes
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          setIsLoggedIn(true);

          // Query shop for logged in session user
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', session.user.id)
            .limit(1);

          if (!error && data && data.length > 0) {
            setHasStore(true);
            setStoreProfile({
              id: data[0].id,
              name: data[0].name,
              ownerName: session.user.user_metadata?.full_name || 'Store Partner',
              phone: session.user.user_metadata?.phone || '+919876543210',
              email: session.user.email || 'store@gharsee.app',
              address: data[0].address || 'Indiranagar, Bengaluru',
              isOpen: data[0].status === 'open' || data[0].status === 'active' || true,
              ...data[0]
            });
          } else {
            setHasStore(false);
            setStoreProfile(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setIsLoggedIn(false);
          setHasStore(false);
          setStoreProfile(null);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Fetch real shopkeeper orders from Supabase database
  useEffect(() => {
    async function loadLiveOrders() {
      if (storeProfile?.id) {
        const live = await fetchShopkeeperOrders(storeProfile.id);
        setOrders(live || []);
      }
    }
    loadLiveOrders();
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
      addShopkeeperToast(`Store status updated: ${newStatus ? '🟢 STORE OPEN' : '🔴 STORE CLOSED'}`, 'info');
      return { ...prev, isOpen: newStatus };
    });
  };

  const updateStoreProfile = (newDetails) => {
    setStoreProfile(prev => ({ ...prev, ...newDetails }));
    addShopkeeperToast('Store profile updated successfully!', 'success');
  };

  // Order Workflow Actions (Persisted to Supabase)
  const acceptOrder = async (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) return { ...o, status: 'accepted' };
      return o;
    }));
    await updateOrderStatusInSupabase(orderId, 'accepted');
    addShopkeeperToast(`Order #${orderId} accepted successfully! ✓`, 'success');
  };

  const rejectOrder = async (orderId, reason) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) return { ...o, status: 'rejected', rejectionReason: reason };
      return o;
    }));
    await updateOrderStatusInSupabase(orderId, 'rejected');
    addShopkeeperToast(`Order #${orderId} rejected.`, 'error');
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (validateStatusTransition(o.status, nextStatus)) {
          return { ...o, status: nextStatus };
        }
      }
      return o;
    }));
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

  const loginShopkeeper = (userObj) => {
    setAuthUser(userObj);
    setIsLoggedIn(true);
  };

  const logoutShopkeeper = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
    setHasStore(false);
    setStoreProfile(null);
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
