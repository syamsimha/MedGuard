"""Safety Engine API routes: checks, rules, alert reviews, and audit logs."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.safety import SafetyCheckRequest, SafetyCheckResponse
from app.models.db_models import SafetyAlert, SafetyAuditLog
from app.models.schemas import (
    SafetyAlertResponse,
    AlertReviewRequest,
    SafetyAuditLogResponse,
    SafetyAuditLogListResponse,
)
from app.services.safety_service import safety_service
from app.services.alert_service import alert_service

router = APIRouter(prefix="", tags=["Safety Engine"])


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


def _to_audit_response(log: SafetyAuditLog) -> SafetyAuditLogResponse:
    return SafetyAuditLogResponse(
        id=log.id,
        event_type=log.event_type,
        patient_id=log.patient_id,
        prescription_id=log.prescription_id,
        safety_alert_id=log.safety_alert_id,
        actor_id=log.actor_id,
        action=log.action,
        summary=log.summary,
        details=log.get_details_dict(),
        created_at=log.created_at,
    )


@router.post(
    "/safety/check",
    response_model=SafetyCheckResponse,
    summary="Validate medication regimen safety",
    description="Cross-examines medications for drug interactions, duplicates, renal dosing safety, and contraindications."
)
def check_medication_safety(payload: SafetyCheckRequest) -> SafetyCheckResponse:
    """Executes clinical second-look safety evaluation on prescribed medications."""
    if not payload.medications:
        raise HTTPException(status_code=400, detail="At least one medication is required for evaluation.")

    meds_data = [med.model_dump() for med in payload.medications]
    patient_data = payload.patient.model_dump() if payload.patient else {}
    options_data = payload.options.model_dump() if payload.options else {}

    result = safety_service.check_safety(
        medications=meds_data,
        patient=patient_data,
        options=options_data
    )
    return SafetyCheckResponse(**result)


@router.get(
    "/safety/rules",
    summary="List active clinical safety knowledgebase rules",
    description="Returns registry statistics and authoritative medical sources."
)
def get_safety_rules_summary():
    """Returns indexed clinical knowledge base rule counts and verified sources."""
    return safety_service.get_registered_rules()


@router.get(
    "/safety/alerts",
    response_model=List[SafetyAlertResponse],
    summary="List safety alerts",
    description="Queries stored clinical safety findings with optional patient, severity, and review status filters.",
)
def list_safety_alerts(
    patient_id: Optional[str] = Query(None, description="Filter alerts by patient reference ID"),
    severity: Optional[str] = Query(None, description="Filter by severity ('CONTRAINDICATED', 'MAJOR', 'MODERATE', 'MINOR')"),
    review_status: Optional[str] = Query(None, description="Filter by review status ('UNRESOLVED', 'UNDER_REVIEW', 'RESOLVED', 'OVERRIDDEN')"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> List[SafetyAlertResponse]:
    items, _ = alert_service.list_alerts(
        db, patient_id=patient_id, severity=severity, review_status=review_status, skip=skip, limit=limit
    )
    return [_to_alert_response(a) for a in items]


@router.get(
    "/safety/alerts/{alert_id}",
    response_model=SafetyAlertResponse,
    summary="Get safety alert details",
    description="Retrieves a specific safety finding and its review history.",
)
def get_safety_alert(alert_id: str, db: Session = Depends(get_db)) -> SafetyAlertResponse:
    alert = alert_service.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Safety alert '{alert_id}' not found.")
    return _to_alert_response(alert)


@router.post(
    "/safety/alerts/{alert_id}/review",
    response_model=SafetyAlertResponse,
    summary="Record clinical review decision on a safety alert",
    description="Applies a clinician override, resolution, or review status, persisting notes in the safety audit log.",
)
def review_safety_alert(
    alert_id: str,
    payload: AlertReviewRequest,
    db: Session = Depends(get_db),
) -> SafetyAlertResponse:
    alert = alert_service.review_alert(
        db,
        alert_id=alert_id,
        action=payload.action,
        reviewer_id=payload.reviewer_id,
        review_notes=payload.review_notes,
    )
    return _to_alert_response(alert)


@router.get(
    "/safety/audit-logs",
    response_model=SafetyAuditLogListResponse,
    summary="Query clinical safety audit trail",
    description="Retrieves immutable audit logs of clinical evaluations, overrides, and prescription reviews.",
)
def list_safety_audit_logs(
    patient_id: Optional[str] = Query(None, description="Filter logs by patient ID"),
    prescription_id: Optional[str] = Query(None, description="Filter logs by prescription ID"),
    safety_alert_id: Optional[str] = Query(None, description="Filter logs by safety alert ID"),
    actor_id: Optional[str] = Query(None, description="Filter logs by clinician / actor ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> SafetyAuditLogListResponse:
    logs, total = alert_service.list_audit_logs(
        db,
        patient_id=patient_id,
        prescription_id=prescription_id,
        safety_alert_id=safety_alert_id,
        actor_id=actor_id,
        event_type=event_type,
        skip=skip,
        limit=limit,
    )
    return SafetyAuditLogListResponse(
        total=total,
        items=[_to_audit_response(log) for log in logs],
    )
