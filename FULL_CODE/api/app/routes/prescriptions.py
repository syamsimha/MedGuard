"""Prescription creation, retrieval, and clinical review API endpoints."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Prescription, SafetyAlert
from app.models.schemas import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionReviewRequest,
    PrescriptionResponse,
    PrescriptionListResponse,
    PrescriptionCreateResponse,
    SafetyAlertResponse,
)
from app.models.safety import SafetyCheckResponse
from app.services.prescription_service import prescription_service


router = APIRouter(prefix="", tags=["Prescriptions"])


def _to_alert_response(a: SafetyAlert) -> SafetyAlertResponse:
    return SafetyAlertResponse(
        id=a.id,
        patient_id=a.patient_id,
        prescription_id=a.prescription_id,
        rule_id=a.rule_id,
        category=a.category,
        severity=a.severity,
        drugs_involved=a.get_drugs_list(),
        reason=a.reason,
        suggested_action=a.suggested_action,
        evidence_source=a.evidence_source,
        review_status=a.review_status,
        reviewed_by=a.reviewed_by,
        review_notes=a.review_notes,
        created_at=a.created_at,
        resolved_at=a.resolved_at,
    )


def _to_prescription_response(rx: Prescription) -> PrescriptionResponse:
    return PrescriptionResponse(
        id=rx.id,
        patient_id=rx.patient_id,
        prescriber_id=rx.prescriber_id,
        medication_name=rx.medication_name,
        generic_name=rx.generic_name,
        dosage=rx.dosage,
        dose_mg=rx.dose_mg,
        frequency=rx.frequency,
        route=rx.route,
        status=rx.status,
        submitted_at=rx.submitted_at,
        reviewed_at=rx.reviewed_at,
        reviewed_by=rx.reviewed_by,
        review_notes=rx.review_notes,
        notes=rx.notes,
        safety_alerts=[_to_alert_response(al) for al in rx.safety_alerts],
    )


@router.post(
    "/prescriptions",
    response_model=PrescriptionCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit prescription with automated safety engine evaluation",
    description=(
        "Persists a prescription, automatically runs clinical second-look safety evaluation "
        "across the patient's active regimen, flags severe hazards, and writes to safety alerts "
        "and audit logs."
    ),
)
def create_prescription(
    payload: PrescriptionCreate,
    auto_evaluate: bool = Query(True, description="Automatically trigger clinical safety evaluation"),
    db: Session = Depends(get_db),
) -> PrescriptionCreateResponse:
    prescription, report, alerts = prescription_service.create_prescription(
        db, payload, auto_evaluate=auto_evaluate
    )
    return PrescriptionCreateResponse(
        prescription=_to_prescription_response(prescription),
        safety_check=SafetyCheckResponse(**report) if report else SafetyCheckResponse(
            is_safe=True,
            status="SKIPPED",
            evaluated_at=prescription.submitted_at.isoformat(),
            engine_version="1.3.0",
            disclaimer="Evaluation skipped per request parameter.",
            summary={
                "total_findings": 0,
                "contraindicated": 0,
                "major": 0,
                "moderate": 0,
                "minor": 0,
                "insufficient_data": 0,
            },
            findings=[],
        ),
        alerts_generated=[_to_alert_response(a) for a in alerts],
    )


@router.get(
    "/prescriptions",
    response_model=PrescriptionListResponse,
    summary="List prescriptions",
    description="Returns prescriptions filtered by patient ID or review status.",
)
def list_prescriptions(
    patient_id: Optional[str] = Query(None, description="Filter by patient reference ID"),
    status: Optional[str] = Query(None, description="Filter by status ('PENDING_REVIEW', 'APPROVED', 'FLAGGED', 'DISCONTINUED')"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> PrescriptionListResponse:
    items, total = prescription_service.list_prescriptions(
        db, patient_id=patient_id, status=status, skip=skip, limit=limit
    )
    return PrescriptionListResponse(
        total=total,
        items=[_to_prescription_response(rx) for rx in items],
    )


@router.get(
    "/prescriptions/{prescription_id}",
    response_model=PrescriptionResponse,
    summary="Get prescription details",
    description="Retrieves prescription details and all linked safety alerts.",
)
def get_prescription(prescription_id: str, db: Session = Depends(get_db)) -> PrescriptionResponse:
    rx = prescription_service.get_prescription(db, prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail=f"Prescription '{prescription_id}' not found.")
    return _to_prescription_response(rx)


@router.post(
    "/prescriptions/{prescription_id}/review",
    response_model=PrescriptionResponse,
    summary="Record clinical review decision",
    description="Updates prescription status (APPROVE, FLAG, DISCONTINUE, REJECT) and logs decision in audit trail.",
)
def review_prescription(
    prescription_id: str,
    payload: PrescriptionReviewRequest,
    db: Session = Depends(get_db),
) -> PrescriptionResponse:
    rx = prescription_service.review_prescription(
        db,
        prescription_id=prescription_id,
        action=payload.action,
        reviewer_id=payload.reviewer_id,
        review_notes=payload.review_notes,
    )
    return _to_prescription_response(rx)


@router.post(
    "/prescriptions/{prescription_id}/evaluate",
    summary="Re-evaluate prescription safety",
    description="Executes safety engine check on this prescription within the patient's current regimen.",
)
def reevaluate_prescription(
    prescription_id: str,
    actor_id: str = Query("SYSTEM", description="Acting user identifier"),
    db: Session = Depends(get_db),
):
    rx = prescription_service.get_prescription(db, prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail=f"Prescription '{prescription_id}' not found.")
    return prescription_service.evaluate_patient_regimen(db, patient_id=rx.patient_id, actor_id=actor_id)

