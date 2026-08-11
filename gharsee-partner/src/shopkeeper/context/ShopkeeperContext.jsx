import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockFetchPartnerOrders } from '../../services/mock/partnerService';
import { INITIAL_NOTIFICATIONS } from '../data/notifications';
import { validateStatusTransition } from '../services/shopkeeperService';

const ShopkeeperContext = createContext();

export const ShopkeeperProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [isCheckingStore, setIsCheckingStore] = useState(false);

  const [storeProfile, setStoreProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeShopkeeperTab, setActiveShopkeeperTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load partner orders
  useEffect(() => {
    async function loadOrders() {
      if (storeProfile?.id) {
        const live = await mockFetchPartnerOrders(storeProfile.id);
        setOrders(live || []);
      }
    }
    loadOrders();
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

  const acceptOrder = async (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'accepted' } : o));
    addShopkeeperToast(`Order #${orderId} accepted successfully! ✓`, 'success');
  };

  const rejectOrder = async (orderId, reason) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected', rejectionReason: reason } : o));
    addShopkeeperToast(`Order #${orderId} rejected.`, 'error');
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && validateStatusTransition(o.status, nextStatus)) {
        return { ...o, status: nextStatus };
      }
      return o;
    }));
    addShopkeeperToast(`Order #${orderId} status updated to ${nextStatus.replace(/_/g, ' ').toUpperCase()}`, 'success');
  };

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
    setAuthUser(null);
    setIsLoggedIn(false);
    setHasStore(false);
    setStoreProfile(null);
    addShopkeeperToast('Logged out of Store Partner Portal', 'info');
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
