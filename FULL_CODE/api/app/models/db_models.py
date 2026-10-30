"""SQLAlchemy ORM models for MedGuard Medication Safety Platform.

Defines schemas and relational mappings for:
- Patients
- Medications
- Prescriptions
- Safety Alerts
- Safety Audit Logs
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _gen_id(prefix: str) -> str:
    """Generates an uppercase unique human-readable ID with a type prefix."""
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


class Patient(Base):
    """Patient clinical demographic and organ function profile."""
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, default=lambda: _gen_id("PAT"))
    name = Column(String(255), nullable=False, index=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=True)
    weight_kg = Column(Float, nullable=True)
    egfr = Column(Float, nullable=True)  # mL/min/1.73m²
    crcl = Column(Float, nullable=True)  # mL/min
    pregnant = Column(String(16), default="N")
    conditions = Column(Text, default="[]")  # JSON encoded list of conditions
    allergies = Column(Text, default="[]")   # JSON encoded list of allergies
    phone = Column(String(64), nullable=True)
    email = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relational mappings
    prescriptions = relationship(
        "Prescription",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(Prescription.submitted_at)",
    )
    safety_alerts = relationship(
        "SafetyAlert",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(SafetyAlert.created_at)",
    )
    audit_logs = relationship(
        "SafetyAuditLog",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(SafetyAuditLog.created_at)",
    )

    def get_conditions_list(self) -> List[str]:
        if not self.conditions:
            return []
        try:
            return json.loads(self.conditions)
        except Exception:
            return [c.strip() for c in self.conditions.split(";") if c.strip()]

    def set_conditions_list(self, conds: List[str]) -> None:
        self.conditions = json.dumps(conds or [])

    def get_allergies_list(self) -> List[str]:
        if not self.allergies:
            return []
        try:
            return json.loads(self.allergies)
        except Exception:
            return [a.strip() for a in self.allergies.split(";") if a.strip()]

    def set_allergies_list(self, allgs: List[str]) -> None:
        self.allergies = json.dumps(allgs or [])


class Medication(Base):
    """Medication catalog entry representing formulary drug entities."""
    __tablename__ = "medications"

    id = Column(String(64), primary_key=True, default=lambda: _gen_id("MED"))
    name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True, index=True)
    active_ingredients = Column(Text, default="[]")  # JSON encoded list
    drug_class = Column(String(255), nullable=True, index=True)
    default_dosage = Column(String(128), nullable=True)
    dosage_form = Column(String(128), nullable=True)
    renal_adjustment_flag = Column(String(8), default="N")
    pregnancy_category = Column(String(8), default="N")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def get_ingredients_list(self) -> List[str]:
        if not self.active_ingredients:
            return []
        try:
            return json.loads(self.active_ingredients)
        except Exception:
            return [i.strip() for i in self.active_ingredients.split(";") if i.strip()]

    def set_ingredients_list(self, ings: List[str]) -> None:
        self.active_ingredients = json.dumps(ings or [])


class Prescription(Base):
    """Prescription submitted for a patient and tracked through review."""
    __tablename__ = "prescriptions"

    id = Column(String(64), primary_key=True, default=lambda: _gen_id("RX"))
    patient_id = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    prescriber_id = Column(String(128), nullable=False, index=True)
    medication_name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    dosage = Column(String(128), nullable=False)
    dose_mg = Column(Float, nullable=True)
    frequency = Column(String(128), nullable=False)
    route = Column(String(64), default="oral")
    status = Column(String(64), default="PENDING_REVIEW", index=True)  # PENDING_REVIEW, FLAGGED, APPROVED, DISCONTINUED, REJECTED
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(128), nullable=True)
    review_notes = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relational mappings
    patient = relationship("Patient", back_populates="prescriptions")
    safety_alerts = relationship(
        "SafetyAlert",
        back_populates="prescription",
        cascade="all, delete-orphan",
        order_by="desc(SafetyAlert.created_at)",
    )
    audit_logs = relationship(
        "SafetyAuditLog",
        back_populates="prescription",
        order_by="desc(SafetyAuditLog.created_at)",
    )


class SafetyAlert(Base):
    """Clinical decision support finding generated by the safety engine."""
    __tablename__ = "safety_alerts"

    id = Column(String(64), primary_key=True, default=lambda: _gen_id("ALT"))
    patient_id = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    prescription_id = Column(String(64), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=True, index=True)
    rule_id = Column(String(64), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # DRUG_DRUG_INTERACTION, DUPLICATE_THERAPY, RENAL_SAFETY, CONTRAINDICATION, DATA_GAP
    severity = Column(String(32), nullable=False, index=True)  # CONTRAINDICATED, MAJOR, MODERATE, MINOR, INSUFFICIENT_DATA
    drugs_involved = Column(Text, default="[]")  # JSON encoded list of drug names
    reason = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=True)
    evidence_source = Column(String(255), nullable=True)
    review_status = Column(String(64), default="UNRESOLVED", index=True)  # UNRESOLVED, UNDER_REVIEW, RESOLVED, OVERRIDDEN
    reviewed_by = Column(String(128), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relational mappings
    patient = relationship("Patient", back_populates="safety_alerts")
    prescription = relationship("Prescription", back_populates="safety_alerts")
    audit_logs = relationship(
        "SafetyAuditLog",
        back_populates="safety_alert",
        order_by="desc(SafetyAuditLog.created_at)",
    )

    def get_drugs_list(self) -> List[str]:
        if not self.drugs_involved:
            return []
        try:
            return json.loads(self.drugs_involved)
        except Exception:
            return [d.strip() for d in self.drugs_involved.split(";") if d.strip()]

    def set_drugs_list(self, drugs: List[str]) -> None:
        self.drugs_involved = json.dumps(drugs or [])


class SafetyAuditLog(Base):
    """Auditable log of clinical safety evaluations and clinician review decisions."""
    __tablename__ = "safety_audit_logs"

    id = Column(String(64), primary_key=True, default=lambda: _gen_id("LOG"))
    event_type = Column(String(64), nullable=False, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    prescription_id = Column(String(64), ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True, index=True)
    safety_alert_id = Column(String(64), ForeignKey("safety_alerts.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_id = Column(String(128), nullable=False, index=True)
    action = Column(String(64), nullable=False)  # CREATE, EVALUATE, APPROVE, FLAG, OVERRIDE, DISCONTINUE, DELETE
    summary = Column(Text, nullable=False)
    details = Column(Text, nullable=True)  # JSON encoded metadata or snapshot
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relational mappings
    patient = relationship("Patient", back_populates="audit_logs")
    prescription = relationship("Prescription", back_populates="audit_logs")
    safety_alert = relationship("SafetyAlert", back_populates="audit_logs")

    def get_details_dict(self) -> Dict[str, Any]:
        if not self.details:
            return {}
        try:
            return json.loads(self.details)
        except Exception:
            return {"raw_text": self.details}

    def set_details_dict(self, data: Dict[str, Any]) -> None:
        self.details = json.dumps(data or {})

