import React from 'react';
import { Sliders, ShieldCheck } from 'lucide-react';
import type { HealthStatusResponse } from '../../types/health';
import { StatusBadge } from '../common/StatusBadge';

interface SystemSettingsViewProps {
  health: HealthStatusResponse | null;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ health }) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-[#168C83]" />
          <h1 className="text-lg font-bold text-[#17324D]">System Configuration & Architecture</h1>
        </div>
        <p className="text-xs text-slate-500">
          MedGuard Foundation Environment Settings for TalentAP Mega Hackathon 2026.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 divide-y divide-slate-100">
        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Product Name & Tagline</p>
            <p className="text-xs text-slate-500">MedGuard – Medication Safety Intelligence</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700">
            Every Prescription Deserves a Second Look
          </span>
        </div>

        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Hackathon Problem Track</p>
            <p className="text-xs text-slate-500">TalentAP Mega Hackathon 2026</p>
          </div>
          <StatusBadge status="info" label="Healthcare Problem H4" dot={false} />
        </div>

        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Active Architecture</p>
            <p className="text-xs text-slate-500">Decoupled React (Vite) + Python (FastAPI)</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="online" label="Frontend: :5173" />
            <StatusBadge
              status={health ? "online" : "offline"}
              label={health ? `Backend: ${health.version}` : "Backend: Offline"}
            />
          </div>
        </div>

        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Data Persistence Layer</p>
            <p className="text-xs text-slate-500">SQLite for local development, schema prepared for Supabase migration</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700">
            FULL_CODE/db/medguard.db
          </span>
        </div>

        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Supabase Integration Status</p>
            <p className="text-xs text-slate-500">Deferred to later phase per specification</p>
          </div>
          <StatusBadge status="neutral" label="Staged (Phase 3)" />
        </div>

        <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">Clinical Design Identity Guidelines</p>
            <p className="text-xs text-slate-500">Deep navy (#17324D), Teal (#168C83), White (#FFFFFF), Light grey (#F4F6F8)</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border border-slate-300 bg-[#17324D]" title="#17324D Navy" />
            <div className="w-5 h-5 rounded border border-slate-300 bg-[#168C83]" title="#168C83 Teal" />
            <div className="w-5 h-5 rounded border border-slate-300 bg-[#FFFFFF]" title="#FFFFFF White" />
            <div className="w-5 h-5 rounded border border-slate-300 bg-[#F4F6F8]" title="#F4F6F8 Grey" />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#168C83] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Phase 1 Safety Verification</p>
          <p className="mt-1">
            All code follows clean separation of concerns without hardcoded synthetic patient records.
            The system is prepared for Phase 2 data pipeline and rules engine integration upon approval.
          </p>
        </div>
      </div>
    </div>
  );
};
