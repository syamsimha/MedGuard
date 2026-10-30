"""Medication Safety Intelligence Engine.

Implements clinical second-look validation:
- Multi-drug interaction cross-examination with active-pair deduplication
- Exact, active-ingredient, and therapeutic group duplicate detection
- Validated renal dosage evaluation with biomarker sanity checking
- Condition, pregnancy, and allergy contraindication verification
- Missing reference and clinical data gap accounting
- Qualified status reporting preventing negative proof fallacies
"""
import math
from itertools import combinations
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any, Set, Tuple

from .normalizer import MedicationNormalizer, NormalizedMedication
from .rules import (
    SeverityLevel,
    FindingCategory,
    ReviewStatus,
    RuleFinding,
    EngineConfig,
    SafetyRuleRepository,
)


class MedicationSafetyEngine:
    """Core clinical safety engine executing multi-point medication validation."""

    VERSION = "1.2.0"
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
        self.normalizer = MedicationNormalizer(self.repository.drugs_catalog)

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

        # Track check accounting status
        unrecognized_count = sum(1 for m in normalized_meds if not m.is_recognized)
        renal_rules_required = False
        renal_check_status = "NOT_APPLICABLE_NO_RENAL_RULES_FOR_REGIMEN"

        # 2. Unknown / Unverified Medication Data Gap Check
        if cfg.check_unrecognized_drugs:
            for norm in normalized_meds:
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
        if cfg.check_duplicates and len(normalized_meds) > 1:
            duplicate_findings = self._check_duplicates(normalized_meds)
            findings.extend(duplicate_findings)

        # 4. Drug-Drug Interaction Detection (with distinct pair deduplication)
        if cfg.check_ddi and len(normalized_meds) > 1:
            ddi_findings = self._check_ddi(normalized_meds)
            findings.extend(ddi_findings)

        # 5. Renal-Dose Safety Checks (with biological biomarker validation)
        if cfg.check_renal:
            renal_findings, renal_rules_required, renal_check_status = self._check_renal_safety(
                normalized_meds, patient
            )
            findings.extend(renal_findings)

        # 6. Patient Contraindication Checks (Conditions, Pregnancy, Allergies)
        if cfg.check_contraindications:
            ci_findings = self._check_contraindications(normalized_meds, patient)
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

        # Strict safety determination: never safe if blocking alerts or unverified data gaps exist
        has_blocking_hazards = has_contraindicated or has_major
        is_safe = (not has_blocking_hazards) and (not has_data_gap) and (len(filtered_findings) == 0)

        # Qualified clinical status string (avoids negative proof fallacy)
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

        for i in range(n):
            for j in range(i + 1, n):
                m1 = meds[i]
                m2 = meds[j]

                # 1. Exact name duplication
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
                    continue

                # 2. Shared active ingredients (chemical moiety duplicate)
                if m1.active_ingredients and m2.active_ingredients:
                    shared = set(ing.lower() for ing in m1.active_ingredients).intersection(
                        set(ing.lower() for ing in m2.active_ingredients)
                    )
                    if shared and (i, j) not in reported_exact_or_active_pairs:
                        shared_str = ", ".join(sorted(shared))
                        findings.append(
                            RuleFinding(
                                rule_id="DUP-ACT-001",
                                category=FindingCategory.DUPLICATE_THERAPY,
                                severity=SeverityLevel.MAJOR,
                                drugs_involved=[m1.original_name, m2.original_name],
                                reason=(
                                    f"Duplicate active ingredient: '{m1.original_name}' and '{m2.original_name}' "
                                    f"both contain the active substance '{shared_str}'. Concurrent administration "
                                    "risks severe cumulative toxicity."
                                ),
                                evidence_source="FDA Safe Use Initiative: Combination Product Redundancy & Active Moiety Duplication",
                                review_status=ReviewStatus.CONFIRMED_HAZARD,
                            )
                        )
                        reported_exact_or_active_pairs.add((i, j))
                        continue

                # 3. Therapeutic class duplication (from duplicate_therapy_groups.csv)
                if (i, j) not in reported_exact_or_active_pairs and self.repository.duplicate_groups:
                    g1 = m1.generic_name.lower() if m1.generic_name else ""
                    g2 = m2.generic_name.lower() if m2.generic_name else ""
                    if g1 and g2 and g1 != g2:
                        for gid, grp in self.repository.duplicate_groups.items():
                            members = grp.get("member_generics", [])
                            if g1 in members and g2 in members:
                                sev_str = grp.get("severity", "MAJOR").upper()
                                sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.MAJOR
                                action = grp.get("recommended_action", "Avoid concurrent duplicate therapy.")
                                findings.append(
                                    RuleFinding(
                                        rule_id=f"DUP-GRP-{gid.upper()}",
                                        category=FindingCategory.DUPLICATE_THERAPY,
                                        severity=sev,
                                        drugs_involved=[m1.original_name, m2.original_name],
                                        reason=(
                                            f"Duplicate therapeutic class ({grp.get('group_name', gid)}): "
                                            f"'{m1.original_name}' and '{m2.original_name}' both belong to this class. "
                                            f"{action}"
                                        ),
                                        evidence_source="H4 Official Duplicate Therapy Reference (duplicate_therapy_groups.csv)",
                                        review_status=ReviewStatus.CONFIRMED_HAZARD,
                                    )
                                )
                                break

        return findings

    def _check_ddi(self, meds: List[NormalizedMedication]) -> List[RuleFinding]:
        """Cross-examines all medication pairs against verified interaction data with active-pair deduplication."""
        findings: List[RuleFinding] = []
        pairs = combinations(range(len(meds)), 2)
        
        # Track emitted interaction rules by (rule_id, tuple(sorted(active_ingredient_pair)))
        emitted_pairs: Set[Tuple[str, Tuple[str, ...]]] = set()

        for i, j in pairs:
            m1 = meds[i]
            m2 = meds[j]
            if not m1.is_recognized or not m2.is_recognized:
                continue

            # Keys to test: generic names and all active ingredients
            targets_1 = {m1.generic_name.lower()} if m1.generic_name else set()
            targets_1.update(ing.lower() for ing in m1.active_ingredients)

            targets_2 = {m2.generic_name.lower()} if m2.generic_name else set()
            targets_2.update(ing.lower() for ing in m2.active_ingredients)

            for rule in self.repository.interactions_catalog:
                d_a = rule.get("drug_a", "").lower()
                d_b = rule.get("drug_b", "").lower()

                # Bi-directional match
                match = (d_a in targets_1 and d_b in targets_2) or (d_a in targets_2 and d_b in targets_1)
                if match:
                    rule_id = rule.get("rule_id", "DDI-000")
                    pair_key = (rule_id, tuple(sorted([d_a, d_b])))

                    # Deduplicate: do not emit duplicate alert for the exact same active interaction pair
                    if pair_key in emitted_pairs:
                        continue
                    emitted_pairs.add(pair_key)

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

            # Find applicable verified renal rules for this drug
            matching_rules = [
                r for r in self.repository.renal_rules
                if r.get("drug", "").lower() in target_drugs
            ]

            if matching_rules:
                renal_rules_required = True

            for rrule in matching_rules:
                marker_type = rrule.get("marker", "egfr").lower()
                marker_val = egfr if marker_type == "egfr" else crcl

                # Clinical rule exists, but patient kidney-function data is missing
                if marker_val is None or marker_val == "":
                    all_markers_valid = False
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

                # Validate biomarker sanity: reject NaN, Inf, non-positive numbers, out-of-range (>300 mL/min)
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

                # Evaluate verified renal threshold tiers
                for tier in rrule.get("thresholds", []):
                    min_v = tier.get("min_val", 0.0)
                    max_v = tier.get("max_val", 999.0)
                    inclusive_max = tier.get("inclusive_max", False)

                    in_range = (val >= min_v and val <= max_v) if inclusive_max else (val >= min_v and val < max_v)
                    if in_range:
                        tier_sev_str = tier.get("severity", "MAJOR").upper()
                        tier_sev = (
                            SeverityLevel[tier_sev_str]
                            if tier_sev_str in SeverityLevel.__members__
                            else SeverityLevel.MAJOR
                        )

                        # Check if this tier is an absolute contraindication
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
                        # Check dosage ceiling if specified
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
                                # Patient has renal impairment tier requiring dose cap, but dose is missing
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
                            # Standard tier (e.g. from H4 renal_rules.csv without explicit max dose)
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

        # Determine overall renal check status
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
        raw_conditions = patient.get("conditions") or patient.get("diagnoses") or []
        if isinstance(raw_conditions, str):
            raw_conditions = [c.strip() for c in raw_conditions.split(";") if c.strip()]
        patient_conditions = [c.lower().strip() for c in raw_conditions]

        # Pregnancy detection
        is_pregnant = (
            patient.get("pregnant") in (True, "Y", "y", "yes", "YES")
            or "pregnancy" in patient_conditions
            or "pregnant" in patient_conditions
        )
        if is_pregnant and "pregnancy" not in patient_conditions:
            patient_conditions.append("pregnancy")

        raw_allergies = patient.get("allergies") or []
        if isinstance(raw_allergies, str):
            raw_allergies = [a.strip() for a in raw_allergies.split(";") if a.strip()]
        patient_allergies = [a.lower().strip() for a in raw_allergies]

        for med in meds:
            if not med.is_recognized:
                continue

            target_drugs = {med.generic_name.lower()} if med.generic_name else set()
            target_drugs.update(ing.lower() for ing in med.active_ingredients)

            # 1. Condition & Pregnancy contraindications
            for ci in self.repository.condition_contraindications:
                ci_drug = ci.get("drug", "").lower()
                if ci_drug in target_drugs:
                    ci_conditions = [c.lower() for c in ci.get("conditions", [])]
                    for pat_c in patient_conditions:
                        if any(ci_c in pat_c or pat_c in ci_c for ci_c in ci_conditions):
                            sev_str = ci.get("severity", "INSUFFICIENT_DATA").upper()
                            sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.INSUFFICIENT_DATA

                            if sev in (SeverityLevel.CONTRAINDICATED, SeverityLevel.MAJOR):
                                rev_status = ReviewStatus.CONFIRMED_HAZARD
                            elif sev == SeverityLevel.INSUFFICIENT_DATA:
                                rev_status = ReviewStatus.INSUFFICIENT_DATA
                            else:
                                rev_status = ReviewStatus.REQUIRES_CLINICAL_REVIEW

                            is_gap = (sev == SeverityLevel.INSUFFICIENT_DATA)
                            cat = FindingCategory.DATA_GAP if is_gap else FindingCategory.CONTRAINDICATION
                            prefix = (
                                f"Contraindicated in patient condition '{pat_c}': "
                                if sev in (SeverityLevel.CONTRAINDICATED, SeverityLevel.MAJOR)
                                else f"Precaution / risk noted in patient condition '{pat_c}': "
                            )

                            findings.append(
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
                    ai_allergens = [a.lower() for a in ai.get("allergens", [])]
                    for pat_a in patient_allergies:
                        if any(allg in pat_a or pat_a in allg for allg in ai_allergens):
                            sev_str = ai.get("severity", "CONTRAINDICATED").upper()
                            sev = SeverityLevel[sev_str] if sev_str in SeverityLevel.__members__ else SeverityLevel.CONTRAINDICATED
                            findings.append(
                                RuleFinding(
                                    rule_id=ai.get("rule_id", "CI-ALLG"),
                                    category=FindingCategory.CONTRAINDICATION,
                                    severity=sev,
                                    drugs_involved=[med.original_name],
                                    reason=(
                                        f"Contraindicated due to documented patient allergy '{pat_a}': {ai.get('reason')}"
                                    ),
                                    evidence_source=ai.get("evidence_source", "Allergy Prescribing Guidelines"),
                                    review_status=ReviewStatus.CONFIRMED_HAZARD,
                                )
                            )

        return findings
