import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Store, Bike, Users, IndianRupee, 
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, ShieldCheck, 
  MapPin, Phone
} from 'lucide-react';

export default function AdminOverviewTab() {
  const { 
    stats, 
    shops, 
    riders, 
    setActiveTab, 
    approveShop, 
    rejectShop, 
    approveRider, 
    rejectRider 
  } = useAdmin();

  const pendingShops = shops.filter(s => s.isPending);
  const pendingRiders = riders.filter(r => r.isPending);

  return (
    <div className="space-y-8">
      
      {/* WELCOME BANNER & ACTION CALLOUT */}
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* BACKGROUND GLOW ACCENTS */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>GharSee Master Control</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
              Network Operations Overview
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Review and approve pending darkstore registrations and rider onboarding requests before they go live on customer marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {stats.pendingShopsCount > 0 && (
              <button
                onClick={() => setActiveTab('shops')}
                className="py-3 px-4.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{stats.pendingShopsCount} Store(s) Awaiting Review</span>
              </button>
            )}

            {stats.pendingRidersCount > 0 && (
              <button
                onClick={() => setActiveTab('riders')}
                className="py-3 px-4.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Bike className="w-4 h-4" />
                <span>{stats.pendingRidersCount} Rider(s) Awaiting Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* PENDING SHOPS */}
        <div 
          onClick={() => setActiveTab('shops')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            stats.pendingShopsCount > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/80 shadow-xs'
              : 'bg-white border-stone-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Pending Stores
            </span>
            <Store className={`w-4 h-4 ${stats.pendingShopsCount > 0 ? 'text-amber-700' : 'text-stone-400'}`} />
          </div>
          <p className="font-display text-3xl font-black text-stone-900 mt-2">
            {stats.pendingShopsCount}
          </p>
          <p className="text-[11px] text-amber-700 font-bold mt-1">
            {stats.pendingShopsCount > 0 ? 'Action required' : 'Queue cleared'}
          </p>
        </div>

        {/* ACTIVE SHOPS */}
        <div 
          onClick={() => setActiveTab('shops')}
          className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Active Stores
            </span>
            <Store className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-3xl font-black text-stone-900 mt-2">
            {stats.approvedShopsCount}
          </p>
          <p className="text-[11px] text-stone-500 font-semibold mt-1">
            {stats.totalShopsCount} total registered
          </p>
        </div>

        {/* PENDING RIDERS */}
        <div 
          onClick={() => setActiveTab('riders')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            stats.pendingRidersCount > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/80 shadow-xs'
              : 'bg-white border-stone-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Pending Riders
            </span>
            <Bike className={`w-4 h-4 ${stats.pendingRidersCount > 0 ? 'text-amber-700' : 'text-stone-400'}`} />
          </div>
          <p className="font-display text-3xl font-black text-stone-900 mt-2">
            {stats.pendingRidersCount}
          </p>
          <p className="text-[11px] text-amber-700 font-bold mt-1">
            {stats.pendingRidersCount > 0 ? 'Awaiting verify' : 'Zero queue'}
          </p>
        </div>

        {/* ACTIVE RIDERS */}
        <div 
          onClick={() => setActiveTab('riders')}
          className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Active Riders
            </span>
            <Bike className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-3xl font-black text-stone-900 mt-2">
            {stats.activeRidersCount}
          </p>
          <p className="text-[11px] text-stone-500 font-semibold mt-1">
            Fleet partners
          </p>
        </div>

        {/* CUSTOMERS */}
        <div 
          onClick={() => setActiveTab('customers')}
          className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Customers
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="font-display text-3xl font-black text-stone-900 mt-2">
            {stats.totalCustomersCount}
          </p>
          <p className="text-[11px] text-stone-500 font-semibold mt-1">
            Registered accounts
          </p>
        </div>

        {/* ORDERS & GMV */}
        <div 
          onClick={() => setActiveTab('orders')}
          className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Network GMV
            </span>
            <IndianRupee className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-3xl font-black text-emerald-800 mt-2">
            ₹{stats.totalGmvRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-500 font-semibold mt-1">
            {stats.totalOrdersCount} orders placed
          </p>
        </div>

      </div>

      {/* PENDING APPROVALS QUEUE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PENDING SHOPS QUEUE */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="font-display font-black text-lg text-stone-900">
                Pending Store Registrations ({pendingShops.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('shops')}
              className="text-xs font-extrabold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingShops.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
              <p className="text-sm font-bold text-stone-800">All Store Registrations are Reviewed</p>
              <p className="text-xs text-stone-500">When new shops sign up, they will appear here for admin approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingShops.slice(0, 3).map((shop) => (
                <div 
                  key={shop.id}
                  className="bg-stone-50 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={shop.imageUrl}
                      alt={shop.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0"
                      onError={(e) => { e.target.src = '/images/store_lakshmi.jpg'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-stone-900 text-sm truncate">{shop.name}</h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          PENDING REVIEW
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{shop.locality}, {shop.city} ({shop.pincode})</span>
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{shop.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => rejectShop(shop.id, shop.name)}
                      className="py-2 px-3.5 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => approveShop(shop.id, shop.name)}
                      className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Store & Activate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING RIDERS QUEUE */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Bike className="w-4 h-4" />
              </div>
              <h3 className="font-display font-black text-lg text-stone-900">
                Pending Rider Applications ({pendingRiders.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('riders')}
              className="text-xs font-extrabold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingRiders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
              <p className="text-sm font-bold text-stone-800">All Delivery Riders are Verified</p>
              <p className="text-xs text-stone-500">When new riders register, they will queue here for admin approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRiders.slice(0, 3).map((rider) => (
                <div 
                  key={rider.id}
                  className="bg-stone-50 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-stone-900 text-sm truncate">{rider.fullName}</h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          PENDING
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Vehicle: <strong className="text-stone-900 uppercase font-bold">{rider.vehicleType} • {rider.vehicleNumber}</strong>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        DL: {rider.drivingLicense} • City: {rider.deliveryCity}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-stone-800 bg-white border border-stone-200 px-2.5 py-1 rounded-xl shrink-0">
                      {rider.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => rejectRider(rider.id, rider.fullName)}
                      className="py-2 px-3.5 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => approveRider(rider.id, rider.fullName)}
                      className="py-2 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Verify Rider</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
