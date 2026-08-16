import React from 'react';
import { useCart } from '../context/CartContext';
import { 
  ArrowUpRight, Sparkles, Store, 
  Clock, Home as HomeIcon, FileEdit
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
      label: 'Store',
      icon: Store,
      action: () => setActiveTab('stores'),
      isActive: activeTab === 'stores' || activeTab === 'store-detail'
    },
    {
      id: 'upload',
      label: 'Manual',
      icon: FileEdit,
      action: () => setActiveTab('upload'),
      isActive: activeTab === 'upload'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Clock,
      action: () => setActiveTab('orders'),
      isActive: activeTab === 'orders'
    }
  ];

  const isAnyStoreActive = activeTab === 'any-store';

  return (
    <nav 
      aria-label="GharSee Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-lg border-t border-stone-200/90 shadow-[0_-8px_30px_rgba(8,36,27,0.08)] px-2 sm:px-3 py-2 safe-bottom select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-1 sm:gap-2">
        
        {/* NAVIGATION TABS: HOME, STORE, MANUAL, ORDERS */}
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

        {/* 5. SHOP FROM ANY STORE COMPONENT BUTTON */}
        <div className="pl-1 shrink-0">
          <button
            onClick={() => setActiveTab('any-store')}
            className={`active:scale-95 font-extrabold text-xs px-3 sm:px-3.5 py-2 rounded-2xl shadow-md border flex items-center gap-1.5 transition-all cursor-pointer group ${
              isAnyStoreActive
                ? 'bg-[#0E382B] text-white border-emerald-500 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-950/20'
                : 'bg-gradient-to-tr from-[#08241B] to-[#0E382B] hover:from-[#0E382B] hover:to-[#134E3A] text-white border-emerald-700/60'
            }`}
            title="Shop From Any Store - Multi-store express order builder"
          >
            <div className="flex items-center gap-1">
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 transition-transform ${
                isAnyStoreActive ? 'rotate-12 scale-110' : 'group-hover:rotate-12'
              }`} />
              <span className="font-display font-black tracking-tight text-[11px] uppercase text-emerald-100 whitespace-nowrap">
                Shop From Any Store
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" />
          </button>
        </div>

      </div>
    </nav>
  );
}
