/**
 * MedGuard Centralized API Client
 * Connects the React frontend directly to the FastAPI backend,
 * SQLAlchemy database, and H4 Medication Safety Engine.
 */

import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
  AlertSeverity,
  AlertCategory,
  AlertReviewStatus,
  ReviewStatus,
  PatientStatus,
  AllergyEntry,
  MedicalCondition,
  ActiveMedication,
} from '../types/clinical';
import type { HealthStatusResponse } from '../types/health';

// Base API URL configurable via environment variable or Vite proxy default
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      `Network error connecting to backend API: ${err?.message || 'Server unreachable'}. Ensure FastAPI is running at http://127.0.0.1:8000.`,
      0,
      err
    );
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let responseData: any = null;
    try {
      responseData = await response.json();
      if (responseData?.detail) {
        if (typeof responseData.detail === 'string') {
          errorDetail = responseData.detail;
        } else if (Array.isArray(responseData.detail)) {
          errorDetail = responseData.detail.map((d: any) => `${d.loc?.join('.') || 'field'}: ${d.msg}`).join(', ');
        }
      } else if (responseData?.message) {
        errorDetail = responseData.message;
      }
    } catch {
      // response is not json
    }
    throw new ApiError(errorDetail, response.status, responseData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Raw API Types matching FastAPI Pydantic Schemas
// ============================================================================

export interface ApiPatient {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  weight_kg?: number | null;
  egfr?: number | null;
  crcl?: number | null;
  pregnant?: string | null;
  conditions: string[];
  allergies: string[];
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  active_prescriptions_count: number;
  active_alerts_count: number;
}

export interface ApiPatientCreate {
  id?: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  weight_kg?: number | null;
  egfr?: number | null;
  crcl?: number | null;
  pregnant?: string;
  conditions?: string[];
  allergies?: string[];
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface ApiPatientUpdate {
  name?: string;
  age?: number | null;
  gender?: string | null;
  weight_kg?: number | null;
  egfr?: number | null;
  crcl?: number | null;
  pregnant?: string;
  conditions?: string[];
  allergies?: string[];
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface ApiPatientListResponse {
  total: number;
  items: ApiPatient[];
}

export interface ApiMedication {
  id: string;
  name: string;
  generic_name?: string | null;
  active_ingredients: string[];
  drug_class?: string | null;
  default_dosage?: string | null;
  dosage_form?: string | null;
  renal_adjustment_flag?: string | null;
  pregnancy_category?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiMedicationCreate {
  id?: string;
  name: string;
  generic_name?: string;
  active_ingredients?: string[];
  drug_class?: string;
  default_dosage?: string;
  dosage_form?: string;
  renal_adjustment_flag?: string;
  pregnancy_category?: string;
  notes?: string;
}

export interface ApiMedicationListResponse {
  total: number;
  items: ApiMedication[];
}

export interface ApiSafetyAlert {
  id: string;
  patient_id: string;
  prescription_id?: string | null;
  rule_id: string;
  category: string;
  severity: string;
  drugs_involved: string[];
  reason: string;
  suggested_action?: string | null;
  evidence_source?: string | null;
  review_status: string;
  reviewed_by?: string | null;
  review_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface ApiPrescription {
  id: string;
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  generic_name?: string | null;
  dosage: string;
  dose_mg?: number | null;
  frequency: string;
  route: string;
  status: string; // 'APPROVED' | 'FLAGGED' | 'PENDING_REVIEW' | 'DISCONTINUED' | 'REJECTED'
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_notes?: string | null;
  notes?: string | null;
  safety_alerts: ApiSafetyAlert[];
}

export interface ApiPrescriptionCreate {
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  dosage: string;
  dose_mg?: number;
  frequency: string;
  route?: string;
  notes?: string;
}

export interface ApiPrescriptionListResponse {
  total: number;
  items: ApiPrescription[];
}

export interface ApiPrescriptionCreateResponse {
  prescription: ApiPrescription;
  safety_check: any;
  alerts_generated: ApiSafetyAlert[];
}

export interface ApiAuditLog {
  id: string;
  event_type: string;
  patient_id?: string | null;
  prescription_id?: string | null;
  safety_alert_id?: string | null;
  actor_id: string;
  action: string;
  summary: string;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface ApiAuditLogListResponse {
  total: number;
  items: ApiAuditLog[];
}

// ============================================================================
// Model Adapters: Converting API Responses to Frontend Types
// ============================================================================

export function toFrontendPatient(p: ApiPatient, prescriptions: ApiPrescription[] = []): PatientRecord {
  // Infer active medications from linked prescriptions or empty
  const currentMeds: ActiveMedication[] = prescriptions
    .filter((rx) => rx.patient_id === p.id && rx.status !== 'DISCONTINUED')
    .map((rx) => ({
      id: rx.id,
      name: rx.medication_name,
      genericName: rx.generic_name || undefined,
      dosage: rx.dosage,
      frequency: rx.frequency,
      route: rx.route,
      prescriber: rx.prescriber_id,
      startDate: rx.submitted_at ? new Date(rx.submitted_at).toISOString().split('T')[0] : '2026-10-30',
      status: rx.status === 'APPROVED' ? 'Active' : 'Active',
      notes: rx.notes || undefined,
    }));

  const conditionDetails: MedicalCondition[] = (p.conditions || []).map((cond) => ({
    condition: cond,
    diagnosedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active',
    status: 'Active',
    notes: 'Documented medical history',
  }));

  // Never fabricate allergy reaction or severity
  const allergyDetails: AllergyEntry[] = (p.allergies || []).map((allergen) => ({
    allergen,
    severity: 'Not Recorded',
    reaction: 'Not Recorded',
  }));

  let patientStatus: PatientStatus = 'Active';
  if (p.notes?.toLowerCase().includes('observation')) {
    patientStatus = 'Under Observation';
  } else if (p.notes?.toLowerCase().includes('discharged')) {
    patientStatus = 'Discharged';
  }

  return {
    id: p.id,
    name: p.name,
    dob: 'Not Recorded',
    age: p.age ?? undefined,
    gender: p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender || 'Unknown',
    phone: p.phone || 'Not Recorded',
    email: p.email || 'Not Recorded',
    bloodGroup: 'Not Recorded',
    lastVisit: p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
    room: p.notes?.includes('Room:') ? p.notes.split('Room:')[1].split('.')[0].trim() : (p.notes?.includes('Room') ? p.notes : 'Not Assigned'),
    status: patientStatus,
    primaryDiagnosis: p.conditions?.[0] || 'Under clinical evaluation',
    allergies: p.allergies && p.allergies.length > 0 ? p.allergies : ['None documented'],
    allergyDetails,
    conditions: p.conditions && p.conditions.length > 0 ? p.conditions : ['Under assessment'],
    conditionDetails,
    medicalHistory: p.notes || (p.egfr ? `eGFR: ${p.egfr} mL/min/1.73m²` : 'No additional medical history.'),
    currentMedications: currentMeds,
    pregnant: p.pregnant || 'NA',
    egfr: p.egfr,
    crcl: p.crcl,
    weight_kg: p.weight_kg,
    emergencyContact: {
      name: 'Not Recorded',
      relation: 'Not Recorded',
      phone: 'Not Recorded',
    },
  };
}

export function toFrontendReview(rx: ApiPrescription, patientName: string = 'Patient'): MedicationReviewRecord {
  let mappedStatus: ReviewStatus = 'Pending Review';
  if (rx.status === 'APPROVED') mappedStatus = 'Approved';
  else if (rx.status === 'FLAGGED' || rx.status === 'REJECTED') mappedStatus = 'Flagged';
  else if (rx.status === 'PENDING_REVIEW') mappedStatus = 'Pending Review';

  const prescribedDate = rx.submitted_at
    ? new Date(rx.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  return {
    id: rx.id,
    patientId: rx.patient_id,
    patientName,
    medicationName: rx.medication_name,
    genericName: rx.generic_name || undefined,
    dosage: rx.dosage,
    frequency: rx.frequency,
    route: rx.route || 'Oral',
    prescribedDate,
    startDate: rx.submitted_at ? new Date(rx.submitted_at).toISOString().split('T')[0] : '2026-10-30',
    endDate: undefined,
    prescriber: rx.prescriber_id,
    status: mappedStatus,
    medicationStatus: rx.status === 'DISCONTINUED' ? 'Discontinued' : 'Active',
    reviewer: rx.reviewed_by || 'Awaiting Clinical Reviewer',
    reviewDate: rx.reviewed_at ? new Date(rx.reviewed_at).toLocaleDateString() : 'Pending',
    clinicalNotes: rx.review_notes || rx.notes || 'Awaiting clinical review.',
    notes: rx.notes || undefined,
  };
}

export function toFrontendAlert(
  al: ApiSafetyAlert,
  patientName: string = 'Patient',
  patientContext?: { eGFR?: string; serumCreatinine?: string; allergies?: string[]; room?: string }
): SafetyAlertRecord {
  // Map Severity: CONTRAINDICATED / CRITICAL -> Critical, MAJOR / SEVERE -> High, MODERATE -> Moderate, MINOR -> Low
  let severity: AlertSeverity = 'Moderate';
  const sevUpper = (al.severity || '').toUpperCase();
  if (sevUpper.includes('CONTRAINDICAT') || sevUpper.includes('CRITICAL')) {
    severity = 'Critical';
  } else if (sevUpper.includes('MAJOR') || sevUpper.includes('SEVERE') || sevUpper.includes('HIGH')) {
    severity = 'High';
  } else if (sevUpper.includes('MODERATE')) {
    severity = 'Moderate';
  } else if (sevUpper.includes('MINOR') || sevUpper.includes('LOW')) {
    severity = 'Low';
  }

  // Map Category
  let category: AlertCategory = 'Other Warning';
  const catUpper = (al.category || '').toUpperCase();
  if (catUpper.includes('DRUG_DRUG') || catUpper.includes('INTERACTION')) {
    category = 'Drug-Drug Interaction';
  } else if (catUpper.includes('DUPLICATE')) {
    category = 'Duplicate Medication';
  } else if (catUpper.includes('RENAL')) {
    category = 'Renal Safety';
  }

  // Map Review Status: UNRESOLVED -> Unresolved, UNDER_REVIEW -> Under Review, RESOLVED / OVERRIDDEN -> Resolved
  let reviewStatus: AlertReviewStatus = 'Unresolved';
  const stUpper = (al.review_status || '').toUpperCase();
  if (stUpper.includes('UNDER_REVIEW')) {
    reviewStatus = 'Under Review';
  } else if (stUpper.includes('RESOLVED') || stUpper.includes('OVERRIDDEN')) {
    reviewStatus = 'Resolved';
  }

  const alertDate = al.created_at
    ? new Date(al.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  return {
    id: al.id,
    patientId: al.patient_id,
    patientName,
    alertType: `${al.category.replace(/_/g, ' ')} (${al.rule_id})`,
    category,
    affectedMedications: al.drugs_involved || [],
    severity,
    date: alertDate,
    summary: al.reason,
    detailedExplanation: `${al.reason}${al.evidence_source ? ` [Source: ${al.evidence_source}]` : ''}`,
    evidenceSource: al.evidence_source || 'H4 Medication Safety Knowledge Base',
    clinicalRecommendation: al.suggested_action || 'Review therapy and adjust dose or select alternative agent.',
    recommendation: al.suggested_action || 'Review therapy and adjust dose or select alternative agent.',
    reviewStatus,
    reviewedBy: al.reviewed_by || undefined,
    reviewNotes: al.review_notes || undefined,
    patientContext,
  };
}

// ============================================================================
// Centralized API Functions
// ============================================================================

/**
 * PHASE 1 & 7: Check API Health
 */
export async function getHealth(): Promise<HealthStatusResponse> {
  return request<HealthStatusResponse>('/health');
}

export async function checkApiHealth(): Promise<HealthStatusResponse> {
  return getHealth();
}

/**
 * PHASE 2: Patient Management APIs
 */
export async function getPatients(
  search?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ApiPatientListResponse> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  return request<ApiPatientListResponse>(`/patients?${params.toString()}`);
}

export async function getPatient(id: string): Promise<ApiPatient> {
  return request<ApiPatient>(`/patients/${encodeURIComponent(id)}`);
}

export async function createPatient(data: ApiPatientCreate, actorId: string = 'CLINICIAN'): Promise<ApiPatient> {
  return request<ApiPatient>(`/patients?actor_id=${encodeURIComponent(actorId)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  id: string,
  data: ApiPatientUpdate,
  actorId: string = 'CLINICIAN'
): Promise<ApiPatient> {
  return request<ApiPatient>(`/patients/${encodeURIComponent(id)}?actor_id=${encodeURIComponent(actorId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: string, actorId: string = 'CLINICIAN'): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(
    `/patients/${encodeURIComponent(id)}?actor_id=${encodeURIComponent(actorId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function getPatientPrescriptions(patientId: string): Promise<any[]> {
  return request<any[]>(`/patients/${encodeURIComponent(patientId)}/prescriptions`);
}

export async function getPatientAlerts(patientId: string): Promise<any[]> {
  return request<any[]>(`/patients/${encodeURIComponent(patientId)}/alerts`);
}

/**
 * PHASE 3: Medication Formulary APIs
 */
export async function getMedications(
  search?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ApiMedicationListResponse> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  return request<ApiMedicationListResponse>(`/medications?${params.toString()}`);
}

export async function getMedication(id: string): Promise<ApiMedication> {
  return request<ApiMedication>(`/medications/${encodeURIComponent(id)}`);
}

export async function createMedication(
  data: ApiMedicationCreate,
  actorId: string = 'PHARMACIST'
): Promise<ApiMedication> {
  return request<ApiMedication>(`/medications?actor_id=${encodeURIComponent(actorId)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMedication(
  id: string,
  data: Partial<ApiMedicationCreate>,
  actorId: string = 'PHARMACIST'
): Promise<ApiMedication> {
  return request<ApiMedication>(`/medications/${encodeURIComponent(id)}?actor_id=${encodeURIComponent(actorId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMedication(id: string, actorId: string = 'PHARMACIST'): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(
    `/medications/${encodeURIComponent(id)}?actor_id=${encodeURIComponent(actorId)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * PHASE 4: Prescription & Safety Evaluation APIs
 */
export async function getPrescriptions(
  patientId?: string,
  status?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ApiPrescriptionListResponse> {
  const params = new URLSearchParams();
  if (patientId) params.append('patient_id', patientId);
  if (status) params.append('status', status);
  params.append('skip', String(skip));
  params.append('limit', String(limit));
  return request<ApiPrescriptionListResponse>(`/prescriptions?${params.toString()}`);
}

export async function getPrescription(id: string): Promise<ApiPrescription> {
  return request<ApiPrescription>(`/prescriptions/${encodeURIComponent(id)}`);
}

export async function createPrescription(
  data: ApiPrescriptionCreate,
  autoEvaluate: boolean = true
): Promise<ApiPrescriptionCreateResponse> {
  return request<ApiPrescriptionCreateResponse>(`/prescriptions?auto_evaluate=${autoEvaluate}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reviewPrescription(
  id: string,
  action: 'APPROVE' | 'FLAG' | 'DISCONTINUE' | 'REJECT',
  reviewerId: string = 'DR-CLINICAL-PHARMACIST',
  reviewNotes?: string
): Promise<ApiPrescription> {
  return request<ApiPrescription>(`/prescriptions/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      reviewer_id: reviewerId,
      review_notes: reviewNotes,
    }),
  });
}

/**
 * PHASE 5: Safety Alerts & Review APIs
 */
export async function getAlerts(filters?: {
  patient_id?: string;
  severity?: string;
  review_status?: string;
  skip?: number;
  limit?: number;
}): Promise<ApiSafetyAlert[]> {
  const params = new URLSearchParams();
  if (filters?.patient_id) params.append('patient_id', filters.patient_id);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.review_status) params.append('review_status', filters.review_status);
  params.append('skip', String(filters?.skip ?? 0));
  params.append('limit', String(filters?.limit ?? 100));
  return request<ApiSafetyAlert[]>(`/safety/alerts?${params.toString()}`);
}

export async function getAlert(id: string): Promise<ApiSafetyAlert> {
  return request<ApiSafetyAlert>(`/safety/alerts/${encodeURIComponent(id)}`);
}

export async function reviewAlert(
  id: string,
  action: 'RESOLVE' | 'OVERRIDE' | 'UNDER_REVIEW' | 'UNRESOLVED',
  rationale?: string,
  reviewerId: string = 'DR-CLINICAL-PHARMACIST'
): Promise<ApiSafetyAlert> {
  return request<ApiSafetyAlert>(`/safety/alerts/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      reviewer_id: reviewerId,
      review_notes: rationale,
    }),
  });
}

/**
 * Audit Logs & Safety Rule Summaries
 */
export async function getAuditLogs(filters?: {
  patient_id?: string;
  prescription_id?: string;
  safety_alert_id?: string;
  actor_id?: string;
  event_type?: string;
  skip?: number;
  limit?: number;
}): Promise<ApiAuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters?.patient_id) params.append('patient_id', filters.patient_id);
  if (filters?.prescription_id) params.append('prescription_id', filters.prescription_id);
  if (filters?.safety_alert_id) params.append('safety_alert_id', filters.safety_alert_id);
  if (filters?.actor_id) params.append('actor_id', filters.actor_id);
  if (filters?.event_type) params.append('event_type', filters.event_type);
  params.append('skip', String(filters?.skip ?? 0));
  params.append('limit', String(filters?.limit ?? 100));
  return request<ApiAuditLogListResponse>(`/safety/audit-logs?${params.toString()}`);
}

export async function getSafetyRulesSummary(): Promise<any> {
  return request<any>('/safety/rules');
}

export async function checkSafety(data: any): Promise<any> {
  return request<any>('/safety/check', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export default {
  getHealth,
  checkApiHealth,
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientPrescriptions,
  getPatientAlerts,
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getPrescriptions,
  getPrescription,
  createPrescription,
  reviewPrescription,
  getAlerts,
  getAlert,
  reviewAlert,
  getAuditLogs,
  getSafetyRulesSummary,
  checkSafety,
};
