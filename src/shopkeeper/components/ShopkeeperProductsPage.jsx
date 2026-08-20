import React, { useState, useEffect } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { 
  fetchProductsByStore, 
  addProductToSupabase, 
  updateProductAvailabilityInSupabase 
} from '../../services/productService';
import { 
  fetchGlobalCatalog, 
  assignProductToStore, 
  updateStoreProductPricing, 
  removeProductFromStore,
  GLOBAL_CATEGORIES 
} from '../../services/globalCatalogService';
import { 
  Package, Plus, Search, Trash2, X, Loader2, RefreshCw, 
  CheckCircle2, Edit2, Check, IndianRupee, Tag,
  AlertCircle, ChevronDown
} from 'lucide-react';

export default function ShopkeeperProductsPage() {
  const { storeProfile, authUser, addShopkeeperToast } = useShopkeeper();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // "Add from Global Catalog" Modal State
  const [showGlobalCatalogModal, setShowGlobalCatalogModal] = useState(false);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalCategory, setGlobalCategory] = useState('all');
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  
  // Selected Global Product for Assignment
  const [selectedGlobalProd, setSelectedGlobalProd] = useState(null);
  const [myPrice, setMyPrice] = useState('');
  const [myMrp, setMyMrp] = useState('');
  const [myAvailable, setMyAvailable] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Edit Store Product Modal State
  const [editingStoreProd, setEditingStoreProd] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Custom Product Creation Modal State
  const [showCustomAddModal, setShowCustomAddModal] = useState(false);
  const [customProd, setCustomProd] = useState({
    name: '',
    category: 'Rice & Grains',
    price: '',
    mrp: '',
    unit: '1 kg',
    description: '',
    isAvailable: true
  });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Helper to resolve active shop ID reliably
  const getActiveStoreId = () => {
    if (storeProfile?.id) return storeProfile.id;
    try {
      const saved = localStorage.getItem('gharsee_store_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) return parsed.id;
      }
    } catch {}
    return authUser?.id || null;
  };

  const loadLiveStoreProducts = async () => {
    const storeId = getActiveStoreId();
    if (!storeId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetched = await fetchProductsByStore(storeId);
      setProducts(fetched || []);
    } catch (err) {
      console.error('Error loading store products:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStoreProducts();
  }, [storeProfile]);

  // Load Global Catalog when modal opens or filter changes
  useEffect(() => {
    if (showGlobalCatalogModal) {
      loadGlobalCatalog();
    }
  }, [showGlobalCatalogModal, globalSearch, globalCategory]);

  const loadGlobalCatalog = async () => {
    setIsLoadingGlobal(true);
    try {
      const res = await fetchGlobalCatalog({
        limit: 50,
        search: globalSearch,
        category: globalCategory,
        isActive: 'active'
      });
      setGlobalProducts(res.products || []);
    } catch (err) {
      console.error('Error fetching global catalog for shopkeeper:', err);
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  // Filter store products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && (p.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter === 'available' && (p.isAvailable === false || p.is_available === false)) return false;
    if (statusFilter === 'unavailable' && (p.isAvailable !== false && p.is_available !== false)) return false;
    return true;
  });

  // Existing store products global ID set
  const existingGlobalIds = new Set(products.map(p => p.globalProductId || p.id || p.name.toLowerCase()));

  // Open Add Flow for a Global Product
  const handleSelectGlobalProduct = (prod) => {
    setSelectedGlobalProd(prod);
    setMyPrice(prod.price ? String(prod.price) : '');
    setMyMrp(prod.mrp ? String(prod.mrp) : (prod.price ? String(prod.price) : ''));
    setMyAvailable(true);
  };

  // Submit adding from Global Catalog
  const handleAddFromGlobalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGlobalProd) return;

    const storeId = getActiveStoreId();
    if (!storeId) {
      addShopkeeperToast('Store profile not identified. Please try logging in again.', 'error');
      return;
    }

    const priceNum = myPrice ? parseFloat(myPrice) : (selectedGlobalProd.price || 0);
    const mrpNum = myMrp ? parseFloat(myMrp) : (selectedGlobalProd.mrp || priceNum);

    setIsAssigning(true);
    try {
      const assigned = await assignProductToStore({
        storeId: storeId,
        globalProductId: selectedGlobalProd.id,
        price: priceNum,
        mrp: mrpNum,
        isAvailable: myAvailable
      });

      if (assigned) {
        addShopkeeperToast(`✨ Added "${selectedGlobalProd.name}" to your store!`, 'success');
        setSelectedGlobalProd(null);
        setShowGlobalCatalogModal(false);
        await loadLiveStoreProducts();
      } else {
        addShopkeeperToast('Failed to add product to store. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error assigning product:', err);
      addShopkeeperToast('Error connecting to database.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Quick toggle availability directly from table dropdown
  const handleQuickToggleAvailability = async (prod, nextAvailable) => {
    const prodId = prod.storeProductId || prod.id;
    
    // Optimistic UI update
    setProducts(prev => prev.map(p => 
      (p.storeProductId || p.id) === prodId 
        ? { ...p, isAvailable: nextAvailable, is_available: nextAvailable, status: nextAvailable ? 'Available' : 'Unavailable' }
        : p
    ));

    const success = await updateProductAvailabilityInSupabase(prodId, nextAvailable);
    if (success) {
      addShopkeeperToast(
        nextAvailable 
          ? `🟢 "${prod.name}" marked as AVAILABLE (Customers can now buy)`
          : `🔴 "${prod.name}" marked as UNAVAILABLE (Hidden from customers)`,
        nextAvailable ? 'success' : 'info'
      );
    } else {
      addShopkeeperToast('Failed to update status in Supabase.', 'error');
      await loadLiveStoreProducts();
    }
  };

  // Start editing existing store product
  const handleStartEdit = (prod) => {
    setEditingStoreProd(prod);
    setEditPrice(String(prod.price || ''));
    setEditMrp(String(prod.mrp || prod.price || ''));
    setEditAvailable(prod.isAvailable !== false && prod.is_available !== false);
  };

  // Save edited store product
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStoreProd) return;

    const prodId = editingStoreProd.storeProductId || editingStoreProd.id;
    const priceNum = editPrice ? parseFloat(editPrice) : (editingStoreProd.price || 0);
    const mrpNum = editMrp ? parseFloat(editMrp) : (editingStoreProd.mrp || priceNum);

    setIsSavingEdit(true);
    const success = await updateStoreProductPricing({
      storeProductId: prodId,
      price: priceNum,
      mrp: mrpNum,
      isAvailable: editAvailable
    });
    setIsSavingEdit(false);

    if (success) {
      addShopkeeperToast(`✓ Updated details for "${editingStoreProd.name}"`, 'success');
      setEditingStoreProd(null);
      await loadLiveStoreProducts();
    } else {
      addShopkeeperToast('Failed to update product in Supabase.', 'error');
    }
  };

  // Delete product from store
  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to remove "${prod.name}" from your store?`)) {
      return;
    }

    const prodId = prod.storeProductId || prod.id;
    const success = await removeProductFromStore(prodId);
    if (success) {
      setProducts(prev => prev.filter(p => (p.storeProductId || p.id) !== prodId));
      addShopkeeperToast(`Removed "${prod.name}" from your store`, 'info');
    } else {
      addShopkeeperToast('Failed to remove product.', 'error');
    }
  };

  // Submit custom product
  const handleCustomAddSubmit = async (e) => {
    e.preventDefault();
    const storeId = getActiveStoreId();
    if (!customProd.name.trim() || !storeId) {
      addShopkeeperToast('Please enter product name.', 'error');
      return;
    }

    setIsSubmittingCustom(true);
    const inserted = await addProductToSupabase({
      name: customProd.name.trim(),
      category: customProd.category || 'General Groceries',
      price: parseFloat(customProd.price) || 0,
      mrp: customProd.mrp ? parseFloat(customProd.mrp) : parseFloat(customProd.price || 0),
      unit: customProd.unit || '1 kg',
      description: customProd.description ? customProd.description.trim() : '',
      image: '/images/cat_veg_fruits.jpg',
      shop_id: storeId,
      isAvailable: customProd.isAvailable
    });
    setIsSubmittingCustom(false);

    if (inserted) {
      addShopkeeperToast(`🎉 "${customProd.name}" added to your store!`, 'success');
      setShowCustomAddModal(false);
      setCustomProd({ name: '', category: 'Rice & Grains', price: '', mrp: '', unit: '1 kg', description: '', isAvailable: true });
      await loadLiveStoreProducts();
    } else {
      addShopkeeperToast('Failed to add product.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>GLOBAL CATALOG & STORE INVENTORY</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Store Product Inventory
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Pick products from the UR GROZY Global Catalog and manage your store pricing & availability status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomAddModal(true)}
            className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Item</span>
          </button>

          <button
            onClick={() => setShowGlobalCatalogModal(true)}
            className="py-3 px-5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>+ Add from Global Catalog</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search your store products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden"
        >
          <option value="all">All Categories</option>
          {GLOBAL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden"
        >
          <option value="all">All Status</option>
          <option value="available">🟢 Available Only</option>
          <option value="unavailable">🔴 Unavailable Only</option>
        </select>

        <button
          onClick={loadLiveStoreProducts}
          disabled={isLoading}
          className="p-2 text-stone-500 hover:text-stone-800 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-7 h-7 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-400">Loading store inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <div>
              <h4 className="font-display font-extrabold text-base text-stone-800">No Products in Your Store</h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                Select grocery items from the platform Global Catalog to start selling in your store.
              </p>
            </div>
            <button
              onClick={() => setShowGlobalCatalogModal(true)}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Browse Global Catalog
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-stone-400 font-black text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">My Price (₹)</th>
                  <th className="p-4">MRP (₹)</th>
                  <th className="p-4">Availability Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                {filteredProducts.map(prod => {
                  const isAvailable = prod.isAvailable !== false && prod.is_available !== false;

                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                      
                      {/* PRODUCT NAME & BRAND */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={prod.image || prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg'} 
                            alt="" 
                            className="w-11 h-11 object-cover rounded-xl bg-stone-100 border border-stone-200 shrink-0"
                            onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                          />
                          <div>
                            <p className="font-extrabold text-stone-900 text-sm">{prod.name}</p>
                            <span className="text-[10px] text-stone-400">{prod.unit || '1 kg'}</span>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="p-4 text-stone-600 font-medium">
                        {prod.category}
                      </td>

                      {/* PRICE */}
                      <td className="p-4 font-display font-black text-stone-900 text-sm">
                        ₹{prod.price || 0}
                      </td>

                      {/* MRP */}
                      <td className="p-4 text-stone-400">
                        ₹{prod.mrp || prod.price || 0}
                      </td>

                      {/* AVAILABILITY DROPDOWN (SCROLL DOWN BUTTON) */}
                      <td className="p-4">
                        <div className="inline-block relative">
                          <select
                            value={isAvailable ? 'available' : 'unavailable'}
                            onChange={(e) => handleQuickToggleAvailability(prod, e.target.value === 'available')}
                            className={`pl-3 pr-8 py-1.5 rounded-xl text-xs font-black appearance-none cursor-pointer border shadow-2xs transition-all ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-600/30'
                                : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 focus:ring-2 focus:ring-rose-600/30'
                            }`}
                          >
                            <option value="available">🟢 Available</option>
                            <option value="unavailable">🔴 Unavailable</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
                            title="Edit Price & Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
                            title="Remove from Store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. BROWSE GLOBAL CATALOG MODAL */}
      {showGlobalCatalogModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">
                    Add from UR GROZY Global Catalog
                  </h3>
                  <p className="text-xs text-stone-400">
                    Search central marketplace products and set your store selling price & status
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGlobalCatalogModal(false)}
                className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEARCH & FILTERS IN MODAL */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search global products by name, category..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              <select
                value={globalCategory}
                onChange={(e) => setGlobalCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {GLOBAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* GLOBAL PRODUCTS LIST */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#FBF9F5]">
              {isLoadingGlobal ? (
                <div className="py-16 text-center text-xs font-bold text-stone-400">
                  <Loader2 className="w-6 h-6 text-emerald-700 animate-spin mx-auto mb-2" />
                  Loading Global Catalog...
                </div>
              ) : globalProducts.length === 0 ? (
                <div className="py-16 text-center text-xs font-bold text-stone-400 space-y-2">
                  <p>No products found matching "{globalSearch}".</p>
                  <button
                    onClick={() => {
                      setShowGlobalCatalogModal(false);
                      setShowCustomAddModal(true);
                    }}
                    className="text-emerald-800 font-extrabold hover:underline cursor-pointer"
                  >
                    + Add Custom Item to Store
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {globalProducts.map(gp => {
                    const isAlreadyInStore = products.some(p => (p.name || '').toLowerCase() === (gp.name || '').toLowerCase());

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
                            src={gp.imageUrl || gp.image_url || '/images/cat_veg_fruits.jpg'} 
                            alt="" 
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0" 
                            onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                          />
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-stone-900 text-xs truncate">{gp.name}</h5>
                            <p className="text-[10px] text-stone-500">{gp.unit || '1 kg'}</p>
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
                            onClick={() => handleSelectGlobalProduct(gp)}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
                          >
                            + Select
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">
                {globalProducts.length} Global Products Available
              </span>
              <button
                onClick={() => setShowGlobalCatalogModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. SET STORE PRICING & STATUS DIALOG OVERLAY */}
      {selectedGlobalProd && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedGlobalProd.imageUrl || selectedGlobalProd.image_url || '/images/cat_veg_fruits.jpg'} 
                  alt="" 
                  className="w-10 h-10 rounded-xl object-cover bg-stone-100 shrink-0" 
                  onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                />
                <div>
                  <h4 className="font-display font-extrabold text-sm text-stone-900">{selectedGlobalProd.name}</h4>
                  <p className="text-[11px] text-stone-500">{selectedGlobalProd.category} • {selectedGlobalProd.unit}</p>
                </div>
              </div>
              <button onClick={() => setSelectedGlobalProd(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFromGlobalSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Your Selling Price (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 145"
                    value={myPrice}
                    onChange={(e) => setMyPrice(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  MRP (₹) (Optional)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 160"
                  value={myMrp}
                  onChange={(e) => setMyMrp(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              {/* AVAILABILITY DROPDOWN (SCROLL DOWN BUTTON) */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Product Status *
                </label>
                <div className="relative">
                  <select
                    value={myAvailable ? 'available' : 'unavailable'}
                    onChange={(e) => setMyAvailable(e.target.value === 'available')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 appearance-none focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 cursor-pointer"
                  >
                    <option value="available">🟢 Available (In Stock & Orderable)</option>
                    <option value="unavailable">🔴 Unavailable (Out of Stock)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedGlobalProd(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {isAssigning ? 'Adding...' : 'Add to My Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT STORE PRODUCT MODAL */}
      {editingStoreProd && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-display font-extrabold text-base text-stone-900">Edit Price & Status</h4>
                <p className="text-xs text-stone-500">{editingStoreProd.name}</p>
              </div>
              <button onClick={() => setEditingStoreProd(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="number"
                    step="0.5"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editMrp}
                  onChange={(e) => setEditMrp(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              {/* AVAILABILITY DROPDOWN (SCROLL DOWN BUTTON) */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Product Status *
                </label>
                <div className="relative">
                  <select
                    value={editAvailable ? 'available' : 'unavailable'}
                    onChange={(e) => setEditAvailable(e.target.value === 'available')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 appearance-none focus:outline-hidden cursor-pointer"
                  >
                    <option value="available">🟢 Available (In Stock)</option>
                    <option value="unavailable">🔴 Unavailable (Out of Stock)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingStoreProd(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CUSTOM PRODUCT ADD MODAL */}
      {showCustomAddModal && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-display font-extrabold text-base text-stone-900">Add Custom Product</h4>
              <button onClick={() => setShowCustomAddModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local Organic Jaggery"
                  value={customProd.name}
                  onChange={(e) => setCustomProd({ ...customProd, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="80"
                    value={customProd.price}
                    onChange={(e) => setCustomProd({ ...customProd, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="90"
                    value={customProd.mrp}
                    onChange={(e) => setCustomProd({ ...customProd, mrp: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={customProd.category}
                    onChange={(e) => setCustomProd({ ...customProd, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  >
                    {GLOBAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                    Unit / Size
                  </label>
                  <input
                    type="text"
                    placeholder="1 kg"
                    value={customProd.unit}
                    onChange={(e) => setCustomProd({ ...customProd, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block mb-1">
                  Product Status *
                </label>
                <div className="relative">
                  <select
                    value={customProd.isAvailable ? 'available' : 'unavailable'}
                    onChange={(e) => setCustomProd({ ...customProd, isAvailable: e.target.value === 'available' })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 appearance-none focus:outline-hidden cursor-pointer"
                  >
                    <option value="available">🟢 Available (In Stock)</option>
                    <option value="unavailable">🔴 Unavailable (Out of Stock)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCustomAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmittingCustom ? 'Adding...' : 'Add Custom Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}