import { useState } from 'react';
import { X, UserPlus, AlertCircle, Check } from 'lucide-react';
import type { PatientRecord } from '../../types/clinical';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: PatientRecord) => void;
}

export const AddPatientModal = ({
  isOpen,
  onClose,
  onAddPatient,
}: AddPatientModalProps) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [room, setRoom] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = `PT-${Math.floor(8120 + Math.random() * 800)}`;
    const parsedAge = Number(age) || 45;
    const estimatedDob = `${2026 - parsedAge}-01-01`;

    const newPatient: PatientRecord = {
      id: newId,
      name: name.trim(),
      dob: estimatedDob,
      age: parsedAge,
      gender,
      phone: '+1 (555) 000-0000',
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@sample-hospital.org`,
      bloodGroup: 'O+',
      lastVisit: 'Oct 30, 2026',
      room: room.trim() || 'General Ward - Bed 1',
      status: 'Active',
      primaryDiagnosis: primaryDiagnosis.trim() || 'Admitted for inpatient observation',
      allergies: ['None documented'],
      allergyDetails: [],
      conditions: [primaryDiagnosis.trim() || 'Inpatient observation'],
      currentMedications: [],
      emergencyContact: {
        name: 'Emergency Contact',
        relation: 'Family',
        phone: '+1 (555) 000-0000',
      },
    };

    onAddPatient(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#17324D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#168C83] text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add Patient (Demonstration)</h3>
              <p className="text-xs text-slate-300">Phase 3 Clinical Interface Preview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 text-[11px] text-blue-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Demonstration Dialog:</strong> Adds record to in-memory UI state. Backend persistence is deferred to later phases.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Samuel Bennett"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="120"
                placeholder="e.g. 52"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ward / Bed Assignment</label>
            <input
              type="text"
              placeholder="e.g. Medical Ward 2 - Bed 6"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Clinical Note</label>
            <input
              type="text"
              placeholder="e.g. Acute bronchitis & hypertension"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#168C83] hover:bg-[#12726B] text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Add Demo Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
