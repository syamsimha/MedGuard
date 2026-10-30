import type { AlertSeverity } from './clinical';

export interface PrescriptionUploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  uploadedAt: string;
  previewUrl: string;
}

export interface PrescriptionPatientInput {
  patientId: string;
  name: string;
  ageOrDob: string;
  gender: string;
  weight?: string;
  allergies?: string;
  conditions?: string;
  renalHistory?: string;
  clinicalNotes?: string;
}

export type ProcessingStageId = 
  | 'uploading'
  | 'extracting'
  | 'identifying'
  | 'comparing'
  | 'generating';

export interface ProcessingStageStatus {
  id: ProcessingStageId;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ExtractedMedication {
  id: string;
  name: string;
  genericName?: string;
  strength?: string;
  dosage: string;
  frequency: string;
  route: string;
  duration?: string;
  sourceFile: string;
  confidenceScore?: number;
  isConfirmed?: boolean;
}

export type SafetyFindingCategory =
  | 'Drug-Drug Interaction'
  | 'Duplicate Medication'
  | 'Contraindication'
  | 'Renal Safety'
  | 'Other Warning';

export interface PrescriptionSafetyFinding {
  id: string;
  category: SafetyFindingCategory;
  severity: AlertSeverity;
  affectedMedications: string[];
  explanation: string;
  evidenceSource?: string;
  recommendation?: string;
  reviewStatus?: string;
}

export type AnalysisOutcomeStatus =
  | 'no_issues_detected'
  | 'analysis_completed_with_findings'
  | 'analysis_incomplete'
  | 'unable_to_process';

export interface PrescriptionAnalysisResult {
  outcome: AnalysisOutcomeStatus;
  summaryMessage: string;
  patient: PrescriptionPatientInput;
  files: { name: string; size: number }[];
  medications: ExtractedMedication[];
  findings: PrescriptionSafetyFinding[];
  analyzedAt: string;
  backendEndpoint?: string;
  backendRawResponse?: unknown;
}

// ==========================================
// NEW MEDICATION SAFETY SIMULATION TYPES
// ==========================================

export interface ProposedMedicationInput {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  route: string;
  proposedStartDate?: string;
  proposedDuration?: string;
  clinicalNotes?: string;
  indication?: string;
}

export interface SimulationSafetyFinding extends PrescriptionSafetyFinding {
  isNewFinding: boolean;
  involvesProposedMed: boolean;
  riskType: 'new_risk' | 'pre_existing';
}

export interface MedicationSimulationScenario {
  id: string;
  title: string;
  testedAt: string;
  proposedMedication: ProposedMedicationInput;
  existingMedicationsSnapshot: ExtractedMedication[];
  originalFindingsSnapshot: PrescriptionSafetyFinding[];
  simulatedFindings: SimulationSafetyFinding[];
  newFindingsCount: number;
  preExistingFindingsCount: number;
  outcome: AnalysisOutcomeStatus;
  summaryMessage: string;
  isBackendMissing?: boolean;
  backendEndpoint?: string;
  isPrescribed?: boolean;
}
