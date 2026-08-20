import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Shield, Store, Bike, Users, ShoppingBag, 
  BarChart3, RefreshCw, LogOut, Package
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
      id: 'global-catalog',
      label: 'Global Catalog',
      icon: Package,
      badge: stats.totalGlobalProductsCount > 0 ? stats.totalGlobalProductsCount : null,
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold'
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
          <div className="flex items-center gap-3">
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              ADMIN HQ
            </span>
          </div>

          {/* DESKTOP NAV TABS */}
          <nav className="hidden lg:flex items-center gap-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'global-catalog' && activeTab === 'any-store-catalog');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS: REFRESH & LOGOUT */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              title="Refresh all Supabase records"
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-all cursor-pointer flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>

        {/* MOBILE NAVIGATION TABS SCROLLER */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-stone-100 scrollbar-none text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'global-catalog' && activeTab === 'any-store-catalog');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-extrabold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}