import {
  ArrowLeft,
  Pill,
  PlusCircle,
  Building2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  User,
  History,
} from 'lucide-react';
import type { PatientRecord, PatientStatus } from '../types/clinical';

interface PatientMedicationsDetailPageProps {
  patient: PatientRecord;
  onBackToReviews: () => void;
  onAddNewMedication: (patientId: string) => void;
  onViewPatientProfile: (patientId: string) => void;
}

export const PatientMedicationsDetailPage = ({
  patient,
  onBackToReviews,
  onAddNewMedication,
  onViewPatientProfile,
}: PatientMedicationsDetailPageProps) => {
  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active Inpatient
          </span>
        );
      case 'Under Observation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Under Observation
          </span>
        );
      case 'Discharged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Discharged
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToReviews}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medication Review Queue</span>
        </button>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onViewPatientProfile(patient.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Full Clinical Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onAddNewMedication(patient.id)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168C83] hover:bg-[#12726B] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Prescribe Medication</span>
          </button>
        </div>
      </div>

      {/* Patient Clinical Context Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-xl bg-[#17324D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              {patient.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[#17324D]">{patient.name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  {patient.id}
                </span>
                {getStatusBadge(patient.status)}
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{patient.gender} • {patient.age} yrs</span>
                <span>•</span>
                <span>Blood Group: <strong className="text-slate-700">{patient.bloodGroup || 'N/A'}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {patient.room}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-700 flex items-center gap-2">
                <span className="font-semibold text-slate-500">Diagnosis:</span>
                <span>{patient.primaryDiagnosis || 'Clinical intake pending'}</span>
              </div>
            </div>
          </div>

          {/* Allergy Summary Pill */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs md:max-w-xs shrink-0">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Documented Allergies:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {patient.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((all, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white border border-amber-200 rounded text-[11px] font-medium text-amber-900"
                  >
                    {all}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">No known drug allergies (NKDA)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Medications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Current Active Medications
              </h2>
              <p className="text-xs text-slate-500">Active prescription regimens being administered</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {patient.currentMedications?.length || 0} Active Orders
          </span>
        </div>

        {patient.currentMedications && patient.currentMedications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Medication Name</th>
                  <th className="px-4 py-3">Dosage</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Prescribing Doctor</th>
                  <th className="px-4 py-3">Medication Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {patient.currentMedications.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#17324D]">{med.name}</div>
                      {med.genericName && (
                        <div className="text-[11px] text-slate-400 italic font-normal">
                          ({med.genericName})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {med.dosage}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {med.frequency}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {med.route}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                      {med.startDate}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {med.prescriber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No active medications registered</p>
            <p className="text-[11px] text-slate-400 mt-1">Click &ldquo;Prescribe Medication&rdquo; to add a new order.</p>
          </div>
        )}
      </div>

      {/* Previous Medications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Previous Medications & Completed Therapies
              </h2>
              <p className="text-xs text-slate-500">Discontinued orders and completed antimicrobial/bridging courses</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {patient.previousMedications?.length || 0} Historical Orders
          </span>
        </div>

        {patient.previousMedications && patient.previousMedications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Medication Name</th>
                  <th className="px-4 py-3">Dosage</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Duration Dates</th>
                  <th className="px-4 py-3">Prescribing Doctor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Clinical Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {patient.previousMedications.map((pastMed) => (
                  <tr key={pastMed.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{pastMed.name}</div>
                      {pastMed.genericName && (
                        <div className="text-[11px] text-slate-400 italic">
                          ({pastMed.genericName})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      {pastMed.dosage}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {pastMed.route}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pastMed.startDate} to {pastMed.endDate || 'Recent'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {pastMed.prescriber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          pastMed.status === 'Completed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {pastMed.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                      {pastMed.notes || 'Course concluded as planned.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            <p>No historical discontinued orders on record for this patient.</p>
          </div>
        )}

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Patient longitudinal medication administration record (MAR)</span>
          <span className="italic">Demonstration data</span>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicationsDetailPage;
