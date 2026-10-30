import { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  X,
  Phone,
  Mail,
  Eye,
  Filter,
  UserX,
  RefreshCw,
  Building2,
} from 'lucide-react';
import type { PatientRecord, PatientStatus } from '../types/clinical';

interface PatientsDirectoryPageProps {
  patients: PatientRecord[];
  onViewProfile: (patientId: string) => void;
  onAddNewPatient: () => void;
}

export const PatientsDirectoryPage = ({
  patients,
  onViewProfile,
  onAddNewPatient,
}: PatientsDirectoryPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');

  // Filtered patient list
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (patient.phone && patient.phone.includes(searchQuery));

      const matchesStatus =
        statusFilter === 'All' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Counts for status filters
  const counts = useMemo(() => {
    return {
      all: patients.length,
      active: patients.filter((p) => p.status === 'Active').length,
      observation: patients.filter((p) => p.status === 'Under Observation').length,
      discharged: patients.filter((p) => p.status === 'Discharged').length,
    };
  }, [patients]);

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case 'Under Observation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Under Observation
          </span>
        );
      case 'Discharged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Discharged
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
              Patient Management
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {patients.length} Total Registered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hospital electronic health directory, medication allergy logs, and active admissions.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewPatient}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#168C83] hover:bg-[#12726B] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID (e.g. PT-8021) or email..."
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

          {/* Status Filter Pills */}
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
              All ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Active'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Active ({counts.active})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Under Observation')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Under Observation'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Observation ({counts.observation})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Discharged')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'Discharged'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Discharged ({counts.discharged})
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || statusFilter !== 'All') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredPatients.length} of {patients.length} patients
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

      {/* Patient Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Patient ID</th>
                  <th className="px-4 py-3.5">Name & Ward</th>
                  <th className="px-4 py-3.5">Age / Gender</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Last Visit</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Patient ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#17324D] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {patient.id}
                      </span>
                    </td>

                    {/* Name & Ward */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#17324D] text-sm">
                        {patient.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{patient.room}</span>
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{patient.age} yrs</div>
                      <div className="text-[11px] text-slate-500">{patient.gender} • {patient.bloodGroup || 'Blood Group: N/A'}</div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{patient.email}</span>
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {patient.lastVisit}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(patient.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewProfile(patient.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                        title={`Open detailed profile for ${patient.name}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Search/Filter State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#17324D] mb-1">
              No patients found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              We couldn&apos;t find any patient matching your filter criteria. Try adjusting your search term or status selection.
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
                onClick={onAddNewPatient}
                className="px-3.5 py-1.5 bg-[#168C83] text-white hover:bg-[#12726B] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Add New Patient
              </button>
            </div>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Demonstration clinical directory • Phase 3 UI</span>
          <span className="italic">Sample patient dataset (strictly fictional)</span>
        </div>
      </div>
    </div>
  );
};

export default PatientsDirectoryPage;
