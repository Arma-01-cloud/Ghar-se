import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import AcceptOrderModal from './AcceptOrderModal';
import RejectOrderModal from './RejectOrderModal';
import { 
  ShoppingBag, Clock, CheckCircle2, TrendingUp, AlertTriangle, 
  Store, Eye, ArrowRight, Sparkles, AlertOctagon, PackageCheck 
} from 'lucide-react';

export default function ShopkeeperDashboard() {
  const { 
    storeProfile, 
    orders, 
    pendingOrders, 
    preparingOrders, 
    readyOrders, 
    todayOrders, 
    totalSales, 
    avgOrderValue, 
    lowStockProducts, 
    setActiveShopkeeperTab,
    setSelectedOrderId 
  } = useShopkeeper();

  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
              Good evening, {storeProfile?.ownerName || 'Partner'}
            </h1>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Here's what's happening with <strong className="text-emerald-800 font-bold">{storeProfile?.name || 'Your Store'}</strong> today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${storeProfile?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{storeProfile?.isOpen ? '🟢 STORE OPEN' : '🔴 STORE CLOSED'}</span>
          </div>

          <button
            onClick={() => setActiveShopkeeperTab('orders')}
            className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>All Orders ({orders.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Today's Orders</span>
          <p className="font-display font-black text-2xl text-stone-900">{todayOrders}</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Pending</span>
          <p className="font-display font-black text-2xl text-amber-900">{pendingOrders.length}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Preparing</span>
          <p className="font-display font-black text-2xl text-blue-900">{preparingOrders.length}</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Ready</span>
          <p className="font-display font-black text-2xl text-emerald-900">{readyOrders.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Today's Sales</span>
          <p className="font-display font-black text-xl text-emerald-950">₹{totalSales}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Avg Order</span>
          <p className="font-display font-black text-xl text-stone-900">₹{avgOrderValue}</p>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Low Stock</span>
          <p className="font-display font-black text-2xl text-rose-900">{lowStockProducts.length}</p>
        </div>

      </div>

      {/* PENDING ORDERS AWAITING ACTION (MOST IMPORTANT SECTION) */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-md space-y-6">
        
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-stone-900">
                Orders Awaiting Action
              </h2>
              <p className="text-stone-500 text-xs mt-0.5">
                New incoming orders requiring immediate partner accept/reject decision
              </p>
            </div>
          </div>

          <span className="bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-xs">
            {pendingOrders.length} Pending
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-stone-50 rounded-2xl border border-stone-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-display font-extrabold text-base text-stone-900">You're all caught up!</h4>
            <p className="text-stone-500 text-xs">No new orders are waiting for your attention right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.map(order => {
              const isImageOrder = order.isDirectImageOrder || order.order_type === 'image' || order.items?.some(i => i.isDirectImageOrder || i.image_url);
              const imageUrl = order.image_url || order.items?.find(i => i.image_url)?.image_url || order.items?.[0]?.image;

              return (
                <div key={order.id} className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5 space-y-4 shadow-xs">
                  
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-base text-amber-950">ORDER #{order.id}</span>
                        {isImageOrder && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                            📸 Photo Order
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-semibold block mt-0.5">
                        Customer: <strong className="text-stone-800">{order.customerName}</strong> • {order.customerPhone || order.phone}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-lg text-emerald-950">
                        {order.total > 0 ? `₹${order.total}` : 'Pay on Delivery'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">{order.paymentStatus}</span>
                    </div>
                  </div>

                  {isImageOrder ? (
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-200">
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Grocery Photo"
                          className="w-14 h-14 object-cover rounded-lg border border-stone-200 bg-stone-100 shrink-0"
                        />
                      )}
                      <div className="space-y-1 text-xs text-stone-700 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-extrabold text-emerald-900">
                          <span>📸 Customer Grocery Photo</span>
                          <span className="text-stone-500 font-normal">({order.quantity || order.items?.length || 1} image)</span>
                        </div>
                        {order.note && (
                          <p className="text-[11px] text-stone-600 bg-amber-50 p-1.5 rounded-md border border-amber-200 line-clamp-2">
                            <strong>Note:</strong> {order.note}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-400 truncate">📍 {order.deliveryAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-stone-700">
                      <p className="font-semibold">📦 <strong>{order.items.length} Items:</strong> {order.items.map(i => i.name).join(', ')}</p>
                      <p className="text-stone-500">📍 {order.deliveryAddress}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setActiveShopkeeperTab('order-detail');
                      }}
                      className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 font-extrabold text-xs rounded-xl border border-stone-300 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> {isImageOrder ? 'View Photo' : 'View'}
                    </button>

                    <button
                      onClick={() => setRejectingOrder(order)}
                      className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" /> Reject
                    </button>

                    <button
                      onClick={() => setAcceptingOrder(order)}
                      className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* LOW STOCK ALERTS SECTION */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-display font-extrabold text-lg text-stone-900">
              Low Stock Alerts ({lowStockProducts.length})
            </h3>
          </div>

          <button
            onClick={() => setActiveShopkeeperTab('inventory')}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="text-xs text-stone-500 font-medium">Inventory looks good. All items above minimum threshold.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(prod => (
              <div key={prod.id} className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-extrabold text-stone-900">{prod.name}</h5>
                  <span className="text-rose-700 font-bold">Only {prod.stock} {prod.unit} remaining</span>
                </div>
                <button
                  onClick={() => setActiveShopkeeperTab('inventory')}
                  className="px-2.5 py-1 bg-white text-stone-800 font-bold rounded-lg border border-stone-200 text-[11px]"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {acceptingOrder && (
        <AcceptOrderModal
          order={acceptingOrder}
          onClose={() => setAcceptingOrder(null)}
        />
      )}

      {rejectingOrder && (
        <RejectOrderModal
          order={rejectingOrder}
          onClose={() => setRejectingOrder(null)}
        />
      )}

    </div>
  );
}