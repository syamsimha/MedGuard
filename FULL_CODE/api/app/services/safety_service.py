"""Safety service wrapper for FastAPI application."""
import sys
from pathlib import Path
from typing import Dict, Any, List

# Ensure pipeline directory is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.safety_engine import MedicationSafetyEngine
from pipeline.rules import EngineConfig, SeverityLevel


class SafetyService:
    """Service layer coordinating medication safety evaluations."""

    def __init__(self):
        self.engine = MedicationSafetyEngine()

    def check_safety(
        self,
        medications: List[Dict[str, Any]],
        patient: Dict[str, Any],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Runs the safety validation engine."""
        min_sev_str = options.get("min_severity", "MINOR").upper()
        min_sev = SeverityLevel[min_sev_str] if min_sev_str in SeverityLevel.__members__ else SeverityLevel.MINOR

        config = EngineConfig(
            min_severity_report=min_sev,
            check_ddi=options.get("check_ddi", True),
            check_duplicates=options.get("check_duplicates", True),
            check_renal=options.get("check_renal", True),
            check_contraindications=options.get("check_contraindications", True),
        )

        return self.engine.evaluate(
            medications=medications,
            patient_profile=patient,
            override_config=config
        )

    def get_registered_rules(self) -> Dict[str, Any]:
        """Returns indexed clinical rules, reference sources, and dataset discovery metadata."""
        return {
            "total_drugs_indexed": len(self.engine.repository.drugs_catalog.get("drugs", {})),
            "total_interaction_rules": len(self.engine.repository.interactions_catalog),
            "total_renal_rules": len(self.engine.repository.renal_rules),
            "total_condition_contraindications": len(self.engine.repository.condition_contraindications),
            "total_allergy_contraindications": len(self.engine.repository.allergy_contraindications),
            "total_duplicate_groups": len(self.engine.repository.duplicate_groups),
            "dataset_info": self.engine.repository.get_dataset_info(),
            "knowledge_sources": [
                "H4 Curated Drug Reference Formulary (drug_reference.csv, combination_brands.csv)",
                "H4 Curated Drug-Drug Interaction Matrix (interactions.csv)",
                "H4 Kidney Function Dosage Adjustment Protocol (renal_rules.csv)",
                "H4 Duplicate Therapy Classification (duplicate_therapy_groups.csv)",
                "H4 Clinical Contraindications & Allergy Registry (drug_disease_contraindications.csv, conditions.csv)",
                "FDA Orange Book, Prescribing Information, and KDIGO Guidelines (Bundled Reference Fallback)"
            ]
        }


# Singleton service instance
safety_service = SafetyService()
