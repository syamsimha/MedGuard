import type {
  PrescriptionPatientInput,
  ExtractedMedication,
  PrescriptionSafetyFinding,
  ProposedMedicationInput,
  SimulationSafetyFinding,
  MedicationSimulationScenario,
  AnalysisOutcomeStatus,
} from '../types/prescription';

/**
 * ============================================================================
 * BACKEND API SPECIFICATION & CLIENT SERVICE: PROPOSED MEDICATION SIMULATION
 * ============================================================================
 *
 * SPECIFICATION CONTRACT:
 * Endpoint: POST /api/prescriptions/simulate-medication
 * Content-Type: application/json
 *
 * Request Payload Schema:
 * {
 *   "patient_id": "PT-8021",
 *   "patient_info": {
 *     "name": "Eleanor Vance",
 *     "age_or_dob": "68 yrs (1958-04-12)",
 *     "gender": "Female",
 *     "weight": "68 kg",
 *     "allergies": "Penicillin, Sulfa drugs",
 *     "conditions": "Atrial Fibrillation with RVR, Hypertension Stage 2",
 *     "renal_history": "eGFR 48 mL/min/1.73m² (CKD Stage 3a), Serum Creatinine 1.4 mg/dL",
 *     "clinical_notes": "Evaluating discharge regimen."
 *   },
 *   "existing_medications": [
 *     {
 *       "id": "EXT-001",
 *       "name": "Warfarin Sodium",
 *       "generic_name": "Warfarin Sodium",
 *       "strength": "5 mg",
 *       "dosage": "1 tablet (5 mg)",
 *       "frequency": "Once daily at 18:00",
 *       "route": "Oral",
 *       "duration": "Ongoing",
 *       "source_file": "Dr_Patel_Cardio_Prescription_Oct2026.pdf"
 *     }
 *   ],
 *   "proposed_medication": {
 *     "name": "Ciprofloxacin",
 *     "generic_name": "Ciprofloxacin Hydrochloride",
 *     "brand_name": "Cipro",
 *     "strength": "500 mg",
 *     "dosage": "1 tablet (500 mg)",
 *     "dosage_unit": "tablet",
 *     "frequency": "Twice daily (BID)",
 *     "route": "Oral",
 *     "proposed_start_date": "2026-10-31",
 *     "proposed_duration": "7 days",
 *     "clinical_notes": "Suspected bacterial infection"
 *   }
 * }
 *
 * Expected Response Schema:
 * {
 *   "simulation_id": "SIM-2026-8021-01",
 *   "status": "completed",
 *   "summary_message": "Proposed medication safety evaluation completed against H4 engine.",
 *   "new_findings": [
 *     {
 *       "id": "H4-SIM-001",
 *       "category": "Drug-Drug Interaction",
 *       "severity": "Critical",
 *       "affected_medications": ["Ciprofloxacin", "Warfarin Sodium"],
 *       "explanation": "Ciprofloxacin strongly inhibits CYP1A2 and CYP3A4...",
 *       "evidence_source": "H4 Interaction Rule #DDI-CYP-302",
 *       "recommendation": "Avoid combination or reduce Warfarin dose by 50% with daily INR monitoring.",
 *       "review_status": "Unresolved"
 *     }
 *   ],
 *   "pre_existing_findings": [
 *     // Unchanged baseline findings from existing prescription list
 *   ]
 * }
 */

export const SIMULATION_API_ENDPOINT = '/api/prescriptions/simulate-medication';

export interface SimulationSubmissionResponse {
  success: boolean;
  statusCode?: number;
  data?: MedicationSimulationScenario;
  error?: string;
  isBackendMissing?: boolean;
  endpointUrl: string;
  preparedPayload: {
    patient_id: string;
    patient_info: PrescriptionPatientInput;
    existing_medications: ExtractedMedication[];
    proposed_medication: ProposedMedicationInput;
  };
}

/**
 * Submits hypothetical proposed medication alongside patient details and existing
 * prescription medications to the backend H4 safety engine.
 */
export async function submitProposedMedicationSimulation(
  patient: PrescriptionPatientInput,
  existingMedications: ExtractedMedication[],
  originalFindings: PrescriptionSafetyFinding[],
  proposedMed: ProposedMedicationInput
): Promise<SimulationSubmissionResponse> {
  const preparedPayload = {
    patient_id: patient.patientId,
    patient_info: patient,
    existing_medications: existingMedications,
    proposed_medication: proposedMed,
  };

  try {
    const response = await fetch(SIMULATION_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preparedPayload),
    });

    if (response.ok) {
      const json = await response.json();

      // Map backend new findings specifically introduced by the proposed drug
      const newFindings: SimulationSafetyFinding[] = (json.new_findings || []).map(
        (f: any, idx: number) => ({
          id: f.id || `SIM-NEW-${idx + 1}`,
          category: f.category || 'Drug-Drug Interaction',
          severity: f.severity || 'High',
          affectedMedications: f.affected_medications || [proposedMed.name],
          explanation: f.explanation || f.clinical_explanation || '',
          evidenceSource: f.evidence_source || 'H4 Safety Dataset Engine',
          recommendation: f.recommendation || '',
          reviewStatus: f.review_status || 'Under Review',
          isNewFinding: true,
          involvesProposedMed: true,
          riskType: 'new_risk' as const,
        })
      );

      // Map pre-existing baseline findings (unchanged)
      const preExistingFindings: SimulationSafetyFinding[] = (
        json.pre_existing_findings || originalFindings
      ).map((f: any) => ({
        ...f,
        isNewFinding: false,
        involvesProposedMed: false,
        riskType: 'pre_existing' as const,
      }));

      const allFindings = [...newFindings, ...preExistingFindings];

      let outcome: AnalysisOutcomeStatus = 'no_issues_detected';
      if (allFindings.some((f) => f.severity === 'Critical' || f.severity === 'High')) {
        outcome = 'analysis_completed_with_findings';
      }

      const scenario: MedicationSimulationScenario = {
        id: json.simulation_id || `SIM-${Date.now().toString().slice(-4)}`,
        title: `Hypothetical Test: ${proposedMed.name} ${proposedMed.strength || ''}`,
        testedAt: new Date().toLocaleString(),
        proposedMedication: proposedMed,
        existingMedicationsSnapshot: [...existingMedications],
        originalFindingsSnapshot: [...originalFindings],
        simulatedFindings: allFindings,
        newFindingsCount: newFindings.length,
        preExistingFindingsCount: preExistingFindings.length,
        outcome,
        summaryMessage:
          json.summary_message ||
          (newFindings.length > 0
            ? `Proposed medication introduces ${newFindings.length} NEW risk finding(s) against patient's existing regimen.`
            : 'No new adverse interactions or contraindications identified for proposed medication.'),
        backendEndpoint: SIMULATION_API_ENDPOINT,
      };

      return {
        success: true,
        statusCode: response.status,
        endpointUrl: SIMULATION_API_ENDPOINT,
        data: scenario,
        preparedPayload,
      };
    }

    // Backend returned non-200 (404 Not Found, 501 Not Implemented)
    return {
      success: false,
      statusCode: response.status,
      isBackendMissing: response.status === 404 || response.status === 501,
      error: `Backend endpoint returned HTTP ${response.status} (${response.statusText}). The proposed medication simulation route at ${SIMULATION_API_ENDPOINT} is awaiting backend deployment.`,
      endpointUrl: SIMULATION_API_ENDPOINT,
      preparedPayload,
    };
  } catch (err: any) {
    // Network / connection refused
    return {
      success: false,
      isBackendMissing: true,
      error: `Unable to connect to backend service at ${SIMULATION_API_ENDPOINT}. (${err.message || 'Network request failed'})`,
      endpointUrl: SIMULATION_API_ENDPOINT,
      preparedPayload,
    };
  }
}
