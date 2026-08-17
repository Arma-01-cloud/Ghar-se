import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { isValidOrderStatus } from '../../utils/validators';

// Fetch all stores with approval, operational status, and live product count
export async function fetchAllAdminShops() {
  if (!isSupabaseConfigured) return [];

  try {
    const [shopsRes, prodsRes] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, shop_id')
    ]);

    const { data, error } = shopsRes;
    const { data: allProducts } = prodsRes;

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
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('shops')
      .update({
        status: 'open',
        is_open: true,
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) {
      console.warn('First approveShop update failed, trying fallback without updated_at:', error.message);
      const { error: err2 } = await supabase
        .from('shops')
        .update({
          status: 'open',
          is_open: true,
          is_approved: true
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
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('shops')
      .update({
        status: 'rejected',
        is_open: false,
        is_approved: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', shopId);

    if (error) {
      const { error: err2 } = await supabase
        .from('shops')
        .update({
          status: 'rejected',
          is_open: false,
          is_approved: false
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

// Fetch all delivery riders
export async function fetchAllAdminRiders() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('rider_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching admin riders:', error);
      return [];
    }

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
    console.error('Exception in fetchAllAdminRiders:', err);
    return [];
  }
}

// Approve / Verify a Rider Registration
export async function approveRiderInSupabase(riderId) {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        is_approved: true,
        is_online: true,
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', riderId);

    if (error) {
      const { error: err2 } = await supabase
        .from('rider_profiles')
        .update({
          is_approved: true,
          is_online: true,
          status: 'approved'
        })
        .eq('id', riderId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in approveRiderInSupabase:', err);
    return false;
  }
}

// Reject a Rider Registration
export async function rejectRiderInSupabase(riderId) {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('rider_profiles')
      .update({
        is_approved: false,
        is_online: false,
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', riderId);

    if (error) {
      const { error: err2 } = await supabase
        .from('rider_profiles')
        .update({
          is_approved: false,
          is_online: false,
          status: 'rejected'
        })
        .eq('id', riderId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in rejectRiderInSupabase:', err);
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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching products for shop:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      shopId: p.shop_id,
      name: p.name,
      category: p.category || 'Groceries',
      price: parseFloat(p.price || 0),
      mrp: parseFloat(p.mrp || p.price || 0),
      unit: p.unit || '1 kg',
      stock: p.stock != null ? parseInt(p.stock, 10) : 50,
      minThreshold: p.min_threshold != null ? parseInt(p.min_threshold, 10) : 5,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      description: p.description || '',
      isAvailable: p.is_available !== false,
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
    const payload = {
      shop_id: shopId,
      name: (productData.name || '').trim(),
      category: productData.category || 'Groceries',
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: productData.unit || '1 kg',
      stock: parseInt(productData.stock || 50, 10),
      min_threshold: parseInt(productData.minThreshold || 5, 10),
      image_url: productData.imageUrl || '/images/cat_veg_fruits.jpg',
      description: productData.description || '',
      is_available: productData.isAvailable !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase product insert with timestamp failed, attempting standard payload:', error.message);
      const fallbackPayload = {
        shop_id: shopId,
        name: (productData.name || '').trim(),
        category: productData.category || 'Groceries',
        price: parseFloat(productData.price || 0),
        mrp: parseFloat(productData.mrp || productData.price || 0),
        unit: productData.unit || '1 kg',
        stock: parseInt(productData.stock || 50, 10),
        image_url: productData.imageUrl || '/images/cat_veg_fruits.jpg',
        description: productData.description || '',
        is_available: productData.isAvailable !== false
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('products')
        .insert([fallbackPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        console.error('Fallback product insert error:', retryErr);
        return null;
      }
      return retryData;
    }

    return data;
  } catch (err) {
    console.error('Exception in createProductForShop:', err);
    return null;
  }
}

// Update existing product in Supabase
export async function updateProductInSupabase(productId, productData) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    const updatePayload = {
      name: (productData.name || '').trim(),
      category: productData.category,
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: productData.unit || '1 kg',
      stock: parseInt(productData.stock || 0, 10),
      image_url: productData.imageUrl,
      description: productData.description || '',
      is_available: productData.isAvailable !== false,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    if (error) {
      console.warn('Supabase product update error, trying fallback:', error.message);
      const { error: err2 } = await supabase
        .from('products')
        .update({
          name: (productData.name || '').trim(),
          category: productData.category,
          price: parseFloat(productData.price || 0),
          mrp: parseFloat(productData.mrp || productData.price || 0),
          unit: productData.unit || '1 kg',
          stock: parseInt(productData.stock || 0, 10),
          image_url: productData.imageUrl,
          description: productData.description || '',
          is_available: productData.isAvailable !== false
        })
        .eq('id', productId);

      return !err2;
    }

    return true;
  } catch (err) {
    console.error('Exception in updateProductInSupabase:', err);
    return false;
  }
}

// -------------------------------------------------------------
// IMAGE UPLOAD & PROCESSING UTILITY
// -------------------------------------------------------------

// Reject obviously oversized or non-image uploads before we waste CPU on them.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Compress and convert image File to optimized web Data URL
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
          // If canvas fails, return original data URL
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// -------------------------------------------------------------
// "SHOP FROM ANY STORE" (GLOBAL CATALOG) MANAGEMENT
// -------------------------------------------------------------

// Fetch all universal products for "Shop From Any Store"
export async function fetchGlobalCatalogProducts() {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching global catalog products:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      shopId: p.shop_id,
      isGlobal: !p.shop_id,
      name: p.name,
      category: p.category || 'Groceries',
      price: parseFloat(p.price || 0),
      mrp: parseFloat(p.mrp || p.price || 0),
      unit: p.unit || '1 kg',
      stock: p.stock != null ? parseInt(p.stock, 10) : 50,
      minThreshold: p.min_threshold != null ? parseInt(p.min_threshold, 10) : 5,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      description: p.description || '',
      isAvailable: p.is_available !== false,
      createdAt: p.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error('Exception in fetchGlobalCatalogProducts:', err);
    return [];
  }
}

// Add a new universal item for "Shop From Any Store" in Supabase
export async function createGlobalCatalogProduct(productData) {
  if (!isSupabaseConfigured) return null;

  try {
    const payload = {
      name: (productData.name || '').trim(),
      category: productData.category || 'Groceries',
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: productData.unit || '1 kg',
      stock: parseInt(productData.stock || 100, 10),
      min_threshold: parseInt(productData.minThreshold || 10, 10),
      image_url: productData.imageUrl || '/images/cat_veg_fruits.jpg',
      description: productData.description || '',
      is_available: productData.isAvailable !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase global product insert retry with fallback payload:', error.message);
      const fallbackPayload = {
        name: (productData.name || '').trim(),
        category: productData.category || 'Groceries',
        price: parseFloat(productData.price || 0),
        mrp: parseFloat(productData.mrp || productData.price || 0),
        unit: productData.unit || '1 kg',
        stock: parseInt(productData.stock || 100, 10),
        image_url: productData.imageUrl || '/images/cat_veg_fruits.jpg',
        description: productData.description || '',
        is_available: productData.isAvailable !== false
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('products')
        .insert([fallbackPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        console.error('Fallback global product insert error:', retryErr);
        return null;
      }
      return retryData;
    }

    return data;
  } catch (err) {
    console.error('Exception in createGlobalCatalogProduct:', err);
    return null;
  }
}

// Delete product from Supabase
export async function deleteProductInSupabase(productId) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
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
