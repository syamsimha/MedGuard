import { X, AlertTriangle, ShieldCheck, User, Info } from 'lucide-react';
import type { SafetyAlertRecord } from '../../types/clinical';

interface AlertDetailModalProps {
  alert: SafetyAlertRecord | null;
  onClose: () => void;
}

export const AlertDetailModal = ({ alert, onClose }: AlertDetailModalProps) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-start justify-between ${
            alert.severity === 'Critical' || alert.severity === 'High'
              ? 'bg-[#17324D] border-b-4 border-rose-500'
              : alert.severity === 'Moderate'
              ? 'bg-[#17324D] border-b-4 border-amber-500'
              : 'bg-[#17324D] border-b-4 border-blue-500'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                alert.severity === 'Critical' || alert.severity === 'High'
                  ? 'bg-rose-600'
                  : alert.severity === 'Moderate'
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">{alert.alertType}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200">
                  {alert.id}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Severity: <strong className="text-white">{alert.severity}</strong> • Logged: {alert.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center space-x-2 text-amber-900">
            <Info className="w-4 h-4 shrink-0 text-amber-700" />
            <span className="text-[11px]">
              <strong>Clinical Alert Demonstration:</strong> Sample alert simulated for validation.
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Affected Patient:</span>
              <strong className="text-slate-800">{alert.patientName}</strong>
            </div>
            <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {alert.patientId}
            </span>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-1">
              Safety Trigger Summary
            </h4>
            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg text-slate-800 leading-relaxed font-medium">
              {alert.summary}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-1">
              Clinical Recommendation
            </h4>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-slate-800 leading-relaxed flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{alert.recommendation}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Rules Engine CDS (Simulated)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailModal;
