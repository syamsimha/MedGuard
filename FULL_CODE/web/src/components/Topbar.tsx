import { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  X,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface TopbarProps {
  pageTitle: string;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  unreadNotifications?: number;
}

export const Topbar = ({
  pageTitle,
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  unreadNotifications = 3,
}: TopbarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const sampleNotifications = [
    {
      id: 'notif-1',
      title: 'High-Risk Interaction Flagged',
      detail: 'Warfarin + Aspirin for Pt. Eleanor Vance',
      time: '12m ago',
      type: 'warning',
    },
    {
      id: 'notif-2',
      title: 'Prescription Order Verified',
      detail: 'Metformin HCl 500mg approved for Pt. Arthur Pendelton',
      time: '45m ago',
      type: 'success',
    },
    {
      id: 'notif-3',
      title: 'Daily Safety Audit Completed',
      detail: 'All overnight orders screened with zero critical misses',
      time: '2h ago',
      type: 'info',
    },
  ];

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Mobile hamburger & Page Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-[#17324D] hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#17324D] truncate">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                MedGuard Clinical Decision Support
              </p>
            </div>
          </div>

          {/* Center / Right: Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search patients, medications, alerts..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#17324D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Notification Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-500 hover:text-[#17324D] hover:bg-slate-100 transition-colors relative cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Sample Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#17324D]">Clinical Notifications</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      {unreadNotifications} New
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {sampleNotifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start space-x-2">
                          {n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{n.detail}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <span className="text-[11px] text-slate-400 italic">
                      Demonstration notification feed
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-[1px] bg-slate-200" />

            {/* User Profile */}
            <div className="flex items-center space-x-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#17324D] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shadow-xs">
                SC
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-[#17324D] leading-tight flex items-center gap-1">
                  <span>Dr. Sarah Chen</span>
                  <UserCheck className="w-3 h-3 text-[#168C83]" />
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Clinical Administrator
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (under header) */}
        <div className="pb-3 pt-1 sm:hidden">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patients, medications..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#17324D] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
