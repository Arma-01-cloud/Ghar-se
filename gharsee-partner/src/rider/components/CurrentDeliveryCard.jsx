import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { navigateToStore, navigateToCustomer, callCustomer } from '../services/navigation';
import MapPlaceholder from './MapPlaceholder';
import OTPVerificationModal from './OTPVerificationModal';
import { 
  Navigation, Phone, CheckCircle2, Store, MapPin, 
  Bike, Package, ArrowRight, ShieldCheck, Play,
  Sparkles, CheckSquare, Square, ShoppingCart, AlertCircle,
  Camera, Eye, X
} from 'lucide-react';

export default function CurrentDeliveryCard({ delivery }) {
  const { markArrivedAtStore, confirmPickup, startDelivery } = useRider();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const isImageOrder = Boolean(
    delivery.isDirectImageOrder || 
    delivery.isImageOrder ||
    delivery.order_type === 'image' || 
    delivery.image_url || 
    delivery.image ||
    structuredItems.some(i => i && (i.isDirectImageOrder || i.image_url || i.image))
  );

  const deliveryImageUrl = delivery.image_url || 
    delivery.image || 
    structuredItems[0]?.image_url || 
    structuredItems[0]?.image || 
    null;

  const customerNote = (delivery.note || delivery.notes || structuredItems[0]?.note || '').trim();

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
    <>
      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {isLightboxOpen && deliveryImageUrl && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => { setIsLightboxOpen(false); setZoomLevel(1); }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-stone-700 flex flex-col items-center gap-4 overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LIGHTBOX HEADER */}
            <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="text-white font-extrabold text-sm flex items-center gap-2">
                📸 Customer Grocery Photo • Order #{delivery.id}
              </span>

              <div className="flex items-center gap-2">
                <div className="bg-stone-800 rounded-xl p-1 flex items-center gap-1 text-xs">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="px-2 py-1 hover:bg-stone-700 rounded-lg font-bold cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="px-1 text-[11px] font-mono">{Math.round(zoomLevel * 100)}%</span>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                    className="px-2 py-1 hover:bg-stone-700 rounded-lg font-bold cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => setZoomLevel(1)}
                    className="px-1.5 py-1 hover:bg-stone-700 rounded-lg text-[10px] text-stone-400 font-bold cursor-pointer"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={() => { setIsLightboxOpen(false); setZoomLevel(1); }}
                  className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* IMAGE PREVIEW */}
            <div className="w-full flex-1 overflow-auto flex items-center justify-center min-h-[300px] max-h-[70vh]">
              <img
                src={deliveryImageUrl}
                alt="Customer Grocery Photo"
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-lg border border-stone-800"
              />
            </div>

            {customerNote && (
              <div className="w-full p-2.5 bg-stone-800/90 rounded-xl text-xs text-amber-300 border border-amber-500/30">
                <strong>Customer Note:</strong> {customerNote}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border-2 border-emerald-600 p-5 sm:p-7 shadow-xl space-y-6">
        
        {/* CARD TOP HEADER & ORDER TYPE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                ACTIVE DELIVERY
              </span>
              {isImageOrder && (
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-amber-700" />
                  <span>Grocery Photo Order</span>
                </span>
              )}
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
            <span className="font-black text-2xl text-emerald-950">₹{delivery.estimatedEarnings || 65}</span>
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

        {/* GROCERY PHOTO SECTION FOR IMAGE ORDERS */}
        {isImageOrder && deliveryImageUrl && (
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                  Customer Grocery List Photo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="text-xs text-emerald-800 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Tap to Zoom Photo
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative group shrink-0 cursor-pointer"
                title="Tap to zoom"
              >
                <img
                  src={deliveryImageUrl}
                  alt="Customer Grocery Photo"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border-2 border-emerald-500 shadow-sm group-hover:scale-105 transition-transform bg-white"
                />
                <span className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                  🔍 View
                </span>
              </button>

              <div className="space-y-1.5 flex-1">
                <span className="text-xs font-bold text-emerald-950 block">
                  Original handwritten / packaged grocery list uploaded by customer
                </span>
                {customerNote && (
                  <div className="p-2.5 bg-white/90 rounded-xl border border-amber-300 text-xs text-stone-800">
                    <strong className="text-amber-900">Customer Note:</strong> {customerNote}
                  </div>
                )}
                <p className="text-[11px] text-stone-500">
                  Tap the photo above to open fullscreen zoom and read small handwriting clearly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DETAILED PRODUCTS CHECKLIST FOR RIDER (FOR STANDARD / ANY_STORE ORDERS) */}
        {!isImageOrder && (
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
                            Weight: {itemUnit}
                          </span>
                          <span className="text-[11px] text-stone-600 font-bold">
                            Quantity: {itemQty}
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
        )}

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
            delivery={delivery}
            onClose={() => setShowOtpModal(false)}
          />
        )}

      </div>
    </>
  );
}