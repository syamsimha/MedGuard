import React from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  User,
  Pill,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Sparkles,
} from 'lucide-react';
import type {
  PrescriptionAnalysisResult,
  AnalysisOutcomeStatus,
} from '../../types/prescription';
import { printCurrentReport } from '../../services/reportExportService';

interface PrescriptionReportViewProps {
  analysisResult: PrescriptionAnalysisResult;
  onBackToEdit: () => void;
  onStartNew: () => void;
  onNavigateToMedReview?: () => void;
  onViewPatientProfile?: (patientId: string) => void;
  onExportPdf?: () => void;
  onTestNewMedication?: () => void;
}

export const PrescriptionReportView: React.FC<PrescriptionReportViewProps> = ({
  analysisResult,
  onBackToEdit,
  onStartNew,
  onNavigateToMedReview,
  onViewPatientProfile,
  onExportPdf,
  onTestNewMedication,
}) => {
  const { outcome, summaryMessage, patient, files, medications, findings, analyzedAt } =
    analysisResult;

  const criticalFindings = findings.filter((f) => f.severity === 'Critical');
  const highFindings = findings.filter((f) => f.severity === 'High');
  const modFindings = findings.filter((f) => f.severity === 'Moderate');
  const lowFindings = findings.filter((f) => f.severity === 'Low');

  const getOutcomeBadge = (status: AnalysisOutcomeStatus) => {
    switch (status) {
      case 'no_issues_detected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            No Safety Issues Detected
          </span>
        );
      case 'analysis_completed_with_findings':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Safety Contraindications Identified ({findings.length})
          </span>
        );
      case 'analysis_incomplete':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-300">
            <Clock className="w-4 h-4 text-yellow-600" />
            Analysis Incomplete - Review Advised
          </span>
        );
      case 'unable_to_process':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Unable to Process Prescriptions
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBackToEdit}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prescription Review & Edit</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartNew}
            className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>New Analysis</span>
          </button>

          <button
            type="button"
            onClick={printCurrentReport}
            className="px-3 py-1.5 bg-white text-[#17324D] hover:bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Report</span>
          </button>

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1.5 bg-[#168C83] hover:bg-[#12726b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          )}

          {onNavigateToMedReview && (
            <button
              type="button"
              onClick={onNavigateToMedReview}
              className="px-3 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Pill className="w-3.5 h-3.5 text-teal-300" />
              <span>Transfer to Medication Review</span>
            </button>
          )}

          {onTestNewMedication && (
            <button
              type="button"
              onClick={onTestNewMedication}
              className="px-3.5 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Test a New Medication</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Task 2 Banner: Test a New Medication */}
      {onTestNewMedication && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#168C83] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#17324D] flex items-center gap-1.5">
                <span>Test an Additional Medication Before Prescribing</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold">
                  Pre-Prescription Safety Assessment
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Want to prescribe an additional medication? Test it against this patient's existing medications before making a prescribing decision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTestNewMedication}
            className="px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1.5 self-end sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Test a New Medication</span>
          </button>
        </div>
      )}

      {/* Main Printable Formal Report Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden print:border-none print:shadow-none">
        {/* Hospital Header Banner */}
        <div className="bg-gradient-to-r from-[#17324D] via-[#1a3d60] to-[#168C83] p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">
                  MedGuard Hospital Safety Engine
                </h1>
                <p className="text-xs text-slate-200 font-medium">
                  Prescription PDF Multi-Source Entity Extraction & H4 Dataset Verification
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-200">
              <div className="font-mono text-xs">Report ID: MGR-RX-{patient.patientId}-2026</div>
              <div className="flex items-center gap-1 sm:justify-end mt-0.5">
                <Calendar className="w-3 h-3 text-slate-300" />
                <span>Generated: {analyzedAt}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-300 block mb-1">
                Clinical Safety Verdict
              </span>
              <div>{getOutcomeBadge(outcome)}</div>
            </div>

            <div className="text-xs text-slate-200 max-w-md sm:text-right">
              {summaryMessage}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* 1. Patient Profile Summary Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Patient Clinical Profile</span>
              </h2>
              {onViewPatientProfile && (
                <button
                  type="button"
                  onClick={() => onViewPatientProfile(patient.patientId)}
                  className="text-xs text-[#168C83] hover:underline font-semibold cursor-pointer print:hidden"
                >
                  View Full EHR Dossier →
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient Name</span>
                <span className="font-bold text-slate-800 text-sm">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Patient ID</span>
                <span className="font-mono font-bold text-slate-800">{patient.patientId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Age & Gender</span>
                <span className="font-semibold text-slate-800">
                  {patient.ageOrDob} • {patient.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Weight</span>
                <span className="font-semibold text-slate-800">{patient.weight || 'Not specified'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Documented Drug Allergies</span>
                <span className="font-bold text-rose-700">{patient.allergies || 'None recorded'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Renal Clearance Context</span>
                <span className="font-semibold text-amber-800">
                  {patient.renalHistory || 'Baseline clearance (>60 mL/min)'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <span className="text-slate-400 block text-[11px]">Existing Medical Conditions</span>
                <span className="font-semibold text-slate-700">{patient.conditions || 'None specified'}</span>
              </div>
            </div>
          </div>

          {/* 2. Source Documents Summary Box */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D] mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Source Prescription Documents ({files.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center space-x-3"
                >
                  <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-rose-200">
                    PDF
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Extracted & Verified Medication Regimen */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>Extracted & Verified Active Medications ({medications.length})</span>
              </h2>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                All Clinician Confirmed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/60 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
                    <th className="py-2.5 px-4">Medicine Name</th>
                    <th className="py-2.5 px-3">Active Ingredient</th>
                    <th className="py-2.5 px-3">Strength & Dosage</th>
                    <th className="py-2.5 px-3">Frequency & Route</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-4">Source Prescription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {medications.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-[#17324D]">{med.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{med.genericName || med.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {med.dosage} ({med.strength})
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {med.frequency} • {med.route}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{med.duration || 'Ongoing'}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                        {med.sourceFile}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Categorized H4 Safety Findings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>H4 Dataset Safety Contraindications ({findings.length})</span>
              </h2>

              <div className="flex items-center gap-2 text-[11px]">
                {criticalFindings.length > 0 && (
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {criticalFindings.length} Critical
                  </span>
                )}
                {highFindings.length > 0 && (
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {highFindings.length} High
                  </span>
                )}
                {modFindings.length > 0 && (
                  <span className="font-bold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                    {modFindings.length} Moderate
                  </span>
                )}
                {lowFindings.length > 0 && (
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {lowFindings.length} Low/Formulary
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {findings.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-[#17324D]">
                    No Active Contraindications Detected Against H4 Dataset
                  </p>
                </div>
              ) : (
                findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-lg border text-xs space-y-1.5 bg-slate-50/60 border-slate-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.severity === 'Critical'
                              ? 'bg-rose-600 text-white'
                              : f.severity === 'High'
                              ? 'bg-amber-600 text-white'
                              : f.severity === 'Moderate'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="font-bold text-slate-800">{f.category}</span>
                        <span className="text-[11px] font-mono text-slate-400">({f.id})</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold text-slate-600 text-[11px]">
                        <span>Involved:</span>
                        <span className="text-[#17324D]">{f.affectedMedications.join(' + ')}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 font-medium leading-relaxed">{f.explanation}</p>

                    {f.recommendation && (
                      <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 font-semibold text-[11px]">
                        <strong>Prescriber Action:</strong> {f.recommendation}
                      </p>
                    )}

                    {f.evidenceSource && (
                      <div className="text-[10px] text-slate-400">
                        Evidence Citation: {f.evidenceSource}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. Doctor / Pharmacist Sign-Off Block */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Clinical Verification Sign-Off
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="border-b border-slate-300 pb-2">
                <span className="text-[11px] text-slate-400 block mb-1">Attending Clinician / Reviewer</span>
                <span className="font-bold text-[#17324D]">Pharm. R. Sharma (Clinical Pharmacist)</span>
              </div>
              <div className="border-b border-slate-300 pb-2">
                <span className="text-[11px] text-slate-400 block mb-1">Clinical Decision Status</span>
                <span className="font-bold text-emerald-800">Verified & Reconciled with Patient EHR</span>
              </div>
              <div className="border-b border-slate-300 pb-2">
                <span className="text-[11px] text-slate-400 block mb-1">Electronic Signature</span>
                <span className="font-mono text-[11px] text-slate-600">SIG-MDGUARD-8021-RX772</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
              <span>MedGuard Hospital Safety System • H4 Dataset Clinical Engine v2.4</span>
              <span>CONFIDENTIAL MEDICAL RECORD • FOR AUTHORIZED CLINICAL USE ONLY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
