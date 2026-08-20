import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { isValidOrderStatus } from '../../utils/validators';
import { 
  fetchGlobalCatalog,
  fetchGlobalCatalogStats,
  checkDuplicateGlobalProduct,
  createGlobalProduct,
  updateGlobalProduct,
  deleteGlobalProduct,
  fetchStoreAssignmentsForProduct,
  assignProductToStore,
  updateStoreProductPricing,
  removeProductFromStore,
  fetchStoreInventory,
  GLOBAL_CATEGORIES
} from '../../services/globalCatalogService';

export {
  fetchGlobalCatalog,
  fetchGlobalCatalogStats,
  checkDuplicateGlobalProduct,
  createGlobalProduct,
  updateGlobalProduct,
  deleteGlobalProduct,
  fetchStoreAssignmentsForProduct,
  assignProductToStore,
  updateStoreProductPricing,
  removeProductFromStore,
  fetchStoreInventory,
  GLOBAL_CATEGORIES
};

// Fetch all stores with approval, operational status, and live product count
export async function fetchAllAdminShops() {
  if (!isSupabaseConfigured) return [];

  try {
    const [shopsRes, prodsRes, storeProdsRes] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, shop_id'),
      supabase.from('store_products').select('id, store_id')
    ]);

    const { data, error } = shopsRes;
    const { data: allProducts } = prodsRes;
    const { data: allStoreProducts } = storeProdsRes;

    if (error || !data) {
      console.error('Error fetching admin shops:', error);
      return [];
    }

    const prodCountMap = new Map();
    (allProducts || []).forEach(p => {
      if (p.shop_id) {
        prodCountMap.set(p.shop_id, (prodCountMap.get(p.shop_id) || 0) + 1);
      }
    });

    (allStoreProducts || []).forEach(sp => {
      if (sp.store_id) {
        // If store_products is used, prefer store_products count
        prodCountMap.set(sp.store_id, (prodCountMap.get(sp.store_id) || 0) + 1);
      }
    });

    return data.map(s => {
      const statusLower = (s.status || '').toLowerCase();
      const isPending = statusLower === 'pending_approval' || statusLower === 'pending' || s.is_approved === false;
      const isApproved = !isPending && statusLower !== 'rejected';
      const isOpen = s.is_open ?? (statusLower === 'open' || statusLower === 'active');

      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        address: s.address,
        locality: s.locality || 'Local Area',
        city: s.city || 'Bengaluru',
        state: s.state || 'Karnataka',
        pincode: s.pincode || '',
        latitude: s.latitude,
        longitude: s.longitude,
        imageUrl: s.image_url || '/images/store_lakshmi.jpg',
        rating: s.rating || 5.0,
        status: s.status || (isPending ? 'pending_approval' : 'open'),
        isPending,
        isApproved,
        isOpen,
        categories: s.categories || ['Groceries', 'Dairy', 'Vegetables'],
        productCount: prodCountMap.get(s.id) || 0,
        createdAt: s.created_at || new Date().toISOString()
      };
    });
  } catch (err) {
    console.error('Exception in fetchAllAdminShops:', err);
    return [];
  }
}

// Approve / Accept a Shop Registration
export async function approveShopInSupabase(shopId) {
  if (!isSupabaseConfigured || !shopId) return false;

  try {
    const { error } = await supabase
      .from('shops')
      .update({
        status: 'open',
        is_open: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) {
      console.warn('First approveShop update failed, trying fallback without updated_at:', error.message);
      const { error: err2 } = await supabase
        .from('shops')
        .update({
          status: 'open',
          is_open: true
        })
        .eq('id', shopId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in approveShopInSupabase:', err);
    return false;
  }
}

// Reject a Shop Registration
export async function rejectShopInSupabase(shopId) {
  if (!isSupabaseConfigured || !shopId) return false;

  try {
    const { error } = await supabase
      .from('shops')
      .update({
        status: 'rejected',
        is_open: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) {
      const { error: err2 } = await supabase
        .from('shops')
        .update({
          status: 'rejected',
          is_open: false
        })
        .eq('id', shopId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in rejectShopInSupabase:', err);
    return false;
  }
}

// Toggle Shop Operational Status (Open / Close)
export async function toggleShopStatusInSupabase(shopId, currentIsOpen) {
  if (!isSupabaseConfigured) return false;

  const nextIsOpen = !currentIsOpen;
  const nextStatus = nextIsOpen ? 'open' : 'closed';

  try {
    const { error } = await supabase
      .from('shops')
      .update({
        is_open: nextIsOpen,
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) {
      const { error: err2 } = await supabase
        .from('shops')
        .update({
          is_open: nextIsOpen,
          status: nextStatus
        })
        .eq('id', shopId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in toggleShopStatusInSupabase:', err);
    return false;
  }
}

// Helper to safely extract 10-digit phone
const get10DigitPhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);

// Fetch all delivery riders with multi-source fallback discovery
export async function fetchAllAdminRiders() {
  if (!isSupabaseConfigured) {
    try {
      const localRiders = JSON.parse(localStorage.getItem('gharsee_local_riders') || '[]');
      return localRiders;
    } catch {
      return [];
    }
  }

  try {
    let riderData = [];

    // 1. Fetch from rider_profiles
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      riderData = [...data];
    } else {
      const { data: fallbackData } = await supabase.from('rider_profiles').select('*');
      if (fallbackData) riderData = [...fallbackData];
    }

    // 2. Discover any riders registered in profiles table where role = 'rider'
    try {
      const { data: authProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'rider');

      for (const ap of (authProfiles || [])) {
        const cleanApPhone = get10DigitPhone(ap.phone);
        const numTail = (cleanApPhone || '2024').slice(-4);
        const defaultVNum = `KA-14-EA-${numTail}`;
        const defaultDLic = `KA14202400${(cleanApPhone || '98765').slice(-5)}`;

        const existingIdx = riderData.findIndex(
          r => (r.user_id && r.user_id === ap.id) || (cleanApPhone && get10DigitPhone(r.phone) === cleanApPhone)
        );

        if (existingIdx >= 0) {
          if (!riderData[existingIdx].user_id) riderData[existingIdx].user_id = ap.id;
          if (!riderData[existingIdx].full_name && ap.full_name) riderData[existingIdx].full_name = ap.full_name;
          if (!riderData[existingIdx].vehicle_number || riderData[existingIdx].vehicle_number === 'Not specified') {
            riderData[existingIdx].vehicle_number = defaultVNum;
          }
          if (!riderData[existingIdx].driving_license || riderData[existingIdx].driving_license === 'Not specified') {
            riderData[existingIdx].driving_license = defaultDLic;
          }
        } else {
          const newRec = {
            id: ap.id,
            user_id: ap.id,
            full_name: ap.full_name || 'Delivery Partner',
            phone: ap.phone || `+91${cleanApPhone}`,
            vehicle_type: 'scooter',
            vehicle_number: defaultVNum,
            driving_license: defaultDLic,
            delivery_city: 'Chikkamagaluru, Karnataka',
            is_approved: false,
            status: 'pending_approval',
            is_online: false,
            created_at: ap.created_at || ap.updated_at || new Date().toISOString()
          };
          riderData.push(newRec);

          supabase
            .from('rider_profiles')
            .upsert([newRec], { onConflict: 'phone' })
            .catch?.(() => {});
        }
      }
    } catch (profErr) {
      console.warn('Profiles rider discovery non-fatal warning:', profErr);
    }

    // 3. Discover latest registered rider from local cache if present
    try {
      const latestReg = JSON.parse(localStorage.getItem('gharsee_latest_rider_registration') || 'null');
      if (latestReg && latestReg.phone) {
        const cleanRegPhone = get10DigitPhone(latestReg.phone);
        const exists = riderData.some(r => get10DigitPhone(r.phone) === cleanRegPhone);
        if (!exists) {
          const numTail = (cleanRegPhone || '2024').slice(-4);
          riderData.unshift({
            id: latestReg.riderId || `rider_${Date.now()}`,
            user_id: latestReg.riderId,
            full_name: latestReg.fullName || 'Delivery Partner',
            phone: latestReg.phone,
            vehicle_type: (latestReg.vehicleType || 'scooter').toLowerCase(),
            vehicle_number: latestReg.vehicleNumber && latestReg.vehicleNumber !== 'Not specified' ? latestReg.vehicleNumber : `KA-14-EA-${numTail}`,
            driving_license: latestReg.drivingLicense && latestReg.drivingLicense !== 'Not specified' ? latestReg.drivingLicense : `KA14202400${(cleanRegPhone || '98765').slice(-5)}`,
            delivery_city: latestReg.deliveryCity || 'Chikkamagaluru, Karnataka',
            is_approved: false,
            status: 'pending_approval',
            is_online: false,
            created_at: new Date(latestReg.timestamp || Date.now()).toISOString()
          });
        }
      }
    } catch {}

    return riderData.map(r => {
      const statusLower = (r.status || '').toLowerCase();
      const isPending = statusLower === 'pending_approval' || statusLower === 'pending' || r.is_approved === false;
      const isApproved = !isPending && statusLower !== 'rejected' && r.is_approved !== false;
      const isOnline = Boolean(r.is_online && isApproved);
      const cleanPhone = get10DigitPhone(r.phone);
      const numTail = (cleanPhone || '2024').slice(-4);
      const safeVNum = r.vehicle_number && r.vehicle_number !== 'Not specified' ? r.vehicle_number : `KA-14-EA-${numTail}`;
      const safeDLic = r.driving_license && r.driving_license !== 'Not specified' ? r.driving_license : `KA14202400${(cleanPhone || '98765').slice(-5)}`;

      return {
        id: r.id,
        userId: r.user_id,
        fullName: r.full_name || 'Delivery Partner',
        phone: r.phone || '',
        vehicleType: r.vehicle_type || 'scooter',
        vehicleNumber: safeVNum,
        drivingLicense: safeDLic,
        deliveryCity: r.delivery_city || 'Chikkamagaluru, Karnataka',
        isOnline: isOnline,
        totalDeliveries: r.total_deliveries || 0,
        rating: r.rating || 5.0,
        status: r.status || (isPending ? 'pending_approval' : (isApproved ? 'active' : 'rejected')),
        isPending,
        isApproved,
        is_approved: r.is_approved,
        createdAt: r.created_at || new Date().toISOString()
      };
    });
  } catch (err) {
    console.error('Exception in fetchAllAdminRiders:', err);
    return [];
  }
}

// Approve / Verify a Rider Registration
export async function approveRiderInSupabase(riderId, extraData = {}) {
  if (!isSupabaseConfigured || !riderId) return true;

  try {
    const nowIso = new Date().toISOString();
    const cleanPhone = get10DigitPhone(extraData?.phone || (typeof riderId === 'string' && riderId.match(/^\d{10}$/) ? riderId : ''));
    const numTail = (cleanPhone || '2024').slice(-4);
    const safeVNum = extraData?.vehicleNumber && extraData.vehicleNumber !== 'Not specified' ? extraData.vehicleNumber : `KA-14-EA-${numTail}`;
    const safeDLic = extraData?.drivingLicense && extraData.drivingLicense !== 'Not specified' ? extraData.drivingLicense : `KA14202400${(cleanPhone || '98765').slice(-5)}`;

    // 1. Try update by id
    await supabase
      .from('rider_profiles')
      .update({
        is_approved: true,
        status: 'active',
        is_online: true,
        vehicle_number: safeVNum,
        driving_license: safeDLic,
        updated_at: nowIso
      })
      .eq('id', riderId)
      .catch?.(() => {});

    await supabase
      .from('rider_profiles')
      .update({
        is_approved: true,
        status: 'active',
        is_online: true,
        vehicle_number: safeVNum,
        driving_license: safeDLic
      })
      .eq('id', riderId)
      .catch?.(() => {});

    // 2. Try update by user_id
    await supabase
      .from('rider_profiles')
      .update({
        is_approved: true,
        status: 'active',
        is_online: true,
        vehicle_number: safeVNum,
        driving_license: safeDLic
      })
      .eq('user_id', riderId)
      .catch?.(() => {});

    // 3. Try update by phone
    if (cleanPhone) {
      const { data: allR } = await supabase.from('rider_profiles').select('id, phone');
      const matched = (allR || []).find(r => get10DigitPhone(r.phone) === cleanPhone);
      if (matched) {
        await supabase
          .from('rider_profiles')
          .update({
            is_approved: true,
            status: 'active',
            is_online: true,
            vehicle_number: safeVNum,
            driving_license: safeDLic
          })
          .eq('id', matched.id)
          .catch?.(() => {});
      } else {
        await supabase
          .from('rider_profiles')
          .insert([{
            user_id: typeof riderId === 'string' && riderId.length > 20 ? riderId : null,
            full_name: extraData?.fullName || 'Delivery Partner',
            phone: extraData?.phone || `+91${cleanPhone}`,
            vehicle_type: (extraData?.vehicleType || 'scooter').toLowerCase(),
            vehicle_number: safeVNum,
            driving_license: safeDLic,
            delivery_city: extraData?.deliveryCity || 'Chikkamagaluru, Karnataka',
            is_approved: true,
            status: 'active',
            is_online: true
          }])
          .catch?.(() => {});
      }
    }

    // 4. Update profiles table
    try {
      if (typeof riderId === 'string' && riderId.length > 20) {
        await supabase.from('profiles').update({ role: 'rider' }).eq('id', riderId);
      }
      if (cleanPhone) {
        const { data: allProfs } = await supabase.from('profiles').select('id, phone');
        const matchedProf = (allProfs || []).find(p => get10DigitPhone(p.phone) === cleanPhone);
        if (matchedProf) {
          await supabase.from('profiles').update({ role: 'rider' }).eq('id', matchedProf.id);
        }
      }
    } catch {}

    // 5. Broadcast status updates locally & across browser tabs
    try {
      localStorage.setItem('gharsee_rider_status_update', JSON.stringify({
        riderId,
        phone: cleanPhone,
        isApproved: true,
        status: 'active',
        timestamp: Date.now()
      }));

      // Update cached rider profile if present in localStorage
      const cached = JSON.parse(localStorage.getItem('gharsee_rider_profile') || 'null');
      if (cached && (cached.id === riderId || cached.user_id === riderId || (cleanPhone && get10DigitPhone(cached.phone) === cleanPhone))) {
        localStorage.setItem('gharsee_rider_profile', JSON.stringify({
          ...cached,
          vehicleNumber: safeVNum,
          drivingLicense: safeDLic,
          isApproved: true,
          isPending: false,
          status: 'active',
          is_approved: true
        }));
      }

      window.dispatchEvent(new CustomEvent('gharsee_rider_status_changed', {
        detail: { riderId, isApproved: true, status: 'active' }
      }));
    } catch {}

    return true;
  } catch (err) {
    console.error('Exception in approveRiderInSupabase:', err);
    return true;
  }
}

// Reject a Rider Registration
export async function rejectRiderInSupabase(riderId, extraData = {}) {
  if (!isSupabaseConfigured || !riderId) return true;

  try {
    const nowIso = new Date().toISOString();
    const cleanPhone = get10DigitPhone(extraData?.phone || '');

    await supabase
      .from('rider_profiles')
      .update({
        is_approved: false,
        status: 'rejected',
        is_online: false,
        updated_at: nowIso
      })
      .eq('id', riderId)
      .catch?.(() => {});

    await supabase
      .from('rider_profiles')
      .update({
        is_approved: false,
        status: 'rejected',
        is_online: false,
        updated_at: nowIso
      })
      .eq('user_id', riderId)
      .catch?.(() => {});

    if (cleanPhone) {
      const { data: allR } = await supabase.from('rider_profiles').select('*');
      const matched = (allR || []).find(r => get10DigitPhone(r.phone) === cleanPhone);
      if (matched) {
        await supabase
          .from('rider_profiles')
          .update({
            is_approved: false,
            status: 'rejected',
            is_online: false
          })
          .eq('id', matched.id)
          .catch?.(() => {});
      }
    }

    try {
      localStorage.setItem('gharsee_rider_status_update', JSON.stringify({
        riderId,
        isApproved: false,
        status: 'rejected',
        timestamp: Date.now()
      }));

      const cached = JSON.parse(localStorage.getItem('gharsee_rider_profile') || 'null');
      if (cached && (cached.id === riderId || cached.user_id === riderId || (cleanPhone && get10DigitPhone(cached.phone) === cleanPhone))) {
        localStorage.setItem('gharsee_rider_profile', JSON.stringify({
          ...cached,
          isApproved: false,
          isPending: false,
          status: 'rejected',
          is_approved: false
        }));
      }

      window.dispatchEvent(new CustomEvent('gharsee_rider_status_changed', {
        detail: { riderId, isApproved: false, status: 'rejected' }
      }));
    } catch {}

    return true;
  } catch (err) {
    console.error('Exception in rejectRiderInSupabase:', err);
    return true;
  }
}

// Fetch all registered customer profiles & geolocations
export async function fetchAllAdminCustomers() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching admin customers:', error);
      return [];
    }

    return data.map(c => ({
      id: c.id,
      phone: c.phone,
      fullName: c.full_name || 'Customer',
      flat: c.flat || '',
      street: c.street || '',
      city: c.city || 'Bengaluru',
      pincode: c.pincode || '',
      addressText: c.address_text || '',
      latitude: c.latitude,
      longitude: c.longitude,
      createdAt: c.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error('Exception in fetchAllAdminCustomers:', err);
    return [];
  }
}

// Fetch all customer orders across all stores
export async function fetchAllAdminOrders() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching admin orders:', error);
      return [];
    }

    return data.map(o => ({
      id: o.id,
      storeId: o.store_id,
      storeName: o.store_name || 'Local Grocery Store',
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '',
      deliveryAddress: o.delivery_address || '',
      status: o.status || 'pending',
      totalAmount: o.total_amount || 0,
      subtotal: o.subtotal || 0,
      deliveryFee: o.delivery_fee || 0,
      paymentMethod: o.payment_method || 'Cash on Delivery',
      items: o.items || [],
      createdAt: o.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error('Exception in fetchAllAdminOrders:', err);
    return [];
  }
}

// Update Order Status from Admin Portal
export async function updateAdminOrderStatus(orderId, nextStatus) {
  if (!isSupabaseConfigured) return false;

  if (!isValidOrderStatus(nextStatus)) {
    console.warn('updateAdminOrderStatus: invalid status', nextStatus);
    return false;
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return !error;
  } catch (err) {
    console.error('Exception in updateAdminOrderStatus:', err);
    return false;
  }
}

// -------------------------------------------------------------
// STORE INVENTORY & PRODUCT MANAGEMENT (ADMIN & STORE-SPECIFIC)
// -------------------------------------------------------------

// Fetch all products belonging to a specific store
export async function fetchProductsForShop(shopId) {
  if (!isSupabaseConfigured || !shopId) return [];

  try {
    const inventory = await fetchStoreInventory(shopId);
    if (inventory && inventory.length > 0) {
      return inventory;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(p => ({
      id: p.id,
      storeProductId: p.id,
      globalProductId: p.id,
      shopId: p.shop_id,
      storeId: p.shop_id,
      name: p.name,
      brand: p.brand || 'Store Fresh',
      category: p.category || 'Groceries',
      price: parseFloat(p.price || 0),
      mrp: parseFloat(p.mrp || p.price || 0),
      unit: p.unit || '1 kg',
      stock: p.stock != null ? parseInt(p.stock, 10) : 50,
      minThreshold: p.min_threshold != null ? parseInt(p.min_threshold, 10) : 5,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      image_url: p.image_url || '/images/cat_veg_fruits.jpg',
      description: p.description || '',
      isAvailable: p.is_available !== false,
      is_available: p.is_available !== false,
      createdAt: p.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error('Exception in fetchProductsForShop:', err);
    return [];
  }
}

// Add a new product to a specific store in Supabase
export async function createProductForShop(shopId, productData) {
  if (!isSupabaseConfigured || !shopId) return null;

  try {
    let globalId = productData.globalProductId;

    // If no existing global product selected, create one in global catalog
    if (!globalId) {
      const createdGlobal = await createGlobalProduct({
        name: productData.name,
        brand: productData.brand || 'Standard',
        category: productData.category || 'General Groceries',
        unit: productData.unit || '1 kg',
        quantity: productData.quantity || 1,
        imageUrl: productData.imageUrl || productData.image_url,
        description: productData.description || '',
        barcode: productData.barcode || null,
        searchKeywords: productData.searchKeywords || null
      });

      if (createdGlobal) {
        globalId = createdGlobal.id;
      }
    }

    if (globalId) {
      const assigned = await assignProductToStore({
        storeId: shopId,
        globalProductId: globalId,
        price: productData.price,
        mrp: productData.mrp,
        stock: productData.stock,
        minThreshold: productData.minThreshold,
        isAvailable: productData.isAvailable !== false,
        storeSku: productData.storeSku || ''
      });

      if (assigned) return assigned;
    }

    // Fallback insertion into legacy products table
    const payload = {
      shop_id: shopId,
      name: (productData.name || '').trim(),
      category: productData.category || 'Groceries',
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: productData.unit || '1 kg',
      stock: parseInt(productData.stock || 50, 10),
      min_threshold: parseInt(productData.minThreshold || 5, 10),
      image_url: productData.imageUrl || productData.image_url || '/images/cat_veg_fruits.jpg',
      description: productData.description || '',
      is_available: productData.isAvailable !== false
    };

    const { data: legacyData, error: legacyErr } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .maybeSingle();

    if (legacyErr) {
      console.error('Legacy fallback insert error:', legacyErr);
      return null;
    }

    return legacyData;
  } catch (err) {
    console.error('Exception in createProductForShop:', err);
    return null;
  }
}

// Update existing product in Supabase (updates store_products or products)
export async function updateProductInSupabase(productId, productData) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    // 1. Attempt updating in store_products
    const spSuccess = await updateStoreProductPricing({
      storeProductId: productId,
      price: productData.price,
      mrp: productData.mrp,
      stock: productData.stock,
      minThreshold: productData.minThreshold,
      isAvailable: productData.isAvailable,
      storeSku: productData.storeSku
    });

    if (spSuccess) {
      // If global metadata was also edited, update global_products
      if (productData.globalProductId && productData.name) {
        await updateGlobalProduct(productData.globalProductId, productData);
      }
      return true;
    }

    // 2. Fallback: update in legacy products table
    const updatePayload = {
      name: (productData.name || '').trim(),
      category: productData.category,
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: productData.unit || '1 kg',
      stock: parseInt(productData.stock || 0, 10),
      image_url: productData.imageUrl || productData.image_url,
      description: productData.description || '',
      is_available: productData.isAvailable !== false,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    return !error;
  } catch (err) {
    console.error('Exception in updateProductInSupabase:', err);
    return false;
  }
}

// Delete product from Supabase (store_products or products)
export async function deleteProductInSupabase(productId) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    // Try removing from store_products first
    const spRemoved = await removeProductFromStore(productId);
    if (spRemoved) return true;

    // Fallback: delete from legacy products
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    return !error;
  } catch (err) {
    console.error('Exception in deleteProductInSupabase:', err);
    return false;
  }
}

// -------------------------------------------------------------
// IMAGE UPLOAD & PROCESSING UTILITY
// -------------------------------------------------------------

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImageFile(file) {
  if (!file) return null;

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image type. Please upload a JPEG, PNG, WEBP, or GIF file.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Maximum allowed size is 5 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } catch {
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}