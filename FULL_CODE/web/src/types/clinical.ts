export type PatientStatus = 'Active' | 'Under Observation' | 'Discharged';

export interface AllergyEntry {
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction: string;
}

export interface MedicalCondition {
  condition: string;
  diagnosedDate: string;
  status: 'Active' | 'Controlled' | 'Resolved';
  notes?: string;
}

export interface ActiveMedication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  route: string;
  prescriber: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Paused' | 'Discontinued' | 'Completed';
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  lastVisit: string;
  room: string;
  status: PatientStatus;
  primaryDiagnosis?: string;
  allergies?: string[];
  allergyDetails?: AllergyEntry[];
  conditions?: string[];
  conditionDetails?: MedicalCondition[];
  medicalHistory?: string;
  currentMedications?: ActiveMedication[];
  previousMedications?: ActiveMedication[];
  emergencyContact?: EmergencyContact;
}

export type ReviewStatus = 'Approved' | 'Flagged' | 'Pending Review';

export interface MedicationReviewRecord {
  id: string;
  patientName: string;
  patientId: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  dosageUnit?: string;
  frequency: string;
  route: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  prescriber: string;
  status: ReviewStatus;
  medicationStatus?: 'Active' | 'Paused' | 'Discontinued' | 'Completed';
  reviewer: string;
  reviewDate: string;
  clinicalNotes?: string;
  notes?: string;
}

export type AlertSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';
export type AlertCategory =
  | 'Drug-Drug Interaction'
  | 'Duplicate Medication'
  | 'Renal Safety'
  | 'Other Warning';
export type AlertReviewStatus = 'Unresolved' | 'Under Review' | 'Resolved';

export interface SafetyAlertRecord {
  id: string;
  patientId: string;
  patientName: string;
  alertType: string;
  category: AlertCategory;
  affectedMedications: string[];
  severity: AlertSeverity;
  date: string;
  summary: string;
  detailedExplanation: string;
  evidenceSource?: string;
  clinicalRecommendation?: string;
  recommendation: string;
  reviewStatus: AlertReviewStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  patientContext?: {
    eGFR?: string;
    serumCreatinine?: string;
    allergies?: string[];
    room?: string;
  };
}

export interface StatCardData {
  id: string;
  title: string;
  value: string;
  changeLabel?: string;
  badge?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export type ReportingPeriod = '7d' | '30d' | '90d' | 'custom';

export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

export interface ClinicalAnalyticsMetrics {
  totalReviews: number;
  totalAlerts: number;
  highRiskCases: number;
  resolvedAlerts: number;
  pendingReviews: number;
  periodLabel: string;
}
