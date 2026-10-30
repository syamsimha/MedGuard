"""Medication catalog and formulary service."""
from __future__ import annotations

import json
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.models.db_models import Medication, SafetyAuditLog
from app.models.schemas import MedicationCreate, MedicationUpdate


class MedicationService:
    """Service layer managing medication formulary entries."""

    @staticmethod
    def create_medication(db: Session, data: MedicationCreate, actor_id: str = "SYSTEM") -> Medication:
        """Adds a medication entry to the database formulary."""
        med = Medication(
            id=data.id if data.id else None,
            name=data.name.strip(),
            generic_name=data.generic_name.strip() if data.generic_name else None,
            active_ingredients=json.dumps(data.active_ingredients or []),
            drug_class=data.drug_class.strip() if data.drug_class else None,
            default_dosage=data.default_dosage.strip() if data.default_dosage else None,
            dosage_form=data.dosage_form.strip() if data.dosage_form else None,
            renal_adjustment_flag=data.renal_adjustment_flag.strip().upper() if data.renal_adjustment_flag else "N",
            pregnancy_category=data.pregnancy_category.strip().upper() if data.pregnancy_category else "N",
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(med)
        db.flush()

        audit = SafetyAuditLog(
            event_type="MEDICATION_CREATED",
            actor_id=actor_id,
            action="CREATE",
            summary=f"Medication '{med.name}' ({med.id}) registered in formulary.",
            details=json.dumps({
                "generic_name": med.generic_name,
                "drug_class": med.drug_class,
                "pregnancy_category": med.pregnancy_category,
            }),
        )
        db.add(audit)
        db.commit()
        db.refresh(med)
        return med

    @staticmethod
    def get_medication(db: Session, medication_id: str) -> Optional[Medication]:
        """Retrieves medication by primary key ID or exact brand name."""
        return db.query(Medication).filter(
            or_(Medication.id == medication_id, Medication.name.ilike(medication_id))
        ).first()

    @staticmethod
    def list_medications(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
    ) -> Tuple[List[Medication], int]:
        """Lists medications with optional query matching name, generic, or drug class."""
        query = db.query(Medication)
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Medication.name.ilike(term),
                    Medication.generic_name.ilike(term),
                    Medication.drug_class.ilike(term),
                    Medication.active_ingredients.ilike(term),
                )
            )
        total = query.count()
        meds = query.order_by(desc(Medication.created_at)).offset(skip).limit(limit).all()
        return meds, total

    @staticmethod
    def update_medication(
        db: Session,
        medication_id: str,
        data: MedicationUpdate,
        actor_id: str = "SYSTEM",
    ) -> Optional[Medication]:
        """Updates medication formulary details."""
        med = db.query(Medication).filter(Medication.id == medication_id).first()
        if not med:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        changes = []
        for key, val in update_dict.items():
            if key == "active_ingredients" and val is not None:
                med.active_ingredients = json.dumps(val)
                changes.append(f"ingredients updated ({len(val)})")
            elif hasattr(med, key):
                setattr(med, key, val)
                changes.append(f"{key}={val}")

        if changes:
            audit = SafetyAuditLog(
                event_type="MEDICATION_UPDATED",
                actor_id=actor_id,
                action="UPDATE",
                summary=f"Medication '{med.id}' updated: {', '.join(changes[:5])}",
                details=json.dumps(update_dict),
            )
            db.add(audit)

        db.commit()
        db.refresh(med)
        return med

    @staticmethod
    def delete_medication(db: Session, medication_id: str, actor_id: str = "SYSTEM") -> bool:
        """Deletes medication from formulary catalog."""
        med = db.query(Medication).filter(Medication.id == medication_id).first()
        if not med:
            return False

        audit = SafetyAuditLog(
            event_type="MEDICATION_DELETED",
            actor_id=actor_id,
            action="DELETE",
            summary=f"Medication '{med.name}' ({med.id}) removed from formulary.",
            details=json.dumps({"medication_id": medication_id, "name": med.name}),
        )
        db.add(audit)
        db.delete(med)
        db.commit()
        return True


medication_service = MedicationService()

