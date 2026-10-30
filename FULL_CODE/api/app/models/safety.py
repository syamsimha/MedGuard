"""Pydantic schemas for Medication Safety Engine requests and responses."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MedicationInput(BaseModel):
    """Medication entry submitted for safety verification."""
    name: str = Field(..., description="Trade or generic medication name (e.g. 'Lipitor 20mg', 'Warfarin')")
    dosage: Optional[str] = Field(None, description="Clinical dosage string (e.g. '20mg', '1,000 mg')")
    dose_mg: Optional[float] = Field(None, description="Explicit dose value in milligrams")
    frequency: Optional[str] = Field(None, description="Prescription frequency (e.g. 'once daily', 'BID')")
    route: Optional[str] = Field("oral", description="Administration route (e.g. 'oral', 'IV')")


class PatientProfileInput(BaseModel):
    """Clinical patient context used for contraindication and organ function checks."""
    patient_ref: Optional[str] = Field(None, description="Anonymized patient reference ID")
    age: Optional[int] = Field(None, description="Patient age in years")
    egfr: Optional[float] = Field(None, description="Estimated Glomerular Filtration Rate (mL/min/1.73m²)")
    crcl: Optional[float] = Field(None, description="Creatinine Clearance (mL/min)")
    conditions: List[str] = Field(default_factory=list, description="Active diagnosed conditions (e.g. ['asthma', 'CKD'])")
    allergies: List[str] = Field(default_factory=list, description="Documented drug allergies (e.g. ['penicillin'])")


class SafetyCheckOptions(BaseModel):
    """Configurable evaluation preferences."""
    min_severity: Optional[str] = Field("MINOR", description="Minimum severity level to include in findings")
    check_ddi: bool = Field(True, description="Enable drug-drug interaction detection")
    check_duplicates: bool = Field(True, description="Enable duplicate medication checks")
    check_renal: bool = Field(True, description="Enable renal dosage threshold evaluation")
    check_contraindications: bool = Field(True, description="Enable condition and allergy contraindication checks")


class SafetyCheckRequest(BaseModel):
    """Request payload for safety validation."""
    medications: List[MedicationInput] = Field(..., description="List of medications to evaluate")
    patient: Optional[PatientProfileInput] = Field(None, description="Optional patient clinical parameters")
    options: Optional[SafetyCheckOptions] = Field(default_factory=SafetyCheckOptions, description="Engine configuration")


class RuleFindingOutput(BaseModel):
    """Structured clinical finding explaining an identified risk or data gap."""
    rule_id: str
    category: str
    severity: str
    drugs_involved: List[str]
    reason: str
    evidence_source: str
    review_status: str


class SafetySummaryOutput(BaseModel):
    """Aggregated counts of safety findings by severity level."""
    total_findings: int
    contraindicated: int
    major: int
    moderate: int
    minor: int
    insufficient_data: int


class DatasetInfoOutput(BaseModel):
    """Active dataset provenance and loading status."""
    dataset_mode: str
    external_dataset_found: bool
    external_dataset_loaded: bool
    dataset_status_message: str
    active_catalog_path: str


class SafetyCheckResponse(BaseModel):
    """Comprehensive safety evaluation report."""
    is_safe: bool
    has_blocking_hazards: bool = False
    status: str
    patient_ref: Optional[str] = None
    evaluated_at: str
    engine_version: str
    disclaimer: str
    dataset_info: Optional[DatasetInfoOutput] = None
    checks_accounting: Dict[str, str] = Field(default_factory=dict)
    summary: SafetySummaryOutput
    findings: List[RuleFindingOutput]
