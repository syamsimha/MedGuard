import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Sliders,
  Server
} from 'lucide-react';
import type { NavigationTab } from '../../types/navigation';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  apiConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  apiConnected,
}) => {
  const clinicalNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'overview',
      label: 'System Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'prescriptions',
      label: 'Prescription Review',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: 'Phase 2',
    },
    {
      id: 'interactions',
      label: 'Interaction Safety',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: 'Phase 2',
    },
    {
      id: 'rules',
      label: 'Safety Rules Engine',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Phase 2',
    },
  ];

  const systemNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'audit-log',
      label: 'Clinical Audit Log',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'System & Config',
      icon: <Sliders className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div className="p-3">
        {/* Section: Clinical Navigation */}
        <div className="mb-4">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Intelligence
          </p>
          <nav className="space-y-0.5 mt-1">
            {clinicalNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#17324D] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#17324D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#168C83]' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                        isActive
                          ? 'bg-white/20 text-slate-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: System & Audit */}
        <div className="mb-4">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Governance & Audit
          </p>
          <nav className="space-y-0.5 mt-1">
            {systemNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#17324D] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#17324D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#168C83]' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                        isActive
                          ? 'bg-white/20 text-slate-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Environment Status Card */}
      <div className="p-3 border-t border-slate-100">
        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
            <Server className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Environment Status</span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Stack:</span>
              <span className="font-mono text-slate-700">FastAPI + Vite</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-mono text-slate-700">SQLite (Init)</span>
            </div>
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={apiConnected ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {apiConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
