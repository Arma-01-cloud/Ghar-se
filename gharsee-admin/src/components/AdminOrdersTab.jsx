import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  ShoppingBag, Search, Store, User, Phone, MapPin, 
  IndianRupee, Clock, Package
} from 'lucide-react';

export default function AdminOrdersTab() {
  const { orders, updateOrderStatus } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      String(o.id || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q) ||
      (o.storeName || '').toLowerCase().includes(q) ||
      (o.deliveryAddress || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-900 border-amber-300',
    accepted: 'bg-blue-100 text-blue-900 border-blue-300',
    preparing: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    ready: 'bg-purple-100 text-purple-900 border-purple-300',
    out_for_delivery: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    rejected: 'bg-rose-100 text-rose-900 border-rose-300'
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-800" />
              <span>Global Live Order Flow ({orders.length})</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Real-time multi-store orders across the UR GROZY darkstore network.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black">
              ₹{orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString()} Total GMV
            </span>
          </div>
        </div>

        {/* SEARCH & STATUS CHIPS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'pending', 'preparing', 'ready', 'out_for_delivery', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {st === 'all' ? `All (${orders.length})` : st.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2 shadow-sm">
          <Package className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No Orders Found</p>
          <p className="text-xs text-stone-500">Orders placed by customers will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
            >
              {/* ORDER HEADER */}
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-stone-900 text-sm">
                      #{String(order.id).slice(-8).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-700'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1 font-medium">
                    <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold text-stone-800">{order.storeName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-display text-lg font-black text-emerald-800 block">
                    ₹{order.totalAmount}
                  </span>
                  <span className="text-[10px] text-stone-400 font-semibold">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>

              {/* CUSTOMER & DELIVERY INFO */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-2 text-stone-700">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Customer:</span>
                  </span>
                  <span className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{order.customerName}</span>
                    <span className="text-stone-400 font-normal">({order.customerPhone})</span>
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-stone-500 font-medium flex items-center gap-1 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Deliver To:</span>
                  </span>
                  <span className="text-right text-stone-800 font-medium truncate">
                    {order.deliveryAddress}
                  </span>
                </div>
              </div>

              {/* ITEMS PREVIEW */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                    Items ({order.items.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded-lg border border-stone-200"
                      >
                        {item.name || item.itemName} (Quantity: {item.quantity || item.qty || 1}, Weight: {item.unit || '1 unit'})
                      </span>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-[11px] font-bold text-stone-400 px-1 py-0.5">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="bg-stone-50 border border-stone-300 text-stone-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="out_for_delivery">Out For Delivery</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}