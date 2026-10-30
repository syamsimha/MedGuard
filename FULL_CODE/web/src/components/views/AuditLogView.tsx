import React from 'react';
import { DataTable, type Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

interface AuditLogItem {
  id: string;
  eventType: string;
  actor: string;
  summary: string;
  timestamp: string;
}

export const AuditLogView: React.FC = () => {
  const columns: Column<AuditLogItem>[] = [
    { key: 'id', header: 'Event ID', width: '120px' },
    {
      key: 'eventType',
      header: 'Event Category',
      render: (item) => <StatusBadge status="neutral" label={item.eventType} />,
      width: '160px',
    },
    { key: 'actor', header: 'Actor / System', width: '140px' },
    { key: 'summary', header: 'Event Summary' },
    { key: 'timestamp', header: 'Timestamp', width: '160px' },
  ];

  const initialLogs: AuditLogItem[] = [
    {
      id: 'EVT-INIT-001',
      eventType: 'SYSTEM_BOOTSTRAP',
      actor: 'system:init',
      summary: 'MedGuard Phase 1 foundation initialized with SQLite storage.',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    },
    {
      id: 'EVT-INIT-002',
      eventType: 'API_MOUNT',
      actor: 'fastapi:core',
      summary: 'FastAPI health-check router registered at /api/health.',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h1 className="text-lg font-bold text-[#17324D]">Clinical Safety Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable audit record tracking clinical safety reviews, system lifecycle, and rule executions.
        </p>
      </div>

      <DataTable<AuditLogItem>
        title="Audit Trail"
        description="Chronological record of system activities and governance events"
        columns={columns}
        data={initialLogs}
      />
    </div>
  );
};
