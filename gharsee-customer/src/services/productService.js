import { fetchCustomerProducts } from './customerService';

export async function fetchProductsByStore(storeId) {
  return await fetchCustomerProducts(storeId);
}

export async function addProductToSupabase(productData) {
  return productData;
}