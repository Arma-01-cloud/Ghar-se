import { INITIAL_SHOPKEEPER_ORDERS } from '../data/orders';
import { INITIAL_SHOPKEEPER_PRODUCTS } from '../data/products';
import { INITIAL_STORE_PROFILE } from '../data/store';

export async function fetchShopkeeperOrders() {
  return [...INITIAL_SHOPKEEPER_ORDERS];
}

export async function fetchShopkeeperProducts() {
  return [...INITIAL_SHOPKEEPER_PRODUCTS];
}

export async function fetchStoreProfile() {
  return { ...INITIAL_STORE_PROFILE };
}

export function validateStatusTransition(currentStatus, nextStatus) {
  const WORKFLOW = {
    pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready'],
    ready: ['out_for_delivery'],
    out_for_delivery: ['completed'],
    completed: [],
    rejected: []
  };

  const allowed = WORKFLOW[currentStatus] || [];
  return allowed.includes(nextStatus);
}
