import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, ShoppingBag, ChevronDown, Check } from 'lucide-react';

const COMMON_SUGGESTIONS = [
  'Oil',
  'Cooking Oil',
  'Rice',
  'Basmati Rice',
  'Maida',
  'Wheat Flour (Atta)',
  'Sugar',
  'Ragi Flour',
  'Toor Dal',
  'Moong Dal',
  'Fresh Tomatoes',
  'Red Onions',
  'Potatoes',
  'Fresh Milk',
  'Paneer',
  'Brown Bread',
  'Farm Eggs',
  'Tea Powder',
  'Coffee',
  'Butter'
];

const PRESET_QTY_UNITS = [
  '1 kg',
  '2 kg',
  '5 kg',
  '10 kg',
  '500 g',
  '250 g',
  '1 L',
  '2 L',
  '5 L',
  '500 ml',
  '250 ml',
  '1 packet',
  '2 packets',
  '1 pack',
  '1 piece',
  '1 dozen',
  '1 bottle',
  '1 box',
  '1 bundle'
];

export default function ManualGroceryFormCard({ onAddItem }) {
  const { addToCart, setActiveTab, addToast } = useCart();

  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('2 kg');
  const [replacementPreference, setReplacementPreference] = useState('replace_brand');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');


  // Autocomplete suggestions dropdown state for Item Name
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const itemWrapperRef = useRef(null);

  // Scroll down dropdown state for Quantity & Unit
  const [showQtyDropdown, setShowQtyDropdown] = useState(false);
  const qtyWrapperRef = useRef(null);

  // Filter suggestions when user types item name
  useEffect(() => {
    if (itemName.trim().length > 0) {
      const search = itemName.toLowerCase().trim();
      const matches = COMMON_SUGGESTIONS.filter(s => s.toLowerCase().includes(search));
      setFilteredSuggestions(matches.length > 0 ? matches : COMMON_SUGGESTIONS.slice(0, 6));
    } else {
      setFilteredSuggestions([]);
    }
  }, [itemName]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (itemWrapperRef.current && !itemWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (qtyWrapperRef.current && !qtyWrapperRef.current.contains(event.target)) {
        setShowQtyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion) => {
    setItemName(suggestion);
    setShowSuggestions(false);
    setValidationError('');
  };

  const handleSelectQtyUnit = (val) => {
    setQuantityUnit(val);
    setShowQtyDropdown(false);
    if (validationError) setValidationError('');
  };

  const parseQuantityAndUnit = (rawStr) => {
    let qty = 1;
    let unit = 'kg';

    if (rawStr && rawStr.trim()) {
      const match = rawStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
      if (match) {
        qty = parseFloat(match[1]) || 1;
        unit = match[2] ? match[2].trim() : 'kg';
      } else {
        unit = rawStr.trim();
      }
    }

    return { qty, unit };
  };

  const validateAndBuildItem = () => {
    if (!itemName || !itemName.trim()) {
      setValidationError('Please enter a grocery item.');
      return null;
    }
    if (!quantityUnit || !quantityUnit.trim()) {
      setValidationError('Please enter or select quantity and unit (e.g. 1 kg, 2 L).');
      return null;
    }

    setValidationError('');
    const { qty, unit } = parseQuantityAndUnit(quantityUnit);

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: itemName.trim(),
      itemName: itemName.trim(),
      brand: brand.trim(),
      quantity: qty,
      qty: qty,
      unit: unit,
      quantityUnit: quantityUnit.trim(),
      replacementPreference: replacementPreference,
      description: description.trim()
    };
  };

  const handleAddToList = (e) => {
    e.preventDefault();
    const itemPayload = validateAndBuildItem();
    if (!itemPayload) return;

    onAddItem(itemPayload);

    // Form reset
    setItemName('');
    setBrand('');
    setQuantityUnit('2 kg');
    setReplacementPreference('replace_brand');
    setDescription('');

    addToast(`${itemPayload.itemName} (${itemPayload.quantityUnit}) added to list ✓`, 'success');
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    const itemPayload = validateAndBuildItem();
    if (!itemPayload) return;

    onAddItem(itemPayload);

    const buyNowProduct = {
      id: `buynow-${Date.now()}`,
      name: itemPayload.brand ? `${itemPayload.brand} ${itemPayload.itemName}` : itemPayload.itemName,
      price: 120,
      unit: itemPayload.quantityUnit,
      image: '/images/cat_veg_fruits.jpg',
      brand: itemPayload.brand || 'Fresh'
    };

    addToCart(buyNowProduct, itemPayload.quantity);
    setActiveTab('cart');
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* HEADER */}
      <div className="text-center space-y-1">
        <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900">
          Add Grocery Item
        </h3>
        <p className="text-stone-500 text-xs sm:text-sm">
          Enter the details of the grocery you need.
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleAddToList} className="space-y-4">
        
        {/* FIELD 1: ITEM NAME WITH AUTOCOMPLETE SUGGESTIONS */}
        <div ref={itemWrapperRef} className="relative">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
            Enter Item <span className="text-rose-500">*</span>
          </label>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Enter item (e.g. Rice, Oil, Sugar)"
              value={itemName}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setItemName(e.target.value);
                setShowSuggestions(true);
                if (validationError) setValidationError('');
              }}
              className={`w-full bg-stone-50 border rounded-2xl px-4 py-3 text-sm sm:text-base font-bold text-stone-900 focus:outline-none transition-colors ${
                validationError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <p className="text-rose-500 text-xs font-bold mt-1.5 flex items-center gap-1">
              ⚠️ {validationError}
            </p>
          )}

          {/* Autocomplete Dropdown List */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in duration-150">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-3 py-1">
                Suggested Groceries
              </div>
              {filteredSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                >
                  <span>{suggestion}</span>
                  {itemName.toLowerCase() === suggestion.toLowerCase() && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FIELD 2: BRAND */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
            Brand <span className="text-stone-400 text-[10px] font-normal uppercase">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="Enter brand (optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* FIELD 3: QUANTITY & UNIT WITH SCROLL DOWN DROPDOWN */}
        <div ref={qtyWrapperRef} className="relative">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
            Quantity & Unit <span className="text-rose-500">*</span>
          </label>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Type e.g. 1 kg, 2 L or select from scroll down"
              value={quantityUnit}
              onFocus={() => setShowQtyDropdown(true)}
              onChange={(e) => {
                setQuantityUnit(e.target.value);
                setShowQtyDropdown(true);
                if (validationError) setValidationError('');
              }}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />

            <button
              type="button"
              onClick={() => setShowQtyDropdown(!showQtyDropdown)}
              className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600 p-0.5"
              title="Scroll down to select quantity & unit"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showQtyDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <p className="text-[11px] text-stone-400 mt-1 font-medium">
            Type custom quantity (e.g. 3.5 kg) or click arrow to scroll down for common units (1 kg, 2 L, 500 g, etc.)
          </p>

          {/* Scroll Down Dropdown */}
          {showQtyDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in duration-150">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-3 py-1 border-b border-stone-100 mb-1">
                Scroll Down Options (Select or Type)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {PRESET_QTY_UNITS.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQtyUnit(opt)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between transition-colors ${
                      quantityUnit.toLowerCase() === opt.toLowerCase()
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900'
                    }`}
                  >
                    <span>{opt}</span>
                    {quantityUnit.toLowerCase() === opt.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FIELD 4: IF ITEM UNAVAILABLE PREFERENCE DROPDOWN */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
            If Item Unavailable <span className="text-rose-500">*</span>
          </label>
          <select
            value={replacementPreference}
            onChange={(e) => setReplacementPreference(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 text-xs sm:text-sm font-extrabold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="replace_brand">Replace with another brand</option>
            <option value="cancel_item">Cancel item</option>
          </select>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">
            Instruction for shopkeeper if this brand/item is out of stock.
          </p>
        </div>

        {/* FIELD 5: DESCRIPTION */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
            Description <span className="text-stone-400 text-[10px] font-normal uppercase">(Optional)</span>
          </label>
          <textarea
            rows="2"
            placeholder="Add any additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-sm font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* BUTTONS AT BOTTOM */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          {/* PRIMARY: ADD TO LIST */}
          <button
            type="submit"
            className="py-3.5 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD TO LIST</span>
          </button>

          {/* SECONDARY: BUY NOW */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BUY NOW</span>
          </button>
        </div>

      </form>

    </div>
  );
}
