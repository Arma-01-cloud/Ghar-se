import React from 'react';
import { useCart } from '../context/CartContext';
import { 
  Store, Home as HomeIcon, FileEdit, Upload, PhoneCall
} from 'lucide-react';

export default function MobileBottomNav() {
  const { activeTab, setActiveTab } = useCart();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: HomeIcon,
      action: () => setActiveTab('home'),
      isActive: activeTab === 'home'
    },
    {
      id: 'stores',
      label: 'Shops',
      icon: Store,
      action: () => setActiveTab('stores'),
      isActive: activeTab === 'stores' || activeTab === 'store-detail'
    },
    {
      id: 'any-store',
      label: 'Manual',
      icon: FileEdit,
      action: () => setActiveTab('any-store'),
      isActive: activeTab === 'any-store'
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      action: () => setActiveTab('upload'),
      isActive: activeTab === 'upload'
    }
  ];

  return (
    <nav 
      aria-label="GharSee Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-lg border-t border-stone-200/90 shadow-[0_-8px_30px_rgba(8,36,27,0.08)] px-2 sm:px-3 py-2 safe-bottom select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-1 sm:gap-2">
        
        {/* NAVIGATION TABS: HOME, SHOPS, MANUAL, UPLOAD */}
        <div className="flex items-center justify-around flex-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`group relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer ${
                  active 
                    ? 'text-emerald-950 scale-105' 
                    : 'text-stone-500 hover:text-stone-800 active:scale-95'
                }`}
              >
                {/* ACTIVE GLOW PILL ACCENT */}
                <div className={`relative w-9 h-7 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 shadow-2xs' 
                    : 'text-stone-500 group-hover:bg-stone-200/50'
                }`}>
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${
                    active ? 'stroke-[2.5] text-emerald-900 scale-110' : 'stroke-[2] text-stone-600'
                  }`} />
                </div>

                {/* LABEL */}
                <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight font-sans transition-all ${
                  active 
                    ? 'font-black text-emerald-950' 
                    : 'font-semibold text-stone-500'
                }`}>
                  {tab.label}
                </span>

                {/* ACTIVE BOTTOM DOT */}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-emerald-700 mt-0.5 animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>

        {/* 5. CALL TO ORDER BUTTON (IN PLACE OF SHOP FROM ANY STORE) */}
        <div className="pl-1 shrink-0">
          <a
            href="tel:8123821300"
            className="active:scale-95 font-extrabold text-xs px-2.5 sm:px-3 py-2 rounded-2xl shadow-md border flex items-center gap-1.5 transition-all cursor-pointer group bg-gradient-to-tr from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 border-amber-300/80 shadow-amber-400/20"
            title="Call to Order: 8123821300"
          >
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-stone-950 stroke-[2.5] group-hover:rotate-12 transition-transform" />
              <span className="font-display font-black tracking-tight text-[10px] sm:text-[11px] uppercase text-stone-950 whitespace-nowrap">
                Call to Order
              </span>
            </div>
          </a>
        </div>

      </div>
    </nav>
  );
}
