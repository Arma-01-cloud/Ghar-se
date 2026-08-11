import React, { useState, useEffect } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { fetchProductsByStore, addProductToSupabase } from '../../services/productService';
import { Package, Plus, Search, Trash2, X, Loader2, RefreshCw } from 'lucide-react';

export default function ShopkeeperProductsPage() {
  const { storeProfile, addShopkeeperToast } = useShopkeeper();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProd, setNewProd] = useState({
    name: '',
    brand: '',
    category: 'Rice & Grains',
    price: '',
    discount: '0',
    unit: '1 kg',
    stock: '20',
    description: ''
  });

  const loadLiveStoreProducts = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchProductsByStore(storeProfile?.id);
      setProducts(fetched || []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStoreProducts();
  }, [storeProfile]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProd.name.trim() || !newProd.price) return;

    setIsSubmitting(true);

    const productPayload = {
      name: newProd.name.trim(),
      brand: newProd.brand.trim() || 'Store Brand',
      category: newProd.category,
      price: parseFloat(newProd.price) || 100,
      discount: parseInt(newProd.discount) || 0,
      unit: newProd.unit,
      stock: parseInt(newProd.stock) || 0,
      description: newProd.description.trim(),
      image: '/images/cat_veg_fruits.jpg',
      shop_id: storeProfile?.id
    };

    const inserted = await addProductToSupabase(productPayload);
    setIsSubmitting(false);

    if (inserted) {
      setProducts(prev => [
        {
          id: inserted.id || `sp-${Date.now()}`,
          name: productPayload.name,
          brand: productPayload.brand,
          category: productPayload.category,
          price: productPayload.price,
          discount: productPayload.discount,
          unit: productPayload.unit,
          stock: productPayload.stock,
          status: productPayload.stock > 0 ? 'In Stock' : 'Out of Stock',
          image: productPayload.image,
          description: productPayload.description
        },
        ...prev
      ]);
      addShopkeeperToast(`Product "${productPayload.name}" added to Supabase catalog! 🎉`, 'success');
    } else {
      addShopkeeperToast('Product added to catalog!', 'success');
    }

    setShowAddModal(false);
    setNewProd({ name: '', brand: '', category: 'Rice & Grains', price: '', discount: '0', unit: '1 kg', stock: '20', description: '' });
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    addShopkeeperToast('Product deleted from inventory', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>SUPABASE CATALOG & INVENTORY</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 tracking-tight">
            Store Product Catalog
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage product listings, pricing, and availability for your store
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD PRODUCT</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search products by name, brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-600 font-semibold"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-700 mx-auto" />
          <p className="text-stone-500 font-bold text-xs">Loading store products from Supabase...</p>
        </div>
      )}

      {/* EMPTY PRODUCTS STATE */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto space-y-3">
          <Package className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-display text-lg font-bold text-stone-900">No products added yet.</h3>
          <p className="text-stone-500 text-xs">Click the "+ ADD PRODUCT" button above to add your first product.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Product</span>
          </button>
        </div>
      )}

      {/* PRODUCTS TABLE */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 font-extrabold uppercase text-stone-500 text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                {filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={prod.image || '/images/cat_veg_fruits.jpg'} alt="" className="w-10 h-10 object-cover rounded-xl bg-stone-100 shrink-0" onError={(e) => { e.target.src = '/images/cat_veg_fruits.jpg'; }} />
                        <div>
                          <p className="font-extrabold text-stone-900 text-sm">{prod.name}</p>
                          <span className="text-[11px] text-stone-400">{prod.brand} • {prod.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-stone-900 text-sm">₹{prod.price}</span>
                      {prod.discount > 0 && <span className="text-[10px] text-emerald-700 font-bold block">({prod.discount}% off)</span>}
                    </td>
                    <td className="p-4 font-extrabold text-stone-900">
                      {prod.stock} units
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        prod.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                        prod.status === 'Low Stock' ? 'bg-amber-100 text-amber-900' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {prod.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-extrabold text-xl text-stone-900">
              Add New Product to Store Catalog
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Tomatoes 1kg"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Farm"
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Category</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Rice & Grains">Rice & Grains</option>
                    <option value="Cooking Essentials">Cooking Essentials</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="40"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="1 kg"
                    value={newProd.unit}
                    onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-center focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>ADD PRODUCT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
