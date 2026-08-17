import React from 'react';
import { useRider } from '../context/RiderContext';
import CurrentDeliveryCard from './CurrentDeliveryCard';
import DeliveryRequestCard from './DeliveryRequestCard';
import { 
  Bike, Store, MapPin, Package, ArrowRight, Clock, ShieldCheck, 
  Sparkles, AlertCircle 
} from 'lucide-react';

export default function RiderDeliveriesPage() {
  const { 
    activeDelivery, 
    incomingRequest, 
    availableDeliveryPool, 
    acceptDelivery, 
    isOnline 
  } = useRider();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Bike className="w-4 h-4 text-emerald-600" />
            <span>DELIVERY OPERATIONS</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            {activeDelivery ? 'Active Delivery Task' : 'Available Delivery Pool'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {activeDelivery 
              ? 'Complete store pickup, verify item packing checklist, and deliver to customer' 
              : 'Incoming customer orders waiting for pickup (First delivery partner to accept claims the order)'}
          </p>
        </div>

        {!isOnline && (
          <div className="bg-amber-100 text-amber-900 text-xs font-black px-3.5 py-2 rounded-2xl border border-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>You are currently Offline</span>
          </div>
        )}
      </div>

      {/* 1. ACTIVE DELIVERY CARD */}
      {activeDelivery ? (
        <CurrentDeliveryCard delivery={activeDelivery} />
      ) : isOnline && availableDeliveryPool && availableDeliveryPool.length > 0 ? (
        /* 2. AVAILABLE DELIVERY POOL LIST */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="font-display font-extrabold text-lg text-stone-900">
                {availableDeliveryPool.length} Open Orders Ready for Delivery
              </h3>
            </div>
            <span className="text-xs font-bold text-stone-500">
              ⚡ First partner to accept gets the order
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {availableDeliveryPool.map((order) => {
              const rawItems = order.parsedItems && order.parsedItems.length > 0 
                ? order.parsedItems 
                : (Array.isArray(order.items) ? order.items : []);

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 hover:border-emerald-500 shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                          ORDER #{order.id}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500">
                          {order.paymentStatus || 'Cash on Delivery'}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-lg text-stone-900 mt-1">
                        Pickup from: {order.storeName}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-display font-black text-2xl text-emerald-950 block">
                        ₹{order.estimatedEarnings || 65}
                      </span>
                      <span className="text-[10px] font-extrabold text-stone-400 uppercase">
                        Delivery Payout
                      </span>
                    </div>
                  </div>

                  {/* STORE & DROP ADDRESSES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-700 block flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> 1. Pickup Store
                      </span>
                      <p className="font-bold text-stone-800">{order.storeAddress}</p>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase text-amber-600 block flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> 2. Customer Drop
                      </span>
                      <p className="font-bold text-stone-800">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* ITEMS PREVIEW WITH GRAMS / LITERS */}
                  {rawItems.length > 0 && (
                    <div className="bg-stone-50/90 rounded-2xl p-3 border border-stone-200 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-stone-500 block flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-emerald-700" /> Items in order ({rawItems.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rawItems.map((it, idx) => (
                          <span key={idx} className="bg-white border border-stone-200 px-2.5 py-1 rounded-xl text-[11px] font-bold text-stone-800 shadow-2xs">
                            {typeof it === 'string' ? it : `${it.name || it.product_name} (Quantity: ${it.quantity || 1}, Weight: ${it.unit || '1 unit'})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1-CLICK ACCEPT BUTTON */}
                  <button
                    onClick={() => acceptDelivery(order)}
                    className="w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <span>ACCEPT DELIVERY & CLAIM ORDER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : isOnline && incomingRequest ? (
        <DeliveryRequestCard request={incomingRequest} />
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto space-y-3">
          <Bike className="w-14 h-14 text-stone-300 mx-auto" />
          <h3 className="font-display font-extrabold text-lg text-stone-900">
            {isOnline ? 'No active orders in pool' : 'You are currently offline'}
          </h3>
          <p className="text-stone-500 text-xs">
            {isOnline 
              ? 'When customers place orders, delivery requests will appear here instantly.' 
              : 'Toggle your status to Online to start receiving delivery requests.'}
          </p>
        </div>
      )}

    </div>
  );
}
