import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function FloatingCartBar() {
  const { cart, totalItemCount, cartSubtotal, activeTab, setActiveTab } = useCart();

  if (cart.length === 0 || activeTab === 'cart' || activeTab === 'checkout') {
    return null;
  }

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
      <div 
        onClick={() => setActiveTab('cart')}
        className="bg-emerald-900 text-white rounded-3xl p-4 shadow-2xl border border-emerald-700/60 flex items-center justify-between cursor-pointer hover:bg-emerald-950 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-800 flex items-center justify-center relative">
            <ShoppingBag className="w-6 h-6 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-emerald-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-900">
              {totalItemCount}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-sm text-white block">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} Added
            </span>
            <span className="text-xs text-emerald-200 font-bold">
              Subtotal: ₹{cartSubtotal}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-600 group-hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-md transition-colors">
          <span>VIEW CART</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
