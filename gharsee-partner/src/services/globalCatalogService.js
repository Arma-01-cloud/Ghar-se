import { supabase } from '../lib/supabase';

export const isSupabaseConfigured = true;

// Standard Grocery Categories across UR GROZY
export const GLOBAL_CATEGORIES = [
  'Rice & Grains',
  'Atta, Flours & Sooji',
  'Pulses & Dals',
  'Cooking Oils & Ghee',
  'Masalas & Spices',
  'Dairy & Eggs',
  'Fresh Vegetables',
  'Fresh Fruits',
  'Snacks & Biscuits',
  'Beverages & Juices',
  'Tea & Coffee',
  'Instant & Frozen Foods',
  'Cleaning Essentials',
  'Personal Care',
  'Household & Pooja Items',
  'General Groceries'
];

// Normalize text for duplicate checking and comparisons
export function normalizeText(text) {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// 1. FETCH GLOBAL CATALOG PRODUCTS
// ---------------------------------------------------------------------------
export async function fetchGlobalCatalog({
  page = 1,
  limit = 20,
  search = '',
  category = 'all',
  brand = 'all',
  isActive = 'all',
  storeUsage = 'all',
  sortField = 'created_at',
  sortOrder = 'desc'
} = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .is('shop_id', null);

    if (isActive === 'active') {
      query = query.eq('is_available', true);
    } else if (isActive === 'inactive') {
      query = query.eq('is_available', false);
    }

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    const q = search.trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const ascending = sortOrder === 'asc';
    if (sortField === 'name') {
      query = query.order('name', { ascending });
    } else if (sortField === 'category') {
      query = query.order('category', { ascending });
    } else if (sortField === 'price') {
      query = query.order('price', { ascending });
    } else {
      query = query.order('created_at', { ascending });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching global catalog in partner app:', error);
      return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };
    }

    let mappedProducts = (data || []).map(p => ({
      id: p.id,
      globalProductId: p.id,
      name: p.name,
      brand: p.brand || 'Standard',
      description: p.description || '',
      category: p.category || 'General Groceries',
      subcategory: p.subcategory || '',
      unit: p.unit || '1 kg',
      quantity: 1,
      price: parseFloat(p.price || 0),
      mrp: parseFloat(p.mrp || p.price || 0),
      stock: p.stock != null ? parseInt(p.stock, 10) : 100,
      minThreshold: p.min_threshold != null ? parseInt(p.min_threshold, 10) : 5,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      image_url: p.image_url || '/images/cat_veg_fruits.jpg',
      barcode: '',
      searchKeywords: '',
      isActive: p.is_available !== false,
      is_active: p.is_available !== false,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString()
    }));

    const totalCount = count != null ? count : mappedProducts.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return {
      products: mappedProducts,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      categories: GLOBAL_CATEGORIES,
      brands: []
    };
  } catch (err) {
    console.error('Exception in fetchGlobalCatalog partner:', err);
    return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };
  }
}

export async function fetchGlobalCatalogStats() {
  try {
    const { data: allGlobal } = await supabase.from('products').select('id, is_available').is('shop_id', null);
    if (allGlobal) {
      const totalGlobalProducts = allGlobal.length;
      const activeProducts = allGlobal.filter(p => p.is_available !== false).length;
      return {
        totalGlobalProducts,
        activeProducts,
        inactiveProducts: totalGlobalProducts - activeProducts,
        productsWithStores: totalGlobalProducts,
        productsWithoutStores: 0
      };
    }
    return { totalGlobalProducts: 0, activeProducts: 0, inactiveProducts: 0, productsWithStores: 0, productsWithoutStores: 0 };
  } catch (err) {
    return { totalGlobalProducts: 0, activeProducts: 0, inactiveProducts: 0, productsWithStores: 0, productsWithoutStores: 0 };
  }
}

export async function createGlobalProduct(productData) {
  try {
    let desc = (productData.description || '').trim();
    const barcode = (productData.barcode || '').trim();
    if (barcode && !desc.includes(barcode)) {
      desc = desc ? `${desc} [Barcode: ${barcode}]` : `Barcode: ${barcode}`;
    }

    const payload = {
      name: (productData.name || '').trim(),
      category: productData.category || 'General Groceries',
      price: parseFloat(productData.price || 0),
      mrp: parseFloat(productData.mrp || productData.price || 0),
      unit: (productData.unit || '1 kg').trim(),
      stock: parseInt(productData.stock || 100, 10),
      min_threshold: parseInt(productData.minThreshold || 5, 10),
      image_url: productData.imageUrl || productData.image_url || '/images/cat_veg_fruits.jpg',
      description: desc,
      is_available: productData.isActive !== false && productData.is_available !== false,
      shop_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Failed to create global product in partner app:', error);
      return null;
    }

    return {
      ...data,
      globalProductId: data.id,
      imageUrl: data.image_url,
      isActive: data.is_available
    };
  } catch (err) {
    console.error('Exception in createGlobalProduct partner:', err);
    return null;
  }
}

export async function assignProductToStore({
  storeId,
  globalProductId,
  price = 0,
  mrp = null,
  stock = 50,
  minThreshold = 5,
  isAvailable = true,
  storeSku = ''
}) {
  if (!storeId || !globalProductId) return null;

  try {
    const { data: globalProd } = await supabase
      .from('products')
      .select('*')
      .eq('id', globalProductId)
      .single();

    const name = globalProd ? globalProd.name : 'Grocery Item';
    const category = globalProd ? globalProd.category : 'General Groceries';
    const unit = globalProd ? globalProd.unit : '1 kg';
    const imageUrl = globalProd ? globalProd.image_url : '/images/cat_veg_fruits.jpg';
    const desc = globalProd ? globalProd.description : '';

    const { data: existingStoreProd } = await supabase
      .from('products')
      .select('id')
      .eq('shop_id', storeId)
      .eq('name', name)
      .maybeSingle();

    if (existingStoreProd) {
      const { data: updated, error: upErr } = await supabase
        .from('products')
        .update({
          price: parseFloat(price || 0),
          mrp: mrp ? parseFloat(mrp) : parseFloat(price || 0),
          stock: parseInt(stock || 0, 10),
          min_threshold: parseInt(minThreshold || 5, 10),
          is_available: Boolean(isAvailable),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStoreProd.id)
        .select()
        .single();

      if (upErr) return null;
      return updated;
    }

    const payload = {
      shop_id: storeId,
      name: name,
      category: category,
      price: parseFloat(price || 0),
      mrp: mrp ? parseFloat(mrp) : parseFloat(price || 0),
      unit: unit,
      stock: parseInt(stock || 50, 10),
      min_threshold: parseInt(minThreshold || 5, 10),
      image_url: imageUrl,
      description: desc,
      is_available: Boolean(isAvailable),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error assigning product to store:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in assignProductToStore:', err);
    return null;
  }
}

export async function updateStoreProductPricing({
  storeProductId,
  price,
  mrp,
  stock,
  minThreshold,
  isAvailable,
  storeSku
}) {
  if (!storeProductId) return false;

  try {
    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (price != null) updatePayload.price = parseFloat(price);
    if (mrp != null) updatePayload.mrp = parseFloat(mrp);
    if (stock != null) updatePayload.stock = parseInt(stock, 10);
    if (minThreshold != null) updatePayload.min_threshold = parseInt(minThreshold, 10);
    if (isAvailable !== undefined) updatePayload.is_available = Boolean(isAvailable);

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', storeProductId);

    return !error;
  } catch (err) {
    return false;
  }
}

export async function removeProductFromStore(storeProductId) {
  if (!storeProductId) return false;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', storeProductId);

    return !error;
  } catch (err) {
    return false;
  }
}

export async function fetchStoreInventory(storeId, { search = '', category = 'all', isAvailable = 'all' } = {}) {
  if (!storeId) return [];

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('shop_id', storeId)
      .order('created_at', { ascending: false });

    if (isAvailable === 'available') {
      query = query.eq('is_available', true);
    } else if (isAvailable === 'unavailable') {
      query = query.eq('is_available', false);
    }

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let mapped = data.map(p => {
      const price = parseFloat(p.price || 0);
      const mrp = parseFloat(p.mrp || p.price || 0);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const stock = p.stock != null ? parseInt(p.stock, 10) : 50;

      return {
        id: p.id,
        storeProductId: p.id,
        globalProductId: p.id,
        shop_id: p.shop_id,
        storeId: p.shop_id,
        name: p.name,
        brand: p.brand || 'Store Fresh',
        category: p.category || 'General Groceries',
        unit: p.unit || '1 kg',
        price: price,
        originalPrice: mrp,
        mrp: mrp,
        discount: discount,
        stock: stock,
        minThreshold: p.min_threshold || 5,
        status: (stock > 0 && p.is_available !== false) ? 'In Stock' : 'Out of Stock',
        image: p.image_url || '/images/cat_veg_fruits.jpg',
        image_url: p.image_url || '/images/cat_veg_fruits.jpg',
        imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
        description: p.description || '',
        isAvailable: p.is_available !== false,
        is_available: p.is_available !== false,
        rating: 4.9,
        reviews: 18,
        createdAt: p.created_at || new Date().toISOString()
      };
    });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      mapped = mapped.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }

    return mapped;
  } catch (err) {
    return [];
  }
}
