import { useState, useMemo } from 'react';
import {
  Pill,
  Search,
  X,
  Filter,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  RefreshCw,
} from 'lucide-react';
import type { MedicationReviewRecord, ReviewStatus } from '../types/clinical';

interface MedicationReviewPageProps {
  reviews: MedicationReviewRecord[];
  onSelectReview: (reviewId: string) => void;
  onSelectPatientMeds: (patientId: string) => void;
  onAddNewMedication: () => void;
}

export const MedicationReviewPage = ({
  reviews,
  onSelectReview,
  onSelectPatientMeds,
  onAddNewMedication,
}: MedicationReviewPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ReviewStatus>('All');

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.medicationName.toLowerCase().includes(q) ||
        (item.genericName && item.genericName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchQuery, statusFilter]);

  // Metric counts
  const counts = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((r) => r.status === 'Pending Review').length,
      approved: reviews.filter((r) => r.status === 'Approved').length,
      flagged: reviews.filter((r) => r.status === 'Flagged').length,
    };
  }, [reviews]);

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Flagged
          </span>
        );
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17324D]">
              Medication Review
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Clinical Pharmacist Queue
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verification workflow for hospital prescription orders, dose range checks, and active therapies.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewMedication}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#168C83] hover:bg-[#12726B] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Task 1: 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Medications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-[#17324D] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Medications
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#17324D]">
                {counts.total}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Hospital Formulary Orders</span>
            <span className="font-semibold text-slate-600">Active Queue</span>
          </div>
        </div>

        {/* Metric 2: Pending Reviews */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Reviews
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700">
                {counts.pending}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Awaiting Pharmacist Sign-off</span>
            <span className="text-amber-700 font-semibold">Priority</span>
          </div>
        </div>

        {/* Metric 3: Completed Reviews */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Reviews
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-700">
                {counts.approved}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Verified Clinical Orders</span>
            <span className="text-emerald-700 font-semibold">Approved</span>
          </div>
        </div>

        {/* Metric 4: Flagged Medications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Flagged Medications
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-rose-700">
                {counts.flagged}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Interactions / Dosing Cautions</span>
            <span className="text-rose-700 font-semibold">Review Required</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID or medication..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#17324D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center text-xs text-slate-400 mr-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <span>Status:</span>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'All'
                  ? 'bg-[#17324D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({counts.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Pending Review')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Pending Review'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Pending ({counts.pending})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Approved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Approved ({counts.approved})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Flagged')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Flagged'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Flagged ({counts.flagged})
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || statusFilter !== 'All') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredReviews.length} of {reviews.length} medications
              {searchQuery && <> matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</>}
              {statusFilter !== 'All' && <> with status <strong>{statusFilter}</strong></>}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#168C83] hover:text-[#12726B] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Task 1: Medication Review Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredReviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Patient Name</th>
                  <th className="px-4 py-3.5">Patient ID</th>
                  <th className="px-4 py-3.5">Medication Name</th>
                  <th className="px-4 py-3.5">Dosage</th>
                  <th className="px-4 py-3.5">Frequency</th>
                  <th className="px-4 py-3.5">Prescribed Date</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReviews.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Patient Name */}
                    <td className="px-4 py-3.5 font-bold text-[#17324D] whitespace-nowrap">
                      <div>{item.patientName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.prescriber}</div>
                    </td>

                    {/* Patient ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.patientId}
                      </span>
                    </td>

                    {/* Medication Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{item.medicationName}</div>
                      {item.genericName && (
                        <div className="text-[11px] text-slate-400 font-normal italic">
                          ({item.genericName})
                        </div>
                      )}
                    </td>

                    {/* Dosage */}
                    <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      {item.dosage}
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{item.frequency}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.route}</div>
                    </td>

                    {/* Prescribed Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {item.prescribedDate}
                    </td>

                    {/* Review Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPatientMeds(item.patientId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          title="View all medications for this patient"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden lg:inline">Patient Meds</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectReview(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#12273D] rounded-md transition-colors cursor-pointer shadow-xs"
                          title="Open detailed review assessment"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#17324D] mb-1">
              No medication reviews match criteria
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try adjusting your search terms or status filter.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
              <button
                type="button"
                onClick={onAddNewMedication}
                className="px-3.5 py-1.5 bg-[#168C83] text-white hover:bg-[#12726B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Add Medication
              </button>
            </div>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Demonstration pharmacist verification queue • Phase 4 UI</span>
          <span className="italic">Sample prescription orders</span>
        </div>
      </div>
    </div>
  );
};

export default MedicationReviewPage;
