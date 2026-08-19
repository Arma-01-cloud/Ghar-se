import React, { useState, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { uploadImageFile } from '../services/adminService';
import { 
  ShoppingBag, Plus, Search, Edit2, Trash2, CheckCircle2, 
  XCircle, RefreshCw, Upload, Image as ImageIcon, Check, 
  Sparkles, Package, AlertCircle, X, ArrowUpDown
} from 'lucide-react';

const CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Atta & Rice',
  'Pulses',
  'Oil & Masala',
  'Snacks',
  'Beverages',
  'Personal Care',
  'Household',
  'General Groceries'
];

const PRESET_IMAGES = [
  { label: 'Veg & Fruits', url: '/images/cat_veg_fruits.jpg' },
  { label: 'Dairy & Milk', url: '/images/cat_dairy_eggs.jpg' },
  { label: 'Cooking Oil', url: '/images/cat_cooking_oils.jpg' },
  { label: 'Atta & Rice', url: '/images/cat_rice_grains.jpg' },
  { label: 'Snacks', url: '/images/cat_snacks_biscuits.jpg' },
  { label: 'Beverages', url: '/images/cat_beverages_juices.jpg' }
];

export default function AdminAnyStoreCatalogTab() {
  const { 
    globalProducts, 
    isLoadingGlobalProducts, 
    loadGlobalProducts, 
    addGlobalProduct, 
    updateProduct, 
    deleteProduct 
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Fruits & Vegetables',
    price: '',
    mrp: '',
    unit: '1 kg',
    stock: '100',
    minThreshold: '10',
    imageUrl: '/images/cat_veg_fruits.jpg',
    description: '',
    isAvailable: true
  });

  const filteredProducts = globalProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.unit || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && !(p.category || '').toLowerCase().includes(selectedCategory.toLowerCase())) return false;
    return true;
  });

  // Open Form for Adding New Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Fruits & Vegetables',
      price: '',
      mrp: '',
      unit: '1 kg',
      stock: '100',
      minThreshold: '10',
      imageUrl: '/images/cat_veg_fruits.jpg',
      description: '',
      isAvailable: true
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category || 'Fruits & Vegetables',
      price: String(prod.price),
      mrp: String(prod.mrp || prod.price),
      unit: prod.unit || '1 kg',
      stock: String(prod.stock),
      minThreshold: String(prod.minThreshold || 10),
      imageUrl: prod.imageUrl || '/images/cat_veg_fruits.jpg',
      description: prod.description || '',
      isAvailable: prod.isAvailable !== false
    });
    setIsFormOpen(true);
  };

  // Handle local file image upload
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const dataUrl = await uploadImageFile(file);
      if (dataUrl) {
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit Add or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setIsSubmitting(true);
    const productPayload = {
      name: formData.name.trim(),
      category: formData.category,
      price: parseFloat(formData.price),
      mrp: parseFloat(formData.mrp || formData.price),
      unit: formData.unit.trim() || '1 kg',
      stock: parseInt(formData.stock || 100, 10),
      minThreshold: parseInt(formData.minThreshold || 10, 10),
      imageUrl: formData.imageUrl || '/images/cat_veg_fruits.jpg',
      description: formData.description.trim(),
      isAvailable: formData.isAvailable
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productPayload);
    } else {
      await addGlobalProduct(productPayload);
    }

    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  // Quick In-Stock Status Toggle
  const handleToggleStock = async (prod) => {
    const nextAvailable = !prod.isAvailable;
    await updateProduct(prod.id, { ...prod, isAvailable: nextAvailable });
  };

  // Confirm and Delete Product
  const handleDelete = async (prod) => {
    if (window.confirm(`Are you sure you want to remove "${prod.name}" from 'Shop From Any Store' catalog?`)) {
      await deleteProduct(prod.id, prod.name);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-black uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>Universal Catalog Governance</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
              'Shop From Any Store' Catalog
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Manage items displayed when customers use the 'Shop From Any Store' order builder. Only items added by the administrator are stored in Supabase and served to customers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="py-3 px-5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Item to Any Store Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS STRIP */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-display text-xl font-black text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-800" />
              <span>Live Any-Store Catalog ({globalProducts.length} Items)</span>
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Synchronized live with Supabase database for customer requests.
            </p>
          </div>

          <button
            onClick={loadGlobalProducts}
            disabled={isLoadingGlobalProducts}
            className="py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-200 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGlobalProducts ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Reload Catalog</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by product name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
            />
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              All Items ({globalProducts.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs font-black'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {isLoadingGlobalProducts ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">Loading catalog items from Supabase...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3 shadow-sm">
          <Package className="w-10 h-10 text-stone-400 mx-auto" />
          <h4 className="font-display font-extrabold text-stone-900 text-lg">No Catalog Items Found</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try changing your search terms or filter selection.'
              : 'Add items here so customers can order them when using the "Shop From Any Store" flow.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Universal Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const discount = prod.mrp && prod.mrp > prod.price
              ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)
              : 0;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-3xl border p-4 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  !prod.isAvailable ? 'opacity-70 border-stone-300 bg-stone-50/70' : 'border-stone-200 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-3">
                  {/* THUMBNAIL & BADGE */}
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        {discount}% OFF
                      </span>
                    )}
                    <span className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {prod.unit}
                    </span>
                  </div>

                  {/* DETAILS */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                      {prod.category}
                    </span>
                    <h4 className="font-extrabold text-stone-900 text-sm leading-snug line-clamp-2">
                      {prod.name}
                    </h4>
                  </div>

                  {/* PRICE & STOCK */}
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] font-bold uppercase block">Est. Price</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display font-black text-stone-900 text-base">
                          ₹{prod.price}
                        </span>
                        {prod.mrp && prod.mrp > prod.price && (
                          <span className="text-stone-400 line-through text-[11px] font-medium">
                            ₹{prod.mrp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-400 text-[10px] font-bold uppercase block">Stock</span>
                      <span className="font-bold text-stone-800 font-mono text-xs">
                        {prod.stock} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStock(prod)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                      prod.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    {prod.isAvailable ? '🟢 Active' : '🔴 Hidden'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-800 border border-stone-200 transition-all cursor-pointer"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(prod)}
                      className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 border border-stone-200 transition-all cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT ITEM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-display font-black text-stone-900 text-lg">
                  {editingProduct ? `Edit Universal Item` : `Add Item to 'Shop From Any Store'`}
                </h4>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Set item details, upload picture, and save into Supabase.
                </p>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* NAME */}
              <div>
                <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortune Sunlite Sunflower Oil 1L, Farm Fresh Eggs 6pcs"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* PRICE & MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                    Est. Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 140"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                    MRP / Original (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 160 (for discount)"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* UNIT & STOCK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                    Unit / Weight *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 L, 1 kg, 500g, 6 pcs"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 100"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PRESETS */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-bold uppercase tracking-wider">
                  Item Image (Upload File from Device or Select Preset)
                </label>

                {/* FILE INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-3 p-3 bg-stone-50 border border-dashed border-stone-300 rounded-2xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300 flex items-center justify-center">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image from Computer'}</span>
                    </button>
                    <span className="text-[11px] text-stone-400 block mt-1">Direct upload saved to Supabase</span>
                  </div>
                </div>

                {/* PRESET IMAGE SELECTOR */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: img.url })}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        formData.imageUrl === img.url
                          ? 'border-emerald-600 ring-2 ring-emerald-400'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                      title={img.label}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      {formData.imageUrl === img.url && (
                        <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
                />
              </div>

              {/* IN STOCK STATUS SWITCH */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="font-bold text-stone-900 block">Item Visible in 'Shop From Any Store'</span>
                  <span className="text-[11px] text-stone-500 font-normal">Available for express multi-store delivery requests</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${formData.isAvailable ? 'bg-emerald-700' : 'bg-stone-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${formData.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving to Supabase...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingProduct ? 'Update Item' : 'Save to Any-Store Catalog'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}