import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Pill,
  User,
} from 'lucide-react';
import type { ProposedMedicationInput } from '../../types/prescription';

interface ConfirmPrescriptionModalProps {
  proposedMed: ProposedMedicationInput;
  patientName: string;
  patientId: string;
  newRisksCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmPrescriptionModal: React.FC<ConfirmPrescriptionModalProps> = ({
  proposedMed,
  patientName,
  patientId,
  newRisksCount,
  onConfirm,
  onClose,
}) => {
  const [acknowledged, setAcknowledged] = useState(newRisksCount === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#17324D] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Pill className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Confirm Prescribing Decision
              </h3>
              <p className="text-[11px] text-slate-300">
                Official Clinical Order Confirmation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Patient & Medication Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Patient:</span>
              </span>
              <span className="font-bold text-[#17324D]">
                {patientName} ({patientId})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Prescription Order:</span>
              <span className="font-bold text-emerald-800">
                {proposedMed.name} {proposedMed.strength} — {proposedMed.dosage} ({proposedMed.frequency})
              </span>
            </div>
          </div>

          {/* Safety Risk Warning if findings exist */}
          {newRisksCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Clinical Precaution Notice</span>
              </div>
              <p className="leading-relaxed">
                The safety engine identified <strong>{newRisksCount} new clinical risk(s)</strong> (including potential drug-drug interactions or renal dosage adjustments) associated with introducing this medication.
              </p>
              <label className="flex items-start gap-2 pt-2 border-t border-amber-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-[#168C83] focus:ring-[#168C83]"
                />
                <span className="font-semibold text-amber-950 text-[11px] leading-snug">
                  I have clinically reviewed the safety findings, verified mitigating protocols (e.g. INR monitoring or dosage adjustments), and authorize adding this order to the patient profile.
                </span>
              </label>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                No critical contraindications detected. The order will be routed to the clinical pharmacist queue for final dispensing review.
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 italic">
            This action transfers the hypothetical proposed medication to the confirmed medication regimen. It will be logged under your clinician ID.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel (Keep Hypothetical)
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={onConfirm}
            className={`px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              !acknowledged ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm & Add to Medication List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
