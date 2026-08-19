import React from 'react';
import { useRider } from '../context/RiderContext';
import { 
  LayoutDashboard, Bike, DollarSign, History, 
  User, Settings, LogOut, Leaf 
} from 'lucide-react';

export default function RiderSidebar() {
  const { activeRiderTab, setActiveRiderTab, logoutRider } = useRider();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Deliveries', icon: Bike },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30 shadow-xl bg-[#08241B] text-white p-4">
      <div className="h-full flex flex-col justify-between">
        
        <div className="space-y-6">
          {/* LOGO */}
          <div className="flex flex-col items-start px-2 pt-2 cursor-pointer" onClick={() => setActiveRiderTab('dashboard')}>
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider block mt-1">
              Delivery Partner
            </span>
          </div>

          {/* NAV LINKS */}
          <nav className="space-y-1 pt-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeRiderTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveRiderTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md font-extrabold'
                      : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="pt-6 border-t border-emerald-900/60 space-y-2">
          <button
            onClick={logoutRider}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </aside>
  );
}