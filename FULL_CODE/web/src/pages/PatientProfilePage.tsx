import { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Building2,
  Phone,
  Mail,
  HeartPulse,
  ShieldAlert,
  AlertTriangle,
  Pill,
  FileCheck2,
  Calendar,
  User,
  ShieldCheck,
  Activity,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type {
  PatientRecord,
  PatientStatus,
  MedicationReviewRecord,
  SafetyAlertRecord,
  AlertSeverity,
} from '../types/clinical';
import { EditPatientModal } from '../components/modals/EditPatientModal';

interface PatientProfilePageProps {
  patient: PatientRecord;
  reviews: MedicationReviewRecord[];
  alerts: SafetyAlertRecord[];
  onBackToPatients: () => void;
  onUpdatePatient: (updated: PatientRecord) => void;
  onNavigateToMedicationReview?: (patientId?: string) => void;
  onSelectAlert?: (alertId: string) => void;
  onNavigateToClinicalReport?: (patientId: string) => void;
}

type ProfileTab = 'overview' | 'allergies-conditions' | 'medications' | 'reviews' | 'alerts';

export const PatientProfilePage = ({
  patient,
  reviews,
  alerts,
  onBackToPatients,
  onUpdatePatient,
  onNavigateToMedicationReview,
  onSelectAlert,
  onNavigateToClinicalReport,
}: PatientProfilePageProps) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter patient-specific reviews and alerts
  const patientReviews = reviews.filter(
    (r) => r.patientId === patient.id || r.patientName.toLowerCase() === patient.name.toLowerCase()
  );

  const patientAlerts = alerts.filter(
    (a) => a.patientId === patient.id || a.patientName.toLowerCase() === patient.name.toLowerCase()
  );

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Active Inpatient
          </span>
        );
      case 'Under Observation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Under Observation
          </span>
        );
      case 'Discharged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Discharged / Outpatient
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            High Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
            Moderate
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Low Risk
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToPatients}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </button>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 font-mono">
            ID: {patient.id}
          </span>
          {onNavigateToClinicalReport && (
            <button
              type="button"
              onClick={() => onNavigateToClinicalReport(patient.id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#17324D] border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Generate Report</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Patient Hero Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#17324D] via-[#1a3d60] to-[#168C83] p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-2xl text-white shadow-inner shrink-0">
                {patient.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                    {patient.name}
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 text-slate-100 border border-white/20">
                    {patient.id}
                  </span>
                </div>
                <div className="text-xs text-slate-200 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{patient.gender}</span>
                  <span>•</span>
                  <span>{patient.age} years old (DOB: {patient.dob || 'N/A'})</span>
                  <span>•</span>
                  <span>Blood Group: <strong className="text-white">{patient.bloodGroup || 'N/A'}</strong></span>
                </div>
                <div className="text-xs text-emerald-200 font-medium flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-white/80" />
                  <span>{patient.room}</span>
                  <span className="text-white/60">•</span>
                  <span className="text-slate-200">Last Clinical Encounter: {patient.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              {getStatusBadge(patient.status)}
              <span className="text-[11px] text-slate-300">
                TalentAP Inpatient Center H4
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Tabs Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 flex overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#168C83] text-[#17324D] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-[#168C83]" />
            <span>Personal Info & History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('allergies-conditions')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'allergies-conditions'
                ? 'border-[#168C83] text-[#17324D] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Allergies & Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medications')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'medications'
                ? 'border-[#168C83] text-[#17324D] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="w-4 h-4 text-blue-600" />
            <span>Current Medications ({patient.currentMedications?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-[#168C83] text-[#17324D] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Medication Reviews ({patientReviews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'border-[#168C83] text-[#17324D] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Safety Alerts ({patientAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}

      {/* 1. Overview & Personal Information + Medical History */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section A: Personal Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center space-x-2 pb-3 mb-5 border-b border-slate-200">
              <User className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Section A: Personal & Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Full Name
                </span>
                <span className="font-semibold text-slate-800 text-sm">{patient.name}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Medical Record Number (MRN)
                </span>
                <span className="font-mono font-bold text-[#17324D]">{patient.id}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Date of Birth & Age
                </span>
                <span className="font-semibold text-slate-800">
                  {patient.dob || '1958-04-12'} ({patient.age} yrs)
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Gender & Blood Type
                </span>
                <span className="font-semibold text-slate-800">
                  {patient.gender} • Blood Group {patient.bloodGroup || 'O+'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Contact Phone
                </span>
                <div className="flex items-center space-x-1.5 font-mono text-slate-800 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patient.phone}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Contact Email
                </span>
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Room / Ward Location
                </span>
                <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-[#168C83]" />
                  <span>{patient.room}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Emergency Contact
                </span>
                <div className="font-semibold text-slate-800">
                  {patient.emergencyContact?.name || 'Robert Vance'} ({patient.emergencyContact?.relation || 'Spouse'}) • {patient.emergencyContact?.phone || patient.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Medical History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Section B: Medical History & Baseline Clinical Profile
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 leading-relaxed font-medium">
              {patient.medicalHistory || 'No comprehensive medical history records filed.'}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Verified against EHR records</span>
              <span>TalentAP Clinical Intake</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Known Allergies & Medical Conditions */}
      {activeTab === 'allergies-conditions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section C: Known Allergies */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Section C: Known Allergies & Sensitivities
                </h2>
              </div>

              {patient.allergyDetails && patient.allergyDetails.length > 0 ? (
                <div className="space-y-3">
                  {patient.allergyDetails.map((allergy, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#17324D]">
                          {allergy.allergen}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            allergy.severity === 'Severe'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {allergy.severity} Reaction
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Reaction: {allergy.reaction}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Documented Adverse Allergies</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Patient profile confirms no known drug allergies (NKDA).</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Alerts engine cross-checks all prescriptions</span>
              <span className="italic">Active Screening</span>
            </div>
          </div>

          {/* Section D: Existing Medical Conditions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-200">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Section D: Existing Medical Conditions
                </h2>
              </div>

              {patient.conditionDetails && patient.conditionDetails.length > 0 ? (
                <div className="space-y-3">
                  {patient.conditionDetails.map((cond, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#17324D]">
                          {cond.condition}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {cond.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1">
                        Diagnosed: {cond.diagnosedDate}
                      </div>
                      {cond.notes && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {cond.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Primary Diagnosis Only</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{patient.primaryDiagnosis || 'Clinical intake pending'}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>ICD-10 clinical condition mapping</span>
              <span className="italic">Updated Today</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Section E: Current Medications */}
      {activeTab === 'medications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17324D]">
                  Section E: Current Active Medications
                </h2>
                <p className="text-xs text-slate-500">Active prescription regimens in hospital administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {patient.currentMedications?.length || 0} Orders Active
              </span>
              {onNavigateToMedicationReview && (
                <button
                  type="button"
                  onClick={() => onNavigateToMedicationReview(patient.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Review in Pharmacist Queue</span>
                </button>
              )}
            </div>
          </div>

          {patient.currentMedications && patient.currentMedications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Medication Name</th>
                    <th className="px-4 py-3">Dosage & Frequency</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Prescriber</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {patient.currentMedications.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#17324D]">
                        {med.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">{med.dosage}</span>
                        <div className="text-[11px] text-slate-500">{med.frequency}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        {med.route}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                        {med.prescriber}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                        {med.startDate}
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
            <div className="p-12 text-center text-xs text-slate-500">
              <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active medication orders found</p>
              <p className="text-[11px] text-slate-400 mt-1">Prescriptions will appear here once entered in Medication Review.</p>
            </div>
          )}

          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified with hospital electronic pharmacy formulary</span>
            <span className="italic">Sample medication profile</span>
          </div>
        </div>
      )}

      {/* 4. Section F: Previous Medication Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17324D]">
                  Section F: Previous Medication Reviews
                </h2>
                <p className="text-xs text-slate-500">Clinical pharmacist verification audit logs</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {patientReviews.length} Reviews On File
            </span>
          </div>

          {patientReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Review Date</th>
                    <th className="px-4 py-3">Medication Name</th>
                    <th className="px-4 py-3">Dosage</th>
                    <th className="px-4 py-3">Pharmacist / Reviewer</th>
                    <th className="px-4 py-3">Review Status</th>
                    <th className="px-4 py-3">Clinical Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {patientReviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {rev.reviewDate}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#17324D]">
                        {rev.medicationName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {rev.dosage}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {rev.reviewer}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
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
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                        {rev.notes || 'Routine dosage verification.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No prior medication reviews on record</p>
              <p className="text-[11px] text-slate-400 mt-1">Pharmacist reviews for this patient will be cataloged here.</p>
            </div>
          )}

          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Historical safety verification logs</span>
            <span className="italic">Sample data</span>
          </div>
        </div>
      )}

      {/* 5. Section G: Safety Alert History */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#17324D]">
                  Section G: Safety Alert History
                </h2>
                <p className="text-xs text-slate-500">Contraindications, interaction flags, and dose safety triggers</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {patientAlerts.length} Active Flags
            </span>
          </div>

          {patientAlerts.length > 0 ? (
            <div className="divide-y divide-slate-100 p-2">
              {patientAlerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-slate-50/70 transition-colors rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-[#17324D]">
                        {alert.alertType}
                      </span>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Logged: {alert.date}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs text-slate-800 font-medium mb-2.5 leading-relaxed">
                    <strong>Trigger:</strong> {alert.summary}
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-slate-800 flex items-start space-x-2 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="text-emerald-900">Clinical Recommendation:</strong> {alert.recommendation}
                    </div>
                  </div>

                  {onSelectAlert && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onSelectAlert(alert.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <span>View Full Alert Dossier ({alert.id})</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No safety alerts logged for this patient</p>
              <p className="text-[11px] text-slate-400 mt-1">Prescription regimen is free of active contraindications.</p>
            </div>
          )}

          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Clinical decision support rules engine alert registry</span>
            <span className="italic">Sample alert logs</span>
          </div>
        </div>
      )}

      {/* Edit Patient Record Modal */}
      <EditPatientModal
        patient={patient}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdatePatient={onUpdatePatient}
      />
    </div>
  );
};

export default PatientProfilePage;
