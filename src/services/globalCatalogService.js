import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
// 1. FETCH GLOBAL CATALOG PRODUCTS (WITH DATABASE PAGINATION, SEARCH, FILTERS)
// ---------------------------------------------------------------------------
export async function fetchGlobalCatalog({
  page = 1,
  limit = 20,
  search = '',
  category = 'all',
  brand = 'all',
  isActive = 'all',
  storeUsage = 'all', // 'all' | 'assigned' | 'unassigned'
  sortField = 'created_at',
  sortOrder = 'desc'
} = {}) {
  if (!isSupabaseConfigured) {
    return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };
  }

  try {
    // 1. Try querying `global_products`
    let query = supabase.from('global_products').select('*', { count: 'exact' });

    // Filter by Active Status
    if (isActive === 'active') {
      query = query.eq('is_active', true);
    } else if (isActive === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Filter by Category
    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    // Filter by Brand
    if (brand && brand !== 'all') {
      query = query.ilike('brand', `%${brand}%`);
    }

    // Search query across name, brand, category, barcode, search_keywords
    const q = search.trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%,barcode.ilike.%${q}%,search_keywords.ilike.%${q}%`);
    }

    // Sorting
    const ascending = sortOrder === 'asc';
    if (sortField === 'name') {
      query = query.order('name', { ascending });
    } else if (sortField === 'category') {
      query = query.order('category', { ascending });
    } else if (sortField === 'brand') {
      query = query.order('brand', { ascending });
    } else {
      query = query.order('created_at', { ascending });
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.warn('Querying global_products failed, checking fallback to products table:', error.message);
      return await fetchGlobalCatalogFallback({ page, limit, search, category, brand, isActive, sortField, sortOrder });
    }

    // Fetch store association counts from `store_products`
    const productIds = (data || []).map(p => p.id);
    let storeCountMap = new Map();

    if (productIds.length > 0) {
      try {
        const { data: storeProdData } = await supabase
          .from('store_products')
          .select('global_product_id, store_id')
          .in('global_product_id', productIds);

        if (storeProdData) {
          storeProdData.forEach(sp => {
            const gid = sp.global_product_id;
            storeCountMap.set(gid, (storeCountMap.get(gid) || 0) + 1);
          });
        }
      } catch (err) {
        console.warn('Could not fetch store counts for global products:', err);
      }
    }

    // Map rows into rich format
    let mappedProducts = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand || 'Standard',
      description: p.description || '',
      category: p.category || 'General Groceries',
      subcategory: p.subcategory || '',
      unit: p.unit || '1 kg',
      quantity: p.quantity != null ? parseFloat(p.quantity) : 1,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      image_url: p.image_url || '/images/cat_veg_fruits.jpg',
      barcode: p.barcode || '',
      searchKeywords: p.search_keywords || '',
      isActive: p.is_active !== false,
      is_active: p.is_active !== false,
      storesCount: storeCountMap.get(p.id) || 0,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString()
    }));

    // Filter by store usage if requested
    if (storeUsage === 'assigned') {
      mappedProducts = mappedProducts.filter(p => p.storesCount > 0);
    } else if (storeUsage === 'unassigned') {
      mappedProducts = mappedProducts.filter(p => p.storesCount === 0);
    }

    const totalCount = count != null ? count : mappedProducts.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    // Fetch distinct brands for filter dropdown
    let brandsList = [];
    try {
      const { data: brandsData } = await supabase.from('global_products').select('brand');
      if (brandsData) {
        const uniqueBrands = new Set();
        brandsData.forEach(b => {
          if (b.brand && b.brand.trim()) uniqueBrands.add(b.brand.trim());
        });
        brandsList = Array.from(uniqueBrands).sort();
      }
    } catch {}

    return {
      products: mappedProducts,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
      categories: GLOBAL_CATEGORIES,
      brands: brandsList
    };
  } catch (err) {
    console.error('Exception in fetchGlobalCatalog:', err);
    return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };
  }
}

// Fallback method reading universal products from legacy `products` table where `shop_id IS NULL`
async function fetchGlobalCatalogFallback({
  page = 1,
  limit = 20,
  search = '',
  category = 'all',
  brand = 'all',
  isActive = 'all',
  sortField = 'created_at',
  sortOrder = 'desc'
}) {
  try {
    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`);
    }

    const q = search.trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const ascending = sortOrder === 'asc';
    query = query.order('created_at', { ascending });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error || !data) return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };

    const mapped = data.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand || 'Standard',
      description: p.description || '',
      category: p.category || 'General Groceries',
      subcategory: '',
      unit: p.unit || '1 kg',
      quantity: 1,
      imageUrl: p.image_url || '/images/cat_veg_fruits.jpg',
      image_url: p.image_url || '/images/cat_veg_fruits.jpg',
      barcode: '',
      searchKeywords: '',
      isActive: p.is_available !== false,
      is_active: p.is_available !== false,
      storesCount: p.shop_id ? 1 : 0,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString()
    }));

    return {
      products: mapped,
      totalCount: count || mapped.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || mapped.length) / limitNum) || 1,
      categories: GLOBAL_CATEGORIES,
      brands: []
    };
  } catch (err) {
    console.error('Exception in fetchGlobalCatalogFallback:', err);
    return { products: [], totalCount: 0, page: 1, limit, totalPages: 1, categories: GLOBAL_CATEGORIES, brands: [] };
  }
}

// ---------------------------------------------------------------------------
// 2. FETCH GLOBAL CATALOG STATISTICS
// ---------------------------------------------------------------------------
export async function fetchGlobalCatalogStats() {
  if (!isSupabaseConfigured) {
    return {
      totalGlobalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      productsWithStores: 0,
      productsWithoutStores: 0
    };
  }

  try {
    const [globalRes, storeProdsRes] = await Promise.all([
      supabase.from('global_products').select('id, is_active'),
      supabase.from('store_products').select('global_product_id')
    ]);

    if (!globalRes.error && globalRes.data) {
      const allGlobal = globalRes.data;
      const totalGlobalProducts = allGlobal.length;
      const activeProducts = allGlobal.filter(p => p.is_active !== false).length;
      const inactiveProducts = totalGlobalProducts - activeProducts;

      const storeProductGlobalIds = new Set();
      (storeProdsRes.data || []).forEach(sp => {
        if (sp.global_product_id) storeProductGlobalIds.add(sp.global_product_id);
      });

      const productsWithStores = allGlobal.filter(p => storeProductGlobalIds.has(p.id)).length;
      const productsWithoutStores = totalGlobalProducts - productsWithStores;

      return {
        totalGlobalProducts,
        activeProducts,
        inactiveProducts,
        productsWithStores,
        productsWithoutStores
      };
    }

    // Fallback if global_products table is not yet present
    const { data: legacyProds } = await supabase.from('products').select('id, shop_id, is_available');
    if (legacyProds) {
      const total = legacyProds.length;
      const active = legacyProds.filter(p => p.is_available !== false).length;
      const assigned = legacyProds.filter(p => Boolean(p.shop_id)).length;
      return {
        totalGlobalProducts: total,
        activeProducts: active,
        inactiveProducts: total - active,
        productsWithStores: assigned,
        productsWithoutStores: total - assigned
      };
    }

    return { totalGlobalProducts: 0, activeProducts: 0, inactiveProducts: 0, productsWithStores: 0, productsWithoutStores: 0 };
  } catch (err) {
    console.error('Exception in fetchGlobalCatalogStats:', err);
    return { totalGlobalProducts: 0, activeProducts: 0, inactiveProducts: 0, productsWithStores: 0, productsWithoutStores: 0 };
  }
}

// ---------------------------------------------------------------------------
// 3. DUPLICATE DETECTION LOGIC
// ---------------------------------------------------------------------------
export async function checkDuplicateGlobalProduct({
  name = '',
  brand = '',
  unit = '',
  quantity = 1,
  barcode = '',
  excludeId = null
}) {
  if (!isSupabaseConfigured) return { hasDuplicate: false, duplicates: [] };

  const normName = normalizeText(name);
  const normBrand = normalizeText(brand);
  const normUnit = normalizeText(unit);
  const cleanBarcode = (barcode || '').trim();

  if (!normName) return { hasDuplicate: false, duplicates: [] };

  try {
    // 1. Check exact barcode match first if barcode provided
    if (cleanBarcode) {
      let barcodeQuery = supabase
        .from('global_products')
        .select('*')
        .eq('barcode', cleanBarcode);

      if (excludeId) barcodeQuery = barcodeQuery.neq('id', excludeId);

      const { data: barcodeMatches } = await barcodeQuery;
      if (barcodeMatches && barcodeMatches.length > 0) {
        return {
          hasDuplicate: true,
          matchReason: `Exact barcode match found ("${cleanBarcode}")`,
          duplicates: barcodeMatches
        };
      }
    }

    // 2. Check name + brand + unit combination
    const { data: nameMatches } = await supabase
      .from('global_products')
      .select('*')
      .ilike('name', `%${normName}%`);

    if (nameMatches && nameMatches.length > 0) {
      const potentialDuplicates = nameMatches.filter(p => {
        if (excludeId && p.id === excludeId) return false;

        const pName = normalizeText(p.name);
        const pBrand = normalizeText(p.brand);
        const pUnit = normalizeText(p.unit);

        // Exact match on normalized name and unit
        if (pName === normName && (!normUnit || pUnit === normUnit)) {
          return true;
        }

        // Match on name and brand
        if (pName === normName && normBrand && pBrand === normBrand) {
          return true;
        }

        // Substring close match
        if (pName.includes(normName) || normName.includes(pName)) {
          if (normBrand && pBrand === normBrand) return true;
          if (pUnit === normUnit) return true;
        }

        return false;
      });

      if (potentialDuplicates.length > 0) {
        return {
          hasDuplicate: true,
          matchReason: `Potential duplicate product found with matching name/brand/unit`,
          duplicates: potentialDuplicates
        };
      }
    }

    return { hasDuplicate: false, duplicates: [] };
  } catch (err) {
    console.error('Exception in checkDuplicateGlobalProduct:', err);
    return { hasDuplicate: false, duplicates: [] };
  }
}

// ---------------------------------------------------------------------------
// 4. CREATE GLOBAL PRODUCT
// ---------------------------------------------------------------------------
export async function createGlobalProduct(productData) {
  if (!isSupabaseConfigured) return null;

  try {
    const payload = {
      name: (productData.name || '').trim(),
      brand: (productData.brand || 'Standard').trim(),
      description: (productData.description || '').trim(),
      category: productData.category || 'General Groceries',
      subcategory: (productData.subcategory || '').trim(),
      unit: productData.unit || '1 kg',
      quantity: productData.quantity != null ? parseFloat(productData.quantity) : 1,
      image_url: productData.imageUrl || productData.image_url || '/images/cat_veg_fruits.jpg',
      barcode: (productData.barcode || '').trim() || null,
      search_keywords: (productData.searchKeywords || productData.search_keywords || '').trim() || null,
      is_active: productData.isActive !== false && productData.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('global_products')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Direct global_products insert failed, attempting fallback payload:', error.message);
      const fallbackPayload = {
        name: payload.name,
        brand: payload.brand,
        description: payload.description,
        category: payload.category,
        unit: payload.unit,
        image_url: payload.image_url,
        is_active: payload.is_active
      };

      const { data: retryData, error: retryErr } = await supabase
        .from('global_products')
        .insert([fallbackPayload])
        .select()
        .maybeSingle();

      if (retryErr) {
        console.error('Fallback global_products insert failed:', retryErr);
        return null;
      }
      return retryData;
    }

    return data;
  } catch (err) {
    console.error('Exception in createGlobalProduct:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. UPDATE GLOBAL PRODUCT (DOES NOT OVERWRITE STORE-SPECIFIC PRICE/STOCK)
// ---------------------------------------------------------------------------
export async function updateGlobalProduct(productId, productData) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    const updatePayload = {
      name: (productData.name || '').trim(),
      brand: (productData.brand || 'Standard').trim(),
      description: (productData.description || '').trim(),
      category: productData.category || 'General Groceries',
      subcategory: (productData.subcategory || '').trim(),
      unit: productData.unit || '1 kg',
      quantity: productData.quantity != null ? parseFloat(productData.quantity) : 1,
      image_url: productData.imageUrl || productData.image_url || '/images/cat_veg_fruits.jpg',
      barcode: (productData.barcode || '').trim() || null,
      search_keywords: (productData.searchKeywords || productData.search_keywords || '').trim() || null,
      is_active: productData.isActive !== false && productData.is_active !== false,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('global_products')
      .update(updatePayload)
      .eq('id', productId);

    if (error) {
      console.warn('global_products update with timestamps failed, retrying simple update:', error.message);
      const { error: retryErr } = await supabase
        .from('global_products')
        .update({
          name: updatePayload.name,
          brand: updatePayload.brand,
          description: updatePayload.description,
          category: updatePayload.category,
          unit: updatePayload.unit,
          image_url: updatePayload.image_url,
          is_active: updatePayload.is_active
        })
        .eq('id', productId);

      return !retryErr;
    }

    return true;
  } catch (err) {
    console.error('Exception in updateGlobalProduct:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. DELETE / DEACTIVATE GLOBAL PRODUCT
// ---------------------------------------------------------------------------
export async function deleteGlobalProduct(productId) {
  if (!isSupabaseConfigured || !productId) return false;

  try {
    // Delete from `global_products` (foreign keys with ON DELETE CASCADE handle store_products)
    const { error } = await supabase
      .from('global_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.warn('Delete from global_products failed, attempting soft deactivate:', error.message);
      const { error: deactErr } = await supabase
        .from('global_products')
        .update({ is_active: false })
        .eq('id', productId);

      return !deactErr;
    }

    return true;
  } catch (err) {
    console.error('Exception in deleteGlobalProduct:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 7. STORE ASSIGNMENT: FETCH ALL STORES CARRYING A GLOBAL PRODUCT
// ---------------------------------------------------------------------------
export async function fetchStoreAssignmentsForProduct(globalProductId) {
  if (!isSupabaseConfigured || !globalProductId) return [];

  try {
    const [storeProdsRes, shopsRes] = await Promise.all([
      supabase.from('store_products').select('*').eq('global_product_id', globalProductId),
      supabase.from('shops').select('*')
    ]);

    if (storeProdsRes.error || !storeProdsRes.data) {
      console.error('Error fetching store_products:', storeProdsRes.error);
      return [];
    }

    const shopMap = new Map();
    (shopsRes.data || []).forEach(s => shopMap.set(s.id, s));

    return storeProdsRes.data.map(sp => {
      const shop = shopMap.get(sp.store_id) || {};
      return {
        storeProductId: sp.id,
        storeId: sp.store_id,
        globalProductId: sp.global_product_id,
        storeName: shop.name || 'Store',
        storePhone: shop.phone || '',
        storeAddress: shop.address || '',
        locality: shop.locality || 'Local Area',
        city: shop.city || 'Bengaluru',
        price: parseFloat(sp.price || 0),
        mrp: parseFloat(sp.mrp || sp.price || 0),
        stock: sp.stock != null ? parseInt(sp.stock, 10) : 50,
        minThreshold: sp.min_threshold != null ? parseInt(sp.min_threshold, 10) : 5,
        isAvailable: sp.is_available !== false,
        storeSku: sp.store_sku || '',
        createdAt: sp.created_at || new Date().toISOString(),
        updatedAt: sp.updated_at || new Date().toISOString()
      };
    });
  } catch (err) {
    console.error('Exception in fetchStoreAssignmentsForProduct:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 8. ASSIGN A GLOBAL PRODUCT TO A STORE (STORE SPECIFIC PRICE, STOCK, AVAILABILITY)
// ---------------------------------------------------------------------------
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
  if (!isSupabaseConfigured || !storeId || !globalProductId) return null;

  try {
    const payload = {
      store_id: storeId,
      global_product_id: globalProductId,
      price: parseFloat(price || 0),
      mrp: mrp ? parseFloat(mrp) : parseFloat(price || 0),
      stock: parseInt(stock || 0, 10),
      min_threshold: parseInt(minThreshold || 5, 10),
      is_available: Boolean(isAvailable),
      store_sku: (storeSku || '').trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert on conflict (store_id, global_product_id)
    const { data, error } = await supabase
      .from('store_products')
      .upsert([payload], { onConflict: 'store_id,global_product_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error in assignProductToStore:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in assignProductToStore:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 9. UPDATE STORE PRODUCT (PRICE, MRP, STOCK, AVAILABILITY, SKU)
// ---------------------------------------------------------------------------
export async function updateStoreProductPricing({
  storeProductId,
  price,
  mrp,
  stock,
  minThreshold,
  isAvailable,
  storeSku
}) {
  if (!isSupabaseConfigured || !storeProductId) return false;

  try {
    const updatePayload = {
      price: parseFloat(price || 0),
      mrp: mrp ? parseFloat(mrp) : parseFloat(price || 0),
      stock: parseInt(stock || 0, 10),
      min_threshold: parseInt(minThreshold || 5, 10),
      is_available: Boolean(isAvailable),
      store_sku: (storeSku || '').trim() || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('store_products')
      .update(updatePayload)
      .eq('id', storeProductId);

    if (error) {
      console.error('Error updating store product pricing:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception in updateStoreProductPricing:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 10. REMOVE A PRODUCT FROM A STORE
// ---------------------------------------------------------------------------
export async function removeProductFromStore(storeProductId) {
  if (!isSupabaseConfigured || !storeProductId) return false;

  try {
    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', storeProductId);

    if (error) {
      console.error('Error deleting from store_products:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception in removeProductFromStore:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 11. FETCH COMPLETE STORE INVENTORY (STORE PRODUCTS JOINED WITH GLOBAL PRODUCTS)
// ---------------------------------------------------------------------------
export async function fetchStoreInventory(storeId, { search = '', category = 'all', isAvailable = 'all' } = {}) {
  if (!isSupabaseConfigured || !storeId) return [];

  try {
    // 1. Fetch store_products for this store
    let spQuery = supabase
      .from('store_products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (isAvailable === 'available') {
      spQuery = spQuery.eq('is_available', true);
    } else if (isAvailable === 'unavailable') {
      spQuery = spQuery.eq('is_available', false);
    }

    const { data: storeProds, error: spErr } = await spQuery;

    if (spErr || !storeProds || storeProds.length === 0) {
      // Fallback: check legacy products table for shop_id
      return await fetchStoreInventoryFallback(storeId, { search, category });
    }

    // 2. Fetch corresponding global products
    const globalIds = storeProds.map(sp => sp.global_product_id);
    const { data: globalProds, error: gpErr } = await supabase
      .from('global_products')
      .select('*')
      .in('id', globalIds);

    const globalMap = new Map();
    (globalProds || []).forEach(gp => globalMap.set(gp.id, gp));

    // 3. Merge global identity with store-specific price/stock
    let merged = storeProds.map(sp => {
      const gp = globalMap.get(sp.global_product_id) || {};
      const price = parseFloat(sp.price || 0);
      const mrp = parseFloat(sp.mrp || sp.price || 0);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const stock = sp.stock != null ? parseInt(sp.stock, 10) : 50;

      return {
        id: sp.id, // Store-product relationship ID
        storeProductId: sp.id,
        globalProductId: sp.global_product_id,
        shop_id: sp.store_id,
        storeId: sp.store_id,
        name: gp.name || 'Grocery Product',
        brand: gp.brand || 'Standard',
        category: gp.category || 'General Groceries',
        subcategory: gp.subcategory || '',
        description: gp.description || '',
        unit: gp.unit || '1 kg',
        quantity: gp.quantity != null ? parseFloat(gp.quantity) : 1,
        price: price,
        originalPrice: mrp,
        mrp: mrp,
        discount: discount,
        stock: stock,
        minThreshold: sp.min_threshold != null ? parseInt(sp.min_threshold, 10) : 5,
        status: (stock > 0 && sp.is_available !== false) ? 'In Stock' : 'Out of Stock',
        image: gp.image_url || '/images/cat_veg_fruits.jpg',
        image_url: gp.image_url || '/images/cat_veg_fruits.jpg',
        imageUrl: gp.image_url || '/images/cat_veg_fruits.jpg',
        isAvailable: sp.is_available !== false,
        is_available: sp.is_available !== false,
        storeSku: sp.store_sku || '',
        barcode: gp.barcode || '',
        rating: 4.9,
        reviews: 18,
        createdAt: sp.created_at || new Date().toISOString(),
        updatedAt: sp.updated_at || new Date().toISOString()
      };
    });

    // Apply client filters if requested
    if (category && category !== 'all') {
      merged = merged.filter(p => (p.category || '').toLowerCase().includes(category.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      merged = merged.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.storeSku || '').toLowerCase().includes(q)
      );
    }

    return merged;
  } catch (err) {
    console.error('Exception in fetchStoreInventory:', err);
    return [];
  }
}

// Fallback to query legacy `products` table
async function fetchStoreInventoryFallback(storeId, { search = '', category = 'all' } = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('shop_id', storeId)
      .order('created_at', { ascending: false });

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
        category: p.category || 'Groceries',
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
    console.error('Exception in fetchStoreInventoryFallback:', err);
    return [];
  }
}
