import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { fetchRiderDeliveries, updateOrderStatusInSupabase, assignStoreToAnyStoreOrder } from '../../services/orderService';
import { INITIAL_RIDER_EARNINGS } from '../data/earnings';
import { INITIAL_RIDER_PROFILE } from '../data/profile';
import { INITIAL_RIDER_NOTIFICATIONS } from '../data/notifications';

const RiderContext = createContext();

export const RiderProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [isOnline, setIsOnline] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [history, setHistory] = useState([]);

  const [earnings, setEarnings] = useState(INITIAL_RIDER_EARNINGS);
  const [profile, setProfile] = useState(INITIAL_RIDER_PROFILE);
  const [notifications, setNotifications] = useState(INITIAL_RIDER_NOTIFICATIONS);
  const [activeRiderTab, setActiveRiderTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Check Supabase Authentication session for Rider
  useEffect(() => {
    async function checkRiderAuth() {
      setIsCheckingAuth(true);

      if (!isSupabaseConfigured) {
        setIsLoggedIn(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthUser(user);
          setIsLoggedIn(true);
          setProfile(prev => ({
            ...prev,
            name: user.user_metadata?.full_name || 'Arman Khan',
            phone: user.phone || user.user_metadata?.phone || '+91 98765 00112'
          }));
        } else {
          setAuthUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Error checking rider auth:', err);
        setAuthUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkRiderAuth();

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          setIsLoggedIn(true);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setIsLoggedIn(false);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Load live delivery tasks from Supabase
  useEffect(() => {
    async function loadLiveDeliveries() {
      if (isLoggedIn) {
        const res = await fetchRiderDeliveries();
        setIncomingRequest(res.incoming);
        setActiveDelivery(res.active);
        setHistory(res.history || []);
      }
    }
    loadLiveDeliveries();
  }, [isLoggedIn, isOnline]);

  const addRiderToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeRiderToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleAvailability = () => {
    setIsOnline(prev => {
      const next = !prev;
      addRiderToast(`You are now ${next ? '🟢 ONLINE & Available' : '🔴 OFFLINE'}`, 'info');
      return next;
    });
  };

  // Workflow: ACCEPT DELIVERY
  const acceptDelivery = async (deliveryObj) => {
    const active = { ...deliveryObj, status: 'accepted' };
    setActiveDelivery(active);
    setIncomingRequest(null);
    await updateOrderStatusInSupabase(deliveryObj.id, 'accepted');
    addRiderToast(`Delivery #${deliveryObj.id} accepted! Head to store.`, 'success');
  };

  // Workflow: DECLINE DELIVERY
  const declineDelivery = (deliveryId, reason) => {
    setIncomingRequest(null);
    addRiderToast(`Delivery request declined (${reason}).`, 'info');
  };

  // Workflow: RIDER SELECTS STORE FOR "SHOP FROM ANY STORE" ORDER
  const selectStoreForOrder = async (orderId, shopId, shopName) => {
    if (activeDelivery && activeDelivery.id === orderId) {
      setActiveDelivery(prev => ({
        ...prev,
        storeName: shopName,
        status: 'SHOPPING'
      }));
    }
    await assignStoreToAnyStoreOrder(orderId, shopId);
    addRiderToast(`Store selected: ${shopName}. Ready to purchase items!`, 'success');
  };

  // Workflow: CONFIRM PICKUP
  const confirmPickup = async () => {
    if (!activeDelivery) return;
    setActiveDelivery(prev => ({ ...prev, status: 'picked_up' }));
    await updateOrderStatusInSupabase(activeDelivery.id, 'picked_up');
    addRiderToast('Order pickup confirmed! Ready to start delivery.', 'success');
  };

  // Workflow: START DELIVERY
  const startDelivery = async () => {
    if (!activeDelivery) return;
    setActiveDelivery(prev => ({ ...prev, status: 'out_for_delivery' }));
    await updateOrderStatusInSupabase(activeDelivery.id, 'out_for_delivery');
    addRiderToast('Started delivery! Head to customer address.', 'success');
  };

  // Workflow: CONFIRM DELIVERY
  const confirmDeliveryWithOTP = async (otpInput) => {
    if (!activeDelivery) return false;

    const completedRecord = {
      id: activeDelivery.id,
      completedAt: 'Just now',
      storeName: activeDelivery.storeName,
      customerName: activeDelivery.customerName,
      deliveryAddress: activeDelivery.deliveryAddress,
      distance: activeDelivery.distance,
      earnings: activeDelivery.estimatedEarnings,
      paymentType: activeDelivery.paymentStatus,
      status: 'delivered'
    };

    setHistory(prev => [completedRecord, ...prev]);
    setEarnings(prev => ({
      ...prev,
      today: prev.today + (activeDelivery.estimatedEarnings || 65),
      todayDeliveries: prev.todayDeliveries + 1,
      thisWeek: prev.thisWeek + (activeDelivery.estimatedEarnings || 65)
    }));

    await updateOrderStatusInSupabase(activeDelivery.id, 'delivered');
    addRiderToast(`🎉 Delivery Completed! +₹${activeDelivery.estimatedEarnings || 65} added to earnings.`, 'success');
    setActiveDelivery(null);
    return true;
  };

  const loginRider = (userObj) => {
    setAuthUser(userObj);
    setIsLoggedIn(true);
  };

  const logoutRider = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
    setActiveDelivery(null);
    addRiderToast('Logged out of Delivery Partner Portal', 'info');
    window.location.href = '/';
  };

  return (
    <RiderContext.Provider
      value={{
        authUser,
        isLoggedIn,
        isCheckingAuth,
        isOnline,
        activeDelivery,
        incomingRequest,
        earnings,
        history,
        profile,
        notifications,
        activeRiderTab,
        toasts,
        setActiveRiderTab,
        toggleAvailability,
        acceptDelivery,
        declineDelivery,
        selectStoreForOrder,
        confirmPickup,
        startDelivery,
        confirmDeliveryWithOTP,
        addRiderToast,
        removeRiderToast,
        loginRider,
        logoutRider
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => {
  const context = useContext(RiderContext);
  if (!context) throw new Error('useRider must be used within a RiderProvider');
  return context;
};
