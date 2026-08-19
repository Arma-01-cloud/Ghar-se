import React from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { CheckCircle2, X, ShoppingBag } from 'lucide-react';

export default function AcceptOrderModal({ order, onClose }) {
  const { acceptOrder } = useShopkeeper();

  if (!order) return null;

  const handleConfirm = () => {
    acceptOrder(order.id);
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

        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-display font-black text-xl text-stone-900">
            Accept Order #{order.id}?
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm">
            Customer: <strong className="text-stone-900 font-bold">{order.customerName}</strong> ({order.items.length} items • ₹{order.total})
          </p>
        </div>

        {/* ITEMS PREVIEW OR GROCERY PHOTO */}
        {order.isDirectImageOrder || order.order_type === 'image' || order.items?.some(i => i.isDirectImageOrder || i.image_url) ? (
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs">
            {(order.image_url || order.items?.[0]?.image_url || order.items?.[0]?.image) && (
              <img
                src={order.image_url || order.items?.[0]?.image_url || order.items?.[0]?.image}
                alt="Grocery List"
                className="w-14 h-14 object-cover rounded-xl border border-emerald-400 bg-white shrink-0"
              />
            )}
            <div className="space-y-1 flex-1">
              <span className="font-extrabold text-emerald-950 block">📸 Customer Grocery Image Order</span>
              <p className="text-[11px] text-stone-600">Quantity: <strong className="text-stone-800">{order.quantity || order.items?.length || 1} image</strong></p>
              {order.note && (
                <p className="text-[11px] text-stone-700 bg-white/80 p-1.5 rounded-lg border border-amber-200">
                  <strong>Note:</strong> {order.note}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 max-h-36 overflow-y-auto space-y-1 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between font-semibold items-center">
                <span className="text-stone-700">
                  {item.name} <span className="text-stone-500 font-normal text-[11px]">(Quantity: {item.qty || item.quantity || 1}, Weight: {item.unit || '1 unit'})</span>
                </span>
                <span className="text-stone-900 font-bold shrink-0 ml-2">₹{(item.price || 0) * (item.qty || item.quantity || 1)}</span>
              </div>
            ))}
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
            type="button"
            onClick={handleConfirm}
            className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
          >
            ACCEPT ORDER
          </button>
        </div>
      </div>
    </div>
  );
}