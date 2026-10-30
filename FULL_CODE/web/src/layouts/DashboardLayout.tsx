import { useState, type ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import type { NavigationTab } from '../types/navigation';
import type { AuthUser } from '../types/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pageTitle: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  alertCount?: number;
  pendingReviewsCount?: number;
  patientCount?: number;
  currentUser?: AuthUser;
  onLogout?: () => void;
}

export const DashboardLayout = ({
  children,
  activeTab,
  onSelectTab,
  pageTitle,
  searchQuery,
  onSearchChange,
  alertCount,
  pendingReviewsCount,
  patientCount,
  currentUser,
  onLogout,
}: DashboardLayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F4F6F8] text-[#17324D] antialiased">
      {/* Left Sidebar (Persistent on Desktop/Tablet, Drawer on Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        alertCount={alertCount}
        pendingReviewsCount={pendingReviewsCount}
        patientCount={patientCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          pageTitle={pageTitle}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigateToPrescriptionUpload={() => onSelectTab('prescription-analysis')}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
