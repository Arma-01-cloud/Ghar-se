import React from 'react';
import { Leaf, PhoneCall } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-[#0E382B] text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-center sm:text-left flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium mx-auto sm:mx-0">
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-400" />
            HYPERLOCAL FRESH MARKETPLACE
          </span>
          <span className="text-stone-200 hidden md:inline">Fresh groceries & daily pantry essentials delivered from local stores</span>
        </div>
        <a
          href="tel:8123821300"
          className="mx-auto sm:mx-0 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all shadow-xs"
        >
          <PhoneCall className="w-3 h-3" />
          <span>Call to Order</span>
        </a>
      </div>
    </div>
  );
}
