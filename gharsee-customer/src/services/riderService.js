import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePhone, get10DigitPhone, generateUUID } from './authService';

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
      estimatedEarnings: isAnyStore ? 85 : 65,
      distance: '1.8 km',
      estimatedTime: 'Delivery after 4:00 PM'
    };

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

    return !insertErr;
  } catch (err) {
    console.error('Exception in broadcastOrderToRidersInSupabase:', err);
    return false;
  }
}

// Update Rider is_online status in Supabase rider_profiles table
export async function updateRiderOnlineStatusInSupabase(riderPhone, isOnlineStatus) {
  if (!isSupabaseConfigured || !riderPhone) return false;

  try {
    const cleanDigits = get10DigitPhone(riderPhone);
    const { data: riders } = await supabase.from('rider_profiles').select('*');

    const matchedRider = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    if (matchedRider) {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ is_online: isOnlineStatus })
        .eq('id', matchedRider.id);

      return !error;
    } else {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ is_online: isOnlineStatus })
        .eq('phone', riderPhone);

      return !error;
    }
  } catch (err) {
    console.error('Error updating rider is_online status in Supabase:', err);
    return false;
  }
}

// Sign Up new Rider directly into Supabase rider_profiles table
export async function signUpRiderInSupabase({ phone, password, fullName, vehicleType = 'scooter', vehicleNumber = '', drivingLicense = '', deliveryCity = 'Chikkamagaluru' }) {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password || password.length < 4) {
    return { user: null, error: 'Password must be at least 4 characters long.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    // 1. Check if rider with this 10-digit phone already exists in Supabase rider_profiles table
    const { data: allRiders } = await supabase.from('rider_profiles').select('*');
    const existingRider = (allRiders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    if (existingRider) {
      return { user: null, error: `A delivery partner account with phone number ${phone} is already registered in database. Please click Sign In.` };
    }

    // 2. Full Payload WITHOUT user_id or owner_id to prevent Foreign Key constraints
    const payload = {
      full_name: fullName.trim(),
      phone: normalizedPhone,
      password: password,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      driving_license: drivingLicense.trim().toUpperCase(),
      delivery_city: deliveryCity,
      is_online: true
    };

    const { data: newRider, error: insertErr } = await supabase
      .from('rider_profiles')
      .insert([payload])
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('Supabase rider_profiles insert error:', insertErr.message);

      // Retry with minimal schema fallback if optional columns differ
      const minimalPayload = {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        password: password,
        is_online: true
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('rider_profiles')
        .insert([minimalPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        return { user: null, error: `Failed to register rider in Supabase: ${retryErr.message}` };
      }

      const riderUser = {
        id: retryData?.id || generateUUID(),
        phone: normalizedPhone,
        user_metadata: { full_name: fullName, role: 'rider' },
        ...retryData
      };
      return { user: riderUser, error: null };
    }

    const riderUser = {
      id: newRider?.id || generateUUID(),
      phone: normalizedPhone,
      user_metadata: { full_name: fullName, role: 'rider' },
      ...newRider
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signUpRiderInSupabase:', err);
    return { user: null, error: err.message || 'Rider registration failed' };
  }
}

// Sign In Rider directly from Supabase rider_profiles table
export async function signInRiderWithPhone({ phone, password }) {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanDigits = get10DigitPhone(phone);
  if (!cleanDigits || cleanDigits.length < 10) {
    return { user: null, error: 'Please enter a valid 10-digit mobile phone number.' };
  }

  if (!password) {
    return { user: null, error: 'Please enter your password.' };
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    // 1. Fetch all riders from Supabase rider_profiles table and match by 10-digit phone number
    const { data: riders, error: ridersErr } = await supabase.from('rider_profiles').select('*');

    if (ridersErr) {
      console.error('Error fetching rider_profiles from Supabase:', ridersErr);
    }

    const matchedRider = (riders || []).find(r => get10DigitPhone(r.phone) === cleanDigits);

    // CRITICAL CHECK 1: IF RIDER IS NOT IN rider_profiles TABLE -> DENY ACCESS!
    if (!matchedRider) {
      return {
        user: null,
        error: `No delivery partner account found in database for mobile number ${phone}. Access denied. Please register as a new rider.`
      };
    }

    // CRITICAL CHECK 2: VERIFY PASSWORD DIRECTLY FROM rider_profiles RECORD
    if (matchedRider.password && matchedRider.password !== password) {
      return {
        user: null,
        error: 'Incorrect password for this rider account. Phone number and password do not match our database records.'
      };
    }

    // Set rider is_online = true in Supabase upon successful sign-in
    try {
      await supabase
        .from('rider_profiles')
        .update({ is_online: true, password: password })
        .eq('id', matchedRider.id);
    } catch {}

    const riderUser = {
      id: matchedRider.id || generateUUID(),
      phone: matchedRider.phone || normalizedPhone,
      user_metadata: { full_name: matchedRider.full_name || 'Delivery Partner', role: 'rider' },
      ...matchedRider,
      is_online: true
    };

    return { user: riderUser, error: null };
  } catch (err) {
    console.error('Exception in signInRiderWithPhone:', err);
    return { user: null, error: 'Authentication failed. Please check phone number and password.' };
  }
}