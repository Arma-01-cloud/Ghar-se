import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { ShieldCheck, X, KeyRound, DollarSign } from 'lucide-react';

export default function OTPVerificationModal({ delivery, onClose }) {
  const { confirmDeliveryWithOTP } = useRider();
  const [otp, setOtp] = useState(delivery?.otp || '4820');
  const [cashCollected, setCashCollected] = useState(delivery?.paymentType?.includes('COD') || false);

  if (!delivery) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = confirmDeliveryWithOTP(otp);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-display font-black text-xl text-stone-900">
            Complete Delivery #{delivery.id}
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm">
            Customer: <strong className="text-stone-900 font-bold">{delivery.customerName}</strong>
          </p>
        </div>

        {/* PAYMENT BREAKDOWN */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
          <div className="flex justify-between font-bold">
            <span className="text-stone-600">Payment Status:</span>
            <span className="text-emerald-800 font-extrabold">{delivery.paymentStatus}</span>
          </div>
          {delivery.paymentType?.includes('COD') ? (
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 font-black flex items-center justify-between text-xs mt-1">
              <span>⚠️ CASH TO COLLECT:</span>
              <span className="text-sm font-black">₹{delivery.orderTotal}</span>
            </div>
          ) : (
            <div className="text-stone-500 font-semibold text-[11px]">
              Payment already completed online. No cash to collect.
            </div>
          )}
        </div>

        {/* OTP INPUT FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5 text-center">
              Enter Customer Delivery OTP (4 Digits)
            </label>

            <div className="relative max-w-[200px] mx-auto">
              <input
                type="text"
                maxLength={4}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-stone-50 border-2 border-emerald-600 rounded-2xl py-3 px-4 text-center font-display font-black text-2xl tracking-[0.5em] text-stone-900 focus:outline-none shadow-xs"
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-4" />
            </div>

            <p className="text-[11px] text-stone-400 text-center mt-1.5 font-medium">
              Ask customer for the 4-digit code sent to their phone (Demo OTP: {delivery.otp || '4820'})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              VERIFY & COMPLETE
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}