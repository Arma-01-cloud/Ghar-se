import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from './authService';
import { broadcastOrderToRidersInSupabase } from '../rider/services/notificationService';

// Build WhatsApp notification URL & text for Shopkeeper
export function generateShopkeeperWhatsAppUrl(shopkeeperPhone, order, customerName, customerPhone) {
  const cleanDigits = get10DigitPhone(shopkeeperPhone) || '8123821300';
  const targetPhone = `91${cleanDigits}`;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharsee.app';
  const storeOrderLink = `${originUrl}/partner?orderId=${order.id}`;

  let itemsFormatted = '';
  if (order.items && order.items.length > 0) {
    itemsFormatted = order.items.map((item, idx) => {
      const isManual = !item.id || (typeof item.id === 'string' && item.id.length < 20) || item.isManual;
      const tag = isManual ? ' (Manual Item)' : '';
      const qtyStr = `${item.quantity || item.qty || 1} ${item.unit || 'unit'}`;
      return `${idx + 1}. ${item.name || item.itemName || 'Grocery Item'} × ${qtyStr}${tag}`;
    }).join('\n');
  } else {
    itemsFormatted = '1. Grocery Items';
  }

  const messageText = 
`🛒 *New Ghar See Order*

*Order ID:* #${order.id}

*Customer Name:* ${customerName}
*Customer Phone:* ${customerPhone}

*Order Items:*
${itemsFormatted}

*Delivery Address:*
${order.address || order.deliveryAddress || 'Address not provided'}

*Total Amount:* ₹${order.totalAmount || order.total || 0} (${order.paymentMethod || 'Cash on Delivery'})

Please open the shopkeeper order portal to view and process the order:
${storeOrderLink}`;

  const encodedMessage = encodeURIComponent(messageText);
  return {
    whatsappUrl: `https://wa.me/${targetPhone}?text=${encodedMessage}`,
    whatsappMessage: messageText,
    targetPhone
  };
}

// Create a new order in Supabase orders and order_items tables & broadcast notification to riders
export async function createOrderInSupabase(orderData) {
  if (!isSupabaseConfigured) {
    const defaultWhatsApp = generateShopkeeperWhatsAppUrl(
      '+918123821300',
      orderData,
      orderData.customerName || 'Customer',
      orderData.customerPhone || 'Phone not provided'
    );
    return {
      order: orderData,
      shopkeeperPhone: '+918123821300',
      whatsappUrl: defaultWhatsApp.whatsappUrl,
      whatsappMessage: defaultWhatsApp.whatsappMessage
    };
  }

  try {
    let savedPhone = '';
    try { savedPhone = localStorage.getItem('gharsee_customer_phone') || ''; } catch {}
    
    let savedName = '';
    try { savedName = localStorage.getItem('gharsee_customer_name') || ''; } catch {}

    let customerPhone = orderData.customerPhone || orderData.phone || savedPhone;
    let customerName = orderData.customerName || orderData.name || savedName || 'Customer';
    const deliveryAddress = orderData.address || orderData.delivery_address || 'Chikkamagaluru, Karnataka';

    // 1. Authoritative Customer Database Lookup from Supabase profiles / customer_addresses
    const cleanCustDigits = get10DigitPhone(customerPhone);
    if (cleanCustDigits && cleanCustDigits.length === 10) {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const matchedProf = (profiles || []).find(p => get10DigitPhone(p.phone) === cleanCustDigits);

      const { data: addresses } = await supabase.from('customer_addresses').select('*');
      const matchedAddr = (addresses || []).find(a => get10DigitPhone(a.phone) === cleanCustDigits);

      if (matchedProf?.full_name && matchedProf.full_name !== 'Customer') {
        customerName = matchedProf.full_name;
      } else if (matchedAddr?.full_name && matchedAddr.full_name !== 'Customer') {
        customerName = matchedAddr.full_name;
      }

      if (matchedProf?.phone) customerPhone = matchedProf.phone;
      else if (matchedAddr?.phone) customerPhone = matchedAddr.phone;
      else customerPhone = `+91 ${cleanCustDigits}`;
    }

    // 2. Authoritative Shopkeeper / Store Database Lookup from Supabase shops table
    let shopkeeperPhone = '+91 81238 21300';
    let storeName = orderData.storeName || orderData.store_name || 'Local Grocery Store';

    if (orderData.store_id) {
      const { data: storeRow } = await supabase
        .from('shops')
        .select('*')
        .eq('id', orderData.store_id)
        .maybeSingle();

      if (storeRow) {
        storeName = storeRow.name || storeName;
        shopkeeperPhone = storeRow.phone || storeRow.shopkeeper_phone || shopkeeperPhone;
      }
    } else {
      // Fallback lookup by shop name or first shop in Supabase
      const { data: allShops } = await supabase.from('shops').select('*');
      if (allShops && allShops.length > 0) {
        const matched = allShops.find(s => s.name?.toLowerCase() === storeName.toLowerCase()) || allShops[0];
        if (matched) {
          storeName = matched.name;
          shopkeeperPhone = matched.phone || matched.shopkeeper_phone || shopkeeperPhone;
        }
      }
    }

    // 3. Insert row into orders table with REAL customer_phone & customer_name & store_id
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        id: orderData.id,
        store_id: orderData.store_id || null,
        store_name: storeName,
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
    }

    const finalOrder = insertedOrder || { ...orderData, customerName, customerPhone, storeName };

    // 4. Insert item rows into order_items table (handles both catalog products & manual items)
    if (orderData.items && orderData.items.length > 0) {
      const itemRows = orderData.items.map(item => {
        const isUUID = item.id && typeof item.id === 'string' && item.id.length > 20;
        return {
          order_id: finalOrder.id,
          product_id: isUUID ? item.id : null,
          product_name: item.name || item.itemName || 'Grocery Item',
          quantity: item.quantity || item.qty || 1,
          price: item.price || 0,
          unit: item.unit || item.quantityUnit || '1 kg',
          replacement_preference: item.replacementPreference || 'replace_brand'
        };
      });

      await supabase.from('order_items').insert(itemRows);
    }

    // 5. Build WhatsApp notification link & message for shopkeeper
    const whatsappData = generateShopkeeperWhatsAppUrl(
      shopkeeperPhone,
      finalOrder,
      customerName,
      customerPhone
    );

    // 6. Broadcast Real-Time Notification to Online Riders in Supabase
    await broadcastOrderToRidersInSupabase(finalOrder);

    return {
      order: finalOrder,
      shopkeeperPhone,
      whatsappUrl: whatsappData.whatsappUrl,
      whatsappMessage: whatsappData.whatsappMessage
    };
  } catch (err) {
    console.error('Exception creating order in Supabase:', err);
    const defaultWhatsApp = generateShopkeeperWhatsAppUrl(
      '+918123821300',
      orderData,
      orderData.customerName || 'Customer',
      orderData.customerPhone || 'Phone not provided'
    );
    return {
      order: orderData,
      shopkeeperPhone: '+918123821300',
      whatsappUrl: defaultWhatsApp.whatsappUrl,
      whatsappMessage: defaultWhatsApp.whatsappMessage
    };
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
      const cleanDigits = get10DigitPhone(phone);
      if (cleanDigits && cleanDigits.length === 10) {
        const searchPhone = `+91${cleanDigits}`;
        query = query.or(`customer_phone.eq.${searchPhone},customer_phone.eq.${phone},customer_phone.ilike.%${cleanDigits}%`);
      }
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
        isManual: !i.product_id,
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
          replacementPreference: i.replacement_preference || 'replace_brand',
          isManual: !i.product_id
        })) : (Array.isArray(o.items) ? o.items : [])
      };
    });
  } catch {
    return [];
  }
}

// Fetch Rider Deliveries from Supabase with Store & Customer Details (Active ONLY if assigned to rider)
export async function fetchRiderDeliveries(riderId = null) {
  if (!isSupabaseConfigured) return { incoming: null, active: null, history: [] };

  try {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !orderData) return { incoming: null, active: null, history: [] };

    // Fetch Shops to get Store Addresses & Phone Numbers
    const { data: shopsData } = await supabase.from('shops').select('*');
    const shopMap = {};
    (shopsData || []).forEach(s => {
      shopMap[s.id] = s;
      if (s.name) shopMap[s.name.toLowerCase()] = s;
    });

    const formattedOrders = orderData.map(o => {
      const storeObj = shopMap[o.store_id] || shopMap[o.store_name?.toLowerCase()] || (shopsData && shopsData[0]) || {};
      const storePhone = storeObj.phone || storeObj.shopkeeper_phone || '+91 81238 21300';
      const storeAddress = storeObj.address || 'Market Road, Chikkamagaluru';

      return {
        id: o.id,
        rider_id: o.rider_id,
        store_id: o.store_id,
        storeName: o.store_name || storeObj.name || 'Local Grocery Store',
        storeAddress: storeAddress,
        storePhone: storePhone,
        customerName: o.customer_name || 'Customer',
        customerPhone: o.customer_phone || o.phone || '',
        deliveryAddress: o.delivery_address || 'Chikkamagaluru, Karnataka',
        distance: '1.8 km',
        estimatedTime: '15-20 min',
        itemCount: o.order_items?.length || (Array.isArray(o.items) ? o.items.length : 1),
        items: o.order_items?.map(i => `${i.product_name} (${i.quantity} ${i.unit})${!i.product_id ? ' (Manual Item)' : ''}`) || ['Grocery Items'],
        estimatedEarnings: 65,
        paymentStatus: o.payment_method || 'Cash on Delivery',
        status: o.status || 'pending',
        fulfillment_mode: o.fulfillment_mode || 'store_selected'
      };
    });

    const incoming = null; // Incoming requests pop up dynamically via Realtime popup!

    // Active delivery MUST be explicitly assigned to this specific rider!
    const active = formattedOrders.find(o => 
      (o.status === 'accepted' || o.status === 'picked_up' || o.status === 'out_for_delivery') && 
      riderId && String(o.rider_id) === String(riderId)
    ) || null;

    const history = formattedOrders.filter(o => 
      (o.status === 'delivered' || o.status === 'completed') &&
      (!riderId || String(o.rider_id) === String(riderId))
    );

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
