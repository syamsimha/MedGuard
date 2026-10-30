"""Clinical Safety Rules and Evaluation Data Structures.

Defines verified clinical rule schemas, finding structures, and repository loaders
supporting both bundled clinical references and seamless, verified ingestion of the
official H4 dataset CSV tables.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
import json
from pathlib import Path

from .h4_loader import H4DatasetLoader, H4DatasetError, H4ParsedCatalog


class SeverityLevel(str, Enum):
    """Clinical risk severity levels ranked by acuity."""
    CONTRAINDICATED = "CONTRAINDICATED"
    MAJOR = "MAJOR"
    MODERATE = "MODERATE"
    MINOR = "MINOR"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

    def rank(self) -> int:
        """Returns integer rank for severity filtering (higher = more severe)."""
        ranks = {
            SeverityLevel.INSUFFICIENT_DATA: 0,
            SeverityLevel.MINOR: 1,
            SeverityLevel.MODERATE: 2,
            SeverityLevel.MAJOR: 3,
            SeverityLevel.CONTRAINDICATED: 4,
        }
        return ranks.get(self, 0)


class FindingCategory(str, Enum):
    """Classification of safety alert findings."""
    DRUG_DRUG_INTERACTION = "DRUG_DRUG_INTERACTION"
    DUPLICATE_THERAPY = "DUPLICATE_THERAPY"
    RENAL_SAFETY = "RENAL_SAFETY"
    CONTRAINDICATION = "CONTRAINDICATION"
    DATA_GAP = "DATA_GAP"


class ReviewStatus(str, Enum):
    """Clinical workflow review status."""
    CONFIRMED_HAZARD = "CONFIRMED_HAZARD"
    REQUIRES_CLINICAL_REVIEW = "REQUIRES_CLINICAL_REVIEW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    VERIFIED_SAFE = "VERIFIED_SAFE"


@dataclass
class RuleFinding:
    """Structured, explainable clinical safety finding."""
    rule_id: str
    category: FindingCategory
    severity: SeverityLevel
    drugs_involved: List[str]
    reason: str
    evidence_source: str
    review_status: ReviewStatus

    def to_dict(self) -> Dict[str, Any]:
        """Serializes finding to plain dictionary."""
        return {
            "rule_id": self.rule_id,
            "category": self.category.value,
            "severity": self.severity.value,
            "drugs_involved": self.drugs_involved,
            "reason": self.reason,
            "evidence_source": self.evidence_source,
            "review_status": self.review_status.value
        }


@dataclass
class EngineConfig:
    """Configuration options for the medication safety engine."""
    min_severity_report: SeverityLevel = SeverityLevel.MINOR
    check_ddi: bool = True
    check_duplicates: bool = True
    check_renal: bool = True
    check_contraindications: bool = True
    check_unrecognized_drugs: bool = True
    external_dataset_path: Optional[str] = None
    h4_eval_mode: bool = False


class SafetyRuleRepository:
    """Loads and caches verified clinical reference datasets with robust H4 CSV ingestion."""

    def __init__(self, data_dir: Optional[Path] = None, external_dataset_path: Optional[str] = None):
        if data_dir is None:
            data_dir = Path(__file__).resolve().parent / "data"
        self.bundled_data_dir = Path(data_dir).resolve()
        self.data_dir = self.bundled_data_dir

        self.drugs_catalog: Dict[str, Any] = {}
        self.interactions_catalog: List[Dict[str, Any]] = []
        self.renal_rules: List[Dict[str, Any]] = []
        self.condition_contraindications: List[Dict[str, Any]] = []
        self.allergy_contraindications: List[Dict[str, Any]] = []
        self.duplicate_groups: Dict[str, Dict[str, Any]] = {}
        self.conditions_registry: Dict[str, Dict[str, Any]] = {}
        self.resolution_map: Dict[str, str] = {}

        # Dataset provenance metadata
        self.dataset_mode: str = "BUNDLED_REFERENCE"
        self.external_dataset_found: bool = False
        self.external_dataset_loaded: bool = False
        self.dataset_status_message: str = ""
        self.h4_catalog: Optional[H4ParsedCatalog] = None

        # 1. Pre-load bundled reference as safe baseline fallback
        self.load_bundled()

        # 2. Attempt discovery and ingestion of official H4 CSV dataset
        self._discover_and_load_h4(external_dataset_path)

    def load_bundled(self) -> None:
        """Loads bundled JSON reference tables."""
        drugs_file = self.bundled_data_dir / "drugs.json"
        if drugs_file.exists():
            with open(drugs_file, "r", encoding="utf-8") as f:
                self.drugs_catalog = json.load(f)

        ddi_file = self.bundled_data_dir / "interactions.json"
        if ddi_file.exists():
            with open(ddi_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.interactions_catalog = data.get("interactions", [])

        renal_file = self.bundled_data_dir / "renal_rules.json"
        if renal_file.exists():
            with open(renal_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.renal_rules = data.get("rules", [])

        ci_file = self.bundled_data_dir / "contraindications.json"
        if ci_file.exists():
            with open(ci_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.condition_contraindications = data.get("condition_contraindications", [])
                self.allergy_contraindications = data.get("allergy_contraindications", [])

    def _discover_and_load_h4(self, explicit_path: Optional[str] = None) -> None:
        """Discovers, validates, and ingests H4 CSV dataset without mixing incomplete data with fallback."""
        if explicit_path == "BUNDLED":
            self.dataset_mode = "BUNDLED_REFERENCE"
            self.external_dataset_found = False
            self.external_dataset_loaded = False
            self.dataset_status_message = (
                "Explicitly configured for BUNDLED_REFERENCE mode. Using packaged clinical reference tables."
            )
            return

        candidate_roots: List[Path] = []
        if explicit_path:
            candidate_roots.append(Path(explicit_path))
        else:
            base = Path(__file__).resolve()
            candidate_roots.extend([
                Path.cwd() / "H4_Dataset",
                base.parents[2] / "H4_Dataset",  # MedGuard/H4_Dataset
                base.parents[1] / "H4_Dataset",  # MedGuard/FULL_CODE/H4_Dataset
                base.parent / "H4_Dataset",       # MedGuard/FULL_CODE/pipeline/H4_Dataset
            ])

        resolved_data_dir: Optional[Path] = None
        for cand in candidate_roots:
            try:
                res = H4DatasetLoader.resolve_data_directory(cand)
                if res:
                    resolved_data_dir = res
                    break
            except Exception:
                continue

        if not resolved_data_dir:
            self.external_dataset_found = False
            self.external_dataset_loaded = False
            self.dataset_mode = "BUNDLED_REFERENCE"
            if explicit_path:
                self.dataset_status_message = (
                    f"Configured H4 dataset path '{explicit_path}' not found or invalid. "
                    "Fell back to BUNDLED_REFERENCE mode using verified clinical pharmacology knowledgebase."
                )
            else:
                self.dataset_status_message = (
                    "Official H4 dataset not located in repository search paths. "
                    "Operating in BUNDLED_REFERENCE mode using verified clinical pharmacology knowledgebase."
                )
            return

        self.external_dataset_found = True
        try:
            loader = H4DatasetLoader(resolved_data_dir)
            catalog = loader.load_all()

            # Incorporate verified H4 reference tables
            self.drugs_catalog = catalog.drugs_catalog
            self.interactions_catalog = catalog.interactions_catalog
            self.renal_rules = catalog.renal_rules
            self.condition_contraindications = catalog.condition_contraindications
            self.allergy_contraindications = catalog.allergy_contraindications
            self.duplicate_groups = catalog.duplicate_groups
            self.conditions_registry = catalog.conditions_registry
            self.resolution_map = getattr(catalog, "resolution_map", {})
            self.h4_catalog = catalog

            self.data_dir = resolved_data_dir
            self.dataset_mode = "EXTERNAL_H4"
            self.external_dataset_loaded = True
            self.dataset_status_message = (
                f"Official H4 dataset successfully verified and loaded from: {resolved_data_dir} "
                f"({catalog.total_records_parsed} reference records across 7 files)"
            )
        except Exception as exc:
            # Fallback remains pure bundled data - never mix incomplete data
            self.load_bundled()
            self.external_dataset_loaded = False
            self.dataset_mode = "BUNDLED_REFERENCE"
            self.dataset_status_message = (
                f"H4 dataset candidate found at {resolved_data_dir} but failed validation: {exc}. "
                "Fell back to BUNDLED_REFERENCE mode to preserve clinical integrity."
            )

    def load_external_dataset_if_present(self, external_path: Optional[str] = None) -> bool:
        """Explicitly re-triggers external dataset loading."""
        self._discover_and_load_h4(external_path)
        return self.external_dataset_loaded

    def get_dataset_info(self) -> Dict[str, Any]:
        """Returns structured metadata regarding the active clinical dataset."""
        file_counts = self.h4_catalog.file_record_counts if self.h4_catalog else {}
        return {
            "dataset_mode": self.dataset_mode,
            "external_dataset_found": self.external_dataset_found,
            "external_dataset_loaded": self.external_dataset_loaded,
            "dataset_status_message": self.dataset_status_message,
            "active_catalog_path": str(self.data_dir.resolve()),
            "file_record_counts": file_counts,
        }
