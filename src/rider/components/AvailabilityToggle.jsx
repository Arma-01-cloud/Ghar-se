import React from 'react';
import { useRider } from '../context/RiderContext';
import { Power, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AvailabilityToggle() {
  const { isOnline, toggleAvailability } = useRider();

  return (
    <div className={`rounded-3xl p-5 border shadow-xs transition-all ${
      isOnline
        ? 'bg-emerald-950 text-white border-emerald-800'
        : 'bg-stone-900 text-white border-stone-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
            isOnline ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'bg-stone-800 text-stone-400'
          }`}>
            <Power className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <h3 className="font-display font-black text-xl text-white">
                {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </h3>
            </div>
            <p className="text-xs text-stone-300 font-medium mt-0.5">
              {isOnline ? "You're available for local grocery deliveries." : "You're currently offline. You won't receive new delivery requests."}
            </p>
          </div>
        </div>

        <button
          onClick={toggleAvailability}
          className={`py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 ${
            isOnline
              ? 'bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700'
              : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
          }`}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE NOW'}
        </button>

      </div>
    </div>
  );
}