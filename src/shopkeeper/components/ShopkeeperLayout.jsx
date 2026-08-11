import React, { useState } from 'react';
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
import { Loader2, Store } from 'lucide-react';

export default function ShopkeeperLayout() {
  const { isLoggedIn, hasStore, isCheckingStore, activeShopkeeperTab } = useShopkeeper();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isLoggedIn) {
    return <ShopkeeperLogin />;
  }

  // 1. LOADING STATE WHILE CHECKING STORE REGISTRATION IN SUPABASE
  if (isCheckingStore) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center space-y-4">
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
