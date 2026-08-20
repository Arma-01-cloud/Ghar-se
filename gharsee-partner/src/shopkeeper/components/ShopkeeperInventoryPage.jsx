import React, { useState } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { Warehouse, AlertTriangle, Check, RefreshCw } from 'lucide-react';

export default function ShopkeeperInventoryPage() {
  const { products, updateStock, lowStockProducts, loadLiveProducts } = useShopkeeper();
  const [editingStockId, setEditingStockId] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStartStockEdit = (prod) => {
    setEditingStockId(prod.id);
    setNewStockVal(prod.stock);
  };

  const handleSaveStock = async (prodId) => {
    await updateStock(prodId, newStockVal);
    setEditingStockId(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (loadLiveProducts) await loadLiveProducts();
    setIsRefreshing(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <span>STOCK MANAGEMENT</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Inventory Control & Stock Levels
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Monitor stock thresholds and perform quick inventory updates
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Low Stock Warnings ({lowStockProducts.length} Items)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-2xl border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-extrabold text-stone-900">{p.name}</h5>
                  <span className="text-rose-700 font-bold">{p.stock} {p.unit} remaining</span>
                </div>
                <button
                  onClick={() => handleStartStockEdit(p)}
                  className="px-3 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer hover:bg-rose-700"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 font-extrabold uppercase text-stone-500 text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Threshold</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Stock Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
              {products.map(prod => (
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
                        <span className="text-[11px] text-stone-400">{prod.brand || 'Standard'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-black text-stone-900 text-sm">
                    {prod.stock} {prod.unit}
                  </td>
                  <td className="p-4 text-stone-400 font-bold">
                    {prod.minThreshold || 5} {prod.unit}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      prod.stock > 0 && prod.isAvailable !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {prod.stock > 0 && prod.isAvailable !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {editingStockId === prod.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          value={newStockVal}
                          onChange={(e) => setNewStockVal(e.target.value)}
                          className="w-20 bg-stone-50 border border-emerald-500 rounded-xl px-2 py-1 text-xs font-bold text-center"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveStock(prod.id)}
                          className="p-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartStockEdit(prod)}
                        className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        UPDATE STOCK
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}