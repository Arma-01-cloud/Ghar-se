import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Users, Search, MapPin, Phone, ExternalLink, Calendar, UserCheck } from 'lucide-react';

export default function AdminCustomersTab() {
  const { customers } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.addressText.toLowerCase().includes(q) ||
      (c.pincode && c.pincode.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-800" />
              <span>Customer Registry ({customers.length})</span>
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Registered customer profiles, verified mobile numbers, and geocoded delivery locations.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black self-start sm:self-auto">
            {customers.length} Verified Accounts
          </span>
        </div>

        {/* SEARCH BAR */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, address, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* CUSTOMER LIST */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-2 shadow-sm">
          <Users className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No Customers Found</p>
          <p className="text-xs text-stone-500">Try changing your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3.5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-display font-black text-base shadow-sm shrink-0">
                    {customer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-black text-stone-900 text-base truncate">{customer.fullName}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{customer.phone}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 shrink-0">
                  CUSTOMER
                </span>
              </div>

              {/* ADDRESS DETAILS */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-2 text-stone-700">
                <div>
                  <span className="text-stone-500 block text-[10px] font-black uppercase tracking-wider mb-1">
                    Saved Delivery Address:
                  </span>
                  <p className="text-stone-800 font-medium flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{customer.addressText || `${customer.flat ? customer.flat + ', ' : ''}${customer.street ? customer.street + ', ' : ''}${customer.city}`}</span>
                  </p>
                </div>

                {customer.latitude != null && customer.longitude != null && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/60">
                    <span className="text-[11px] text-stone-500 font-medium">Map Coordinates:</span>
                    <a
                      href={`https://maps.google.com/?q=${customer.latitude},${customer.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 hover:underline flex items-center gap-1 font-mono text-[11px] font-bold"
                    >
                      <span>{customer.latitude?.toFixed(4)}, {customer.longitude?.toFixed(4)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
