import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { get10DigitPhone } from './authService';
import { broadcastOrderToRidersInSupabase } from '../rider/services/notificationService';
import { isValidOrderStatus, isValidOrderStatusTransition, validateOrderPayload } from '../utils/validators';
import { calculateHaversineDistance, formatDistance } from './locationService';
import { resolveStoreCoordinates } from './storeService';

// Resolve base URL for partner app (supports VITE_PARTNER_APP_URL, VITE_PARTNER_URL, Vercel multi-subdomain patterns, and current origin fallback)
export function getPartnerAppBaseUrl() {
  const envPartnerUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_PARTNER_APP_URL || import.meta.env.VITE_PARTNER_URL)) || ''
  ).trim().replace(/\/+$/, '');

  if (envPartnerUrl) {
    return envPartnerUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Replace customer deployment host with partner deployment host if on customer domain
    if (origin.includes('gharsee-customer')) {
      return origin.replace('gharsee-customer', 'gharsee-partner');
    }
    if (origin.includes('customer.')) {
      return origin.replace('customer.', 'partner.');
    }
    return origin;
  }

  return 'https://gharsee-partner.vercel.app';
}

// Build WhatsApp notification URL & text for Shopkeeper
export function generateShopkeeperWhatsAppUrl(shopkeeperPhone, order, customerName, customerPhone) {
  const cleanDigits = get10DigitPhone(shopkeeperPhone);
  if (!cleanDigits || cleanDigits.length !== 10) {
    return {
      whatsappUrl: '',
      whatsappMessage: '',
      targetPhone: '',
      error: 'This shopkeeper has not registered a WhatsApp number.'
    };
  }
  const targetPhone = `91${cleanDigits}`;

  let itemsFormatted = '';
  if (order.items && order.items.length > 0) {
    itemsFormatted = order.items.map((item, idx) => {
      const isManual = !item.id || (typeof item.id === 'string' && item.id.length < 20) || item.isManual;
      const tag = isManual ? ' (Manual Item)' : '';
      const qty = item.quantity || item.qty || 1;
      const weight = item.unit || item.quantityUnit || '1 unit';
      const priceStr = item.price ? ` - ₹${item.price * qty}` : '';
      return `${idx + 1}. *${item.name || item.itemName || 'Grocery Item'}* (Quantity: ${qty}, Weight: ${weight})${priceStr}${tag}`;
    }).join('\n');
  } else {
    itemsFormatted = '1. Grocery Items';
  }

  const messageText = 
`🛒 *New GharSee Order*

*Order ID:* #${order.id}

*Customer Name:* ${customerName || 'Customer'}
*Customer Phone:* ${customerPhone || 'Not provided'}

*Order Items:*
${itemsFormatted}

*Delivery Address:*
${order.address || order.deliveryAddress || 'Address not provided'}

*Total Amount:* ₹${order.totalAmount || order.total || 0} (${order.paymentMethod || 'Cash on Delivery'})

Please open your GharSee Partner dashboard to view and process the order.`;

  const encodedMessage = encodeURIComponent(messageText);
  return {
    whatsappUrl: `https://wa.me/${targetPhone}?text=${encodedMessage}`,
    whatsappMessage: messageText,
    targetPhone
  };
}

// Create a new order in Supabase orders and order_items tables & broadcast notification to riders
export async function createOrderInSupabase(orderData) {
  // Client-side validation — never trust the cart payload.
  const validation = validateOrderPayload(orderData);
  if (!validation.ok) {
    console.warn('Order payload validation failed:', validation.errors);
    return {
      order: orderData,
      shopkeeperPhone: '+918123821300',
      whatsappUrl: '',
      whatsappMessage: '',
      error: validation.errors[0] || 'Invalid order'
    };
  }

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
    
    let deliveryAddress = orderData.deliveryAddress || orderData.address || orderData.delivery_address || orderData.locationName || '';
    if (!deliveryAddress || deliveryAddress === 'Customer Address') {
      try {
        const savedLoc = JSON.parse(localStorage.getItem('gharsee_current_location') || '{}');
        deliveryAddress = savedLoc.formattedAddress || savedLoc.name || `${savedLoc.flat ? savedLoc.flat + ', ' : ''}${savedLoc.street ? savedLoc.street + ', ' : ''}${savedLoc.city || ''}`.trim() || 'Doorstep Delivery';
      } catch {
        deliveryAddress = 'Doorstep Delivery';
      }
    }

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

      if ((!deliveryAddress || deliveryAddress === 'Doorstep Delivery') && matchedAddr?.address_text) {
        deliveryAddress = matchedAddr.address_text;
      }
    }

    // 2. Authoritative Shopkeeper / Store Database Lookup
    const isAnyStore = orderData.fulfillment_mode === 'shop_any_store' || !orderData.store_id;
    let shopkeeperPhone = '+91 81238 21300';
    let storeName = isAnyStore ? 'Shop From Any Store (Rider Choice)' : (orderData.storeName || orderData.store_name || 'Local Grocery Store');

    if (!isAnyStore && orderData.store_id) {
      const { data: storeRow } = await supabase
        .from('shops')
        .select('*')
        .eq('id', orderData.store_id)
        .maybeSingle();

      if (storeRow) {
        storeName = storeRow.name || storeName;
        shopkeeperPhone = storeRow.phone || storeRow.shopkeeper_phone || shopkeeperPhone;
      }
    }

    // 3. Insert row into orders table with REAL customer_phone & customer_name & store_id
    const { data: insertedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        id: orderData.id,
        store_id: isAnyStore ? null : (orderData.store_id || null),
        store_name: storeName,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        fulfillment_mode: isAnyStore ? 'shop_any_store' : (orderData.fulfillment_mode || 'store_selected'),
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

    const finalOrder = insertedOrder || {
      ...orderData,
      customerName,
      customerPhone,
      storeName,
      delivery_address: deliveryAddress,
      deliveryAddress: deliveryAddress,
      address: deliveryAddress
    };

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

    // 5. USE CASE 1 (Store Selected): Send order & product list strictly to selected shopkeeper via WhatsApp & store portal
    let whatsappData = { whatsappUrl: '', whatsappMessage: '' };
    if (!isAnyStore && shopkeeperPhone) {
      whatsappData = generateShopkeeperWhatsAppUrl(
        shopkeeperPhone,
        finalOrder,
        customerName,
        customerPhone
      );
    }

    // 6. USE CASE 2 (Shop From Any Store): Broadcast order & product list to online riders (first-accept-wins)
    if (isAnyStore) {
      await broadcastOrderToRidersInSupabase(finalOrder);
    }

    return {
      order: {
        ...finalOrder,
        address: deliveryAddress,
        deliveryAddress: deliveryAddress,
        delivery_address: deliveryAddress,
        customerName,
        customerPhone,
        storeName
      },
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
      const jsonItems = Array.isArray(o.items) ? o.items : [];
      const orderImageUrl = o.image_url || jsonItems[0]?.image_url || jsonItems[0]?.image || null;
      const orderNote = o.notes || jsonItems[0]?.note || null;
      const isImageOrder = o.order_type === 'image' || jsonItems.some(i => i.isDirectImageOrder || i.image_url) || Boolean(orderImageUrl);

      let resolvedItems = [];
      if (jsonItems.length > 0) {
        resolvedItems = jsonItems.map(i => ({
          id: i.id || i.product_id,
          name: i.name || i.product_name || (isImageOrder ? 'Grocery Image List' : 'Grocery Item'),
          quantity: i.quantity || i.qty || 1,
          qty: i.quantity || i.qty || 1,
          unit: i.unit || (isImageOrder ? 'image order' : '1 unit'),
          price: i.price || 0,
          note: i.note || orderNote || '',
          image: i.image_url || i.image || orderImageUrl || '/images/cat_veg_fruits.jpg',
          image_url: i.image_url || i.image || orderImageUrl,
          image_path: i.image_path || null,
          isDirectImageOrder: i.isDirectImageOrder || Boolean(i.image_url || orderImageUrl),
          isManual: i.isManual || !i.product_id,
          replacementPreference: i.replacementPreference || i.replacement_preference || 'replace_brand'
        }));
      } else if (o.order_items && o.order_items.length > 0) {
        resolvedItems = o.order_items.map(i => ({
          id: i.product_id || i.id,
          name: i.product_name,
          quantity: i.quantity || 1,
          qty: i.quantity || 1,
          unit: i.unit || '1 unit',
          price: i.price || 0,
          replacementPreference: i.replacement_preference || 'replace_brand',
          isManual: !i.product_id,
          image: '/images/cat_veg_fruits.jpg'
        }));
      }

      return {
        id: o.id,
        store_id: o.store_id,
        storeId: o.store_id,
        store_name: o.store_name,
        storeName: o.store_name,
        customerName: o.customer_name || 'Customer',
        customerPhone: phoneNum,
        phone: phoneNum,
        deliveryAddress: o.delivery_address || 'Chikkamagaluru, Karnataka',
        address: o.delivery_address || 'Chikkamagaluru, Karnataka',
        total: o.total_amount || 0,
        status: (o.status || 'pending').toLowerCase(),
        fulfillment_mode: o.fulfillment_mode || 'store_selected',
        order_type: isImageOrder ? 'image' : (o.order_type || 'standard'),
        isDirectImageOrder: isImageOrder,
        image_url: orderImageUrl,
        imageUrl: orderImageUrl,
        image_path: o.image_path || (jsonItems[0]?.image_path) || null,
        note: orderNote,
        quantity: o.quantity || (jsonItems[0]?.quantity) || 1,
        createdAt: o.created_at || new Date().toISOString(),
        paymentStatus: o.payment_status || (isImageOrder ? 'Pay After Inspection' : 'Pending'),
        deliveryType: o.payment_method || 'Cash on Delivery',
        items: resolvedItems
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

      const storeCoords = resolveStoreCoordinates(storeObj);
      const deliveryLat = o.delivery_latitude || o.latitude;
      const deliveryLon = o.delivery_longitude || o.longitude;

      let computedDistance = null;
      if (storeCoords.latitude != null && storeCoords.longitude != null && deliveryLat != null && deliveryLon != null) {
        const dKm = calculateHaversineDistance(storeCoords.latitude, storeCoords.longitude, deliveryLat, deliveryLon);
        computedDistance = formatDistance(dKm);
      }

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
        distance: computedDistance || 'Local Delivery',
        estimatedTime: 'Delivery after 4:00 PM',
        parsedItems: (o.order_items && o.order_items.length > 0) ? o.order_items.map(i => ({
          name: i.product_name || i.name,
          quantity: i.quantity || 1,
          unit: i.unit || '1 unit',
          price: i.price || 0,
          isManual: !i.product_id
        })) : (Array.isArray(o.items) ? o.items.map(i => typeof i === 'string' ? { name: i, quantity: 1, unit: '1 unit', price: 0 } : i) : []),
        estimatedEarnings: 65,
        paymentStatus: o.payment_method || 'Cash on Delivery',
        status: o.status || 'pending',
        fulfillment_mode: o.fulfillment_mode || (o.store_id ? 'store_selected' : 'shop_any_store')
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

// Atomically Claim Order in Supabase (First-Accept-Wins)
export async function claimRiderOrderInSupabase(orderId, riderId, riderName = '') {
  if (!isSupabaseConfigured) return { success: true };

  try {
    // 1. Verify if already claimed by another rider
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, rider_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (existingOrder && existingOrder.rider_id && String(existingOrder.rider_id) !== String(riderId)) {
      return {
        success: false,
        reason: 'ALREADY_CLAIMED',
        message: 'This delivery was already accepted by another partner.'
      };
    }

    // 2. Claim the order atomically
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'accepted',
        rider_id: riderId
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, reason: 'UPDATE_FAILED', message: updateError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, reason: 'EXCEPTION', message: err.message };
  }
}

// Update Order Status in Supabase with timestamp support
// Performs a read-then-conditional-update so a client can't fast-forward an
// order through the workflow by sending an arbitrary status, and so a
// shopkeeper can only touch their own orders.
export async function updateOrderStatusInSupabase(orderId, newStatus, riderId = null, storeId = null) {
  if (!isSupabaseConfigured) return true;

  if (!isValidOrderStatus(newStatus)) {
    console.warn('updateOrderStatusInSupabase: invalid status', newStatus);
    return false;
  }

  try {
    // Read current status to validate the transition client-side. This is
    // defense-in-depth: the database is still the source of truth and should
    // also enforce the workflow via a trigger or check constraint.
    const { data: current, error: readErr } = await supabase
      .from('orders')
      .select('id, status, rider_id, store_id')
      .eq('id', orderId)
      .maybeSingle();

    if (readErr) {
      console.warn('updateOrderStatusInSupabase: read failed', readErr.message);
      return false;
    }

    if (current && current.status && !isValidOrderStatusTransition(current.status, newStatus)) {
      console.warn(
        `updateOrderStatusInSupabase: refused transition ${current.status} -> ${newStatus} for order ${orderId}`
      );
      return false;
    }

    // Authorization: a rider may only update orders assigned to them.
    if (riderId && current && current.rider_id && String(current.rider_id) !== String(riderId)) {
      console.warn(
        `updateOrderStatusInSupabase: rider ${riderId} tried to update order ${orderId} assigned to ${current.rider_id}`
      );
      return false;
    }

    // Authorization: a shopkeeper may only update orders that belong to their store.
    if (storeId && current && current.store_id && String(current.store_id) !== String(storeId)) {
      console.warn(
        `updateOrderStatusInSupabase: shop ${storeId} tried to update order ${orderId} belonging to ${current.store_id}`
      );
      return false;
    }

    const updateData = { status: newStatus };
    if (riderId) {
      updateData.rider_id = riderId;
    }
    if (newStatus === 'delivered' || newStatus === 'completed') {
      updateData.delivered_at = new Date().toISOString();
    }

    let query = supabase.from('orders').update(updateData).eq('id', orderId);

    // Belt-and-braces: when called as a shopkeeper, also constrain the WHERE
    // clause so the SQL update cannot leak across stores.
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (riderId) {
      query = query.eq('rider_id', riderId);
    }

    const { error } = await query;

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
