"""Comprehensive End-to-End Workflow Verification Suite for MedGuard.

Tests 10 full clinical workflows across SQLite database, SQLAlchemy models,
FastAPI services, and the H4 Medication Safety Engine:
1. Patient registration with explicit clinical parameters (no fabricated data)
2. Patient profile retrieval with non-fabricated attributes
3. Patient profile update and SQLite persistence
4. Medication formulary creation and search
5. Prescription submission triggering the H4 safety engine
6. Safety alert generation, linking, and severity grading
7. Clinician alert override safeguard (rationale requirement) & resolution
8. Clinician prescription review and status transition
9. Comprehensive clinical audit log generation
10. Dynamic dashboard statistics aggregation
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import (
    Patient,
    Medication,
    Prescription,
    SafetyAlert,
    SafetyAuditLog,
)
from app.models.schemas import (
    PatientCreate,
    PatientUpdate,
    MedicationCreate,
    PrescriptionCreate,
    AlertReviewRequest,
)
from app.services.patient_service import PatientService
from app.services.medication_service import MedicationService
from app.services.prescription_service import PrescriptionService
from app.services.alert_service import AlertService
from app.services.safety_service import SafetyService
from fastapi import HTTPException


@pytest.fixture(scope="function")
def test_db():
    """Creates a temporary in-memory SQLite database session with enforced foreign keys."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_workflow_1_to_10_e2e(test_db):
    db = test_db

    # =========================================================================
    # WORKFLOW 1: Patient Registration (Explicit data, no fabrication)
    # =========================================================================
    p_data = PatientCreate(
        id="PAT-E2E-001",
        name="Eleanor Rigby",
        age=68,
        gender="F",
        weight_kg=62.5,
        egfr=28.0,  # Severe renal impairment (<30 mL/min)
        crcl=26.0,
        pregnant="N",  # Explicitly recorded, not inferred
        conditions=["Hypertension", "Chronic Kidney Disease Stage 4", "Osteoarthritis"],
        allergies=["Penicillin"],
        phone="+1 555-0199",
        email=None,  # Unrecorded - should remain None
        notes="Room: Ward 3B - Bed 12. Admitted for review.",
    )
    patient = PatientService.create_patient(db, p_data, actor_id="DR-ADMISSION")
    assert patient.id == "PAT-E2E-001"
    assert patient.name == "Eleanor Rigby"
    assert patient.pregnant == "N"
    assert patient.egfr == 28.0
    assert patient.email is None

    # =========================================================================
    # WORKFLOW 2: Patient Profile Retrieval
    # =========================================================================
    retrieved = PatientService.get_patient(db, "PAT-E2E-001")
    assert retrieved is not None
    assert retrieved.get_conditions_list() == ["Hypertension", "Chronic Kidney Disease Stage 4", "Osteoarthritis"]
    assert retrieved.get_allergies_list() == ["Penicillin"]
    assert len(retrieved.prescriptions) == 0
    assert len(retrieved.safety_alerts) == 0

    # =========================================================================
    # WORKFLOW 3: Patient Profile Update
    # =========================================================================
    update_data = PatientUpdate(
        notes="Room: Ward 3B - Bed 14. Dialysis consult requested.",
        egfr=25.0,
    )
    updated_p = PatientService.update_patient(db, "PAT-E2E-001", update_data, actor_id="DR-NEPHRO")
    assert updated_p.egfr == 25.0
    assert "Bed 14" in updated_p.notes

    # =========================================================================
    # WORKFLOW 4: Medication Formulary Creation & Search
    # =========================================================================
    med_metformin = MedicationCreate(
        name="Metformin 500mg Tablet",
        generic_name="metformin",
        active_ingredients=["metformin"],
        drug_class="Biguanide Antidiabetic",
        default_dosage="500mg",
        dosage_form="Tablet",
        renal_adjustment_flag="Y",
        pregnancy_category="B",
        notes="Contraindicated in severe renal impairment (eGFR < 30).",
    )
    m1 = MedicationService.create_medication(db, med_metformin, actor_id="PHARM-ADMIN")
    assert m1.generic_name == "metformin"

    meds, total_meds = MedicationService.list_medications(db, search="Metformin")
    assert total_meds >= 1
    assert any(m.generic_name == "metformin" for m in meds)

    # =========================================================================
    # WORKFLOW 5: Prescription Submission & H4 Safety Engine Evaluation
    # =========================================================================
    # Patient has eGFR 25 (< 30) - prescribing Metformin MUST trigger a severe renal dose alert!
    rx_data = PrescriptionCreate(
        patient_id="PAT-E2E-001",
        prescriber_id="DR-CLINICAL",
        medication_name="Metformin",
        dosage="500mg",
        frequency="BID",
        route="Oral",
        notes="Glycemic management",
    )
    rx, report, alerts = PrescriptionService.create_prescription(db, rx_data)
    assert rx.id is not None
    assert rx.status in ("FLAGGED", "PENDING_REVIEW")
    assert len(alerts) >= 1

    # =========================================================================
    # WORKFLOW 6: Safety Alert Generation & Severity Verification
    # =========================================================================
    # Check that alert was saved to SQLite with correct rule and severity
    db_alerts, total_alerts = AlertService.list_alerts(db, patient_id="PAT-E2E-001")
    assert total_alerts >= 1
    renal_alert = next((a for a in db_alerts if "renal" in a.rule_id.lower() or "renal" in a.category.lower()), None)
    assert renal_alert is not None
    assert renal_alert.severity in ("CONTRAINDICATED", "MAJOR", "HIGH", "CRITICAL")
    assert renal_alert.review_status == "UNRESOLVED"

    # =========================================================================
    # WORKFLOW 7: Clinician Alert Override Safeguard (Rationale Mandatory)
    # =========================================================================
    # Attempting to override without rationale must be blocked
    with pytest.raises(HTTPException) as exc_info:
        AlertService.review_alert(
            db=db,
            alert_id=renal_alert.id,
            action="OVERRIDE",
            reviewer_id="DR-RESIDENT",
            review_notes="",  # Empty rationale must fail!
        )
    assert exc_info.value.status_code == 400
    assert "mandatory" in exc_info.value.detail.lower()

    # Valid override with clinical justification
    overridden_alert = AlertService.review_alert(
        db=db,
        alert_id=renal_alert.id,
        action="OVERRIDE",
        reviewer_id="DR-ATTENDING",
        review_notes="Short-term inpatient monitoring with daily serum creatinine. Benefit outweighs risk.",
    )
    assert overridden_alert.review_status == "OVERRIDDEN"
    assert overridden_alert.reviewed_by == "DR-ATTENDING"
    assert overridden_alert.resolved_at is not None

    # =========================================================================
    # WORKFLOW 8: Clinician Prescription Review & Status Change
    # =========================================================================
    reviewed_rx = PrescriptionService.review_prescription(
        db=db,
        prescription_id=rx.id,
        action="FLAG",
        reviewer_id="PHARM-CHIEF",
        review_notes="Flagged for nephrology consultation regarding alternative agent (DPP-4i).",
    )
    assert reviewed_rx.status == "FLAGGED"
    assert reviewed_rx.reviewed_by == "PHARM-CHIEF"

    # =========================================================================
    # WORKFLOW 9: Clinical Safety Audit Logs Verification
    # =========================================================================
    logs, total_logs = AlertService.list_audit_logs(db, patient_id="PAT-E2E-001")
    assert total_logs >= 3  # PATIENT_CREATED/UPDATED, PRESCRIPTION_EVALUATED, ALERT_OVERRIDE, PRESCRIPTION_FLAG
    events = [l.event_type for l in logs]
    assert any("ALERT" in e for e in events)
    assert any("PRESCRIPTION" in e for e in events)

    # =========================================================================
    # WORKFLOW 10: Dynamic Dashboard Statistics
    # =========================================================================
    # Count totals from the database
    total_patients = db.query(Patient).count()
    total_prescriptions = db.query(Prescription).count()
    flagged_rx = db.query(Prescription).filter(Prescription.status == "FLAGGED").count()
    pending_rx = db.query(Prescription).filter(Prescription.status == "PENDING_REVIEW").count()
    active_alerts = db.query(SafetyAlert).filter(SafetyAlert.review_status.in_(["UNRESOLVED", "UNDER_REVIEW"])).count()
    resolved_alerts = db.query(SafetyAlert).filter(SafetyAlert.review_status.in_(["RESOLVED", "OVERRIDDEN"])).count()

    assert total_patients >= 1
    assert total_prescriptions >= 1
    assert flagged_rx >= 1
    assert resolved_alerts >= 1
    print("\\nAll 10 End-to-End Workflows Passed Flawlessly!")
