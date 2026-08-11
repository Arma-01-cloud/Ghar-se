import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import LocationModal from './LocationModal';
import { Leaf, Search, ShoppingBag, Upload, Clock, Home, Store, User, Menu, X, MapPin } from 'lucide-react';

export default function Navbar({ onSearchQuery, searchQuery }) {
  const { 
    activeTab, setActiveTab, totalItemCount, cartSubtotal, 
    currentStore, currentLocation, setCustomerLocation,
    isLocationModalOpen, setIsLocationModalOpen 
  } = useCart();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stores', label: 'Stores', icon: Store, badge: 'Nearby' },
    { id: 'any-store', label: 'Shop Any Store', icon: ShoppingBag, badge: 'NEW' },
    { id: 'upload', label: 'Upload List', icon: Upload, badge: 'AI OCR' },
    { id: 'orders', label: 'Orders', icon: Clock },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 lg:gap-6">
            
            {/* LEFT: BRAND LOGO & LOCATION BADGE */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
                <div className="w-11 h-11 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transform transition-transform hover:scale-105">
                  <Leaf className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-2xl tracking-tight text-emerald-950">
                      Ghar<span className="text-emerald-600">See</span>
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      Fresh
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium tracking-wide hidden xs:inline">
                    Local Groceries Delivered
                  </span>
                </div>
              </div>

              {/* LOCATION SELECTOR BADGE */}
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 px-3 py-1.5 rounded-full border border-stone-300 text-xs font-bold transition-all shadow-xs group"
                title="Select Delivery Location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate max-w-[130px] lg:max-w-[170px]">{currentLocation?.name || 'Indiranagar, Bengaluru'}</span>
                <span className="text-[10px] text-emerald-700 font-extrabold underline ml-0.5">Change</span>
              </button>
            </div>

            {/* CENTER: DESKTOP NAVIGATION LINKS */}
            <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1.5 rounded-full border border-stone-300/50">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/20'
                        : 'text-stone-700 hover:text-emerald-800 hover:bg-stone-200/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded-full uppercase ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* RIGHT: SEARCH, CART & USER */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* SEARCH BAR */}
              <div className={`relative hidden lg:flex items-center transition-all duration-300 ${isSearchFocused ? 'w-52' : 'w-36 lg:w-44'}`}>
                <input
                  type="text"
                  placeholder="Search groceries..."
                  value={searchQuery || ''}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => {
                    onSearchQuery(e.target.value);
                  }}
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-full border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
              </div>

              {/* CART TRIGGER BUTTON */}
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 ${
                  activeTab === 'cart'
                    ? 'bg-emerald-900 text-white ring-2 ring-emerald-500'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-900/15'
                }`}
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-emerald-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left leading-tight hidden xs:flex">
                  <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">Cart</span>
                  <span className="text-xs font-bold">₹{cartSubtotal}</span>
                </div>
              </button>

              {/* USER PROFILE */}
              <button 
                onClick={() => setActiveTab('orders')} 
                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-stone-200/80 text-stone-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                title="User Orders"
              >
                <User className="w-5 h-5" />
              </button>

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-stone-700 hover:text-emerald-800 md:hidden rounded-lg hover:bg-stone-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* PERSISTENT CURRENT STORE & LOCATION INDICATOR BAR */}
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 border-t border-emerald-800/60 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 truncate font-medium">
              <span className="text-amber-400 font-extrabold text-[11px] uppercase tracking-wider">Shopping From:</span>
              <span className="font-extrabold text-white truncate">{currentStore?.name || 'Sri Lakshmi Stores'}</span>
              <span className="text-emerald-300/80 text-[11px] hidden sm:inline">({currentStore?.distance || '1.2 km away'} • {currentStore?.deliveryTime || '15-25 min'})</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="sm:hidden text-[10px] font-extrabold bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-600/50 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Location</span>
              </button>

              <button
                onClick={() => setActiveTab('stores')}
                className="text-[11px] font-extrabold bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg border border-emerald-500/40 transition-colors"
              >
                Change Store 🏪
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-[#FBF9F5] px-4 py-4 space-y-3 animate-in fade-in">
            
            {/* MOBILE LOCATION BADGE */}
            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="truncate">{currentLocation?.name || 'Indiranagar, Bengaluru'}</span>
              </div>
              <span className="text-[10px] text-emerald-700 underline font-black">Change</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
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
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
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
