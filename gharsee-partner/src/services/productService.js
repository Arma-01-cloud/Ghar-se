import { supabase } from '../lib/supabase';
import { 
  fetchStoreInventory, 
  createGlobalProduct, 
  assignProductToStore, 
  updateStoreProductPricing,
  removeProductFromStore 
} from './globalCatalogService';

export async function fetchProductsByStore(storeId) {
  if (!storeId) return [];

  try {
    const inventory = await fetchStoreInventory(storeId);
    if (inventory && inventory.length > 0) {
      return inventory;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', storeId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(p => ({
        id: p.id,
        storeProductId: p.id,
        globalProductId: p.id,
        name: p.name,
        brand: p.brand || 'Store Fresh',
        category: p.category || 'Groceries',
        price: parseFloat(p.price || 0),
        mrp: parseFloat(p.mrp || p.price || 0),
        discount: 0,
        unit: p.unit || '1 kg',
        stock: p.stock != null ? parseInt(p.stock, 10) : 50,
        minThreshold: p.min_threshold || 5,
        status: p.stock > 0 && p.is_available !== false ? 'In Stock' : 'Out of Stock',
        image: p.image_url || '/images/cat_veg_fruits.jpg',
        image_url: p.image_url || '/images/cat_veg_fruits.jpg',
        imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
        description: p.description || '',
        isAvailable: p.is_available !== false
      }));
    }
  } catch (e) {
    console.error('Error fetching products by store from Supabase:', e);
  }
  return [];
}

export async function addProductToSupabase(productData) {
  try {
    let globalId = productData.globalProductId;

    if (!globalId) {
      const createdGlobal = await createGlobalProduct({
        name: productData.name,
        brand: productData.brand || 'Store Fresh',
        category: productData.category || 'General Groceries',
        unit: productData.unit || '1 kg',
        quantity: 1,
        imageUrl: productData.image || productData.image_url || '/images/cat_veg_fruits.jpg',
        description: productData.description || ''
      });

      if (createdGlobal) {
        globalId = createdGlobal.id;
      }
    }

    if (globalId && productData.shop_id) {
      const assigned = await assignProductToStore({
        storeId: productData.shop_id,
        globalProductId: globalId,
        price: productData.price,
        mrp: productData.mrp || productData.price,
        stock: productData.stock,
        isAvailable: true,
        storeSku: productData.storeSku || ''
      });

      if (assigned) return assigned;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: productData.shop_id,
        name: productData.name,
        category: productData.category || 'Groceries',
        price: parseFloat(productData.price || 0),
        mrp: parseFloat(productData.mrp || productData.price || 0),
        unit: productData.unit || '1 kg',
        stock: parseInt(productData.stock || 50, 10),
        description: productData.description || '',
        image_url: productData.image || productData.image_url || '/images/cat_veg_fruits.jpg',
        is_available: true
      })
      .select()
      .single();

    if (!error && data) return data;
  } catch (e) {
    console.error('Error adding product to Supabase:', e);
  }

  return { id: `prod-${Date.now()}`, ...productData };
}

export async function updateProductStockInSupabase(productId, newStock) {
  if (!productId) return true;

  try {
    const updatedSp = await updateStoreProductPricing({
      storeProductId: productId,
      stock: parseInt(newStock || 0, 10),
      isAvailable: parseInt(newStock || 0, 10) > 0
    });

    if (updatedSp) return true;

    await supabase
      .from('products')
      .update({ 
        stock: parseInt(newStock || 0, 10),
        is_available: parseInt(newStock || 0, 10) > 0 
      })
      .eq('id', productId);
  } catch (e) {}

  return true;
}