"""Unit and integration tests for the H4 CSV dataset ingestion adapter."""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import pytest
from pipeline.h4_loader import H4DatasetLoader, H4DatasetError, VALID_SEVERITIES
from pipeline.rules import SafetyRuleRepository, SeverityLevel, FindingCategory, ReviewStatus
from pipeline.safety_engine import MedicationSafetyEngine


@pytest.fixture
def h4_data_path():
    """Returns path to H4_Dataset/data."""
    repo_root = Path(__file__).resolve().parents[2]
    candidate = repo_root / "H4_Dataset" / "data"
    if not candidate.exists():
        candidate = Path.cwd() / "H4_Dataset" / "data"
    return candidate


# =====================================================================
# 1. H4 CSV Ingestion & Parsing Tests
# =====================================================================

def test_h4_loader_all_files_parsed(h4_data_path):
    """Verifies that H4DatasetLoader loads all 7 reference files with exact record counts."""
    assert h4_data_path.exists(), f"H4 data dir missing at {h4_data_path}"
    loader = H4DatasetLoader(h4_data_path)
    catalog = loader.load_all()

    assert catalog.total_records_parsed == 3243
    assert catalog.file_record_counts["conditions.csv"] == 58
    assert catalog.file_record_counts["drug_reference.csv"] == 496
    assert catalog.file_record_counts["combination_brands.csv"] == 98
    assert catalog.file_record_counts["interactions.csv"] == 2196
    assert catalog.file_record_counts["renal_rules.csv"] == 169
    assert catalog.file_record_counts["duplicate_therapy_groups.csv"] == 74
    assert catalog.file_record_counts["drug_disease_contraindications.csv"] == 152

    # Verify drugs dictionary includes both single-ingredient and combination brands
    assert len(catalog.drugs_catalog["drugs"]) == 575
    assert len(catalog.interactions_catalog) == 2196
    assert len(catalog.duplicate_groups) == 74


def test_h4_missing_required_file_raises_error(tmp_path):
    """Verifies that missing any required CSV raises H4DatasetError and does not partially load."""
    # Create empty directory
    loader = H4DatasetLoader(tmp_path)
    with pytest.raises(H4DatasetError) as exc_info:
        loader.load_all()
    assert "missing required reference files" in str(exc_info.value)


# =====================================================================
# 2. Multi-Ingredient Combination Product Tests
# =====================================================================

def test_h4_combination_product_resolution():
    """Verifies that combination brands (e.g. Combiflam, Glycomet-GP) resolve to all active ingredients."""
    engine = MedicationSafetyEngine()
    norm_combiflam = engine.normalizer.normalize("Combiflam")
    assert norm_combiflam.is_recognized is True
    assert set(norm_combiflam.active_ingredients) == {"ibuprofen", "paracetamol"}

    norm_glycomet = engine.normalizer.normalize("Glycomet-GP 1")
    assert norm_glycomet.is_recognized is True
    assert set(norm_glycomet.active_ingredients) == {"glimepiride", "metformin"}


def test_h4_combination_duplicate_active_ingredient():
    """Verifies duplicate active ingredient detection between combination product and single entity."""
    engine = MedicationSafetyEngine()
    # Combiflam (ibuprofen + paracetamol) + Calpol (paracetamol)
    meds = [{"name": "Combiflam"}, {"name": "Calpol 500mg"}]
    res = engine.evaluate(medications=meds)
    assert res["is_safe"] is False
    act_dups = [f for f in res["findings"] if f["rule_id"] == "DUP-ACT-001"]
    assert len(act_dups) == 1
    assert "paracetamol" in act_dups[0]["reason"].lower()


# =====================================================================
# 3. Duplicate Therapy Group Tests
# =====================================================================

def test_h4_duplicate_therapy_group_detection():
    """Detects therapeutic class duplication between distinct generics in duplicate_therapy_groups.csv."""
    engine = MedicationSafetyEngine()
    # Aceclofenac + Diclofenac (both belong to NSAID group)
    meds = [{"name": "Aceclofenac 100mg"}, {"name": "Diclofenac 50mg"}]
    res = engine.evaluate(medications=meds)
    assert res["is_safe"] is False
    grp_dups = [f for f in res["findings"] if "DUP-GRP-NSAID" in f["rule_id"]]
    assert len(grp_dups) == 1
    assert "nsaids" in grp_dups[0]["reason"].lower()


# =====================================================================
# 4. Renal Dosing Boundary Semantics Tests
# =====================================================================

def test_h4_renal_threshold_boundary_semantics():
    """Verifies that renal rules strictly enforce eGFR < threshold (strict inequality)."""
    engine = MedicationSafetyEngine()
    # In H4 renal_rules.csv, aceclofenac has rules at eGFR < 60 (moderate) and eGFR < 30 (major)
    meds = [{"name": "Aceclofenac 100mg"}]

    # eGFR = 60.0 (boundary): eGFR < 60 is FALSE, so rule does NOT apply
    res_at_boundary = engine.evaluate(medications=meds, patient_profile={"egfr": 60.0})
    assert len([f for f in res_at_boundary["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]) == 0

    # eGFR = 59.9: strictly less than 60, triggers moderate rule
    res_below_60 = engine.evaluate(medications=meds, patient_profile={"egfr": 59.9})
    renal_mod = [f for f in res_below_60["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]
    assert len(renal_mod) == 1
    assert renal_mod[0]["severity"] == SeverityLevel.MODERATE.value

    # eGFR = 25.0: strictly less than 30, triggers major rule
    res_below_30 = engine.evaluate(medications=meds, patient_profile={"egfr": 25.0})
    renal_major = [f for f in res_below_30["findings"] if f["category"] == FindingCategory.RENAL_SAFETY.value]
    assert any(f["severity"] == SeverityLevel.MAJOR.value for f in renal_major)


# =====================================================================
# 5. H4 Contraindications & Pregnancy Tests
# =====================================================================

def test_h4_contraindication_pregnancy():
    """Verifies contraindication detection when patient is flagged as pregnant."""
    engine = MedicationSafetyEngine()
    # Methotrexate in pregnancy
    meds = [{"name": "Methotrexate 10mg"}]
    res = engine.evaluate(medications=meds, patient_profile={"pregnant": "Y"})
    assert res["is_safe"] is False
    ci_findings = [f for f in res["findings"] if f["category"] == FindingCategory.CONTRAINDICATION.value]
    assert len(ci_findings) >= 1
    assert any("pregnancy" in f["reason"].lower() or "pregnant" in f["reason"].lower() for f in ci_findings)


def test_h4_contraindication_allergy():
    """Verifies contraindication detection for documented patient allergies in H4."""
    engine = MedicationSafetyEngine()
    # Amoxicillin with penicillin allergy
    meds = [{"name": "Amoxicillin 500mg"}]
    res = engine.evaluate(medications=meds, patient_profile={"allergies": ["penicillin"]})
    assert res["is_safe"] is False
    ci_findings = [f for f in res["findings"] if f["category"] == FindingCategory.CONTRAINDICATION.value]
    assert len(ci_findings) >= 1
    assert any("penicillin" in f["reason"].lower() for f in ci_findings)


# =====================================================================
# 6. Fallback Safety Isolation Tests
# =====================================================================

def test_h4_fallback_isolation(tmp_path):
    """Verifies that an invalid external path safely retains bundled fallback without mixing data."""
    # Point repository to empty folder
    repo = SafetyRuleRepository(external_dataset_path=str(tmp_path))
    assert repo.dataset_mode == "BUNDLED_REFERENCE"
    assert repo.external_dataset_loaded is False
    assert "Fell back to BUNDLED_REFERENCE" in repo.dataset_status_message
    # Bundled fallback catalog remains intact
    assert len(repo.drugs_catalog["drugs"]) == 22
    assert len(repo.interactions_catalog) == 6


# =====================================================================
# 7. Focused Regression Tests for Audit Findings
# =====================================================================

def test_h4_pregnancy_category_c_moderate_alert():
    """Verifies that Category C drugs generate MODERATE alerts and are not claimed safe in pregnancy."""
    engine = MedicationSafetyEngine()
    # Amlodipine is Category C in H4 drug_reference.csv
    meds = [{"name": "Amlodipine 5mg"}]
    res = engine.evaluate(medications=meds, patient_profile={"pregnant": "Y"})
    assert res["is_safe"] is False
    assert res["status"] == "POTENTIAL_RISKS_IDENTIFIED"

    c_findings = [f for f in res["findings"] if "H4-PREG-C-" in f["rule_id"]]
    assert len(c_findings) == 1
    assert c_findings[0]["severity"] == SeverityLevel.MODERATE.value
    assert c_findings[0]["review_status"] == ReviewStatus.REQUIRES_CLINICAL_REVIEW.value
    assert "risk-benefit" in c_findings[0]["reason"].lower()


def test_h4_pregnancy_category_n_data_gap():
    """Verifies that Category N (unclassified) drugs generate DATA_GAP and are not claimed safe in pregnancy."""
    engine = MedicationSafetyEngine()
    # Acebrophylline is Category N in H4 drug_reference.csv
    meds = [{"name": "Acebrophylline 100mg"}]
    res = engine.evaluate(medications=meds, patient_profile={"pregnant": True})
    assert res["is_safe"] is False
    assert res["status"] == "INSUFFICIENT_DATA_FOR_COMPLETE_EVALUATION"

    n_findings = [f for f in res["findings"] if "H4-PREG-N-" in f["rule_id"]]
    assert len(n_findings) == 1
    assert n_findings[0]["severity"] == SeverityLevel.INSUFFICIENT_DATA.value
    assert n_findings[0]["review_status"] == ReviewStatus.INSUFFICIENT_DATA.value


def test_h4_checks_accounting_dose_ceiling_and_pregnancy():
    """Verifies that dose ceiling limitation and pregnancy checks are transparently reported."""
    engine = MedicationSafetyEngine()
    meds = [{"name": "Paracetamol 500mg"}]
    res_not_pregnant = engine.evaluate(medications=meds, patient_profile={"pregnant": False})
    accounting = res_not_pregnant["checks_accounting"]
    assert accounting["dose_ceiling_check"] == "NOT_EVALUATED_REQUIRES_CUMULATIVE_DAILY_SCHEDULE"
    assert accounting["pregnancy_safety_check"] == "NOT_APPLICABLE_PATIENT_NOT_PREGNANT"

    res_pregnant = engine.evaluate(medications=meds, patient_profile={"pregnant": "Y"})
    assert res_pregnant["checks_accounting"]["pregnancy_safety_check"] == "EVALUATED"


def test_h4_unrecognized_severity_fallback_insufficient_data():
    """Regression test: verifies unrecognized DDI severity maps to INSUFFICIENT_DATA rather than MAJOR."""
    engine = MedicationSafetyEngine()
    # Inject a test interaction rule with an unclassified/unknown severity
    custom_rule = {
        "rule_id": "H4-DDI-TEST-UNK",
        "drug_a": "aspirin",
        "drug_b": "atorvastatin",
        "severity": "unclassified_risk",  # Unknown raw severity
        "mechanism": "Theoretical interaction without established severity",
        "recommended_action": "Clinical monitoring recommended",
        "evidence_source": "Test Unrecognized Severity Source",
    }
    engine.repository.interactions_catalog.append(custom_rule)

    meds = [{"name": "Aspirin 81mg"}, {"name": "Atorvastatin 20mg"}]
    res = engine.evaluate(medications=meds)

    # Must NOT invent a MAJOR severity
    target = next((f for f in res["findings"] if f["rule_id"] == "H4-DDI-TEST-UNK"), None)
    assert target is not None, "Test rule was not evaluated"
    assert target["severity"] == SeverityLevel.INSUFFICIENT_DATA.value
    assert target["review_status"] == ReviewStatus.INSUFFICIENT_DATA.value
    assert target["severity"] != SeverityLevel.MAJOR.value

