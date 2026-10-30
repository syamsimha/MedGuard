import React from 'react';
import {
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  Shield,
  FileCode2,
} from 'lucide-react';
import type { HealthStatusResponse } from '../../types/health';
import { DataCard } from '../common/DataCard';
import { DataTable, type Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

interface SystemOverviewProps {
  health: HealthStatusResponse | null;
  loading: boolean;
  error: string | null;
}

interface PrescriptionRecord {
  id: string;
  patient_ref: string;
  medication: string;
  dosage: string;
  prescriber: string;
  status: string;
  reviewed_at: string;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({
  health,
  loading,
  error,
}) => {
  // Columns for the clinical verification table
  const columns: Column<PrescriptionRecord>[] = [
    { key: 'id', header: 'Prescription ID', width: '130px' },
    { key: 'patient_ref', header: 'Patient Identifier', width: '150px' },
    { key: 'medication', header: 'Medication Name' },
    { key: 'dosage', header: 'Dosage & Frequency' },
    { key: 'prescriber', header: 'Prescriber ID' },
    {
      key: 'status',
      header: 'Review Status',
      render: (item) => (
        <StatusBadge
          status={item.status === 'VALIDATED' ? 'online' : 'pending'}
          label={item.status}
        />
      ),
    },
    { key: 'reviewed_at', header: 'Timestamp', width: '140px' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Clinical Project Identity */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#17324D] text-white">
                TalentAP Mega Hackathon 2026
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#168C83]/15 text-[#168C83] border border-[#168C83]/30">
                Healthcare Problem H4
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#17324D]">
              MedGuard – Medication Safety Intelligence
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Every Prescription Deserves a Second Look · Phase 1 Foundation Verified
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Foundation Status:</span>
            <StatusBadge
              status={health ? 'online' : loading ? 'pending' : 'offline'}
              label={health ? 'Foundation Operational' : loading ? 'Checking API...' : 'Backend Disconnected'}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Infrastructure Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend API Metric */}
        <DataCard
          title="FastAPI Backend"
          icon={<Server className="w-4 h-4 text-[#168C83]" />}
          value={health ? 'Healthy (v0.1.0)' : loading ? 'Connecting...' : 'Offline'}
          subtitle={health ? health.service : 'Awaiting FastAPI server on :8000'}
          statusBadge={
            <StatusBadge
              status={health ? 'online' : loading ? 'pending' : 'offline'}
              label={health ? '200 OK' : 'No Response'}
            />
          }
          footer={
            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          }
        />

        {/* Database Metric */}
        <DataCard
          title="Database Layer"
          icon={<Database className="w-4 h-4 text-[#168C83]" />}
          value="SQLite (Active)"
          subtitle="Schema initialized: prescriptions, interactions, audit"
          statusBadge={<StatusBadge status="online" label="Initialized" />}
          footer={
            <span className="text-[11px] text-slate-500">
              Migration path: Supabase ready
            </span>
          }
        />

        {/* Safety Pipeline Metric */}
        <DataCard
          title="Safety Pipeline"
          icon={<Cpu className="w-4 h-4 text-[#168C83]" />}
          value="Phase 2 Staged"
          subtitle="Drug-drug interaction & contraindication engine"
          statusBadge={<StatusBadge status="neutral" label="Staged" />}
          footer={
            <span className="text-[11px] text-slate-500">
              Module: FULL_CODE/pipeline
            </span>
          }
        />

        {/* Clinical Interface Metric */}
        <DataCard
          title="Clinical Web Shell"
          icon={<Layers className="w-4 h-4 text-[#168C83]" />}
          value="React + TypeScript"
          subtitle="Tailwind CSS theme tokens active"
          statusBadge={<StatusBadge status="online" label="Built" />}
          footer={
            <span className="text-[11px] text-slate-500">
              Port: 5173 (Vite 6)
            </span>
          }
        />
      </div>

      {/* Backend API Response Details & Live Diagnostic */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#168C83]" />
            <h2 className="text-sm font-semibold text-[#17324D]">
              Live Backend API Health Check Diagnostic (/api/health)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">GET http://127.0.0.1:8000/api/health</span>
        </div>

        {health ? (
          <div className="bg-slate-50 rounded border border-slate-200 p-4 font-mono text-xs text-slate-700 overflow-x-auto">
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </div>
        ) : error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
            <p className="font-semibold">Backend Connection Note:</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-slate-600 font-mono">
              Start the FastAPI backend with: <code className="bg-rose-100/50 px-1 py-0.5 rounded">cd FULL_CODE/api; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload</code>
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            Connecting to health endpoint...
          </div>
        )}
      </div>

      {/* Clinical Verification Table - Clear Data Table with Empty State */}
      <DataTable<PrescriptionRecord>
        title="Clinical Prescription Audit Queue (Phase 1 Baseline)"
        description="Prescriptions submitted by clinicians for drug-drug interaction & dosage validation."
        columns={columns}
        data={[]}
        emptyMessage="No Prescriptions in Review Queue"
        emptySubtext="Real prescription data will be ingested in Phase 2. Fake patient data is strictly omitted in accordance with clinical safety guidelines."
        headerAction={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Queue Status:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Ready for Phase 2 Ingestion
            </span>
          </div>
        }
      />

      {/* Phase 1 Verification Checklist */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#168C83]" />
          <h2 className="text-sm font-semibold text-[#17324D]">
            Phase 1 Foundation Deliverables Checklist
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 rounded bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Monorepo Structure Established</p>
              <p className="text-slate-500 mt-0.5">FULL_CODE/ (web, api, pipeline, tests, db, .env.example)</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">React + TypeScript + Vite Configured</p>
              <p className="text-slate-500 mt-0.5">Vite 6 with proxy configured to FastAPI backend on :8000</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Tailwind CSS & Clinical Theme Configured</p>
              <p className="text-slate-500 mt-0.5">Design tokens: #17324D Navy, #168C83 Teal, #F4F6F8 Light Grey</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">FastAPI Health API & Tests Passing</p>
              <p className="text-slate-500 mt-0.5">GET /api/health returning verified operational metadata</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
