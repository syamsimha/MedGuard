"""Integration tests for MedGuard SQLAlchemy database models, CRUD services, and safety engine."""
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure api and pipeline modules are importable
ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

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
    MedicationUpdate,
    PrescriptionCreate,
    PrescriptionReviewRequest,
    AlertReviewRequest,
)
from app.services.patient_service import patient_service
from app.services.medication_service import medication_service
from app.services.prescription_service import prescription_service
from app.services.alert_service import alert_service


@pytest.fixture
def db_session(tmp_path):
    """Provides a fresh isolated in-memory or temporary SQLite database session for each test."""
    test_db = tmp_path / "test_medguard.db"
    engine = create_engine(f"sqlite:///{test_db}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# =====================================================================
# 1. Patient CRUD Tests
# =====================================================================

def test_create_and_get_patient(db_session):
    """Verifies creating a patient with clinical conditions, eGFR, and retrieving it."""
    payload = PatientCreate(
        name="Jane Doe",
        age=58,
        gender="F",
        egfr=28.0,
        pregnant="N",
        conditions=["Asthma", "CKD Stage 4"],
        allergies=["penicillin"],
    )
    patient = patient_service.create_patient(db_session, payload, actor_id="DR-TEST")
    assert patient.id is not None
    assert patient.name == "Jane Doe"
    assert patient.egfr == 28.0
    assert "Asthma" in patient.get_conditions_list()
    assert "penicillin" in patient.get_allergies_list()

    # Retrieve by ID
    fetched = patient_service.get_patient(db_session, patient.id)
    assert fetched is not None
    assert fetched.id == patient.id

    # Verify audit log was recorded
    logs, count = alert_service.list_audit_logs(db_session, patient_id=patient.id)
    assert count >= 1
    assert logs[0].event_type == "PATIENT_CREATED"
    assert logs[0].actor_id == "DR-TEST"


def test_list_and_search_patients(db_session):
    """Verifies paginated listing and keyword search over patient demographics."""
    p1 = PatientCreate(name="Alice Walker", age=45, conditions=["Hypertension"])
    p2 = PatientCreate(name="Bob Smith", age=62, conditions=["Heart Failure"])
    patient_service.create_patient(db_session, p1)
    patient_service.create_patient(db_session, p2)

    # List all
    all_pats, total = patient_service.list_patients(db_session)
    assert total >= 2

    # Search by name
    res, count = patient_service.list_patients(db_session, search="Alice")
    assert count == 1
    assert res[0].name == "Alice Walker"

    # Search by condition
    res_cond, count_cond = patient_service.list_patients(db_session, search="Heart Failure")
    assert count_cond == 1
    assert res_cond[0].name == "Bob Smith"


def test_update_and_delete_patient(db_session):
    """Verifies modifying patient clinical parameters and cascading deletion."""
    patient = patient_service.create_patient(
        db_session, PatientCreate(name="Charlie Brown", egfr=75.0)
    )
    # Update eGFR and conditions
    updated = patient_service.update_patient(
        db_session,
        patient.id,
        PatientUpdate(egfr=42.0, conditions=["Peptic Ulcer"]),
        actor_id="DR-UPDATE",
    )
    assert updated.egfr == 42.0
    assert "Peptic Ulcer" in updated.get_conditions_list()

    # Delete
    del_ok = patient_service.delete_patient(db_session, patient.id, actor_id="DR-ADMIN")
    assert del_ok is True
    assert patient_service.get_patient(db_session, patient.id) is None


# =====================================================================
# 2. Medication CRUD Tests
# =====================================================================

def test_medication_crud(db_session):
    """Verifies formulary medication registration, retrieval, update, and removal."""
    med_payload = MedicationCreate(
        name="Lipitor 20mg",
        generic_name="atorvastatin",
        active_ingredients=["atorvastatin"],
        drug_class="HMG-CoA Reductase Inhibitor",
        default_dosage="20mg",
        pregnancy_category="X",
    )
    med = medication_service.create_medication(db_session, med_payload, actor_id="PHARM-01")
    assert med.id is not None
    assert med.generic_name == "atorvastatin"
    assert med.pregnancy_category == "X"

    # Search
    meds, total = medication_service.list_medications(db_session, search="Lipitor")
    assert total >= 1
    assert meds[0].name == "Lipitor 20mg"

    # Update
    updated = medication_service.update_medication(
        db_session, med.id, MedicationUpdate(notes="Monitor LFTs regularly")
    )
    assert updated.notes == "Monitor LFTs regularly"

    # Delete
    del_ok = medication_service.delete_medication(db_session, med.id)
    assert del_ok is True
    assert medication_service.get_medication(db_session, med.id) is None


# =====================================================================
# 3. Prescription & Safety Engine Integration Tests
# =====================================================================

def test_safe_prescription_creation_approved(db_session):
    """Verifies that an unproblematic prescription is evaluated and marked APPROVED."""
    patient = patient_service.create_patient(
        db_session,
        PatientCreate(name="Healthy Patient", egfr=95.0, conditions=["Mild Headaches"]),
    )
    rx_payload = PrescriptionCreate(
        patient_id=patient.id,
        prescriber_id="DR-GENERAL",
        medication_name="Paracetamol 500mg",
        dosage="500mg",
        frequency="PRN",
    )
    rx, report, alerts = prescription_service.create_prescription(db_session, rx_payload)

    assert rx.id is not None
    assert rx.status == "APPROVED"
    assert rx.generic_name == "paracetamol"
    assert report["is_safe"] is True

    # Audit log entry created
    logs, _ = alert_service.list_audit_logs(db_session, prescription_id=rx.id)
    assert len(logs) >= 1
    assert logs[0].event_type == "PRESCRIPTION_EVALUATED"


def test_ddi_interaction_triggers_flagged_prescription_and_alerts(db_session):
    """Verifies drug-drug interaction detection (Warfarin + Aspirin) stores safety alert and flags Rx."""
    patient = patient_service.create_patient(
        db_session, PatientCreate(name="Cardiac Patient", egfr=80.0)
    )

    # 1. Existing prescription: Warfarin
    rx1_payload = PrescriptionCreate(
        patient_id=patient.id,
        prescriber_id="DR-CARDIOLOGY",
        medication_name="Warfarin 5mg",
        dosage="5mg",
        frequency="once daily",
    )
    rx1, _, _ = prescription_service.create_prescription(db_session, rx1_payload)
    assert rx1.status == "APPROVED"

    # 2. Add conflicting prescription: Aspirin
    rx2_payload = PrescriptionCreate(
        patient_id=patient.id,
        prescriber_id="DR-ORTHO",
        medication_name="Aspirin 81mg",
        dosage="81mg",
        frequency="once daily",
    )
    rx2, report, alerts = prescription_service.create_prescription(db_session, rx2_payload)

    # Must be FLAGGED due to major bleeding risk DDI
    assert rx2.status == "FLAGGED"
    assert report["has_blocking_hazards"] is True
    assert len(alerts) >= 1

    # Verify SafetyAlert persisted in database
    db_alerts, total_alerts = alert_service.list_alerts(db_session, patient_id=patient.id)
    assert total_alerts >= 1
    ddi_alert = next((a for a in db_alerts if a.category == "DRUG_DRUG_INTERACTION"), None)
    assert ddi_alert is not None
    assert ddi_alert.severity in ("MAJOR", "CONTRAINDICATED")
    assert ddi_alert.review_status == "UNRESOLVED"
    assert "bleeding" in ddi_alert.reason.lower() or "hemorrhage" in ddi_alert.reason.lower()


def test_renal_contraindication_generates_alert_and_flags_prescription(db_session):
    """Verifies Metformin prescribed to patient with severe renal impairment (eGFR 22) is flagged."""
    patient = patient_service.create_patient(
        db_session,
        PatientCreate(name="CKD Patient", egfr=22.0, conditions=["Type 2 Diabetes"]),
    )

    rx_payload = PrescriptionCreate(
        patient_id=patient.id,
        prescriber_id="DR-ENDO",
        medication_name="Glucophage 500mg",
        dosage="500mg",
        frequency="BID",
    )
    rx, report, alerts = prescription_service.create_prescription(db_session, rx_payload)

    assert rx.status == "FLAGGED"
    assert any(a.category == "RENAL_SAFETY" for a in alerts)
    renal_alert = next(a for a in alerts if a.category == "RENAL_SAFETY")
    assert renal_alert.severity in ("MAJOR", "CONTRAINDICATED")
    assert "lactic acidosis" in renal_alert.reason.lower()


def test_condition_contraindication_nsaid_peptic_ulcer(db_session):
    """Verifies Advil prescribed to patient with active Peptic Ulcer Disease is flagged."""
    patient = patient_service.create_patient(
        db_session,
        PatientCreate(name="GI Patient", egfr=90.0, conditions=["Peptic Ulcer Disease"]),
    )

    rx_payload = PrescriptionCreate(
        patient_id=patient.id,
        prescriber_id="DR-PAIN",
        medication_name="Advil 400mg",
        dosage="400mg",
        frequency="TID",
    )
    rx, report, alerts = prescription_service.create_prescription(db_session, rx_payload)

    assert rx.status == "FLAGGED"
    ci_alert = next((a for a in alerts if a.category == "CONTRAINDICATION"), None)
    assert ci_alert is not None
    assert ci_alert.severity in ("MAJOR", "CONTRAINDICATED")


# =====================================================================
# 4. Clinical Review Actions & Audit Trail Tests
# =====================================================================

def test_clinician_prescription_review_and_audit_trail(db_session):
    """Verifies a clinician can override/approve a flagged prescription with recorded rationale."""
    patient = patient_service.create_patient(
        db_session, PatientCreate(name="Review Test Patient", egfr=85.0)
    )
    # Create flagged prescription
    rx1, _, _ = prescription_service.create_prescription(
        db_session,
        PrescriptionCreate(patient_id=patient.id, prescriber_id="DR-1", medication_name="Warfarin 5mg", dosage="5mg", frequency="OD"),
    )
    rx2, _, _ = prescription_service.create_prescription(
        db_session,
        PrescriptionCreate(patient_id=patient.id, prescriber_id="DR-2", medication_name="Aspirin 81mg", dosage="81mg", frequency="OD"),
    )
    assert rx2.status == "FLAGGED"

    # Clinician reviews and approves with clinical justification note
    reviewed_rx = prescription_service.review_prescription(
        db_session,
        prescription_id=rx2.id,
        action="APPROVE",
        reviewer_id="DR-HEAD-CARDIOLOGIST",
        review_notes="Dual antiplatelet/anticoagulant therapy indicated post-PCI stent under weekly INR monitoring.",
    )
    assert reviewed_rx.status == "APPROVED"
    assert reviewed_rx.reviewed_by == "DR-HEAD-CARDIOLOGIST"
    assert "weekly INR" in reviewed_rx.review_notes

    # Check audit log entry
    logs, count = alert_service.list_audit_logs(
        db_session, prescription_id=rx2.id, actor_id="DR-HEAD-CARDIOLOGIST"
    )
    assert count >= 1
    assert logs[0].action == "APPROVE"
    assert "Dual antiplatelet" in logs[0].details


def test_safety_alert_override_and_resolution(db_session):
    """Verifies clinician can mark safety findings as OVERRIDDEN or RESOLVED with audit logging."""
    patient = patient_service.create_patient(
        db_session, PatientCreate(name="Alert Patient", egfr=25.0)
    )
    rx, _, alerts = prescription_service.create_prescription(
        db_session,
        PrescriptionCreate(patient_id=patient.id, prescriber_id="DR-1", medication_name="Metformin 500mg", dosage="500mg", frequency="BID"),
    )
    assert len(alerts) >= 1
    target_alert = alerts[0]
    assert target_alert.review_status == "UNRESOLVED"

    # Clinician overrides alert
    updated_alert = alert_service.review_alert(
        db_session,
        alert_id=target_alert.id,
        action="OVERRIDE",
        reviewer_id="DR-NEPHROLOGIST",
        review_notes="Temporary trial with close lactate and renal monitoring.",
    )
    assert updated_alert.review_status == "OVERRIDDEN"
    assert updated_alert.reviewed_by == "DR-NEPHROLOGIST"
    assert updated_alert.resolved_at is not None

    # Verify audit trail
    logs, _ = alert_service.list_audit_logs(db_session, safety_alert_id=target_alert.id)
    assert len(logs) >= 1
    assert logs[0].action == "OVERRIDE"
    assert logs[0].actor_id == "DR-NEPHROLOGIST"


# =====================================================================
# 5. Validation & Exception Handling Tests
# =====================================================================

def test_prescription_for_nonexistent_patient_raises_404(db_session):
    """Verifies submitting a prescription for a missing patient ID raises HTTPException 404."""
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        prescription_service.create_prescription(
            db_session,
            PrescriptionCreate(
                patient_id="NON-EXISTENT-PATIENT-ID",
                prescriber_id="DR-1",
                medication_name="Lipitor 20mg",
                dosage="20mg",
                frequency="daily",
            ),
        )
    assert exc_info.value.status_code == 404


def test_invalid_review_action_raises_400(db_session):
    """Verifies invalid review actions are rejected with status 400."""
    from fastapi import HTTPException
    patient = patient_service.create_patient(db_session, PatientCreate(name="Test Patient"))
    rx, _, _ = prescription_service.create_prescription(
        db_session,
        PrescriptionCreate(patient_id=patient.id, prescriber_id="DR-1", medication_name="Aspirin 81mg", dosage="81mg", frequency="daily"),
    )
    with pytest.raises(HTTPException) as exc_info:
        prescription_service.review_prescription(
            db_session, prescription_id=rx.id, action="INVALID_ACTION_XYZ", reviewer_id="DR-1"
        )
    assert exc_info.value.status_code == 400
