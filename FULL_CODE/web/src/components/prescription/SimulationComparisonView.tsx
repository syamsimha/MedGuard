import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Pill,
  User,
  Plus,
  Trash2,
  Printer,
  Download,
  Info,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type {
  MedicationSimulationScenario,
  PrescriptionPatientInput,
} from '../../types/prescription';
import { printCurrentReport } from '../../services/reportExportService';
import { ConfirmPrescriptionModal } from './ConfirmPrescriptionModal';

interface SimulationComparisonViewProps {
  patient: PrescriptionPatientInput;
  scenarios: MedicationSimulationScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onTestAnotherMedication: () => void;
  onReturnToOriginalAssessment: () => void;
  onConfirmPrescribeOrder: (scenarioId: string) => void;
  onExportPdf?: (scenario: MedicationSimulationScenario) => void;
}

export const SimulationComparisonView: React.FC<SimulationComparisonViewProps> = ({
  patient,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onDeleteScenario,
  onTestAnotherMedication,
  onReturnToOriginalAssessment,
  onConfirmPrescribeOrder,
  onExportPdf,
}) => {
  const currentScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const [filterView, setFilterView] = useState<'all' | 'new-only' | 'baseline-only'>('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (!currentScenario) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 text-xs mb-3">No simulation scenarios available.</p>
        <button
          type="button"
          onClick={onReturnToOriginalAssessment}
          className="px-3 py-1.5 bg-[#17324D] text-white text-xs font-semibold rounded-lg"
        >
          Return to Original Assessment
        </button>
      </div>
    );
  }

  const { proposedMedication, existingMedicationsSnapshot, simulatedFindings, newFindingsCount, preExistingFindingsCount } =
    currentScenario;

  const newFindings = simulatedFindings.filter((f) => f.isNewFinding);
  const baselineFindings = simulatedFindings.filter((f) => !f.isNewFinding);

  const displayedFindings =
    filterView === 'new-only'
      ? newFindings
      : filterView === 'baseline-only'
        ? baselineFindings
        : simulatedFindings;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            High Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
            Moderate Risk
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-500" />
            Low / Formulary
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onReturnToOriginalAssessment}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-[#17324D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Original Assessment</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTestAnotherMedication}
            className="px-3 py-1.5 bg-white text-[#17324D] hover:bg-slate-50 border border-slate-300 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Test Another Medication</span>
          </button>

          <button
            type="button"
            onClick={printCurrentReport}
            className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Report</span>
          </button>

          {onExportPdf && (
            <button
              type="button"
              onClick={() => onExportPdf(currentScenario)}
              className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Download PDF</span>
            </button>
          )}

          {!currentScenario.isPrescribed ? (
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Add to Medication List...</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prescription Order Confirmed</span>
            </span>
          )}
        </div>
      </div>

      {/* Multiple Scenarios Tab Bar (Task 7) */}
      {scenarios.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex items-center justify-between gap-3 overflow-x-auto print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0 ml-1">
              Simulation Scenarios ({scenarios.length}):
            </span>
            {scenarios.map((sc, idx) => (
              <div
                key={sc.id}
                className={`inline-flex items-center rounded-lg border text-xs font-semibold transition-all ${sc.id === activeScenarioId
                    ? 'bg-[#17324D] text-white border-[#17324D]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectScenario(sc.id)}
                  className="px-3 py-1.5 cursor-pointer flex items-center gap-1.5 truncate max-w-[200px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">
                    #{idx + 1}: {sc.proposedMedication.name} ({sc.proposedMedication.strength || 'Rx'})
                  </span>
                </button>
                {scenarios.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScenario(sc.id);
                    }}
                    className={`p-1.5 mr-1 rounded hover:bg-black/20 transition-colors cursor-pointer ${sc.id === activeScenarioId ? 'text-slate-300 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                      }`}
                    title="Discard Scenario"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onTestAnotherMedication}
            className="px-2.5 py-1 text-xs font-semibold text-[#168C83] hover:text-[#12726b] hover:bg-teal-50 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scenario</span>
          </button>
        </div>
      )}

      {/* Main Comparison Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden print:border-none print:shadow-none">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#17324D] via-[#1a3d60] to-[#168C83] p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Proposed Medication Safety Assessment Results
                  </h1>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider">
                    Hypothetical Simulation
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  Testing <strong className="text-white underline underline-offset-2">{proposedMedication.name}</strong> against patient's {existingMedicationsSnapshot.length} existing prescription medications
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-200">
              <div className="font-mono text-xs">Scenario: {currentScenario.id}</div>
              <div className="text-[11px] text-slate-300">Simulated: {currentScenario.testedAt}</div>
            </div>
          </div>

          {/* Metrics / What Changed Summary (Task 6) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* New Risks Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${newFindingsCount > 0
                  ? 'bg-rose-950/40 border-rose-400/40 text-rose-100'
                  : 'bg-emerald-950/40 border-emerald-400/40 text-emerald-100'
                }`}
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider block opacity-80 font-bold">
                  Additional Risks Introduced
                </span>
                <span className="text-xl font-black">
                  {newFindingsCount > 0 ? `+${newFindingsCount} New Risk(s)` : '0 New Risks'}
                </span>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${newFindingsCount > 0 ? 'bg-rose-500/30 text-rose-200' : 'bg-emerald-500/30 text-emerald-200'
                  }`}
              >
                {newFindingsCount > 0 ? <AlertTriangle className="w-5 h-5 text-rose-300" /> : <ShieldCheck className="w-5 h-5 text-emerald-300" />}
              </div>
            </div>

            {/* Pre-Existing Baseline Box */}
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider block opacity-80 font-bold">
                  Pre-Existing Baseline Risks
                </span>
                <span className="text-xl font-black">
                  {preExistingFindingsCount} Unchanged
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            {/* Prescribing Status */}
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider block opacity-80 font-bold">
                  Prescription Decision
                </span>
                <span className="text-xs font-bold block mt-1">
                  {currentScenario.isPrescribed ? (
                    <span className="text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Added to Record
                    </span>
                  ) : (
                    <span className="text-amber-200 flex items-center gap-1">
                      <Info className="w-4 h-4" /> Simulation Only
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                {currentScenario.isPrescribed ? 'Confirmed' : 'Unprescribed'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Important Clinical Notice (Task 6 requirement) */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-950 font-bold">Clinical Caution:</strong> Do not assume that the absence of new findings means the medication is completely safe. Always verify clinical patient context, hepatic function, and therapeutic monitoring guidelines.
            </div>
          </div>

          {/* Section: Patient Information (Task 5) */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Patient Profile Baseline</span>
              </h2>
              <span className="text-xs font-mono text-slate-500">ID: {patient.patientId}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient Name</span>
                <span className="font-bold text-slate-800">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Age & Gender</span>
                <span className="font-semibold text-slate-800">
                  {patient.ageOrDob} • {patient.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Weight</span>
                <span className="font-semibold text-slate-800">{patient.weight || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Renal Function</span>
                <span className="font-semibold text-amber-800">{patient.renalHistory || 'Baseline clearance'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Known Drug Allergies</span>
                <span className="font-bold text-rose-700">{patient.allergies || 'None documented'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Medical Conditions</span>
                <span className="font-semibold text-slate-700">{patient.conditions || 'None documented'}</span>
              </div>
            </div>
          </div>

          {/* Section: Medication Comparison (Existing Baseline vs Proposed Drug) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Existing Baseline Medications (Left Column) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Existing Prescription Baseline ({existingMedicationsSnapshot.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  From Uploaded PDF Prescriptions
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {existingMedicationsSnapshot.map((med, idx) => (
                  <div key={med.id || idx} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#17324D] block">{med.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {med.dosage} ({med.strength}) • {med.frequency} • {med.route}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                      {med.sourceFile}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposed Medication Card (Right Column - Clearly Distinguished) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Proposed Medication Under Evaluation</span>
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Hypothetical Order
                </span>
              </div>

              <div className="border-2 border-blue-300 rounded-xl bg-blue-50/40 p-4 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-black text-[#17324D]">
                      {proposedMedication.name}
                    </h4>
                    <span className="text-xs text-slate-600">
                      Generic: <strong>{proposedMedication.genericName || proposedMedication.name}</strong>
                    </span>
                    {proposedMedication.brandName && (
                      <span className="text-xs text-slate-500 ml-2">
                        (Brand: {proposedMedication.brandName})
                      </span>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#17324D] text-white">
                    {proposedMedication.strength || 'Proposed Dose'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Prescribed Dosage</span>
                    <span className="font-semibold text-slate-800">{proposedMedication.dosage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Frequency & Route</span>
                    <span className="font-semibold text-slate-800">
                      {proposedMedication.frequency} • {proposedMedication.route}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Proposed Duration</span>
                    <span className="font-semibold text-slate-800">
                      {proposedMedication.proposedDuration || 'Ongoing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Proposed Start</span>
                    <span className="font-semibold text-slate-800">
                      {proposedMedication.proposedStartDate || 'Immediate'}
                    </span>
                  </div>
                </div>

                {proposedMedication.clinicalNotes && (
                  <div className="p-2.5 rounded-lg bg-white/90 border border-blue-200 text-[11px] text-slate-700">
                    <span className="font-bold text-[#17324D] block mb-0.5">Clinical Prescriber Rationale:</span>
                    <span>{proposedMedication.clinicalNotes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Safety Findings & "What Changed" (Tasks 5 & 6) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Safety Assessment Findings Comparison ({simulatedFindings.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Clearly differentiating newly introduced risks from pre-existing prescription contraindications.
                </p>
              </div>

              {/* Finding Filter Tabs */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setFilterView('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${filterView === 'all'
                      ? 'bg-[#17324D] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  All ({simulatedFindings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('new-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${filterView === 'new-only'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                >
                  <span>New Risks Only</span>
                  <span className="font-bold">({newFindingsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('baseline-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${filterView === 'baseline-only'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  Baseline Only ({preExistingFindingsCount})
                </button>
              </div>
            </div>

            {/* Findings List */}
            <div className="p-5 sm:p-6 space-y-4">
              {displayedFindings.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <span className="font-bold text-xs text-[#17324D] block mb-1">
                    No Findings in this Category
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {filterView === 'new-only'
                      ? 'No new clinical contraindications introduced by this proposed medication.'
                      : 'No pre-existing baseline findings.'}
                  </p>
                </div>
              ) : (
                displayedFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${finding.isNewFinding
                        ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-100 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 opacity-90'
                      }`}
                  >
                    {/* Finding Header with Distinction Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status: NEW RISK vs PRE-EXISTING */}
                        {finding.isNewFinding ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>NEW RISK INTRODUCED BY PROPOSED MEDICATION</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                            <span>PRE-EXISTING UNCHANGED RISK (From Current Prescriptions)</span>
                          </span>
                        )}

                        {getSeverityBadge(finding.severity)}

                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {finding.category}
                        </span>

                        <span className="text-xs font-mono text-slate-400">ID: {finding.id}</span>
                      </div>

                      {finding.reviewStatus && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 self-end sm:self-auto">
                          {finding.reviewStatus}
                        </span>
                      )}
                    </div>

                    {/* Involved Medications */}
                    <div className="mb-2.5 flex items-center flex-wrap gap-1.5 text-xs">
                      <span className="font-bold text-[#17324D] flex items-center gap-1 mr-1">
                        <Pill className="w-3.5 h-3.5 text-[#168C83]" />
                        <span>Involved Medications:</span>
                      </span>
                      {finding.affectedMedications.map((medName) => {
                        const isProposed =
                          medName.toLowerCase() === proposedMedication.name.toLowerCase();
                        return (
                          <span
                            key={medName}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${isProposed
                                ? 'bg-blue-100 text-blue-900 border-blue-300 shadow-2xs'
                                : 'bg-white text-slate-800 border-slate-300'
                              }`}
                          >
                            {medName} {isProposed && '(Proposed)'}
                          </span>
                        );
                      })}
                    </div>

                    {/* Clinical Explanation */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium mb-2.5">
                      {finding.explanation}
                    </p>

                    {/* Recommendation */}
                    {finding.recommendation && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs mb-2 shadow-2xs">
                        <span className="font-bold text-[#17324D] block mb-0.5">
                          Prescriber Action:
                        </span>
                        <p className="text-slate-700 font-medium leading-normal">
                          {finding.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Evidence Source */}
                    {finding.evidenceSource && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/60">
                        <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Evidence: {finding.evidenceSource}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal if doctor clicks "Add to Medication List" */}
      {isConfirmModalOpen && (
        <ConfirmPrescriptionModal
          proposedMed={proposedMedication}
          patientName={patient.name}
          patientId={patient.patientId}
          newRisksCount={newFindingsCount}
          onConfirm={() => {
            onConfirmPrescribeOrder(currentScenario.id);
            setIsConfirmModalOpen(false);
          }}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
};
