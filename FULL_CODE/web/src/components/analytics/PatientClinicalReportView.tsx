import { useState } from 'react';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
} from '../../types/clinical';
import {
  Printer,
  Download,
  AlertTriangle,
  Pill,
  ShieldCheck,
  User,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { printCurrentReport, exportPatientReportPdf } from '../../services/reportExportService';

interface PatientClinicalReportViewProps {
  patients: PatientRecord[];
  selectedPatientId: string;
  onSelectPatientId: (patientId: string) => void;
  reviews: MedicationReviewRecord[];
  alerts: SafetyAlertRecord[];
  onViewPatientProfile?: (patientId: string) => void;
  onViewMedicationReview?: (patientId: string) => void;
}

export const PatientClinicalReportView = ({
  patients,
  selectedPatientId,
  onSelectPatientId,
  reviews,
  alerts,
  onViewPatientProfile,
  onViewMedicationReview,
}: PatientClinicalReportViewProps) => {
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const patientReviews = reviews.filter((r) => r.patientId === patient.id);
  const patientAlerts = alerts.filter((a) => a.patientId === patient.id);
  const currentMeds = patient.currentMedications || [];

  const reportId = `MGR-2026-${patient.id.replace('PT-', '')}-${new Date().getMonth() + 1}01`;
  const reportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    printCurrentReport();
  };

  const handleDownloadPdf = () => {
    try {
      exportPatientReportPdf(patient, reviews, alerts, reportId);
      setDownloadSuccessToast(`PDF Generated: MedGuard_Clinical_Report_${patient.id}.pdf`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Patient Selector & Actions (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Patient Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <User className="w-4 h-4 text-blue-600" />
            <span>Select Inpatient Record:</span>
          </label>
          <div className="relative min-w-[260px]">
            <select
              value={patient.id}
              onChange={(e) => onSelectPatientId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#17324D] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) — {p.room}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {onViewPatientProfile && (
            <button
              type="button"
              onClick={() => onViewPatientProfile(patient.id)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons: Print and Download PDF */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccessToast && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Printable Clinical Report Document (A4 Container) */}
      <div className="print-area bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-5xl mx-auto space-y-6 text-slate-800">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-200 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#17324D] text-white flex items-center justify-center font-bold text-sm">
                MG
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#17324D]">
                  MedGuard Clinical Safety Intelligence
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  St. Jude Metropolitan Medical Center • Division of Clinical Pharmacy
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 pt-2 font-semibold">
              Inpatient Medication Safety & Pharmacovigilance Comprehensive Review
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
            <p className="font-mono text-slate-700">
              <strong className="text-slate-500">Report ID:</strong> {reportId}
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-500">Generated:</strong> {reportDate}
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-500">Engine:</strong> MedGuard CDS v2.4
            </p>
          </div>
        </div>

        {/* Mandatory Watermark / Demo Disclaimer (Task 4 & 6) */}
        <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-xs text-rose-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold uppercase tracking-wider text-rose-800 text-[11px]">
              DEMO REPORT – NOT FOR CLINICAL USE
            </p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              This simulated clinical report has been generated exclusively for MedGuard platform verification using demonstration data. It does not contain validated medical diagnoses, formal prescription authorizations, or automated treatment decisions.
            </p>
          </div>
        </div>

        {/* Section 1: Patient Demographic & Clinical Baseline */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Section 1: Patient Demographics & Inpatient Baseline</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Patient Name</span>
              <p className="font-bold text-[#17324D] text-sm mt-0.5">{patient.name}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">MRN / ID</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{patient.id}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Age / Gender</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {patient.age} yrs • {patient.gender}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Blood Group</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.bloodGroup}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Care Unit / Bed</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {patient.room}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Patient Status</span>
              <p className="font-semibold text-slate-800 mt-0.5">{patient.status}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Admission / Last Visit</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {patient.lastVisit}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Primary Diagnosis</span>
              <p className="font-semibold text-slate-800 mt-0.5 truncate" title={patient.primaryDiagnosis}>
                {patient.primaryDiagnosis || 'Pending'}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Documented Drug & Environmental Allergies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(patient.allergies || ['None on record']).map((alg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Medication Regimen Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Section 2: Current Inpatient Medication Regimen ({currentMeds.length} Orders)</span>
            </h2>
            {onViewMedicationReview && (
              <button
                type="button"
                onClick={() => onViewMedicationReview(patient.id)}
                className="no-print text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full MAR</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Medication Name & Generic</th>
                  <th className="px-3.5 py-2.5">Dosage</th>
                  <th className="px-3.5 py-2.5">Frequency & Route</th>
                  <th className="px-3.5 py-2.5">Prescriber</th>
                  <th className="px-3.5 py-2.5">Start Date</th>
                  <th className="px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMeds.length > 0 ? (
                  currentMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5">
                        <span className="font-bold text-[#17324D]">{med.name}</span>
                        {med.genericName && (
                          <span className="text-[11px] text-slate-400 block">{med.genericName}</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-medium">{med.dosage}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {med.frequency} • {med.route}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 font-medium">{med.prescriber}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">{med.startDate}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                      No active prescription orders documented.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Safety Alerts Summary Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Section 3: Clinical Safety Alerts & Contraindications ({patientAlerts.length} Flags)</span>
          </h2>

          {patientAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {patientAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                        {alt.id}
                      </span>
                      <span className="font-bold text-xs text-[#17324D]">{alt.alertType}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          alt.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : alt.severity === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {alt.severity} Risk
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Detected: {alt.date}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-900">Trigger:</strong> {alt.summary}
                  </p>

                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-slate-800 flex items-start space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900">Clinical Recommendation:</strong>{' '}
                      {alt.clinicalRecommendation || alt.recommendation}
                    </div>
                  </div>

                  {alt.reviewNotes && (
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong>Pharmacist Review Notes:</strong> {alt.reviewNotes} (Reviewed by:{' '}
                      {alt.reviewedBy || 'Clinical Pharmacist'})
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 flex items-center justify-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero active medication safety contraindications on file for this patient.</span>
            </div>
          )}
        </div>

        {/* Section 4: Medication Review History */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Section 4: Pharmacist Verification History ({patientReviews.length} Reviews)</span>
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Review Date</th>
                  <th className="px-3.5 py-2.5">Medication & Dosage</th>
                  <th className="px-3.5 py-2.5">Reviewer</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Clinical Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientReviews.length > 0 ? (
                  patientReviews.map((rev) => (
                    <tr key={rev.id}>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {rev.reviewDate}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-[#17324D]">
                        {rev.medicationName} ({rev.dosage})
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-700">{rev.reviewer}</td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rev.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : rev.status === 'Flagged'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 max-w-xs">
                        {rev.clinicalNotes || rev.notes || 'Routine order verification.'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">
                      No medication reviews recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Clinical Sign-off & Audit Block */}
        <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-[#17324D] uppercase text-[10px] tracking-wider">
              Clinical Pharmacist Sign-Off
            </p>
            <p className="text-slate-700 font-medium">Pharm. R. Sharma, PharmD, BCPS</p>
            <p className="text-slate-500 text-[11px]">
              Signature: <span className="font-mono text-slate-800">[ELECTRONICALLY VERIFIED]</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Timestamp: {reportDate} 15:20 EDT • Token: CDS-MGR-PASS
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-[#17324D] uppercase text-[10px] tracking-wider">
              Attending Physician Countersignature
            </p>
            <div className="h-6 border-b border-dashed border-slate-400 mt-2" />
            <div className="flex justify-between text-[10px] text-slate-400 pt-1">
              <span>Physician Signature & License #</span>
              <span>Date: ____/____/2026</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-2">
          <span>MedGuard Healthcare Track H4 • Quality Assurance & Safety Analytics</span>
          <span className="italic">Page 1 of 1 • Internal Hospital Record Demonstration</span>
        </div>
      </div>
    </div>
  );
};

export default PatientClinicalReportView;
