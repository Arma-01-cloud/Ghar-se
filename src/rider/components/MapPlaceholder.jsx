import React from 'react';
import { MapPin, Navigation, Bike, Store } from 'lucide-react';

export default function MapPlaceholder({ storeName, customerAddress }) {
  return (
    <div className="relative w-full h-48 sm:h-56 bg-stone-900 rounded-3xl overflow-hidden border border-stone-800 shadow-inner flex flex-col items-center justify-center p-4 text-center">
      
      {/* MAP GRID OVERLAY PATTERN */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* SIMULATED ROUTE LINE */}
      <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-1 border-b-2 border-dashed border-emerald-500/60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex items-center justify-between px-4">
        
        {/* PICKUP STORE PIN */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg border-2 border-emerald-400 animate-bounce">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black bg-stone-950/80 text-emerald-300 px-2 py-0.5 rounded-md truncate max-w-[100px]">
            {storeName || 'Store'}
          </span>
        </div>

        {/* RIDER BIKE ICON */}
        <div className="w-10 h-10 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xl border-2 border-amber-300">
          <Bike className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* CUSTOMER PIN */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black bg-stone-950/80 text-rose-300 px-2 py-0.5 rounded-md truncate max-w-[100px]">
            Customer Drop
          </span>
        </div>

      </div>

      <div className="relative z-10 mt-6 bg-stone-950/90 text-stone-400 text-[10px] font-bold px-3 py-1 rounded-full border border-stone-800 flex items-center gap-1.5">
        <Navigation className="w-3 h-3 text-emerald-400" />
        <span>GPS Navigation route • Maps integration ready</span>
      </div>

    </div>
  );
}
