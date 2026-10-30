"""Automated unit and integration test suite for MedGuard Medication Safety Engine."""
import sys
import math
from pathlib import Path

# Ensure api and pipeline modules are importable
ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import pytest
from fastapi.testclient import TestClient
from main import app

from pipeline.safety_engine import MedicationSafetyEngine
from pipeline.normalizer import MedicationNormalizer
from pipeline.rules import SafetyRuleRepository, SeverityLevel, FindingCategory, ReviewStatus, EngineConfig


@pytest.fixture
def engine():
    """Provides a fresh MedicationSafetyEngine instance configured with verified bundled reference baseline."""
    repo = SafetyRuleRepository(external_dataset_path="BUNDLED")
    return MedicationSafetyEngine(repository=repo)


@pytest.fixture
def api_client():
    """Provides a FastAPI test client."""
    return TestClient(app)


# =====================================================================
# 1. Medication Normalization & Formulation Tests
# =====================================================================

def test_normalization_brand_to_generic(engine):
    """Verifies that brand names map to correct generic and active ingredient."""
    norm = engine.normalizer.normalize("Lipitor 20mg")
    assert norm.is_recognized is True
    assert norm.generic_name == "atorvastatin"
    assert "atorvastatin" in norm.active_ingredients
    assert norm.dose_mg == 20.0

    norm_tylenol = engine.normalizer.normalize("Tylenol 500 mg")
    assert norm_tylenol.is_recognized is True
    assert norm_tylenol.generic_name == "acetaminophen"
    assert "acetaminophen" in norm_tylenol.active_ingredients
    assert norm_tylenol.dose_mg == 500.0


def test_normalization_salt_and_dosage_stripping(engine):
    """Verifies removal of common pharmaceutical salts while preserving clinical metadata."""
    norm = engine.normalizer.normalize("Metformin Hydrochloride 1000mg ER Tablet")
    assert norm.is_recognized is True
    assert norm.generic_name == "metformin"
    assert norm.dose_mg == 1000.0
    assert norm.release_profile == "EXTENDED_RELEASE"
    assert norm.salt_form == "hydrochloride"


def test_normalization_potassium_chloride_electrolyte(engine):
    """Regression test: verifies that Potassium Chloride is NOT stripped as a salt."""
    norm = engine.normalizer.normalize("Potassium Chloride 20 mEq")
    assert norm.is_recognized is True
    assert norm.generic_name == "potassium chloride"
    assert "potassium chloride" in norm.active_ingredients
    assert norm.dose_unit == "mEq"


def test_normalization_release_profile_and_salts(engine):
    """Verifies preservation of release profiles and salt forms for beta blockers."""
    succ = engine.normalizer.normalize("Metoprolol Succinate ER 50 mg")
    assert succ.is_recognized is True
    assert succ.generic_name == "metoprolol"
    assert succ.release_profile == "EXTENDED_RELEASE"
    assert succ.salt_form == "succinate"

    tart = engine.normalizer.normalize("Metoprolol Tartrate 25 mg")
    assert tart.is_recognized is True
    assert tart.generic_name == "metoprolol"
    assert tart.salt_form == "tartrate"


# =====================================================================
# 2. Dosage Parsing Regression Tests
# =====================================================================

def test_dosage_parsing_comma_separated_and_units():
    """Regression test: verifies comma-separated numbers, decimals, and metric unit conversions."""
    # Comma-separated thousands
    assert MedicationNormalizer.extract_dose_mg("Metformin 1,000 mg") == 1000.0
    assert MedicationNormalizer.extract_dose_mg("Amoxicillin 2,500 mg") == 2500.0

    # Gram conversions
    assert MedicationNormalizer.extract_dose_mg("Metformin 1g") == 1000.0
    assert MedicationNormalizer.extract_dose_mg("Amoxicillin 1.5 g") == 1500.0

    # Microgram conversions
    assert MedicationNormalizer.extract_dose_mg("Levothyroxine 100 mcg") == 0.1
    assert MedicationNormalizer.extract_dose_mg("Digoxin 250 ug") == 0.25

    # Decimal values
    assert MedicationNormalizer.extract_dose_mg("Warfarin 2.5 mg") == 2.5
    assert MedicationNormalizer.extract_dose_mg("Clonazepam 0.5mg") == 0.5

    # Non-mg units do not falsely convert to mg
    dose_mg_meq, unit_meq = MedicationNormalizer.extract_dosage_info("Potassium 20 mEq")
    assert dose_mg_meq is None
    assert unit_meq == "mEq"

    # Malformed inputs
    assert MedicationNormalizer.extract_dose_mg("NoDoseHere") is None
    assert MedicationNormalizer.extract_dose_mg("Metformin abc mg") is None
    assert MedicationNormalizer.extract_dose_mg("Negative -500 mg") is None


# =====================================================================
# 3. Duplicate Medication Detection Tests
# =====================================================================

def test_exact_duplicate_medication(engine):
    """Detects exact duplicate drug prescriptions within a single regimen."""
    meds = [
        {"name": "Lipitor 20mg", "dosage": "20mg"},
        {"name": "Lipitor 20mg", "dosage": "20mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False
    assert result["summary"]["major"] >= 1

    dup_findings = [f for f in result["findings"] if f["category"] == FindingCategory.DUPLICATE_THERAPY.value]
    assert len(dup_findings) >= 1
    assert dup_findings[0]["rule_id"] == "DUP-EXACT-001"
    assert dup_findings[0]["severity"] == SeverityLevel.MAJOR.value
    assert dup_findings[0]["review_status"] == ReviewStatus.CONFIRMED_HAZARD.value


def test_active_ingredient_duplicate_different_brands(engine):
    """Detects duplicate active ingredient prescribed under different brand names (Tylenol + Panadol)."""
    meds = [
        {"name": "Tylenol 500mg", "dosage": "500mg"},
        {"name": "Panadol 500mg", "dosage": "500mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False

    dup_findings = [f for f in result["findings"] if f["rule_id"] == "DUP-ACT-001"]
    assert len(dup_findings) == 1
    assert "acetaminophen" in dup_findings[0]["reason"].lower()
    assert dup_findings[0]["severity"] == SeverityLevel.MAJOR.value


def test_combination_medication_duplicate_active_ingredient(engine):
    """Detects duplicate amoxicillin when Augmentin is prescribed concurrently with Amoxil."""
    meds = [
        {"name": "Augmentin 875mg", "dosage": "875mg"},
        {"name": "Amoxil 500mg", "dosage": "500mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False
    dup_findings = [f for f in result["findings"] if f["rule_id"] == "DUP-ACT-001"]
    assert len(dup_findings) == 1
    assert "amoxicillin" in dup_findings[0]["reason"].lower()


# =====================================================================
# 4. Drug-Drug Interaction Tests & Alert Deduplication
# =====================================================================

def test_major_ddi_warfarin_aspirin(engine):
    """Detects bleeding risk interaction between Warfarin and Aspirin."""
    meds = [
        {"name": "Coumadin 5mg", "dosage": "5mg"},
        {"name": "Bayer Aspirin 81mg", "dosage": "81mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False

    ddi_findings = [f for f in result["findings"] if f["category"] == FindingCategory.DRUG_DRUG_INTERACTION.value]
    assert len(ddi_findings) >= 1
    assert any(f["rule_id"] == "DDI-WAR-ASP" for f in ddi_findings)
    target = next(f for f in ddi_findings if f["rule_id"] == "DDI-WAR-ASP")
    assert target["severity"] == SeverityLevel.MAJOR.value
    assert "bleeding" in target["reason"].lower() or "hemorrhage" in target["reason"].lower()
    assert "fda" in target["evidence_source"].lower()


def test_potassium_chloride_spironolactone_interaction(engine):
    """Regression test: verifies hyperkalemia interaction between Potassium Chloride and Spironolactone."""
    meds = [
        {"name": "Potassium Chloride 20 mEq"},
        {"name": "Spironolactone 25mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False
    assert any(f["rule_id"] == "DDI-POT-SPI" for f in result["findings"])
    target = next(f for f in result["findings"] if f["rule_id"] == "DDI-POT-SPI")
    assert target["severity"] == SeverityLevel.MAJOR.value
    assert "hyperkalemia" in target["reason"].lower()


def test_ddi_alert_deduplication(engine):
    """Regression test: prevents duplicate DDI alerts for the same distinct active pair when drug is repeated."""
    meds = [
        {"name": "Warfarin 5mg", "dosage": "5mg"},
        {"name": "Warfarin 5mg", "dosage": "5mg"},
        {"name": "Aspirin 81mg", "dosage": "81mg"}
    ]
    result = engine.evaluate(medications=meds)
    # DDI-WAR-ASP must only be emitted once
    ddi_alerts = [f for f in result["findings"] if f["rule_id"] == "DDI-WAR-ASP"]
    assert len(ddi_alerts) == 1

    # Legitimate duplicate medication finding must still be preserved
    dup_alerts = [f for f in result["findings"] if f["rule_id"] == "DUP-EXACT-001"]
    assert len(dup_alerts) == 1


def test_contraindicated_ddi_simvastatin_clarithromycin(engine):
    """Detects contraindicated interaction between Simvastatin and Clarithromycin (CYP3A4 rhabdomyolysis)."""
    meds = [
        {"name": "Zocor 40mg", "dosage": "40mg"},
        {"name": "Biaxin 500mg", "dosage": "500mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False
    assert result["summary"]["contraindicated"] >= 1

    ci_findings = [f for f in result["findings"] if f["rule_id"] == "DDI-SIM-CLA"]
    assert len(ci_findings) == 1
    assert ci_findings[0]["severity"] == SeverityLevel.CONTRAINDICATED.value
    assert "rhabdomyolysis" in ci_findings[0]["reason"].lower()


def test_contraindicated_ddi_dual_raas_blockade(engine):
    """Detects dual RAAS blockade (Lisinopril ACEi + Losartan ARB)."""
    meds = [
        {"name": "Lisinopril 10mg", "dosage": "10mg"},
        {"name": "Losartan 50mg", "dosage": "50mg"}
    ]
    result = engine.evaluate(medications=meds)
    assert result["is_safe"] is False
    assert any(f["rule_id"] == "DDI-LIS-LOS" for f in result["findings"])


# =====================================================================
# 5. Renal-Dose Safety & Biomarker Validation Tests
# =====================================================================

def test_metformin_renal_contraindication(engine):
    """Identifies severe renal impairment (eGFR < 30) contraindication for Metformin."""
    meds = [{"name": "Glucophage 500mg", "dosage": "500mg"}]
    patient = {"egfr": 22.0, "patient_ref": "PAT-CKD-04"}

    result = engine.evaluate(medications=meds, patient_profile=patient)
    assert result["is_safe"] is False
    assert result["summary"]["contraindicated"] >= 1

    renal_findings = [f for f in result["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]
    assert len(renal_findings) >= 1
    assert renal_findings[0]["rule_id"] == "REN-MET-001"
    assert renal_findings[0]["severity"] == SeverityLevel.CONTRAINDICATED.value
    assert "lactic acidosis" in renal_findings[0]["reason"].lower()


def test_metformin_moderate_renal_dose_cap(engine):
    """Verifies dose ceiling warning for moderate renal impairment (eGFR 30–44) when exceeding 1000mg."""
    # Exceeding dose: 1500mg
    meds_high = [{"name": "Metformin", "dose_mg": 1500.0}]
    patient = {"egfr": 35.0}
    res_high = engine.evaluate(medications=meds_high, patient_profile=patient)
    dose_findings = [f for f in res_high["findings"] if f["rule_id"] == "REN-MET-001"]
    assert len(dose_findings) == 1
    assert dose_findings[0]["severity"] == SeverityLevel.MODERATE.value

    # Safe dose: 850mg (<= 1000mg cap)
    meds_safe = [{"name": "Metformin", "dose_mg": 850.0}]
    res_safe = engine.evaluate(medications=meds_safe, patient_profile=patient)
    dose_findings_safe = [f for f in res_safe["findings"] if f["rule_id"] == "REN-MET-001"]
    assert len(dose_findings_safe) == 0


def test_gabapentin_renal_threshold_exact_fda_table2(engine):
    """Regression test: verifies Gabapentin renal rule against FDA Section 2.3 Table 2 ceiling."""
    # CrCl < 15 with dose 300 mg/day exceeds 150 mg/day limit
    meds_high = [{"name": "Gabapentin 300mg", "dosage": "300mg"}]
    patient_severe = {"crcl": 10.0}
    res_high = engine.evaluate(medications=meds_high, patient_profile=patient_severe)
    assert res_high["is_safe"] is False
    gab_findings = [f for f in res_high["findings"] if f["rule_id"] == "REN-GAB-001"]
    assert len(gab_findings) == 1
    assert gab_findings[0]["severity"] == SeverityLevel.MAJOR.value
    assert "150.0 mg/day" in gab_findings[0]["reason"]

    # CrCl < 15 with dose 100 mg/day is within FDA threshold
    meds_ok = [{"name": "Gabapentin 100mg", "dosage": "100mg"}]
    res_ok = engine.evaluate(medications=meds_ok, patient_profile=patient_severe)
    assert len([f for f in res_ok["findings"] if f["rule_id"] == "REN-GAB-001"]) == 0


def test_renal_biomarker_validation_rejections(engine):
    """Regression test: rejects NaN, infinity, negative values, zero, and out-of-range biomarkers."""
    meds = [{"name": "Metformin 500mg"}]

    for invalid_val in [-5.0, 0.0, float('nan'), float('inf'), 999.0, "not_a_number"]:
        res = engine.evaluate(medications=meds, patient_profile={"egfr": invalid_val})
        assert res["is_safe"] is False
        assert res["status"] == "INSUFFICIENT_DATA_FOR_COMPLETE_EVALUATION"
        invalid_findings = [f for f in res["findings"] if "INVALID-BIOMARKER" in f["rule_id"]]
        assert len(invalid_findings) == 1
        assert invalid_findings[0]["severity"] == SeverityLevel.INSUFFICIENT_DATA.value


def test_renal_check_missing_patient_lab_data(engine):
    """Reports INSUFFICIENT_DATA when a drug with renal rules has no patient lab data."""
    meds = [{"name": "Metformin 500mg", "dosage": "500mg"}]
    patient_no_labs = {"patient_ref": "PAT-NO-LABS"}

    result = engine.evaluate(medications=meds, patient_profile=patient_no_labs)
    assert result["is_safe"] is False
    assert result["status"] == "INSUFFICIENT_DATA_FOR_COMPLETE_EVALUATION"

    gap_findings = [f for f in result["findings"] if f["category"] == FindingCategory.DATA_GAP.value]
    assert len(gap_findings) >= 1
    assert any("DATA-REN-MET-001-GAP" in f["rule_id"] for f in gap_findings)
    assert gap_findings[0]["severity"] == SeverityLevel.INSUFFICIENT_DATA.value


def test_renal_check_missing_dose_with_impaired_kidney(engine):
    """Reports INSUFFICIENT_DATA when patient has renal impairment but dose is not specified."""
    meds = [{"name": "Gabapentin"}]  # No dosage specified
    patient = {"crcl": 20.0}

    result = engine.evaluate(medications=meds, patient_profile=patient)
    gap_findings = [f for f in result["findings"] if f["rule_id"] == "DATA-REN-GAB-001-DOSE-GAP"]
    assert len(gap_findings) == 1
    assert gap_findings[0]["severity"] == SeverityLevel.INSUFFICIENT_DATA.value


# =====================================================================
# 6. Condition & Allergy Contraindications Tests
# =====================================================================

def test_condition_contraindication_asthma_propranolol(engine):
    """Detects contraindication between non-selective beta blocker and asthma."""
    meds = [{"name": "Inderal 40mg", "dosage": "40mg"}]
    patient = {"conditions": ["Asthma", "Hypertension"]}

    result = engine.evaluate(medications=meds, patient_profile=patient)
    assert result["is_safe"] is False
    assert result["summary"]["contraindicated"] >= 1

    ci_findings = [f for f in result["findings"] if f["rule_id"] == "CI-PRO-AST"]
    assert len(ci_findings) == 1
    assert "bronchospasm" in ci_findings[0]["reason"].lower()


def test_condition_contraindication_peptic_ulcer_ibuprofen(engine):
    """Detects contraindication between NSAID and active peptic ulcer disease."""
    meds = [{"name": "Advil 400mg", "dosage": "400mg"}]
    patient = {"conditions": ["Peptic Ulcer Disease"]}

    result = engine.evaluate(medications=meds, patient_profile=patient)
    assert result["is_safe"] is False
    assert any(f["rule_id"] == "CI-IBU-PUD" for f in result["findings"])


def test_allergy_contraindication_amoxicillin_penicillin(engine):
    """Detects contraindication for patient with documented penicillin allergy prescribed Amoxicillin."""
    meds = [{"name": "Amoxil 500mg", "dosage": "500mg"}]
    patient = {"allergies": ["penicillin"]}

    result = engine.evaluate(medications=meds, patient_profile=patient)
    assert result["is_safe"] is False

    allergy_findings = [f for f in result["findings"] if f["rule_id"] == "CI-AMX-PEN"]
    assert len(allergy_findings) == 1
    assert allergy_findings[0]["severity"] == SeverityLevel.CONTRAINDICATED.value
    assert "anaphylaxis" in allergy_findings[0]["reason"].lower()


# =====================================================================
# 7. Unrecognized Drug & Qualified Status Reporting Tests
# =====================================================================

def test_unknown_medication_data_gap(engine):
    """Distinguishes unverified drugs from confirmed safe drugs without inventing clinical results."""
    meds = [{"name": "SyntheticMed-XYZ 50mg"}]
    result = engine.evaluate(medications=meds)

    assert result["is_safe"] is False
    assert result["status"] == "INSUFFICIENT_DATA_FOR_COMPLETE_EVALUATION"
    gap_findings = [f for f in result["findings"] if f["rule_id"] == "DATA-UNK-001"]
    assert len(gap_findings) == 1
    assert gap_findings[0]["severity"] == SeverityLevel.INSUFFICIENT_DATA.value
    assert "not present in the verified" in gap_findings[0]["reason"]


def test_qualified_status_and_check_accounting(engine):
    """Verifies that absence of indexed alerts reports NO_INDEXED_HAZARDS_IDENTIFIED with check accounting."""
    meds = [
        {"name": "Atorvastatin 20mg", "dosage": "20mg"},
        {"name": "Amoxicillin 500mg", "dosage": "500mg"}
    ]
    patient = {
        "patient_ref": "PAT-QUAL-01",
        "egfr": 90.0,
        "conditions": ["hyperlipidemia"],
        "allergies": []
    }
    result = engine.evaluate(medications=meds, patient_profile=patient)
    assert result["status"] == "NO_INDEXED_HAZARDS_IDENTIFIED"
    assert "checks_accounting" in result
    assert result["checks_accounting"]["drug_interaction_check"] == "EVALUATED"
    assert result["checks_accounting"]["duplicate_therapy_check"] == "EVALUATED"
    assert result["checks_accounting"]["formulary_coverage"] == "FULL_COVERAGE"


def test_dataset_discovery_info(engine):
    """Verifies that dataset provenance and fallback mode are clearly reported."""
    info = engine.repository.get_dataset_info()
    assert "dataset_mode" in info
    assert "dataset_status_message" in info
    assert info["dataset_mode"] in ("BUNDLED_REFERENCE", "EXTERNAL_H4")


# =====================================================================
# 8. Configurable Severity Rules Tests
# =====================================================================

def test_configurable_min_severity_filtering(engine):
    """Verifies that configurable minimum severity suppresses lower-severity alerts."""
    meds = [{"name": "Metformin", "dose_mg": 1200.0}]
    patient = {"egfr": 35.0}  # Triggers MODERATE renal rule

    # Filter with CONTRAINDICATED only: MODERATE alert should be filtered out
    config_high = EngineConfig(min_severity_report=SeverityLevel.CONTRAINDICATED)
    res_high = engine.evaluate(medications=meds, patient_profile=patient, override_config=config_high)
    assert len([f for f in res_high["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]) == 0

    # Filter with MODERATE: MODERATE alert is included
    config_mod = EngineConfig(min_severity_report=SeverityLevel.MODERATE)
    res_mod = engine.evaluate(medications=meds, patient_profile=patient, override_config=config_mod)
    assert len([f for f in res_mod["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]) == 1


# =====================================================================
# 9. FastAPI Integration Endpoint Tests
# =====================================================================

def test_api_safety_check_endpoint(api_client):
    """Validates POST /api/safety/check HTTP endpoint."""
    payload = {
        "medications": [
            {"name": "Warfarin 5mg", "dosage": "5mg"},
            {"name": "Aspirin 81mg", "dosage": "81mg"}
        ],
        "patient": {
            "patient_ref": "PAT-API-01",
            "egfr": 80.0
        }
    }
    response = api_client.post("/api/safety/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_safe"] is False
    assert data["has_blocking_hazards"] is True
    assert data["status"] == "CONTRAINDICATION_OR_MAJOR_HAZARD_IDENTIFIED"
    assert "findings" in data
    # Accepts either bundled DDI-WAR-ASP or H4-DDI rule for warfarin + aspirin
    assert any(
        f["rule_id"] == "DDI-WAR-ASP" or "bleeding" in f.get("reason", "").lower()
        for f in data["findings"]
    )
    assert "disclaimer" in data
    assert "dataset_info" in data


def test_api_safety_rules_summary_endpoint(api_client):
    """Validates GET /api/safety/rules knowledgebase summary endpoint."""
    response = api_client.get("/api/safety/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["total_drugs_indexed"] > 0
    assert data["total_interaction_rules"] > 0
    assert "dataset_info" in data
    assert len(data["knowledge_sources"]) > 0
