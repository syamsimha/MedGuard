"""Safety alert review and clinical audit log service."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException

from app.models.db_models import SafetyAlert, SafetyAuditLog


class AlertService:
    """Service layer managing safety findings and audit trails."""

    @staticmethod
    def list_alerts(
        db: Session,
        patient_id: Optional[str] = None,
        severity: Optional[str] = None,
        review_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[SafetyAlert], int]:
        """Lists safety alerts with optional patient, severity, and review status filters."""
        query = db.query(SafetyAlert)
        if patient_id:
            query = query.filter(SafetyAlert.patient_id == patient_id)
        if severity:
            query = query.filter(SafetyAlert.severity.ilike(severity.strip()))
        if review_status:
            query = query.filter(SafetyAlert.review_status.ilike(review_status.strip()))

        total = query.count()
        items = query.order_by(desc(SafetyAlert.created_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_alert(db: Session, alert_id: str) -> Optional[SafetyAlert]:
        """Retrieves a safety alert by ID."""
        return db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()

    @staticmethod
    def review_alert(
        db: Session,
        alert_id: str,
        action: str,
        reviewer_id: str,
        review_notes: Optional[str] = None,
    ) -> SafetyAlert:
        """Applies a clinical review decision (e.g. override, resolve) to a safety alert."""
        alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Safety alert '{alert_id}' not found.")

        old_status = alert.review_status
        action_upper = action.strip().upper()

        status_mapping = {
            "RESOLVE": "RESOLVED",
            "OVERRIDE": "OVERRIDDEN",
            "UNDER_REVIEW": "UNDER_REVIEW",
            "UNRESOLVED": "UNRESOLVED",
        }
        if action_upper not in status_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid review action '{action}'. Allowed: {list(status_mapping.keys())}"
            )

        # Security & Clinical Safeguard: Overriding an alert mandates clinical rationale
        if action_upper == "OVERRIDE" and (not review_notes or not review_notes.strip()):
            raise HTTPException(
                status_code=400,
                detail="A non-empty clinical justification is mandatory when overriding a medication safety alert."
            )

        new_status = status_mapping[action_upper]
        alert.review_status = new_status
        alert.reviewed_by = reviewer_id.strip()
        alert.review_notes = review_notes.strip() if review_notes else None

        now = datetime.now(timezone.utc)
        if new_status in ("RESOLVED", "OVERRIDDEN"):
            alert.resolved_at = now
        else:
            alert.resolved_at = None

        # Record clinical audit log
        audit = SafetyAuditLog(
            event_type=f"ALERT_{action_upper}",
            patient_id=alert.patient_id,
            prescription_id=alert.prescription_id,
            safety_alert_id=alert.id,
            actor_id=reviewer_id.strip(),
            action=action_upper,
            summary=(
                f"Alert '{alert.id}' ({alert.rule_id} - {alert.severity}) "
                f"marked as {new_status} by clinician '{reviewer_id}'."
            ),
            details=json.dumps({
                "previous_status": old_status,
                "new_status": new_status,
                "notes": review_notes,
                "rule_id": alert.rule_id,
                "severity": alert.severity,
            }),
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def list_audit_logs(
        db: Session,
        patient_id: Optional[str] = None,
        prescription_id: Optional[str] = None,
        safety_alert_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        event_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[SafetyAuditLog], int]:
        """Queries the immutable clinical safety audit trail."""
        query = db.query(SafetyAuditLog)
        if patient_id:
            query = query.filter(SafetyAuditLog.patient_id == patient_id)
        if prescription_id:
            query = query.filter(SafetyAuditLog.prescription_id == prescription_id)
        if safety_alert_id:
            query = query.filter(SafetyAuditLog.safety_alert_id == safety_alert_id)
        if actor_id:
            query = query.filter(SafetyAuditLog.actor_id == actor_id)
        if event_type:
            query = query.filter(SafetyAuditLog.event_type.ilike(event_type.strip()))

        total = query.count()
        logs = query.order_by(desc(SafetyAuditLog.created_at)).offset(skip).limit(limit).all()
        return logs, total


alert_service = AlertService()
