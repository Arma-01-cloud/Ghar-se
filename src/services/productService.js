import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchStoreInventory, assignProductToStore, createGlobalProduct } from './globalCatalogService';

// Fetch products belonging to a specific store (merges store-specific pricing/stock with global product identity)
export async function fetchProductsByStore(storeId) {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    if (storeId) {
      // Primary: Fetch from store_products joined with global_products
      const storeInventory = await fetchStoreInventory(storeId);
      if (storeInventory && storeInventory.length > 0) {
        return storeInventory;
      }
    }

    // Fallback: Query legacy products table
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('shop_id', storeId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map(p => {
      const price = parseFloat(p.price || 0);
      const mrp = parseFloat(p.mrp || p.price || 0);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      return {
        id: p.id,
        storeProductId: p.id,
        globalProductId: p.id,
        shop_id: p.shop_id,
        storeId: p.shop_id,
        name: p.name,
        brand: p.brand || 'Store Fresh',
        category: p.category || 'Groceries',
        price: price,
        originalPrice: mrp,
        mrp: mrp,
        discount: discount,
        unit: p.unit || '1 kg',
        stock: p.stock != null ? p.stock : 50,
        minThreshold: p.min_threshold || 5,
        status: (p.stock == null || p.stock > 0) ? 'In Stock' : 'Out of Stock',
        image: p.image_url || '/images/cat_veg_fruits.jpg',
        image_url: p.image_url || '/images/cat_veg_fruits.jpg',
        imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
        description: p.description || '',
        rating: 4.9,
        reviews: 18,
        isAvailable: p.is_available !== false,
        is_available: p.is_available !== false
      };
    });
  } catch (err) {
    console.error('Exception fetching products by store:', err);
    return [];
  }
}

export async function fetchCustomerProducts(storeId = null) {
  return await fetchProductsByStore(storeId);
}

// Add a product to store (creates global product if needed, and links to store)
export async function addProductToSupabase(productData) {
  if (!isSupabaseConfigured) return productData;

  try {
    const shopId = productData.shop_id || productData.storeId;
    let globalProdId = productData.globalProductId;

    if (!globalProdId) {
      const createdGlobal = await createGlobalProduct({
        name: productData.name,
        brand: productData.brand || 'Store Fresh',
        category: productData.category || 'General Groceries',
        unit: productData.unit || '1 kg',
        imageUrl: productData.image || productData.image_url,
        description: productData.description || ''
      });
      if (createdGlobal) {
        globalProdId = createdGlobal.id;
      }
    }

    if (shopId && globalProdId) {
      const assigned = await assignProductToStore({
        storeId: shopId,
        globalProductId: globalProdId,
        price: productData.price,
        mrp: productData.mrp,
        stock: productData.stock,
        isAvailable: productData.isAvailable !== false
      });
      if (assigned) return assigned;
    }

    // Fallback insertion into legacy products table
    const { data: prod, error } = await supabase
      .from('products')
      .insert([{
        shop_id: shopId || null,
        name: productData.name,
        description: productData.description,
        image_url: productData.image || productData.image_url,
        category: productData.category,
        price: productData.price || 100,
        mrp: productData.mrp || productData.price || 100,
        unit: productData.unit || '1 kg',
        stock: productData.stock || 50,
        is_available: productData.isAvailable !== false
      }])
      .select()
      .maybeSingle();

    return prod || productData;
  } catch (err) {
    console.error('Exception in addProductToSupabase:', err);
    return productData;
  }
}

// Update product stock in both store_products and products tables
export async function updateProductStockInSupabase(productId, newStock) {
  if (!isSupabaseConfigured || !productId) return true;
  const parsedStock = parseInt(newStock, 10) || 0;

  try {
    // 1. Attempt update in store_products
    const { error: spErr } = await supabase
      .from('store_products')
      .update({ 
        stock: parsedStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (!spErr) return true;

    // 2. Fallback: update in legacy products table
    const { error: prodErr } = await supabase
      .from('products')
      .update({ stock: parsedStock })
      .eq('id', productId);

    if (prodErr) {
      console.warn('Could not update stock in Supabase:', prodErr.message);
    }
  } catch (err) {
    console.error('Exception updating product stock:', err);
  }
  return true;
}