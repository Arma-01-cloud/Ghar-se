import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
} from './globalCatalogService';

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

    return !error;
  } catch (err) {
    return false;
  }
}

// Fetch all delivery riders
export async function fetchAllAdminRiders() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(r => {
      const isOnline = Boolean(r.is_online);
      const isPending = r.is_approved === false || (!isOnline && (r.total_deliveries === 0 || r.total_deliveries == null));
      const isApproved = !isPending;

      return {
        id: r.id,
        userId: r.user_id,
        fullName: r.full_name || 'Delivery Partner',
        phone: r.phone || '',
        vehicleType: r.vehicle_type || 'bike',
        vehicleNumber: r.vehicle_number || 'KA-04-XX-0000',
        drivingLicense: r.driving_license || 'DL-XXXXXX',
        deliveryCity: r.delivery_city || 'Bengaluru',
        isOnline: isOnline,
        totalDeliveries: r.total_deliveries || 0,
        rating: r.rating || 5.0,
        isPending,
        isApproved,
        createdAt: r.created_at || new Date().toISOString()
      };
    });
  } catch (err) {
    return [];
  }
}

// Approve / Verify a Rider Registration
export async function approveRiderInSupabase(riderId) {
  if (!isSupabaseConfigured || !riderId) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        is_online: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', riderId);

    if (error) {
      const { error: err2 } = await supabase
        .from('rider_profiles')
        .update({
          is_online: true
        })
        .eq('id', riderId);

      return !err2;
    }

    return true;
  } catch (err) {
    return false;
  }
}

// Reject a Rider Registration
export async function rejectRiderInSupabase(riderId) {
  if (!isSupabaseConfigured || !riderId) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        is_online: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', riderId);

    if (error) {
      const { error: err2 } = await supabase
        .from('rider_profiles')
        .update({
          is_online: false
        })
        .eq('id', riderId);

      return !err2;
    }

    return true;
  } catch (err) {
    return false;
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

    if (error || !data) return [];

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

    if (error || !data) return [];

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
    return [];
  }
}

// Update Order Status from Admin Portal
export async function updateAdminOrderStatus(orderId, nextStatus) {
  if (!isSupabaseConfigured) return false;

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
    return false;
  }
}

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

    if (error || !data) return [];

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
    return [];
  }
}

// Add a new product to a specific store in Supabase
export async function createProductForShop(shopId, productData) {
  if (!isSupabaseConfigured || !shopId) return null;

  try {
    let globalId = productData.globalProductId;

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

    if (legacyErr) return null;
    return legacyData;
  } catch (err) {
    return null;
  }
}

// Update existing product in Supabase
export async function updateProductInSupabase(productId, productData) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
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
      if (productData.globalProductId && productData.name) {
        await updateGlobalProduct(productData.globalProductId, productData);
      }
      return true;
    }

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
    return false;
  }
}

// Delete product from Supabase
export async function deleteProductInSupabase(productId) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    const spRemoved = await removeProductFromStore(productId);
    if (spRemoved) return true;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    return !error;
  } catch (err) {
    return false;
  }
}

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