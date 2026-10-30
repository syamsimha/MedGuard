import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import api from '../../services/api';
import { RefreshCw, Loader2 } from 'lucide-react';

interface AuditLogItem {
  id: string;
  eventType: string;
  actor: string;
  summary: string;
  timestamp: string;
}

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({ skip: 0, limit: 100 });
      const mapped: AuditLogItem[] = (res.items || []).map((l) => ({
        id: l.id,
        eventType: l.event_type,
        actor: l.actor_id,
        summary: l.summary,
        timestamp: l.created_at ? new Date(l.created_at).toLocaleString() : 'Recent',
      }));
      setLogs(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve clinical audit trail from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLogItem>[] = [
    { key: 'id', header: 'Event ID', width: '130px' },
    {
      key: 'eventType',
      header: 'Event Category',
      render: (item) => <StatusBadge status="neutral" label={item.eventType} />,
      width: '180px',
    },
    { key: 'actor', header: 'Actor / System', width: '150px' },
    { key: 'summary', header: 'Event Summary' },
    { key: 'timestamp', header: 'Timestamp', width: '180px' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#17324D]">Clinical Safety Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record tracking clinical safety reviews, system lifecycle, and rule executions from SQLite.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-lg border border-slate-200">
          <Loader2 className="w-5 h-5 text-[#168C83] animate-spin mr-2" />
          <span className="text-xs text-slate-500 font-medium">Loading clinical audit trail...</span>
        </div>
      ) : (
        <DataTable<AuditLogItem>
          title="Audit Trail"
          description={`Displaying ${logs.length} chronological governance events recorded by MedGuard`}
          columns={columns}
          data={logs}
        />
      )}
    </div>
  );
};

export default AuditLogView;
