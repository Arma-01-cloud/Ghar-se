import React from 'react';
import { useRider } from '../context/RiderContext';
import { LayoutDashboard, Bike, DollarSign, History, User } from 'lucide-react';

export default function RiderBottomNav() {
  const { activeRiderTab, setActiveRiderTab } = useRider();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Deliveries', icon: Bike },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeRiderTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveRiderTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-emerald-700 font-extrabold scale-105' : 'text-stone-500 font-medium'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
