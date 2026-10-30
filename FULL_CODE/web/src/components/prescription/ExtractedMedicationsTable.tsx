import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { ExtractedMedication } from '../../types/prescription';

interface ExtractedMedicationsTableProps {
  medications: ExtractedMedication[];
  onMedicationsChange: (meds: ExtractedMedication[]) => void;
  availableSources: string[];
}

export const ExtractedMedicationsTable: React.FC<ExtractedMedicationsTableProps> = ({
  medications,
  onMedicationsChange,
  availableSources,
}) => {
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExtractedMedication | null>(null);

  // Adding new medication state
  const [isAdding, setIsAdding] = useState(false);
  const [newMedForm, setNewMedForm] = useState<Partial<ExtractedMedication>>({
    name: '',
    genericName: '',
    strength: '',
    dosage: '1 tablet',
    frequency: 'Once daily',
    route: 'Oral',
    duration: 'Ongoing',
    sourceFile: availableSources[0] || 'Uploaded Prescription PDF',
  });

  const handleStartEdit = (med: ExtractedMedication) => {
    setEditingId(med.id);
    setEditForm({ ...med });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    onMedicationsChange(
      medications.map((m) => (m.id === editForm.id ? { ...editForm, isConfirmed: true } : m))
    );
    setEditingId(null);
    setEditForm(null);
  };

  const handleToggleConfirm = (id: string) => {
    onMedicationsChange(
      medications.map((m) =>
        m.id === id ? { ...m, isConfirmed: !m.isConfirmed } : m
      )
    );
  };

  const handleConfirmAll = () => {
    onMedicationsChange(
      medications.map((m) => ({ ...m, isConfirmed: true }))
    );
  };

  const handleDeleteMedication = (id: string) => {
    onMedicationsChange(medications.filter((m) => m.id !== id));
  };

  const handleSaveNew = () => {
    if (!newMedForm.name?.trim()) return;

    const newMed: ExtractedMedication = {
      id: `EXT-MANUAL-${Date.now()}`,
      name: newMedForm.name.trim(),
      genericName: newMedForm.genericName?.trim() || newMedForm.name.trim(),
      strength: newMedForm.strength?.trim() || 'Unspecified',
      dosage: newMedForm.dosage?.trim() || '1 tablet',
      frequency: newMedForm.frequency?.trim() || 'Once daily',
      route: newMedForm.route?.trim() || 'Oral',
      duration: newMedForm.duration?.trim() || 'Ongoing',
      sourceFile: newMedForm.sourceFile || availableSources[0] || 'Manual Entry by Doctor',
      confidenceScore: 1.0,
      isConfirmed: true,
    };

    onMedicationsChange([...medications, newMed]);
    setIsAdding(false);
    setNewMedForm({
      name: '',
      genericName: '',
      strength: '',
      dosage: '1 tablet',
      frequency: 'Once daily',
      route: 'Oral',
      duration: 'Ongoing',
      sourceFile: availableSources[0] || 'Uploaded Prescription PDF',
    });
  };

  const confirmedCount = medications.filter((m) => m.isConfirmed).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#17324D] text-white flex items-center justify-center shadow-xs">
            <Pill className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
              <span>3. Extracted Medication Regimen</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {medications.length} items
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Review and verify medications extracted from prescription documents before finalizing H4 safety analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {confirmedCount < medications.length && medications.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify All ({medications.length - confirmedCount} pending)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Manual Add Form (Inline) */}
      {isAdding && (
        <div className="p-4 bg-teal-50/40 border-b border-teal-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#17324D] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#168C83]" />
              <span>Manually Add Medication Missed by OCR</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Medicine Brand Name *
              </label>
              <input
                type="text"
                value={newMedForm.name}
                onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                placeholder="e.g. Augmentin"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Generic Active Ingredient
              </label>
              <input
                type="text"
                value={newMedForm.genericName}
                onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                placeholder="e.g. Amoxicillin / Clavulanate"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Strength
              </label>
              <input
                type="text"
                value={newMedForm.strength}
                onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                placeholder="e.g. 625 mg"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={newMedForm.dosage}
                onChange={(e) => setNewMedForm({ ...newMedForm, dosage: e.target.value })}
                placeholder="e.g. 1 tablet"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={newMedForm.frequency}
                onChange={(e) => setNewMedForm({ ...newMedForm, frequency: e.target.value })}
                placeholder="e.g. Twice daily (BID)"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Route
              </label>
              <select
                value={newMedForm.route}
                onChange={(e) => setNewMedForm({ ...newMedForm, route: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              >
                <option value="Oral">Oral</option>
                <option value="Intravenous (IV)">Intravenous (IV)</option>
                <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                <option value="Inhalation">Inhalation</option>
                <option value="Topical">Topical</option>
                <option value="Ophthalmic">Ophthalmic</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={newMedForm.duration}
                onChange={(e) => setNewMedForm({ ...newMedForm, duration: e.target.value })}
                placeholder="e.g. 7 days / Ongoing"
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Source Document
              </label>
              <select
                value={newMedForm.sourceFile}
                onChange={(e) => setNewMedForm({ ...newMedForm, sourceFile: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-1 focus:ring-[#168C83] focus:outline-hidden truncate"
              >
                {availableSources.length > 0 ? (
                  availableSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                ) : (
                  <option value="Manual Prescription Entry">Manual Prescription Entry</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNew}
              className="px-3 py-1 bg-[#168C83] text-white text-xs font-semibold rounded hover:bg-[#12726b] cursor-pointer"
            >
              Save Medication
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Medicine & Active Ingredient</th>
              <th className="py-3 px-3">Strength & Dosage</th>
              <th className="py-3 px-3">Frequency & Route</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Source PDF</th>
              <th className="py-3 px-3">Verification</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>No medications extracted or entered yet.</span>
                </td>
              </tr>
            ) : (
              medications.map((med) => {
                const isEditing = editingId === med.id;

                if (isEditing && editForm) {
                  return (
                    <tr key={med.id} className="bg-teal-50/30">
                      <td className="py-2.5 px-4 space-y-1">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Medicine name"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <input
                          type="text"
                          value={editForm.genericName || ''}
                          onChange={(e) => setEditForm({ ...editForm, genericName: e.target.value })}
                          placeholder="Generic name"
                          className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 space-y-1">
                        <input
                          type="text"
                          value={editForm.strength || ''}
                          onChange={(e) => setEditForm({ ...editForm, strength: e.target.value })}
                          placeholder="Strength"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <input
                          type="text"
                          value={editForm.dosage}
                          onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                          placeholder="Dosage"
                          className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 space-y-1">
                        <input
                          type="text"
                          value={editForm.frequency}
                          onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                          placeholder="Frequency"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                        <input
                          type="text"
                          value={editForm.route}
                          onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                          placeholder="Route"
                          className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded bg-white text-slate-600"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editForm.duration || ''}
                          onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                          placeholder="Duration"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-500 truncate block max-w-[130px]">
                          {editForm.sourceFile}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Editing...
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="p-1 rounded bg-[#168C83] text-white hover:bg-[#12726b] cursor-pointer"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={med.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17324D]">{med.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Generic: {med.genericName || 'Same as trade name'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{med.dosage}</div>
                      <div className="text-[11px] text-slate-500">
                        Strength: {med.strength || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{med.frequency}</div>
                      <div className="text-[11px] text-slate-500">Route: {med.route}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-700 font-medium">
                        {med.duration || 'Ongoing'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[130px] text-[11px]" title={med.sourceFile}>
                          {med.sourceFile}
                        </span>
                      </div>
                      {med.confidenceScore !== undefined && (
                        <span className="text-[10px] text-slate-400">
                          {Math.round(med.confidenceScore * 100)}% OCR confidence
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleConfirm(med.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          med.isConfirmed
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle doctor confirmation"
                      >
                        {med.isConfirmed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Confirmed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Verify OCR</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(med)}
                        className="p-1 rounded text-slate-500 hover:text-[#17324D] hover:bg-slate-100 cursor-pointer"
                        title="Edit Medicine Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Medication"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>
          Doctor sign-off: {confirmedCount} of {medications.length} items confirmed.
        </span>
        <span className="text-slate-400">
          Unconfirmed OCR values will be highlighted during safety rule evaluation.
        </span>
      </div>
    </div>
  );
};
