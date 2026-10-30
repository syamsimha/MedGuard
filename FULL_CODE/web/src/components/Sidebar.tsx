import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  AlertTriangle,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
  Building2,
} from 'lucide-react';
import type { NavigationTab } from '../types/navigation';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  alertCount?: number;
  pendingReviewsCount?: number;
  patientCount?: number;
}

interface NavItemDef {
  id: NavigationTab;
  label: string;
  icon: ReactNode;
  badge?: string;
  badgeType?: 'danger' | 'neutral' | 'warning';
}

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  alertCount = 24,
  pendingReviewsCount = 2,
  patientCount = 5,
}: SidebarProps) => {
  const navItems: NavItemDef[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: <Users className="w-4 h-4" />,
      badge: String(patientCount),
      badgeType: 'neutral',
    },
    {
      id: 'medication-review',
      label: 'Medication Review',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: `${pendingReviewsCount} Pending`,
      badgeType: pendingReviewsCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'safety-alerts',
      label: 'Safety Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: String(alertCount),
      badgeType: 'danger',
    },
    {
      id: 'clinical-reports',
      label: 'Clinical Reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-200">
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#168C83] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-[#17324D]">MedGuard</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Phase 2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Medication Safety</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="p-3">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#17324D] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-[#17324D] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`${
                        isActive ? 'text-[#168C83]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeType === 'danger'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.badgeType === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
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

      {/* Bottom Facility & Environment Info */}
      <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/70">
        <div className="flex items-start space-x-2.5 text-xs text-slate-600">
          <Building2 className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[#17324D]">TalentAP Inpatient Center</div>
            <div className="text-[11px] text-slate-400">Unit: Clinical Pharmacy (H4)</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Demonstration UI</span>
          <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            v0.2.0
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar (Persistent) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Responsive) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
