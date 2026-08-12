import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import OrderDetailModal from './OrderDetailModal';
import { Clock, Package, CheckCircle2, Truck, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

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
          onClick={() => setActiveTab('stores')}
          className="py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all"
        >
          BROWSE LOCAL STORES
        </button>
      </div>
    );
  }

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || 'pending').toLowerCase();
    
    if (s === 'delivered' || s === 'completed') {
      return (
        <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>ORDER DELIVERED</span>
        </span>
      );
    }

    if (s === 'rejected') {
      return (
        <span className="bg-rose-100 text-rose-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
          <span>REJECTED</span>
        </span>
      );
    }

    if (s === 'out_for_delivery' || s === 'picked_up') {
      return (
        <span className="bg-purple-100 text-purple-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-300 animate-pulse">
          <Truck className="w-3.5 h-3.5 text-purple-700" />
          <span>OUT FOR DELIVERY</span>
        </span>
      );
    }

    if (s === 'ready') {
      return (
        <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-400">
          <Package className="w-3.5 h-3.5 text-emerald-700" />
          <span>ORDER READY FOR RIDER</span>
        </span>
      );
    }

    if (s === 'preparing') {
      return (
        <span className="bg-blue-100 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-300 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 text-blue-700 animate-spin" />
          <span>STORE IS PREPARING</span>
        </span>
      );
    }

    if (s === 'accepted') {
      return (
        <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
          <span>ACCEPTED BY STORE</span>
        </span>
      );
    }

    return (
      <span className="bg-amber-100 text-amber-950 font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-300 animate-pulse">
        <Clock className="w-3.5 h-3.5 text-amber-700" />
        <span>PENDING STORE ACCEPTANCE</span>
      </span>
    );
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      <div className="border-b border-stone-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-stone-900">Your Express Orders</h1>
            <p className="text-stone-500 text-sm mt-0.5">Real-time live order tracking synced with Supabase marketplace</p>
          </div>
          <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-xl">
            {orders.length} Active Orders
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer space-y-4"
          >
            
            {/* TOP LINE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-base text-stone-900">
                  ORDER #{order.id}
                </span>
                {renderStatusBadge(order.status)}
              </div>

              <span className="text-xs text-stone-400 font-semibold">
                Placed: {new Date(order.date || order.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* ITEMS SNAPSHOT */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 overflow-hidden">
                  {order.items?.slice(0, 3).map((item, i) => (
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
                    {order.storeName || 'Local Grocery Store'}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    {order.items?.length || 1} items total • {order.address || 'Chikkamagaluru'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[11px] text-stone-400 block font-semibold">Total Paid</span>
                  <span className="font-black text-lg text-emerald-950">₹{order.totalAmount || order.total}</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        ))}
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
