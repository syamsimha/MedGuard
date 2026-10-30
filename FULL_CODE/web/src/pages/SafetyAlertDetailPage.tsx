import { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  User,
  Pill,
  BookOpen,
  FileText,
  Clock,
  ExternalLink,
  Save,
  MessageSquare,
  Activity,
  Stethoscope,
  Info,
  Flag,
} from 'lucide-react';
import type {
  SafetyAlertRecord,
  PatientRecord,
  AlertReviewStatus,
  AlertSeverity,
} from '../types/clinical';

interface SafetyAlertDetailPageProps {
  alert: SafetyAlertRecord;
  patient?: PatientRecord;
  onBackToAlerts: () => void;
  onUpdateAlertStatus: (
    alertId: string,
    newStatus: AlertReviewStatus,
    notes?: string,
    action?: 'RESOLVE' | 'OVERRIDE' | 'UNDER_REVIEW'
  ) => void;
  onViewPatientProfile: (patientId: string) => void;
  onViewPatientMeds: (patientId: string) => void;
}

export const SafetyAlertDetailPage = ({
  alert,
  patient,
  onBackToAlerts,
  onUpdateAlertStatus,
  onViewPatientProfile,
  onViewPatientMeds,
}: SafetyAlertDetailPageProps) => {
  const [reviewNotes, setReviewNotes] = useState<string>(
    alert.reviewNotes || ''
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const showLocalFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveNotesOnly = () => {
    onUpdateAlertStatus(alert.id, alert.reviewStatus, reviewNotes);
    showLocalFeedback('Clinical review notes saved successfully.');
  };

  const [overrideError, setOverrideError] = useState<string | null>(null);

  const handleSetStatus = (newStatus: AlertReviewStatus) => {
    setOverrideError(null);
    onUpdateAlertStatus(
      alert.id,
      newStatus,
      reviewNotes,
      newStatus === 'Resolved' ? 'RESOLVE' : 'UNDER_REVIEW'
    );
    showLocalFeedback(`Alert ${alert.id} marked as "${newStatus}".`);
  };

  const handleOverrideAlert = () => {
    if (!reviewNotes.trim()) {
      setOverrideError('A clinical justification rationale is strictly required before overriding a safety alert.');
      return;
    }
    setOverrideError(null);
    onUpdateAlertStatus(alert.id, 'Resolved', reviewNotes, 'OVERRIDE');
    showLocalFeedback(`Alert ${alert.id} overridden with clinical rationale.`);
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            Critical Severity Alert
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            High Risk Warning
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-600" />
            Moderate Risk Caution
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Low Risk Advisory
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertReviewStatus) => {
    switch (status) {
      case 'Unresolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Unresolved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Under Clinical Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved & Verified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBackToAlerts}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medication Safety Alerts Queue</span>
        </button>

        <div className="flex items-center space-x-2">
          {getStatusBadge(alert.reviewStatus)}
          {getSeverityBadge(alert.severity)}
        </div>
      </div>

      {/* Main Alert Banner */}
      <div
        className={`p-6 rounded-xl border shadow-xs ${
          alert.severity === 'Critical'
            ? 'bg-rose-50/40 border-rose-200'
            : alert.severity === 'High'
            ? 'bg-amber-50/40 border-amber-200'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-white">
                {alert.id}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-700">
                {alert.category}
              </span>
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Detected: {alert.date}
              </span>
            </div>

            <h1 className="text-xl font-bold text-[#17324D]">
              {alert.alertType}
            </h1>

            <p className="text-sm text-slate-800 font-medium leading-relaxed max-w-4xl">
              {alert.summary}
            </p>
          </div>

          {/* Quick Status Box */}
          <div className="shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-xs min-w-[240px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Reviewer Status
            </p>
            <div className="mt-1.5 flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-slate-800">
                {alert.reviewedBy || 'Pending Clinical Pharmacist'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Current Status: <strong className="text-[#17324D]">{alert.reviewStatus}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Column (Clinical Analysis) / Right Column (Patient & Review Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Clinical Analysis, Evidence, Affected Meds */}
        <div className="lg:col-span-7 space-y-6">
          {/* Affected Medications Box (Task 2) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <Pill className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#17324D]">
                  Affected Medication(s)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onViewPatientMeds(alert.patientId)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full MAR</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {alert.affectedMedications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start space-x-3"
                  >
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-xs">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{med}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Active Inpatient Prescription Order
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Category Visual Clarification */}
              {alert.category === 'Drug-Drug Interaction' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pharmacological Conflict:</span> Simultaneous administration of these agents precipitates competitive metabolic clearance or additive bleeding/cardiotoxicity risk.
                  </div>
                </div>
              )}

              {alert.category === 'Duplicate Medication' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Therapeutic Redundancy:</span> Concurrent overlapping prescriptions of the same therapeutic drug class with identical mechanism of action.
                  </div>
                </div>
              )}

              {alert.category === 'Renal Safety' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                  <Stethoscope className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Renal Elimination Warning:</span> Drug elimination relies on glomerular filtration. Dosing exceeds safety limits for the patient&apos;s current renal clearance stage.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Clinical Explanation (Task 3) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center space-x-2">
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Detailed Clinical Mechanism & Risk
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                <p>{alert.detailedExplanation}</p>
              </div>

              {/* Clinical Evidence & Reference */}
              {alert.evidenceSource && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Evidence Source & Monograph Reference
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-700">
                    {alert.evidenceSource}
                  </p>
                </div>
              )}

              {/* Recommendation Callout */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Recommended Clinical Action</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {alert.clinicalRecommendation || alert.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Patient Profile Context & Pharmacist Review Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Details Card (Task 3 & 7) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#17324D]">
                  Patient Demographics
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onViewPatientProfile(alert.patientId)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-[#17324D]">
                    {alert.patientName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    MRN: {alert.patientId}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {alert.patientContext?.room || patient?.room || 'Inpatient Bed'}
                </span>
              </div>

              {patient && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Age / Gender:</span>
                    <p className="font-semibold text-slate-800">
                      {patient.age} yrs • {patient.gender}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Blood Group:</span>
                    <p className="font-semibold text-slate-800">{patient.bloodGroup}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Primary Diagnosis:</span>
                    <p className="font-semibold text-slate-800">
                      {patient.primaryDiagnosis || 'Clinical intake pending'}
                    </p>
                  </div>
                </div>
              )}

              {/* Documented Allergies */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Documented Allergies
                </span>
                <div className="flex flex-wrap gap-1">
                  {(alert.patientContext?.allergies || patient?.allergies || ['None on record']).map(
                    (alg, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        {alg}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Renal Function Markers (if available) */}
              {(alert.patientContext?.eGFR || alert.patientContext?.serumCreatinine) && (
                <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-blue-700" />
                    <span>Renal Panel Parameters</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {alert.patientContext.eGFR && (
                      <div>
                        <span className="text-slate-500 text-[10px]">Estimated GFR:</span>
                        <p className="font-bold text-slate-900 font-mono">
                          {alert.patientContext.eGFR}
                        </p>
                      </div>
                    )}
                    {alert.patientContext.serumCreatinine && (
                      <div>
                        <span className="text-slate-500 text-[10px]">Serum Creatinine:</span>
                        <p className="font-bold text-slate-900 font-mono">
                          {alert.patientContext.serumCreatinine}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pharmacist Review & Interactive Resolution Actions (Task 3) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center space-x-2">
              <div className="p-1.5 bg-[#17324D] text-white rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Clinical Review & Status
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Feedback toast banner if triggered locally */}
              {feedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Review Notes Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    Pharmacist Clinical Review Notes
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Audit trail logged
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Document clinical rationale, attending physician consultation, or therapy adjustments..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleSaveNotesOnly}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>

              {/* Interactive Status Decision Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Change Review Status
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {/* Mark as Under Review */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('Under Review')}
                    disabled={alert.reviewStatus === 'Under Review'}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      alert.reviewStatus === 'Under Review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-300 opacity-60 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {alert.reviewStatus === 'Under Review'
                        ? 'Currently Under Review'
                        : 'Mark as Under Review'}
                    </span>
                  </button>

                  {/* Flag for Further Review */}
                  <button
                    type="button"
                    onClick={() => {
                      const noteAppend = reviewNotes
                        ? `${reviewNotes}\n[FLAGGED FOR SPECIALIST REVIEW - Escalate to Attending Cardiologist/Nephrologist]`
                        : '[FLAGGED FOR SPECIALIST REVIEW - Escalate to Attending Cardiologist/Nephrologist]';
                      setReviewNotes(noteAppend);
                      onUpdateAlertStatus(alert.id, 'Under Review', noteAppend);
                      showLocalFeedback('Alert flagged for specialist review.');
                    }}
                    className="w-full py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Flag for Further Clinical Review</span>
                  </button>

                  {/* Mark as Resolved */}
                  <button
                    type="button"
                    onClick={() => handleSetStatus('Resolved')}
                    disabled={alert.reviewStatus === 'Resolved'}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      alert.reviewStatus === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 opacity-60 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {alert.reviewStatus === 'Resolved'
                        ? 'Alert Marked as Resolved'
                        : 'Mark as Resolved (Approve Mitigation)'}
                    </span>
                  </button>

                  {/* Override Alert (Phase 5) */}
                  <button
                    type="button"
                    onClick={handleOverrideAlert}
                    disabled={alert.reviewStatus === 'Resolved'}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      alert.reviewStatus === 'Resolved'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 opacity-60 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Override Alert (With Clinical Rationale)</span>
                  </button>
                  {overrideError && (
                    <p className="text-[11px] text-rose-600 font-semibold px-1">{overrideError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demonstration Regulatory Disclaimer Banner (Task 6) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start space-x-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Simulated Clinical Demonstration:</strong> MedGuard medication safety alerts are populated with fictional patient profiles for software demonstration. Clinical decision support recommendations are designed for illustrative workflow verification and do not substitute certified pharmacist or medical doctor consultation.
        </p>
      </div>
    </div>
  );
};

export default SafetyAlertDetailPage;
