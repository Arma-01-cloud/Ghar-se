import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { AlertOctagon, X } from 'lucide-react';

export default function RejectOrderModal({ order, onClose }) {
  const { rejectOrder } = useShopkeeper();
  const [selectedReason, setSelectedReason] = useState('Item unavailable');
  const [customReason, setCustomReason] = useState('');

  if (!order) return null;

  const REASON_OPTIONS = [
    'Item unavailable',
    'Store is too busy',
    'Delivery issue',
    'Store closing soon',
    'Incorrect order',
    'Other'
  ];

  const handleConfirmReject = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? (customReason.trim() || 'Other reason') : selectedReason;
    rejectOrder(order.id, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-display font-black text-xl text-stone-900">
            Reject Order #{order.id}
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm">
            Please select a reason for rejecting this order.
          </p>
        </div>

        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {REASON_OPTIONS.map(opt => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                  selectedReason === opt ? 'bg-rose-50 border-rose-400 text-rose-950' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selectedReason === opt}
                  onChange={() => setSelectedReason(opt)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Specify Reason</label>
              <input
                type="text"
                required
                placeholder="Enter rejection reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-600"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl transition-colors"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
            >
              REJECT ORDER
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
