import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { Settings, ShieldCheck, Bell, Navigation, HelpCircle, LogOut } from 'lucide-react';

export default function RiderSettingsPage() {
  const { profile, logoutRider, addRiderToast } = useRider();
  const [autoNavigate, setAutoNavigate] = useState(true);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    addRiderToast('Rider preferences saved successfully!', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>APP PREFERENCES</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
          Partner Settings & Support
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Configure navigation defaults, alert preferences, and contact emergency support
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* NAVIGATION PREFERENCES */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Navigation className="w-5 h-5 text-emerald-700" /> Navigation App Preference
          </h3>

          <div className="space-y-3 text-xs font-semibold">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer">
              <div>
                <span className="font-extrabold text-stone-900 text-sm block">Auto-Open Google Maps</span>
                <p className="text-xs text-stone-500">Automatically open navigation maps when accepting a new order</p>
              </div>
              <input
                type="checkbox"
                checked={autoNavigate}
                onChange={() => setAutoNavigate(!autoNavigate)}
                className="w-5 h-5 text-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* HELP & SUPPORT */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-display font-extrabold text-lg text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <HelpCircle className="w-5 h-5 text-emerald-700" /> Help & Emergency Support
          </h3>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
            <h5 className="font-extrabold text-amber-950 text-sm">Need immediate delivery assistance?</h5>
            <p className="text-amber-900">Call Partner Helpline: <strong>+91 (080) 4920 8899</strong> (Available 24x7 during deliveries)</p>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={logoutRider}
            className="py-3 px-6 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT FROM RIDER APP</span>
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