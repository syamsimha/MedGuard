import { useState } from 'react';
import {
  ArrowLeft,
  UserPlus,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  FileText,
} from 'lucide-react';
import type { PatientRecord, PatientStatus, AllergyEntry } from '../types/clinical';

interface AddPatientPageProps {
  onCancel: () => void;
  onSavePatient: (patient: PatientRecord) => void;
  existingCount: number;
}

export const AddPatientPage = ({
  onCancel,
  onSavePatient,
  existingCount,
}: AddPatientPageProps) => {
  // Pre-generate unique Patient ID
  const defaultId = `PT-${8120 + existingCount + Math.floor(Math.random() * 50)}`;

  // Form Fields State
  const [id, setId] = useState(defaultId);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [room, setRoom] = useState('Ward 2 - Bed 4');
  const [status, setStatus] = useState<PatientStatus>('Active');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'id':
        if (!value.trim()) return 'Patient ID is required.';
        if (!/^PT-\d+$/i.test(value.trim())) return 'Patient ID should follow format PT-XXXX.';
        return '';
      case 'dob':
        if (!value) return 'Date of birth is required.';
        if (new Date(value) > new Date()) return 'Date of birth cannot be in the future.';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required.';
        if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value.trim())) {
          return 'Enter a valid phone number (e.g., +1 555-234-8901).';
        }
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Enter a valid email address (e.g., name@domain.com).';
        }
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

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 40;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const validationErrors: Record<string, string> = {
      name: validateField('name', name),
      id: validateField('id', id),
      dob: validateField('dob', dob),
      phone: validateField('phone', phone),
      email: validateField('email', email),
    };

    const hasErrors = Object.values(validationErrors).some((err) => err !== '');
    if (hasErrors) {
      setErrors(validationErrors);
      setTouched({
        name: true,
        id: true,
        dob: true,
        phone: true,
        email: true,
      });
      return;
    }

    // Process Allergies
    const parsedAllergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const allergyDetails: AllergyEntry[] = parsedAllergies.map((allergen) => ({
      allergen,
      severity: 'Moderate',
      reaction: 'Documented sensitivity upon clinical intake',
    }));

    // Process Conditions
    const parsedConditions = conditionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const conditionDetails = parsedConditions.map((cond) => ({
      condition: cond,
      diagnosedDate: '2026-10-30',
      status: 'Active' as const,
      notes: 'Logged upon patient admission',
    }));

    const newPatient: PatientRecord = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      dob,
      age: calculateAge(dob),
      gender,
      phone: phone.trim(),
      email: email.trim(),
      bloodGroup,
      lastVisit: 'Oct 30, 2026',
      room: room.trim() || 'General Ward',
      status,
      primaryDiagnosis: primaryDiagnosis.trim() || 'Under clinical evaluation',
      allergies: parsedAllergies.length > 0 ? parsedAllergies : ['None documented'],
      allergyDetails,
      conditions: parsedConditions.length > 0 ? parsedConditions : ['Under assessment'],
      conditionDetails,
      medicalHistory: medicalHistory.trim() || 'No prior medical history submitted at admission.',
      currentMedications: [],
      emergencyContact: {
        name: 'Primary Contact',
        relation: 'Family Member',
        phone: phone.trim(),
      },
    };

    onSavePatient(newPatient);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </button>

        <span className="text-xs font-mono text-slate-400">
          Mode: In-Memory Clinical State
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#17324D] to-[#168C83] p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                New Patient Registration
              </h1>
              <p className="text-xs text-slate-200 mt-0.5">
                Complete clinical intake demographics, contact details, and documented allergy profiles.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center space-x-2.5 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Demonstration Intake:</strong> Data entered here is validated and stored in frontend state for clinical testing. No external APIs or unencrypted records are transmitted.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Demographics & Identity */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <User className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 1: Demographics & Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Benjamin Hayes"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) setErrors((prev) => ({ ...prev, name: validateField('name', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('name', name)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.name && touched.name
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.name && touched.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Patient ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID (MRN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    if (touched.id) setErrors((prev) => ({ ...prev, id: validateField('id', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('id', id)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-lg border text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                    errors.id && touched.id
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-slate-50 focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.id && touched.id && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.id}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (touched.dob) setErrors((prev) => ({ ...prev, dob: validateField('dob', e.target.value) }));
                    }}
                    onBlur={() => handleBlur('dob', dob)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                      errors.dob && touched.dob
                        ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                        : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                    }`}
                  />
                </div>
                {errors.dob && touched.dob && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.dob}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information & Location */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <Phone className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 2: Contact Information & Ward Location
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 432-8910"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (touched.phone) setErrors((prev) => ({ ...prev, phone: validateField('phone', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('phone', phone)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone && touched.phone
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.phone && touched.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="benjamin.hayes@demo-care.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('email', email)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.email && touched.email
                      ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 bg-white focus:ring-[#168C83]/30 focus:border-[#168C83]'
                  }`}
                />
                {errors.email && touched.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Room / Ward Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward / Room Assignment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward 4B - Bed 14"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              {/* Admission Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PatientStatus)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="Active">Active Inpatient</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="Discharged">Discharged / Outpatient</option>
                </select>
              </div>

              {/* Primary Diagnosis */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Admitting Diagnosis
                </label>
                <input
                  type="text"
                  placeholder="e.g. Community-Acquired Pneumonia; Mild Dehydration"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Allergies & Existing Conditions */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <ShieldAlert className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 3: Known Allergies & Medical Conditions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Known Allergies */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated, e.g. Penicillin, Codeine, Peanuts"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Separate multiple allergens with commas. Leave blank if none known.
                </p>
              </div>

              {/* Existing Conditions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Existing Chronic Medical Conditions
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated, e.g. Hypertension, Asthma, T2DM"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by the rules engine for contraindication screening.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Clinical History */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 4: Medical History Narrative
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical History Summary & Past Surgical Interventions
              </label>
              <textarea
                rows={3}
                placeholder="Include past hospital admissions, surgical history, family history, and baseline organ function notes..."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              * Required clinical intake fields
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
                <span>Save Patient Record</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientPage;
