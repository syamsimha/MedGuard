import { User, Eye, ArrowUpRight } from 'lucide-react';
import type { PatientRecord, PatientStatus } from '../types/clinical';

interface PatientTableProps {
  patients: PatientRecord[];
  onViewProfile: (patient: PatientRecord) => void;
  onViewAll?: () => void;
}

export const PatientTable = ({
  patients,
  onViewProfile,
  onViewAll,
}: PatientTableProps) => {
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
            Observation
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">Recent Patients</h3>
            <p className="text-xs text-slate-500">Admissions and ongoing clinical monitoring</p>
          </div>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#168C83] hover:text-[#12726B] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Patients</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Patient ID</th>
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Last Visit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-3.5 font-mono text-[11px] font-semibold text-[#17324D]">
                  {patient.id}
                </td>
                <td className="px-4 py-3.5 font-medium text-[#17324D]">
                  <div>{patient.name}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{patient.room}</div>
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {patient.age} yrs
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {patient.lastVisit}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {getStatusBadge(patient.status)}
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onViewProfile(patient)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#17324D] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title={`View profile for ${patient.name}`}
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Profile</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Showing {patients.length} demonstration patient records</span>
        <span className="italic">Sample clinical records</span>
      </div>
    </div>
  );
};

export default PatientTable;
