import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import OrderDetailModal from './OrderDetailModal';
import { Clock, Package, CheckCircle2, Truck, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const { orders, setActiveTab } = useCart();
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!orders || orders.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="font-display text-2xl font-extrabold text-stone-900">
          You haven't placed any orders yet.
        </h2>
        <p className="text-stone-500 text-sm">
          Browse our fresh catalog or upload your handwritten grocery shopping list to place your first express order.
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
        >
          SHOP GROCERIES
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-display text-3xl font-extrabold text-stone-900">Your Orders</h1>
        <p className="text-stone-500 text-sm mt-0.5">Track active express deliveries and view past order invoices</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const isDelivered = order.status === 'Delivered';
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer space-y-4"
            >
              
              {/* TOP LINE */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-display font-extrabold text-base text-stone-900">
                    ORDER #{order.id}
                  </span>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isDelivered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900 animate-pulse'
                  }`}>
                    {isDelivered ? <CheckCircle2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                    {order.status}
                  </span>
                </div>

                <span className="text-xs text-stone-400 font-semibold">
                  Placed: {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* ITEMS SNAPSHOT */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items.slice(0, 3).map((item, i) => (
                      <img
                        key={i}
                        src={item.image || '/images/cat_veg_fruits.jpg'}
                        alt=""
                        className="inline-block h-10 w-10 rounded-xl ring-2 ring-white object-cover bg-stone-100"
                      />
                    ))}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900">
                      {order.items.map(i => i.name).slice(0, 2).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </h4>
                    <p className="text-[11px] text-stone-500">{order.items.length} items total</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[11px] text-stone-400 block font-semibold">Amount Paid</span>
                    <span className="font-black text-lg text-emerald-950">₹{order.totalAmount}</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

    </div>
  );
}
