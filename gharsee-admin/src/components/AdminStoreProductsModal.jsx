import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  fetchGlobalCatalog, 
  assignProductToStore, 
  uploadImageFile,
  GLOBAL_CATEGORIES 
} from '../services/adminService';
import { 
  X, Plus, Edit2, Trash2, Search, Store, Package, 
  IndianRupee, CheckCircle2, AlertCircle, RefreshCw, 
  Image as ImageIcon, Check, Tag, Layers, Upload, ArrowRight
} from 'lucide-react';

export default function AdminStoreProductsModal() {
  const { 
    selectedStoreForProducts, 
    closeStoreProductManager, 
    storeProducts, 
    isLoadingProducts, 
    loadStoreProducts,
    addProductToStore, 
    updateProduct, 
    deleteProduct,
    addAdminToast 
  } = useAdmin();

  const [activeModalTab, setActiveModalTab] = useState('store-inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [globalCatalogItems, setGlobalCatalogItems] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalCatFilter, setGlobalCatFilter] = useState('all');
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [assigningProduct, setAssigningProduct] = useState(null);
  const [assignPrice, setAssignPrice] = useState('');
  const [assignMrp, setAssignMrp] = useState('');
  const [assignStock, setAssignStock] = useState('50');
  const [assignSku, setAssignSku] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: 'Standard',
    category: 'Rice & Grains',
    price: '',
    mrp: '',
    unit: '1 kg',
    stock: '50',
    minThreshold: '5',
    imageUrl: '/images/cat_veg_fruits.jpg',
    description: '',
    storeSku: '',
    isAvailable: true
  });

  useEffect(() => {
    if (activeModalTab === 'browse-global' && selectedStoreForProducts) {
      loadGlobalCatalog();
    }
  }, [activeModalTab, selectedStoreForProducts, globalSearch, globalCatFilter]);

  const loadGlobalCatalog = async () => {
    setIsLoadingGlobal(true);
    try {
      const res = await fetchGlobalCatalog({
        limit: 50,
        search: globalSearch,
        category: globalCatFilter,
        isActive: 'active'
      });
      setGlobalCatalogItems(res.products || []);
    } catch (err) {
      console.error('Error loading global catalog:', err);
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  if (!selectedStoreForProducts) return null;
  const store = selectedStoreForProducts;

  const filteredProducts = storeProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.unit || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.storeSku || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && (p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
    return true;
  });

  const existingGlobalIds = new Set(storeProducts.map(p => p.globalProductId || p.id));

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: 'Standard',
      category: 'Rice & Grains',
      price: '',
      mrp: '',
      unit: '1 kg',
      stock: '50',
      minThreshold: '5',
      imageUrl: '/images/cat_veg_fruits.jpg',
      description: '',
      storeSku: '',
      isAvailable: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      brand: prod.brand || 'Standard',
      category: prod.category || 'General Groceries',
      price: String(prod.price || ''),
      mrp: String(prod.mrp || prod.price || ''),
      unit: prod.unit || '1 kg',
      stock: String(prod.stock != null ? prod.stock : 50),
      minThreshold: String(prod.minThreshold != null ? prod.minThreshold : 5),
      imageUrl: prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg',
      description: prod.description || '',
      storeSku: prod.storeSku || '',
      isAvailable: prod.isAvailable !== false && prod.is_available !== false
    });
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const dataUrl = await uploadImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      addAdminToast('Image compressed & attached! ✓', 'success');
    } catch (err) {
      addAdminToast(err.message || 'Image processing failed', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setIsSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      brand: formData.brand.trim() || 'Standard',
      category: formData.category,
      price: parseFloat(formData.price),
      mrp: formData.mrp ? parseFloat(formData.mrp) : parseFloat(formData.price),
      unit: formData.unit.trim(),
      stock: parseInt(formData.stock || 0, 10),
      minThreshold: parseInt(formData.minThreshold || 5, 10),
      imageUrl: formData.imageUrl,
      image_url: formData.imageUrl,
      description: formData.description.trim(),
      storeSku: formData.storeSku.trim(),
      isAvailable: formData.isAvailable
    };

    if (editingProduct) {
      payload.globalProductId = editingProduct.globalProductId;
      const success = await updateProduct(editingProduct.id, payload, store.id);
      setIsSubmitting(false);
      if (success) setIsFormOpen(false);
    } else {
      const res = await addProductToStore(store.id, payload);
      setIsSubmitting(false);
      if (res?.success) setIsFormOpen(false);
    }
  };

  const handleAssignFromGlobal = async (e) => {
    e.preventDefault();
    if (!assigningProduct || !assignPrice) return;

    setIsAssigning(true);
    const assigned = await assignProductToStore({
      storeId: store.id,
      globalProductId: assigningProduct.id,
      price: parseFloat(assignPrice),
      mrp: assignMrp ? parseFloat(assignMrp) : parseFloat(assignPrice),
      stock: parseInt(assignStock || 0, 10),
      storeSku: assignSku.trim(),
      isAvailable: true
    });
    setIsAssigning(false);

    if (assigned) {
      addAdminToast(`✨ Assigned "${assigningProduct.name}" to ${store.name}!`, 'success');
      setAssigningProduct(null);
      setAssignPrice('');
      setAssignMrp('');
      setAssignStock('50');
      setAssignSku('');
      await loadStoreProducts(store.id);
      setActiveModalTab('store-inventory');
    } else {
      addAdminToast('Failed to assign product.', 'error');
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Are you sure you want to remove "${prod.name}" from ${store.name}?`)) return;
    await deleteProduct(prod.id, prod.name, store.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-start justify-between gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <img 
              src={store.imageUrl || store.image_url || '/images/store_lakshmi.jpg'} 
              alt={store.name}
              className="w-14 h-14 object-cover rounded-2xl bg-stone-800 border border-stone-700 shrink-0"
              onError={(e) => { e.target.src = '/images/store_lakshmi.jpg'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {store.locality || store.city || 'Store Partner'}
                </span>
                <span className="text-[10px] font-bold text-stone-400">{store.phone}</span>
              </div>
              <h2 className="font-display font-extrabold text-xl text-white mt-1">
                {store.name} • Inventory Management
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {storeProducts.length} items in store inventory • Linked to Global Catalog
              </p>
            </div>
          </div>

          <button 
            onClick={closeStoreProductManager}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-stone-100 px-4 sm:px-6 py-2 border-b border-stone-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModalTab('store-inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeModalTab === 'store-inventory'
                  ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Current Store Inventory ({storeProducts.length})
            </button>
            <button
              onClick={() => setActiveModalTab('browse-global')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'browse-global'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>+ Add from Global Catalog</span>
            </button>
          </div>

          {activeModalTab === 'store-inventory' && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Product</span>
            </button>
          )}
        </div>

        {activeModalTab === 'store-inventory' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-[#FBF9F5]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search store inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {GLOBAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => loadStoreProducts(store.id)}
                disabled={isLoadingProducts}
                className="p-2 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin text-emerald-700' : ''}`} />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
              {isLoadingProducts ? (
                <div className="py-16 text-center text-xs font-bold text-stone-400">
                  Loading store products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-500">No products in this store inventory yet.</p>
                  <button
                    onClick={() => setActiveModalTab('browse-global')}
                    className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer"
                  >
                    Browse Global Catalog & Add Products
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-black text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Store Price</th>
                        <th className="p-3.5">MRP</th>
                        <th className="p-3.5">Stock</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                      {filteredProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={prod.image || prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg'} 
                                alt="" 
                                className="w-10 h-10 object-cover rounded-xl bg-stone-100 border border-stone-200 shrink-0"
                                onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                              />
                              <div>
                                <p className="font-extrabold text-stone-900 text-sm">{prod.name}</p>
                                <span className="text-[10px] text-stone-400">{prod.brand || 'Standard'} • {prod.unit}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-stone-600 font-medium">{prod.category}</td>
                          <td className="p-3.5 font-display font-black text-stone-900 text-sm">₹{prod.price}</td>
                          <td className="p-3.5 text-stone-400">₹{prod.mrp || prod.price}</td>
                          <td className="p-3.5 font-bold text-stone-800">{prod.stock} {prod.unit}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              prod.isAvailable && prod.stock > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {prod.isAvailable && prod.stock > 0 ? 'Available' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(prod)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeModalTab === 'browse-global' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-[#FBF9F5]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search global products..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              <select
                value={globalCatFilter}
                onChange={(e) => setGlobalCatFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {GLOBAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {isLoadingGlobal ? (
              <div className="py-16 text-center text-xs font-bold text-stone-400">
                Loading Global Catalog...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {globalCatalogItems.map(gp => {
                  const isAlreadyInStore = existingGlobalIds.has(gp.id);

                  return (
                    <div 
                      key={gp.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isAlreadyInStore
                          ? 'bg-stone-50 border-stone-200 opacity-60'
                          : 'bg-white border-stone-200 hover:border-emerald-500 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={gp.imageUrl || gp.image_url} 
                          alt="" 
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-stone-900 text-xs truncate">{gp.name}</h5>
                          <p className="text-[10px] text-stone-500">{gp.brand} • {gp.unit}</p>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-bold">
                            {gp.category}
                          </span>
                        </div>
                      </div>

                      {isAlreadyInStore ? (
                        <span className="text-[10px] font-black text-stone-400 shrink-0 uppercase tracking-wider">
                          In Store ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningProduct(gp);
                            setAssignPrice('');
                            setAssignMrp('');
                            setAssignStock('50');
                            setAssignSku('');
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {assigningProduct && (
              <div className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h4 className="font-display font-extrabold text-base text-stone-900">Set Store Pricing</h4>
                      <p className="text-xs text-stone-500">{assigningProduct.name} ({assigningProduct.unit})</p>
                    </div>
                    <button onClick={() => setAssigningProduct(null)} className="text-stone-400 hover:text-stone-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAssignFromGlobal} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 150"
                        value={assignPrice}
                        onChange={(e) => setAssignPrice(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                        MRP (₹) (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 165"
                        value={assignMrp}
                        onChange={(e) => setAssignMrp(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                        Initial Stock Units
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        value={assignStock}
                        onChange={(e) => setAssignStock(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setAssigningProduct(null)}
                        className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAssigning}
                        className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-xs"
                      >
                        {isAssigning ? 'Adding...' : 'Add to Store'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-400 font-medium">UR GROZY Store Inventory Manager</span>
          <button
            onClick={closeStoreProductManager}
            className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <h3 className="font-display font-black text-lg text-white">
                {editingProduct ? 'Edit Store Product' : 'Add Custom Product'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#FBF9F5]">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  >
                    {GLOBAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Unit / Size</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Stock Level</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">Store SKU</label>
                  <input
                    type="text"
                    value={formData.storeSku}
                    onChange={(e) => setFormData({ ...formData, storeSku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-stone-100 rounded-xl text-xs font-bold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}