import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { Bell, Store, LogOut, Menu } from 'lucide-react';

export default function ShopkeeperNavbar({ onToggleMobileSidebar }) {
  const { storeProfile, toggleStoreStatus, notifications, logoutShopkeeper } = useShopkeeper();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      
      {/* LEFT: MOBILE TOGGLE & STORE NAME */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          {storeProfile?.image || storeProfile?.image_url ? (
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs shrink-0">
              <img
                src={storeProfile.image || storeProfile.image_url}
                alt={storeProfile.name || 'Store'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Store className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-base sm:text-lg text-stone-900 leading-tight">
                {storeProfile?.name || 'My Grocery Store'}
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
                PARTNER PORTAL
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-semibold">{storeProfile?.ownerName || 'Store Owner'} • {storeProfile?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* RIGHT: STORE OPEN/CLOSED TOGGLE & NOTIFICATIONS */}
      <div className="flex items-center gap-3">
        
        {/* STORE STATUS TOGGLE BUTTON */}
        <button
          type="button"
          onClick={toggleStoreStatus}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-extrabold text-xs transition-all shadow-xs ${
            storeProfile.isOpen
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
          }`}
          title="Click to toggle store opening status"
        >
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${storeProfile.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="hidden sm:inline">
            {storeProfile.isOpen ? '🟢 STORE OPEN' : '🔴 STORE CLOSED'}
          </span>
          <span className="sm:hidden">
            {storeProfile.isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </button>

        {/* NOTIFICATIONS BELL */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-2xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATIONS DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-display font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                  Store Alerts & Notifications
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  {notifications.length} alerts
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-stone-900">{n.title}</span>
                      <span className="text-[10px] text-stone-400 font-semibold">{n.time}</span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium leading-tight">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logoutShopkeeper}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs transition-colors"
          title="Log out of Shopkeeper Partner Portal"
        >
          <LogOut className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>

    </header>
  );
}
