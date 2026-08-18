import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import ManualGroceryFormCard from './ManualGroceryFormCard';
import UploadGroceryListCard from './UploadGroceryListCard';
import GroceryListItems from './GroceryListItems';
import { matchItemToCatalog } from '../services/groceryListParser';
import { Camera, Edit3 } from 'lucide-react';

export default function GroceryListSection() {
  const { addMultipleToCart, setActiveTab } = useCart();
  const [activeInputMethod, setActiveInputMethod] = useState('manual'); // 'manual' or 'upload'

  // Unified Grocery List items state for manual entry
  const [items, setItems] = useState([]);

  // Handle manual item add
  const handleAddManualItem = (newItem) => {
    const matches = matchItemToCatalog(newItem.itemName || newItem.name);
    const formatted = {
      id: newItem.id || `manual-${Date.now()}`,
      name: newItem.itemName || newItem.name,
      itemName: newItem.itemName || newItem.name,
      brand: newItem.brand || '',
      quantity: newItem.quantity || newItem.qty || 1,
      qty: newItem.quantity || newItem.qty || 1,
      unit: newItem.unit || 'kg',
      description: newItem.description || '',
      selectedProduct: matches[0] || null,
      selected: true
    };
    setItems(prev => [formatted, ...prev]);
  };

  // Item update handler
  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  // Item delete handler
  const handleDeleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear list handler
  const handleClearList = () => {
    setItems([]);
  };

  // Add all items to cart
  const handleAddAllToCart = () => {
    const cartPayload = items
      .filter(item => item.selected !== false && item.selectedProduct)
      .map(item => ({
        product: item.selectedProduct,
        quantity: item.quantity || item.qty || 1
      }));

    if (cartPayload.length > 0) {
      addMultipleToCart(cartPayload);
      setActiveTab('cart');
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      
      {/* METHOD SWITCHER TABS */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setActiveInputMethod('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all ${
            activeInputMethod === 'manual'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveInputMethod('upload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all ${
            activeInputMethod === 'upload'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Upload Grocery Photo</span>
        </button>
      </div>

      {/* ACTIVE INPUT METHOD CARD */}
      <div className="flex justify-center">
        {activeInputMethod === 'manual' ? (
          <ManualGroceryFormCard onAddItem={handleAddManualItem} />
        ) : (
          <div className="w-full max-w-2xl">
            <UploadGroceryListCard />
          </div>
        )}
      </div>

      {/* UNIFIED GROCERY LIST DISPLAY BELOW MANUAL FORM */}
      {items.length > 0 && activeInputMethod === 'manual' && (
        <GroceryListItems
          items={items}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onClearList={handleClearList}
          onAddAllToCart={handleAddAllToCart}
        />
      )}

    </section>
  );
}
