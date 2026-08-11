import { INITIAL_DELIVERY_REQUESTS, INITIAL_DELIVERY_HISTORY } from '../data/deliveries';

export function validateRiderStatusTransition(currentStatus, nextStatus) {
  const RIDER_WORKFLOW = {
    available: ['delivery_requested'],
    delivery_requested: ['accepted', 'declined'],
    accepted: ['arrived_at_store'],
    arrived_at_store: ['picked_up'],
    picked_up: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    declined: []
  };

  const allowed = RIDER_WORKFLOW[currentStatus] || [];
  return allowed.includes(nextStatus);
}
