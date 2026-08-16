import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { navigateToStore, navigateToCustomer, callCustomer } from '../services/navigation';
import MapPlaceholder from './MapPlaceholder';
import OTPVerificationModal from './OTPVerificationModal';
import { 
  Navigation, Phone, CheckCircle2, Store, MapPin, 
  Bike, Package, ArrowRight, ShieldCheck, Play,
  Sparkles, CheckSquare, Square, ShoppingCart, AlertCircle
} from 'lucide-react';

export default function CurrentDeliveryCard({ delivery }) {
  const { markArrivedAtStore, confirmPickup, startDelivery } = useRider();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  if (!delivery) return null;

  const isAccepted = delivery.status === 'accepted';
  const isArrived = delivery.status === 'arrived_at_store' || delivery.status === 'SHOPPING';
  const isPickedUp = delivery.status === 'picked_up';
  const isOutForDelivery = delivery.status === 'out_for_delivery';

  const storePhoneDisplay = delivery.storePhone || '+91 81238 21300';
  const customerPhoneDisplay = delivery.customerPhone || 'Phone not provided';

  const isAnyStoreOrder = delivery.fulfillment_mode === 'shop_any_store' || delivery.isAnyStore;

  // Extract structured items list
  const structuredItems = delivery.parsedItems && delivery.parsedItems.length > 0
    ? delivery.parsedItems
    : (Array.isArray(delivery.items)
        ? delivery.items.map(item => {
            if (typeof item === 'string') {
              const match = item.match(/(.+)\s*\((.+)\)/);
              if (match) {
                return { name: match[1].trim(), unit: match[2].trim(), quantity: 1 };
              }
              return { name: item, unit: '1 unit', quantity: 1 };
            }
            return item;
          })
        : []);

  const totalItemsCount = structuredItems.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const allItemsChecked = totalItemsCount > 0 && checkedCount === totalItemsCount;

  const toggleCheckItem = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-600 p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* CARD TOP HEADER & ORDER TYPE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
              ACTIVE DELIVERY
            </span>
            {isAnyStoreOrder && (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Shop From Any Store</span>
              </span>
            )}
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1">
            ORDER #{delivery.id}
          </h2>
        </div>

        <div className="text-left sm:text-right bg-emerald-50/80 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-emerald-200">
          <span className="font-black text-2xl text-emerald-950">₹{delivery.estimatedEarnings}</span>
          <span className="text-[10px] text-emerald-800 font-bold block uppercase">
            {isAnyStoreOrder ? '⚡ High-Payout Express Delivery' : 'Earned on Delivery'}
          </span>
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
            1. Claimed
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

      {/* PICKUP STORE & CUSTOMER DROP DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
        
        {/* PICKUP STORE DETAILS */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <span className="font-extrabold text-stone-900 uppercase text-[10px] flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>1. Pickup Store Details</span>
            </span>
            <div className="flex gap-2">
              {storePhoneDisplay !== 'Phone not provided' && (
                <a
                  href={`tel:${storePhoneDisplay.replace(/\s+/g, '')}`}
                  className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Store
                </a>
              )}
              <button
                onClick={() => navigateToStore(delivery.storeAddress, delivery.storeName)}
                className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </button>
            </div>
          </div>
          <h4 className="font-black text-stone-900 text-sm">{delivery.storeName}</h4>
          <p className="text-stone-700 font-bold flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-emerald-700" /> {storePhoneDisplay}
          </p>
          <p className="text-stone-500">{delivery.storeAddress}</p>
        </div>

        {/* CUSTOMER DROP DETAILS */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <span className="font-extrabold text-stone-900 uppercase text-[10px] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>2. Customer Drop Details</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => callCustomer(customerPhoneDisplay)}
                className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </button>
              <button
                onClick={() => navigateToCustomer(delivery.deliveryAddress)}
                className="text-emerald-800 font-extrabold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </button>
            </div>
          </div>
          <h4 className="font-black text-stone-900 text-sm">{delivery.customerName}</h4>
          <p className="text-stone-700 font-bold flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-emerald-700" /> {customerPhoneDisplay}
          </p>
          <p className="text-stone-500">{delivery.deliveryAddress}</p>
        </div>

      </div>

      {/* DETAILED PRODUCTS CHECKLIST FOR RIDER (ESPECIALLY FOR ANY_STORE ORDERS) */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-700" />
            <span className="font-display font-extrabold text-xs text-stone-900 uppercase tracking-wide">
              Product List to Pick from Store ({totalItemsCount} items)
            </span>
          </div>
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
            allItemsChecked ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-800'
          }`}>
            {checkedCount}/{totalItemsCount} Verified
          </span>
        </div>

        {/* ITEMS CHECKLIST GRID */}
        <div className="space-y-2">
          {structuredItems.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            const itemName = item.name || item.product_name || 'Grocery Item';
            const itemUnit = item.unit || item.quantityUnit || '1 unit';
            const itemQty = item.quantity || item.qty || 1;
            const itemPrice = item.price || 0;

            return (
              <div
                key={idx}
                onClick={() => toggleCheckItem(idx)}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-stone-200 text-stone-900 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button type="button" className="text-emerald-700 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 fill-emerald-600 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400" />
                    )}
                  </button>

                  <div>
                    <span className={`font-extrabold text-xs block ${isChecked ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                      {itemName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-1.5 py-0.2 rounded border border-emerald-300">
                        {itemUnit}
                      </span>
                      <span className="text-[11px] text-stone-500 font-bold">
                        Qty: ×{itemQty}
                      </span>
                      {item.isManual && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-extrabold uppercase">
                          Custom Note
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {itemPrice > 0 && (
                  <span className="font-black text-xs text-stone-900 shrink-0">
                    ₹{itemPrice * itemQty}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* HELPER TIP FOR SHOPPING FROM ANY STORE */}
        {isAnyStoreOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-950 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              This is a "Shop From Any Store" order. Collect all items listed above from the local store and mark them as verified.
            </span>
          </div>
        )}
      </div>

      {/* WORKFLOW ACTION BUTTONS */}
      <div className="pt-2">
        {isAccepted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigateToStore(delivery.storeAddress, delivery.storeName)}
              className="py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-emerald-700" />
              <span>NAVIGATE TO STORE</span>
            </button>

            <button
              onClick={confirmPickup}
              className="py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>CONFIRM STORE PICKUP</span>
            </button>
          </div>
        )}

        {isPickedUp && (
          <button
            onClick={startDelivery}
            className="w-full py-4 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Bike className="w-4 h-4" />
            <span>START DELIVERY TO CUSTOMER</span>
          </button>
        )}

        {isOutForDelivery && (
          <button
            onClick={() => setShowOtpModal(true)}
            className="w-full py-4 px-6 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider animate-pulse cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>VERIFY OTP & COMPLETE DELIVERY</span>
          </button>
        )}
      </div>

      {/* OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <OTPVerificationModal
          customerPhone={delivery.customerPhone}
          onClose={() => setShowOtpModal(false)}
        />
      )}

    </div>
  );
}
