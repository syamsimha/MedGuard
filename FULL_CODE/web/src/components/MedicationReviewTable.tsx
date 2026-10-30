import { Pill, ArrowUpRight } from 'lucide-react';
import type { MedicationReviewRecord, ReviewStatus } from '../types/clinical';

interface MedicationReviewTableProps {
  reviews: MedicationReviewRecord[];
  onViewReview?: (review: MedicationReviewRecord) => void;
  onViewAll?: () => void;
}

export const MedicationReviewTable = ({
  reviews,
  onViewReview,
  onViewAll,
}: MedicationReviewTableProps) => {
  const getReviewStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Flagged
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">Recent Medication Reviews</h3>
            <p className="text-xs text-slate-500">Pharmacist verifications and order assessments</p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#168C83] hover:text-[#12726B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Review Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3">Medication Name</th>
              <th className="px-4 py-3">Review Date</th>
              <th className="px-4 py-3">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {reviews.map((item) => (
              <tr
                key={item.id}
                onClick={() => onViewReview && onViewReview(item)}
                className={`hover:bg-slate-50/80 transition-colors ${
                  onViewReview ? 'cursor-pointer' : ''
                }`}
              >
                <td className="px-4 py-3.5 font-medium text-[#17324D]">
                  <div>{item.patientName}</div>
                  <div className="text-[11px] font-mono text-slate-400 font-normal">{item.patientId}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-800">{item.medicationName}</div>
                  <div className="text-[11px] text-slate-500">{item.dosage}</div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                  <div>{item.reviewDate}</div>
                  <div className="text-[11px] text-slate-400">{item.reviewer}</div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {getReviewStatusBadge(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Showing {reviews.length} recent verification checks</span>
        <span className="italic">Demonstration data</span>
      </div>
    </div>
  );
};

export default MedicationReviewTable;
