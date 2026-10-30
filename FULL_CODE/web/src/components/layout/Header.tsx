import React from 'react';
import { ShieldCheck, Activity, RefreshCw, Building2 } from 'lucide-react';
import type { HealthStatusResponse } from '../../types/health';
import { StatusBadge } from '../common/StatusBadge';

interface HeaderProps {
  health: HealthStatusResponse | null;
  loading: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, onRefreshHealth }) => {
  return (
    <header className="bg-[#17324D] text-white border-b border-slate-700/60 shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Product Identification */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#168C83] flex items-center justify-center text-white shadow-sm font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">MedGuard</span>
                <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10">
                  Phase 1 Foundation
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block leading-none mt-0.5">
                Every Prescription Deserves a Second Look
              </p>
            </div>
          </div>

          {/* Clinical Center Context */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-200">
            <Building2 className="w-3.5 h-3.5 text-[#168C83]" />
            <span className="font-medium">Facility:</span>
            <span className="text-white">TalentAP Inpatient Pharmacy (H4)</span>
          </div>

          {/* Right Header Status Controls & User */}
          <div className="flex items-center gap-3">
            {/* Live API Health Check Indicator */}
            <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded border border-white/10 text-xs">
              <Activity className="w-3.5 h-3.5 text-[#168C83]" />
              <span className="text-slate-300 hidden sm:inline">Backend API:</span>
              {health ? (
                <StatusBadge status="online" label="Online" />
              ) : (
                <StatusBadge status={loading ? "pending" : "offline"} label={loading ? "Connecting..." : "Offline"} />
              )}
              <button
                type="button"
                onClick={onRefreshHealth}
                disabled={loading}
                title="Refresh API Health"
                className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Clinician Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-xs font-semibold text-slate-200">
                MD
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <p className="font-medium text-white">Clinical Reviewer</p>
                <p className="text-[10px] text-slate-300">Staff Pharmacist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
