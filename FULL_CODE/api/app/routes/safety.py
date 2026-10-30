"""Safety Engine API routes."""
from fastapi import APIRouter, HTTPException
from app.models.safety import SafetyCheckRequest, SafetyCheckResponse
from app.services.safety_service import safety_service

router = APIRouter(prefix="", tags=["Safety Engine"])


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

