import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { fetchRiderDeliveries, updateOrderStatusInSupabase, assignStoreToAnyStoreOrder } from '../../services/orderService';
import { get10DigitPhone } from '../../services/authService';
import { updateRiderOnlineStatusInSupabase } from '../../services/riderService';
import { 
  subscribeToRiderNotifications, 
  fetchPendingRiderNotification, 
  respondToRiderNotification 
} from '../services/notificationService';
import { 
  playIncomingPing, 
  playAcceptChime, 
  playDeclineThud 
} from '../utils/notificationSound';
import { INITIAL_RIDER_EARNINGS } from '../data/earnings';
import { INITIAL_RIDER_PROFILE } from '../data/profile';
import { INITIAL_RIDER_NOTIFICATIONS } from '../data/notifications';

const RiderContext = createContext();

export const RiderProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('gharsee_rider_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [isOnline, setIsOnline] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [history, setHistory] = useState([]);

  // Live Rider Earnings initialized from localStorage or INITIAL_RIDER_EARNINGS (Zeroed defaults)
  const [earnings, setEarnings] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_rider_earnings');
      return saved ? JSON.parse(saved) : INITIAL_RIDER_EARNINGS;
    } catch {
      return INITIAL_RIDER_EARNINGS;
    }
  });
  
  // Persist rider profile state from Supabase or localStorage
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gharsee_rider_profile');
      return saved ? JSON.parse(saved) : INITIAL_RIDER_PROFILE;
    } catch {
      return INITIAL_RIDER_PROFILE;
    }
  });

  const [notifications, setNotifications] = useState(INITIAL_RIDER_NOTIFICATIONS);
  const [activeRiderTab, setActiveRiderTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Derive live earnings from real completed deliveries in Supabase
  const calculateLiveEarningsFromHistory = (historyList) => {
    if (!historyList || historyList.length === 0) {
      return INITIAL_RIDER_EARNINGS;
    }

    const todayCount = historyList.length;
    const totalEarnings = historyList.reduce((sum, h) => sum + (h.earnings || h.estimatedEarnings || 65), 0);
    const base = Math.round(totalEarnings * 0.85);
    const tips = Math.round(totalEarnings * 0.10);
    const bonuses = totalEarnings - base - tips;

    return {
      today: totalEarnings,
      todayDeliveries: todayCount,
      todayDistanceKm: (todayCount * 3.8).toFixed(1),
      thisWeek: totalEarnings,
      thisMonth: totalEarnings,
      baseEarnings: base,
      bonuses: bonuses,
      tips: tips,
      weeklyChart: [
        { day: 'Mon', amount: 0 },
        { day: 'Tue', amount: 0 },
        { day: 'Wed', amount: 0 },
        { day: 'Thu', amount: 0 },
        { day: 'Fri', amount: 0 },
        { day: 'Sat', amount: 0 },
        { day: 'Sun', amount: totalEarnings }
      ]
    };
  };

  // Load Rider Profile from Supabase rider_profiles table by 10-digit phone number
  const loadRiderProfileFromSupabase = async (userPhone) => {
    if (!isSupabaseConfigured || !userPhone) return;

    try {
      const cleanDigits = get10DigitPhone(userPhone);
      const { data: allRiders, error } = await supabase.from('rider_profiles').select('*');

      let matched = null;
      if (!error && allRiders && allRiders.length > 0) {
        matched = allRiders.find(r => cleanDigits && get10DigitPhone(r.phone) === cleanDigits);
      }

      if (matched) {
        const statusLower = (matched.status || '').toLowerCase();
        const isPending = statusLower === 'pending_approval' || statusLower === 'pending' || matched.is_approved === false;
        const isApproved = !isPending && statusLower !== 'rejected';

        const liveProfile = {
          id: matched.id,
          fullName: matched.full_name || matched.name || 'Delivery Partner',
          name: matched.full_name || matched.name || 'Delivery Partner',
          phone: matched.phone || userPhone,
          email: matched.email || `${cleanDigits}@gharsee.app`,
          rating: matched.rating || 5.0,
          totalDeliveries: matched.total_deliveries || 0,
          memberSince: matched.created_at ? new Date(matched.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently Joined',
          vehicleType: matched.vehicle_type || matched.vehicleType || 'Scooter',
          vehicleNumber: matched.vehicle_number || matched.vehicleNumber || 'Not specified',
          drivingLicense: matched.driving_license || matched.drivingLicense || 'Not specified',
          city: matched.delivery_city || matched.city || 'Chikkamagaluru, Karnataka',
          avatar: '/images/hero_grocery.jpg',
          status: matched.status,
          isApproved: isApproved,
          isPending: isPending,
          is_approved: matched.is_approved,
          isOnline: isApproved ? (matched.is_online !== false) : false
        };

        setProfile(liveProfile);
        setIsOnline(liveProfile.isOnline);
        try {
          localStorage.setItem('gharsee_rider_profile', JSON.stringify(liveProfile));
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching rider_profiles from Supabase:', err);
    }
  };

  // Check Supabase Authentication session for Rider
  useEffect(() => {
    async function checkRiderAuth() {
      setIsCheckingAuth(true);

      if (!isSupabaseConfigured) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthUser(user);
          setIsLoggedIn(true);
          try { localStorage.setItem('gharsee_rider_logged_in', 'true'); } catch {}
          await loadRiderProfileFromSupabase(user.phone || user.user_metadata?.phone);
        } else {
          const savedLoggedIn = localStorage.getItem('gharsee_rider_logged_in') === 'true';
          const savedProfile = localStorage.getItem('gharsee_rider_profile');

          if (savedLoggedIn && savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setIsLoggedIn(true);
            await loadRiderProfileFromSupabase(parsed.phone);
          } else if (!savedLoggedIn) {
            setAuthUser(null);
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.error('Error checking rider auth:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkRiderAuth();

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          setIsLoggedIn(true);
          try { localStorage.setItem('gharsee_rider_logged_in', 'true'); } catch {}
          await loadRiderProfileFromSupabase(session.user.phone || session.user.user_metadata?.phone);
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setIsLoggedIn(false);
          setProfile(INITIAL_RIDER_PROFILE);
          setEarnings(INITIAL_RIDER_EARNINGS);
          try {
            localStorage.removeItem('gharsee_rider_logged_in');
            localStorage.removeItem('gharsee_rider_profile');
            localStorage.removeItem('gharsee_rider_earnings');
          } catch {}
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Load live delivery tasks & calculate real earnings from Supabase (Strictly filtered by rider_id)
  useEffect(() => {
    async function loadLiveDeliveries() {
      if (isLoggedIn) {
        const res = await fetchRiderDeliveries(profile?.id);
        setIncomingRequest(res.incoming);
        setActiveDelivery(res.active);
        setHistory(res.history || []);

        if (res.history && res.history.length > 0) {
          const liveEarn = calculateLiveEarningsFromHistory(res.history);
          setEarnings(liveEarn);
          try {
            localStorage.setItem('gharsee_rider_earnings', JSON.stringify(liveEarn));
          } catch {}
        }
      }
    }
    loadLiveDeliveries();
  }, [isLoggedIn, isOnline, profile?.id]);

  // Realtime Rider Notification Subscription for Instant Blinkit-Style Popup on Customer Order
  useEffect(() => {
    let realtimeChannel = null;
    let ordersChannel = null;

    async function initRiderNotifications() {
      if (!isLoggedIn || !isOnline) return;

      // 1. Fetch any unexpired pending notification on mount
      if (profile?.id) {
        const pendingNotif = await fetchPendingRiderNotification(profile.id);
        if (pendingNotif && !activeDelivery) {
          setIncomingNotification(pendingNotif);
          playIncomingPing();
        }

        // 2. Subscribe to rider_notifications Realtime
        realtimeChannel = subscribeToRiderNotifications(profile.id, (notifRecord) => {
          if (notifRecord.status === 'pending' && !activeDelivery) {
            setIncomingNotification(notifRecord);
            playIncomingPing();
          } else if (notifRecord.status === 'cancelled' || notifRecord.status === 'expired') {
            setIncomingNotification((prev) => (prev?.id === notifRecord.id ? null : prev));
          }
        });
      }

      // 3. Direct Supabase Realtime Listener on orders table INSERT event
      if (isSupabaseConfigured) {
        ordersChannel = supabase
          .channel('rider-global-orders-live')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders'
            },
            async (payload) => {
              const newOrder = payload.new;
              if (newOrder && isOnline && !activeDelivery) {
                // Fetch store details
                let storeName = newOrder.store_name || 'Local Grocery Store';
                let storePhone = '+91 81238 21300';
                let storeAddress = 'Market Road, Chikkamagaluru';

                if (newOrder.store_id) {
                  const { data: shopRow } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', newOrder.store_id)
                    .maybeSingle();

                  if (shopRow) {
                    storeName = shopRow.name || storeName;
                    storePhone = shopRow.phone || shopRow.shopkeeper_phone || storePhone;
                    storeAddress = shopRow.address || storeAddress;
                  }
                }

                const notifObj = {
                  id: `order-notif-${newOrder.id}`,
                  order_id: newOrder.id,
                  payload: {
                    orderId: newOrder.id,
                    storeName,
                    storePhone,
                    storeAddress,
                    customerName: newOrder.customer_name || 'Customer',
                    customerPhone: newOrder.customer_phone || 'Phone not provided',
                    deliveryAddress: newOrder.delivery_address || 'Chikkamagaluru, Karnataka',
                    itemCount: Array.isArray(newOrder.items) ? newOrder.items.length : 1,
                    items: Array.isArray(newOrder.items) ? newOrder.items.map(i => typeof i === 'string' ? i : `${i.name || i.product_name || 'Item'} (${i.quantity || 1})`) : ['Grocery Items'],
                    totalAmount: newOrder.total_amount || 0,
                    paymentStatus: newOrder.payment_method || 'Cash on Delivery',
                    estimatedEarnings: 65,
                    distance: '1.8 km',
                    estimatedTime: '15-20 min'
                  }
                };

                setIncomingNotification(notifObj);
                playIncomingPing();
              }
            }
          )
          .subscribe();
      }
    }

    initRiderNotifications();

    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, [isLoggedIn, isOnline, profile?.id, !!activeDelivery]);

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

  // Toggle Rider Availability (UPDATES is_online COLUMN IN SUPABASE rider_profiles TABLE!)
  const toggleAvailability = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    setProfile(prev => {
      const updated = { ...prev, isOnline: nextState };
      try {
        localStorage.setItem('gharsee_rider_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    addRiderToast(`You are now ${nextState ? '🟢 ONLINE & Available' : '🔴 OFFLINE'}`, 'info');

    const riderPhone = profile?.phone || authUser?.phone || authUser?.user_metadata?.phone;
    if (riderPhone) {
      await updateRiderOnlineStatusInSupabase(riderPhone, nextState);
    }
  };

  // Workflow: ACCEPT REALTIME NOTIFICATION POPUP (FIRST-ACCEPT-WINS IN SUPABASE)
  const acceptIncomingNotification = async (notificationObj) => {
    playAcceptChime();
    const payload = notificationObj.payload || {};
    const orderId = payload.orderId || notificationObj.order_id;

    // 1. Update rider_notifications row to accepted if DB notification ID exists
    if (notificationObj.id && !notificationObj.id.startsWith('order-notif-')) {
      await respondToRiderNotification(notificationObj.id, 'accepted');
    }

    // 2. Update orders table in Supabase (status -> accepted, rider_id -> profile.id)
    await updateOrderStatusInSupabase(orderId, 'accepted', profile?.id);

    // 3. Set Active Delivery State with full Supabase details
    const activeObj = {
      id: orderId,
      storeName: payload.storeName || 'Local Grocery Store',
      storePhone: payload.storePhone || '+91 81238 21300',
      storeAddress: payload.storeAddress || 'Market Road, Chikkamagaluru',
      customerName: payload.customerName || 'Customer',
      customerPhone: payload.customerPhone || 'Phone not provided',
      deliveryAddress: payload.deliveryAddress || 'Chikkamagaluru, Karnataka',
      distance: payload.distance || '1.8 km',
      estimatedTime: payload.estimatedTime || '15-20 min',
      items: payload.items || ['Grocery Items'],
      itemCount: payload.itemCount || 1,
      estimatedEarnings: payload.estimatedEarnings || 65,
      paymentStatus: payload.paymentStatus || 'Cash on Delivery',
      status: 'accepted'
    };

    setActiveDelivery(activeObj);
    setIncomingNotification(null);
    setIncomingRequest(null);
    addRiderToast(`🎉 Order #${orderId} claimed! Head to pickup store.`, 'success');
  };

  // Workflow: DECLINE REALTIME NOTIFICATION POPUP
  const declineIncomingNotification = async (notificationId, reason = 'Declined by rider') => {
    playDeclineThud();
    setIncomingNotification(null);
    if (notificationId && !notificationId.startsWith('order-notif-')) {
      await respondToRiderNotification(notificationId, 'declined');
    }
    addRiderToast(`Delivery request declined (${reason}).`, 'info');
  };

  // Workflow: ACCEPT DELIVERY (Legacy)
  const acceptDelivery = async (deliveryObj) => {
    playAcceptChime();
    const active = { ...deliveryObj, status: 'accepted' };
    setActiveDelivery(active);
    setIncomingRequest(null);
    await updateOrderStatusInSupabase(deliveryObj.id, 'accepted', profile?.id);
    addRiderToast(`Delivery #${deliveryObj.id} accepted! Head to store.`, 'success');
  };

  // Workflow: DECLINE DELIVERY (Legacy)
  const declineDelivery = (deliveryId, reason) => {
    playDeclineThud();
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

  // Workflow: CONFIRM DELIVERY (Updates live rider earnings!)
  const confirmDeliveryWithOTP = async (otpInput) => {
    if (!activeDelivery) return false;

    const taskEarn = activeDelivery.estimatedEarnings || 65;

    const completedRecord = {
      id: activeDelivery.id,
      completedAt: 'Just now',
      storeName: activeDelivery.storeName,
      customerName: activeDelivery.customerName,
      deliveryAddress: activeDelivery.deliveryAddress,
      distance: activeDelivery.distance,
      earnings: taskEarn,
      paymentType: activeDelivery.paymentStatus,
      status: 'delivered'
    };

    const newHistory = [completedRecord, ...history];
    setHistory(newHistory);

    const updatedEarnings = {
      ...earnings,
      today: earnings.today + taskEarn,
      todayDeliveries: earnings.todayDeliveries + 1,
      todayDistanceKm: (parseFloat(earnings.todayDistanceKm || 0) + 4.2).toFixed(1),
      thisWeek: earnings.thisWeek + taskEarn,
      thisMonth: earnings.thisMonth + taskEarn,
      baseEarnings: earnings.baseEarnings + Math.round(taskEarn * 0.85),
      tips: earnings.tips + Math.round(taskEarn * 0.10)
    };

    setEarnings(updatedEarnings);
    try {
      localStorage.setItem('gharsee_rider_earnings', JSON.stringify(updatedEarnings));
    } catch {}

    await updateOrderStatusInSupabase(activeDelivery.id, 'delivered');
    addRiderToast(`🎉 Delivery Completed! +₹${taskEarn} added to earnings.`, 'success');
    setActiveDelivery(null);
    return true;
  };

  const loginRider = async (userObj) => {
    setAuthUser(userObj);
    setIsLoggedIn(true);
    setIsOnline(true);
    try {
      localStorage.setItem('gharsee_rider_logged_in', 'true');
    } catch {}

    const riderPhone = userObj.phone || userObj.user_metadata?.phone;
    if (riderPhone) {
      await updateRiderOnlineStatusInSupabase(riderPhone, true);
      await loadRiderProfileFromSupabase(riderPhone);
    } else {
      const liveProfile = {
        id: userObj.id,
        name: userObj.full_name || userObj.user_metadata?.full_name || userObj.name || 'Delivery Partner',
        phone: userObj.phone || '+91 81238 21300',
        email: `${get10DigitPhone(userObj.phone || '8123821300')}@gharsee.app`,
        rating: userObj.rating || 5.0,
        totalDeliveries: userObj.total_deliveries || 0,
        memberSince: 'Recently Joined',
        vehicleType: userObj.vehicle_type || userObj.vehicleType || 'Scooter',
        vehicleNumber: userObj.vehicle_number || userObj.vehicleNumber || 'Not specified',
        drivingLicense: userObj.driving_license || userObj.drivingLicense || 'Not specified',
        city: userObj.delivery_city || userObj.city || 'Chikkamagaluru, Karnataka',
        avatar: '/images/hero_grocery.jpg',
        isOnline: true
      };
      setProfile(liveProfile);
      try {
        localStorage.setItem('gharsee_rider_profile', JSON.stringify(liveProfile));
      } catch {}
    }
  };

  const logoutRider = async () => {
    const riderPhone = profile?.phone || authUser?.phone || authUser?.user_metadata?.phone;
    if (riderPhone) {
      await updateRiderOnlineStatusInSupabase(riderPhone, false);
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuthUser(null);
    setIsLoggedIn(false);
    setIsOnline(false);
    setActiveDelivery(null);
    setIncomingNotification(null);
    setProfile(INITIAL_RIDER_PROFILE);
    setEarnings(INITIAL_RIDER_EARNINGS);
    try {
      localStorage.removeItem('gharsee_rider_logged_in');
      localStorage.removeItem('gharsee_rider_profile');
      localStorage.removeItem('gharsee_rider_earnings');
    } catch {}
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
        incomingNotification,
        earnings,
        history,
        profile,
        notifications,
        activeRiderTab,
        toasts,
        setActiveRiderTab,
        toggleAvailability,
        acceptIncomingNotification,
        declineIncomingNotification,
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
