import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { get10DigitPhone } from '../../services/authService';

// Broadcast a new order notification to all online riders in Supabase
export async function broadcastOrderToRidersInSupabase(orderData) {
  if (!isSupabaseConfigured || !orderData) return false;

  try {
    // 1. Fetch online riders from rider_profiles in Supabase
    const { data: onlineRiders, error: riderErr } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('is_online', true);

    if (riderErr || !onlineRiders || onlineRiders.length === 0) {
      console.log('No online riders available for notification broadcast.');
      return false;
    }

    // 2. Fetch Store Details from shops table in Supabase
    let storeName = orderData.store_name || orderData.storeName || 'Local Grocery Store';
    let storePhone = '+91 81238 21300';
    let storeAddress = 'Market Road, Chikkamagaluru';

    if (orderData.store_id) {
      const { data: shopRow } = await supabase
        .from('shops')
        .select('*')
        .eq('id', orderData.store_id)
        .maybeSingle();

      if (shopRow) {
        storeName = shopRow.name || storeName;
        storePhone = shopRow.phone || shopRow.shopkeeper_phone || storePhone;
        storeAddress = shopRow.address || storeAddress;
      }
    } else {
      const { data: allShops } = await supabase.from('shops').select('*');
      if (allShops && allShops.length > 0) {
        const matched = allShops.find(s => s.name?.toLowerCase() === storeName.toLowerCase()) || allShops[0];
        if (matched) {
          storeName = matched.name;
          storePhone = matched.phone || matched.shopkeeper_phone || storePhone;
          storeAddress = matched.address || storeAddress;
        }
      }
    }

    // 3. Prepare rich notification payload JSONB (Support Grocery Image Orders & Standard Orders)
    const isImageOrder = Boolean(
      orderData.order_type === 'image' ||
      orderData.isDirectImageOrder ||
      orderData.image_url ||
      (Array.isArray(orderData.items) && orderData.items.some(i => i && (i.isDirectImageOrder || i.image_url || i.image)))
    );

    const imageUrl = orderData.image_url ||
      (Array.isArray(orderData.items) && (orderData.items[0]?.image_url || orderData.items[0]?.image)) ||
      null;

    const customerNote = (orderData.notes || orderData.note || (Array.isArray(orderData.items) && orderData.items[0]?.note) || '').trim();

    const parsedItems = Array.isArray(orderData.items)
      ? orderData.items.map(i => typeof i === 'string' ? { name: i, quantity: 1, unit: '1 unit', price: 0 } : {
          name: i.name || i.product_name || i.itemName,
          quantity: i.quantity || i.qty || 1,
          unit: i.unit || i.quantityUnit || (i.isDirectImageOrder ? 'image order' : '1 unit'),
          price: i.price || 0,
          isManual: i.isManual || !i.product_id,
          isDirectImageOrder: Boolean(i.isDirectImageOrder || i.image_url),
          image_url: i.image_url || i.image || null,
          note: i.note || ''
        })
      : [];

    const itemsList = isImageOrder
      ? [`📸 Customer Grocery Photo List (${parsedItems[0]?.quantity || 1} image)`]
      : (parsedItems.length > 0
          ? parsedItems.map(i => `${i.name} (Quantity: ${i.quantity}, Weight: ${i.unit})`)
          : ['Grocery Items']);

    const isAnyStore = orderData.fulfillment_mode === 'shop_any_store' || !orderData.store_id;

    const payload = {
      orderId: orderData.id,
      order_type: isImageOrder ? 'image' : (orderData.order_type || 'standard'),
      isDirectImageOrder: isImageOrder,
      isImageOrder: isImageOrder,
      image_url: imageUrl,
      image: imageUrl,
      note: customerNote,
      notes: customerNote,
      storeName: isAnyStore ? 'Shop From Any Store (Rider Selects Shop)' : storeName,
      storePhone,
      storeAddress,
      customerName: orderData.customer_name || orderData.customerName || 'Customer',
      customerPhone: orderData.customer_phone || orderData.customerPhone || 'Phone not provided',
      deliveryAddress: orderData.delivery_address || orderData.address || 'Chikkamagaluru, Karnataka',
      itemCount: itemsList.length,
      items: itemsList,
      parsedItems: parsedItems,
      fulfillment_mode: isAnyStore ? 'shop_any_store' : 'store_selected',
      isAnyStore: isAnyStore,
      totalAmount: orderData.total_amount || orderData.totalAmount || orderData.total || 0,
      paymentStatus: orderData.payment_method || orderData.paymentMethod || 'Cash on Delivery',
      estimatedEarnings: isAnyStore ? 85 : 65, // Higher payout for multi-store delivery!
      distance: '1.8 km',
      estimatedTime: 'Delivery after 4:00 PM'
    };

    // 4. Create a rider_notifications row for each online rider
    const notificationRows = onlineRiders.map(rider => ({
      order_id: orderData.id,
      rider_id: rider.id,
      status: 'pending',
      payload: payload,
      expires_at: new Date(Date.now() + 30000).toISOString()
    }));

    const { error: insertErr } = await supabase
      .from('rider_notifications')
      .upsert(notificationRows, { onConflict: 'rider_id,order_id' });

    if (insertErr) {
      console.error('Error inserting rider_notifications:', insertErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception broadcasting order notification to riders:', err);
    return false;
  }
}

// Subscribe to real-time incoming delivery requests for a specific rider
export function subscribeToRiderNotifications(riderId, onNotificationReceived) {
  if (!isSupabaseConfigured || !riderId) return null;

  try {
    const channel = supabase
      .channel(`rider-notifications:${riderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rider_notifications',
          filter: `rider_id=eq.${riderId}`
        },
        (payload) => {
          if (payload.new && payload.new.status === 'pending') {
            onNotificationReceived(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rider_notifications',
          filter: `rider_id=eq.${riderId}`
        },
        (payload) => {
          if (payload.new) {
            onNotificationReceived(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.error('Error setting up Realtime subscription for rider:', err);
    return null;
  }
}

// Fetch pending active notification for rider on mount or reconnect
export async function fetchPendingRiderNotification(riderId) {
  if (!isSupabaseConfigured || !riderId) return null;

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('rider_notifications')
      .select('*')
      .eq('rider_id', riderId)
      .eq('status', 'pending')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// Respond to a notification (ACCEPT or DECLINE)
export async function respondToRiderNotification(notificationId, action = 'accepted') {
  if (!isSupabaseConfigured || !notificationId) return false;

  try {
    const { error } = await supabase
      .from('rider_notifications')
      .update({
        status: action,
        responded_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    return !error;
  } catch (err) {
    console.error('Error updating rider notification response:', err);
    return false;
  }
}
