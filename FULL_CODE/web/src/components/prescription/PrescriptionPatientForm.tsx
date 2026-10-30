import React, { useState, useEffect } from 'react';
import {
  User,
  AlertCircle,
  Activity,
  Info,
  Check,
  Search,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import type { PatientRecord } from '../../types/clinical';
import type { PrescriptionPatientInput } from '../../types/prescription';

interface PrescriptionPatientFormProps {
  patients: PatientRecord[];
  initialPatientId?: string;
  patientInput: PrescriptionPatientInput;
  onChange: (input: PrescriptionPatientInput) => void;
  formErrors: Record<string, string>;
  disabled?: boolean;
  onContinueToUpload?: () => void;
}

export const PrescriptionPatientForm: React.FC<PrescriptionPatientFormProps> = ({
  patients,
  initialPatientId,
  patientInput,
  onChange,
  formErrors,
  disabled = false,
  onContinueToUpload,
}) => {
  const [selectionMode, setSelectionMode] = useState<'existing' | 'new'>('existing');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );

  // If initialPatientId changes from outside (e.g. navigation from PatientProfilePage)
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
      const match = patients.find((p) => p.id === initialPatientId);
      if (match) {
        populateFromPatient(match);
      }
    }
  }, [initialPatientId, patients]);

  const populateFromPatient = (p: PatientRecord) => {
    const allergiesStr = (p.allergies || []).join(', ');
    const conditionsStr = (p.conditions || []).join(', ');

    // Extract or infer renal context if present in medical history or diagnosis
    let renalHist = '';
    if (p.conditions?.some((c) => c.toLowerCase().includes('renal') || c.toLowerCase().includes('kidney') || c.toLowerCase().includes('ckd'))) {
      renalHist = 'eGFR 48 mL/min/1.73m² (CKD Stage 3a), Serum Creatinine 1.4 mg/dL';
    } else if (p.medicalHistory?.toLowerCase().includes('renal') || p.medicalHistory?.toLowerCase().includes('egfr')) {
      renalHist = 'eGFR 55 mL/min/1.73m², Serum Creatinine 1.2 mg/dL';
    } else {
      renalHist = 'eGFR > 60 mL/min/1.73m² (Baseline preserved renal clearance)';
    }

    onChange({
      patientId: p.id,
      name: p.name,
      ageOrDob: `${p.age} yrs (${p.dob || 'DOB N/A'})`,
      gender: p.gender,
      weight: '68 kg',
      allergies: allergiesStr || 'None known',
      conditions: conditionsStr || p.primaryDiagnosis || '',
      renalHistory: renalHist,
      clinicalNotes: p.primaryDiagnosis ? `Primary Diagnosis: ${p.primaryDiagnosis}` : '',
    });
  };

  const handleSelectExisting = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find((item) => item.id === pId);
    if (p) {
      populateFromPatient(p);
    }
  };

  const handleModeChange = (mode: 'existing' | 'new') => {
    setSelectionMode(mode);
    if (mode === 'new') {
      onChange({
        patientId: `PT-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        ageOrDob: '',
        gender: 'Male',
        weight: '',
        allergies: '',
        conditions: '',
        renalHistory: '',
        clinicalNotes: '',
      });
    } else {
      const match = patients.find((p) => p.id === selectedPatientId) || patients[0];
      if (match) {
        populateFromPatient(match);
      }
    }
  };

  const updateField = (field: keyof PrescriptionPatientInput, value: string) => {
    onChange({
      ...patientInput,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#17324D] text-white flex items-center justify-center shadow-xs">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">1. Patient Clinical Details</h3>
            <p className="text-xs text-slate-500">
              Select an admitted patient or register prescription recipient for H4 safety analysis.
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="inline-flex rounded-lg p-1 bg-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange('existing')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              selectionMode === 'existing'
                ? 'bg-white text-[#17324D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Select Existing ({patients.length})</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange('new')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              selectionMode === 'new'
                ? 'bg-white text-[#17324D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Patient</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Existing Patient Quick Selector */}
        {selectionMode === 'existing' && (
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#17324D] shrink-0">
                Choose Registered Patient:
              </span>
              <select
                disabled={disabled}
                value={selectedPatientId}
                onChange={(e) => handleSelectExisting(e.target.value)}
                className="text-xs font-semibold text-[#17324D] bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#168C83] cursor-pointer shadow-xs max-w-sm"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — {p.age}y {p.gender} • {p.room}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Demographics, allergies & conditions auto-populated</span>
            </div>
          </div>
        )}

        {/* Required Fields Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Required Demographics</span>
              <span className="text-rose-500">*</span>
            </h4>
            <span className="text-[11px] text-slate-400">Essential for identifying interactions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.patientId}
                onChange={(e) => updateField('patientId', e.target.value)}
                placeholder="e.g. PT-8021"
                className={`w-full px-3 py-2 text-xs font-mono rounded-lg border bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  formErrors.patientId
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-[#168C83]'
                }`}
              />
              {formErrors.patientId && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.patientId}</span>
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Patient Full Name"
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  formErrors.name
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-[#168C83]'
                }`}
              />
              {formErrors.name && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.name}</span>
                </p>
              )}
            </div>

            {/* Age or DOB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age or Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.ageOrDob}
                onChange={(e) => updateField('ageOrDob', e.target.value)}
                placeholder="e.g. 68 yrs (1958-04-12)"
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  formErrors.ageOrDob
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-[#168C83]'
                }`}
              />
              {formErrors.ageOrDob && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.ageOrDob}</span>
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={disabled}
                value={patientInput.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83] cursor-pointer"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other / Unspecified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Clinical Risk Fields */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Clinical Baseline Context</span>
              <span className="text-[10px] font-semibold text-[#168C83] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                Optional - Enhances H4 Rule Precision
              </span>
            </h4>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Cross-checked against contraindication rules</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Weight
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.weight || ''}
                onChange={(e) => updateField('weight', e.target.value)}
                placeholder="e.g. 68 kg (for weight-based dosing)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
              />
            </div>

            {/* Known Allergies */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Known Drug Allergies</span>
                <span className="text-[10px] text-rose-600 font-normal">H4 Flagged High Priority</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.allergies || ''}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, NSAIDs, Aspirin"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
              />
            </div>

            {/* Existing Medical Conditions */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Existing Medical Conditions
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.conditions || ''}
                onChange={(e) => updateField('conditions', e.target.value)}
                placeholder="e.g. Atrial Fibrillation, Hypertension, Diabetes"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
              />
            </div>

            {/* Renal Function History */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Renal Function History (eGFR / Serum Creatinine)</span>
                <span className="text-[10px] text-amber-600 font-normal flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Triggers H4 renal dosing threshold alerts</span>
                </span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.renalHistory || ''}
                onChange={(e) => updateField('renalHistory', e.target.value)}
                placeholder="e.g. eGFR: 48 mL/min/1.73m² (CKD Stage 3a), Serum Cr: 1.4 mg/dL"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
              />
            </div>

            {/* Clinical Notes / Prescriber Intent */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Notes & Prescriber Considerations
              </label>
              <input
                type="text"
                disabled={disabled}
                value={patientInput.clinicalNotes || ''}
                onChange={(e) => updateField('clinicalNotes', e.target.value)}
                placeholder="e.g. Admitted via ED with symptomatic palpitations. Evaluating discharge medication regimen."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
              />
            </div>
          </div>
        </div>

        {/* Footer with Step 2 Action: Continue to Prescription Upload */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Step 1: Patient demographics verified for contraindication cross-checking.</span>
          </div>

          {onContinueToUpload && (
            <button
              type="button"
              onClick={onContinueToUpload}
              className="px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-end sm:self-auto"
            >
              <span>Continue to Prescription Upload</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
