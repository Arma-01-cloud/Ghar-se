import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  Bike, Search, CheckCircle2, XCircle, Phone, 
  AlertTriangle, ShieldCheck, FileText, MapPin
} from 'lucide-react';

export default function AdminRidersTab() {
  const { riders, approveRider, rejectRider } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'active' | 'online'

  const filteredRiders = riders.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.vehicleNumber || '').toLowerCase().includes(q) ||
      (r.drivingLicense || '').toLowerCase().includes(q) ||
      (r.deliveryCity || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;
    if (filterStatus === 'pending') return r.isPending;
    if (filterStatus === 'active') return r.isApproved;
    if (filterStatus === 'online') return r.isApproved && r.isOnline;
    return true;
  });

  const pendingCount = riders.filter(r => r.isPending).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <Bike className="w-6 h-6 text-emerald-800" />
              <span>Delivery Fleet & Rider Verification ({riders.length})</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Verify driving licenses, vehicle numbers, and approve riders before they can receive delivery requests.
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{pendingCount} Rider(s) Awaiting Review</span>
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
              placeholder="Search rider name, vehicle, phone..."
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
              All ({riders.length})
            </button>

            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-100 text-amber-900 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              Verified Fleet
            </button>

            <button
              onClick={() => setFilterStatus('online')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'online'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              🟢 Online Now
            </button>
          </div>

        </div>
      </div>

      {/* RIDERS GRID */}
      {filteredRiders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2 shadow-sm">
          <Bike className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No Delivery Riders Found</p>
          <p className="text-xs text-stone-500">Try changing your search terms or filter status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRiders.map((rider) => (
            <div 
              key={rider.id}
              className={`bg-white rounded-3xl border p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                rider.isPending
                  ? 'border-amber-300 ring-2 ring-amber-200/60'
                  : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              
              <div className="space-y-3">
                {/* RIDER HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-stone-900 text-base truncate">{rider.fullName}</h3>
                      {rider.isPending ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          PENDING
                        </span>
                      ) : rider.isOnline ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                          🟢 ONLINE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 shrink-0">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-1 font-medium">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{rider.phone}</span>
                    </p>
                  </div>

                  <span className="text-xs font-black text-stone-900 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200 shrink-0">
                    ⭐ {rider.rating}
                  </span>
                </div>

                {/* VEHICLE & LICENSE DETAILS */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-2 text-stone-700">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Vehicle Type:</span>
                    <span className="font-extrabold uppercase text-emerald-800">{rider.vehicleType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Vehicle Number:</span>
                    <span className="font-mono font-bold text-stone-900 uppercase">{rider.vehicleNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3 text-stone-400" />
                      <span>License ID:</span>
                    </span>
                    <span className="font-mono font-semibold text-stone-800">{rider.drivingLicense}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>City:</span>
                    </span>
                    <span className="font-bold text-stone-800">{rider.deliveryCity}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div>
                {rider.isPending ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => rejectRider(rider.id, rider.fullName)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => approveRider(rider.id, rider.fullName)}
                      className="py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Rider</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Verified Partner</span>
                    </div>
                    <span className="font-semibold">{rider.totalDeliveries} Deliveries</span>
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