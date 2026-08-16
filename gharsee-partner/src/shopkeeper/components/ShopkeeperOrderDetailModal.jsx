import React from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { 
  X, CheckCircle2, MapPin, Phone, CreditCard, 
  Clock, ShieldCheck, ArrowLeft, Play, CheckCheck, Truck, AlertOctagon 
} from 'lucide-react';

export default function ShopkeeperOrderDetailModal() {
  const { orders, selectedOrderId, updateOrderStatus, acceptOrder, rejectOrder, setActiveShopkeeperTab } = useShopkeeper();

  const order = orders.find(o => o.id === selectedOrderId) || orders[0];

  if (!order) return null;

  const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'];

  const getShopkeeperStepIndex = (statusStr) => {
    const s = String(statusStr || 'pending').toLowerCase();
    if (s === 'pending' || s === 'order_placed') return 0;
    if (s === 'accepted' || s === 'confirmed') return 1;
    if (s === 'preparing' || s === 'packed') return 2;
    if (s === 'ready') return 3;
    if (s === 'picked_up' || s === 'out_for_delivery' || s === 'out for delivery') return 4;
    if (s === 'delivered' || s === 'completed') return 5;
    return 0;
  };

  const currentStepIndex = getShopkeeperStepIndex(order.status);
  const phoneDisplay = order.customerPhone || order.phone || 'Phone not provided';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* TOP BACK LINK */}
      <button
        onClick={() => setActiveShopkeeperTab('orders')}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders List
      </button>

      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-2xl text-stone-900">ORDER #{order.id}</span>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full uppercase">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-stone-500 text-xs mt-1">
              Received on {new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-stone-400 font-bold block uppercase">Grand Total</span>
            <span className="font-black text-2xl text-emerald-950">₹{order.total || order.totalAmount}</span>
          </div>
        </div>

        {/* WORKFLOW TIMELINE STEPPER */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">Order Fulfillment Status</h4>
          
          <div className="grid grid-cols-6 gap-1 text-center relative pt-1">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isDone ? 'bg-emerald-800 text-white shadow-xs' : 'bg-stone-200 text-stone-500'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold capitalize leading-tight ${isCurrent ? 'text-emerald-900 font-black underline' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOMER & DELIVERY INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <span className="font-extrabold uppercase tracking-wider text-stone-500 block">Customer Information</span>
            <h5 className="font-black text-stone-900 text-sm">{order.customerName}</h5>
            
            <div className="bg-emerald-100/80 border border-emerald-300 px-3 py-1.5 rounded-xl w-fit">
              <p className="text-emerald-950 font-black text-xs flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Customer Phone:</span>
                <strong className="text-emerald-900 font-display font-black text-sm">{phoneDisplay}</strong>
              </p>
            </div>
            
            {/* CALL & WHATSAPP BUTTONS */}
            {phoneDisplay !== 'Phone not provided' && (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                  className="py-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                >
                  📞 Call Customer
                </a>
                <a
                  href={`https://wa.me/${phoneDisplay.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3.5 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                >
                  💬 WhatsApp
                </a>
              </div>
            )}
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5">
            <span className="font-extrabold uppercase tracking-wider text-stone-500 block">Delivery Address Snapshot & Payment</span>
            <p className="text-stone-800 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {order.deliveryAddress || order.address}
            </p>
            <p className="text-emerald-700 font-extrabold flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> {order.paymentStatus || 'Paid'} ({order.deliveryType || 'Standard'})
            </p>
          </div>
        </div>

        {/* ITEMS BREAKDOWN TABLE */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">Order Items ({order.items?.length || 0})</h4>
          <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-semibold">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-stone-900">{item.name}</h5>
                    {(item.isManual || !item.id || (typeof item.id === 'string' && item.id.length < 20)) && (
                      <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-amber-300">
                        📝 Manual Item
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400">Quantity: {item.qty || item.quantity} {item.unit || 'unit'} • ₹{item.price} each</p>
                  
                  {/* REPLACEMENT PREFERENCE */}
                  <div className="text-[11px] font-bold text-stone-600 flex items-center gap-1 pt-0.5">
                    <span className="text-stone-400">If Unavailable:</span>
                    <span className={`px-2 py-0.5 rounded-md ${
                      item.replacementPreference === 'cancel_item' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {item.replacementPreference === 'cancel_item' ? '❌ Cancel Item' : '🔄 Replace with another brand'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-stone-500 mr-4 font-bold">{item.qty || item.quantity}x</span>
                  <span className="font-black text-stone-900 text-sm">₹{(item.price || 0) * (item.qty || item.quantity || 1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKFLOW ACTION BAR */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-medium">Status: <strong className="text-stone-900 capitalize">{order.status.replace(/_/g, ' ')}</strong></span>

          <div className="flex gap-2">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => rejectOrder(order.id, 'Item unavailable')}
                  className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs rounded-xl"
                >
                  REJECT ORDER
                </button>
                <button
                  onClick={() => acceptOrder(order.id)}
                  className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md"
                >
                  ACCEPT ORDER
                </button>
              </>
            )}

            {order.status === 'accepted' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'preparing')}
                className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" /> Start Preparing Order
              </button>
            )}

            {order.status === 'preparing' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'ready')}
                className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 uppercase tracking-wider"
              >
                <CheckCheck className="w-4 h-4" /> [ READY ] (Send to Rider)
              </button>
            )}

            {order.status === 'ready' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                className="py-2.5 px-5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" /> Handover to Delivery Rider
              </button>
            )}

            {order.status === 'out_for_delivery' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'completed')}
                className="py-2.5 px-5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Mark Delivered & Completed
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
