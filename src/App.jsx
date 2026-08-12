import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { ShopkeeperProvider } from './shopkeeper/context/ShopkeeperContext';
import { RiderProvider } from './rider/context/RiderContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustFeatures from './components/TrustFeatures';
import FavoriteStoresSection from './components/FavoriteStoresSection';
import LocalStoresSection from './components/LocalStoresSection';
import GroceryListSection from './components/GroceryListSection';
import StoresPage from './components/StoresPage';
import StoreDetailPage from './components/StoreDetailPage';
import ProductDetailModal from './components/ProductDetailModal';
import StoreConflictModal from './components/StoreConflictModal';
import UploadListPage from './components/UploadListPage';
import AnyStoreOrderBuilder from './components/AnyStoreOrderBuilder';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import OrdersPage from './components/OrdersPage';
import PromoBanner from './components/PromoBanner';
import WhyUs from './components/WhyUs';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import CustomerOnboardingModal from './components/CustomerOnboardingModal';
import ShopkeeperLayout from './shopkeeper/components/ShopkeeperLayout';
import RiderLayout from './rider/components/RiderLayout';

function AppContent() {
  const { activeTab, isCustomerOnboardingOpen, setIsCustomerOnboardingOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const pathVal = currentPath || window.location.pathname || '';
  const hashVal = currentHash || window.location.hash || '';

  const isRiderRoute = pathVal.startsWith('/rider') || hashVal.includes('rider');
  const isShopkeeperRoute = pathVal.startsWith('/shopkeeper') || hashVal.includes('shopkeeper');

  // RIDER APPLICATION PORTAL ROUTE
  if (isRiderRoute) {
    return <RiderLayout />;
  }

  // SHOPKEEPER PORTAL ROUTE
  if (isShopkeeperRoute) {
    return <ShopkeeperLayout />;
  }

  // CUSTOMER WEBSITE ROUTE
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950 pb-16 md:pb-0">
      
      {/* ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* NAVBAR WITH PERSISTENT CURRENT STORE BAR */}
      <Navbar
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
      />

      {/* MAIN VIEWPORT ROUTER */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero />
            <TrustFeatures />
            
            {/* FAVORITE STORES SECTION */}
            <FavoriteStoresSection />

            {/* SHOP FROM LOCAL STORES SECTION */}
            <LocalStoresSection />

            {/* BUILD YOUR GROCERY LIST SECTION */}
            <GroceryListSection />

            <PromoBanner />
            <WhyUs />
          </>
        )}

        {activeTab === 'stores' && (
          <StoresPage />
        )}

        {activeTab === 'store-detail' && (
          <StoreDetailPage />
        )}

        {activeTab === 'any-store' && (
          <AnyStoreOrderBuilder />
        )}

        {activeTab === 'upload' && (
          <UploadListPage />
        )}

        {activeTab === 'cart' && (
          <CartPage />
        )}

        {activeTab === 'checkout' && (
          <CheckoutPage />
        )}

        {activeTab === 'orders' && (
          <OrdersPage />
        )}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* SINGLE-STORE CART CONFLICT MODAL */}
      <StoreConflictModal />

      {/* CUSTOMER PHONE & LOCATION ONBOARDING MODAL */}
      <CustomerOnboardingModal
        isOpen={isCustomerOnboardingOpen}
        onClose={() => setIsCustomerOnboardingOpen(false)}
      />

      {/* PRODUCT QUICK VIEW MODAL */}
      {quickViewProduct && (
        <ProductDetailModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <ShopkeeperProvider>
        <RiderProvider>
          <AppContent />
        </RiderProvider>
      </ShopkeeperProvider>
    </CartProvider>
  );
}
