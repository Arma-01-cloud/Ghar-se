import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import LocationModal from './LocationModal';
import { 
  Leaf, Search, ShoppingBag, Upload, Clock, Home, 
  Store, User, Menu, X, MapPin, Sparkles, ChevronRight
} from 'lucide-react';

export default function Navbar({ onSearchQuery, searchQuery }) {
  const { 
    activeTab, setActiveTab, totalItemCount, cartSubtotal, 
    currentStore, currentLocation, setCustomerLocation, customerPhone,
    isLocationModalOpen, setIsLocationModalOpen 
  } = useCart();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Primary navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stores', label: 'Stores', icon: Store, badge: 'Nearby' },
    { id: 'any-store', label: 'Shop Any Store', icon: Sparkles, badge: 'Express' },
    { id: 'upload', label: 'Upload List', icon: Upload, badge: 'AI OCR' },
    { id: 'orders', label: 'My Orders', icon: Clock }
  ];

  return (
    <>
      {/* MAIN TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-start h-16 sm:h-20 gap-3 md:gap-3.5 lg:gap-4 w-full">
            
            {/* 1. BRAND LOGO (AT FLEX START) */}
            <div 
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0 group mr-1" 
              onClick={() => setActiveTab('home')}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#08241B] to-[#0E382B] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-emerald-950">
                    Ghar<span className="text-emerald-600">See</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider hidden sm:inline-block">
                    Fresh
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-stone-500 font-semibold tracking-wide hidden xs:inline leading-none mt-0.5">
                  Local Groceries Delivered
                </span>
              </div>
            </div>

            {/* 2. LOCATION SELECTOR PILL */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-300 text-stone-800 px-3 py-2 rounded-full border border-stone-300/80 text-xs font-bold transition-all group shrink-0 cursor-pointer"
              title="Change delivery location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[100px] lg:max-w-[130px] text-stone-900 font-extrabold">
                {currentLocation?.name || 'Bengaluru, Karnataka'}
              </span>
              <span className="text-[10px] text-emerald-800 font-black underline ml-0.5 group-hover:text-emerald-950">
                Change
              </span>
            </button>

            {/* 3. DESKTOP NAVIGATION PILLS */}
            <nav className="hidden lg:flex items-center gap-1 bg-stone-200/60 p-1 rounded-full border border-stone-300/80 shrink-0">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[#08241B] to-[#0E382B] text-white shadow-sm'
                        : 'text-stone-700 hover:text-emerald-950 hover:bg-stone-200/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 font-black rounded-full uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 4. SEARCH INPUT (FLEXIBLE EXPANSION) */}
            <div className="relative flex-1 min-w-[110px] max-w-xs hidden sm:flex items-center">
              <input
                type="text"
                placeholder="Search groceries..."
                value={searchQuery || ''}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => onSearchQuery && onSearchQuery(e.target.value)}
                className={`w-full bg-white text-stone-900 text-xs pl-8 pr-7 py-2 rounded-full border border-stone-300 focus:outline-none focus:border-emerald-700 font-semibold shadow-2xs placeholder:text-stone-400 transition-all ${
                  isSearchFocused ? 'ring-2 ring-emerald-600/30 border-emerald-700' : ''
                }`}
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchQuery && onSearchQuery('')}
                  className="absolute right-2 p-0.5 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* SPACER FOR MOBILE */}
            <div className="flex-1 sm:hidden" />

            {/* 5. ALWAYS VISIBLE CART BUTTON (SHRINK-0) */}
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-black text-xs transition-all shadow-md shrink-0 cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-[#08241B] text-white ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-[#08241B] to-[#0E382B] hover:brightness-110 text-white'
              }`}
              title="Open shopping cart"
            >
              <div className="relative flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-300 shrink-0" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-stone-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#08241B] shadow-xs">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] text-emerald-300 uppercase tracking-widest font-extrabold">Cart</span>
                <span className="text-xs font-black whitespace-nowrap">₹{cartSubtotal}</span>
              </div>
            </button>

            {/* 6. USER ACCOUNT / ORDERS BADGE */}
            <button 
              onClick={() => setActiveTab('orders')} 
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 border border-stone-300 text-xs font-extrabold transition-all shrink-0 cursor-pointer"
              title="View order history"
            >
              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[80px]">{customerPhone ? customerPhone.slice(-10) : 'Orders'}</span>
            </button>

            {/* 7. MOBILE MENU TOGGLE BUTTON */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-emerald-950 lg:hidden rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* PERSISTENT STORE & DELIVERY SUB-HEADER STRIP */}
        <div className="bg-[#0E382B] text-emerald-100 text-xs py-2 px-3 sm:px-4 lg:px-6 border-t border-[#08241B]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            
            {/* CURRENT STORE INFO */}
            <div className="flex items-center gap-2 truncate font-medium">
              <span className="text-amber-400 font-black text-[10px] sm:text-xs uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                <span>STORE:</span>
              </span>
              <span className="font-extrabold text-white truncate text-xs sm:text-sm">
                {currentStore?.name || 'Sri Lakshmi Stores'}
              </span>
              <span className="text-emerald-300 text-[11px] font-semibold hidden md:inline">
                • {currentStore?.distance || '1.2 km'} away • ⚡ {currentStore?.deliveryTime || '15-25 min'}
              </span>
            </div>

            {/* ACTION PILLS: MOBILE LOCATION & STORE SWITCHER */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="md:hidden text-[10px] font-extrabold bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-600/70 flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-emerald-300" />
                <span className="truncate max-w-[80px]">{currentLocation?.name?.split(',')[0] || 'Location'}</span>
              </button>

              <button
                onClick={() => setActiveTab('stores')}
                className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 px-3 py-1 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Change Store</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-[#FBF9F5] px-4 py-4 space-y-4 shadow-xl animate-fade-in">
            
            {/* MOBILE SEARCH BAR */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products across stores..."
                value={searchQuery || ''}
                onChange={(e) => onSearchQuery && onSearchQuery(e.target.value)}
                className="w-full bg-white text-stone-900 text-xs pl-9 pr-8 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-700 font-semibold"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchQuery && onSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* MOBILE LOCATION CARD */}
            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 rounded-2xl bg-white border border-stone-200 text-stone-900 font-bold text-xs flex items-center justify-between shadow-2xs cursor-pointer hover:border-emerald-300"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Delivery Location</span>
                  <span className="truncate text-xs font-extrabold text-stone-900">{currentLocation?.name || 'Bengaluru, Karnataka'}</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-800 underline font-black shrink-0">Change</span>
            </button>

            {/* NAVIGATION TILES */}
            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#08241B] text-white shadow-md font-black'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-800'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black uppercase shrink-0 ${
                        isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* LOCATION SELECTION MODAL */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={setCustomerLocation}
      />
    </>
  );
}
