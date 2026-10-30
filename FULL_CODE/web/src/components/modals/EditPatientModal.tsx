import { useState } from 'react';
import { X, Edit3, Check, AlertCircle } from 'lucide-react';
import type { PatientRecord, PatientStatus } from '../../types/clinical';

interface EditPatientModalProps {
  patient: PatientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePatient: (updated: PatientRecord) => void;
}

export const EditPatientModal = ({
  patient,
  isOpen,
  onClose,
  onUpdatePatient,
}: EditPatientModalProps) => {
  if (!isOpen || !patient) return null;

  const [name, setName] = useState(patient.name);
  const [phone, setPhone] = useState(patient.phone);
  const [email, setEmail] = useState(patient.email);
  const [room, setRoom] = useState(patient.room);
  const [status, setStatus] = useState<PatientStatus>(patient.status);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(patient.primaryDiagnosis || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PatientRecord = {
      ...patient,
      name: name.trim() || patient.name,
      phone: phone.trim() || patient.phone,
      email: email.trim() || patient.email,
      room: room.trim() || patient.room,
      status,
      primaryDiagnosis: primaryDiagnosis.trim(),
    };
    onUpdatePatient(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#17324D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#168C83] text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Edit Patient Record</h3>
              <p className="text-xs text-slate-300">
                Updating details for {patient.name} ({patient.id})
              </p>
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

        {/* Demo Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 text-[11px] text-blue-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Changes update the frontend in-memory state. No backend persistence in Phase 3.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ward / Room Location</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
              >
                <option value="Active">Active</option>
                <option value="Under Observation">Under Observation</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Primary Diagnosis</label>
            <input
              type="text"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168C83]/30 focus:border-[#168C83]"
            />
          </div>

          {/* Actions */}
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
              <span>Update Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;
