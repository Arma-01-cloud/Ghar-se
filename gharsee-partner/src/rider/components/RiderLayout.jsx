import React from 'react';
import { useRider } from '../context/RiderContext';
import RiderLogin from './RiderLogin';
import RiderHeader from './RiderHeader';
import RiderSidebar from './RiderSidebar';
import RiderBottomNav from './RiderBottomNav';
import RiderDashboard from './RiderDashboard';
import RiderDeliveriesPage from './RiderDeliveriesPage';
import RiderEarningsPage from './RiderEarningsPage';
import RiderHistoryPage from './RiderHistoryPage';
import RiderProfilePage from './RiderProfilePage';
import RiderSettingsPage from './RiderSettingsPage';
import RiderToastContainer from './RiderToastContainer';

export default function RiderLayout() {
  const { isLoggedIn, activeRiderTab } = useRider();

  if (!isLoggedIn) {
    return <RiderLogin />;
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-stone-900 font-sans pb-16 md:pb-0">
      
      {/* DESKTOP SIDEBAR */}
      <RiderSidebar />

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER */}
        <RiderHeader />

        {/* TAB ROUTED MAIN CONTENT */}
        <main className="flex-1">
          {activeRiderTab === 'dashboard' && <RiderDashboard />}
          {activeRiderTab === 'deliveries' && <RiderDeliveriesPage />}
          {activeRiderTab === 'earnings' && <RiderEarningsPage />}
          {activeRiderTab === 'history' && <RiderHistoryPage />}
          {activeRiderTab === 'profile' && <RiderProfilePage />}
          {activeRiderTab === 'settings' && <RiderSettingsPage />}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <RiderBottomNav />

        {/* RIDER TOASTS */}
        <RiderToastContainer />

      </div>

    </div>
  );
}
