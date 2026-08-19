import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  fetchAllAdminShops, 
  approveShopInSupabase, 
  rejectShopInSupabase, 
  toggleShopStatusInSupabase,
  fetchAllAdminRiders, 
  approveRiderInSupabase, 
  rejectRiderInSupabase,
  fetchAllAdminCustomers,
  fetchAllAdminOrders,
  updateAdminOrderStatus,
  fetchProductsForShop,
  createProductForShop,
  updateProductInSupabase,
  deleteProductInSupabase,
  fetchGlobalCatalogProducts,
  createGlobalCatalogProduct
} from '../services/adminService';

const AdminContext = createContext(null);

const ADMIN_PASSWORD_HASH = 'arman@1234';

export function AdminProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('gharsee_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [shops, setShops] = useState([]);
  const [riders, setRiders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGlobalProducts, setIsLoadingGlobalProducts] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Add Toast Notification
  const addAdminToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Login handler strictly requiring arman@1234
  const login = (password, username = 'Admin') => {
    if (!password) {
      return { 
        success: false, 
        error: 'Please enter the administrator access password.' 
      };
    }

    if (password.trim() === ADMIN_PASSWORD_HASH) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('gharsee_admin_authenticated', 'true');
        sessionStorage.setItem('gharsee_admin_user', username);
      } catch {}
      addAdminToast('Welcome to UR GROZY Admin Command Center 🛡️', 'success');
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Access Denied: Invalid administrator credentials. Access to this command console is strictly restricted.' 
    };
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('gharsee_admin_authenticated');
      sessionStorage.removeItem('gharsee_admin_user');
    } catch {}
    addAdminToast('Administrator session ended securely.', 'info');
  };

  // Load "Shop From Any Store" Global Catalog
  const loadGlobalProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGlobalProducts(true);
    const prods = await fetchGlobalCatalogProducts();
    setGlobalProducts(prods);
    setIsLoadingGlobalProducts(false);
  }, [isAuthenticated]);

  // Refresh all dashboard collections from Supabase
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    try {
      const [shopsData, ridersData, customersData, ordersData] = await Promise.all([
        fetchAllAdminShops(),
        fetchAllAdminRiders(),
        fetchAllAdminCustomers(),
        fetchAllAdminOrders()
      ]);

      setShops(shopsData);
      setRiders(ridersData);
      setCustomers(customersData);
      setOrders(ordersData);
      await loadGlobalProducts();
    } catch (err) {
      console.error('Error refreshing admin data:', err);
      addAdminToast('Error fetching latest platform records.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, addAdminToast, loadGlobalProducts]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  // Real-time polling
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  // Actions: Approve Shop
  const approveShop = async (shopId, shopName = 'Store') => {
    const success = await approveShopInSupabase(shopId);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isPending: false, isApproved: true, status: 'open', isOpen: true } : s));
      addAdminToast(`🎉 Store "${shopName}" approved & open on customer app!`, 'success');
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      } catch {}
      await refreshData();
    } else {
      addAdminToast(`Failed to approve store "${shopName}".`, 'error');
    }
    return success;
  };

  // Actions: Reject Shop
  const rejectShop = async (shopId, shopName = 'Store', reason = 'Admin rejection') => {
    const success = await rejectShopInSupabase(shopId, reason);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isPending: false, isApproved: false, status: 'rejected', isOpen: false } : s));
      addAdminToast(`Store "${shopName}" rejected.`, 'info');
      await refreshData();
    } else {
      addAdminToast(`Failed to reject store "${shopName}".`, 'error');
    }
    return success;
  };

  // Actions: Toggle Shop Online / Offline
  const toggleShop = async (shopId, currentIsOpen) => {
    const nextState = !currentIsOpen;
    const success = await toggleShopStatusInSupabase(shopId, currentIsOpen);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isOpen: nextState, status: nextState ? 'open' : 'closed' } : s));
      addAdminToast(`Store status updated: ${nextState ? '🟢 OPEN' : '🔴 CLOSED'}`, 'info');
    }
    return success;
  };

  // Actions: Approve Rider
  const approveRider = async (riderId, riderName = 'Rider') => {
    const success = await approveRiderInSupabase(riderId);
    if (success) {
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isPending: false, isApproved: true, status: 'active', isOnline: true } : r));
      addAdminToast(`🎉 Delivery Partner "${riderName}" approved & verified!`, 'success');
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      } catch {}
      await refreshData();
    } else {
      addAdminToast(`Failed to approve rider "${riderName}".`, 'error');
    }
    return success;
  };

  // Actions: Reject Rider
  const rejectRider = async (riderId, riderName = 'Rider', reason = 'Verification incomplete') => {
    const success = await rejectRiderInSupabase(riderId, reason);
    if (success) {
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isPending: false, isApproved: false, status: 'rejected', isOnline: false } : r));
      addAdminToast(`Rider application for "${riderName}" rejected.`, 'info');
      await refreshData();
    } else {
      addAdminToast(`Failed to reject rider "${riderName}".`, 'error');
    }
    return success;
  };

  // Actions: Update Order Status
  const updateOrderStatus = async (orderId, nextStatus) => {
    const success = await updateAdminOrderStatus(orderId, nextStatus);
    if (success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      addAdminToast(`Order #${orderId} status set to ${nextStatus.toUpperCase()}`, 'success');
    }
    return success;
  };

  // Store Products Inventory State (Store-Specific)
  const [selectedStoreForProducts, setSelectedStoreForProducts] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Load products for a store
  const loadStoreProducts = useCallback(async (shopId) => {
    if (!shopId) return;
    setIsLoadingProducts(true);
    const prods = await fetchProductsForShop(shopId);
    setStoreProducts(prods);
    setIsLoadingProducts(false);
  }, []);

  // Open Product Manager for a Specific Store
  const openStoreProductManager = async (store) => {
    setSelectedStoreForProducts(store);
    await loadStoreProducts(store.id);
  };

  const closeStoreProductManager = () => {
    setSelectedStoreForProducts(null);
    setStoreProducts([]);
  };

  // Add Product to Store
  const addProductToStore = async (shopId, productData) => {
    const created = await createProductForShop(shopId, productData);
    if (created) {
      addAdminToast(`✨ Added "${productData.name}" to store catalog!`, 'success');
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {}
      await loadStoreProducts(shopId);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, productCount: (s.productCount || 0) + 1 } : s));
      return { success: true, product: created };
    } else {
      addAdminToast(`Failed to add "${productData.name}".`, 'error');
      return { success: false };
    }
  };

  // Update Existing Product (Store or Global)
  const updateProduct = async (productId, productData, shopId = null) => {
    const success = await updateProductInSupabase(productId, productData);
    if (success) {
      addAdminToast(`Item "${productData.name}" updated successfully!`, 'success');
      if (shopId) {
        await loadStoreProducts(shopId);
      }
      await loadGlobalProducts();
      return true;
    } else {
      addAdminToast(`Failed to update item.`, 'error');
      return false;
    }
  };

  // Delete Product (Store or Global)
  const deleteProduct = async (productId, productName = 'Product', shopId = null) => {
    const success = await deleteProductInSupabase(productId);
    if (success) {
      addAdminToast(`Deleted "${productName}" from catalog.`, 'info');
      if (shopId) {
        await loadStoreProducts(shopId);
        setShops(prev => prev.map(s => s.id === shopId ? { ...s, productCount: Math.max(0, (s.productCount || 1) - 1) } : s));
      }
      await loadGlobalProducts();
      return true;
    } else {
      addAdminToast(`Failed to delete item.`, 'error');
      return false;
    }
  };

  // Add Item to "Shop From Any Store" Global Catalog
  const addGlobalProduct = async (productData) => {
    const created = await createGlobalCatalogProduct(productData);
    if (created) {
      addAdminToast(`✨ Added "${productData.name}" to 'Shop From Any Store' catalog!`, 'success');
      try {
        confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
      } catch {}
      await loadGlobalProducts();
      return { success: true, product: created };
    } else {
      addAdminToast(`Failed to add "${productData.name}".`, 'error');
      return { success: false };
    }
  };

  // Computed Aggregated Metrics
  const pendingShopsCount = shops.filter(s => s.isPending).length;
  const approvedShopsCount = shops.filter(s => s.isApproved).length;
  const pendingRidersCount = riders.filter(r => r.isPending).length;
  const activeRidersCount = riders.filter(r => r.isApproved).length;
  const totalCustomersCount = customers.length;
  const totalOrdersCount = orders.length;
  const totalGmvRevenue = orders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const value = {
    isAuthenticated,
    activeTab,
    setActiveTab,
    shops,
    riders,
    customers,
    orders,
    globalProducts,
    isLoading,
    isLoadingGlobalProducts,
    toasts,
    login,
    logout,
    refreshData,
    approveShop,
    rejectShop,
    toggleShop,
    approveRider,
    rejectRider,
    updateOrderStatus,
    addAdminToast,
    // Store Inventory Management
    selectedStoreForProducts,
    storeProducts,
    isLoadingProducts,
    openStoreProductManager,
    closeStoreProductManager,
    loadStoreProducts,
    addProductToStore,
    updateProduct,
    deleteProduct,
    // Global "Shop From Any Store" Management
    loadGlobalProducts,
    addGlobalProduct,
    stats: {
      pendingShopsCount,
      approvedShopsCount,
      totalShopsCount: shops.length,
      pendingRidersCount,
      activeRidersCount,
      totalRidersCount: riders.length,
      totalCustomersCount,
      totalOrdersCount,
      totalGmvRevenue,
      totalGlobalProductsCount: globalProducts.length
    }
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}