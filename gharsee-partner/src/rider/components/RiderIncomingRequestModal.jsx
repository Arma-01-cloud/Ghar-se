import React, { useState, useEffect } from 'react';
import { 
  Bike, Store, MapPin, Clock, DollarSign, ArrowRight, X, Phone, Package, ShieldCheck, Check,
  Camera, Eye, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RiderIncomingRequestModal({ notification, onAccept, onDecline }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const payload = notification?.payload || {};

  const isImageOrder = Boolean(
    payload.isDirectImageOrder || 
    payload.isImageOrder ||
    payload.order_type === 'image' || 
    payload.image_url || 
    payload.image ||
    payload.parsedItems?.some(i => i.isDirectImageOrder || i.image_url || i.image)
  );

  const imageUrl = payload.image_url || 
    payload.image || 
    payload.parsedItems?.[0]?.image_url || 
    payload.parsedItems?.[0]?.image || 
    null;

  const customerNote = (payload.note || payload.notes || payload.parsedItems?.[0]?.note || '').trim();

  // 30-second countdown ring timer
  useEffect(() => {
    if (!notification) return;
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDecline) onDecline(notification.id, 'Timed out (Auto-declined)');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notification?.id, onDecline]);

  if (!notification) return null;

  const handleAcceptClick = () => {
    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {}
    onAccept(notification);
  };

  const strokeDashoffset = 100 - (secondsLeft / 30) * 100;

  return (
    <>
      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {isLightboxOpen && imageUrl && (
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
                📸 Customer Grocery Photo • Order #{payload.orderId || notification.order_id}
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
                src={imageUrl}
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

      {/* INCOMING REQUEST MODAL */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
        <div 
          className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-500/40 p-6 sm:p-7 space-y-5 text-white animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* HEADER BADGE & COUNTDOWN */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                    NEW DELIVERY REQUEST
                  </span>
                  {isImageOrder && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Grocery Photo Order</span>
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-lg text-white mt-1">
                  Order #{payload.orderId || notification.order_id}
                </h3>
              </div>
            </div>

            {/* COUNTDOWN TIMER RING */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-stone-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400 transition-all duration-1000 ease-linear"
                  strokeDasharray="100, 100"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-display font-black text-sm text-amber-300">
                {secondsLeft}s
              </span>
            </div>
          </div>

          {/* ESTIMATED PAYOUT SPOTLIGHT BANNER */}
          <div className="bg-emerald-900/60 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-emerald-300 block tracking-wider">
                Estimated Delivery Payout
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display font-black text-3xl text-emerald-400">
                  ₹{payload.estimatedEarnings || 65}
                </span>
                <span className="text-xs text-stone-300 font-semibold">guaranteed payout</span>
              </div>
            </div>

            <div className="text-right space-y-0.5 text-xs font-bold text-stone-200">
              <div className="flex items-center gap-1 justify-end text-emerald-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{payload.estimatedTime || 'Delivery after 4:00 PM'}</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-stone-400 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{payload.distance || '1.8 km away'}</span>
              </div>
            </div>
          </div>

          {/* GROCERY PHOTO PREVIEW CARD (FOR IMAGE ORDERS) */}
          {isImageOrder && imageUrl && (
            <div className="bg-stone-800/90 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="relative group shrink-0 cursor-pointer"
                title="Tap to view & zoom full grocery photo"
              >
                <img
                  src={imageUrl}
                  alt="Customer Grocery Photo"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-emerald-400 group-hover:scale-105 transition-transform bg-stone-900"
                />
                <span className="absolute inset-0 bg-stone-950/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </span>
              </button>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-300 flex items-center gap-1">
                    📸 Customer Grocery List Photo
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    🔍 Tap to Zoom
                  </button>
                </div>
                {customerNote ? (
                  <p className="text-[11px] text-amber-200 bg-stone-900/80 p-1.5 rounded-lg border border-amber-500/20 truncate">
                    <strong>Note:</strong> {customerNote}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400">
                    Handwritten list uploaded by customer for store fulfillment.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STORE & CUSTOMER LOCATIONS */}
          <div className="space-y-3 text-xs font-semibold">
            
            {/* STORE PICKUP */}
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 text-[10px] font-extrabold uppercase">
                <span className="flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" /> 1. STORE PICKUP
                </span>
                <span className="text-stone-400">{payload.storePhone}</span>
              </div>
              <h4 className="font-black text-sm text-white">{payload.storeName || 'Local Grocery Store'}</h4>
              <p className="text-stone-300 text-[11px] truncate">{payload.storeAddress}</p>
            </div>

            {/* CUSTOMER DROP */}
            <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700 space-y-1">
              <div className="flex items-center justify-between text-amber-400 text-[10px] font-extrabold uppercase">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> 2. CUSTOMER DROP
                </span>
                <span className="text-stone-400">{payload.customerPhone}</span>
              </div>
              <h4 className="font-black text-sm text-white">{payload.customerName || 'Customer'}</h4>
              <p className="text-stone-300 text-[11px] truncate">{payload.deliveryAddress}</p>
            </div>

          </div>

          {/* ITEMS PREVIEW (IF NOT IMAGE ORDER) */}
          {!isImageOrder && (
            <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                  Items to Pick ({payload.itemCount || (payload.items ? payload.items.length : 1)})
                </span>
                <span className="font-extrabold text-emerald-400 text-[11px]">
                  {payload.paymentStatus || 'Cash on Delivery'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {payload.items && payload.items.map((itemStr, idx) => (
                  <span 
                    key={idx} 
                    className="bg-stone-800/90 border border-stone-700 text-stone-200 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  >
                    {typeof itemStr === 'string' ? itemStr : `${itemStr.name} (Quantity: ${itemStr.quantity || 1}, Weight: ${itemStr.unit || '1 unit'})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS: DECLINE / ACCEPT */}
          <div className="grid grid-cols-12 gap-3 pt-2">
            <button
              onClick={() => onDecline(notification.id, 'Rider declined request')}
              className="col-span-4 py-3.5 px-4 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>DECLINE</span>
            </button>

            <button
              onClick={handleAcceptClick}
              className="col-span-8 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider animate-pulse cursor-pointer"
            >
              <span>ACCEPT DELIVERY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}