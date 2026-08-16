import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { 
  Store, Clock, AlertTriangle, RefreshCw, ShieldCheck, 
  MapPin, Phone, LogOut, CheckCircle2 
} from 'lucide-react';

export default function ShopkeeperPendingApprovalView({ onLogout }) {
  const { storeProfile, reloadOrdersAndShop, addShopkeeperToast } = useShopkeeper();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    addShopkeeperToast('Checking approval status with Ghar See Admin...', 'info');

    setTimeout(async () => {
      if (reloadOrdersAndShop) {
        await reloadOrdersAndShop();
      }
      setIsChecking(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-lg bg-stone-950/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
        
        {/* BACKGROUND GLOW */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* STATUS ICON */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-pulse">
          <Clock className="w-8 h-8 stroke-[2.3]" />
        </div>

        {/* HEADINGS */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            REGISTRATION UNDER ADMIN REVIEW
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome, {storeProfile?.name || 'Store Partner'}!
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
            Your store registration has been successfully submitted to the <strong>Ghar See Administration Team</strong>.
          </p>
        </div>

        {/* STORE SUBMITTED SUMMARY CARD */}
        <div className="p-4 bg-stone-900/90 rounded-2xl border border-stone-800 text-left text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-stone-400 font-bold">Store Name:</span>
            <span className="text-white font-extrabold">{storeProfile?.name || 'Local Grocery Store'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-stone-400 font-bold">Contact Phone:</span>
            <span className="text-stone-200 font-bold flex items-center gap-1">
              <Phone className="w-3 h-3 text-stone-400" />
              {storeProfile?.phone || storeProfile?.shopkeeperPhone || 'Registered Phone'}
            </span>
          </div>

          <div className="flex items-start justify-between border-b border-stone-800 pb-2 gap-2">
            <span className="text-stone-400 font-bold shrink-0">Location:</span>
            <span className="text-stone-300 font-medium text-right truncate">
              {storeProfile?.locality || 'Locality'}, {storeProfile?.city || 'City'} ({storeProfile?.pincode})
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-stone-400 font-bold">Current Status:</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
              ⏳ Awaiting Admin Acceptance
            </span>
          </div>
        </div>

        {/* INFORMATIONAL CALLOUT */}
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-200/90 leading-snug">
            Once Ghar See Admin reviews and accepts your store, your order dashboard will unlock immediately and your store will become visible on the customer app.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Approval Status'}</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto py-3 px-4 bg-stone-900 hover:bg-rose-950 text-stone-300 hover:text-rose-300 border border-stone-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
