"""Prescription service integrating the Medication Safety Engine with database records."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException

from app.models.db_models import Patient, Prescription, SafetyAlert, SafetyAuditLog
from app.models.schemas import PrescriptionCreate, PrescriptionUpdate
from app.services.safety_service import safety_service
from pipeline.rules import SeverityLevel


class PrescriptionService:
    """Service layer managing prescriptions and automated safety cross-examination."""

    @staticmethod
    def create_prescription(
        db: Session,
        data: PrescriptionCreate,
        auto_evaluate: bool = True,
    ) -> Tuple[Prescription, Dict[str, Any], List[SafetyAlert]]:
        """Creates a prescription, executes safety engine evaluation, and persists findings and audit logs."""
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient '{data.patient_id}' not found.")

        # Normalize drug entity
        norm = safety_service.engine.normalizer.normalize(
            data.medication_name,
            dose_override_mg=data.dose_mg,
        )
        calculated_dose_mg = data.dose_mg if data.dose_mg is not None else norm.dose_mg

        # 1. Create prescription record
        prescription = Prescription(
            patient_id=patient.id,
            prescriber_id=data.prescriber_id.strip(),
            medication_name=data.medication_name.strip(),
            generic_name=norm.generic_name,
            dosage=data.dosage.strip(),
            dose_mg=calculated_dose_mg,
            frequency=data.frequency.strip(),
            route=data.route.strip() if data.route else "oral",
            status="PENDING_REVIEW",
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(prescription)
        db.flush()

        evaluation_report: Dict[str, Any] = {}
        generated_alerts: List[SafetyAlert] = []

        # 2. Automated Safety Engine Evaluation across Patient Regimen
        if auto_evaluate:
            # Aggregate active regimen (including the newly added prescription)
            active_rx_query = db.query(Prescription).filter(
                Prescription.patient_id == patient.id,
                Prescription.status.in_(["APPROVED", "PENDING_REVIEW", "FLAGGED"]),
            )
            active_rx_list = active_rx_query.all()

            med_inputs = []
            for rx in active_rx_list:
                med_inputs.append({
                    "name": rx.medication_name,
                    "dosage": rx.dosage,
                    "dose_mg": rx.dose_mg,
                })

            patient_profile = {
                "patient_ref": patient.id,
                "age": patient.age,
                "egfr": patient.egfr,
                "crcl": patient.crcl,
                "conditions": patient.get_conditions_list(),
                "allergies": patient.get_allergies_list(),
                "pregnant": patient.pregnant,
            }

            evaluation_report = safety_service.engine.evaluate(
                medications=med_inputs,
                patient_profile=patient_profile,
            )

            # Persist safety findings as SafetyAlert records
            has_blocking = evaluation_report.get("has_blocking_hazards", False)
            findings = evaluation_report.get("findings", [])

            for f in findings:
                # Support both dict and dataclass finding objects
                if isinstance(f, dict):
                    sev_val = str(f.get("severity", "MAJOR"))
                    cat_val = str(f.get("category", "DRUG_DRUG_INTERACTION"))
                    rule_id = str(f.get("rule_id", "SAFETY-001"))
                    drugs_inv = f.get("drugs_involved", [])
                    reason = str(f.get("reason", ""))
                    suggested_action = f.get("suggested_action")
                    evidence_source = f.get("evidence_source")
                    review_status = str(f.get("review_status", "UNRESOLVED"))
                else:
                    sev_val = f.severity.value if hasattr(f.severity, "value") else str(f.severity)
                    cat_val = f.category.value if hasattr(f.category, "value") else str(f.category)
                    rule_id = f.rule_id
                    drugs_inv = f.drugs_involved
                    reason = f.reason
                    suggested_action = getattr(f, "suggested_action", None)
                    evidence_source = getattr(f, "evidence_source", None)
                    review_status = f.review_status.value if hasattr(f.review_status, "value") else str(f.review_status)

                # Link alert to the newly submitted prescription if it involves this drug
                involved_drugs = [str(d).lower() for d in drugs_inv]
                this_drug_clean = (norm.generic_name or norm.clean_name or data.medication_name).lower()
                is_related_to_this_rx = (
                    any(d in this_drug_clean or this_drug_clean in d for d in involved_drugs)
                    or len(active_rx_list) == 1
                )

                alert = SafetyAlert(
                    patient_id=patient.id,
                    prescription_id=prescription.id if is_related_to_this_rx else None,
                    rule_id=rule_id,
                    category=cat_val,
                    severity=sev_val,
                    drugs_involved=json.dumps(drugs_inv),
                    reason=reason,
                    suggested_action=suggested_action,
                    evidence_source=evidence_source,
                    review_status="UNRESOLVED",
                )
                db.add(alert)
                generated_alerts.append(alert)

            # Assign qualified status to prescription based on safety findings
            if has_blocking:
                prescription.status = "FLAGGED"
            elif any(
                (f.get("severity") in ("MODERATE", "MINOR") if isinstance(f, dict) else f.severity in (SeverityLevel.MODERATE, SeverityLevel.MINOR))
                for f in findings
            ):
                prescription.status = "PENDING_REVIEW"
            else:
                prescription.status = "APPROVED"

            # 3. Create Safety Audit Log
            audit = SafetyAuditLog(
                event_type="PRESCRIPTION_EVALUATED",
                patient_id=patient.id,
                prescription_id=prescription.id,
                actor_id=data.prescriber_id,
                action="EVALUATE",
                summary=(
                    f"Prescription '{prescription.medication_name}' evaluated. "
                    f"Status: {prescription.status}. Identified {len(findings)} safety findings."
                ),
                details=json.dumps({
                    "is_safe": evaluation_report.get("is_safe"),
                    "status": evaluation_report.get("status"),
                    "total_findings": len(findings),
                    "blocking_hazards": has_blocking,
                }),
            )
            db.add(audit)

        db.commit()
        db.refresh(prescription)
        for a in generated_alerts:
            db.refresh(a)

        return prescription, evaluation_report, generated_alerts

    @staticmethod
    def get_prescription(db: Session, prescription_id: str) -> Optional[Prescription]:
        """Retrieves prescription by ID including linked alerts."""
        return db.query(Prescription).filter(Prescription.id == prescription_id).first()

    @staticmethod
    def list_prescriptions(
        db: Session,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Prescription], int]:
        """Lists prescriptions with optional filtering by patient and status."""
        query = db.query(Prescription)
        if patient_id:
            query = query.filter(Prescription.patient_id == patient_id)
        if status:
            query = query.filter(Prescription.status.ilike(status.strip()))
        total = query.count()
        items = query.order_by(desc(Prescription.submitted_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def review_prescription(
        db: Session,
        prescription_id: str,
        action: str,
        reviewer_id: str,
        review_notes: Optional[str] = None,
    ) -> Prescription:
        """Applies a clinical review decision and records audit log."""
        prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
        if not prescription:
            raise HTTPException(status_code=404, detail=f"Prescription '{prescription_id}' not found.")

        old_status = prescription.status
        action_upper = action.strip().upper()

        status_mapping = {
            "APPROVE": "APPROVED",
            "FLAG": "FLAGGED",
            "DISCONTINUE": "DISCONTINUED",
            "REJECT": "REJECTED",
        }
        if action_upper not in status_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid review action '{action}'. Allowed: {list(status_mapping.keys())}"
            )

        new_status = status_mapping[action_upper]
        prescription.status = new_status
        prescription.reviewed_at = datetime.now(timezone.utc)
        prescription.reviewed_by = reviewer_id.strip()
        prescription.review_notes = review_notes.strip() if review_notes else None

        # Record audit log
        audit = SafetyAuditLog(
            event_type=f"PRESCRIPTION_{action_upper}",
            patient_id=prescription.patient_id,
            prescription_id=prescription.id,
            actor_id=reviewer_id.strip(),
            action=action_upper,
            summary=(
                f"Prescription '{prescription.id}' ({prescription.medication_name}) "
                f"transitioned from {old_status} to {new_status} by {reviewer_id}."
            ),
            details=json.dumps({
                "previous_status": old_status,
                "new_status": new_status,
                "notes": review_notes,
            }),
        )
        db.add(audit)
        db.commit()
        db.refresh(prescription)
        return prescription

    @staticmethod
    def evaluate_patient_regimen(
        db: Session,
        patient_id: str,
        actor_id: str = "SYSTEM",
    ) -> Dict[str, Any]:
        """Evaluates all active prescriptions for a patient on demand."""
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found.")

        active_rx = db.query(Prescription).filter(
            Prescription.patient_id == patient.id,
            Prescription.status.in_(["APPROVED", "PENDING_REVIEW", "FLAGGED"]),
        ).all()

        med_inputs = [
            {"name": rx.medication_name, "dosage": rx.dosage, "dose_mg": rx.dose_mg}
            for rx in active_rx
        ]
        patient_profile = {
            "patient_ref": patient.id,
            "age": patient.age,
            "egfr": patient.egfr,
            "crcl": patient.crcl,
            "conditions": patient.get_conditions_list(),
            "allergies": patient.get_allergies_list(),
            "pregnant": patient.pregnant,
        }

        report = safety_service.engine.evaluate(
            medications=med_inputs,
            patient_profile=patient_profile,
        )

        audit = SafetyAuditLog(
            event_type="REGIMEN_EVALUATED_ON_DEMAND",
            patient_id=patient.id,
            actor_id=actor_id,
            action="EVALUATE",
            summary=f"Regimen of {len(active_rx)} active medications re-evaluated for patient {patient.id}.",
            details=json.dumps({"is_safe": report.get("is_safe"), "status": report.get("status")}),
        )
        db.add(audit)
        db.commit()

        return report


prescription_service = PrescriptionService()
