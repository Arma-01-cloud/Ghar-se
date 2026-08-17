import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function fetchProductsByStore(storeId) {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('shop_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetchProducts error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(p => {
      const price = parseFloat(p.price || 0);
      const mrp = parseFloat(p.mrp || p.price || 0);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      return {
        id: p.id,
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
        description: p.description || '',
        rating: 4.9,
        reviews: 18,
        isAvailable: p.is_available !== false
      };
    });
  } catch (err) {
    console.error('Exception fetching products:', err);
    return [];
  }
}

export async function fetchCustomerProducts(storeId = null) {
  return await fetchProductsByStore(storeId);
}

export async function addProductToSupabase(productData) {
  if (!isSupabaseConfigured) return productData;

  const { data: prod, error } = await supabase
    .from('products')
    .insert([{
      name: productData.name,
      description: productData.description,
      image_url: productData.image,
      category: productData.category
    }])
    .select()
    .single();

  if (error || !prod) return productData;

  await supabase
    .from('product_variants')
    .insert([{
      product_id: prod.id,
      price: productData.price || 150
    }]);

  return prod;
}

export async function updateProductStockInSupabase(productId, newStock) {
  if (!isSupabaseConfigured || !productId) return true;
  try {
    const { error } = await supabase
      .from('products')
      .update({ stock: parseInt(newStock, 10) || 0 })
      .eq('id', productId);
    if (error) {
      console.warn('Could not update stock in Supabase:', error.message);
    }
  } catch (err) {
    console.error('Exception updating product stock:', err);
  }
  return true;
}
