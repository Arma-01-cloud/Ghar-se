import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Store, Bike, Users, IndianRupee, Package,
  AlertTriangle, ShieldCheck
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>UR GROZY Master Control</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
              Network Operations Overview
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Review and approve pending darkstore registrations, manage the centralized global grocery catalog, and monitor order pipelines.
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

            <button
              onClick={() => setActiveTab('global-catalog')}
              className="py-3 px-4.5 bg-emerald-950/80 hover:bg-emerald-950 text-emerald-200 border border-emerald-700/60 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Manage Global Catalog</span>
            </button>
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

        {/* GLOBAL CATALOG */}
        <div 
          onClick={() => setActiveTab('global-catalog')}
          className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Global Catalog
            </span>
            <Package className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-3xl font-black text-emerald-800 mt-2">
            {stats.totalGlobalProductsCount}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Universal products
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
            {stats.pendingRidersCount > 0 ? `${stats.pendingRidersCount} pending` : 'Fleet online'}
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
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-600" />
              <h3 className="font-display font-black text-lg text-stone-900">
                Pending Store Registrations ({pendingShops.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('shops')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              View All Stores →
            </button>
          </div>

          {pendingShops.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs font-bold">
              ✓ All store registrations have been reviewed and approved.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingShops.slice(0, 4).map(shop => (
                <div key={shop.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-black text-sm text-stone-900">{shop.name}</h5>
                    <p className="text-xs text-stone-500">{shop.locality || shop.city} • {shop.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => approveShop(shop.id, shop.name)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectShop(shop.id, shop.name)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING RIDERS QUEUE */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Bike className="w-5 h-5 text-amber-600" />
              <h3 className="font-display font-black text-lg text-stone-900">
                Pending Rider Applications ({pendingRiders.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('riders')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              View All Riders →
            </button>
          </div>

          {pendingRiders.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs font-bold">
              ✓ All rider partner applications have been processed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRiders.slice(0, 4).map(rider => (
                <div key={rider.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-black text-sm text-stone-900">{rider.fullName}</h5>
                    <p className="text-xs text-stone-500">{rider.vehicleType.toUpperCase()} ({rider.vehicleNumber}) • {rider.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => approveRider(rider.id, rider.fullName)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => rejectRider(rider.id, rider.fullName)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Reject
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