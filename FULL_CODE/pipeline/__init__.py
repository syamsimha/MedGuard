"""MedGuard Safety Intelligence Pipeline Module.

Provides clinical decision support components:
- Medication normalization & brand mapping
- Multi-drug interaction screening
- Active-ingredient & therapeutic class duplicate detection
- Renal dosage threshold evaluation
- Condition, pregnancy, & allergy contraindication verification
- Official H4 CSV dataset ingestion adapter
"""

from .normalizer import MedicationNormalizer, NormalizedMedication
from .rules import (
    SeverityLevel,
    FindingCategory,
    ReviewStatus,
    RuleFinding,
    EngineConfig,
    SafetyRuleRepository,
)
from .safety_engine import MedicationSafetyEngine
from .h4_loader import H4DatasetLoader, H4DatasetError, H4ParsedCatalog

__all__ = [
    "MedicationSafetyEngine",
    "MedicationNormalizer",
    "NormalizedMedication",
    "SeverityLevel",
    "FindingCategory",
    "ReviewStatus",
    "RuleFinding",
    "EngineConfig",
    "SafetyRuleRepository",
    "H4DatasetLoader",
    "H4DatasetError",
    "H4ParsedCatalog",
]
