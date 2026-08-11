import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function fetchProductsByStore(storeId) {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('products')
      .select('*, product_variants(id, price)')
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
      const variantPrice = p.product_variants && p.product_variants.length > 0 ? p.product_variants[0].price : (p.price || 120);
      return {
        id: p.id,
        name: p.name,
        brand: p.brand || 'GharSee Fresh',
        category: p.category || 'Groceries',
        price: variantPrice,
        discount: p.discount || 0,
        unit: p.unit || '1 kg',
        stock: p.stock != null ? p.stock : 20,
        minThreshold: 10,
        status: (p.stock == null || p.stock > 0) ? 'In Stock' : 'Out of Stock',
        image: p.image_url || '/images/cat_veg_fruits.jpg',
        description: p.description || ''
      };
    });
  } catch (err) {
    console.error('Exception fetching products:', err);
    return [];
  }
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
  if (!isSupabaseConfigured) return true;
  return true;
}
