import React, { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { AlertOctagon, X } from 'lucide-react';

export default function DeclineReasonModal({ deliveryId, onClose }) {
  const { declineDelivery } = useRider();
  const [selectedReason, setSelectedReason] = useState('Too far');
  const [customReason, setCustomReason] = useState('');

  const REASONS = [
    'Too far',
    'Currently busy',
    'Vehicle issue',
    'Personal reason',
    'Other'
  ];

  const handleConfirmDecline = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? (customReason.trim() || 'Other reason') : selectedReason;
    declineDelivery(deliveryId, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 border border-stone-200"
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
            Decline Delivery Request?
          </h3>
          <p className="text-stone-500 text-xs">
            Select a reason for declining Order #{deliveryId}
          </p>
        </div>

        <form onSubmit={handleConfirmDecline} className="space-y-4">
          <div className="space-y-2">
            {REASONS.map(opt => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                  selectedReason === opt ? 'bg-rose-50 border-rose-400 text-rose-950' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <input
                  type="radio"
                  name="declineReason"
                  checked={selectedReason === opt}
                  onChange={() => setSelectedReason(opt)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <input
              type="text"
              required
              placeholder="Enter reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-600"
            />
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              DECLINE
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}