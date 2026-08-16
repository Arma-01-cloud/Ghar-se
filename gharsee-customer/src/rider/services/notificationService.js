import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// Broadcast a new order notification to all online riders in Supabase
export async function broadcastOrderToRidersInSupabase(orderData) {
  if (!isSupabaseConfigured || !orderData) return false;

  try {
    const { data: onlineRiders, error: riderErr } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('is_online', true);

    if (riderErr || !onlineRiders || onlineRiders.length === 0) {
      return false;
    }

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
    }

    const itemsList = Array.isArray(orderData.items)
      ? orderData.items.map(i => `${i.name || i.itemName || 'Item'} (${i.quantity || i.qty || 1} ${i.unit || 'unit'})`)
      : ['Grocery Items'];

    const payload = {
      orderId: orderData.id,
      storeName,
      storePhone,
      storeAddress,
      customerName: orderData.customer_name || orderData.customerName || 'Customer',
      customerPhone: orderData.customer_phone || orderData.customerPhone || 'Phone not provided',
      deliveryAddress: orderData.delivery_address || orderData.address || 'Chikkamagaluru, Karnataka',
      itemCount: itemsList.length,
      items: itemsList,
      totalAmount: orderData.total_amount || orderData.totalAmount || orderData.total || 0,
      paymentStatus: orderData.payment_method || orderData.paymentMethod || 'Cash on Delivery',
      estimatedEarnings: 65,
      distance: '1.8 km',
      estimatedTime: '15-20 min'
    };

    const notificationRows = onlineRiders.map(rider => ({
      order_id: orderData.id,
      rider_id: rider.id,
      status: 'pending',
      payload: payload,
      expires_at: new Date(Date.now() + 30000).toISOString()
    }));

    await supabase
      .from('rider_notifications')
      .upsert(notificationRows, { onConflict: 'rider_id,order_id' });

    return true;
  } catch (err) {
    return false;
  }
}
