import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  fetchStoreAssignmentsForProduct, 
  assignProductToStore, 
  updateStoreProductPricing, 
  removeProductFromStore 
} from '../services/adminService';
import { 
  X, Store, Plus, Trash2, Edit2, Check, IndianRupee, 
  AlertCircle, RefreshCw, ShieldCheck
} from 'lucide-react';

export default function AdminGlobalProductStoresModal({ product, onClose, onUpdated }) {
  const { shops, addAdminToast } = useAdmin();
  const [storeAssignments, setStoreAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editAvailability, setEditAvailability] = useState(true);
  const [editSku, setEditSku] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [selectedShopId, setSelectedShopId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newStock, setNewStock] = useState('50');
  const [newAvailability, setNewAvailability] = useState(true);
  const [newSku, setNewSku] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadAssignments = async () => {
    if (!product?.id) return;
    setIsLoading(true);
    const data = await fetchStoreAssignmentsForProduct(product.id);
    setStoreAssignments(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAssignments();
  }, [product?.id]);

  if (!product) return null;

  const assignedStoreIds = new Set(storeAssignments.map(sa => sa.storeId));
  const availableShops = (shops || []).filter(s => !assignedStoreIds.has(s.id));

  const totalStockAcrossStores = storeAssignments.reduce((sum, sa) => sum + (sa.stock || 0), 0);
  const prices = storeAssignments.map(sa => sa.price).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const handleStartEdit = (item) => {
    setEditingRowId(item.storeProductId);
    setEditPrice(item.price);
    setEditMrp(item.mrp || item.price);
    setEditStock(item.stock);
    setEditAvailability(item.isAvailable);
    setEditSku(item.storeSku || '');
  };

  const handleSaveEdit = async (storeProductId) => {
    if (!editPrice || parseFloat(editPrice) < 0) {
      addAdminToast('Please enter a valid price.', 'error');
      return;
    }

    setIsSavingEdit(true);
    const success = await updateStoreProductPricing({
      storeProductId,
      price: parseFloat(editPrice),
      mrp: editMrp ? parseFloat(editMrp) : parseFloat(editPrice),
      stock: parseInt(editStock || 0, 10),
      isAvailable: editAvailability,
      storeSku: editSku.trim()
    });
    setIsSavingEdit(false);

    if (success) {
      addAdminToast('Store pricing & inventory updated! ✓', 'success');
      setEditingRowId(null);
      await loadAssignments();
      if (onUpdated) onUpdated();
    } else {
      addAdminToast('Failed to update store pricing.', 'error');
    }
  };

  const handleRemove = async (storeProductId, storeName) => {
    if (!window.confirm(`Are you sure you want to remove "${product.name}" from ${storeName}?`)) {
      return;
    }

    const success = await removeProductFromStore(storeProductId);
    if (success) {
      addAdminToast(`Removed product from ${storeName}`, 'info');
      await loadAssignments();
      if (onUpdated) onUpdated();
    } else {
      addAdminToast('Failed to remove product from store.', 'error');
    }
  };

  const handleAssignNewStore = async (e) => {
    e.preventDefault();
    if (!selectedShopId) {
      addAdminToast('Please select a store to assign.', 'error');
      return;
    }
    if (!newPrice || parseFloat(newPrice) < 0) {
      addAdminToast('Please enter a valid store price.', 'error');
      return;
    }

    setIsAssigning(true);
    const result = await assignProductToStore({
      storeId: selectedShopId,
      globalProductId: product.id,
      price: parseFloat(newPrice),
      mrp: newMrp ? parseFloat(newMrp) : parseFloat(newPrice),
      stock: parseInt(newStock || 0, 10),
      isAvailable: newAvailability,
      storeSku: newSku.trim()
    });
    setIsAssigning(false);

    if (result) {
      addAdminToast('✨ Assigned product to store successfully!', 'success');
      setSelectedShopId('');
      setNewPrice('');
      setNewMrp('');
      setNewStock('50');
      setNewSku('');
      await loadAssignments();
      if (onUpdated) onUpdated();
    } else {
      addAdminToast('Failed to assign product to store.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-start justify-between gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <img 
              src={product.imageUrl || product.image_url || '/images/cat_veg_fruits.jpg'} 
              alt={product.name}
              className="w-14 h-14 object-cover rounded-2xl bg-stone-800 border border-stone-700 shrink-0"
              onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {product.category || 'Grocery'}
                </span>
                <span className="text-[10px] font-bold text-stone-400">
                  {product.brand || 'Standard'} • {product.unit}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-xl text-white mt-1">
                {product.name}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Manage store assignments, store-specific prices, and stock allocations
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-[#FBF9F5]">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Stores Carrying</span>
              <span className="font-display font-black text-2xl text-emerald-800">{storeAssignments.length}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Stock</span>
              <span className="font-display font-black text-2xl text-stone-900">{totalStockAcrossStores} {product.unit}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Price Range</span>
              <span className="font-display font-black text-2xl text-stone-900">
                {prices.length > 0 ? `₹${minPrice} - ₹${maxPrice}` : '—'}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Avg Store Price</span>
              <span className="font-display font-black text-2xl text-stone-900">
                {prices.length > 0 ? `₹${avgPrice}` : '—'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-700" />
                <h3 className="font-display font-extrabold text-sm text-stone-900">
                  Assigned Stores ({storeAssignments.length})
                </h3>
              </div>
              <button 
                onClick={loadAssignments}
                disabled={isLoading}
                className="text-stone-500 hover:text-stone-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-stone-400 text-xs font-bold">
                Loading store assignments...
              </div>
            ) : storeAssignments.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-500">No stores currently carry this product.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="p-3.5">Store</th>
                      <th className="p-3.5">Price (₹)</th>
                      <th className="p-3.5">MRP (₹)</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Store SKU</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                    {storeAssignments.map((item) => {
                      const isEditing = editingRowId === item.storeProductId;

                      return (
                        <tr key={item.storeProductId} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3.5 font-extrabold text-stone-900">
                            <div>
                              <p className="text-sm">{item.storeName}</p>
                              <span className="text-[10px] text-stone-400 font-medium">
                                {item.locality || item.city}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isEditing ? (
                              <input 
                                type="number" 
                                step="0.5"
                                value={editPrice} 
                                onChange={(e) => setEditPrice(e.target.value)} 
                                className="w-20 px-2 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold focus:outline-hidden"
                              />
                            ) : (
                              <span className="font-display font-black text-stone-900 text-sm">
                                ₹{item.price}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-stone-400">
                            {isEditing ? (
                              <input 
                                type="number" 
                                step="0.5"
                                value={editMrp} 
                                onChange={(e) => setEditMrp(e.target.value)} 
                                className="w-20 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold focus:outline-hidden"
                              />
                            ) : (
                              <span>₹{item.mrp || item.price}</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editStock} 
                                onChange={(e) => setEditStock(e.target.value)} 
                                className="w-16 px-2 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold focus:outline-hidden"
                              />
                            ) : (
                              <span className="font-bold text-stone-900">
                                {item.stock} {product.unit}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isEditing ? (
                              <select 
                                value={editAvailability ? 'true' : 'false'}
                                onChange={(e) => setEditAvailability(e.target.value === 'true')}
                                className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold focus:outline-hidden"
                              >
                                <option value="true">Available</option>
                                <option value="false">Out of Stock</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                item.isAvailable && item.stock > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {item.isAvailable && item.stock > 0 ? 'Available' : 'Out of Stock'}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-stone-400 font-mono text-[11px]">
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={editSku} 
                                onChange={(e) => setEditSku(e.target.value)} 
                                placeholder="SKU-XXXX"
                                className="w-24 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono focus:outline-hidden"
                              />
                            ) : (
                              item.storeSku || '—'
                            )}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveEdit(item.storeProductId)}
                                  disabled={isSavingEdit}
                                  className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingRowId(null)}
                                  className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Store Price & Stock"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemove(item.storeProductId, item.storeName)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                                  title="Remove From Store"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ASSIGN FORM */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Plus className="w-4 h-4 text-emerald-700" />
              <h3 className="font-display font-extrabold text-sm text-stone-900">
                Assign to Another Store
              </h3>
            </div>

            {availableShops.length === 0 ? (
              <p className="text-xs text-stone-500 font-semibold italic">
                All registered stores already carry this product.
              </p>
            ) : (
              <form onSubmit={handleAssignNewStore} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block">Target Store *</label>
                    <select
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                    >
                      <option value="">Select a store...</option>
                      {availableShops.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.locality || s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block">Store Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="number"
                        step="0.5"
                        placeholder="650"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        required
                        className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block">Store MRP (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="700"
                      value={newMrp}
                      onChange={(e) => setNewMrp(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block">Initial Stock</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block">Store SKU</label>
                    <input
                      type="text"
                      placeholder="e.g. LAK-RIC-05"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={newAvailability}
                        onChange={(e) => setNewAvailability(e.target.checked)}
                        className="rounded text-emerald-700"
                      />
                      <span>Available</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isAssigning}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {isAssigning ? 'Assigning...' : 'Assign to Store'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>

        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Single Global Identity • Multi-Store Pricing</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
