import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Pill,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import type {
  PatientRecord,
  ActiveMedication,
  MedicationReviewRecord,
} from '../types/clinical';

interface AddMedicationPageProps {
  patients: PatientRecord[];
  initialPatientId?: string;
  onCancel: () => void;
  onSaveMedication: (
    patientId: string,
    newMed: ActiveMedication,
    newReview: MedicationReviewRecord
  ) => void;
}

export const AddMedicationPage = ({
  patients,
  initialPatientId,
  onCancel,
  onSaveMedication,
}: AddMedicationPageProps) => {
  const defaultPatientId = initialPatientId || (patients.length > 0 ? patients[0].id : '');

  // Form State
  const [patientId, setPatientId] = useState(defaultPatientId);

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(initialPatientId || patients[0].id);
    }
  }, [patients, patientId, initialPatientId]);
  const [medicationName, setMedicationName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState('Once daily');
  const [route, setRoute] = useState('Oral');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [prescriber, setPrescriber] = useState('Dr. C. Vance');
  const [notes, setNotes] = useState('');

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'patientId':
        if (!value.trim()) return 'Please select a patient.';
        return '';
      case 'medicationName':
        if (!value.trim()) return 'Medication brand or standard name is required.';
        if (value.trim().length < 2) return 'Medication name must be at least 2 characters.';
        return '';
      case 'dosage':
        if (!value.trim()) return 'Dosage amount is required.';
        return '';
      case 'frequency':
        if (!value.trim()) return 'Frequency is required.';
        return '';
      case 'startDate':
        if (!value.trim()) return 'Prescription start date is required.';
        return '';
      case 'prescriber':
        if (!value.trim()) return 'Prescribing physician name is required.';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: Record<string, string> = {
      patientId: validateField('patientId', patientId),
      medicationName: validateField('medicationName', medicationName),
      dosage: validateField('dosage', dosage),
      frequency: validateField('frequency', frequency),
      startDate: validateField('startDate', startDate),
      prescriber: validateField('prescriber', prescriber),
    };

    const hasErrors = Object.values(validationErrors).some((err) => err !== '');
    if (hasErrors) {
      setErrors(validationErrors);
      setTouched({
        patientId: true,
        medicationName: true,
        dosage: true,
        frequency: true,
        startDate: true,
        prescriber: true,
      });
      return;
    }

    const selectedPatient = patients.find((p) => p.id === patientId);
    const patientName = selectedPatient ? selectedPatient.name : 'Unknown Patient';

    const fullDosage = `${dosage.trim()} ${dosageUnit}`;
    const medId = `MED-${Math.floor(100 + Math.random() * 900)}`;
    const reviewId = `REV-${Math.floor(500 + Math.random() * 900)}`;

    const newMed: ActiveMedication = {
      id: medId,
      name: medicationName.trim(),
      genericName: genericName.trim() || undefined,
      dosage: fullDosage,
      dosageUnit,
      frequency,
      route,
      prescriber: prescriber.trim(),
      startDate,
      endDate: endDate || undefined,
      status: 'Active',
      notes: notes.trim() || undefined,
    };

    const newReview: MedicationReviewRecord = {
      id: reviewId,
      patientId,
      patientName,
      medicationName: medicationName.trim(),
      genericName: genericName.trim() || undefined,
      dosage: fullDosage,
      dosageUnit,
      frequency,
      route,
      prescribedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      startDate,
      endDate: endDate || undefined,
      prescriber: prescriber.trim(),
      status: 'Pending Review',
      medicationStatus: 'Active',
      reviewer: 'Pending Assignment',
      reviewDate: 'Just Now',
      clinicalNotes: notes.trim() || 'New medication prescription order entered. Awaiting pharmacist review.',
      notes: notes.trim() || 'Newly submitted order awaiting verification.',
    };

    onSaveMedication(patientId, newMed, newReview);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medication Review</span>
        </button>

        <span className="text-xs font-mono text-slate-400">
          Formulary Intake • In-Memory Mode
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#17324D] to-[#168C83] p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Prescribe New Medication
              </h1>
              <p className="text-xs text-slate-200 mt-0.5">
                Register medication order for pharmacist clinical review, dosage screening, and administration.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center space-x-2.5 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Clinical Safety Notice:</strong> Newly prescribed medications are added to the in-memory verification queue under <em>Pending Review</em> status.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Patient Selection */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <User className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 1: Recipient Patient
              </h2>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Hospital Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  if (touched.patientId) setErrors((prev) => ({ ...prev, patientId: validateField('patientId', e.target.value) }));
                }}
                onBlur={() => handleBlur('patientId', patientId)}
                className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                  errors.patientId && touched.patientId
                    ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                }`}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — {p.room} [{p.status}]
                  </option>
                ))}
              </select>
              {errors.patientId && touched.patientId && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.patientId}</p>
              )}
            </div>
          </div>

          {/* Section 2: Medication Identity & Dosage */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <Pill className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 2: Medication Specification
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Medication Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medication Name (Brand / Trade) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin-Clavulanate, Lasix, Plavix"
                  value={medicationName}
                  onChange={(e) => {
                    setMedicationName(e.target.value);
                    if (touched.medicationName) setErrors((prev) => ({ ...prev, medicationName: validateField('medicationName', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('medicationName', medicationName)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.medicationName && touched.medicationName
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.medicationName && touched.medicationName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.medicationName}</p>
                )}
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Generic Chemical Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clopidogrel Bisulfate"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              {/* Dosage Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500, 20, 10"
                  value={dosage}
                  onChange={(e) => {
                    setDosage(e.target.value);
                    if (touched.dosage) setErrors((prev) => ({ ...prev, dosage: validateField('dosage', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('dosage', dosage)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.dosage && touched.dosage
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.dosage && touched.dosage && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.dosage}</p>
                )}
              </div>

              {/* Dosage Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dosageUnit}
                  onChange={(e) => setDosageUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="mg">mg (milligram)</option>
                  <option value="mcg">mcg (microgram)</option>
                  <option value="g">g (gram)</option>
                  <option value="mL">mL (milliliter)</option>
                  <option value="units">units (IU)</option>
                  <option value="tablets">tablets</option>
                  <option value="puffs">puffs</option>
                </select>
              </div>

              {/* Route */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route of Administration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="Oral">Oral (PO)</option>
                  <option value="Intravenous">Intravenous (IV)</option>
                  <option value="Subcutaneous">Subcutaneous (SubQ)</option>
                  <option value="Inhalation">Inhalation (INH)</option>
                  <option value="Intramuscular">Intramuscular (IM)</option>
                  <option value="Topical">Topical</option>
                  <option value="Sublingual">Sublingual (SL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Schedule & Prescribing Physician */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <Calendar className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 3: Regimen Schedule & Authorization
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administration Frequency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="Once daily">Once daily (QD)</option>
                  <option value="Twice daily">Twice daily (BID)</option>
                  <option value="Three times daily">Three times daily (TID)</option>
                  <option value="Four times daily">Four times daily (QID)</option>
                  <option value="Every 8 hours">Every 8 hours (Q8H)</option>
                  <option value="Every 12 hours">Every 12 hours (Q12H)</option>
                  <option value="At bedtime">At bedtime (QHS)</option>
                  <option value="PRN (As needed)">PRN (As needed for symptoms)</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              {/* Prescribing Doctor */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prescribing Doctor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. C. Vance, MD (Attending Physician)"
                  value={prescriber}
                  onChange={(e) => {
                    setPrescriber(e.target.value);
                    if (touched.prescriber) setErrors((prev) => ({ ...prev, prescriber: validateField('prescriber', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('prescriber', prescriber)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.prescriber && touched.prescriber
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.prescriber && touched.prescriber && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.prescriber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Notes */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 4: Clinical Rationale & Pharmacist Instructions
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Order Notes
              </label>
              <textarea
                rows={2}
                placeholder="Specify clinical indication, renal/hepatic monitoring parameters, or special administration instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              * Required clinical prescription fields
            </span>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 bg-[#168C83] hover:bg-[#12726B] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Prescription Order</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicationPage;
