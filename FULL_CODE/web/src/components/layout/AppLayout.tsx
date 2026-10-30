import React from 'react';
import type { HealthStatusResponse } from '../../types/health';
import type { NavigationTab } from '../../types/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  health: HealthStatusResponse | null;
  loading: boolean;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onRefreshHealth: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  health,
  loading,
  activeTab,
  onSelectTab,
  onRefreshHealth,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-[#17324D] antialiased">
      {/* Top Clinical Header */}
      <Header
        health={health}
        loading={loading}
        onRefreshHealth={onRefreshHealth}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Compact Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          apiConnected={Boolean(health)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
