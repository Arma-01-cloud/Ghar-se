import React, { useState, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { uploadImageFile } from '../services/adminService';
import { 
  X, Plus, Edit2, Trash2, Search, Store, Package, 
  IndianRupee, CheckCircle2, AlertCircle, RefreshCw, 
  Image as ImageIcon, Sparkles, Check, Tag, Layers, Upload
} from 'lucide-react';

const CATEGORIES = [
  'Fresh Vegetables',
  'Fresh Fruits',
  'Dairy & Eggs',
  'Rice & Grains',
  'Cooking Oils & Ghee',
  'Masalas & Spices',
  'Atta, Flours & Sooji',
  'Snacks & Biscuits',
  'Beverages & Juices',
  'Tea & Coffee',
  'Cleaning Essentials',
  'Personal Care',
  'Bakery & Bread',
  'Instant & Frozen Foods',
  'General Groceries'
];

const PRESET_IMAGES = [
  { label: 'Veg & Fruits', url: '/images/cat_veg_fruits.jpg' },
  { label: 'Dairy & Milk', url: '/images/cat_dairy_eggs.jpg' },
  { label: 'Cooking Oil', url: '/images/cat_cooking_oils.jpg' },
  { label: 'Atta & Rice', url: '/images/cat_rice_grains.jpg' },
  { label: 'Snacks', url: '/images/cat_snacks_biscuits.jpg' },
  { label: 'Beverages', url: '/images/cat_beverages_juices.jpg' },
  { label: 'Store Front', url: '/images/store_lakshmi.jpg' }
];

export default function AdminStoreProductsModal() {
  const { 
    selectedStoreForProducts, 
    closeStoreProductManager, 
    storeProducts, 
    isLoadingProducts, 
    loadStoreProducts,
    addProductToStore, 
    updateProduct, 
    deleteProduct 
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Fresh Vegetables',
    price: '',
    mrp: '',
    unit: '1 kg',
    stock: '50',
    minThreshold: '5',
    imageUrl: '/images/cat_veg_fruits.jpg',
    description: '',
    isAvailable: true
  });

  if (!selectedStoreForProducts) return null;

  const store = selectedStoreForProducts;

  // Filter products by search and category
  const filteredProducts = storeProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  // Open Form for Adding New Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Fresh Vegetables',
      price: '',
      mrp: '',
      unit: '1 kg',
      stock: '50',
      minThreshold: '5',
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
      category: prod.category || 'Fresh Vegetables',
      price: String(prod.price),
      mrp: String(prod.mrp || prod.price),
      unit: prod.unit || '1 kg',
      stock: String(prod.stock),
      minThreshold: String(prod.minThreshold || 5),
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
      stock: parseInt(formData.stock || 50, 10),
      minThreshold: parseInt(formData.minThreshold || 5, 10),
      imageUrl: formData.imageUrl || '/images/cat_veg_fruits.jpg',
      description: formData.description.trim(),
      isAvailable: formData.isAvailable
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productPayload, store.id);
    } else {
      await addProductToStore(store.id, productPayload);
    }

    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  // Quick In-Stock Status Toggle
  const handleToggleStock = async (prod) => {
    const nextAvailable = !prod.isAvailable;
    await updateProduct(prod.id, { ...prod, isAvailable: nextAvailable }, store.id);
  };

  // Confirm and Delete Product
  const handleDelete = async (prod) => {
    if (window.confirm(`Are you sure you want to delete "${prod.name}" from ${store.name}?`)) {
      await deleteProduct(prod.id, prod.name, store.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* MODAL HEADER */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={store.imageUrl}
              alt={store.name}
              className="w-12 h-12 rounded-2xl object-cover border border-stone-300 shrink-0 shadow-xs"
              onError={(e) => { e.target.src = '/images/store_lakshmi.jpg'; }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-stone-900 text-lg sm:text-xl truncate">
                  {store.name}
                </h3>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  STORE CATALOG
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                {store.locality}, {store.city} • <strong className="text-stone-700 font-bold">{storeProducts.length} Items Listed in Supabase</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add New Product</span>
            </button>

            <button
              onClick={closeStoreProductManager}
              className="p-2 rounded-xl bg-stone-200/80 hover:bg-rose-100 hover:text-rose-700 text-stone-600 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* SEARCH */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search products in this store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
              />
            </div>

            {/* REFRESH BUTTON */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => loadStoreProducts(store.id)}
                disabled={isLoadingProducts}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reload products from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin text-emerald-700' : ''}`} />
                <span className="text-xs">Refresh Catalog</span>
              </button>
            </div>
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              All Items ({storeProducts.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = storeProducts.filter(p => p.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white shadow-xs font-black'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75 font-semibold">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRODUCTS LIST CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FBF9F5]">
          {isLoadingProducts ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
              <p className="text-xs font-bold text-stone-600">Loading store products from Supabase...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-4 shadow-sm max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <Package className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-display font-black text-stone-900 text-lg">
                  {searchQuery || selectedCategory !== 'all' ? 'No Matching Products' : 'No Products in this Store Yet'}
                </h4>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto mt-1">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try clearing your search filters or selected category.'
                    : `Add products specifically for ${store.name}. When customers open this store, they will see only these products.`}
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="py-3 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add First Product to {store.name}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {/* THUMBNAIL & TOP BADGES */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                          />
                          {discount > 0 && (
                            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-2xs">
                              {discount}% OFF
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                            {prod.category}
                          </span>
                          <h4 className="font-extrabold text-stone-900 text-sm leading-snug line-clamp-2">
                            {prod.name}
                          </h4>
                          <p className="text-xs text-stone-500 font-semibold mt-0.5">
                            {prod.unit}
                          </p>
                        </div>
                      </div>

                      {/* PRICE & STOCK METRICS */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-stone-400 text-[10px] font-bold uppercase block">Selling Price</span>
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
                          <span className="text-stone-400 text-[10px] font-bold uppercase block">Stock Count</span>
                          <span className="font-bold text-stone-800 font-mono text-xs">
                            {prod.stock} units
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION CONTROLS */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStock(prod)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                          prod.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {prod.isAvailable ? '🟢 In Stock' : '🔴 Out of Stock'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-800 border border-stone-200 transition-all cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 border border-stone-200 transition-all cursor-pointer"
                          title="Delete product"
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
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>
            ℹ️ Products created here are stored with <code className="text-emerald-800 font-bold">shop_id = {store.id}</code> in Supabase.
          </span>
          <button
            onClick={closeStoreProductManager}
            className="py-2 px-4 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* ADD / EDIT PRODUCT DRAWER / MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-display font-black text-stone-900 text-lg">
                  {editingProduct ? `Edit Product` : `Add New Product to ${store.name}`}
                </h4>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Set price, unit, image upload, and inventory stock in Supabase.
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
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Tomato (Desi / Naati), Nandini Milk 500ml"
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
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 45"
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
                    placeholder="e.g. 60 (for discount)"
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
                    placeholder="e.g. 1 kg, 500g, 1L, 1 pack"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PRESETS */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-bold uppercase tracking-wider">
                  Product Image (Upload File or Select Preset)
                </label>

                {/* DIRECT FILE UPLOAD BUTTON & DROPZONE */}
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
                      <span>{isUploadingImage ? 'Uploading Image...' : 'Upload Image from Computer'}</span>
                    </button>
                    <span className="text-[11px] text-stone-400 block mt-1">Supports PNG, JPG, WebP photos</span>
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
                  placeholder="Or enter custom image URL directly"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
                />
              </div>

              {/* IN STOCK STATUS SWITCH */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="font-bold text-stone-900 block">Item Available for Order</span>
                  <span className="text-[11px] text-stone-500 font-normal">If turned off, customer app will display as Out of Stock</span>
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
                      <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>
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
