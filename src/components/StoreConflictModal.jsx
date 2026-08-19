import React from 'react';
import { useCart } from '../context/CartContext';
import { Store, AlertTriangle, X } from 'lucide-react';

export default function StoreConflictModal() {
  const { currentStore, storeConflictModal, setStoreConflictModal, confirmSwitchStore } = useCart();

  if (!storeConflictModal) return null;

  const targetStore = storeConflictModal.targetStore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setStoreConflictModal(null)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-display font-black text-xl text-stone-900">
            Switch Grocery Store?
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            You are currently shopping from <strong className="text-emerald-800 font-bold">{currentStore?.name || 'Sri Lakshmi Stores'}</strong>.
          </p>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            The item you are adding is from <strong className="text-amber-800 font-bold">{targetStore?.name || 'New Store'}</strong>.
          </p>
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            ⚠️ Switching stores will clear your current cart.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStoreConflictModal(null)}
            className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl transition-colors"
          >
            KEEP CURRENT
          </button>

          <button
            type="button"
            onClick={() => confirmSwitchStore(storeConflictModal.targetStore, storeConflictModal.pendingItem)}
            className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
          >
            SWITCH STORE
          </button>
        </div>
      </div>
    </div>
  );
}