import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { Settings, ShieldCheck, Bell, CreditCard, Lock, LogOut } from 'lucide-react';

export default function ShopkeeperSettingsPage() {
  const { storeProfile, logoutShopkeeper, addShopkeeperToast } = useShopkeeper();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    addShopkeeperToast('Settings saved successfully!', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>PORTAL CONFIGURATION</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
          Partner Settings & Security
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage store notifications, account security, and payment settlement accounts
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* ACCOUNT PREFERENCES */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700" /> Account & Business
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Partner Email</label>
              <input
                type="email"
                defaultValue={storeProfile?.email || ''}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Registered Phone</label>
              <input
                type="text"
                defaultValue={storeProfile?.phone || ''}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS SETTINGS */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Bell className="w-5 h-5 text-emerald-700" /> Order Alert Notifications
          </h3>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer">
            <div>
              <span className="font-extrabold text-stone-900 text-sm block">Sound & Push Alerts for New Orders</span>
              <p className="text-xs text-stone-500">Play instant audio alert when customer places a new grocery order</p>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="w-5 h-5 text-emerald-600 rounded"
            />
          </label>
        </div>

        {/* PAYMENT SETTLEMENT */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-700" /> Bank & Settlement Account
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 font-bold mb-1">Bank Name</label>
              <input
                type="text"
                defaultValue="HDFC Bank"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold mb-1">Account Number / UPI ID</label>
              <input
                type="text"
                defaultValue="srilakshmi@hdfcbank"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={logoutShopkeeper}
            className="py-3 px-6 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT FROM PORTAL</span>
          </button>

          <button
            type="submit"
            className="py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
          >
            SAVE PREFERENCES
          </button>
        </div>

      </form>

    </div>
  );
}
