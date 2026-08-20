import React from 'react';
import { useAdmin } from '../context/AdminContext';
import UrGrozyLogo from './UrGrozyLogo';
import { 
  Store, Bike, Users, IndianRupee, LogOut, 
  RefreshCw, ShieldCheck, LayoutDashboard, Package
} from 'lucide-react';

export default function AdminNavbar() {
  const { 
    activeTab, 
    setActiveTab, 
    stats, 
    logout, 
    refreshData, 
    isLoading 
  } = useAdmin();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'shops', label: 'Stores', icon: Store, badge: stats.pendingShopsCount, badgeColor: 'bg-amber-400 text-stone-950 font-black' },
    { id: 'global-catalog', label: 'Global Catalog', icon: Package, badge: stats.totalGlobalProductsCount, badgeColor: 'bg-emerald-700 text-white' },
    { id: 'riders', label: 'Riders', icon: Bike, badge: stats.pendingRidersCount, badgeColor: 'bg-amber-400 text-stone-950 font-black' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: IndianRupee }
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          <div className="flex items-center gap-3">
            <UrGrozyLogo size="default" variant="white" animated={true} />
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                HQ Operations Hub
              </span>
              <span className="text-[11px] font-bold text-stone-300">
                Admin Command Suite
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'global-catalog' && activeTab === 'any-store-catalog');

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-950/40'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-none ${item.badgeColor || 'bg-emerald-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-800 hover:bg-rose-950/80 hover:text-rose-200 text-stone-300 text-xs font-bold transition-all border border-stone-700 hover:border-rose-800 cursor-pointer"
              title="Secure Admin Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}