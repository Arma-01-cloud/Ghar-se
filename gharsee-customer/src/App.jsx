import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Hero from './components/Hero';
import TrustFeatures from './components/TrustFeatures';
import FavoriteStoresSection from './components/FavoriteStoresSection';
import LocalStoresSection from './components/LocalStoresSection';
import GroceryListSection from './components/GroceryListSection';
import StoresPage from './components/StoresPage';
import StoreDetailPage from './components/StoreDetailPage';
import ProductDetailModal from './components/ProductDetailModal';
import StoreConflictModal from './components/StoreConflictModal';
import CustomerOnboardingModal from './components/CustomerOnboardingModal';
import UploadListPage from './components/UploadListPage';
import AnyStoreOrderBuilder from './components/AnyStoreOrderBuilder';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import OrdersPage from './components/OrdersPage';
import PromoBanner from './components/PromoBanner';
import WhyUs from './components/WhyUs';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import FloatingCartBar from './components/FloatingCartBar';

function CustomerAppContent() {
  const { activeTab, isCustomerOnboardingOpen, setIsCustomerOnboardingOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950 pb-20 lg:pb-0 relative">
      
      {/* ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* NAVBAR WITH PERSISTENT CURRENT STORE BAR */}
      <Navbar
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
      />

      {/* MAIN VIEWPORT ROUTER FOR CUSTOMER PLATFORM */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero />
            <TrustFeatures />
            <FavoriteStoresSection />
            <LocalStoresSection />
            <GroceryListSection />
            <PromoBanner />
            <WhyUs />
          </>
        )}

        {activeTab === 'stores' && <StoresPage />}
        {activeTab === 'store-detail' && <StoreDetailPage />}
        {activeTab === 'any-store' && <AnyStoreOrderBuilder />}
        {activeTab === 'upload' && <UploadListPage />}
        {activeTab === 'cart' && <CartPage />}
        {activeTab === 'checkout' && <CheckoutPage />}
        {activeTab === 'orders' && <OrdersPage />}
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

      {/* FLOATING BOTTOM CART BAR */}
      <FloatingCartBar />

      {/* MOBILE & TABLET BOTTOM NAVIGATION BAR (MATCHING SCREENSHOT) */}
      <MobileBottomNav />

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CustomerAppContent />
    </CartProvider>
  );
}
