import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  fetchGlobalCatalog,
  fetchGlobalCatalogStats,
  createGlobalProduct,
  assignProductToStore
} from '../services/adminService';

const AdminContext = createContext(null);
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();

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
  const [globalCatalogStats, setGlobalCatalogStats] = useState({
    totalGlobalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    productsWithStores: 0,
    productsWithoutStores: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGlobalProducts, setIsLoadingGlobalProducts] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addAdminToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const login = (password, username = 'Admin') => {
    if (!password) {
      return { success: false, error: 'Please enter the administrator access password.' };
    }

    if (!ADMIN_PASSWORD) {
      return {
        success: false,
        error: 'Admin access is not configured on this environment. Set VITE_ADMIN_PASSWORD in the deployment environment.'
      };
    }

    const incoming = password.trim();
    const expected = ADMIN_PASSWORD;
    if (incoming.length === expected.length && incoming === expected) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('gharsee_admin_authenticated', 'true');
        sessionStorage.setItem('gharsee_admin_user', username);
      } catch {}
      addAdminToast('Welcome to UR GROZY Admin Command Center 🛡️', 'success');
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Access Denied: Invalid administrator credentials.' 
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('gharsee_admin_authenticated');
      sessionStorage.removeItem('gharsee_admin_user');
    } catch {}
    addAdminToast('Administrator session ended securely.', 'info');
  };

  const loadGlobalProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGlobalProducts(true);
    try {
      const [catRes, statsRes] = await Promise.all([
        fetchGlobalCatalog({ limit: 50 }),
        fetchGlobalCatalogStats()
      ]);
      setGlobalProducts(catRes.products || []);
      setGlobalCatalogStats(statsRes);
    } catch (err) {
      console.error('Error loading global products in context:', err);
    } finally {
      setIsLoadingGlobalProducts(false);
    }
  }, [isAuthenticated]);

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

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  const approveShop = async (shopId, shopName = 'Store') => {
    const success = await approveShopInSupabase(shopId);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isPending: false, isApproved: true, status: 'open', isOpen: true } : s));
      addAdminToast(`🎉 Store "${shopName}" approved & open on customer app!`, 'success');
      await refreshData();
    } else {
      addAdminToast(`Failed to approve store "${shopName}".`, 'error');
    }
    return success;
  };

  const rejectShop = async (shopId, shopName = 'Store') => {
    const success = await rejectShopInSupabase(shopId);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isPending: false, isApproved: false, status: 'rejected', isOpen: false } : s));
      addAdminToast(`Store "${shopName}" rejected.`, 'info');
      await refreshData();
    } else {
      addAdminToast(`Failed to reject store "${shopName}".`, 'error');
    }
    return success;
  };

  const toggleShop = async (shopId, currentIsOpen) => {
    const nextState = !currentIsOpen;
    const success = await toggleShopStatusInSupabase(shopId, currentIsOpen);
    if (success) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isOpen: nextState, status: nextState ? 'open' : 'closed' } : s));
      addAdminToast(`Store status updated: ${nextState ? '🟢 OPEN' : '🔴 CLOSED'}`, 'info');
    }
    return success;
  };

  const approveRider = async (riderId, riderName = 'Rider') => {
    const success = await approveRiderInSupabase(riderId);
    if (success) {
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isPending: false, isApproved: true, status: 'active', isOnline: true } : r));
      addAdminToast(`🎉 Delivery Partner "${riderName}" approved & verified!`, 'success');
      await refreshData();
    } else {
      addAdminToast(`Failed to approve rider "${riderName}".`, 'error');
    }
    return success;
  };

  const rejectRider = async (riderId, riderName = 'Rider') => {
    const success = await rejectRiderInSupabase(riderId);
    if (success) {
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isPending: false, isApproved: false, status: 'rejected', isOnline: false } : r));
      addAdminToast(`Rider application for "${riderName}" rejected.`, 'info');
      await refreshData();
    } else {
      addAdminToast(`Failed to reject rider "${riderName}".`, 'error');
    }
    return success;
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    const success = await updateAdminOrderStatus(orderId, nextStatus);
    if (success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      addAdminToast(`Order #${orderId} status set to ${nextStatus.toUpperCase()}`, 'success');
    }
    return success;
  };

  const [selectedStoreForProducts, setSelectedStoreForProducts] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const loadStoreProducts = useCallback(async (shopId) => {
    if (!shopId) return;
    setIsLoadingProducts(true);
    const prods = await fetchProductsForShop(shopId);
    setStoreProducts(prods);
    setIsLoadingProducts(false);
  }, []);

  const openStoreProductManager = async (store) => {
    setSelectedStoreForProducts(store);
    await loadStoreProducts(store.id);
  };

  const closeStoreProductManager = () => {
    setSelectedStoreForProducts(null);
    setStoreProducts([]);
  };

  const addProductToStore = async (shopId, productData) => {
    const created = await createProductForShop(shopId, productData);
    if (created) {
      addAdminToast(`✨ Added "${productData.name}" to store catalog!`, 'success');
      await loadStoreProducts(shopId);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, productCount: (s.productCount || 0) + 1 } : s));
      return { success: true, product: created };
    } else {
      addAdminToast(`Failed to add "${productData.name}".`, 'error');
      return { success: false };
    }
  };

  const updateProduct = async (productId, productData, shopId = null) => {
    const success = await updateProductInSupabase(productId, productData);
    if (success) {
      addAdminToast(`Item "${productData.name || 'Product'}" updated successfully!`, 'success');
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

  const addGlobalProduct = async (productData) => {
    const created = await createGlobalProduct(productData);
    if (created) {
      addAdminToast(`✨ Added "${productData.name}" to Global Catalog!`, 'success');
      await loadGlobalProducts();
      return { success: true, product: created };
    } else {
      addAdminToast(`Failed to add "${productData.name}".`, 'error');
      return { success: false };
    }
  };

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
    globalCatalogStats,
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
    selectedStoreForProducts,
    storeProducts,
    isLoadingProducts,
    openStoreProductManager,
    closeStoreProductManager,
    loadStoreProducts,
    addProductToStore,
    updateProduct,
    deleteProduct,
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
      totalGlobalProductsCount: globalCatalogStats.totalGlobalProducts || globalProducts.length
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