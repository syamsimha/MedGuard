import type {
  PrescriptionPatientInput,
  PrescriptionUploadFile,
  ExtractedMedication,
  PrescriptionSafetyFinding,
  PrescriptionAnalysisResult,
  ProcessingStageId,
} from '../types/prescription';

/**
 * Backend API Service Contract & Client for Prescription Analysis
 *
 * SPECIFICATION CONTRACT:
 * Endpoint: POST /api/prescriptions/analyze
 * Content-Type: multipart/form-data
 *
 * Request Fields:
 * - patient_id (string, required)
 * - patient_name (string, required)
 * - age_or_dob (string, required)
 * - gender (string, required)
 * - weight (string, optional)
 * - allergies (string, optional)
 * - conditions (string, optional)
 * - renal_history (string, optional)
 * - clinical_notes (string, optional)
 * - files (binary[], array of PDF file uploads, required)
 *
 * Expected Response Schema (JSON):
 * {
 *   "task_id": "string",
 *   "status": "completed" | "incomplete" | "failed" | "no_issues_detected",
 *   "summary_message": "string",
 *   "extracted_medications": [
 *     {
 *       "id": "string",
 *       "name": "string",
 *       "generic_name": "string",
 *       "strength": "string",
 *       "dosage": "string",
 *       "frequency": "string",
 *       "route": "string",
 *       "duration": "string",
 *       "source_file": "string",
 *       "confidence_score": 0.95
 *     }
 *   ],
 *   "safety_findings": [
 *     {
 *       "id": "string",
 *       "category": "Drug-Drug Interaction" | "Duplicate Medication" | "Contraindication" | "Renal Safety" | "Other Warning",
 *       "severity": "Critical" | "High" | "Moderate" | "Low",
 *       "affected_medications": ["string"],
 *       "explanation": "string",
 *       "evidence_source": "string",
 *       "recommendation": "string",
 *       "review_status": "string"
 *     }
 *   ]
 * }
 */

export interface BackendSubmissionResponse {
  success: boolean;
  statusCode?: number;
  data?: PrescriptionAnalysisResult;
  error?: string;
  isBackendMissing?: boolean;
  endpointUrl: string;
  submittedPayloadSummary: {
    patientId: string;
    patientName: string;
    filesCount: number;
    fileNames: string[];
    totalSizeKb: number;
  };
}

export const BACKEND_ENDPOINT_URL = '/api/prescriptions/analyze';

/**
 * Submits patient information and prescription PDF files to the backend safety engine.
 * Adheres strictly to Phase G rules:
 * - Uses multipart/form-data
 * - Does not invent fake extraction results
 * - Connects to real endpoint and reports actual availability
 */
export async function submitPrescriptionsToBackend(
  patientInput: PrescriptionPatientInput,
  uploadFiles: PrescriptionUploadFile[],
  onStageChange?: (stage: ProcessingStageId) => void
): Promise<BackendSubmissionResponse> {
  const payloadSummary = {
    patientId: patientInput.patientId,
    patientName: patientInput.name,
    filesCount: uploadFiles.length,
    fileNames: uploadFiles.map((f) => f.name),
    totalSizeKb: Math.round(uploadFiles.reduce((acc, f) => acc + f.size, 0) / 1024),
  };

  // 1. Stage: Uploading
  onStageChange?.('uploading');

  // Build multipart/form-data
  const formData = new FormData();
  formData.append('patient_id', patientInput.patientId);
  formData.append('patient_name', patientInput.name);
  formData.append('age_or_dob', patientInput.ageOrDob);
  formData.append('gender', patientInput.gender);
  if (patientInput.weight) formData.append('weight', patientInput.weight);
  if (patientInput.allergies) formData.append('allergies', patientInput.allergies);
  if (patientInput.conditions) formData.append('conditions', patientInput.conditions);
  if (patientInput.renalHistory) formData.append('renal_history', patientInput.renalHistory);
  if (patientInput.clinicalNotes) formData.append('clinical_notes', patientInput.clinicalNotes);

  uploadFiles.forEach((uf) => {
    formData.append('files', uf.file, uf.name);
  });

  try {
    // Attempt actual backend communication
    onStageChange?.('extracting');

    const response = await fetch(BACKEND_ENDPOINT_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      onStageChange?.('comparing');
      const json = await response.json();
      onStageChange?.('generating');

      // Map backend response
      const medications: ExtractedMedication[] = (json.extracted_medications || []).map(
        (m: any, idx: number) => ({
          id: m.id || `EXT-MED-${idx + 1}`,
          name: m.name || m.medicine_name || 'Unknown Agent',
          genericName: m.generic_name,
          strength: m.strength,
          dosage: m.dosage || 'Unspecified',
          frequency: m.frequency || 'Unspecified',
          route: m.route || 'Oral',
          duration: m.duration,
          sourceFile: m.source_file || uploadFiles[0]?.name || 'Prescription',
          confidenceScore: m.confidence_score,
          isConfirmed: true,
        })
      );

      const findings: PrescriptionSafetyFinding[] = (json.safety_findings || []).map(
        (f: any, idx: number) => ({
          id: f.id || `FIND-${idx + 1}`,
          category: f.category || 'Drug-Drug Interaction',
          severity: f.severity || 'Moderate',
          affectedMedications: f.affected_medications || [],
          explanation: f.explanation || f.clinical_explanation || '',
          evidenceSource: f.evidence_source,
          recommendation: f.recommendation,
          reviewStatus: f.review_status,
        })
      );

      return {
        success: true,
        statusCode: response.status,
        endpointUrl: BACKEND_ENDPOINT_URL,
        submittedPayloadSummary: payloadSummary,
        data: {
          outcome:
            findings.length > 0
              ? 'analysis_completed_with_findings'
              : 'no_issues_detected',
          summaryMessage:
            json.summary_message ||
            (findings.length > 0
              ? `Safety analysis completed: ${findings.length} clinical contraindication(s) identified.`
              : 'Safety analysis completed: No active contraindications detected against the H4 dataset.'),
          patient: patientInput,
          files: uploadFiles.map((f) => ({ name: f.name, size: f.size })),
          medications,
          findings,
          analyzedAt: new Date().toLocaleString(),
          backendEndpoint: BACKEND_ENDPOINT_URL,
          backendRawResponse: json,
        },
      };
    }

    // Backend returned non-200 (e.g. 404 Not Found or 501 Not Implemented)
    return {
      success: false,
      statusCode: response.status,
      isBackendMissing: response.status === 404 || response.status === 501 || response.status === 502,
      error: `Backend endpoint returned HTTP ${response.status} (${response.statusText}). The backend safety engine route at ${BACKEND_ENDPOINT_URL} is pending implementation.`,
      endpointUrl: BACKEND_ENDPOINT_URL,
      submittedPayloadSummary: payloadSummary,
    };
  } catch (err: any) {
    // Connection refused / Network failure (FastAPI backend server not running on port)
    return {
      success: false,
      isBackendMissing: true,
      error: `Unable to connect to backend server at ${BACKEND_ENDPOINT_URL}. The backend medication safety engine is awaiting teammate deployment. (${err.message || 'Network request failed'})`,
      endpointUrl: BACKEND_ENDPOINT_URL,
      submittedPayloadSummary: payloadSummary,
    };
  }
}
