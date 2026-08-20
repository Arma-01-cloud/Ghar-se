import React from 'react';
import { useAdmin } from '../context/AdminContext';
import AdminNavbar from './AdminNavbar';
import AdminOverviewTab from './AdminOverviewTab';
import AdminShopsTab from './AdminShopsTab';
import AdminRidersTab from './AdminRidersTab';
import AdminCustomersTab from './AdminCustomersTab';
import AdminGlobalCatalogTab from './AdminGlobalCatalogTab';
import AdminOrdersTab from './AdminOrdersTab';
import AdminStoreProductsModal from './AdminStoreProductsModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function AdminDashboard() {
  const { activeTab, toasts } = useAdmin();

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* NAVBAR */}
      <AdminNavbar />

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ACTIVE TAB CONTENT */}
        {activeTab === 'overview' && <AdminOverviewTab />}
        {activeTab === 'shops' && <AdminShopsTab />}
        {activeTab === 'riders' && <AdminRidersTab />}
        {activeTab === 'customers' && <AdminCustomersTab />}
        {(activeTab === 'global-catalog' || activeTab === 'any-store-catalog') && <AdminGlobalCatalogTab />}
        {activeTab === 'orders' && <AdminOrdersTab />}

      </main>

      {/* STORE PRODUCTS & INVENTORY MANAGER MODAL */}
      <AdminStoreProductsModal />

      {/* FOOTER */}
      <footer className="border-t border-stone-200 bg-white py-5 text-center text-xs text-stone-400 font-medium">
        <span>© {new Date().getFullYear()} UR GROZY Marketplace Technologies • Admin Command HQ • Secure Session Protected</span>
      </footer>

      {/* GLOBAL FLOATING TOASTS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-slide-up backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 border-emerald-700 text-emerald-50 shadow-emerald-950/20'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-800 text-rose-50 shadow-rose-950/20'
                : 'bg-stone-900/95 border-stone-800 text-stone-100 shadow-stone-950/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}