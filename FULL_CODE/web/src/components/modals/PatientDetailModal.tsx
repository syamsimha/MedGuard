import { X, Calendar, Bed, HeartPulse, AlertCircle, ShieldAlert } from 'lucide-react';
import type { PatientRecord } from '../../types/clinical';

interface PatientDetailModalProps {
  patient: PatientRecord | null;
  onClose: () => void;
}

export const PatientDetailModal = ({ patient, onClose }: PatientDetailModalProps) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#17324D] text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#168C83] flex items-center justify-center font-bold text-base text-white">
              {patient.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">{patient.name}</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {patient.gender} • {patient.age} years old • {patient.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Disclaimer pill */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center space-x-2 text-blue-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
            <span className="text-[11px]">
              <strong>Demonstration Profile:</strong> Sample data used for UI testing.
            </span>
          </div>

          {/* Vitals / Admission Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Room / Bed Location
              </span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <Bed className="w-4 h-4 text-[#168C83]" />
                <span>{patient.room}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Last Clinical Visit
              </span>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-[#168C83]" />
                <span>{patient.lastVisit}</span>
              </div>
            </div>
          </div>

          {/* Primary Diagnosis */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Primary Diagnosis
            </span>
            <div className="flex items-center space-x-2 font-medium text-slate-800">
              <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{patient.primaryDiagnosis || 'Clinical assessment pending'}</span>
            </div>
          </div>

          {/* Allergies / Adverse Warnings */}
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
            <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Documented Allergies & Sensitivities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900 text-[11px] font-medium"
                  >
                    {allergy}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">No adverse reactions reported</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">MedGuard Patient Registry (Phase 2 UI)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;
