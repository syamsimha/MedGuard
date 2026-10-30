"""Pydantic validation schemas for MedGuard CRUD operations and safety workflows."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.models.safety import SafetyCheckResponse


# ============================================================================
# 1. Patient Schemas
# ============================================================================

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full patient name")
    age: Optional[int] = Field(None, ge=0, le=130, description="Age in years")
    gender: Optional[str] = Field(None, max_length=32, description="Gender (e.g., M, F, Other)")
    weight_kg: Optional[float] = Field(None, gt=0, le=500, description="Weight in kilograms")
    egfr: Optional[float] = Field(None, gt=0, le=300, description="Estimated GFR in mL/min/1.73m²")
    crcl: Optional[float] = Field(None, gt=0, le=300, description="Creatinine Clearance in mL/min")
    pregnant: Optional[str] = Field("N", description="Pregnancy indicator ('Y', 'N', 'NA')")
    conditions: List[str] = Field(default_factory=list, description="Active diagnosed conditions")
    allergies: List[str] = Field(default_factory=list, description="Documented drug allergies")
    phone: Optional[str] = Field(None, max_length=64, description="Contact phone")
    email: Optional[str] = Field(None, max_length=128, description="Contact email")
    notes: Optional[str] = Field(None, description="Clinical notes or medical history")


class PatientCreate(PatientBase):
    id: Optional[str] = Field(None, description="Optional custom patient ID (e.g. 'PAT-001' or 'H4P-001')")


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    egfr: Optional[float] = Field(None, gt=0, le=300)
    crcl: Optional[float] = Field(None, gt=0, le=300)
    pregnant: Optional[str] = None
    conditions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class PatientResponse(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime
    active_prescriptions_count: int = 0
    active_alerts_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PatientListResponse(BaseModel):
    total: int
    items: List[PatientResponse]


# ============================================================================
# 2. Medication Schemas
# ============================================================================

class MedicationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Brand name or formulary identifier")
    generic_name: Optional[str] = Field(None, max_length=255, description="Canonical generic name")
    active_ingredients: List[str] = Field(default_factory=list, description="List of active pharmacological moieties")
    drug_class: Optional[str] = Field(None, max_length=255, description="Therapeutic / pharmacological class")
    default_dosage: Optional[str] = Field(None, max_length=128, description="Standard dose (e.g., '500mg')")
    dosage_form: Optional[str] = Field(None, max_length=128, description="Form (tablet, capsule, syrup, etc.)")
    renal_adjustment_flag: Optional[str] = Field("N", description="Requires renal dosage adjustment ('Y'/'N')")
    pregnancy_category: Optional[str] = Field("N", description="FDA pregnancy category ('A', 'B', 'C', 'D', 'X', 'N')")
    notes: Optional[str] = Field(None, description="Formulary guidance or boxed warnings")


class MedicationCreate(MedicationBase):
    id: Optional[str] = Field(None, description="Optional custom medication ID")


class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    generic_name: Optional[str] = None
    active_ingredients: Optional[List[str]] = None
    drug_class: Optional[str] = None
    default_dosage: Optional[str] = None
    dosage_form: Optional[str] = None
    renal_adjustment_flag: Optional[str] = None
    pregnancy_category: Optional[str] = None
    notes: Optional[str] = None


class MedicationResponse(MedicationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MedicationListResponse(BaseModel):
    total: int
    items: List[MedicationResponse]


# ============================================================================
# 3. Prescription Schemas
# ============================================================================

class PrescriptionCreate(BaseModel):
    patient_id: str = Field(..., description="Target patient reference ID")
    prescriber_id: str = Field(..., description="Prescribing clinician ID (e.g. 'DR-SMITH')")
    medication_name: str = Field(..., min_length=1, max_length=255, description="Prescribed medication string (e.g. 'Advil 400mg')")
    dosage: str = Field(..., min_length=1, max_length=128, description="Dosage string (e.g. '400mg')")
    dose_mg: Optional[float] = Field(None, description="Optional explicit numerical dose in mg")
    frequency: str = Field(..., min_length=1, max_length=128, description="Frequency (e.g. 'once daily', 'BID')")
    route: Optional[str] = Field("oral", max_length=64, description="Administration route")
    notes: Optional[str] = Field(None, description="Prescriber instructions or diagnosis context")


class PrescriptionUpdate(BaseModel):
    dosage: Optional[str] = Field(None, max_length=128)
    dose_mg: Optional[float] = None
    frequency: Optional[str] = Field(None, max_length=128)
    route: Optional[str] = Field(None, max_length=64)
    status: Optional[str] = Field(None, description="Status (APPROVED, FLAGGED, PENDING_REVIEW, DISCONTINUED)")
    notes: Optional[str] = None


class PrescriptionReviewRequest(BaseModel):
    action: str = Field(..., description="Action to perform: 'APPROVE', 'FLAG', 'DISCONTINUE', 'REJECT'")
    reviewer_id: str = Field(..., min_length=1, description="Clinician / Pharmacist identifier")
    review_notes: Optional[str] = Field(None, description="Clinical justification or review notes")


class SafetyAlertResponse(BaseModel):
    id: str
    patient_id: str
    prescription_id: Optional[str] = None
    rule_id: str
    category: str
    severity: str
    drugs_involved: List[str]
    reason: str
    suggested_action: Optional[str] = None
    evidence_source: Optional[str] = None
    review_status: str
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    prescriber_id: str
    medication_name: str
    generic_name: Optional[str] = None
    dosage: str
    dose_mg: Optional[float] = None
    frequency: str
    route: str
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    notes: Optional[str] = None
    safety_alerts: List[SafetyAlertResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PrescriptionListResponse(BaseModel):
    total: int
    items: List[PrescriptionResponse]


class PrescriptionCreateResponse(BaseModel):
    prescription: PrescriptionResponse
    safety_check: SafetyCheckResponse
    alerts_generated: List[SafetyAlertResponse]


# ============================================================================
# 4. Safety Alert & Audit Log Schemas
# ============================================================================

class AlertReviewRequest(BaseModel):
    action: str = Field(..., description="Review action: 'RESOLVE', 'OVERRIDE', 'UNDER_REVIEW', 'UNRESOLVED'")
    reviewer_id: str = Field(..., min_length=1, description="Clinician reviewer identifier")
    review_notes: Optional[str] = Field(None, description="Clinical justification for decision")


class SafetyAuditLogResponse(BaseModel):
    id: str
    event_type: str
    patient_id: Optional[str] = None
    prescription_id: Optional[str] = None
    safety_alert_id: Optional[str] = None
    actor_id: str
    action: str
    summary: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SafetyAuditLogListResponse(BaseModel):
    total: int
    items: List[SafetyAuditLogResponse]

