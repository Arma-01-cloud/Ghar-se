import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { navigateToStore, navigateToCustomer, callCustomer } from '../services/navigation';
import MapPlaceholder from './MapPlaceholder';
import OTPVerificationModal from './OTPVerificationModal';
import { 
  Navigation, Phone, CheckCircle2, Store, MapPin, 
  Bike, Package, ArrowRight, ShieldCheck, Play 
} from 'lucide-react';

export default function CurrentDeliveryCard({ delivery }) {
  const { markArrivedAtStore, confirmPickup, startDelivery } = useRider();
  const [showOtpModal, setShowOtpModal] = useState(false);

  if (!delivery) return null;

  const isAccepted = delivery.status === 'accepted';
  const isArrived = delivery.status === 'arrived_at_store';
  const isPickedUp = delivery.status === 'picked_up';
  const isOutForDelivery = delivery.status === 'out_for_delivery';

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 shadow-xl space-y-6">
      
      {/* CARD TOP HEADER */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
            ACTIVE DELIVERY
          </span>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1">
            ORDER #{delivery.id}
          </h2>
        </div>

        <div className="text-right">
          <span className="font-black text-2xl text-emerald-950">₹{delivery.estimatedEarnings}</span>
          <span className="text-[10px] text-stone-400 font-bold block uppercase">Earned on Delivery</span>
        </div>
      </div>

      {/* MAP PLACEHOLDER */}
      <MapPlaceholder
        storeName={delivery.storeName}
        customerAddress={delivery.deliveryAddress}
      />

      {/* STATUS STEPPER PROGRESS BAR */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
          Current Progress Status
        </span>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-extrabold">
          <div className={`p-2 rounded-xl border ${isAccepted ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-emerald-100 text-emerald-900 border-emerald-200'}`}>
            1. Accepted
          </div>
          <div className={`p-2 rounded-xl border ${isArrived ? 'bg-emerald-800 text-white border-emerald-800' : isPickedUp || isOutForDelivery ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-400'}`}>
            2. At Store
          </div>
          <div className={`p-2 rounded-xl border ${isPickedUp ? 'bg-emerald-800 text-white border-emerald-800' : isOutForDelivery ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-400'}`}>
            3. Picked Up
          </div>
          <div className={`p-2 rounded-xl border ${isOutForDelivery ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-stone-100 text-stone-400'}`}>
            4. On Way
          </div>
        </div>
      </div>

      {/* PICKUP & DROP DETAILS SNAPSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        
        {/* PICKUP STORE DETAILS */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <span className="font-extrabold text-stone-900 uppercase text-[10px]">1. Pickup Store</span>
            <button
              onClick={() => navigateToStore(delivery.storeAddress, delivery.storeName)}
              className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate
            </button>
          </div>
          <h4 className="font-black text-stone-900 text-sm">{delivery.storeName}</h4>
          <p className="text-stone-500">{delivery.storeAddress}</p>
        </div>

        {/* CUSTOMER DROP DETAILS */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <span className="font-extrabold text-stone-900 uppercase text-[10px]">2. Customer Drop</span>
            <div className="flex gap-2">
              <button
                onClick={() => callCustomer(delivery.customerPhone)}
                className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={() => navigateToCustomer(delivery.deliveryAddress)}
                className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </button>
            </div>
          </div>
          <h4 className="font-black text-stone-900 text-sm">{delivery.customerName}</h4>
          <p className="text-stone-500">{delivery.deliveryAddress}</p>
        </div>

      </div>

      {/* WORKFLOW ACTION BUTTONS */}
      <div className="pt-2">
        {isAccepted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigateToStore(delivery.storeAddress, delivery.storeName)}
              className="py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-emerald-700" />
              <span>NAVIGATE TO STORE</span>
            </button>
            <button
              onClick={markArrivedAtStore}
              className="py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>YES, I'VE ARRIVED AT STORE</span>
            </button>
          </div>
        )}

        {isArrived && (
          <button
            onClick={confirmPickup}
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-display font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            <span>CONFIRM ORDER PICKUP ({delivery.itemCount} ITEMS)</span>
          </button>
        )}

        {isPickedUp && (
          <button
            onClick={startDelivery}
            className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-400 text-amber-950 font-display font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <Bike className="w-5 h-5" />
            <span>START DELIVERY TO CUSTOMER</span>
          </button>
        )}

        {isOutForDelivery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigateToCustomer(delivery.deliveryAddress)}
              className="py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-emerald-700" />
              <span>NAVIGATE TO CUSTOMER</span>
            </button>

            <button
              onClick={() => setShowOtpModal(true)}
              className="py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-display font-black text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>COMPLETE DELIVERY (ENTER OTP)</span>
            </button>
          </div>
        )}
      </div>

      {showOtpModal && (
        <OTPVerificationModal
          delivery={delivery}
          onClose={() => setShowOtpModal(false)}
        />
      )}

    </div>
  );
}
