import React, { useState, useEffect, Component } from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import ShopkeeperLogin from './ShopkeeperLogin';
import ShopkeeperNavbar from './ShopkeeperNavbar';
import ShopkeeperSidebar from './ShopkeeperSidebar';
import ShopkeeperDashboard from './ShopkeeperDashboard';
import ShopkeeperOrdersPage from './ShopkeeperOrdersPage';
import ShopkeeperOrderDetailModal from './ShopkeeperOrderDetailModal';
import ShopkeeperProductsPage from './ShopkeeperProductsPage';
import ShopkeeperInventoryPage from './ShopkeeperInventoryPage';
import ShopkeeperSalesPage from './ShopkeeperSalesPage';
import ShopkeeperStorePage from './ShopkeeperStorePage';
import ShopkeeperSettingsPage from './ShopkeeperSettingsPage';
import ShopkeeperToastContainer from './ShopkeeperToastContainer';
import { Loader2, Store, AlertCircle, RefreshCw } from 'lucide-react';

class ShopkeeperErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Shopkeeper Portal Layout Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-stone-900">GharSee Store Partner Portal</h2>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">
              Connecting to Supabase marketplace directory. Click below to refresh your shopkeeper session.
            </p>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('gharsee_shopkeeper_logged_in');
                localStorage.removeItem('gharsee_store_profile');
              } catch {}
              window.location.href = '/shopkeeper';
            }}
            className="py-3 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RELOAD SHOPKEEPER PORTAL</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShopkeeperLayoutInner() {
  const { isLoggedIn, hasStore, isCheckingStore, activeShopkeeperTab, setActiveShopkeeperTab, setSelectedOrderId } = useShopkeeper();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check URL params for embedded orderId from WhatsApp link
  useEffect(() => {
    if (isLoggedIn) {
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('orderId');
      if (urlOrderId) {
        if (setSelectedOrderId) setSelectedOrderId(urlOrderId);
        if (setActiveShopkeeperTab) setActiveShopkeeperTab('order-detail');
      }
    }
  }, [isLoggedIn, setSelectedOrderId, setActiveShopkeeperTab]);

  if (!isLoggedIn) {
    return <ShopkeeperLogin />;
  }

  // 1. LOADING STATE WHILE CHECKING STORE REGISTRATION IN SUPABASE
  if (isCheckingStore) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-12 h-12 text-emerald-700 animate-spin" />
        <div className="text-center space-y-1">
          <h3 className="font-display font-extrabold text-stone-900 text-lg">Checking Store Registration</h3>
          <p className="text-stone-500 text-xs">Connecting to Supabase marketplace directory...</p>
        </div>
      </div>
    );
  }

  // 2. CASE 1 — SHOPKEEPER HAS NO STORE: DEDICATED "CREATE YOUR STORE" ONBOARDING VIEW
  if (!hasStore) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between text-stone-900 font-sans">
        <header className="bg-white border-b border-stone-200 py-4 px-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white font-black text-sm">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-xl text-stone-900">
              GharSee <span className="text-emerald-700 font-extrabold">Store Partner</span>
            </span>
          </div>
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            STEP 1: STORE REGISTRATION
          </span>
        </header>

        <main className="flex-1 py-10">
          <ShopkeeperStorePage />
        </main>

        <footer className="bg-white border-t border-stone-200 py-4 px-6 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} GharSee Marketplace Technologies • Partner Onboarding Portal
        </footer>

        <ShopkeeperToastContainer />
      </div>
    );
  }

  // 3. CASE 2 — SHOPKEEPER ALREADY HAS A STORE: DASHBOARD PORTAL
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-stone-900 font-sans">
      
      {/* SIDEBAR */}
      <ShopkeeperSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <ShopkeeperNavbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* TAB ROUTED MAIN CONTENT */}
        <main className="flex-1">
          {activeShopkeeperTab === 'dashboard' && <ShopkeeperDashboard />}
          {activeShopkeeperTab === 'orders' && <ShopkeeperOrdersPage />}
          {activeShopkeeperTab === 'order-detail' && <ShopkeeperOrderDetailModal />}
          {activeShopkeeperTab === 'products' && <ShopkeeperProductsPage />}
          {activeShopkeeperTab === 'inventory' && <ShopkeeperInventoryPage />}
          {activeShopkeeperTab === 'sales' && <ShopkeeperSalesPage />}
          {activeShopkeeperTab === 'store' && <ShopkeeperStorePage />}
          {activeShopkeeperTab === 'settings' && <ShopkeeperSettingsPage />}
        </main>

        {/* SHOPKEEPER TOASTS */}
        <ShopkeeperToastContainer />

      </div>

    </div>
  );
}

export default function ShopkeeperLayout() {
  return (
    <ShopkeeperErrorBoundary>
      <ShopkeeperLayoutInner />
    </ShopkeeperErrorBoundary>
  );
}
