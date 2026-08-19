import { supabase } from '../lib/supabase';

export async function fetchProductsByStore(storeId) {
  if (storeId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', storeId)
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (e) {
      console.error('Error fetching products by store from Supabase:', e);
    }
  }
  return [];
}

export async function addProductToSupabase(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: productData.shop_id,
        name: productData.name,
        category: productData.category || 'Groceries',
        price: parseFloat(productData.price || 0),
        mrp: parseFloat(productData.mrp || productData.price || 0),
        unit: productData.unit || '1 kg',
        stock: parseInt(productData.stock || 50),
        description: productData.description || '',
        image_url: productData.image_url || '/images/cat_veg_fruits.jpg',
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
  if (productId) {
    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    } catch (e) {}
  }
  return true;
}