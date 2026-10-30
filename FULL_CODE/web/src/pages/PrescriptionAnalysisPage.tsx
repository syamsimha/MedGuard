import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Printer,
  Download,
  FileCheck2,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import type { PatientRecord, ActiveMedication } from '../types/clinical';
import type {
  PrescriptionUploadFile,
  PrescriptionPatientInput,
  ProcessingStageId,
  PrescriptionAnalysisResult,
  ExtractedMedication,
  PrescriptionSafetyFinding,
  ProposedMedicationInput,
  MedicationSimulationScenario,
} from '../types/prescription';
import {
  submitPrescriptionsToBackend,
  type BackendSubmissionResponse,
} from '../services/prescriptionApiService';
import {
  submitProposedMedicationSimulation,
} from '../services/prescriptionSimulationApiService';
import {
  SAMPLE_DEMO_ANALYSIS_RESULT,
  SAMPLE_EXTRACTED_MEDICATIONS,
  SAMPLE_SAFETY_FINDINGS,
  generateDemonstrationSimulationScenario,
} from '../data/prescriptionSampleData';
import { PrescriptionPatientForm } from '../components/prescription/PrescriptionPatientForm';
import { PrescriptionUploadZone } from '../components/prescription/PrescriptionUploadZone';
import { ProcessingStagesTimeline } from '../components/prescription/ProcessingStagesTimeline';
import { BackendDiagnosticsCard } from '../components/prescription/BackendDiagnosticsCard';
import { ExtractedMedicationsTable } from '../components/prescription/ExtractedMedicationsTable';
import { SafetyFindingsView } from '../components/prescription/SafetyFindingsView';
import { PrescriptionReportView } from '../components/prescription/PrescriptionReportView';
import { PdfPreviewModal } from '../components/prescription/PdfPreviewModal';
import { ProposedMedicationForm } from '../components/prescription/ProposedMedicationForm';
import { SimulationComparisonView } from '../components/prescription/SimulationComparisonView';
import {
  exportPrescriptionAnalysisPdf,
  exportProposedMedicationSimulationPdf,
  printCurrentReport,
} from '../services/reportExportService';

interface PrescriptionAnalysisPageProps {
  patients: PatientRecord[];
  initialPatientId?: string;
  onViewPatientProfile?: (patientId: string) => void;
  onBackToDashboard?: () => void;
  onNavigateToMedicationReview?: () => void;
  onSavePrescribedMedication?: (patientId: string, newMed: ActiveMedication) => void;
}

export const PrescriptionAnalysisPage: React.FC<PrescriptionAnalysisPageProps> = ({
  patients,
  initialPatientId,
  onViewPatientProfile,
  onBackToDashboard,
  onNavigateToMedicationReview,
  onSavePrescribedMedication,
}) => {
  // 1. Patient Form State
  const defaultPatient = patients.find((p) => p.id === initialPatientId) || patients[0];
  const [patientInput, setPatientInput] = useState<PrescriptionPatientInput>({
    patientId: defaultPatient?.id || 'PT-8021',
    name: defaultPatient?.name || 'Eleanor Vance',
    ageOrDob: defaultPatient ? `${defaultPatient.age} yrs (${defaultPatient.dob || 'DOB N/A'})` : '68 yrs',
    gender: defaultPatient?.gender || 'Female',
    weight: '68 kg',
    allergies: defaultPatient?.allergies?.join(', ') || 'Penicillin, Sulfa drugs',
    conditions: defaultPatient?.conditions?.join(', ') || 'Atrial Fibrillation with RVR, Hypertension Stage 2',
    renalHistory: 'eGFR 48 mL/min/1.73m² (CKD Stage 3a), Serum Creatinine 1.4 mg/dL',
    clinicalNotes: defaultPatient?.primaryDiagnosis ? `Primary Diagnosis: ${defaultPatient.primaryDiagnosis}` : '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 2. Uploaded Files State
  const [uploadFiles, setUploadFiles] = useState<PrescriptionUploadFile[]>([]);
  const [previewFile, setPreviewFile] = useState<PrescriptionUploadFile | null>(null);

  // 3. Processing Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<ProcessingStageId | null>(null);
  const [submissionResponse, setSubmissionResponse] = useState<BackendSubmissionResponse | null>(null);

  // 4. Extracted & Safety Review State
  const [medications, setMedications] = useState<ExtractedMedication[]>([]);
  const [findings, setFindings] = useState<PrescriptionSafetyFinding[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  // 5. Navigation Views: 'input-and-upload' | 'report' | 'test-new-medication' | 'simulation-results'
  const [activeView, setActiveView] = useState<
    'input-and-upload' | 'report' | 'test-new-medication' | 'simulation-results'
  >('input-and-upload');
  const [finalAnalysisResult, setFinalAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null);

  // 6. Proposed Medication Simulation Scenarios State
  const [scenarios, setScenarios] = useState<MedicationSimulationScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Validation
  const validatePatientInput = (): boolean => {
    const errors: Record<string, string> = {};
    if (!patientInput.patientId.trim()) {
      errors.patientId = 'Patient ID is required.';
    }
    if (!patientInput.name.trim()) {
      errors.name = 'Patient Full Name is required.';
    }
    if (!patientInput.ageOrDob.trim()) {
      errors.ageOrDob = 'Age or Date of Birth is required.';
    }
    if (!patientInput.gender.trim()) {
      errors.gender = 'Gender is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit to Backend Safety Engine (Initial Assessment)
  const handleAnalyzePrescriptions = async () => {
    if (!validatePatientInput()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (uploadFiles.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        files: 'Please upload at least one prescription PDF document before proceeding.',
      }));
      return;
    }

    setIsProcessing(true);
    setSubmissionResponse(null);
    setCurrentStage('uploading');

    setTimeout(() => {
      setCurrentStage('extracting');
    }, 400);

    const result = await submitPrescriptionsToBackend(
      patientInput,
      uploadFiles,
      (stage) => setCurrentStage(stage)
    );

    setIsProcessing(false);
    setSubmissionResponse(result);

    if (result.success && result.data) {
      setMedications(result.data.medications);
      setFindings(result.data.findings);
      setFinalAnalysisResult(result.data);
    } else {
      setCurrentStage('uploading');
    }
  };

  // Load Clinical Simulation (Demo Preview for initial prescriptions)
  const handleLoadSimulation = () => {
    setIsSimulationActive(true);
    setCurrentStage('generating');
    setMedications([...SAMPLE_EXTRACTED_MEDICATIONS]);
    setFindings([...SAMPLE_SAFETY_FINDINGS]);

    const simulatedResult: PrescriptionAnalysisResult = {
      ...SAMPLE_DEMO_ANALYSIS_RESULT,
      patient: patientInput,
      files: uploadFiles.length > 0
        ? uploadFiles.map((f) => ({ name: f.name, size: f.size }))
        : SAMPLE_DEMO_ANALYSIS_RESULT.files,
      medications: SAMPLE_EXTRACTED_MEDICATIONS,
      findings: SAMPLE_SAFETY_FINDINGS,
      analyzedAt: new Date().toLocaleString(),
    };

    setFinalAnalysisResult(simulatedResult);
  };

  // Generate / View Final Formal Report
  const handleViewFinalReport = () => {
    const resultToDisplay: PrescriptionAnalysisResult = finalAnalysisResult || {
      outcome: findings.length > 0 ? 'analysis_completed_with_findings' : 'no_issues_detected',
      summaryMessage:
        findings.length > 0
          ? `Prescription safety review completed with ${findings.length} clinical contraindication(s) identified.`
          : 'Prescription safety review completed: No active contraindications detected.',
      patient: patientInput,
      files: uploadFiles.length > 0
        ? uploadFiles.map((f) => ({ name: f.name, size: f.size }))
        : [{ name: 'Prescription_Document.pdf', size: 245000 }],
      medications,
      findings,
      analyzedAt: new Date().toLocaleString(),
    };

    setFinalAnalysisResult(resultToDisplay);
    setActiveView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ========================================================
  // NEW MEDICATION SAFETY SIMULATION HANDLERS
  // ========================================================

  const handleOpenTestNewMedication = () => {
    // If no medications are extracted or confirmed yet, load Eleanor Vance's sample medications
    // so the doctor has a verified baseline to test against
    if (medications.length === 0) {
      setMedications([...SAMPLE_EXTRACTED_MEDICATIONS]);
      setFindings([...SAMPLE_SAFETY_FINDINGS]);
    }
    setActiveView('test-new-medication');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitProposedMedication = async (proposedMed: ProposedMedicationInput) => {
    setIsSimulating(true);

    const baselineMeds = medications.length > 0 ? medications : SAMPLE_EXTRACTED_MEDICATIONS;
    const baselineFindings = findings.length > 0 ? findings : SAMPLE_SAFETY_FINDINGS;

    // Call secondary safety assessment service
    const response = await submitProposedMedicationSimulation(
      patientInput,
      baselineMeds,
      baselineFindings,
      proposedMed
    );

    setIsSimulating(false);

    let scenario: MedicationSimulationScenario;
    if (response.success && response.data) {
      scenario = response.data;
    } else {
      // Backend simulation endpoint is pending deployment
      // Use transparent demonstration scenario generator per Task 4 & 10
      scenario = generateDemonstrationSimulationScenario(
        proposedMed,
        baselineMeds,
        baselineFindings
      );
    }

    setScenarios((prev) => [scenario, ...prev.filter((s) => s.id !== scenario.id)]);
    setActiveScenarioId(scenario.id);
    setActiveView('simulation-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteScenario = (scenarioId: string) => {
    const remaining = scenarios.filter((s) => s.id !== scenarioId);
    setScenarios(remaining);
    if (remaining.length > 0) {
      setActiveScenarioId(remaining[0].id);
    } else {
      setActiveView(finalAnalysisResult ? 'report' : 'input-and-upload');
    }
  };

  const handleConfirmPrescribeOrder = (scenarioId: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === scenarioId ? { ...s, isPrescribed: true } : s))
    );

    const targetScenario = scenarios.find((s) => s.id === scenarioId);
    if (targetScenario && onSavePrescribedMedication) {
      const newMed: ActiveMedication = {
        id: `MED-RX-${Date.now()}`,
        name: targetScenario.proposedMedication.name,
        genericName: targetScenario.proposedMedication.genericName,
        dosage: targetScenario.proposedMedication.dosage,
        dosageUnit: targetScenario.proposedMedication.dosageUnit,
        frequency: targetScenario.proposedMedication.frequency,
        route: targetScenario.proposedMedication.route,
        prescriber: 'Dr. Sarah Chen (Attending Physician)',
        startDate: targetScenario.proposedMedication.proposedStartDate || 'Today',
        endDate: targetScenario.proposedMedication.proposedDuration,
        status: 'Active',
        notes: `Prescribed following H4 safety simulation assessment (${targetScenario.id}).`,
      };
      onSavePrescribedMedication(patientInput.patientId, newMed);
    }
  };

  const handleExportSimulationPdf = (scenario: MedicationSimulationScenario) => {
    exportProposedMedicationSimulationPdf(scenario, patientInput.name, patientInput.patientId);
  };

  // Reset / New Analysis
  const handleStartNewAnalysis = () => {
    setUploadFiles([]);
    setMedications([]);
    setFindings([]);
    setSubmissionResponse(null);
    setCurrentStage(null);
    setIsSimulationActive(false);
    setFinalAnalysisResult(null);
    setScenarios([]);
    setActiveScenarioId('');
    setActiveView('input-and-upload');
    setFormErrors({});
  };

  // Export Initial Analysis PDF
  const handleExportPdf = () => {
    if (finalAnalysisResult) {
      exportPrescriptionAnalysisPdf(finalAnalysisResult);
    }
  };

  // ----------------------------------------------------
  // CONDITIONAL VIEW 1: PROPOSED MEDICATION FORM
  // ----------------------------------------------------
  if (activeView === 'test-new-medication') {
    return (
      <ProposedMedicationForm
        patient={patientInput}
        existingMedications={medications.length > 0 ? medications : SAMPLE_EXTRACTED_MEDICATIONS}
        onSubmit={handleSubmitProposedMedication}
        onCancel={() => {
          if (scenarios.length > 0) {
            setActiveView('simulation-results');
          } else if (finalAnalysisResult) {
            setActiveView('report');
          } else {
            setActiveView('input-and-upload');
          }
        }}
        isProcessing={isSimulating}
      />
    );
  }

  // ----------------------------------------------------
  // CONDITIONAL VIEW 2: SIMULATION COMPARISON RESULTS
  // ----------------------------------------------------
  if (activeView === 'simulation-results') {
    return (
      <SimulationComparisonView
        patient={patientInput}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={(id) => setActiveScenarioId(id)}
        onDeleteScenario={handleDeleteScenario}
        onTestAnotherMedication={() => setActiveView('test-new-medication')}
        onReturnToOriginalAssessment={() => {
          if (finalAnalysisResult) {
            setActiveView('report');
          } else {
            setActiveView('input-and-upload');
          }
        }}
        onConfirmPrescribeOrder={handleConfirmPrescribeOrder}
        onExportPdf={handleExportSimulationPdf}
      />
    );
  }

  // ----------------------------------------------------
  // CONDITIONAL VIEW 3: INITIAL FORMAL REPORT VIEW
  // ----------------------------------------------------
  if (activeView === 'report' && finalAnalysisResult) {
    return (
      <PrescriptionReportView
        analysisResult={finalAnalysisResult}
        onBackToEdit={() => setActiveView('input-and-upload')}
        onStartNew={handleStartNewAnalysis}
        onNavigateToMedReview={onNavigateToMedicationReview}
        onViewPatientProfile={onViewPatientProfile}
        onExportPdf={handleExportPdf}
        onTestNewMedication={handleOpenTestNewMedication}
      />
    );
  }

  // ----------------------------------------------------
  // DEFAULT VIEW: PRESCRIPTION INPUT & UPLOAD WORKFLOW
  // ----------------------------------------------------
  const availableSourceNames = uploadFiles.map((f) => f.name);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#168C83] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MedGuard Clinical Safety Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17324D] tracking-tight">
            Prescription PDF Upload & Safety Analysis
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Ingest single or multiple prescription documents, extract active medication entities, and cross-reference clinical parameters against the official H4 drug interaction and contraindication dataset.
          </p>
        </div>

        <div className="flex flex-wrap items-center space-x-2 shrink-0 self-end sm:self-auto">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#17324D] border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {scenarios.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveView('simulation-results')}
              className="px-3 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulations ({scenarios.length})</span>
            </button>
          )}

          {medications.length > 0 && (
            <button
              type="button"
              onClick={handleViewFinalReport}
              className="px-3.5 py-2 bg-[#168C83] hover:bg-[#12726b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>View Report</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartNewAnalysis}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Step 1: Patient Clinical Details Form */}
      <PrescriptionPatientForm
        patients={patients}
        initialPatientId={initialPatientId}
        patientInput={patientInput}
        onChange={setPatientInput}
        formErrors={formErrors}
        disabled={isProcessing}
      />

      {/* Step 2: Multiple PDF Upload Zone */}
      <div className="space-y-2">
        <PrescriptionUploadZone
          files={uploadFiles}
          onFilesChange={(newFiles) => {
            setUploadFiles(newFiles);
            if (formErrors.files) {
              setFormErrors((prev) => {
                const updated = { ...prev };
                delete updated.files;
                return updated;
              });
            }
          }}
          onPreviewFile={(f) => setPreviewFile(f)}
          disabled={isProcessing}
        />

        {formErrors.files && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formErrors.files}</span>
          </div>
        )}
      </div>

      {/* Action Bar: Start Analysis */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-[#17324D] flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Ready for Prescription OCR & H4 Engine Comparison</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Prepares multipart payload (<code className="font-mono text-slate-700">patient_id, files[]</code>) and connects to <code className="font-mono text-slate-700">POST /api/prescriptions/analyze</code>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleAnalyzePrescriptions}
            className={`px-5 py-2.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
              isProcessing ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isProcessing ? 'Communicating with Engine...' : 'Analyse Prescriptions'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Stage Visual Pipeline Status */}
      {(isProcessing || currentStage || submissionResponse) && (
        <ProcessingStagesTimeline
          currentStage={currentStage}
          isProcessing={isProcessing}
          isFailed={submissionResponse?.isBackendMissing || (!submissionResponse?.success && !isProcessing && !isSimulationActive)}
        />
      )}

      {/* Diagnostic Card if Backend Endpoint is Missing / Offline */}
      {submissionResponse?.isBackendMissing && !isSimulationActive && (
        <BackendDiagnosticsCard
          submissionResponse={submissionResponse}
          patientInput={patientInput}
          onLoadClinicalSimulation={handleLoadSimulation}
          onRetry={handleAnalyzePrescriptions}
          isProcessing={isProcessing}
        />
      )}

      {/* Simulation Banner Notice */}
      {isSimulationActive && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#168C83] shrink-0" />
            <div>
              <span className="font-bold">Clinical Verification Preview Mode Active</span>
              <p className="text-[11px] text-teal-800">
                Displaying realistic demonstration findings for Eleanor Vance ({patientInput.name}) based on H4 contraindication rules.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleViewFinalReport}
              className="px-3 py-1.5 bg-[#168C83] hover:bg-[#12726b] text-white font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Generate Safety Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Extracted Medications Review Table */}
      {medications.length > 0 && (
        <ExtractedMedicationsTable
          medications={medications}
          onMedicationsChange={setMedications}
          availableSources={
            availableSourceNames.length > 0
              ? availableSourceNames
              : ['Dr_Patel_Cardio_Prescription_Oct2026.pdf', 'General_Practice_Discharge_Rx.pdf']
          }
        />
      )}

      {/* Step 4: H4 Dataset Safety Findings View */}
      {findings.length > 0 && (
        <SafetyFindingsView findings={findings} />
      )}

      {/* ======================================================== */}
      {/* TASK 2: PROMINENT ACTION CARD: + TEST A NEW MEDICATION   */}
      {/* ======================================================== */}
      {medications.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 border-2 border-teal-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#168C83] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#17324D]">
                  Test a New Proposed Medication Against Existing Prescriptions
                </h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  Pre-Prescription Check
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                Want to prescribe an additional medication? Test it against this patient's existing medications before making a prescribing decision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
            {scenarios.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveView('simulation-results')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                View Scenarios ({scenarios.length})
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenTestNewMedication}
              className="px-4 py-2.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Test a New Medication</span>
            </button>
          </div>
        </div>
      )}

      {/* Final Action Bar when analysis is populated */}
      {medications.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#17324D]">
              Prescription Verification & Safety Review Complete
            </h4>
            <p className="text-xs text-slate-500">
              {medications.filter((m) => m.isConfirmed).length} of {medications.length} medications verified • {findings.length} H4 safety alerts reviewed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={printCurrentReport}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Preview</span>
            </button>

            {finalAnalysisResult && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-[#17324D] border border-slate-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#168C83]" />
                <span>Download PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenTestNewMedication}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#168C83] border border-teal-200 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Test New Medication</span>
            </button>

            <button
              type="button"
              onClick={handleViewFinalReport}
              className="px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>View Formal Safety Report</span>
            </button>
          </div>
        </div>
      )}

      {/* PDF Document Preview Modal */}
      <PdfPreviewModal
        uploadFile={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
