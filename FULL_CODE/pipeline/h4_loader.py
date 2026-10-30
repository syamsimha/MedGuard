"""H4 Dataset CSV Ingestion Adapter.

Parses official TalentAP Mega Hackathon 2026 (H4 Track) clinical reference tables:
- drug_reference.csv (496 drugs)
- combination_brands.csv (98 combination brand strength rows)
- interactions.csv (2,196 interaction pairs)
- renal_rules.csv (169 renal rules across 136 drugs)
- duplicate_therapy_groups.csv (74 therapeutic duplication groups)
- drug_disease_contraindications.csv (152 clinical contraindications)
- conditions.csv (58 condition definitions across diagnoses, allergies, pregnancy)
"""
from __future__ import annotations

import csv
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

REQUIRED_H4_FILES = {
    "drug_reference.csv",
    "combination_brands.csv",
    "interactions.csv",
    "renal_rules.csv",
    "duplicate_therapy_groups.csv",
    "drug_disease_contraindications.csv",
    "conditions.csv",
}

VALID_SEVERITIES = {"contraindicated", "major", "moderate", "minor"}


class H4DatasetError(Exception):
    """Raised when the H4 dataset directory is missing required files or has invalid schema."""


@dataclass
class H4ParsedCatalog:
    """Holds parsed and normalized in-memory clinical reference tables from H4."""
    drugs_catalog: Dict[str, Any]
    interactions_catalog: List[Dict[str, Any]]
    renal_rules: List[Dict[str, Any]]
    condition_contraindications: List[Dict[str, Any]]
    allergy_contraindications: List[Dict[str, Any]]
    duplicate_groups: Dict[str, Dict[str, Any]]
    conditions_registry: Dict[str, Dict[str, Any]]
    total_records_parsed: int = 0
    file_record_counts: Dict[str, int] = field(default_factory=dict)
    resolution_map: Dict[str, str] = field(default_factory=dict)


class H4DatasetLoader:
    """Loads and validates official H4 CSV reference datasets."""

    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir).resolve()

    @classmethod
    def resolve_data_directory(cls, candidate_dir: Path) -> Optional[Path]:
        """Resolves the folder containing the actual CSV data files."""
        candidate = candidate_dir.resolve()
        # Direct check
        if (candidate / "drug_reference.csv").exists():
            return candidate
        # Check data/ subfolder
        sub_data = candidate / "data"
        if sub_data.is_dir() and (sub_data / "drug_reference.csv").exists():
            return sub_data
        return None

    def validate_presence(self) -> None:
        """Verifies all required reference CSV files are present."""
        if not self.data_dir.is_dir():
            raise H4DatasetError(f"H4 data directory does not exist: {self.data_dir}")

        missing = [f for f in REQUIRED_H4_FILES if not (self.data_dir / f).exists()]
        if missing:
            raise H4DatasetError(
                f"H4 dataset directory at {self.data_dir} is missing required reference files: {missing}"
            )

    def load_all(self) -> H4ParsedCatalog:
        """Parses all required H4 CSV files into structured clinical reference objects."""
        self.validate_presence()
        file_counts: Dict[str, int] = {}

        # 1. Parse conditions.csv
        conditions_registry, count_cond = self._load_conditions()
        file_counts["conditions.csv"] = count_cond

        # 2. Parse drug_reference.csv
        drugs_catalog, count_drugs = self._load_drug_reference()
        file_counts["drug_reference.csv"] = count_drugs

        # 3. Parse combination_brands.csv and merge into drugs_catalog
        count_combos = self._merge_combination_brands(drugs_catalog)
        file_counts["combination_brands.csv"] = count_combos

        # 4. Parse interactions.csv
        interactions_catalog, count_ddi = self._load_interactions()
        file_counts["interactions.csv"] = count_ddi

        # 5. Parse renal_rules.csv
        renal_rules, count_renal = self._load_renal_rules()
        file_counts["renal_rules.csv"] = count_renal

        # 6. Parse duplicate_therapy_groups.csv
        dup_groups, count_dups = self._load_duplicate_groups()
        file_counts["duplicate_therapy_groups.csv"] = count_dups

        # 7. Parse drug_disease_contraindications.csv and add pregnancy categories
        cond_cis, allergy_cis, count_cis = self._load_contraindications(conditions_registry, drugs_catalog)
        file_counts["drug_disease_contraindications.csv"] = count_cis

        # Optional: Parse train_resolution.csv if present
        resolution_map = self._load_train_resolution()

        total_parsed = sum(file_counts.values())

        return H4ParsedCatalog(
            drugs_catalog={"version": "1.0.0-H4", "drugs": drugs_catalog},
            interactions_catalog=interactions_catalog,
            renal_rules=renal_rules,
            condition_contraindications=cond_cis,
            allergy_contraindications=allergy_cis,
            duplicate_groups=dup_groups,
            conditions_registry=conditions_registry,
            total_records_parsed=total_parsed,
            file_record_counts=file_counts,
            resolution_map=resolution_map,
        )

    def _load_train_resolution(self) -> Dict[str, str]:
        path = self.data_dir / "train_resolution.csv"
        res_map: Dict[str, str] = {}
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    tok = row.get("written_token", "").strip().lower()
                    gen = row.get("resolved_generic", "").strip().lower()
                    if tok:
                        res_map[tok] = gen
        return res_map

    def _load_conditions(self) -> Tuple[Dict[str, Dict[str, Any]], int]:
        registry: Dict[str, Dict[str, Any]] = {}
        path = self.data_dir / "conditions.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row["condition_id"].strip().lower()
                examples = [e.strip().lower() for e in row.get("example_terms", "").split(";") if e.strip()]
                registry[cid] = {
                    "condition_id": cid,
                    "condition_name": row["condition_name"].strip(),
                    "kind": row["kind"].strip().lower(),
                    "description": row.get("description", "").strip(),
                    "example_terms": examples,
                }
                count += 1
        return registry, count

    def _load_drug_reference(self) -> Tuple[Dict[str, Any], int]:
        drugs: Dict[str, Any] = {}
        path = self.data_dir / "drug_reference.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                generic = row["generic_name"].strip().lower()
                brands = [b.strip().lower() for b in row.get("common_brands", "").split(";") if b.strip()]
                dose_forms = [d.strip().lower() for d in row.get("dose_forms", "").split(";") if d.strip()]
                max_dose = None
                if row.get("max_daily_dose_mg"):
                    try:
                        max_dose = float(row["max_daily_dose_mg"])
                    except ValueError:
                        max_dose = None

                drugs[generic] = {
                    "drug_id": row.get("drug_id", "").strip(),
                    "generic_name": generic,
                    "brand_names": brands,
                    "active_ingredients": [generic],
                    "drug_class": row.get("drug_class", "").strip(),
                    "therapeutic_group": row.get("therapeutic_group", "").strip(),
                    "duplicate_group": row.get("duplicate_group", "").strip().lower() or None,
                    "dose_forms": dose_forms,
                    "usual_adult_daily_dose_range": row.get("usual_adult_daily_dose_range", "").strip(),
                    "max_daily_dose_mg": max_dose,
                    "renal_adjustment_flag": row.get("renal_adjustment_flag", "N").strip().upper(),
                    "pregnancy_category": row.get("pregnancy_category", "N").strip().upper(),
                    "notes": row.get("notes", "").strip(),
                }
                count += 1
        return drugs, count

    def _merge_combination_brands(self, drugs: Dict[str, Any]) -> int:
        path = self.data_dir / "combination_brands.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                brand = row["brand_name"].strip().lower()
                components = [c.strip().lower() for c in row["generic_components"].split(";") if c.strip()]
                key = f"combo_{brand}"
                if key not in drugs:
                    drugs[key] = {
                        "generic_name": " + ".join(components),
                        "brand_names": [brand],
                        "active_ingredients": components,
                        "drug_class": "combination_product",
                        "components_text": row.get("components", "").strip(),
                    }
                else:
                    if brand not in drugs[key]["brand_names"]:
                        drugs[key]["brand_names"].append(brand)
                count += 1
        return count

    def _load_interactions(self) -> Tuple[List[Dict[str, Any]], int]:
        interactions: List[Dict[str, Any]] = []
        path = self.data_dir / "interactions.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=1):
                sev_raw = row["severity"].strip().lower()
                is_recognized_sev = sev_raw in VALID_SEVERITIES
                sev = sev_raw.upper() if is_recognized_sev else "INSUFFICIENT_DATA"
                mechanism = row.get("mechanism_effect", "").strip()
                action = row.get("recommended_action", "").strip()
                if not is_recognized_sev:
                    note = f"[Unrecognized raw severity '{row.get('severity', '')}'; classified as INSUFFICIENT_DATA pending clinical review]"
                    mechanism = f"{mechanism} {note}".strip() if mechanism else note

                interactions.append({
                    "rule_id": f"H4-DDI-{idx:04d}",
                    "drug_a": row["drug_a"].strip().lower(),
                    "drug_b": row["drug_b"].strip().lower(),
                    "severity": sev,
                    "mechanism": mechanism,
                    "recommended_action": action,
                    "evidence_source": "H4 Official Interaction Reference (interactions.csv)",
                })
                count += 1
        return interactions, count

    def _load_renal_rules(self) -> Tuple[List[Dict[str, Any]], int]:
        """Loads renal rules and aggregates multiple eGFR tiers per generic drug."""
        raw_by_drug: Dict[str, List[Dict[str, Any]]] = {}
        path = self.data_dir / "renal_rules.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                generic = row["generic_name"].strip().lower()
                try:
                    threshold = float(row["egfr_below"])
                except ValueError:
                    continue

                sev_raw = row["severity"].strip().lower()
                is_recognized_sev = sev_raw in VALID_SEVERITIES
                sev = sev_raw.upper() if is_recognized_sev else "INSUFFICIENT_DATA"
                action = row.get("recommended_action", "").strip()
                if not is_recognized_sev:
                    action = f"{action} [Unrecognized raw severity '{row.get('severity', '')}'; classified as INSUFFICIENT_DATA pending clinical review]".strip()

                raw_by_drug.setdefault(generic, []).append({
                    "max_val": threshold,
                    "severity": sev,
                    "action": action,
                })
                count += 1

        renal_rules: List[Dict[str, Any]] = []
        for idx, (drug, tiers) in enumerate(raw_by_drug.items(), start=1):
            # Sort tiers strictly by threshold ascending
            tiers.sort(key=lambda t: t["max_val"])
            rule_thresholds = []
            for t in tiers:
                rule_thresholds.append({
                    "min_val": 0.001,
                    "max_val": t["max_val"],
                    "inclusive_max": False,  # eGFR < threshold
                    "severity": t["severity"],
                    "reason": t["action"],
                    "evidence_source": "H4 Official Renal Rules Reference (renal_rules.csv)",
                })

            renal_rules.append({
                "rule_id": f"H4-REN-{idx:04d}",
                "drug": drug,
                "marker": "egfr",
                "unit": "mL/min/1.73m2",
                "thresholds": rule_thresholds,
            })

        return renal_rules, count

    def _load_duplicate_groups(self) -> Tuple[Dict[str, Dict[str, Any]], int]:
        groups: Dict[str, Dict[str, Any]] = {}
        path = self.data_dir / "duplicate_therapy_groups.csv"
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                gid = row["duplicate_group"].strip().lower()
                members = [m.strip().lower() for m in row.get("member_generics", "").split(";") if m.strip()]
                sev_raw = row["severity"].strip().lower()
                sev = sev_raw.upper() if sev_raw in VALID_SEVERITIES else "MAJOR"

                groups[gid] = {
                    "duplicate_group": gid,
                    "group_name": row.get("group_name", "").strip(),
                    "severity": sev,
                    "recommended_action": row.get("recommended_action", "").strip(),
                    "member_generics": members,
                }
                count += 1
        return groups, count

    def _load_contraindications(
        self, conditions_reg: Dict[str, Dict[str, Any]], drugs_catalog: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], int]:
        cond_cis: List[Dict[str, Any]] = []
        allergy_cis: List[Dict[str, Any]] = []
        path = self.data_dir / "drug_disease_contraindications.csv"
        count = 0

        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=1):
                cid = row["condition_id"].strip().lower()
                generic = row["generic_name"].strip().lower()
                cname = row.get("condition_name", "").strip().lower()
                sev_raw = row["severity"].strip().lower()
                is_recognized_sev = sev_raw in VALID_SEVERITIES
                sev = sev_raw.upper() if is_recognized_sev else "INSUFFICIENT_DATA"
                reason = row.get("reason", "").strip()
                action = row.get("recommended_action", "").strip()
                full_reason = f"{reason} (Action: {action})" if action else reason
                if not is_recognized_sev:
                    full_reason = f"{full_reason} [Unrecognized raw severity '{row.get('severity', '')}'; classified as INSUFFICIENT_DATA pending clinical review]".strip()

                cond_meta = conditions_reg.get(cid, {})
                kind = cond_meta.get("kind", "diagnosis")

                rule_entry = {
                    "rule_id": f"H4-CI-{idx:04d}",
                    "drug": generic,
                    "condition_id": cid,
                    "severity": sev,
                    "reason": full_reason,
                    "evidence_source": "H4 Official Contraindications Reference (drug_disease_contraindications.csv)",
                }

                if kind == "allergy":
                    # Allergy contraindication
                    rule_entry["allergens"] = [cid, cname] + cond_meta.get("example_terms", [])
                    allergy_cis.append(rule_entry)
                elif kind == "pregnancy_field" or cid == "pregnancy":
                    # Pregnancy contraindication
                    rule_entry["conditions"] = ["pregnancy", "pregnant"]
                    cond_cis.append(rule_entry)
                else:
                    # Clinical diagnosis contraindication
                    rule_entry["conditions"] = [cid, cname] + cond_meta.get("example_terms", [])
                    cond_cis.append(rule_entry)

                count += 1

        # Also incorporate Category X, D, C, and N pregnancy rules from drug_reference.csv
        if drugs_catalog:
            p_idx = 1
            for generic, meta in drugs_catalog.items():
                p_cat = meta.get("pregnancy_category", "N")
                if p_cat == "X":
                    cond_cis.append({
                        "rule_id": f"H4-PREG-X-{p_idx:03d}",
                        "drug": generic,
                        "condition_id": "pregnancy",
                        "conditions": ["pregnancy", "pregnant"],
                        "severity": "CONTRAINDICATED",
                        "reason": f"FDA Pregnancy Category X: Documented human fetal abnormalities; contraindicated in pregnancy.",
                        "evidence_source": "H4 Official Drug Reference (drug_reference.csv pregnancy_category)",
                    })
                    p_idx += 1
                elif p_cat == "D":
                    cond_cis.append({
                        "rule_id": f"H4-PREG-D-{p_idx:03d}",
                        "drug": generic,
                        "condition_id": "pregnancy",
                        "conditions": ["pregnancy", "pregnant"],
                        "severity": "MAJOR",
                        "reason": f"FDA Pregnancy Category D: Positive evidence of human fetal risk; avoid in pregnancy unless potential benefit outweighs severe risk.",
                        "evidence_source": "H4 Official Drug Reference (drug_reference.csv pregnancy_category)",
                    })
                    p_idx += 1
                elif p_cat == "C":
                    cond_cis.append({
                        "rule_id": f"H4-PREG-C-{p_idx:03d}",
                        "drug": generic,
                        "condition_id": "pregnancy",
                        "conditions": ["pregnancy", "pregnant"],
                        "severity": "MODERATE",
                        "reason": (
                            "FDA Pregnancy Category C: Animal reproduction studies have demonstrated adverse fetal effects "
                            "or adequate human studies are lacking; fetal risk cannot be ruled out. Clinical risk-benefit "
                            "assessment required before administration."
                        ),
                        "evidence_source": "H4 Official Drug Reference (drug_reference.csv pregnancy_category)",
                    })
                    p_idx += 1
                elif p_cat == "N":
                    cond_cis.append({
                        "rule_id": f"H4-PREG-N-{p_idx:03d}",
                        "drug": generic,
                        "condition_id": "pregnancy",
                        "conditions": ["pregnancy", "pregnant"],
                        "severity": "INSUFFICIENT_DATA",
                        "reason": (
                            "Pregnancy Category N: Medication has unclassified pregnancy safety status in clinical reference "
                            "formulary. Fetal risk cannot be determined from available data; caution required."
                        ),
                        "evidence_source": "H4 Official Drug Reference (drug_reference.csv pregnancy_category)",
                    })
                    p_idx += 1

        return cond_cis, allergy_cis, count
