import { fetchCustomerStores } from './mock/customerService';

export async function fetchStores(lat, lon, localityName) {
  const stores = await fetchCustomerStores(localityName);
  return { stores, error: null };
}

export async function createStoreInSupabase(storeData) {
  return { data: { id: `store-${Date.now()}`, ...storeData }, error: null };
}
