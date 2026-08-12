import React, { useState } from 'react';
import SmartProductMatcher from './SmartProductMatcher';
import { ShoppingBag, Trash2, Edit2, Check, ArrowRight, X } from 'lucide-react';

export default function GroceryListItems({ items, onUpdateItem, onDeleteItem, onClearList, onAddAllToCart }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', brand: '', qty: 1, unit: 'kg', description: '' });

  if (!items || items.length === 0) return null;

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.itemName || item.name || '',
      brand: item.brand || '',
      qty: item.quantity || item.qty || 1,
      unit: item.unit || 'kg',
      description: item.description || ''
    });
  };

  const handleSaveEdit = (id) => {
    if (editForm.name.trim()) {
      onUpdateItem(id, 'name', editForm.name.trim());
      onUpdateItem(id, 'itemName', editForm.name.trim());
      onUpdateItem(id, 'brand', editForm.brand.trim());
      onUpdateItem(id, 'quantity', parseFloat(editForm.qty) || 1);
      onUpdateItem(id, 'qty', parseFloat(editForm.qty) || 1);
      onUpdateItem(id, 'unit', editForm.unit);
      onUpdateItem(id, 'description', editForm.description.trim());
    }
    setEditingId(null);
  };

  const selectedCount = items.filter(i => i.selected !== false).length;
  const estimatedCost = items
    .filter(i => i.selected !== false && i.selectedProduct)
    .reduce((sum, i) => sum + (i.selectedProduct.price * (i.quantity || i.qty || 1)), 0);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900">
              YOUR GROCERY LIST
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Review your entered grocery items. Match catalog options and push directly to your cart.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-stone-400 font-extrabold block uppercase tracking-wider">Estimated Total</span>
            <span className="font-black text-xl text-emerald-950">₹{estimatedCost}</span>
          </div>
          <button
            onClick={onClearList}
            className="text-xs font-bold text-rose-600 hover:underline p-1"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* GROCERY LIST CARDS */}
      <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
        {items.map(item => {
          const isEditing = editingId === item.id;
          const displayTitle = item.itemName || item.name;
          const displayBrand = item.brand;
          const displayQty = item.quantity || item.qty || 1;
          const displayUnit = item.unit || 'kg';
          const displayDesc = item.description;

          return (
            <div
              key={item.id}
              className="bg-stone-50/80 rounded-2xl border border-stone-200/90 p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4 hover:border-emerald-300 hover:bg-white transition-all shadow-2xs"
            >
              {!isEditing ? (
                /* READ VIEW */
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-base sm:text-lg text-stone-900">
                        {displayTitle}
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-0.5 rounded-lg">
                        {displayQty} {displayUnit}
                      </span>
                    </div>

                    {/* RIGHT ACTIONS FOR MOBILE */}
                    <div className="flex items-center gap-2 sm:hidden">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Delete ×
                      </button>
                    </div>
                  </div>

                  {displayBrand && (
                    <p className="text-xs font-bold text-stone-600">
                      Brand: <span className="text-stone-900">{displayBrand}</span>
                    </p>
                  )}

                  <div className="text-xs font-semibold text-stone-600 flex items-center gap-1.5 pt-0.5">
                    <span className="text-stone-400">If unavailable:</span>
                    <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      item.replacementPreference === 'cancel_item' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {item.replacementPreference === 'cancel_item' ? '❌ Cancel Item' : '🔄 Replace with another brand'}
                    </span>
                  </div>

                  {displayDesc && (
                    <p className="text-xs text-stone-500 italic bg-white/60 p-2 rounded-xl border border-stone-200/60 max-w-lg">
                      "{displayDesc}"
                    </p>
                  )}

                  {/* CATALOG MATCH DROPDOWN */}
                  <div className="pt-2 max-w-sm">
                    <SmartProductMatcher
                      itemName={displayTitle}
                      selectedProduct={item.selectedProduct}
                      onSelectProduct={(prod) => onUpdateItem(item.id, 'selectedProduct', prod)}
                    />
                  </div>
                </div>
              ) : (
                /* INLINE EDIT FORM VIEW */
                <div className="flex-1 space-y-3 bg-white p-3.5 rounded-xl border border-emerald-400">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Brand"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editForm.qty}
                      onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                      className="w-20 bg-stone-50 border border-stone-300 rounded-xl px-2 py-1.5 text-xs font-bold text-center"
                    />
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="bg-stone-50 border border-stone-300 rounded-xl px-2 py-1.5 text-xs font-bold"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="packet">packet</option>
                      <option value="pack">pack</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1.5 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* RIGHT ACTIONS DESKTOP */}
              {!isEditing && (
                <div className="hidden sm:flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* CONVERT TO CART ACTION */}
      <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-stone-500 font-medium">
          Ready to order <strong className="text-emerald-900 font-bold">{selectedCount}</strong> items
        </span>

        <button
          type="button"
          onClick={onAddAllToCart}
          disabled={selectedCount === 0}
          className="w-full sm:w-auto py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
          <span>ADD ALL TO CART (₹{estimatedCost})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
