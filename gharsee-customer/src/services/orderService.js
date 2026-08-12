import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Create a new order in Supabase orders and order_items tables
export async function createOrderInSupabase(orderData) {
  if (!isSupabaseConfigured) return orderData;

  try {
    let savedPhone = '';
    try { savedPhone = localStorage.getItem('gharsee_customer_phone') || ''; } catch {}
    
    let savedName = '';
    try { savedName = localStorage.getItem('gharsee_customer_name') || ''; } catch {}

    const customerPhone = orderData.customerPhone || orderData.phone || savedPhone;
    const customerName = orderData.customerName || orderData.name || savedName || 'Customer';
    const deliveryAddress = orderData.address || orderData.delivery_address || 'Chikkamagaluru, Karnataka';

    // 1. Insert row into orders table with REAL customer_phone & customer_name
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        id: orderData.id,
        store_id: orderData.store_id || null,
        store_name: orderData.storeName || orderData.store_name || 'Local Grocery Store',
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        fulfillment_mode: orderData.fulfillment_mode || 'store_selected',
        status: orderData.status || 'pending',
        total_amount: orderData.totalAmount || orderData.total_amount || 0,
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.deliveryFee || orderData.delivery_fee || 0,
        payment_method: orderData.paymentMethod || 'Cash on Delivery',
        items: orderData.items || []
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
        product_id: (item.id && typeof item.id === 'string' && item.id.length > 20) ? item.id : null,
        product_name: item.name || item.itemName || 'Grocery Item',
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        unit: item.unit || item.quantityUnit || '1 kg',
        replacement_preference: item.replacementPreference || 'replace_brand'
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
export async function fetchCustomerOrders(phone = null) {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (phone) {
      const cleanDigits = phone.replace(/\D/g, '');
      const searchPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : phone;
      query = query.or(`customer_phone.eq.${searchPhone},customer_phone.eq.${phone}`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(o => ({
      id: o.id,
      fulfillment_mode: o.fulfillment_mode || 'store_selected',
      store_id: o.store_id,
      storeName: o.store_name || 'Local Store',
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || o.phone || '',
      date: o.created_at || new Date().toISOString(),
      deliveredAt: o.delivered_at,
      items: (o.order_items && o.order_items.length > 0) ? o.order_items.map(i => ({
        id: i.product_id || i.id,
        name: i.product_name,
        price: i.price || 0,
        quantity: i.quantity || 1,
        qty: i.quantity || 1,
        unit: i.unit || '1 unit',
        replacementPreference: i.replacement_preference || 'replace_brand',
        image: '/images/cat_veg_fruits.jpg'
      })) : (Array.isArray(o.items) ? o.items : []),
      subtotal: o.subtotal || o.total_amount || 0,
      deliveryFee: o.delivery_fee || 0,
      totalAmount: o.total_amount || 0,
      status: o.status || 'pending',
      paymentMethod: o.payment_method || 'Cash on Delivery',
      address: o.delivery_address || 'Customer Address'
    }));
  } catch {
    return [];
  }
}

// Fetch Shopkeeper Orders strictly with real customer_phone from Supabase
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

    return data.map(o => {
      // Directly retrieve real customer_phone from Supabase orders row
      const phoneNum = o.customer_phone || o.phone || 'Phone not provided';

      return {
        id: o.id,
        customerName: o.customer_name || 'Customer',
        customerPhone: phoneNum,
        phone: phoneNum,
        deliveryAddress: o.delivery_address || 'Chikkamagaluru, Karnataka',
        address: o.delivery_address || 'Chikkamagaluru, Karnataka',
        total: o.total_amount || 0,
        status: (o.status || 'pending').toLowerCase(),
        fulfillment_mode: o.fulfillment_mode || 'store_selected',
        createdAt: o.created_at || new Date().toISOString(),
        paymentStatus: o.payment_status || 'Paid',
        deliveryType: o.payment_method || 'Cash on Delivery',
        items: (o.order_items && o.order_items.length > 0) ? o.order_items.map(i => ({
          id: i.product_id || i.id,
          name: i.product_name,
          quantity: i.quantity || 1,
          qty: i.quantity || 1,
          unit: i.unit || '1 unit',
          price: i.price || 0,
          replacementPreference: i.replacement_preference || 'replace_brand'
        })) : (Array.isArray(o.items) ? o.items : [])
      };
    });
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
      storeName: o.store_name || (o.store_id ? 'Sri Lakshmi Stores' : 'Local Grocery Store'),
      storeAddress: 'Market Road, Chikkamagaluru',
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || o.phone || '',
      deliveryAddress: o.delivery_address || 'Chikkamagaluru, Karnataka',
      distance: '1.8 km',
      estimatedTime: '15-20 min',
      itemCount: o.order_items?.length || (Array.isArray(o.items) ? o.items.length : 3),
      items: o.order_items?.map(i => `${i.product_name} (${i.quantity} ${i.unit})`) || ['Grocery Items'],
      estimatedEarnings: 65,
      paymentStatus: o.payment_method || 'Paid Online',
      status: o.status || 'pending',
      fulfillment_mode: o.fulfillment_mode || 'store_selected'
    }));

    const incoming = formattedOrders.find(o => o.status === 'ready' || o.status === 'READY') || null;
    const active = formattedOrders.find(o => o.status === 'accepted' || o.status === 'picked_up' || o.status === 'out_for_delivery') || null;
    const history = formattedOrders.filter(o => o.status === 'delivered' || o.status === 'completed');

    return { incoming, active, history };
  } catch {
    return { incoming: null, active: null, history: [] };
  }
}

// Update Order Status in Supabase with timestamp support
export async function updateOrderStatusInSupabase(orderId, newStatus, riderId = null) {
  if (!isSupabaseConfigured) return true;

  try {
    const updateData = { status: newStatus };
    if (riderId) {
      updateData.rider_id = riderId;
    }
    if (newStatus === 'delivered' || newStatus === 'completed') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
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
