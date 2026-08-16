import React, { useState, useEffect } from 'react';
import { 
  Bike, Store, MapPin, Clock, DollarSign, ArrowRight, X, Phone, Package, ShieldCheck, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RiderIncomingRequestModal({ notification, onAccept, onDecline }) {
  if (!notification) return null;

  const payload = notification.payload || {};
  const [secondsLeft, setSecondsLeft] = useState(30);

  // 30-second countdown ring timer
  useEffect(() => {
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(notification.id, 'Timed out (Auto-declined)');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notification?.id]);

  const handleAcceptClick = () => {
    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {}
    onAccept(notification);
  };

  const strokeDashoffset = 100 - (secondsLeft / 30) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-emerald-950 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-500/40 p-6 sm:p-7 space-y-6 text-white animate-in zoom-in-95 duration-200"
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
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                NEW DELIVERY REQUEST
              </span>
              <h3 className="font-display font-black text-lg text-white mt-1">
                Order #{payload.orderId || notification.order_id}
              </h3>
            </div>
          </div>

          {/* COUNTDOWN TIMER RING */}
          <div className="relative w-12 h-12 flex items-center justify-center">
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
              <span>{payload.estimatedTime || '15-20 min'}</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-stone-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{payload.distance || '1.8 km away'}</span>
            </div>
          </div>
        </div>

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

        {/* ITEMS PREVIEW */}
        <div className="flex items-center justify-between bg-stone-900/90 px-4 py-2.5 rounded-xl border border-stone-800 text-xs">
          <span className="text-stone-400 font-medium">Order Package:</span>
          <span className="font-extrabold text-stone-200">
            {payload.itemCount || 1} Items ({payload.paymentStatus || 'Cash on Delivery'})
          </span>
        </div>

        {/* ACTION BUTTONS: DECLINE / ACCEPT */}
        <div className="grid grid-cols-12 gap-3 pt-2">
          <button
            onClick={() => onDecline(notification.id, 'Rider declined request')}
            className="col-span-4 py-3.5 px-4 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>DECLINE</span>
          </button>

          <button
            onClick={handleAcceptClick}
            className="col-span-8 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider animate-pulse"
          >
            <span>ACCEPT DELIVERY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
