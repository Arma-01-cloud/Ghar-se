import { INITIAL_SHOPKEEPER_ORDERS } from '../data/orders';
import { INITIAL_SHOPKEEPER_PRODUCTS } from '../data/products';
import { INITIAL_STORE_PROFILE } from '../data/store';
import { isValidOrderStatusTransition } from '../../utils/validators';

export async function fetchShopkeeperOrders() {
  return [...INITIAL_SHOPKEEPER_ORDERS];
}

export async function fetchShopkeeperProducts() {
  return [...INITIAL_SHOPKEEPER_PRODUCTS];
}

export async function fetchStoreProfile() {
  return { ...INITIAL_STORE_PROFILE };
}

// Backwards-compatible wrapper for any code still importing from this module.
export function validateStatusTransition(currentStatus, nextStatus) {
  return isValidOrderStatusTransition(currentStatus, nextStatus);
}