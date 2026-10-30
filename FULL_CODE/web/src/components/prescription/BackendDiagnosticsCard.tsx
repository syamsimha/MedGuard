import React, { useState } from 'react';
import {
  Server,
  AlertTriangle,
  Code,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import type { BackendSubmissionResponse } from '../../services/prescriptionApiService';
import type { PrescriptionPatientInput } from '../../types/prescription';

interface BackendDiagnosticsCardProps {
  submissionResponse: BackendSubmissionResponse;
  patientInput: PrescriptionPatientInput;
  onLoadClinicalSimulation: () => void;
  onRetry: () => void;
  isProcessing: boolean;
}

export const BackendDiagnosticsCard: React.FC<BackendDiagnosticsCardProps> = ({
  submissionResponse,
  patientInput,
  onLoadClinicalSimulation,
  onRetry,
  isProcessing,
}) => {
  const [showPayloadInspector, setShowPayloadInspector] = useState(true);
  const [copied, setCopied] = useState(false);

  const payloadSummary = submissionResponse.submittedPayloadSummary;

  const preparedPayload = {
    method: 'POST',
    endpoint: submissionResponse.endpointUrl,
    contentType: 'multipart/form-data',
    formDataFields: {
      patient_id: patientInput.patientId,
      patient_name: patientInput.name,
      age_or_dob: patientInput.ageOrDob,
      gender: patientInput.gender,
      weight: patientInput.weight || 'None specified',
      allergies: patientInput.allergies || 'None recorded',
      conditions: patientInput.conditions || 'None recorded',
      renal_history: patientInput.renalHistory || 'None recorded',
      clinical_notes: patientInput.clinicalNotes || 'None recorded',
    },
    attachedFiles: payloadSummary.fileNames.map((name) => ({
      name,
      parameter: 'files',
      type: 'application/pdf',
    })),
    totalPayloadFiles: payloadSummary.filesCount,
    totalBinarySizeApprox: `${payloadSummary.totalSizeKb} KB`,
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(preparedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-amber-300 shadow-md overflow-hidden">
      {/* Top Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Backend Medication Safety Engine Pending</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                {submissionResponse.statusCode ? `HTTP ${submissionResponse.statusCode}` : 'Service Offline'}
              </span>
            </h3>
            <p className="text-xs text-amber-100">
              The target endpoint <code className="font-mono bg-black/20 px-1 rounded">{submissionResponse.endpointUrl}</code> is awaiting deployment by the backend team.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onRetry}
            className="px-3 py-1.5 bg-white text-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>

      {/* Main Diagnostic Body */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Honest Architectural Status</span>
          </div>
          <p className="leading-relaxed">
            {submissionResponse.error ||
              `The frontend successfully assembled and verified all patient inputs and multipart files. Because the FastAPI safety engine route (${submissionResponse.endpointUrl}) has not yet been registered in the backend codebase, real-time OCR and automated H4 comparisons cannot be executed.`}
          </p>
          <div className="pt-2 border-t border-amber-200/70 flex flex-wrap items-center gap-4 text-[11px] text-amber-800">
            <span className="font-semibold">Endpoint: POST {submissionResponse.endpointUrl}</span>
            <span>•</span>
            <span>Target: FastAPI / Python Service</span>
            <span>•</span>
            <span>Dataset: H4 Medication Formulary & DDI Rules</span>
          </div>
        </div>

        {/* Payload Inspector Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPayloadInspector(!showPayloadInspector)}
              className="flex items-center space-x-2 text-xs font-bold text-[#17324D] hover:text-[#168C83] cursor-pointer"
            >
              <Code className="w-4 h-4 text-blue-600" />
              <span>Prepared Multipart Payload Inspection (Proof of Packaging)</span>
              {showPayloadInspector ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyPayload}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          </div>

          {showPayloadInspector && (
            <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-72">
              <pre>{JSON.stringify(preparedPayload, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Simulation / Verification Bridge */}
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-[#17324D]">
                Clinical Verification & Interface Preview
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              Want to evaluate the complete Doctor Verification Table, H4 Contraindication findings, and formal PDF safety report export? Load realistic clinical sample prescription findings.
            </p>
          </div>

          <button
            type="button"
            onClick={onLoadClinicalSimulation}
            className="px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Preview Safety Review & H4 Findings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
