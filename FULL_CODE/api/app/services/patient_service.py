"""Patient management service handling clinical demographics and profile CRUD."""
from __future__ import annotations

import json
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.models.db_models import Patient, Prescription, SafetyAlert, SafetyAuditLog
from app.models.schemas import PatientCreate, PatientUpdate


class PatientService:
    """Service layer managing patient clinical records."""

    @staticmethod
    def create_patient(db: Session, data: PatientCreate, actor_id: str = "SYSTEM") -> Patient:
        """Creates a new patient record and records audit log."""
        patient = Patient(
            id=data.id if data.id else None,
            name=data.name.strip(),
            age=data.age,
            gender=data.gender.strip() if data.gender else None,
            weight_kg=data.weight_kg,
            egfr=data.egfr,
            crcl=data.crcl,
            pregnant=data.pregnant.strip().upper() if data.pregnant else "N",
            conditions=json.dumps(data.conditions or []),
            allergies=json.dumps(data.allergies or []),
            phone=data.phone.strip() if data.phone else None,
            email=data.email.strip() if data.email else None,
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(patient)
        db.flush()  # populate ID

        # Audit log
        audit = SafetyAuditLog(
            event_type="PATIENT_CREATED",
            patient_id=patient.id,
            actor_id=actor_id,
            action="CREATE",
            summary=f"Patient '{patient.name}' ({patient.id}) registered.",
            details=json.dumps({
                "age": patient.age,
                "egfr": patient.egfr,
                "pregnant": patient.pregnant,
                "conditions_count": len(data.conditions or []),
                "allergies_count": len(data.allergies or []),
            }),
        )
        db.add(audit)
        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def get_patient(db: Session, patient_id: str) -> Optional[Patient]:
        """Retrieves patient by primary key ID."""
        return db.query(Patient).filter(Patient.id == patient_id).first()

    @staticmethod
    def list_patients(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
    ) -> Tuple[List[Patient], int]:
        """Lists patients with optional search filter and total count."""
        query = db.query(Patient)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Patient.name.ilike(term),
                    Patient.id.ilike(term),
                    Patient.conditions.ilike(term),
                    Patient.allergies.ilike(term),
                )
            )
        total = query.count()
        patients = query.order_by(desc(Patient.created_at)).offset(skip).limit(limit).all()
        return patients, total

    @staticmethod
    def update_patient(
        db: Session,
        patient_id: str,
        data: PatientUpdate,
        actor_id: str = "SYSTEM",
    ) -> Optional[Patient]:
        """Updates patient record with partial fields and records audit log."""
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        changes = []
        for key, val in update_dict.items():
            if key == "conditions" and val is not None:
                patient.conditions = json.dumps(val)
                changes.append(f"conditions updated ({len(val)})")
            elif key == "allergies" and val is not None:
                patient.allergies = json.dumps(val)
                changes.append(f"allergies updated ({len(val)})")
            elif hasattr(patient, key):
                setattr(patient, key, val)
                changes.append(f"{key}={val}")

        if changes:
            audit = SafetyAuditLog(
                event_type="PATIENT_UPDATED",
                patient_id=patient.id,
                actor_id=actor_id,
                action="UPDATE",
                summary=f"Patient '{patient.id}' updated: {', '.join(changes[:5])}",
                details=json.dumps(update_dict),
            )
            db.add(audit)

        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def delete_patient(db: Session, patient_id: str, actor_id: str = "SYSTEM") -> bool:
        """Deletes patient and cascades related clinical data."""
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return False

        # Audit log (set patient_id to None or keep in summary before delete)
        audit = SafetyAuditLog(
            event_type="PATIENT_DELETED",
            actor_id=actor_id,
            action="DELETE",
            summary=f"Patient '{patient.name}' ({patient.id}) removed from system.",
            details=json.dumps({"patient_id": patient_id, "name": patient.name}),
        )
        db.add(audit)
        db.delete(patient)
        db.commit()
        return True


patient_service = PatientService()

