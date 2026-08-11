import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockFetchRiderDeliveries } from '../../services/mock/partnerService';
import { INITIAL_RIDER_EARNINGS } from '../data/earnings';
import { INITIAL_RIDER_PROFILE } from '../data/profile';
import { INITIAL_RIDER_NOTIFICATIONS } from '../data/notifications';

const RiderContext = createContext();

export const RiderProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [history, setHistory] = useState([]);

  const [earnings, setEarnings] = useState(INITIAL_RIDER_EARNINGS);
  const [profile, setProfile] = useState(INITIAL_RIDER_PROFILE);
  const [notifications, setNotifications] = useState(INITIAL_RIDER_NOTIFICATIONS);
  const [activeRiderTab, setActiveRiderTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    async function loadDeliveries() {
      if (isLoggedIn) {
        const res = await mockFetchRiderDeliveries();
        setIncomingRequest(res.incoming);
        setActiveDelivery(res.active);
        setHistory(res.history || []);
      }
    }
    loadDeliveries();
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

  const acceptDelivery = async (deliveryObj) => {
    const active = { ...deliveryObj, status: 'accepted' };
    setActiveDelivery(active);
    setIncomingRequest(null);
    addRiderToast(`Delivery #${deliveryObj.id} accepted! Head to store.`, 'success');
  };

  const declineDelivery = (deliveryId, reason) => {
    setIncomingRequest(null);
    addRiderToast(`Delivery request declined (${reason}).`, 'info');
  };

  const selectStoreForOrder = async (orderId, shopId, shopName) => {
    if (activeDelivery && activeDelivery.id === orderId) {
      setActiveDelivery(prev => ({
        ...prev,
        storeName: shopName,
        status: 'SHOPPING'
      }));
    }
    addRiderToast(`Store selected: ${shopName}. Ready to purchase items!`, 'success');
  };

  const confirmPickup = async () => {
    if (!activeDelivery) return;
    setActiveDelivery(prev => ({ ...prev, status: 'picked_up' }));
    addRiderToast('Order pickup confirmed! Ready to start delivery.', 'success');
  };

  const startDelivery = async () => {
    if (!activeDelivery) return;
    setActiveDelivery(prev => ({ ...prev, status: 'out_for_delivery' }));
    addRiderToast('Started delivery! Head to customer address.', 'success');
  };

  const confirmDeliveryWithOTP = async () => {
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

    addRiderToast(`🎉 Delivery Completed! +₹${activeDelivery.estimatedEarnings || 65} added to earnings.`, 'success');
    setActiveDelivery(null);
    return true;
  };

  const loginRider = (userObj) => {
    setAuthUser(userObj);
    setIsLoggedIn(true);
  };

  const logoutRider = async () => {
    setAuthUser(null);
    setIsLoggedIn(false);
    setActiveDelivery(null);
    addRiderToast('Logged out of Delivery Partner Portal', 'info');
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
