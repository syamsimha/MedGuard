import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Search,
  Check,
  AlertCircle,
  Pill,
  ShieldAlert,
  CheckCircle2,
  X,
} from 'lucide-react';
import type {
  ExtractedMedication,
  PrescriptionPatientInput,
  ProposedMedicationInput,
} from '../../types/prescription';
import {
  HOSPITAL_FORMULARY_REFERENCES,
  type FormularyReference,
} from '../../data/formularyReferences';

interface ProposedMedicationFormProps {
  patient: PrescriptionPatientInput;
  existingMedications: ExtractedMedication[];
  onSubmit: (proposedMed: ProposedMedicationInput) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ProposedMedicationForm: React.FC<ProposedMedicationFormProps> = ({
  patient,
  existingMedications,
  onSubmit,
  onCancel,
  isProcessing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReference, setSelectedReference] = useState<FormularyReference | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProposedMedicationInput>({
    id: `PROP-${Date.now()}`,
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin Hydrochloride',
    brandName: 'Cipro',
    strength: '500 mg',
    dosage: '1 tablet (500 mg)',
    dosageUnit: 'tablet',
    frequency: 'Twice daily (BID)',
    route: 'Oral',
    proposedStartDate: new Date().toISOString().split('T')[0],
    proposedDuration: '7 days',
    clinicalNotes: 'Suspected acute bacterial infection. Evaluating tolerability against current anticoagulant therapy.',
    indication: 'Urinary tract infection',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter formulary suggestions
  const filteredReferences = HOSPITAL_FORMULARY_REFERENCES.filter(
    (ref) =>
      ref.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.therapeuticClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectReference = (ref: FormularyReference) => {
    setSelectedReference(ref);
    setSearchQuery('');
    setFormData((prev) => ({
      ...prev,
      name: ref.name,
      genericName: ref.genericName,
      brandName: ref.brandName || '',
      strength: ref.strength,
      dosage: ref.dosage,
      dosageUnit: ref.dosageUnit,
      frequency: ref.frequency,
      route: ref.route,
      proposedDuration: ref.defaultDuration,
      indication: ref.typicalIndication,
    }));
    // Clear any name error
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.name;
      delete copy.dosage;
      delete copy.frequency;
      delete copy.route;
      return copy;
    });
  };

  const updateField = (field: keyof ProposedMedicationInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleValidateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Medication Name is required.';
    }
    if (!formData.dosage?.trim()) {
      errors.dosage = 'Dosage is required (e.g., 1 tablet, 500 mg).';
    }
    if (!formData.frequency?.trim()) {
      errors.frequency = 'Frequency is required (e.g., Once daily, BID).';
    }
    if (!formData.route?.trim()) {
      errors.route = 'Route of administration is required (e.g., Oral, IV).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Breadcrumb & Cancel Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return to Initial Assessment</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          Patient: {patient.name} ({patient.patientId})
        </span>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#17324D] via-[#1a3d60] to-[#168C83] p-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Test a New Medication Against Existing Prescriptions
              </h2>
              <p className="text-xs text-slate-200">
                Hypothetical Pre-Prescription Safety Evaluation
              </p>
            </div>
          </div>

          {/* Mandatory Clinical Disclaimer Alert */}
          <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-slate-100 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white block mb-0.5">Hypothetical Simulation Mode:</strong>
              This assessment tests the proposed medication against the patient's {existingMedications.length} existing extracted medications and baseline clinical parameters. It will <strong>NOT</strong> prescribe the medication, approve it, or add it to the patient's active medical record without explicit physician sign-off.
            </div>
          </div>
        </div>

        <form onSubmit={handleValidateAndSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Formulary Reference Quick Search / Auto-Fill */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#17324D] flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#168C83]" />
                <span>Search Hospital Formulary Reference (Fast Auto-fill)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Or type custom medication details below
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by drug name or class (e.g. Ciprofloxacin, Ibuprofen, Doxycycline, Clopidogrel)..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83] pl-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions list */}
            {searchQuery && (
              <div className="border border-slate-200 rounded-lg bg-white shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filteredReferences.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    No formulary reference found for &ldquo;{searchQuery}&rdquo;. You can enter details manually in the form fields.
                  </div>
                ) : (
                  filteredReferences.map((ref) => (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => handleSelectReference(ref)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[#17324D]">{ref.name}</span>
                        <span className="text-slate-500 ml-1.5 font-normal">
                          ({ref.genericName} • {ref.strength})
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Class: {ref.therapeuticClass} • Route: {ref.route}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#168C83] font-semibold flex items-center gap-1">
                        Select <Check className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Quick reference chips */}
            {!searchQuery && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Select:</span>
                {HOSPITAL_FORMULARY_REFERENCES.slice(0, 5).map((ref) => (
                  <button
                    key={ref.id}
                    type="button"
                    onClick={() => handleSelectReference(ref)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                      selectedReference?.id === ref.id
                        ? 'bg-[#168C83] text-white border-[#168C83]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{ref.name}</span>
                    <span className="text-[10px] opacity-75">{ref.strength}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section: Proposed Drug Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-[#168C83]" />
                <span>Proposed Medication Details</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                <span className="text-rose-500">*</span> Required fields
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Medication Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Ciprofloxacin"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
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

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Generic Active Molecule
                </label>
                <input
                  type="text"
                  value={formData.genericName || ''}
                  onChange={(e) => updateField('genericName', e.target.value)}
                  placeholder="e.g. Ciprofloxacin Hydrochloride"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.brandName || ''}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  placeholder="e.g. Cipro / Ciloxan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>

              {/* Strength */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Strength
                </label>
                <input
                  type="text"
                  value={formData.strength || ''}
                  onChange={(e) => updateField('strength', e.target.value)}
                  placeholder="e.g. 500 mg, 10 mg/ml"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage per Administration <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => updateField('dosage', e.target.value)}
                  placeholder="e.g. 1 tablet (500 mg)"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                    formErrors.dosage
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-[#168C83]'
                  }`}
                />
                {formErrors.dosage && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.dosage}</span>
                  </p>
                )}
              </div>

              {/* Dosage Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage Unit
                </label>
                <select
                  value={formData.dosageUnit || 'tablet'}
                  onChange={(e) => updateField('dosageUnit', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83] cursor-pointer"
                >
                  <option value="tablet">tablet(s)</option>
                  <option value="capsule">capsule(s)</option>
                  <option value="mg">mg</option>
                  <option value="ml">ml (liquid)</option>
                  <option value="patch">patch</option>
                  <option value="puff">puff / inhalation</option>
                  <option value="drop">drop(s)</option>
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frequency <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => updateField('frequency', e.target.value)}
                  placeholder="e.g. Twice daily (BID), Once daily"
                  className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                    formErrors.frequency
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-[#168C83]'
                  }`}
                />
                {formErrors.frequency && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.frequency}</span>
                  </p>
                )}
              </div>

              {/* Route */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route of Administration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => updateField('route', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83] cursor-pointer"
                >
                  <option value="Oral">Oral (PO)</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                  <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Topical">Topical</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                  <option value="Sublingual">Sublingual</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Duration
                </label>
                <input
                  type="text"
                  value={formData.proposedDuration || ''}
                  onChange={(e) => updateField('proposedDuration', e.target.value)}
                  placeholder="e.g. 7 days, 14 days, Ongoing"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>

              {/* Proposed Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Start Date
                </label>
                <input
                  type="date"
                  value={formData.proposedStartDate || ''}
                  onChange={(e) => updateField('proposedStartDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>

              {/* Clinical Notes / Indication */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Prescriber Rationale / Notes
                </label>
                <input
                  type="text"
                  value={formData.clinicalNotes || ''}
                  onChange={(e) => updateField('clinicalNotes', e.target.value)}
                  placeholder="e.g. Evaluating antibiotic therapy for urinary symptoms while maintaining Warfarin anticoagulation"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#168C83]"
                />
              </div>
            </div>
          </div>

          {/* Section: Baseline Comparison List */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Existing Verified Baseline Regimen ({existingMedications.length} items)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Will be tested for DDIs and duplications
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {existingMedications.map((m) => (
                <span
                  key={m.id}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  {m.name} ({m.dosage})
                </span>
              ))}
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel & Return
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className={`px-6 py-2.5 bg-[#17324D] hover:bg-[#12273D] text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isProcessing ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? 'Simulating Safety Engine...' : 'Test Proposed Medication'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
