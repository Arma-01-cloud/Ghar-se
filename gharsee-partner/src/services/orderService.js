import { mockFetchPartnerOrders, mockFetchRiderDeliveries } from './mock/partnerService';

export async function fetchShopkeeperOrders(shopId) {
  return await mockFetchPartnerOrders(shopId);
}

export async function fetchRiderDeliveries() {
  return await mockFetchRiderDeliveries();
}

export async function updateOrderStatusInSupabase(orderId, status) {
  return true;
}

export async function assignStoreToAnyStoreOrder(orderId, shopId) {
  return true;
}
