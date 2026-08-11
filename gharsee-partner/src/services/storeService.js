import { mockCreateStore } from './mock/partnerService';

export async function createStoreInSupabase(storeData) {
  return await mockCreateStore(storeData);
}

export async function updateStoreInSupabase(storeId, updatedFields) {
  return true;
}

export async function updateStoreStatus(storeId, isOpen) {
  return true;
}
