"""Medication Safety Intelligence Engine.

Implements clinical second-look validation:
- Bidirectional drug interaction cross-examination with active-pair deduplication
- Exact, active-ingredient, and therapeutic group duplicate detection
- Validated renal dosage evaluation with biomarker sanity checking
- Condition, pregnancy, and allergy contraindication verification
- Missing reference and clinical data gap accounting
- Qualified status reporting preventing negative proof fallacies
- High-precision official H4 competition regimen evaluation
"""
import math
import re
from itertools import combinations
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any, Set, Tuple

from .normalizer import MedicationNormalizer, NormalizedMedication, STOPPED_PATTERN
from .rules import (
    SeverityLevel,
    FindingCategory,
    ReviewStatus,
    RuleFinding,
    EngineConfig,
    SafetyRuleRepository,
)

# Verified clinical regex patterns for conditions & allergies
CLINICAL_CONDITION_PATTERNS = {
    "asthma": re.compile(r"\b(ba|asthma|asthmma|reactive airway|bronchial asthma)\b", re.I),
    "heart_failure": re.compile(r"\b(chf|hfref|hfpeef|hfpef|heart failure|heart falure|caridac failure|cardiac failure|lvef|ef\s*\d+|ccf|dcmp|lv dysfunction|\bhf\b)\b", re.I),
    "peptic_ulcer": re.compile(r"\b(pud|peptic ulcer|gi bleed|ugi bleed|duodenal ulcer|gastric ulcer|mlena|melena|bleeding du|\bdu\b|ulcer stomach|stomach ulcer)\b", re.I),
    "chronic_liver_disease": re.compile(r"\b(cld|cirrhosis|cirrhoosis|cirrgosis|cirrrhosis|liver cirrhosis|chronic liver|alcoholic liver|liver disease|hepatitis\s*-\s*cirrhotic)\b", re.I),
    "gout": re.compile(r"\b(gout|gouty|hyp[e]*ruric[ae]*mia)\b", re.I),
    "dementia": re.compile(r"\b(dementia|demntia|cognitive decline|memory loss)\b", re.I),
    "epilepsy": re.compile(r"\b(epilep|seizure|convuls|fits)\b", re.I),
    "parkinsons": re.compile(r"\b(parkinson|paralysis agitans|\bpd\b)\b", re.I),
    "angle_closure_glaucoma": re.compile(r"\b(angle[- ]closure|pacg|narrow angle)\b", re.I),
    "g6pd_deficiency": re.compile(r"\b(g6pd|g-6-pd)\b", re.I),
    "myasthenia_gravis": re.compile(r"\b(myasthenia|\bmg\b)\b", re.I),
}

ALLERGY_PATTERNS = {
    "penicillin_allergy": re.compile(r"\b(penicillin|pcn|amoxicillin|ampicillin)\b", re.I),
    "sulfonamide_allergy": re.compile(r"\b(sulfa|sulpha|sulphonamide|sulfonamide|septran|co-trimoxazole|bactrim)\b", re.I),
    "nsaid_hypersensitivity": re.compile(r"\b(nsaid|aspirin|brufen|painkiller|diclofenac|asa sensitive)\b", re.I),
}


class MedicationSafetyEngine:
    """Core clinical safety engine executing multi-point medication validation."""

    VERSION = "1.3.0"
    DISCLAIMER = (
        "MedGuard safety findings provide clinical decision support intelligence for licensed "
        "healthcare professionals based strictly on indexed reference rules. MedGuard does not "
        "autonomously alter, withhold, or discontinue any medication. Absence of an alert does "
        "not certify clinical safety."
    )

    def __init__(
        self,
        repository: Optional[SafetyRuleRepository] = None,
        config: Optional[EngineConfig] = None,
    ):
        self.config = config or EngineConfig()
        self.repository = repository or SafetyRuleRepository(
            external_dataset_path=self.config.external_dataset_path
        )
        self.normalizer = MedicationNormalizer(
            self.repository.drugs_catalog,
            resolution_dataset=getattr(self.repository, "resolution_map", None),
        )
        self._init_lookup_indices()

    def _init_lookup_indices(self) -> None:
        """Initializes fast, bidirectional indexed lookup dictionaries for clinical rules."""
        # 1. Bidirectional DDI map
        self._ddi_index: Dict[Tuple[str, str], Dict[str, Any]] = {}
        for rule in self.repository.interactions_catalog:
            d_a = rule.get("drug_a", "").lower().strip()
            d_b = rule.get("drug_b", "").lower().strip()
            if d_a and d_b:
                pair_key = tuple(sorted([d_a, d_b]))
                self._ddi_index[pair_key] = rule
        self._ddi_catalog_len = len(self.repository.interactions_catalog)

        # 2. Renal rules indexed by generic drug name
        self._renal_by_drug: Dict[str, List[Dict[str, Any]]] = {}
        for rrule in self.repository.renal_rules:
            drug = rrule.get("drug", "").lower().strip()
            if drug:
                for tier in rrule.get("thresholds", []):
                    self._renal_by_drug.setdefault(drug, []).append({
                        "max_val": tier.get("max_val", 999.0),
                        "severity": tier.get("severity", "MAJOR"),
                        "reason": tier.get("reason", "Renal dose adjustment required"),
                        "rule_id": rrule.get("rule_id", "RENAL"),
                    })

        # 3. Contraindications indexed by generic drug name
        self._ci_by_drug: Dict[str, List[Dict[str, Any]]] = {}
        for ci in self.repository.condition_contraindications:
            drug = ci.get("drug", "").lower().strip()
            if drug:
                self._ci_by_drug.setdefault(drug, []).append(ci)
        for ai in self.repository.allergy_contraindications:
            drug = ai.get("drug", "").lower().strip()
            if drug:
                self._ci_by_drug.setdefault(drug, []).append(ai)

        # 4. Duplicate group membership & pregnancy category mappings
        self._drug_to_dup_group: Dict[str, str] = {}
        self._drug_to_preg_cat: Dict[str, str] = {}
        for gen_name, meta in self.repository.drugs_catalog.get("drugs", {}).items():
            g = gen_name.lower().strip()
            dup_grp = meta.get("duplicate_group")
            if dup_grp:
                self._drug_to_dup_group[g] = dup_grp.lower().strip()
            pcat = meta.get("pregnancy_category")
            if pcat:
                self._drug_to_preg_cat[g] = pcat.upper().strip()

        # Also map from duplicate_groups table member_generics
        for gid, grp in self.repository.duplicate_groups.items():
            for m in grp.get("member_generics", []):
                m_norm = m.lower().strip()
                if m_norm not in self._drug_to_dup_group:
                    self._drug_to_dup_group[m_norm] = gid.lower().strip()

    def evaluate(
        self,
        medications: List[Dict[str, Any]],
        patient_profile: Optional[Dict[str, Any]] = None,
        override_config: Optional[EngineConfig] = None,
    ) -> Dict[str, Any]:
        """Evaluates a list of prescribed medications against safety rules.

        Args:
            medications: List of medication dicts (e.g. [{"name": "Warfarin 5mg", "dosage": "5mg"}])
                         or strings.
            patient_profile: Optional clinical data: egfr, crcl, conditions, allergies, pregnant.
            override_config: Optional per-evaluation engine configuration.

        Returns:
            Structured clinical safety report with findings, summary, and check accounting.
        """
        cfg = override_config or self.config
        patient = patient_profile or {}
        findings: List[RuleFinding] = []

        # 1. Normalize all medication entities
        normalized_meds: List[NormalizedMedication] = []
        for item in medications:
            if isinstance(item, str):
                norm = self.normalizer.normalize(item)
            elif isinstance(item, dict):
                name = item.get("name") or item.get("medication_name", "")
                dose_val = item.get("dose_mg")
                if dose_val is None and "dosage" in item:
                    dose_val = MedicationNormalizer.extract_dose_mg(str(item["dosage"]))
                norm = self.normalizer.normalize(name, dose_override_mg=dose_val)
            else:
                norm = self.normalizer.normalize(str(item))
            normalized_meds.append(norm)

        # Active medications (excluding stopped / discontinued entries)
        active_meds = [m for m in normalized_meds if not getattr(m, "is_stopped", False)]

        # Track check accounting status
        unrecognized_count = sum(1 for m in active_meds if not m.is_recognized)
        renal_rules_required = False
        renal_check_status = "NOT_APPLICABLE_NO_RENAL_RULES_FOR_REGIMEN"

        # 2. Unknown / Unverified Medication Data Gap Check
        if cfg.check_unrecognized_drugs:
            for norm in active_meds:
                if not norm.is_recognized:
                    findings.append(
                        RuleFinding(
                            rule_id="DATA-UNK-001",
                            category=FindingCategory.DATA_GAP,
                            severity=SeverityLevel.INSUFFICIENT_DATA,
                            drugs_involved=[norm.original_name],
                            reason=(
                                f"Medication '{norm.original_name}' is not present in the verified "
                                "clinical reference database. Drug interactions, active ingredient duplications, "
                                "and renal safety checks cannot be certified."
                            ),
                            evidence_source="MedGuard Clinical Reference Registry: Unindexed Formulary Entity",
                            review_status=ReviewStatus.INSUFFICIENT_DATA,
                        )
                    )

        # 3. Duplicate Medication Detection (Exact, Active Ingredient, Therapeutic Group)
        if cfg.check_duplicates and len(active_meds) > 1:
            duplicate_findings = self._check_duplicates(active_meds)
            findings.extend(duplicate_findings)

        # 4. Bidirectional Drug-Drug Interaction Detection (with distinct pair deduplication)
        if cfg.check_ddi and len(active_meds) > 1:
            ddi_findings = self._check_ddi(active_meds)
            findings.extend(ddi_findings)

        # 5. Renal-Dose Safety Checks (with biological biomarker validation)
        if cfg.check_renal:
            renal_findings, renal_rules_required, renal_check_status = self._check_renal_safety(
                active_meds, patient
            )
            findings.extend(renal_findings)

        # 6. Patient Contraindication Checks (Conditions, Pregnancy, Allergies)
        if cfg.check_contraindications:
            ci_findings = self._check_contraindications(active_meds, patient)
            findings.extend(ci_findings)

        # 7. Filter findings by minimum reporting severity
        filtered_findings = [
            f for f in findings
            if f.severity == SeverityLevel.INSUFFICIENT_DATA
            or f.severity.rank() >= cfg.min_severity_report.rank()
        ]

        # 8. Compute qualified safety status and summary
        has_contraindicated = any(f.severity == SeverityLevel.CONTRAINDICATED for f in filtered_findings)
        has_major = any(f.severity == SeverityLevel.MAJOR for f in filtered_findings)
        has_moderate = any(f.severity == SeverityLevel.MODERATE for f in filtered_findings)
        has_minor = any(f.severity == SeverityLevel.MINOR for f in filtered_findings)
        has_data_gap = any(f.severity == SeverityLevel.INSUFFICIENT_DATA for f in filtered_findings)

        # Strict safety determination
        has_blocking_hazards = has_contraindicated or has_major
        is_safe = (not has_blocking_hazards) and (not has_data_gap) and (len(filtered_findings) == 0)

        # Qualified clinical status string
        if has_blocking_hazards:
            status = "CONTRAINDICATION_OR_MAJOR_HAZARD_IDENTIFIED"
        elif has_moderate or has_minor:
            status = "POTENTIAL_RISKS_IDENTIFIED"
        elif has_data_gap:
            status = "INSUFFICIENT_DATA_FOR_COMPLETE_EVALUATION"
        else:
            status = "NO_INDEXED_HAZARDS_IDENTIFIED"

        summary_counts = {
            "total_findings": len(filtered_findings),
            "contraindicated": sum(1 for f in filtered_findings if f.severity == SeverityLevel.CONTRAINDICATED),
            "major": sum(1 for f in filtered_findings if f.severity == SeverityLevel.MAJOR),
            "moderate": sum(1 for f in filtered_findings if f.severity == SeverityLevel.MODERATE),
            "minor": sum(1 for f in filtered_findings if f.severity == SeverityLevel.MINOR),
            "insufficient_data": sum(1 for f in filtered_findings if f.severity == SeverityLevel.INSUFFICIENT_DATA),
        }

        # Check accounting metadata
        is_pregnant = (
            patient.get("pregnant") in (True, "Y", "y", "yes", "YES")
            or "pregnancy" in [c.lower().strip() for c in (patient.get("conditions") or patient.get("diagnoses") or []) if isinstance(c, str)]
            or "pregnant" in [c.lower().strip() for c in (patient.get("conditions") or patient.get("diagnoses") or []) if isinstance(c, str)]
        )
        conditions_present = bool(patient.get("conditions")) or bool(patient.get("diagnoses")) or is_pregnant
        allergies_present = bool(patient.get("allergies"))

        checks_accounting = {
            "drug_interaction_check": "EVALUATED" if cfg.check_ddi else "SKIPPED",
            "duplicate_therapy_check": "EVALUATED" if cfg.check_duplicates else "SKIPPED",
            "renal_safety_check": renal_check_status if cfg.check_renal else "SKIPPED",
            "condition_contraindication_check": "EVALUATED" if conditions_present else "NO_CONDITIONS_RECORDED",
            "allergy_contraindication_check": "EVALUATED" if allergies_present else "NO_ALLERGIES_RECORDED",
            "pregnancy_safety_check": (
                "EVALUATED" if is_pregnant else "NOT_APPLICABLE_PATIENT_NOT_PREGNANT"
            ),
            "dose_ceiling_check": "NOT_EVALUATED_REQUIRES_CUMULATIVE_DAILY_SCHEDULE",
            "formulary_coverage": "FULL_COVERAGE" if unrecognized_count == 0 else "PARTIAL_UNVERIFIED_ENTITIES",
        }

        return {
            "is_safe": is_safe,
            "has_blocking_hazards": has_blocking_hazards,
            "status": status,
            "patient_ref": patient.get("patient_ref") or patient.get("patient_id") or patient.get("id"),
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "engine_version": self.VERSION,
            "disclaimer": self.DISCLAIMER,
            "dataset_info": self.repository.get_dataset_info(),
            "checks_accounting": checks_accounting,
            "summary": summary_counts,
            "findings": [f.to_dict() for f in filtered_findings],
        }

    def _check_duplicates(self, meds: List[NormalizedMedication]) -> List[RuleFinding]:
        """Detects exact duplicates, active ingredient duplicates, and therapeutic class duplications."""
        findings: List[RuleFinding] = []
        n = len(meds)
        reported_exact_or_active_pairs: Set[Tuple[int, int]] = set()

        # 1. Exact name duplication
        for i in range(n):
            for j in range(i + 1, n):
                m1 = meds[i]
                m2 = meds[j]
                if m1.clean_name and m1.clean_name == m2.clean_name:
                    findings.append(
                        RuleFinding(
                            rule_id="DUP-EXACT-001",
                            category=FindingCategory.DUPLICATE_THERAPY,
                            severity=SeverityLevel.MAJOR,
                            drugs_involved=[m1.original_name, m2.original_name],
                            reason=(
                                f"Duplicate prescription: '{m1.original_name}' is prescribed multiple times "
                                "within the same regimen. Poses acute risk of unintentional overdose."
                            ),
                            evidence_source="ISMP (Institute for Safe Medication Practices) Targeted Medication Safety Best Practices",
                            review_status=ReviewStatus.CONFIRMED_HAZARD,
                        )
                    )
                    reported_exact_or_active_pairs.add((i, j))

        # 2. Shared active ingredients (chemical moiety duplicate)
        for i in range(n):
            for j in range(i + 1, n):
                if (i, j) in reported_exact_or_active_pairs:
                    continue
                m1 = meds[i]
                m2 = meds[j]
                ings1 = set(ing.lower() for ing in (m1.active_ingredients or m1.resolved_generics))
                ings2 = set(ing.lower() for ing in (m2.active_ingredients or m2.resolved_generics))
                if ings1 and ings2:
                    shared = ings1.intersection(ings2)
                    if shared:
                        shared_str = ", ".join(sorted(shared))
                        first_shared = sorted(shared)[0]
                        grp_id = self._drug_to_dup_group.get(first_shared)
                        grp_meta = self.repository.duplicate_groups.get(grp_id, {}) if grp_id else {}
                        sev_str = grp_meta.get("severity", "MAJOR").upper()
                        sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.MAJOR
                        act = grp_meta.get("recommended_action") or f"Duplicate active ingredient: '{shared_str}'."

                        findings.append(
                            RuleFinding(
                                rule_id="DUP-ACT-001",
                                category=FindingCategory.DUPLICATE_THERAPY,
                                severity=sev,
                                drugs_involved=[m1.original_name, m2.original_name],
                                reason=(
                                    f"Duplicate active ingredient: '{m1.original_name}' and '{m2.original_name}' "
                                    f"both contain the active substance '{shared_str}'. Concurrent administration "
                                    f"risks severe cumulative toxicity. ({act})"
                                ),
                                evidence_source="FDA Safe Use Initiative: Combination Product Redundancy & Active Moiety Duplication",
                                review_status=ReviewStatus.CONFIRMED_HAZARD,
                            )
                        )
                        reported_exact_or_active_pairs.add((i, j))

        # 3. Therapeutic class duplication (from duplicate_therapy_groups.csv)
        emitted_grp_pairs: Set[Tuple[str, str]] = set()
        for i in range(n):
            for j in range(i + 1, n):
                if (i, j) in reported_exact_or_active_pairs:
                    continue
                m1 = meds[i]
                m2 = meds[j]
                ings1 = set(ing.lower() for ing in (m1.active_ingredients or m1.resolved_generics))
                if not ings1 and m1.generic_name:
                    ings1 = {m1.generic_name.lower()}
                ings2 = set(ing.lower() for ing in (m2.active_ingredients or m2.resolved_generics))
                if not ings2 and m2.generic_name:
                    ings2 = {m2.generic_name.lower()}

                for g1 in ings1:
                    for g2 in ings2:
                        if g1 == g2:
                            continue
                        grp1 = self._drug_to_dup_group.get(g1)
                        grp2 = self._drug_to_dup_group.get(g2)
                        if grp1 and grp1 == grp2:
                            grp_pair = tuple(sorted([g1, g2]))
                            if grp_pair in emitted_grp_pairs:
                                continue
                            emitted_grp_pairs.add(grp_pair)
                            grp = self.repository.duplicate_groups.get(grp1, {})
                            sev_str = grp.get("severity", "MAJOR").upper()
                            sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.MAJOR
                            action = grp.get("recommended_action", "Avoid concurrent duplicate therapy.")
                            findings.append(
                                RuleFinding(
                                    rule_id=f"DUP-GRP-{grp1.upper()}",
                                    category=FindingCategory.DUPLICATE_THERAPY,
                                    severity=sev,
                                    drugs_involved=[m1.original_name, m2.original_name],
                                    reason=(
                                        f"Duplicate therapeutic class ({grp.get('group_name', grp1)}): "
                                        f"'{m1.original_name}' and '{m2.original_name}' both belong to this class. "
                                        f"{action}"
                                    ),
                                    evidence_source="H4 Official Duplicate Therapy Reference (duplicate_therapy_groups.csv)",
                                    review_status=ReviewStatus.CONFIRMED_HAZARD,
                                )
                            )
        return findings

    def _check_ddi(self, meds: List[NormalizedMedication]) -> List[RuleFinding]:
        """Cross-examines all medication pairs against verified interaction data with active-pair deduplication."""
        if len(self.repository.interactions_catalog) != getattr(self, "_ddi_catalog_len", 0):
            self._init_lookup_indices()
        findings: List[RuleFinding] = []
        pairs = combinations(range(len(meds)), 2)
        emitted_pairs: Set[Tuple[str, str]] = set()

        for i, j in pairs:
            m1 = meds[i]
            m2 = meds[j]
            if not m1.is_recognized or not m2.is_recognized:
                continue

            targets_1 = {m1.generic_name.lower()} if m1.generic_name else set()
            targets_1.update(ing.lower() for ing in m1.active_ingredients)
            targets_1.update(g.lower() for g in getattr(m1, "resolved_generics", []))

            targets_2 = {m2.generic_name.lower()} if m2.generic_name else set()
            targets_2.update(ing.lower() for ing in m2.active_ingredients)
            targets_2.update(g.lower() for g in getattr(m2, "resolved_generics", []))

            for t1 in targets_1:
                for t2 in targets_2:
                    if t1 == t2:
                        continue
                    pair_key = tuple(sorted([t1, t2]))
                    if pair_key in emitted_pairs:
                        continue

                    rule = self._ddi_index.get(pair_key)
                    if not rule:
                        continue

                    emitted_pairs.add(pair_key)
                    rule_id = rule.get("rule_id", "DDI-000")
                    sev_str = rule.get("severity", "INSUFFICIENT_DATA").upper()
                    severity = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.INSUFFICIENT_DATA

                    reason_text = rule.get("mechanism") or rule.get("recommended_action") or "Verified clinical drug interaction hazard."
                    if rule.get("recommended_action") and rule.get("mechanism"):
                        reason_text = f"{rule['mechanism']} (Action: {rule['recommended_action']})"

                    if severity in (SeverityLevel.CONTRAINDICATED, SeverityLevel.MAJOR):
                        review_status = ReviewStatus.CONFIRMED_HAZARD
                    elif severity == SeverityLevel.INSUFFICIENT_DATA:
                        review_status = ReviewStatus.INSUFFICIENT_DATA
                    else:
                        review_status = ReviewStatus.REQUIRES_CLINICAL_REVIEW

                    findings.append(
                        RuleFinding(
                            rule_id=rule_id,
                            category=FindingCategory.DRUG_DRUG_INTERACTION,
                            severity=severity,
                            drugs_involved=[m1.original_name, m2.original_name],
                            reason=reason_text,
                            evidence_source=rule.get("evidence_source", "Clinical Drug Interaction Reference"),
                            review_status=review_status,
                        )
                    )
        return findings

    def _check_renal_safety(
        self, meds: List[NormalizedMedication], patient: Dict[str, Any]
    ) -> Tuple[List[RuleFinding], bool, str]:
        """Evaluates renal dose safety with biomarker validation."""
        findings: List[RuleFinding] = []
        egfr = patient.get("egfr") if "egfr" in patient else patient.get("egfr_ml_min_1_73m2")
        crcl = patient.get("crcl")
        renal_rules_required = False
        all_markers_valid = True

        for med in meds:
            if not med.is_recognized:
                continue

            target_drugs = {med.generic_name.lower()} if med.generic_name else set()
            target_drugs.update(ing.lower() for ing in med.active_ingredients)
            target_drugs.update(g.lower() for g in getattr(med, "resolved_generics", []))

            matching_rules = [
                r for r in self.repository.renal_rules
                if r.get("drug", "").lower() in target_drugs
            ]
            if matching_rules:
                renal_rules_required = True

            for rrule in matching_rules:
                marker_type = rrule.get("marker", "egfr").lower()
                marker_val = egfr if marker_type == "egfr" else crcl

                if marker_val is None or marker_val == "":
                    all_markers_valid = False
                    if not self.config.h4_eval_mode:
                        findings.append(
                            RuleFinding(
                                rule_id=f"DATA-{rrule.get('rule_id', 'RENAL')}-GAP",
                                category=FindingCategory.DATA_GAP,
                                severity=SeverityLevel.INSUFFICIENT_DATA,
                                drugs_involved=[med.original_name],
                                reason=(
                                    f"Medication '{med.original_name}' requires kidney-function verification "
                                    f"({marker_type.upper()}), but patient clinical lab data lacks this marker. "
                                    "Renal safety cannot be certified without validated lab measurements."
                                ),
                                evidence_source=rrule.get("evidence_source", "FDA/H4 Renal Dosing Safety Guidelines"),
                                review_status=ReviewStatus.INSUFFICIENT_DATA,
                            )
                        )
                    continue

                is_valid_biomarker = False
                val: float = 0.0
                try:
                    val = float(marker_val)
                    if (not math.isnan(val)) and (not math.isinf(val)) and (0.0 < val <= 300.0):
                        is_valid_biomarker = True
                except (ValueError, TypeError):
                    is_valid_biomarker = False

                if not is_valid_biomarker:
                    all_markers_valid = False
                    findings.append(
                        RuleFinding(
                            rule_id=f"DATA-{rrule.get('rule_id', 'RENAL')}-INVALID-BIOMARKER",
                            category=FindingCategory.DATA_GAP,
                            severity=SeverityLevel.INSUFFICIENT_DATA,
                            drugs_involved=[med.original_name],
                            reason=(
                                f"Provided patient {marker_type.upper()} value ('{marker_val}') is biologically "
                                "invalid or out-of-range (must be a finite positive number <= 300 mL/min). "
                                "Renal safety thresholds cannot be validated."
                            ),
                            evidence_source="MedGuard Clinical Biomarker Validation Protocol (KDIGO Clinical Standards)",
                            review_status=ReviewStatus.INSUFFICIENT_DATA,
                        )
                    )
                    continue

                # Find all applicable threshold tiers where val < max_val (strict inequality)
                applicable_tiers = [
                    t for t in rrule.get("thresholds", [])
                    if val < t.get("max_val", 999.0)
                ]
                if not applicable_tiers:
                    continue

                # Pick the most restrictive tier (lowest threshold)
                applicable_tiers.sort(key=lambda t: t.get("max_val", 999.0))
                tier = applicable_tiers[0]

                tier_sev_str = tier.get("severity", "MAJOR").upper()
                tier_sev = (
                    SeverityLevel[tier_sev_str]
                    if tier_sev_str in SeverityLevel.__members__
                    else SeverityLevel.MAJOR
                )

                if tier_sev == SeverityLevel.CONTRAINDICATED:
                    findings.append(
                        RuleFinding(
                            rule_id=rrule.get("rule_id", "RENAL-CI"),
                            category=FindingCategory.RENAL_SAFETY,
                            severity=SeverityLevel.CONTRAINDICATED,
                            drugs_involved=[med.original_name],
                            reason=(
                                f"Patient {marker_type.upper()} ({val:.1f} mL/min) is within contraindicated "
                                f"range: {tier.get('reason')}"
                            ),
                            evidence_source=tier.get("evidence_source", "Renal Prescribing Guidelines"),
                            review_status=ReviewStatus.CONFIRMED_HAZARD,
                        )
                    )
                elif "max_dose_mg_day" in tier:
                    max_dose = tier["max_dose_mg_day"]
                    interval_note = tier.get("dosage_interval_note", "")
                    if med.dose_mg is not None:
                        if med.dose_mg > max_dose:
                            note_str = f" [{interval_note}]" if interval_note else ""
                            findings.append(
                                RuleFinding(
                                    rule_id=rrule.get("rule_id", "RENAL-DOSE"),
                                    category=FindingCategory.RENAL_SAFETY,
                                    severity=tier_sev,
                                    drugs_involved=[med.original_name],
                                    reason=(
                                        f"Prescribed dose ({med.dose_mg:.1f} mg) exceeds the validated renal "
                                        f"maximum ({max_dose:.1f} mg/day){note_str} for {marker_type.upper()} "
                                        f"{val:.1f} mL/min: {tier.get('reason')}"
                                    ),
                                    evidence_source=tier.get("evidence_source", "Renal Prescribing Guidelines"),
                                    review_status=ReviewStatus.CONFIRMED_HAZARD,
                                )
                            )
                    else:
                        findings.append(
                            RuleFinding(
                                rule_id=f"DATA-{rrule.get('rule_id', 'RENAL')}-DOSE-GAP",
                                category=FindingCategory.DATA_GAP,
                                severity=SeverityLevel.INSUFFICIENT_DATA,
                                drugs_involved=[med.original_name],
                                reason=(
                                    f"Patient has impaired renal function ({marker_type.upper()} {val:.1f} mL/min) "
                                    f"requiring maximum dose limit of {max_dose:.1f} mg/day, but prescribed "
                                    "dosage could not be determined from the prescription."
                                ),
                                evidence_source=tier.get("evidence_source", "Renal Prescribing Guidelines"),
                                review_status=ReviewStatus.INSUFFICIENT_DATA,
                            )
                        )
                else:
                    findings.append(
                        RuleFinding(
                            rule_id=rrule.get("rule_id", "RENAL-RULE"),
                            category=FindingCategory.RENAL_SAFETY,
                            severity=tier_sev,
                            drugs_involved=[med.original_name],
                            reason=(
                                f"Patient {marker_type.upper()} ({val:.1f} mL/min) requires renal dose "
                                f"adjustment: {tier.get('reason')}"
                            ),
                            evidence_source=tier.get("evidence_source", "H4 Renal Rules Reference"),
                            review_status=ReviewStatus.CONFIRMED_HAZARD,
                        )
                    )

        if not renal_rules_required:
            status = "NOT_APPLICABLE_NO_RENAL_RULES_FOR_REGIMEN"
        elif not all_markers_valid:
            status = "INCOMPLETE_MISSING_OR_INVALID_BIOMARKER"
        else:
            status = "EVALUATED"

        return findings, renal_rules_required, status

    def _check_contraindications(
        self, meds: List[NormalizedMedication], patient: Dict[str, Any]
    ) -> List[RuleFinding]:
        """Checks medications against verified patient clinical conditions, pregnancy, and allergies."""
        findings: List[RuleFinding] = []
        patient_conditions = self._extract_conditions(patient)
        patient_allergies = self._extract_allergies(patient)

        is_pregnant = (
            patient.get("pregnant") in (True, "Y", "y", "yes", "YES")
            or "pregnancy" in patient_conditions
            or "pregnant" in patient_conditions
        )
        if is_pregnant and "pregnancy" not in patient_conditions:
            patient_conditions.add("pregnancy")

        SEV_ORDER = {
            SeverityLevel.CONTRAINDICATED: 4,
            SeverityLevel.MAJOR: 3,
            SeverityLevel.MODERATE: 2,
            SeverityLevel.MINOR: 1,
            SeverityLevel.INSUFFICIENT_DATA: 0,
        }

        for med in meds:
            if not med.is_recognized:
                continue

            target_drugs = {med.generic_name.lower()} if med.generic_name else set()
            target_drugs.update(ing.lower() for ing in med.active_ingredients)
            target_drugs.update(g.lower() for g in getattr(med, "resolved_generics", []))

            candidate_findings: List[RuleFinding] = []

            # 1. Condition & Pregnancy contraindications
            for ci in self.repository.condition_contraindications:
                ci_drug = ci.get("drug", "").lower()
                if ci_drug in target_drugs:
                    ci_cid = ci.get("condition_id", "").lower()
                    ci_conditions = [c.lower().strip() for c in ci.get("conditions", [])]
                    match = False
                    if ci_cid and ci_cid in patient_conditions:
                        match = True
                    elif any(c in patient_conditions for c in ci_conditions):
                        match = True
                    elif any(c in p_c or p_c in c for c in ci_conditions for p_c in patient_conditions if p_c):
                        match = True

                    if match:
                        sev_str = ci.get("severity", "INSUFFICIENT_DATA").upper()
                        sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.INSUFFICIENT_DATA

                        # In H4 competition mode, Category C & N are not labelled as contraindications
                        if self.config.h4_eval_mode and sev in (SeverityLevel.MODERATE, SeverityLevel.INSUFFICIENT_DATA):
                            continue

                        if sev in (SeverityLevel.CONTRAINDICATED, SeverityLevel.MAJOR):
                            rev_status = ReviewStatus.CONFIRMED_HAZARD
                        elif sev == SeverityLevel.INSUFFICIENT_DATA:
                            rev_status = ReviewStatus.INSUFFICIENT_DATA
                        else:
                            rev_status = ReviewStatus.REQUIRES_CLINICAL_REVIEW

                        is_gap = (sev == SeverityLevel.INSUFFICIENT_DATA)
                        cat = FindingCategory.DATA_GAP if is_gap else FindingCategory.CONTRAINDICATION
                        prefix = (
                            f"Contraindicated in patient condition '{ci.get('condition_id', 'condition')}': "
                            if sev in (SeverityLevel.CONTRAINDICATED, SeverityLevel.MAJOR)
                            else f"Precaution / risk noted: "
                        )

                        candidate_findings.append(
                            RuleFinding(
                                rule_id=ci.get("rule_id", "CI-COND"),
                                category=cat,
                                severity=sev,
                                drugs_involved=[med.original_name],
                                reason=f"{prefix}{ci.get('reason')}",
                                evidence_source=ci.get("evidence_source", "Contraindications Reference"),
                                review_status=rev_status,
                            )
                        )

            # 2. Allergy contraindications
            for ai in self.repository.allergy_contraindications:
                ai_drug = ai.get("drug", "").lower()
                if ai_drug in target_drugs:
                    ai_cid = ai.get("condition_id", "").lower()
                    ai_allergens = [a.lower().strip() for a in ai.get("allergens", [])]
                    match = False
                    if ai_cid and ai_cid in patient_allergies:
                        match = True
                    elif any(a in patient_allergies for a in ai_allergens):
                        match = True
                    elif any(a in p_a or p_a in a for a in ai_allergens for p_a in patient_allergies if p_a):
                        match = True

                    if match:
                        sev_str = ai.get("severity", "CONTRAINDICATED").upper()
                        sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.CONTRAINDICATED
                        candidate_findings.append(
                            RuleFinding(
                                rule_id=ai.get("rule_id", "CI-ALLG"),
                                category=FindingCategory.CONTRAINDICATION,
                                severity=sev,
                                drugs_involved=[med.original_name],
                                reason=(
                                    f"Contraindicated due to documented patient allergy: {ai.get('reason')}"
                                ),
                                evidence_source=ai.get("evidence_source", "Allergy Prescribing Guidelines"),
                                review_status=ReviewStatus.CONFIRMED_HAZARD,
                            )
                        )

            # 3. Select most severe contraindication for this drug
            if candidate_findings:
                candidate_findings.sort(key=lambda f: SEV_ORDER.get(f.severity, 0), reverse=True)
                findings.append(candidate_findings[0])

        return findings

    @staticmethod
    def _extract_conditions(patient: Dict[str, Any]) -> Set[str]:
        """Extracts validated clinical conditions with negation protection."""
        conds = set()
        raw_conds = patient.get("conditions") or patient.get("diagnoses") or []
        if isinstance(raw_conds, str):
            raw_conds = [c.strip() for c in re.split(r"[;\n]", raw_conds) if c.strip()]

        for item in raw_conds:
            if not isinstance(item, str):
                continue
            item_lower = item.lower().strip()
            if re.search(r"\b(no|ruled out|free of|without)\b", item_lower):
                continue
            conds.add(item_lower)
            for cid, pat in CLINICAL_CONDITION_PATTERNS.items():
                if pat.search(item_lower):
                    conds.add(cid)
                    if cid == "peptic_ulcer":
                        conds.add("peptic ulcer")
                        conds.add("peptic ulcer disease")
                        conds.add("gastric ulcer")
        return conds

    @staticmethod
    def _extract_allergies(patient: Dict[str, Any]) -> Set[str]:
        """Extracts validated drug allergies with negation protection."""
        allgs = set()
        raw_allg = patient.get("allergies") or ""
        items: List[str] = []
        if isinstance(raw_allg, list):
            items = [str(x).strip() for x in raw_allg if str(x).strip()]
        elif isinstance(raw_allg, str) and raw_allg.strip():
            items = [x.strip() for x in re.split(r"[,;\n]", raw_allg) if x.strip()]

        for item in items:
            item_lower = item.lower().strip()
            if re.search(r"\b(tolerated|without problem|no known|nil|nkda)\b", item_lower):
                continue
            allgs.add(item_lower)
            for cid, pat in ALLERGY_PATTERNS.items():
                if pat.search(item_lower):
                    allgs.add(cid)
                    if cid == "penicillin_allergy":
                        allgs.add("penicillin")
                        allgs.add("amoxicillin")
                        allgs.add("ampicillin")
        return allgs

    def evaluate_h4_patient(
        self,
        patient_id: str,
        medication_list: str,
        egfr: Optional[float] = None,
        pregnant: str = "N",
        diagnoses: str = "",
        allergies: str = "",
        min_severity: SeverityLevel = SeverityLevel.MODERATE,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Evaluates an H4 patient according to the official hackathon rule engine.

        Returns:
            Tuple of (alerts, resolution_rows) conforming strictly to official CSV format.
        """
        tokens = [t.strip() for t in re.split(r"[;\n]", str(medication_list)) if t.strip()]
        res_rows: List[Dict[str, Any]] = []
        entries_generics: List[Set[str]] = []
        active_drugs: Set[str] = set()

        for tok in tokens:
            resolved_list = self.normalizer.resolve_token(tok)
            resolved_str = ";".join(sorted(resolved_list))
            res_rows.append({
                "patient_id": patient_id,
                "written_token": tok,
                "resolved_generic": resolved_str,
            })
            if resolved_list and not STOPPED_PATTERN.search(tok):
                g_set = set(resolved_list)
                entries_generics.append(g_set)
                active_drugs.update(g_set)

        alerts: List[Dict[str, Any]] = []
        allowed_sevs = {"contraindicated", "major", "moderate"}
        if min_severity == SeverityLevel.MINOR:
            allowed_sevs.add("minor")

        # 1. Bidirectional Drug-Drug Interactions
        for d1, d2 in combinations(sorted(active_drugs), 2):
            rule = self._ddi_index.get((d1, d2))
            if rule:
                sev = rule.get("severity", "moderate").lower()
                if sev in allowed_sevs:
                    act = rule.get("recommended_action") or rule.get("mechanism") or "Avoid or monitor combination"
                    alerts.append({
                        "patient_id": patient_id,
                        "issue_type": "interaction",
                        "severity": sev,
                        "drugs_involved": f"{d1};{d2}",
                        "suggested_action": act,
                        "confidence": 0.95,
                    })

        # 2. Duplicate Therapy Detection
        # 2a. Single generic across >=2 entries
        for g in sorted(active_drugs):
            count = sum(1 for eg in entries_generics if g in eg)
            if count >= 2:
                grp_id = self._drug_to_dup_group.get(g, "")
                grp = self.repository.duplicate_groups.get(grp_id, {})
                sev = grp.get("severity", "major").lower()
                if sev in allowed_sevs:
                    act = grp.get("recommended_action") or f"Duplicate therapy: {g} from multiple products - keep one"
                    alerts.append({
                        "patient_id": patient_id,
                        "issue_type": "duplicate_therapy",
                        "severity": sev,
                        "drugs_involved": g,
                        "suggested_action": act,
                        "confidence": 0.95,
                    })

        # 2b. Distinct generics from the same duplicate group across different entries
        for g1, g2 in combinations(sorted(active_drugs), 2):
            grp1 = self._drug_to_dup_group.get(g1, "")
            grp2 = self._drug_to_dup_group.get(g2, "")
            if grp1 and grp1 == grp2:
                is_separate = False
                for i in range(len(entries_generics)):
                    for j in range(i + 1, len(entries_generics)):
                        if (g1 in entries_generics[i] and g2 in entries_generics[j]) or (g2 in entries_generics[i] and g1 in entries_generics[j]):
                            is_separate = True
                            break
                    if is_separate:
                        break
                if is_separate:
                    grp = self.repository.duplicate_groups.get(grp1, {})
                    sev = grp.get("severity", "major").lower()
                    if sev in allowed_sevs:
                        act = grp.get("recommended_action") or f"Two drugs in duplicate class - keep one"
                        alerts.append({
                            "patient_id": patient_id,
                            "issue_type": "duplicate_therapy",
                            "severity": sev,
                            "drugs_involved": f"{g1};{g2}",
                            "suggested_action": act,
                            "confidence": 0.95,
                        })

        # 3. Renal Dose Safety Checks
        if egfr is not None:
            for drug in sorted(active_drugs):
                matching_rules = self._renal_by_drug.get(drug, [])
                app = [t for t in matching_rules if egfr < t["max_val"]]
                if app:
                    app.sort(key=lambda t: t["max_val"])
                    tier = app[0]
                    sev = tier["severity"].lower()
                    if sev in allowed_sevs:
                        act = tier["reason"]
                        alerts.append({
                            "patient_id": patient_id,
                            "issue_type": "renal_dose",
                            "severity": sev,
                            "drugs_involved": drug,
                            "suggested_action": act,
                            "confidence": 0.95,
                        })

        # 4. Drug-Condition Contraindications
        p_profile = {"diagnoses": diagnoses, "allergies": allergies, "pregnant": pregnant}
        conds = self._extract_conditions(p_profile)
        allgs = self._extract_allergies(p_profile)
        is_preg = (pregnant in (True, "Y", "y", "yes", "YES"))

        SEV_MAP = {"contraindicated": 4, "major": 3, "moderate": 2, "minor": 1}

        for drug in sorted(active_drugs):
            candidate_issues = []
            for ci in self._ci_by_drug.get(drug, []):
                ci_rule_id = ci.get("rule_id", "")
                if ci_rule_id.startswith("H4-PREG-C") or ci_rule_id.startswith("H4-PREG-N"):
                    continue
                ci_cid = ci.get("condition_id", "").lower()
                if (ci_cid in conds) or (ci_cid in allgs) or (ci_cid == "pregnancy" and is_preg):
                    sev = ci.get("severity", "moderate").lower()
                    if sev in allowed_sevs:
                        act = ci.get("recommended_action") or ci.get("reason", "Contraindicated")
                        candidate_issues.append((sev, act))

            if is_preg:
                pcat = self._drug_to_preg_cat.get(drug, "N")
                if pcat == "X" and "contraindicated" in allowed_sevs:
                    candidate_issues.append(("contraindicated", "Contraindicated in pregnancy (FDA category X) - stop and switch to a pregnancy-safe alternative"))
                elif pcat == "D" and "major" in allowed_sevs:
                    candidate_issues.append(("major", "Evidence of fetal risk (FDA category D) - review urgently; switch to a safer alternative unless benefit clearly justifies"))

            if candidate_issues:
                candidate_issues.sort(key=lambda x: SEV_MAP.get(x[0], 0), reverse=True)
                best_sev, best_act = candidate_issues[0]
                alerts.append({
                    "patient_id": patient_id,
                    "issue_type": "contraindication",
                    "severity": best_sev,
                    "drugs_involved": drug,
                    "suggested_action": best_act,
                    "confidence": 0.95,
                })

        return alerts, res_rows
