import React, { useState, useMemo } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import AcceptOrderModal from './AcceptOrderModal';
import RejectOrderModal from './RejectOrderModal';
import { 
  ShoppingBag, Search, SlidersHorizontal, Eye, CheckCircle2, 
  AlertOctagon, Clock, ArrowRight, Play, CheckCheck, Truck, ShieldCheck, Phone 
} from 'lucide-react';

export default function ShopkeeperOrdersPage() {
  const { orders, updateOrderStatus, setActiveShopkeeperTab, setSelectedOrderId } = useShopkeeper();
  
  const [activeStatusTab, setActiveStatusTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);

  const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT FOR DELIVERY', 'COMPLETED', 'REJECTED'];

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Tab filter
      if (activeStatusTab !== 'ALL') {
        const target = activeStatusTab.toLowerCase().replace(/\s+/g, '_');
        if (o.status !== target) return false;
      }

      // Search filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(o.id || '').toLowerCase().includes(q);
        const matchCustomer = (o.customerName || '').toLowerCase().includes(q);
        const matchAddress = (o.deliveryAddress || o.address || '').toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || o.phone || '').includes(q);
        if (!matchId && !matchCustomer && !matchAddress && !matchPhone) return false;
      }

      return true;
    });
  }, [orders, activeStatusTab, searchQuery]);

  const renderWorkflowButton = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => setRejectingOrder(order)}
              className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs rounded-xl"
            >
              REJECT
            </button>
            <button
              onClick={() => setAcceptingOrder(order)}
              className="py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              ACCEPT
            </button>
          </div>
        );
      case 'accepted':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'preparing')}
            className="py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs"
          >
            <Play className="w-3.5 h-3.5" /> Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md uppercase tracking-wider"
          >
            <CheckCheck className="w-4 h-4" /> [ READY ] (Send to Rider)
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
            className="py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" /> Handover to Delivery
          </button>
        );
      case 'out_for_delivery':
        return (
          <button
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="py-2 px-3 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark Completed
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>STORE ORDERS MANAGEMENT</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Order Fulfillment Pipeline
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage incoming grocery orders and update fulfillment status in real-time
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative md:w-80">
          <input
            type="text"
            placeholder="Search by Order #, Customer or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-600 font-semibold"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {TABS.map(tab => {
          const isActive = activeStatusTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveStatusTab(tab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all snap-start ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ORDERS LIST CARDS */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-stone-900">No orders found</h3>
          <p className="text-stone-500 text-xs mt-1">No orders match the selected filter tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isPending = order.status === 'pending';
            const isRejected = order.status === 'rejected';
            const isCompleted = order.status === 'completed';

            const phoneDisplay = order.customerPhone || order.phone || '+91 98765 43210';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 space-y-4 shadow-xs transition-all ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-stone-200 hover:border-emerald-300'
                }`}
              >
                {/* TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-black text-lg text-stone-900">ORDER #{order.id}</span>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase ${
                      isPending ? 'bg-amber-100 text-amber-900 animate-pulse' :
                      isRejected ? 'bg-rose-100 text-rose-800' :
                      isCompleted ? 'bg-emerald-100 text-emerald-800' :
                      'bg-blue-100 text-blue-900'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-stone-400 font-semibold">
                    Received: {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* DETAILS SNAPSHOT */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center text-xs">
                  
                  {/* PROMINENT CUSTOMER PHONE & CONTACT INFO */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">Customer Contact Info</span>
                    <p className="font-extrabold text-stone-900 text-sm">{order.customerName}</p>
                    
                    <div className="bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-xl w-fit">
                      <span className="font-black text-emerald-950 text-xs flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-stone-600">Phone:</span>
                        <strong className="text-emerald-900 font-display font-black text-sm">{phoneDisplay}</strong>
                      </span>
                    </div>
                    
                    {/* CALL & WHATSAPP BUTTONS */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                        className="py-1 px-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                      >
                        📞 Call Customer
                      </a>
                      <a
                        href={`https://wa.me/${phoneDisplay.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* ORDER CONTENTS OR GROCERY IMAGE DETAILS */}
                  {order.isDirectImageOrder || order.order_type === 'image' || order.items?.some(i => i.isDirectImageOrder || i.image_url) ? (
                    <div className="sm:col-span-5 flex items-start gap-3">
                      {(order.image_url || order.items?.[0]?.image_url || order.items?.[0]?.image) && (
                        <img
                          src={order.image_url || order.items?.[0]?.image_url || order.items?.[0]?.image}
                          alt="Grocery Photo"
                          className="w-14 h-14 object-cover rounded-xl border-2 border-emerald-500 bg-stone-100 shrink-0"
                        />
                      )}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                            📸 Grocery Image Order
                          </span>
                          <span className="text-[11px] text-stone-500 font-bold">Qty: {order.quantity || 1}</span>
                        </div>
                        {order.note && (
                          <p className="text-[11px] text-stone-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md line-clamp-1 mt-1">
                            <strong>Note:</strong> {order.note}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">📍 {order.deliveryAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="sm:col-span-5">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Order Contents ({order.items.length} items)</span>
                      <p className="font-semibold text-stone-800 line-clamp-1">
                        {order.items.map(i => `${i.name} (Quantity: ${i.qty || i.quantity || 1}, Weight: ${i.unit || '1 unit'})`).join(', ')}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">{order.deliveryAddress}</p>
                    </div>
                  )}

                  <div className="sm:col-span-3 text-right">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Amount</span>
                    <span className="font-black text-xl text-emerald-950">
                      {order.total > 0 ? `₹${order.total}` : 'Pay on Delivery'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 block">{order.paymentStatus}</span>
                  </div>
                </div>

                {/* REJECTION REASON IF REJECTED */}
                {isRejected && order.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
                    Rejection Reason: {order.rejectionReason}
                  </div>
                )}

                {/* BOTTOM ACTIONS */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setActiveShopkeeperTab('order-detail');
                    }}
                    className="py-2 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  <div>{renderWorkflowButton(order)}</div>
                </div>

              </div>
            );
          })}
        </div>
      )}

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