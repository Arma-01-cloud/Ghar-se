import { placeCustomerOrder, fetchCustomerOrdersHistory } from './mock/customerService';

export async function createOrderInSupabase(orderData) {
  return await placeCustomerOrder(orderData);
}

export async function fetchCustomerOrders() {
  return await fetchCustomerOrdersHistory();
}
