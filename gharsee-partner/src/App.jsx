import React, { useState, useEffect } from 'react';
import { ShopkeeperProvider } from './shopkeeper/context/ShopkeeperContext';
import { RiderProvider } from './rider/context/RiderContext';
import ShopkeeperLayout from './shopkeeper/components/ShopkeeperLayout';
import RiderLayout from './rider/components/RiderLayout';
import { Store, Bike, ArrowRight } from 'lucide-react';

function PartnerAppContent() {
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

  const isRiderRoute = currentPath.startsWith('/rider') || currentHash.includes('rider');
  const isShopkeeperRoute = currentPath.startsWith('/shopkeeper') || currentHash.includes('shopkeeper');

  // 1. RIDER PARTNER APP PORTAL
  if (isRiderRoute) {
    return <RiderLayout />;
  }

  // 2. SHOPKEEPER STORE PORTAL
  if (isShopkeeperRoute) {
    return <ShopkeeperLayout />;
  }

  // 3. PARTNER LANDING / PORTAL SELECTION (DEFAULT)
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto w-full my-auto space-y-8 py-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
            GHARSEE PARTNER ECOSYSTEM
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight">
            Select Your Partner Portal
          </h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-lg mx-auto font-medium">
            Manage your grocery store or deliver orders in your neighborhood.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SHOPKEEPER PORTAL CARD */}
          <div 
            onClick={() => {
              window.history.pushState(null, '', '/shopkeeper');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Store className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-stone-900 group-hover:text-emerald-800 transition-colors">
                  Store Partner Portal
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">
                  Manage store products, inventory, customer orders, store operating hours, and daily sales.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 pt-2 border-t border-stone-100">
              <span>OPEN STORE PORTAL</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* RIDER PORTAL CARD */}
          <div 
            onClick={() => {
              window.history.pushState(null, '', '/rider');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Bike className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-stone-900 group-hover:text-emerald-700 transition-colors">
                  Delivery Partner App
                </h3>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">
                  Accept nearby delivery tasks, pickup groceries from neighborhood stores, and track earnings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 pt-2 border-t border-stone-100">
              <span>OPEN RIDER APP</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-stone-400 font-semibold py-4 border-t border-stone-200/60">
        © {new Date().getFullYear()} GharSee Partner Technologies • Store & Delivery Operations
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ShopkeeperProvider>
      <RiderProvider>
        <PartnerAppContent />
      </RiderProvider>
    </ShopkeeperProvider>
  );
}
