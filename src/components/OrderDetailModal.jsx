import React from 'react';
import { X, CheckCircle2, Clock, MapPin, CreditCard, ShieldCheck, Package, Truck, AlertCircle } from 'lucide-react';

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const STATUS_STEPS = ['Order Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

  const getStepIndex = (statusStr) => {
    const s = String(statusStr || 'pending').toLowerCase();
    if (s === 'pending' || s === 'order placed' || s === 'order_placed') return 0;
    if (s === 'accepted' || s === 'confirmed' || s === 'approved') return 1;
    if (s === 'preparing' || s === 'packed' || s === 'ready') return 2;
    if (s === 'picked_up' || s === 'out_for_delivery' || s === 'out for delivery' || s === 'dispatched') return 3;
    if (s === 'delivered' || s === 'completed') return 4;
    if (s === 'rejected' || s === 'cancelled') return -1;
    return 0;
  };

  const currentStepIndex = getStepIndex(order.status);
  const isRejected = currentStepIndex === -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="border-b border-stone-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                ORDER #{order.id}
              </span>
              <h2 className="font-display text-2xl font-extrabold text-stone-900 mt-2">
                Order Tracking & Details
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-400 block font-medium">Placed On</span>
              <span className="text-xs font-bold text-stone-800">
                {new Date(order.date || order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS TRACKER TIMELINE */}
        {isRejected ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-extrabold block text-rose-900 text-sm">Order Cancelled or Rejected</span>
              <span>This order was cancelled by the store or customer. Please contact store for assistance.</span>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">Delivery Status Timeline</h4>
              <span className="text-xs font-black text-emerald-800 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-md">
                Status: {order.status?.replace(/_/g, ' ') || 'Pending'}
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-1 relative pt-2">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center text-center space-y-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors ${
                      isCompleted ? 'bg-emerald-700 text-white shadow-md' : 'bg-stone-200 text-stone-500'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold leading-tight ${isCurrent ? 'text-emerald-800 font-black underline' : isCompleted ? 'text-stone-800' : 'text-stone-400'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ITEMS LIST */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">Grocery Items ({order.items?.length || 0})</h4>
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-3 bg-white space-y-2">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 first:pt-0">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url || item.image || '/images/cat_veg_fruits.jpg'}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl bg-stone-100 border border-stone-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-xs text-stone-900">{item.name}</h5>
                      {(item.isDirectImageOrder || item.image_url) && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          📸 Photo Order
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Quantity: <strong className="text-stone-700 font-bold">{item.quantity || item.qty || 1}</strong> • Weight: <strong className="text-stone-700 font-bold">{item.unit || '1 unit'}</strong>
                    </p>
                    {item.note && (
                      <p className="text-[11px] text-stone-600 font-medium italic">Note: "{item.note}"</p>
                    )}
                    {item.image_url && (
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:underline inline-block mt-0.5"
                      >
                        🔍 View Full Image
                      </a>
                    )}
                  </div>
                </div>
                <span className="font-extrabold text-sm text-stone-900">
                  {item.price ? `₹${item.price * (item.quantity || item.qty || 1)}` : 'Pay After Inspection'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ADDRESS & PAYMENT SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-600 block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Delivery Address
            </span>
            <p className="text-stone-800 font-medium leading-relaxed">{order.address || order.deliveryAddress}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-600 block flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" /> Payment & Total
            </span>
            <p className="text-stone-800 font-semibold">{order.paymentMethod || 'Cash on Delivery'}</p>
            <p className="text-emerald-950 font-black text-lg pt-1">Total Paid: ₹{order.totalAmount || order.total}</p>
          </div>
        </div>

      </div>
    </div>
  );
}