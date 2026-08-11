export async function fetchProductsByStore(storeId) {
  return [];
}

export async function addProductToSupabase(productData) {
  return { id: `prod-${Date.now()}`, ...productData };
}

export async function updateProductStockInSupabase(productId, newStock) {
  return true;
}
