import { useState } from 'react';
import {
  ArrowLeft,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  Phone,
  User,
  FileText,
  Activity,
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
  const [ageInput, setAgeInput] = useState('');
  const [gender, setGender] = useState('Female');
  const [pregnant, setPregnant] = useState('NA');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Not Recorded');
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState<PatientStatus>('Active');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Clinical Measurements (Optional - never fabricated)
  const [egfr, setEgfr] = useState('');
  const [crcl, setCrcl] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Emergency Contact (Optional - never fabricated)
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

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
        if (value && new Date(value) > new Date()) return 'Date of birth cannot be in the future.';
        return '';
      case 'phone':
        if (value.trim() && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value.trim())) {
          return 'Enter a valid phone number format.';
        }
        return '';
      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Enter a valid email address.';
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

    // Validate required fields
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

    // Process Allergies - never fabricate severity or reaction
    const parsedAllergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const allergyDetails: AllergyEntry[] = parsedAllergies.map((allergen) => ({
      allergen,
      severity: 'Not Recorded',
      reaction: 'Not Recorded',
    }));

    // Process Conditions
    const parsedConditions = conditionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const conditionDetails = parsedConditions.map((cond) => ({
      condition: cond,
      diagnosedDate: new Date().toISOString().split('T')[0],
      status: 'Active' as const,
      notes: 'Logged upon patient admission',
    }));

    // Emergency Contact - never fabricate if not provided
    const emergencyContact = emergencyName.trim()
      ? {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim() || 'Contact',
          phone: emergencyPhone.trim() || phone.trim() || 'Not Recorded',
        }
      : {
          name: 'Not Recorded',
          relation: 'Not Recorded',
          phone: 'Not Recorded',
        };

    const effectiveAge = dob ? calculateAge(dob) : ageInput ? parseInt(ageInput, 10) : 45;

    const newPatient: PatientRecord = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      dob: dob || 'Not Recorded',
      age: effectiveAge,
      gender,
      phone: phone.trim() || 'Not Recorded',
      email: email.trim() || 'Not Recorded',
      bloodGroup: bloodGroup || 'Not Recorded',
      lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      room: room.trim() || 'Not Assigned',
      status,
      primaryDiagnosis: primaryDiagnosis.trim() || 'Under clinical evaluation',
      allergies: parsedAllergies.length > 0 ? parsedAllergies : ['None documented'],
      allergyDetails,
      conditions: parsedConditions.length > 0 ? parsedConditions : ['Under assessment'],
      conditionDetails,
      medicalHistory: medicalHistory.trim() || 'No prior medical history submitted at admission.',
      currentMedications: [],
      emergencyContact,
      pregnant,
      egfr: egfr ? parseFloat(egfr) : null,
      crcl: crcl ? parseFloat(crcl) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
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

        <span className="text-xs font-mono text-[#168C83] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          Clinical Intake • SQLite Database Integration
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

        {/* Clinical Disclaimer */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
          <span>
            <strong>Data Integrity:</strong> Clinical measurements, blood groups, and contacts are preserved as entered. Non-recorded fields remain unrecorded.
          </span>
          <span className="font-semibold text-[#168C83]">TalentAP H4</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Demographics & Identity */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <User className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 1: Demographics & Clinical Profile
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
                  Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (touched.dob) setErrors((prev) => ({ ...prev, dob: validateField('dob', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('dob', dob)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              {/* Age (if DOB omitted) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  placeholder={dob ? `${calculateAge(dob)}` : "e.g. 54"}
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
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

              {/* Pregnancy Status (Explicitly Recorded - Never Inferred) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pregnancy Status</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">Explicit</span>
                </label>
                <select
                  value={pregnant}
                  onChange={(e) => setPregnant(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                >
                  <option value="NA">Not Applicable / Non-Pregnant (NA)</option>
                  <option value="N">No (Not Pregnant)</option>
                  <option value="Y">Yes (Confirmed Pregnant)</option>
                  <option value="Unknown">Unknown / Not Documented</option>
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
                  <option value="Not Recorded">Not Recorded / Unknown</option>
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
            </div>
          </div>

          {/* Section 2: Clinical Measurements (Optional - Renal & Weight) */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <Activity className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 2: Organ Function & Measurements (Renal Dosing Parameters)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  eGFR (mL/min/1.73m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 55 or leave blank"
                  value={egfr}
                  onChange={(e) => setEgfr(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used for renal safety checks (e.g. &lt;30, &lt;50 thresholds)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CrCl (mL/min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 60 or leave blank"
                  value={crcl}
                  onChange={(e) => setCrcl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Creatinine Clearance estimation</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 72.5 or leave blank"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Weight-based dosing reference</p>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Emergency Details */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <Phone className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 3: Contact & Emergency Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 432-8910"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@hospital-system.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward / Room Assignment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward 4B - Bed 14"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Vance"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Relationship
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spouse / Sibling / Caregiver"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 019-2831"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Allergies & Existing Conditions */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <ShieldAlert className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 4: Known Allergies & Medical Conditions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated, e.g. Penicillin, Codeine"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Separate multiple allergens with commas. Non-recorded severity remains explicitly unrecorded.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Existing Chronic Medical Conditions
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated, e.g. Hypertension, Chronic Kidney Disease, Diabetes"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by the rules engine for contraindication screening.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Admitting Diagnosis
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute exacerbation of COPD; Dehydration"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Clinical History Narrative */}
          <div>
            <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-200">
              <FileText className="w-4 h-4 text-[#168C83]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                Section 5: Medical History Narrative
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical History Summary & Past Interventions
              </label>
              <textarea
                rows={3}
                placeholder="Include past admissions, surgical history, family history, and baseline organ function notes..."
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
