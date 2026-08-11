import React from 'react';
import { Leaf } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-[#0E382B] text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-center sm:text-left">
        <div className="flex items-center gap-2 font-medium mx-auto sm:mx-0">
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <Leaf className="w-3 h-3 text-emerald-400" />
            HYPERLOCAL FRESH MARKETPLACE
          </span>
          <span className="text-stone-200">Fresh groceries & daily pantry essentials delivered directly from local neighborhood stores</span>
        </div>
      </div>
    </div>
  );
}
