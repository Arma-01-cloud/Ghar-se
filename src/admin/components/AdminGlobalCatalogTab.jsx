import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';
import { 
  fetchGlobalCatalog, 
  fetchGlobalCatalogStats, 
  checkDuplicateGlobalProduct, 
  createGlobalProduct, 
  updateGlobalProduct, 
  deleteGlobalProduct, 
  uploadImageFile,
  GLOBAL_CATEGORIES 
} from '../services/adminService';
import AdminGlobalProductStoresModal from './AdminGlobalProductStoresModal';
import { 
  Package, Plus, Search, Edit2, Trash2, CheckCircle2, 
  XCircle, RefreshCw, Upload, Image as ImageIcon, Check, 
  Sparkles, AlertCircle, X, ArrowUpDown, Store, Eye,
  SlidersHorizontal, ChevronLeft, ChevronRight, Layers, Tag,
  Barcode, ShieldAlert
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Veg & Fruits', url: '/images/cat_veg_fruits.jpg' },
  { label: 'Dairy & Milk', url: '/images/cat_dairy_eggs.jpg' },
  { label: 'Cooking Oil', url: '/images/cat_cooking_oils.jpg' },
  { label: 'Atta & Rice', url: '/images/cat_rice_grains.jpg' },
  { label: 'Snacks', url: '/images/cat_snacks_biscuits.jpg' },
  { label: 'Beverages', url: '/images/cat_beverages_juices.jpg' }
];

export default function AdminGlobalCatalogTab() {
  const { addAdminToast } = useAdmin();

  // Catalog State
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  // Statistics State
  const [stats, setStats] = useState({
    totalGlobalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    productsWithStores: 0,
    productsWithoutStores: 0
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [selectedStoreUsage, setSelectedStoreUsage] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [brandsList, setBrandsList] = useState([]);

  // Store Assignment Modal State
  const [selectedProductForStores, setSelectedProductForStores] = useState(null);

  // Drawer Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Standard',
    category: 'Rice & Grains',
    subcategory: '',
    unit: '1 kg',
    quantity: '1',
    barcode: '',
    searchKeywords: '',
    imageUrl: '/images/cat_veg_fruits.jpg',
    description: '',
    isActive: true
  });

  // Live Duplicate Detection State
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const duplicateCheckTimer = useRef(null);

  // Load Catalog Data with server-side pagination & filters
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catalogRes, statsRes] = await Promise.all([
        fetchGlobalCatalog({
          page,
          limit,
          search: searchQuery,
          category: selectedCategory,
          brand: selectedBrand,
          isActive: selectedStatus,
          storeUsage: selectedStoreUsage,
          sortField,
          sortOrder
        }),
        fetchGlobalCatalogStats()
      ]);

      setProducts(catalogRes.products || []);
      setTotalCount(catalogRes.totalCount || 0);
      setTotalPages(catalogRes.totalPages || 1);
      if (catalogRes.brands && catalogRes.brands.length > 0) {
        setBrandsList(catalogRes.brands);
      }
      setStats(statsRes);
    } catch (err) {
      console.error('Error loading global catalog:', err);
      addAdminToast('Error fetching global catalog records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, selectedCategory, selectedBrand, selectedStatus, selectedStoreUsage, sortField, sortOrder, addAdminToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search Input Change (Reset to page 1)
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Live Duplicate Detection during typing
  useEffect(() => {
    if (!isFormOpen) {
      setDuplicateWarning(null);
      return;
    }

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setDuplicateWarning(null);
      return;
    }

    if (duplicateCheckTimer.current) {
      clearTimeout(duplicateCheckTimer.current);
    }

    duplicateCheckTimer.current = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      const res = await checkDuplicateGlobalProduct({
        name: formData.name,
        brand: formData.brand,
        unit: formData.unit,
        quantity: formData.quantity,
        barcode: formData.barcode,
        excludeId: editingProduct?.id || null
      });
      setIsCheckingDuplicate(false);

      if (res.hasDuplicate) {
        setDuplicateWarning(res);
      } else {
        setDuplicateWarning(null);
      }
    }, 450);

    return () => {
      if (duplicateCheckTimer.current) clearTimeout(duplicateCheckTimer.current);
    };
  }, [formData.name, formData.brand, formData.unit, formData.barcode, isFormOpen, editingProduct]);

  // Open Form for Adding New Global Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setDuplicateWarning(null);
    setFormData({
      name: '',
      brand: 'Standard',
      category: 'Rice & Grains',
      subcategory: '',
      unit: '1 kg',
      quantity: '1',
      barcode: '',
      searchKeywords: '',
      imageUrl: '/images/cat_rice_grains.jpg',
      description: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Global Product
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setDuplicateWarning(null);
    setFormData({
      name: prod.name,
      brand: prod.brand || 'Standard',
      category: prod.category || 'Rice & Grains',
      subcategory: prod.subcategory || '',
      unit: prod.unit || '1 kg',
      quantity: String(prod.quantity || 1),
      barcode: prod.barcode || '',
      searchKeywords: prod.searchKeywords || '',
      imageUrl: prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg',
      description: prod.description || '',
      isActive: prod.isActive !== false && prod.is_active !== false
    });
    setIsFormOpen(true);
  };

  // Handle Image File Upload via Compressor
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const dataUrl = await uploadImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      addAdminToast('Image compressed and attached! ✓', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      addAdminToast(err.message || 'Image processing failed', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit Form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addAdminToast('Product name is required.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (editingProduct) {
      // Update Global Product
      const success = await updateGlobalProduct(editingProduct.id, {
        name: formData.name.trim(),
        brand: formData.brand.trim() || 'Standard',
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        unit: formData.unit.trim(),
        quantity: parseFloat(formData.quantity) || 1,
        barcode: formData.barcode.trim(),
        searchKeywords: formData.searchKeywords.trim(),
        imageUrl: formData.imageUrl,
        description: formData.description.trim(),
        isActive: formData.isActive
      });

      setIsSubmitting(false);

      if (success) {
        addAdminToast(`✨ Global product "${formData.name}" updated!`, 'success');
        setIsFormOpen(false);
        await loadData();
      } else {
        addAdminToast('Failed to update global product.', 'error');
      }
    } else {
      // Create Global Product
      const created = await createGlobalProduct({
        name: formData.name.trim(),
        brand: formData.brand.trim() || 'Standard',
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        unit: formData.unit.trim(),
        quantity: parseFloat(formData.quantity) || 1,
        barcode: formData.barcode.trim(),
        searchKeywords: formData.searchKeywords.trim(),
        imageUrl: formData.imageUrl,
        description: formData.description.trim(),
        isActive: formData.isActive
      });

      setIsSubmitting(false);

      if (created) {
        addAdminToast(`🎉 Added "${formData.name}" to Global Product Catalog!`, 'success');
        setIsFormOpen(false);
        await loadData();
      } else {
        addAdminToast('Failed to create global product.', 'error');
      }
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (prod) => {
    const nextStatus = !prod.isActive;
    const success = await updateGlobalProduct(prod.id, {
      ...prod,
      isActive: nextStatus
    });

    if (success) {
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isActive: nextStatus, is_active: nextStatus } : p));
      addAdminToast(`Product status set to ${nextStatus ? '🟢 ACTIVE' : '⚪ INACTIVE'}`, 'info');
      const statsRes = await fetchGlobalCatalogStats();
      setStats(statsRes);
    } else {
      addAdminToast('Failed to update status.', 'error');
    }
  };

  // Delete Global Product
  const handleDelete = async (prod) => {
    if (prod.storesCount > 0) {
      const confirmDeact = window.confirm(
        `"${prod.name}" is currently carried by ${prod.storesCount} store(s).\n\nDeleting it will remove it from all store inventories. Are you sure you want to proceed?`
      );
      if (!confirmDeact) return;
    } else {
      if (!window.confirm(`Are you sure you want to delete "${prod.name}" from the global catalog?`)) {
        return;
      }
    }

    const success = await deleteGlobalProduct(prod.id);
    if (success) {
      addAdminToast(`Deleted "${prod.name}" from global catalog.`, 'info');
      await loadData();
    } else {
      addAdminToast('Failed to delete product.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER & KPI STATS CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              <span>CENTRALIZED MARKETPLACE REPOSITORY</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
              Global Product Catalog
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              One central product identity assigned to multiple grocery stores with isolated store pricing & inventory
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Global Product</span>
          </button>
        </div>

        {/* 5 KPI STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Total Catalog Items</span>
            <span className="font-display font-black text-2xl text-stone-900 mt-1 block">{stats.totalGlobalProducts}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Active Products</span>
            <span className="font-display font-black text-2xl text-emerald-800 mt-1 block">{stats.activeProducts}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Inactive Products</span>
            <span className="font-display font-black text-2xl text-stone-500 mt-1 block">{stats.inactiveProducts}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Carried by Stores</span>
            <span className="font-display font-black text-2xl text-blue-800 mt-1 block">{stats.productsWithStores}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Unassigned Items</span>
            <span className="font-display font-black text-2xl text-amber-800 mt-1 block">{stats.productsWithoutStores}</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* SEARCH INPUT */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, brand, barcode, keywords..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* CATEGORY FILTER */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="all">All Categories</option>
              {GLOBAL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* BRAND FILTER */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="all">All Brands</option>
              {brandsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* ACTIVE STATUS FILTER */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* STORE USAGE FILTER */}
          <div>
            <select
              value={selectedStoreUsage}
              onChange={(e) => { setSelectedStoreUsage(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="all">Stores: All</option>
              <option value="assigned">In Stores</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

        </div>

        {/* SECOND ROW: SORTING, PAGE SIZE & REFRESH */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs font-semibold text-stone-500">
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-800"
            >
              <option value="created_at">Recently Created</option>
              <option value="name">Product Name (A-Z)</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl font-bold text-stone-700 flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortOrder.toUpperCase()}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-800"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 text-stone-700 transition-colors cursor-pointer"
              title="Refresh Catalog Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CATALOG DATA TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-500">Fetching Global Catalog Records...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-display font-extrabold text-base text-stone-800">No Global Products Found</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No products matched your search or filters. Click below to add a new product.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Add First Global Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-stone-400 font-black text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Product Identity</th>
                  <th className="p-4">Category & Subcategory</th>
                  <th className="p-4">Unit / Size</th>
                  <th className="p-4">Barcode</th>
                  <th className="p-4">Stores Carrying</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors group">
                    
                    {/* PRODUCT IDENTITY (IMAGE, NAME, BRAND) */}
                    <td className="p-4">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={prod.imageUrl || prod.image_url || '/images/cat_veg_fruits.jpg'} 
                          alt={prod.name} 
                          className="w-12 h-12 rounded-2xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                          onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-display font-black text-stone-900 text-sm truncate max-w-xs">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-2 py-0.2 rounded-md bg-stone-100 text-stone-600 font-bold border border-stone-200">
                              {prod.brand || 'Standard'}
                            </span>
                            {prod.searchKeywords && (
                              <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                                {prod.searchKeywords}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY & SUBCATEGORY */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-stone-900 block">
                          {prod.category || 'General Groceries'}
                        </span>
                        {prod.subcategory && (
                          <span className="text-[10px] text-stone-400 font-medium block">
                            {prod.subcategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* UNIT / PACKAGE SIZE */}
                    <td className="p-4 font-bold text-stone-800">
                      <span className="px-2 py-0.5 bg-stone-100 rounded-lg text-xs border border-stone-200">
                        {prod.unit || '1 kg'}
                      </span>
                    </td>

                    {/* BARCODE */}
                    <td className="p-4 font-mono text-stone-500 text-[11px]">
                      {prod.barcode ? (
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-stone-400" />
                          <span>{prod.barcode}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>

                    {/* STORES CARRYING (CLICKABLE CHIP) */}
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedProductForStores(prod)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          prod.storesCount > 0
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500 border border-stone-200'
                        }`}
                        title="Click to view and manage stores carrying this product"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{prod.storesCount} {prod.storesCount === 1 ? 'Store' : 'Stores'}</span>
                      </button>
                    </td>

                    {/* ACTIVE STATUS TOGGLE */}
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(prod)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                          prod.isActive
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500 border border-stone-300'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProductForStores(prod)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="Manage Store Pricing & Stock"
                        >
                          <Store className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="Edit Global Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Delete Product"
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

        {/* 4. PAGINATION FOOTER */}
        <div className="p-4 bg-stone-50/70 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500 font-semibold">
          <div>
            Showing <span className="font-bold text-stone-900">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-stone-900">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-bold text-stone-900">{totalCount}</span> products
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-bold text-stone-800">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. ADD / EDIT GLOBAL PRODUCT DRAWER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
            
            {/* DRAWER HEADER */}
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    {editingProduct ? 'Edit Global Product' : 'Add New Global Product'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Defines the central identity shared across all store inventories
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DRAWER FORM BODY */}
            <form onSubmit={handleSubmit} id="global-product-form" className="p-6 space-y-5 overflow-y-auto flex-1 bg-[#FBF9F5]">
              
              {/* DUPLICATE WARNING BANNER (REAL-TIME DETECTION) */}
              {duplicateWarning && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2 shadow-xs animate-shake">
                  <div className="flex items-start gap-2.5 text-amber-900">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-xs uppercase tracking-wide">
                        Possible Duplicate Detected!
                      </h5>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {duplicateWarning.matchReason}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {duplicateWarning.duplicates.slice(0, 3).map(dup => (
                      <div key={dup.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={dup.image_url || dup.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-stone-100" />
                          <div>
                            <span className="font-bold text-stone-900 block">{dup.name}</span>
                            <span className="text-[10px] text-stone-500">{dup.brand} • {dup.category} • {dup.unit}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dup)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-[10px] rounded-lg transition-colors"
                        >
                          Edit Existing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCT NAME */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. India Gate Basmati Rice 5kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              {/* BRAND & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Brand *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India Gate, Fortune, Aashirvaad"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    {GLOBAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUBCATEGORY & UNIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Subcategory (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Basmati Rice, Sunflower Oil"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Unit / Size *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 kg, 5 kg, 500 ml, 1 L, pack"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              {/* BARCODE & SEARCH KEYWORDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Barcode (Optional)
                  </label>
                  <div className="relative">
                    <Barcode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. 8901030384920"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                    Search Keywords
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. chawal, atta, oil, cooking"
                    value={formData.searchKeywords}
                    onChange={(e) => setFormData({ ...formData, searchKeywords: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Premium long grain basmati rice..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              {/* PRODUCT IMAGE & PRESETS */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-700 uppercase tracking-wider block">
                  Product Image
                </label>
                
                <div className="flex items-center gap-3">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover bg-stone-100 border border-stone-300 shrink-0"
                    onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }}
                  />

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Compressing...' : 'Upload Local Image (Max 5MB)'}</span>
                    </button>
                  </div>
                </div>

                {/* IMAGE PRESET GALLERY CHIPS */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-stone-400 block mb-1.5">Or select a standard grocery preset image:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.imageUrl === preset.url
                            ? 'bg-emerald-100 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-5 h-5 rounded-md object-cover" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTIVE STATUS TOGGLE */}
              <div className="pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded-md border-stone-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Product is Active across Platform Catalog</span>
                </label>
              </div>

            </form>

            {/* DRAWER FOOTER */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="global-product-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingProduct ? 'Update Global Product' : 'Create Global Product'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. STORE ASSIGNMENT MODAL */}
      {selectedProductForStores && (
        <AdminGlobalProductStoresModal
          product={selectedProductForStores}
          onClose={() => setSelectedProductForStores(null)}
          onUpdated={loadData}
        />
      )}

    </div>
  );
}
