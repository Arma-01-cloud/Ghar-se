import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { updateProductAvailabilityInSupabase } from '../../services/productService';
import { Warehouse, Check, RefreshCw, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

export default function ShopkeeperInventoryPage() {
  const { products, loadLiveProducts, addShopkeeperToast } = useShopkeeper();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localProducts, setLocalProducts] = useState([]);

  React.useEffect(() => {
    setLocalProducts(products || []);
  }, [products]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (loadLiveProducts) await loadLiveProducts();
    setIsRefreshing(false);
  };

  const handleToggleAvailability = async (prod, nextAvailable) => {
    const prodId = prod.storeProductId || prod.id;

    // Optimistic update
    setLocalProducts(prev => prev.map(p => 
      (p.storeProductId || p.id) === prodId 
        ? { ...p, isAvailable: nextAvailable, is_available: nextAvailable }
        : p
    ));

    const success = await updateProductAvailabilityInSupabase(prodId, nextAvailable);
    if (success) {
      addShopkeeperToast(
        nextAvailable 
          ? `🟢 "${prod.name}" is now AVAILABLE to customers` 
          : `🔴 "${prod.name}" is now UNAVAILABLE (Out of Stock)`,
        nextAvailable ? 'success' : 'info'
      );
      if (loadLiveProducts) loadLiveProducts();
    } else {
      addShopkeeperToast('Failed to update status in Supabase.', 'error');
    }
  };

  const availableCount = localProducts.filter(p => p.isAvailable !== false && p.is_available !== false).length;
  const unavailableCount = localProducts.length - availableCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <span>AVAILABILITY & STORE CATALOG STATUS</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Product Availability Manager
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Toggle product availability to control what customers can order in real-time
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Total Store Items</span>
          <span className="font-display font-black text-2xl text-stone-900 mt-1 block">{localProducts.length}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Currently Available</span>
          <span className="font-display font-black text-2xl text-emerald-800 mt-1 block">{availableCount}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">Unavailable / Out of Stock</span>
          <span className="font-display font-black text-2xl text-rose-800 mt-1 block">{unavailableCount}</span>
        </div>
      </div>

      {/* AVAILABILITY TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 font-extrabold uppercase text-stone-500 text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Customer Status</th>
                <th className="p-4 text-right">Change Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
              {localProducts.map(prod => {
                const isAvailable = prod.isAvailable !== false && prod.is_available !== false;

                return (
                  <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={prod.image || prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg'} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-xl bg-stone-100 border border-stone-200 shrink-0"
                          onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                        />
                        <div>
                          <p className="font-extrabold text-stone-900 text-sm">{prod.name}</p>
                          <span className="text-[11px] text-stone-400">{prod.unit || '1 kg'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-stone-600 font-medium">
                      {prod.category}
                    </td>

                    <td className="p-4 font-black text-stone-900">
                      ₹{prod.price || 0}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-block relative">
                        <select
                          value={isAvailable ? 'available' : 'unavailable'}
                          onChange={(e) => handleToggleAvailability(prod, e.target.value === 'available')}
                          className={`pl-3 pr-8 py-1.5 rounded-xl text-xs font-black appearance-none cursor-pointer border shadow-2xs transition-all ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          <option value="available">🟢 Available</option>
                          <option value="unavailable">🔴 Unavailable</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}