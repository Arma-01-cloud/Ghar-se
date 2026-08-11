import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { parseGroceryListImage, parseRawListText, matchItemToCatalog } from '../services/groceryListParser';
import SmartProductMatcher from './SmartProductMatcher';
import ManualEntryForm from './ManualEntryForm';
import { 
  Upload, Camera, Image as ImageIcon, Sparkles, CheckCircle2, 
  Trash2, Plus, RefreshCw, ShoppingBag, AlertCircle, ArrowRight, Check 
} from 'lucide-react';

export default function UploadListPage() {
  const { addMultipleToCart, setActiveTab } = useCart();
  const [imageSrc, setImageSrc] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState({ progress: 0, text: '' });
  const [extractedItems, setExtractedItems] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);

  const fileInputRef = useRef(null);

  // File upload handler
  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setHasParsed(false);
      setExtractedItems([]);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Preset sample handwritten image loader
  const handleLoadSample = () => {
    setImageSrc('/images/handwritten_list_sample.jpg');
    setHasParsed(false);
    setExtractedItems([]);
  };

  // OCR List Extraction Trigger
  const handleAnalyzeImage = async () => {
    if (!imageSrc) return;
    setIsAnalyzing(true);
    setAnalysisStatus({ progress: 10, text: 'Scanning grocery list image...' });

    const result = await parseGroceryListImage(imageSrc, (statusObj) => {
      setAnalysisStatus(statusObj);
    });

    setIsAnalyzing(false);
    setHasParsed(true);
    if (result.success && result.items) {
      setExtractedItems(result.items);
    }
  };

  // Add Item manually to extracted items table
  const handleAddManualItem = (newItem) => {
    const matched = matchItemToCatalog(newItem.name);
    const selectedProd = matched[0] || null;
    const formatted = {
      id: `manual-${Date.now()}`,
      raw: newItem.name,
      name: newItem.name,
      qty: newItem.qty,
      unit: newItem.unit,
      matchedProducts: matched,
      selectedProduct: selectedProd,
      price: selectedProd ? selectedProd.price : 60,
      selected: true
    };
    setExtractedItems(prev => [formatted, ...prev]);
    setHasParsed(true);
  };

  // Item field update handlers
  const handleToggleSelect = (id) => {
    setExtractedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleUpdateItem = (id, field, value) => {
    setExtractedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'selectedProduct' && value) {
        updated.price = value.price;
      }
      return updated;
    }));
  };

  const handleDeleteItem = (id) => {
    setExtractedItems(prev => prev.filter(item => item.id !== id));
  };

  // Add selected items to cart
  const handleAddAllToCart = () => {
    const selectedItems = extractedItems
      .filter(item => item.selected && item.selectedProduct)
      .map(item => ({
        product: item.selectedProduct,
        quantity: item.qty
      }));

    if (selectedItems.length === 0) return;
    addMultipleToCart(selectedItems);
    setActiveTab('cart');
  };

  const selectedCount = extractedItems.filter(i => i.selected).length;
  const totalEstimatedCost = extractedItems
    .filter(i => i.selected && i.selectedProduct)
    .reduce((sum, item) => sum + (item.selectedProduct.price * item.qty), 0);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      
      {/* PAGE HEADER */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>KEY DIFFERENTIATOR</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Turn Your Grocery List Into a Cart
        </h1>
        <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
          Upload a photo of your handwritten or printed grocery shopping list and let our AI OCR extract and match items directly to our fresh catalog.
        </p>
      </div>

      {/* UPLOAD / PREVIEW CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: UPLOAD BOX & IMAGE PREVIEW */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 p-6 shadow-sm hover:border-emerald-500 transition-all">
            {!imageSrc ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl transition-colors ${
                  isDragging ? 'bg-emerald-50 border-emerald-500' : 'bg-stone-50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-stone-900">
                  Upload Grocery List Image
                </h3>
                <p className="text-stone-500 text-xs mt-1 mb-6 max-w-xs">
                  Drag & drop your photo here, or browse files (JPG, PNG, WebP)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>CHOOSE IMAGE</span>
                  </button>
                  
                  <button
                    onClick={handleLoadSample}
                    className="py-3 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    title="Load sample handwritten grocery list photo"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>Try Sample List</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 group">
                  <img
                    src={imageSrc}
                    alt="Uploaded Grocery List"
                    className="w-full max-h-72 object-contain mx-auto"
                  />

                  {/* ANIMATED SCANNER OVERLAY WHILE ANALYZING */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="font-extrabold text-sm text-emerald-300">{analysisStatus.text}</p>
                      <div className="w-48 bg-emerald-900 h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="bg-emerald-400 h-full transition-all duration-300" 
                          style={{ width: `${analysisStatus.progress}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PREVIEW BUTTONS */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setExtractedItems([]);
                      setHasParsed(false);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Remove Image
                  </button>

                  <button
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Grocery List'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MANUAL ITEM ENTRY FALLBACK FORM */}
          <ManualEntryForm onAddItem={handleAddManualItem} />

        </div>

        {/* RIGHT COLUMN: EXTRACTED GROCERY ITEMS EDITOR TABLE */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            
            {/* TABLE HEADER & CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-stone-900">
                    Detected Grocery Items
                  </h3>
                  {extractedItems.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {extractedItems.length} items
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Review, edit quantities, and verify catalog matched products below.
                </p>
              </div>

              {extractedItems.length > 0 && (
                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-medium">Estimated Total</span>
                  <span className="font-black text-xl text-emerald-950">₹{totalEstimatedCost}</span>
                </div>
              )}
            </div>

            {/* EXTRACTED ITEMS TABLE */}
            {extractedItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-stone-700">No items detected yet</p>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Upload an image above or use the manual entry form to build your custom grocery cart list.
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-4 max-h-[500px] overflow-y-auto pr-1">
                {extractedItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.selected ? 'bg-stone-50/80 border-stone-200' : 'bg-white border-stone-200/50 opacity-60'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      
                      {/* Checkbox & Item Raw Name */}
                      <div className="sm:col-span-4 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="w-full bg-transparent font-bold text-sm text-stone-900 border-b border-transparent focus:border-emerald-600 focus:outline-none"
                          />
                          <span className="text-[10px] text-stone-400 block truncate">Raw text: "{item.raw}"</span>
                        </div>
                      </div>

                      {/* Quantity & Unit Controls */}
                      <div className="sm:col-span-3 flex items-center gap-1.5">
                        <div className="flex items-center border border-stone-300 rounded-xl bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'qty', Math.max(0.5, item.qty - 0.5))}
                            className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 rounded-md font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-xs">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'qty', item.qty + 0.5)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 rounded-md font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="bg-white border border-stone-300 rounded-xl px-2 py-1.5 text-xs font-bold"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="pkt">pkt</option>
                          <option value="pack">pack</option>
                        </select>
                      </div>

                      {/* Smart Product Matcher Dropdown */}
                      <div className="sm:col-span-4">
                        <SmartProductMatcher
                          itemName={item.name}
                          selectedProduct={item.selectedProduct}
                          onSelectProduct={(prod) => handleUpdateItem(item.id, 'selectedProduct', prod)}
                        />
                      </div>

                      {/* Delete Action */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BOTTOM CONVERT TO CART ACTION BUTTON */}
            {extractedItems.length > 0 && (
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-600 font-semibold">
                  <span>Selected <strong className="text-emerald-700">{selectedCount}</strong> of {extractedItems.length} items</span>
                </div>

                <button
                  onClick={handleAddAllToCart}
                  disabled={selectedCount === 0}
                  className="w-full sm:w-auto py-3.5 px-8 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-40"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>ADD ALL SELECTED TO CART (₹{totalEstimatedCost})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
