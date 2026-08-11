import React, { useState } from 'react';
import { SUGGESTED_QUICK_ITEMS } from '../data/products';
import { Plus, Sparkles } from 'lucide-react';

export default function ManualEntryForm({ onAddItem }) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    onAddItem({
      name: itemName.trim(),
      qty: parseFloat(quantity) || 1,
      unit: unit
    });
    setItemName('');
    setQuantity(1);
  };

  const handleQuickAdd = (suggested) => {
    onAddItem({
      name: suggested.name,
      qty: suggested.defaultQty || 1,
      unit: suggested.unit || 'kg'
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h3 className="font-display font-extrabold text-lg text-stone-900">
          Manual Grocery Entry
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
        <div className="sm:col-span-6">
          <label className="block text-xs font-bold text-stone-600 mb-1">Item Name</label>
          <input
            type="text"
            placeholder="e.g. Fresh Tomatoes, Milk, Basmati Rice"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Qty</label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-center font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pkt">pkt</option>
              <option value="pack">pack</option>
              <option value="bunch">bunch</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-3 flex items-end">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ADD TO LIST</span>
          </button>
        </div>
      </form>

      {/* QUICK SUGGESTIONS CHIPS */}
      <div>
        <span className="text-xs font-bold text-stone-500 block mb-2">Quick Add Popular Items:</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUICK_ITEMS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAdd(item)}
              className="flex items-center gap-1 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 border border-stone-200 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>{item.name} ({item.defaultQty} {item.unit})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
