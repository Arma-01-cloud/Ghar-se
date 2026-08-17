import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Store, Search, CheckCircle2, XCircle, MapPin, Phone, 
  ExternalLink, Power, AlertTriangle, ShieldCheck, Package
} from 'lucide-react';

export default function AdminShopsTab() {
  const { shops, approveShop, rejectShop, toggleShop, openStoreProductManager } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'open' | 'closed' | 'rejected'

  const filteredShops = shops.filter((s) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (s.name || '').toLowerCase().includes(q) ||
      (s.locality || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      ((s.address || '').toLowerCase().includes(q))
    );

    // Status filter
    if (!matchesSearch) return false;
    if (filterStatus === 'pending') return s.isPending;
    if (filterStatus === 'open') return s.isApproved && s.isOpen;
    if (filterStatus === 'closed') return s.isApproved && !s.isOpen;
    if (filterStatus === 'rejected') return s.status === 'rejected';
    return true;
  });

  const pendingCount = shops.filter(s => s.isPending).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-emerald-800" />
              <span>Store Partner Governance ({shops.length})</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Approve new store onboarding requests, toggle operational status, and inspect store coordinates.
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{pendingCount} Store(s) Awaiting Review</span>
            </div>
          )}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search store name, locality, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
            />
          </div>

          {/* FILTER CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              All ({shops.length})
            </button>

            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-100 text-amber-900 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setFilterStatus('open')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'open'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              🟢 Open
            </button>

            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'closed'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              🔴 Closed
            </button>
          </div>

        </div>
      </div>

      {/* SHOPS GRID */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2 shadow-sm">
          <Store className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No Stores Found</p>
          <p className="text-xs text-stone-500">Try changing your search terms or filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map((shop) => (
            <div 
              key={shop.id}
              className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                shop.isPending
                  ? 'border-amber-300 ring-2 ring-amber-200/60'
                  : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              
              {/* STORE CARD HEADER & IMAGE */}
              <div>
                <div className="relative w-full h-40 bg-stone-100 overflow-hidden">
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/images/store_lakshmi.jpg'; }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {shop.isPending ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-[10px] uppercase shadow-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 stroke-[3]" />
                        PENDING APPROVAL
                      </span>
                    ) : shop.status === 'rejected' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-[10px] uppercase shadow-sm">
                        REJECTED
                      </span>
                    ) : shop.isOpen ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-extrabold text-[10px] uppercase shadow-sm">
                        🟢 OPEN ON APP
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-white font-extrabold text-[10px] uppercase shadow-sm">
                        🔴 CLOSED
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-stone-900 font-black text-[11px] shadow-sm border border-stone-200">
                      ⭐ {shop.rating}
                    </span>
                  </div>
                </div>

                {/* STORE DETAILS */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-stone-900 truncate">{shop.name}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{shop.locality}, {shop.city} ({shop.pincode || 'No Pin'})</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 font-medium">Contact:</span>
                      <span className="font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {shop.phone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 font-medium">GPS Location:</span>
                      <a
                        href={`https://maps.google.com/?q=${shop.latitude},${shop.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-800 hover:underline flex items-center gap-1 font-mono text-[11px] font-bold"
                      >
                        <span>{shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 font-medium">Categories:</span>
                      <span className="text-[11px] font-semibold text-stone-800 truncate max-w-[160px]">
                        {shop.categories.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="p-5 pt-0 space-y-2.5">
                
                {/* MANAGE INVENTORY BUTTON */}
                <button
                  onClick={() => openStoreProductManager(shop)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                    <span>Manage Store Products</span>
                  </span>
                  <span className="bg-emerald-800 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded-lg shadow-2xs">
                    {shop.productCount || 0} items
                  </span>
                </button>

                {shop.isPending ? (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => rejectShop(shop.id, shop.name)}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => approveShop(shop.id, shop.name)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Store</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Approved Store</span>
                    </div>

                    <button
                      onClick={() => toggleShop(shop.id, shop.isOpen)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        shop.isOpen
                          ? 'bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-300'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{shop.isOpen ? 'Turn Off (Close)' : 'Turn On (Open)'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
