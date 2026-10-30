"""Medication formulary catalog API endpoints."""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Medication
from app.models.schemas import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    MedicationListResponse,
)
from app.services.medication_service import medication_service


router = APIRouter(prefix="", tags=["Medications"])


def _to_medication_response(m: Medication) -> MedicationResponse:
    return MedicationResponse(
        id=m.id,
        name=m.name,
        generic_name=m.generic_name,
        active_ingredients=m.get_ingredients_list(),
        drug_class=m.drug_class,
        default_dosage=m.default_dosage,
        dosage_form=m.dosage_form,
        renal_adjustment_flag=m.renal_adjustment_flag,
        pregnancy_category=m.pregnancy_category,
        notes=m.notes,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.post(
    "/medications",
    response_model=MedicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create medication formulary entry",
    description="Registers a medication in the database formulary with dosage form and pregnancy category.",
)
def create_medication(
    payload: MedicationCreate,
    actor_id: str = Query("SYSTEM", description="Acting user or system identifier"),
    db: Session = Depends(get_db),
) -> MedicationResponse:
    med = medication_service.create_medication(db, payload, actor_id=actor_id)
    return _to_medication_response(med)


@router.get(
    "/medications",
    response_model=MedicationListResponse,
    summary="List medications",
    description="Returns a paginated list of formulary medications with optional search matching.",
)
def list_medications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search term matching drug name, generic, or class"),
    db: Session = Depends(get_db),
) -> MedicationListResponse:
    items, total = medication_service.list_medications(db, skip=skip, limit=limit, search=search)
    return MedicationListResponse(
        total=total,
        items=[_to_medication_response(m) for m in items],
    )


@router.get(
    "/medications/{medication_id}",
    response_model=MedicationResponse,
    summary="Get medication details",
    description="Retrieves a medication entry by ID or exact name.",
)
def get_medication(medication_id: str, db: Session = Depends(get_db)) -> MedicationResponse:
    med = medication_service.get_medication(db, medication_id)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medication '{medication_id}' not found.")
    return _to_medication_response(med)


@router.put(
    "/medications/{medication_id}",
    response_model=MedicationResponse,
    summary="Update medication formulary entry",
    description="Updates formulary parameters or clinical guidance for a medication.",
)
def update_medication(
    medication_id: str,
    payload: MedicationUpdate,
    actor_id: str = Query("SYSTEM", description="Acting user identifier"),
    db: Session = Depends(get_db),
) -> MedicationResponse:
    med = medication_service.update_medication(db, medication_id, payload, actor_id=actor_id)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medication '{medication_id}' not found.")
    return _to_medication_response(med)


@router.delete(
    "/medications/{medication_id}",
    summary="Delete medication",
    description="Removes a medication entry from the database formulary.",
)
def delete_medication(
    medication_id: str,
    actor_id: str = Query("SYSTEM", description="Acting user identifier"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    success = medication_service.delete_medication(db, medication_id, actor_id=actor_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Medication '{medication_id}' not found.")
    return {"status": "success", "message": f"Medication '{medication_id}' removed from formulary."}

