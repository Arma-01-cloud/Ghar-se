import React from 'react';
import { useShopkeeper } from '../context/ShopkeeperContext';
import { 
  LayoutDashboard, ShoppingBag, Package, Warehouse, 
  TrendingUp, Store, Settings, LogOut, Leaf, X 
} from 'lucide-react';

export default function ShopkeeperSidebar({ isMobileOpen, onCloseMobile }) {
  const { activeShopkeeperTab, setActiveShopkeeperTab, pendingOrders, lowStockProducts, logoutShopkeeper } = useShopkeeper();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: (pendingOrders?.length > 0) ? pendingOrders.length : null, badgeColor: 'bg-amber-500 text-white' },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, badge: (lowStockProducts?.length > 0) ? lowStockProducts.length : null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'sales', label: 'Sales & Analytics', icon: TrendingUp },
    { id: 'store', label: 'Store Management', icon: Store },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-[#08241B] text-white">
      
      <div className="space-y-6">
        {/* BRAND LOGO */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex flex-col items-start cursor-pointer" onClick={() => setActiveShopkeeperTab('dashboard')}>
            <img 
              src="/ur-grozy-logo.png" 
              alt="UR GROZY" 
              className="h-8 sm:h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider block mt-1">
              Store Partner
            </span>
          </div>

          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden text-stone-400 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="space-y-1 pt-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeShopkeeperTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveShopkeeperTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md font-extrabold'
                    : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-6 border-t border-emerald-900/60 space-y-2">
        <button
          onClick={logoutShopkeeper}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/60 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30 shadow-xl">
        {content}
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-full h-full bg-[#08241B] shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}