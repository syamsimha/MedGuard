import { AlertTriangle, ShieldAlert, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { SafetyAlertRecord, AlertSeverity } from '../types/clinical';

interface SafetyAlertListProps {
  alerts: SafetyAlertRecord[];
  onViewDetails: (alert: SafetyAlertRecord) => void;
  onViewAll?: () => void;
}

export const SafetyAlertList = ({
  alerts,
  onViewDetails,
  onViewAll,
}: SafetyAlertListProps) => {
  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            High Severity
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
            Moderate
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Low Severity
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">Recent Safety Alerts</h3>
            <p className="text-xs text-slate-500">Contraindications and dosage warnings</p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#168C83] hover:text-[#12726B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>All Alerts ({alerts.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="divide-y divide-slate-100 flex-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start space-x-3">
              <div
                className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                  alert.severity === 'Critical'
                    ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                    : alert.severity === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : alert.severity === 'Moderate'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-[#17324D]">
                    {alert.alertType}
                  </span>
                  {getSeverityBadge(alert.severity)}
                </div>

                <p className="text-xs text-slate-600 line-clamp-1 mb-1">
                  {alert.summary}
                </p>

                <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                  <span>Patient: <strong className="text-slate-600">{alert.patientName}</strong> ({alert.patientId})</span>
                  <span>•</span>
                  <span>{alert.date}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onViewDetails(alert)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#17324D] bg-slate-100 hover:bg-slate-200 hover:text-black rounded-md transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Demonstration clinical decision support rules</span>
        <span className="italic">Sample alert logs</span>
      </div>
    </div>
  );
};

export default SafetyAlertList;
