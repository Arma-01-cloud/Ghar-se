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
import RiderIncomingRequestModal from './RiderIncomingRequestModal';
import RiderPendingApprovalView from './RiderPendingApprovalView';

export default function RiderLayout() {
  const { 
    isLoggedIn, 
    profile,
    activeRiderTab, 
    incomingNotification, 
    acceptIncomingNotification, 
    declineIncomingNotification,
    logoutRider
  } = useRider();

  if (!isLoggedIn) {
    return <RiderLogin />;
  }

  // Rider Pending Admin Review Gate
  const isPendingApproval = profile && (
    profile.isPending ||
    profile.status === 'pending_approval' ||
    profile.status === 'pending' ||
    profile.is_approved === false ||
    profile.isApproved === false
  );

  if (isPendingApproval) {
    return <RiderPendingApprovalView onLogout={logoutRider} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex text-stone-900 font-sans pb-16 md:pb-0 relative">
      
      {/* REALTIME INCOMING DELIVERY REQUEST POPUP OVERLAY */}
      {incomingNotification && (
        <RiderIncomingRequestModal
          notification={incomingNotification}
          onAccept={acceptIncomingNotification}
          onDecline={declineIncomingNotification}
        />
      )}

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
