import React from 'react';
import { PRODUCTS } from '../data/products';
import { ChevronDown, Check } from 'lucide-react';

export default function SmartProductMatcher({ selectedProduct, onSelectProduct, itemName }) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Filter products based on raw item name
  const matchedOptions = React.useMemo(() => {
    if (!itemName) return PRODUCTS.slice(0, 5);
    const search = itemName.toLowerCase();
    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
    return matches.length > 0 ? matches.slice(0, 6) : PRODUCTS.slice(0, 5);
  }, [itemName]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 text-left transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedProduct?.image && (
            <img src={selectedProduct.image} alt="" className="w-5 h-5 object-cover rounded-md" />
          )}
          <span className="truncate">{selectedProduct ? selectedProduct.name : 'Select Catalog Match'}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1 animate-in fade-in duration-150">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-3 py-1.5 border-b border-stone-100">
            Suggested Catalog Matches
          </div>
          {matchedOptions.map(prod => {
            const isSelected = selectedProduct?.id === prod.id;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  onSelectProduct(prod);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                  isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <img src={prod.image} alt="" className="w-6 h-6 object-cover rounded-md shrink-0" />
                  <div className="truncate">
                    <p className="truncate font-semibold">{prod.name}</p>
                    <p className="text-[10px] text-stone-400 font-medium">₹{prod.price} / {prod.unit}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
