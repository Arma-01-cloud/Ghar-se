import { supabase } from '../lib/supabase';

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

// Real Supabase Store Fetching
export async function fetchCustomerStores(cityFilter = '') {
  try {
    let query = supabase.from('shops').select('*').order('created_at', { ascending: false });
    
    if (cityFilter && cityFilter.trim()) {
      const term = cityFilter.trim().split(',')[0].trim();
      if (term) {
        query = query.or(`city.ilike.%${term}%,locality.ilike.%${term}%,address.ilike.%${term}%,name.ilike.%${term}%`);
      }
    }

    const { data, error } = await query;
    
    if (!error && data && data.length > 0) {
      return data.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        address: s.address,
        locality: s.locality || 'Indiranagar',
        city: s.city || 'Bengaluru',
        state: s.state || 'Karnataka',
        rating: s.rating ? parseFloat(s.rating) : 4.8,
        reviews: 120,
        isOpen: s.is_open !== false,
        status: s.status || 'open',
        closingTime: '10:00 PM',
        categories: s.categories && s.categories.length > 0 ? s.categories : ['Groceries', 'Dairy', 'Vegetables', 'Rice & Grains'],
        image: s.image_url || '/images/store_lakshmi.jpg',
        distance: '~1.2 km away',
        deliveryTime: '15-25 min'
      }));
    }
  } catch (e) {
    console.error('Error fetching shops from Supabase:', e);
  }

  // Fallback if query returns no matching data for city filter: fetch all shops from Supabase
  try {
    const { data: allShops } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (allShops && allShops.length > 0) {
      return allShops.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        address: s.address,
        locality: s.locality || 'Indiranagar',
        city: s.city || 'Bengaluru',
        state: s.state || 'Karnataka',
        rating: s.rating ? parseFloat(s.rating) : 4.8,
        reviews: 120,
        isOpen: s.is_open !== false,
        status: s.status || 'open',
        closingTime: '10:00 PM',
        categories: s.categories && s.categories.length > 0 ? s.categories : ['Groceries', 'Dairy', 'Vegetables', 'Rice & Grains'],
        image: s.image_url || '/images/store_lakshmi.jpg',
        distance: '~1.2 km away',
        deliveryTime: '15-25 min'
      }));
    }
  } catch (e) {}

  return [];
}

// Real Supabase Product Fetching
export async function fetchCustomerProducts(storeId = null) {
  try {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (storeId && isValidUUID(storeId)) {
      query = query.eq('shop_id', storeId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(p => ({
        id: p.id,
        shop_id: p.shop_id,
        name: p.name,
        category: p.category || 'Groceries',
        price: parseFloat(p.price || 0),
        mrp: parseFloat(p.mrp || p.price || 0),
        unit: p.unit || '1 kg',
        stock: p.stock || 50,
        image: p.image_url || '/images/cat_veg_fruits.jpg',
        description: p.description || ''
      }));
    }
  } catch (e) {
    console.error('Error fetching products from Supabase:', e);
  }

  return [];
}

// Real Supabase Address Persistence Keyed by Mobile Phone Number
export async function saveCustomerAddressToSupabase(phone, addressObj) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;

  const addrText = typeof addressObj === 'string' ? addressObj : `${addressObj.flat || ''}, ${addressObj.street || ''}, ${addressObj.city || ''} - ${addressObj.pincode || ''}`;

  try {
    await supabase.from('customer_addresses').upsert({
      phone: digits,
      full_name: addressObj.fullName || 'Customer',
      flat: addressObj.flat || '',
      street: addressObj.street || '',
      city: addressObj.city || 'Bengaluru',
      pincode: addressObj.pincode || '',
      address_text: addrText,
      updated_at: new Date().toISOString()
    }, { onConflict: 'phone' });
  } catch (e) {
    console.error('Error saving customer address to Supabase:', e);
  }

  try {
    const savedAddresses = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
    savedAddresses[digits] = addressObj;
    localStorage.setItem('gharsee_phone_addresses', JSON.stringify(savedAddresses));
    localStorage.setItem('gharsee_customer_phone', digits);
  } catch (e) {}

  return true;
}

// Real Supabase Address Auto-Fetching by Phone Number
export async function fetchCustomerAddressByPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;

  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('phone', digits)
      .maybeSingle();

    if (!error && data) {
      return {
        fullName: data.full_name,
        phone: data.phone,
        flat: data.flat,
        street: data.street,
        city: data.city,
        pincode: data.pincode,
        name: `${data.street}, ${data.city}`
      };
    }
  } catch (e) {
    console.error('Error fetching customer address from Supabase:', e);
  }

  try {
    const savedAddresses = JSON.parse(localStorage.getItem('gharsee_phone_addresses') || '{}');
    if (savedAddresses[digits]) return savedAddresses[digits];
  } catch (e) {}

  return null;
}

// Real Supabase Order Placement
export async function placeCustomerOrder(orderPayload) {
  const newOrderId = `GK-${Math.floor(10000 + Math.random() * 90000)}`;

  const storeIdValid = isValidUUID(orderPayload.store_id || orderPayload.storeId) 
    ? (orderPayload.store_id || orderPayload.storeId) 
    : null;

  const orderRecord = {
    id: newOrderId,
    fulfillment_mode: orderPayload.fulfillment_mode || 'store_selected',
    store_id: storeIdValid,
    store_name: orderPayload.storeName || 'Local Grocery Store',
    customer_name: orderPayload.address?.fullName || orderPayload.fullName || 'Customer',
    customer_phone: orderPayload.phone || '+919876543210',
    delivery_address: typeof orderPayload.address === 'string' ? orderPayload.address : `${orderPayload.address?.flat || ''}, ${orderPayload.address?.street || ''}, ${orderPayload.address?.city || ''}`,
    items: orderPayload.items || [],
    subtotal: parseFloat(orderPayload.subtotal || 0),
    delivery_fee: parseFloat(orderPayload.deliveryFee || 0),
    total_amount: parseFloat(orderPayload.totalAmount || 0),
    payment_method: orderPayload.paymentMethod || 'Cash on Delivery',
    payment_status: 'Paid',
    status: 'pending'
  };

  try {
    const { data, error } = await supabase.from('orders').insert(orderRecord).select().single();
    if (!error && data) {
      console.log('✓ Order inserted into Supabase orders table successfully:', data.id);
      return data;
    } else if (error) {
      console.error('Supabase Order Insert Error:', error.message);
    }
  } catch (e) {
    console.error('Error placing order in Supabase:', e);
  }

  const existing = JSON.parse(localStorage.getItem('gharsee_customer_orders') || '[]');
  localStorage.setItem('gharsee_customer_orders', JSON.stringify([orderRecord, ...existing]));
  return orderRecord;
}

// Real Supabase Customer Order History
export async function fetchCustomerOrdersHistory(customerPhone = '') {
  if (customerPhone) {
    const digits = customerPhone.replace(/\D/g, '');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', digits)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    } catch (e) {}
  }

  const localOrders = JSON.parse(localStorage.getItem('gharsee_customer_orders') || '[]');
  return localOrders;
}
