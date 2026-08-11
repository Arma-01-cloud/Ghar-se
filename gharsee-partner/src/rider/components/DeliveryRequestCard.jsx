import React, { useState, useEffect } from 'react';
import { useRider } from '../context/RiderContext';
import DeclineReasonModal from './DeclineReasonModal';
import { Bike, Store, MapPin, Clock, DollarSign, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function DeliveryRequestCard({ request }) {
  const { acceptDelivery } = useRider();
  const [timeLeft, setTimeLeft] = useState(request.expiresInSeconds || 30);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!request || timeLeft <= 0) {
    return (
      <div className="bg-stone-100 rounded-3xl p-6 text-center text-stone-500 border border-stone-200 space-y-1">
        <Clock className="w-8 h-8 mx-auto text-stone-400 mb-1" />
        <h4 className="font-display font-extrabold text-sm text-stone-800">No active delivery requests</h4>
        <p className="text-xs">Stay online and you will be notified when a new request arrives.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0E382B] to-[#134E3A] text-white rounded-3xl p-6 shadow-xl space-y-5 border border-emerald-700/80 animate-in fade-in duration-200">
      
      {/* CARD HEADER WITH TIMER */}
      <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
            NEW DELIVERY REQUEST
          </span>
        </div>

        <div className="bg-emerald-950/80 px-3 py-1 rounded-full text-xs font-black text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Expires in 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
        </div>
      </div>

      {/* ORDER & EARNINGS HIGHLIGHT */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-display font-black text-2xl text-white">ORDER #{request.id}</span>
          <p className="text-xs text-emerald-200/80 font-medium">{request.itemCount} Items • {request.paymentStatus}</p>
        </div>

        <div className="text-right bg-emerald-950/60 px-4 py-2 rounded-2xl border border-emerald-700/50">
          <span className="text-[10px] text-emerald-300 font-extrabold uppercase block">Est. Earnings</span>
          <span className="font-display font-black text-2xl text-emerald-400">₹{request.estimatedEarnings}</span>
        </div>
      </div>

      {/* PICKUP & DROP DETAILS */}
      <div className="bg-emerald-950/50 rounded-2xl p-4 border border-emerald-800/60 space-y-3 text-xs">
        
        {/* PICKUP */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Pickup Store</span>
            <h5 className="font-black text-white">{request.storeName}</h5>
            <p className="text-[11px] text-emerald-200/80 truncate">{request.storeAddress}</p>
          </div>
        </div>

        {/* DISTANCE & TIME BADGE */}
        <div className="flex items-center justify-between text-[11px] bg-emerald-900/60 px-3 py-1.5 rounded-xl font-extrabold text-emerald-200">
          <span>📏 Distance: {request.distance}</span>
          <span>⏱️ Est. Time: {request.estimatedTime}</span>
        </div>

        {/* DROP */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-rose-300 block">Drop Customer</span>
            <h5 className="font-black text-white">{request.customerName}</h5>
            <p className="text-[11px] text-emerald-200/80 truncate">{request.deliveryAddress}</p>
          </div>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <button
          onClick={() => setShowDeclineModal(true)}
          className="py-3 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-extrabold text-xs rounded-2xl border border-rose-800 transition-colors"
        >
          DECLINE
        </button>

        <button
          onClick={() => acceptDelivery(request)}
          className="col-span-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-display font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/30 transition-all flex items-center justify-center gap-2"
        >
          <span>ACCEPT DELIVERY</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {showDeclineModal && (
        <DeclineReasonModal
          deliveryId={request.id}
          onClose={() => setShowDeclineModal(false)}
        />
      )}

    </div>
  );
}
