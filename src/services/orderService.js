import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Create a new order in Supabase orders and order_items tables
export async function createOrderInSupabase(orderData) {
  if (!isSupabaseConfigured) return orderData;

  try {
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id || null;

    // 1. Insert row into orders table
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        id: orderData.id,
        user_id: userId,
        store_id: orderData.store_id || null,
        fulfillment_mode: orderData.fulfillment_mode || 'store_selected',
        status: orderData.status || 'Order Placed',
        total_amount: orderData.totalAmount || orderData.total_amount || 0,
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.deliveryFee || orderData.delivery_fee || 0,
        payment_method: orderData.paymentMethod || 'UPI',
        delivery_address: orderData.address || 'Default Address',
        items_summary: JSON.stringify(orderData.items || [])
      }])
      .select()
      .single();

    if (orderErr) {
      console.error('Supabase createOrder error:', orderErr.message);
      return orderData;
    }

    // 2. Insert item rows into order_items table
    if (orderData.items && orderData.items.length > 0) {
      const itemRows = orderData.items.map(item => ({
        order_id: insertedOrder.id,
        product_id: item.id || null,
        product_name: item.name,
        quantity: item.quantity || 1,
        price: item.price || 0,
        unit: item.unit || '1 unit'
      }));

      await supabase.from('order_items').insert(itemRows);
    }

    return insertedOrder || orderData;
  } catch (err) {
    console.error('Exception creating order in Supabase:', err);
    return orderData;
  }
}

// Fetch Customer Orders from Supabase
export async function fetchCustomerOrders() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(o => ({
      id: o.id,
      fulfillment_mode: o.fulfillment_mode || 'store_selected',
      store_id: o.store_id,
      storeName: o.store_id ? 'Local Store' : 'Store Selection Pending (Rider Will Select)',
      date: o.created_at || new Date().toISOString(),
      items: (o.order_items && o.order_items.length > 0) ? o.order_items.map(i => ({
        id: i.product_id || i.id,
        name: i.product_name || i.name || 'Item',
        price: i.price || 0,
        quantity: i.quantity || 1,
        unit: i.unit || '1 unit',
        image: '/images/cat_veg_fruits.jpg'
      })) : (JSON.parse(o.items_summary || '[]')),
      subtotal: o.subtotal || o.total_amount || 0,
      deliveryFee: o.delivery_fee || 0,
      totalAmount: o.total_amount || 0,
      status: o.status || 'Order Placed',
      paymentMethod: o.payment_method || 'UPI',
      address: o.delivery_address || 'Customer Address'
    }));
  } catch {
    return [];
  }
}

// Fetch Shopkeeper Orders from Supabase
export async function fetchShopkeeperOrders(shopId = null) {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (shopId) {
      query = query.eq('store_id', shopId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(o => ({
      id: o.id,
      customerName: 'Customer',
      customerPhone: '+919876543210',
      address: o.delivery_address || 'Indiranagar, Bengaluru',
      total: o.total_amount || 0,
      status: (o.status || 'pending').toLowerCase(),
      fulfillment_mode: o.fulfillment_mode || 'store_selected',
      createdAt: o.created_at || new Date().toISOString(),
      items: (o.order_items && o.order_items.length > 0) ? o.order_items.map(i => ({
        id: i.product_id || i.id,
        name: i.product_name || 'Item',
        quantity: i.quantity || 1,
        unit: i.unit || '1 unit',
        price: i.price || 0
      })) : (JSON.parse(o.items_summary || '[]'))
    }));
  } catch {
    return [];
  }
}

// Fetch Rider Deliveries from Supabase
export async function fetchRiderDeliveries() {
  if (!isSupabaseConfigured) return { incoming: null, active: null, history: [] };

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data) return { incoming: null, active: null, history: [] };

    const formattedOrders = data.map(o => ({
      id: o.id,
      storeName: o.store_id ? 'Sri Lakshmi Stores' : 'Store Selection Pending',
      storeAddress: 'Indiranagar, Bengaluru',
      customerName: 'Rahul K.',
      customerPhone: '+919876543210',
      deliveryAddress: o.delivery_address || 'Indiranagar, Bengaluru',
      distance: '2.1 km',
      estimatedTime: '15-20 min',
      itemCount: o.order_items?.length || 3,
      items: o.order_items?.map(i => `${i.product_name} (${i.quantity} ${i.unit})`) || ['Basmati Rice', 'Milk'],
      estimatedEarnings: 65,
      paymentStatus: o.payment_method || 'Paid Online',
      status: o.status || 'pending',
      fulfillment_mode: o.fulfillment_mode || 'store_selected'
    }));

    const incoming = formattedOrders.find(o => o.status === 'Order Placed' || o.status === 'SEARCHING_FOR_STORE' || o.status === 'pending') || null;
    const active = formattedOrders.find(o => o.status === 'accepted' || o.status === 'preparing' || o.status === 'out_for_delivery') || null;
    const history = formattedOrders.filter(o => o.status === 'delivered' || o.status === 'Delivered');

    return { incoming, active, history };
  } catch {
    return { incoming: null, active: null, history: [] };
  }
}

// Update Order Status in Supabase
export async function updateOrderStatusInSupabase(orderId, newStatus) {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    return !error;
  } catch {
    return false;
  }
}

// Assign Store to "Shop From Any Store" Order
export async function assignStoreToAnyStoreOrder(orderId, shopId) {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        store_id: shopId,
        status: 'SHOPPING'
      })
      .eq('id', orderId);

    return !error;
  } catch {
    return false;
  }
}
