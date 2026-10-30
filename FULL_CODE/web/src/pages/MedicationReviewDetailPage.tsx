import { useState } from 'react';
import {
  ArrowLeft,
  Pill,
  User,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Edit3,
  Check,
  Info,
} from 'lucide-react';
import type {
  MedicationReviewRecord,
  PatientRecord,
  ReviewStatus,
} from '../types/clinical';

interface MedicationReviewDetailPageProps {
  review: MedicationReviewRecord;
  patient?: PatientRecord;
  onBackToReviews: () => void;
  onUpdateReviewStatus: (
    reviewId: string,
    newStatus: ReviewStatus,
    newNotes?: string
  ) => void;
}

export const MedicationReviewDetailPage = ({
  review,
  patient,
  onBackToReviews,
  onUpdateReviewStatus,
}: MedicationReviewDetailPageProps) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(
    review.clinicalNotes || review.notes || ''
  );

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Flagged for Further Review
          </span>
        );
    }
  };

  const handleMarkAsReviewed = () => {
    onUpdateReviewStatus(review.id, 'Approved', notesText);
  };

  const handleFlagForReview = () => {
    onUpdateReviewStatus(review.id, 'Flagged', notesText);
  };

  const handleSaveNotes = () => {
    onUpdateReviewStatus(review.id, review.status, notesText);
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToReviews}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medication Review Queue</span>
        </button>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-bold">
            {review.id}
          </span>
          {getStatusBadge(review.status)}
        </div>
      </div>

      {/* Review Scope Disclaimer (Task 4 requirement) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Demonstration Workflow:</strong> These verification actions simulate the clinical pharmacist review queue in frontend memory. They do not constitute formal medical approval or dispense authorization.
        </div>
      </div>

      {/* Hero Review Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#17324D] to-[#168C83] p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-white shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-slate-100 border border-white/20">
                  Prescription Assessment
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {review.medicationName}
                </h1>
                <p className="text-xs text-slate-200 mt-0.5">
                  {review.dosage} • {review.frequency} • {review.route}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-200 block">Prescribed Date</span>
              <span className="font-semibold text-white text-sm">{review.prescribedDate}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="font-semibold">Assigned Reviewer:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-medium">
              {review.reviewer}
            </span>
            <span className="text-slate-400">• Last Reviewed: {review.reviewDate}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleFlagForReview}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                review.status === 'Flagged'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flag for Further Review</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAsReviewed}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                review.status === 'Approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Reviewed</span>
            </button>
          </div>
        </div>

        {/* Review Sections Grid */}
        <div className="p-6 space-y-6">
          {/* Patient Context Section */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-200">
              <User className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Patient Context
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Patient Name
                </span>
                <span className="font-bold text-slate-800">{review.patientName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Patient MRN
                </span>
                <span className="font-mono font-bold text-[#17324D]">{review.patientId}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Ward / Location
                </span>
                <span className="font-semibold text-slate-800">
                  {patient?.room || 'Inpatient Floor 3'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Primary Diagnosis
                </span>
                <span className="font-medium text-slate-700">
                  {patient?.primaryDiagnosis || 'Clinical intake pending'}
                </span>
              </div>
            </div>

            {/* Documented Allergies */}
            <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-900">Documented Allergies:</span>
                <span className="text-slate-700">
                  {patient?.allergies?.join(', ') || 'No known allergies reported (NKDA)'}
                </span>
              </div>
            </div>
          </div>

          {/* Prescription & Order Details */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-200">
              <Pill className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Prescription & Administration Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Prescribing Physician
                </span>
                <span className="font-bold text-slate-800">{review.prescriber}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Dosage & Route
                </span>
                <span className="font-semibold text-slate-800">
                  {review.dosage} via {review.route}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Frequency & Schedule
                </span>
                <span className="font-semibold text-slate-800">{review.frequency}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Start Date
                </span>
                <span className="font-semibold text-slate-800">
                  {review.startDate || review.prescribedDate}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Expected Duration / End Date
                </span>
                <span className="font-semibold text-slate-800">
                  {review.endDate || 'Ongoing therapy'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Formulary Status
                </span>
                <span className="font-semibold text-emerald-700">Hospital Inpatient Tier 1</span>
              </div>
            </div>
          </div>

          {/* Clinical Pharmacist Notes & Rationale */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#168C83]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                  Clinical Pharmacist Notes
                </h2>
              </div>

              {!isEditingNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-semibold text-[#168C83] hover:text-[#12726B] flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Add / Edit Notes</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Enter clinical rationale, dosing justification, or interaction mitigation recommendations..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83] text-slate-800"
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotesText(review.clinicalNotes || review.notes || '');
                      setIsEditingNotes(false);
                    }}
                    className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3.5 py-1.5 bg-[#168C83] hover:bg-[#12726B] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-medium">
                {review.clinicalNotes || review.notes || (
                  <span className="text-slate-400 italic">
                    No clinical review notes entered yet. Click &ldquo;Add / Edit Notes&rdquo; to document review rationale.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
          <span>MedGuard Inpatient Review Log</span>
          <span className="italic">Local demonstration state</span>
        </div>
      </div>
    </div>
  );
};

export default MedicationReviewDetailPage;
