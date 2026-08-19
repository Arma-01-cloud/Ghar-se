import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Shield, Store, Bike, Users, ShoppingBag, 
  BarChart3, RefreshCw, LogOut, ShieldCheck, Sparkles
} from 'lucide-react';

export default function AdminNavbar() {
  const { 
    activeTab, 
    setActiveTab, 
    stats, 
    refreshData, 
    isLoading, 
    logout 
  } = useAdmin();

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'shops',
      label: 'Shops & Approvals',
      icon: Store,
      badge: stats.pendingShopsCount > 0 ? stats.pendingShopsCount : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-black'
    },
    {
      id: 'riders',
      label: 'Riders & Approvals',
      icon: Bike,
      badge: stats.pendingRidersCount > 0 ? stats.pendingRidersCount : null,
      badgeColor: 'bg-amber-500 text-stone-950 font-black'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: stats.totalCustomersCount > 0 ? stats.totalCustomersCount : null,
      badgeColor: 'bg-stone-200 text-stone-700 font-bold'
    },
    {
      id: 'any-store-catalog',
      label: 'Any Store Catalog',
      icon: Sparkles,
      badge: stats.totalGlobalProductsCount > 0 ? stats.totalGlobalProductsCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold'
    },
    {
      id: 'orders',
      label: 'Global Orders',
      icon: ShoppingBag,
      badge: stats.totalOrdersCount > 0 ? stats.totalOrdersCount : null,
      badgeColor: 'bg-stone-200 text-stone-700 font-bold'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              ADMIN HQ
            </span>
          </div>

          {/* NAVIGATION TABS (DESKTOP) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs font-extrabold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge != null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold shadow-2xs ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ACTIONS & LOGOUT */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* LIVE DB BADGE */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Live</span>
            </div>

            {/* REFRESH BUTTON */}
            <button
              type="button"
              onClick={refreshData}
              disabled={isLoading}
              title="Refresh database records"
              className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>

            {/* LOGOUT BUTTON */}
            <button
              type="button"
              onClick={logout}
              className="py-2 px-3.5 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE NAVIGATION BAR */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-stone-200/80 gap-1.5 bg-stone-50">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
