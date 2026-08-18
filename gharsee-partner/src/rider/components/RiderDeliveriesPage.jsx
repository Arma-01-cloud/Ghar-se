import React from 'react';
import { useRider } from '../context/RiderContext';
import CurrentDeliveryCard from './CurrentDeliveryCard';
import DeliveryRequestCard from './DeliveryRequestCard';
import { Bike, ShieldCheck, Store, MapPin, Package } from 'lucide-react';

export default function RiderDeliveriesPage() {
  const { activeDelivery, incomingRequest, isOnline } = useRider();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Bike className="w-4 h-4 text-emerald-600" />
          <span>DELIVERY OPERATIONS</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
          Active Delivery Task
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Perform pickup and drop fulfillment for accepted local grocery orders
        </p>
      </div>

      {activeDelivery ? (
        <CurrentDeliveryCard delivery={activeDelivery} />
      ) : isOnline && incomingRequest ? (
        <DeliveryRequestCard request={incomingRequest} />
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto space-y-2">
          <Bike className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-display font-extrabold text-lg text-stone-900">No active delivery</h3>
          <p className="text-stone-500 text-xs">Stay online to receive new delivery requests from nearby stores.</p>
        </div>
      )}

    </div>
  );
}
