"""Patient clinical demographic and profile API endpoints."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Patient
from app.models.schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
    PrescriptionResponse,
    SafetyAlertResponse,
)
from app.services.patient_service import patient_service
from app.services.prescription_service import prescription_service
from app.services.alert_service import alert_service


router = APIRouter(prefix="", tags=["Patients"])


def _to_patient_response(p: Patient) -> PatientResponse:
    active_rx = [rx for rx in p.prescriptions if rx.status in ("APPROVED", "PENDING_REVIEW", "FLAGGED")]
    active_al = [al for al in p.safety_alerts if al.review_status == "UNRESOLVED"]
    return PatientResponse(
        id=p.id,
        name=p.name,
        age=p.age,
        gender=p.gender,
        weight_kg=p.weight_kg,
        egfr=p.egfr,
        crcl=p.crcl,
        pregnant=p.pregnant,
        conditions=p.get_conditions_list(),
        allergies=p.get_allergies_list(),
        phone=p.phone,
        email=p.email,
        notes=p.notes,
        created_at=p.created_at,
        updated_at=p.updated_at,
        active_prescriptions_count=len(active_rx),
        active_alerts_count=len(active_al),
    )


@router.post(
    "/patients",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new patient record",
    description="Registers a patient clinical demographic profile including renal function and conditions.",
)
def create_patient(
    payload: PatientCreate,
    actor_id: str = Query("SYSTEM", description="Acting clinician or system identifier"),
    db: Session = Depends(get_db),
) -> PatientResponse:
    patient = patient_service.create_patient(db, payload, actor_id=actor_id)
    return _to_patient_response(patient)


@router.get(
    "/patients",
    response_model=PatientListResponse,
    summary="List patients",
    description="Returns a paginated directory of registered patients with optional search matching.",
)
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search term matching patient name, ID, or condition"),
    db: Session = Depends(get_db),
) -> PatientListResponse:
    items, total = patient_service.list_patients(db, skip=skip, limit=limit, search=search)
    return PatientListResponse(
        total=total,
        items=[_to_patient_response(p) for p in items],
    )


@router.get(
    "/patients/{patient_id}",
    response_model=PatientResponse,
    summary="Get patient details",
    description="Retrieves a patient's clinical profile by ID.",
)
def get_patient(patient_id: str, db: Session = Depends(get_db)) -> PatientResponse:
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return _to_patient_response(patient)


@router.put(
    "/patients/{patient_id}",
    response_model=PatientResponse,
    summary="Update patient profile",
    description="Updates clinical demographic details, conditions, or renal function markers.",
)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    actor_id: str = Query("SYSTEM", description="Acting clinician identifier"),
    db: Session = Depends(get_db),
) -> PatientResponse:
    patient = patient_service.update_patient(db, patient_id, payload, actor_id=actor_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return _to_patient_response(patient)


@router.delete(
    "/patients/{patient_id}",
    summary="Delete patient",
    description="Removes patient record and cascades associated prescriptions.",
)
def delete_patient(
    patient_id: str,
    actor_id: str = Query("SYSTEM", description="Acting clinician identifier"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    success = patient_service.delete_patient(db, patient_id, actor_id=actor_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    return {"status": "success", "message": f"Patient '{patient_id}' successfully removed."}


@router.get(
    "/patients/{patient_id}/prescriptions",
    response_model=List[Dict[str, Any]],
    summary="List prescriptions for patient",
    description="Retrieves all prescriptions associated with the specified patient.",
)
def get_patient_prescriptions(
    patient_id: str,
    db: Session = Depends(get_db),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    rx_items, _ = prescription_service.list_prescriptions(db, patient_id=patient_id, limit=200)
    return [
        {
            "id": rx.id,
            "patient_id": rx.patient_id,
            "prescriber_id": rx.prescriber_id,
            "medication_name": rx.medication_name,
            "generic_name": rx.generic_name,
            "dosage": rx.dosage,
            "dose_mg": rx.dose_mg,
            "frequency": rx.frequency,
            "route": rx.route,
            "status": rx.status,
            "submitted_at": rx.submitted_at.isoformat() if rx.submitted_at else None,
            "reviewed_at": rx.reviewed_at.isoformat() if rx.reviewed_at else None,
            "reviewed_by": rx.reviewed_by,
            "notes": rx.notes,
            "alerts_count": len(rx.safety_alerts),
        }
        for rx in rx_items
    ]


@router.get(
    "/patients/{patient_id}/alerts",
    response_model=List[Dict[str, Any]],
    summary="List safety alerts for patient",
    description="Retrieves all safety alerts associated with the specified patient.",
)
def get_patient_alerts(
    patient_id: str,
    db: Session = Depends(get_db),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")
    alerts, _ = alert_service.list_alerts(db, patient_id=patient_id, limit=200)
    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "prescription_id": a.prescription_id,
            "rule_id": a.rule_id,
            "category": a.category,
            "severity": a.severity,
            "drugs_involved": a.get_drugs_list(),
            "reason": a.reason,
            "suggested_action": a.suggested_action,
            "evidence_source": a.evidence_source,
            "review_status": a.review_status,
            "reviewed_by": a.reviewed_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        }
        for a in alerts
    ]


@router.post(
    "/patients/{patient_id}/evaluate",
    summary="Evaluate patient medication regimen on demand",
    description="Cross-examines all current active prescriptions for this patient and returns an updated clinical safety report.",
)
def evaluate_patient_regimen(
    patient_id: str,
    actor_id: str = Query("SYSTEM", description="Requesting clinician identifier"),
    db: Session = Depends(get_db),
):
    return prescription_service.evaluate_patient_regimen(db, patient_id=patient_id, actor_id=actor_id)

