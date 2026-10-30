"""Medication Name and Dosage Normalizer.

Provides clinically accurate normalization of trade names, generic formulations,
dosage forms, and release profiles. Prevents incorrect stripping of therapeutic
cations (e.g. potassium in potassium chloride) and parses formatted doses reliably.
"""
import re
from typing import Dict, List, Optional, Set, Any, Tuple
from dataclasses import dataclass, field


# Non-cation secondary salts that can be safely detached to find the base moiety
SECONDARY_SALTS = {
    "hydrochloride", "hcl", "succinate", "tartrate", "maleate", "monohydrate",
    "dihydrate", "mesylate", "besylate", "acetate", "fumarate", "gluconate",
    "valerate", "propionate", "dipropionate", "bromide", "iodide"
}

# Release profile patterns
RELEASE_PROFILES = {
    "er": "EXTENDED_RELEASE",
    "xr": "EXTENDED_RELEASE",
    "cr": "EXTENDED_RELEASE",
    "sr": "EXTENDED_RELEASE",
    "xl": "EXTENDED_RELEASE",
    "la": "EXTENDED_RELEASE",
    "cd": "EXTENDED_RELEASE",
    "dr": "DELAYED_RELEASE",
    "ir": "IMMEDIATE_RELEASE",
    "extended release": "EXTENDED_RELEASE",
    "sustained release": "EXTENDED_RELEASE",
    "delayed release": "DELAYED_RELEASE",
    "immediate release": "IMMEDIATE_RELEASE",
}

DOSAGE_FORMS = {
    "tablet", "tablets", "tab", "tabs", "capsule", "capsules", "cap", "caps",
    "oral", "solution", "suspension", "syrup", "injection", "inj", "patch",
    "cream", "ointment", "drops", "inhaler", "suppository", "elixir"
}


@dataclass
class NormalizedMedication:
    """Represents a clinically normalized medication entity."""
    original_name: str
    clean_name: str
    generic_name: Optional[str] = None
    active_ingredients: List[str] = field(default_factory=list)
    drug_class: Optional[str] = None
    dose_mg: Optional[float] = None
    dose_unit: Optional[str] = None
    release_profile: Optional[str] = None
    dosage_form: Optional[str] = None
    salt_form: Optional[str] = None
    is_recognized: bool = False

    @property
    def primary_ingredient(self) -> str:
        """Returns the primary active ingredient or generic name or clean name."""
        if self.active_ingredients:
            return self.active_ingredients[0].lower()
        if self.generic_name:
            return self.generic_name.lower()
        return self.clean_name.lower()


class MedicationNormalizer:
    """Normalizes medication strings against verified drug reference data."""

    def __init__(self, drug_registry: Optional[Dict[str, Any]] = None):
        """Initializes normalizer with drug catalog."""
        self._generic_index: Dict[str, Dict[str, Any]] = {}
        self._brand_to_generic: Dict[str, str] = {}
        if drug_registry:
            self.load_registry(drug_registry)

    def load_registry(self, drug_registry: Dict[str, Any]) -> None:
        """Loads and indexes drug mapping entries."""
        drugs = drug_registry.get("drugs", {})
        for generic_key, details in drugs.items():
            generic_norm = generic_key.lower().strip()
            self._generic_index[generic_norm] = details
            
            # Index generic name itself
            self._brand_to_generic[generic_norm] = generic_norm
            
            # Index all brand names
            for brand in details.get("brand_names", []):
                self._brand_to_generic[brand.lower().strip()] = generic_norm
                
            # Index active ingredients as aliases only if not already mapped to an entity
            for ingredient in details.get("active_ingredients", []):
                ing_norm = ingredient.lower().strip()
                if ing_norm not in self._brand_to_generic:
                    self._brand_to_generic[ing_norm] = generic_norm

    @staticmethod
    def extract_dosage_info(text: str) -> Tuple[Optional[float], Optional[str]]:
        """Extracts numerical dose in mg and unit from a medication string.
        
        Properly handles comma-separated numbers (e.g. '1,000 mg'), decimals,
        micrograms, grams, and distinguishes mEq/units without false mg conversion.
        Rejects negative or zero dosages.
        """
        # Pre-process numbers with thousand-separator commas: e.g. "1,000" -> "1000"
        normalized_str = re.sub(r'(\d+),(\d{3})\b', r'\1\2', text)

        # 1. Check for grams: e.g. 1g, 1.5 g, 1 gm, 0.5 grams
        g_match = re.search(r'(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:g|gm|grams)\b', normalized_str, re.IGNORECASE)
        if g_match:
            try:
                val = float(g_match.group(1))
                if val > 0:
                    return val * 1000.0, "mg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 2. Check for milligrams: e.g. 500mg, 500 mg, 0.5mg, 1000 mg
        mg_match = re.search(r'(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:mg|mgs|milligrams)\b', normalized_str, re.IGNORECASE)
        if mg_match:
            try:
                val = float(mg_match.group(1))
                if val > 0:
                    return val, "mg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 3. Check for micrograms: e.g. 50mcg, 100 mcg, 100 ug, 25 micrograms
        mcg_match = re.search(r'(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:mcg|ug|micrograms)\b', normalized_str, re.IGNORECASE)
        if mcg_match:
            try:
                val = float(mcg_match.group(1))
                if val > 0:
                    return val / 1000.0, "mcg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 4. Check for milliequivalents (electrolytes like Potassium Chloride 20 mEq)
        meq_match = re.search(r'(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:meq|milliequivalents?)\b', normalized_str, re.IGNORECASE)
        if meq_match:
            # Do NOT convert mEq to mg because molecular weights vary
            return None, "mEq"

        # 5. Check for units (e.g. Insulin 50 units)
        units_match = re.search(r'(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:units?|iu)\b', normalized_str, re.IGNORECASE)
        if units_match:
            return None, "units"

        return None, None

    @classmethod
    def extract_dose_mg(cls, text: str) -> Optional[float]:
        """Convenience method returning extracted milligrams."""
        dose_mg, _ = cls.extract_dosage_info(text)
        return dose_mg

    def clean_drug_name(self, text: str) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
        """Cleans drug string and extracts clinical metadata (release profile, dosage form, salt form)."""
        # Pre-process numbers with thousand-separators so dosages are cleanly removed
        s = re.sub(r'(\d+),(\d{3})\b', r'\1\2', text)
        
        # Remove parenthetical descriptions
        s = re.sub(r'\(.*?\)', '', s)

        # Detect release profile
        detected_release: Optional[str] = None
        for pattern, profile in RELEASE_PROFILES.items():
            if re.search(r'\b' + re.escape(pattern) + r'\b', s, re.IGNORECASE):
                detected_release = profile
                # Strip the release pattern
                s = re.sub(r'\b' + re.escape(pattern) + r'\b', '', s, flags=re.IGNORECASE)
                break

        # Remove dose strings with units (e.g. 500mg, 10ml, 5 mcg, 20 mEq, 1000 units)
        s = re.sub(r'\b\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|gm|ml|meq|units?|iu)\b', '', s, flags=re.IGNORECASE)

        # Replace non-alphanumeric (except hyphen) with space
        s = re.sub(r'[^a-zA-Z0-9\-]', ' ', s)

        words = s.lower().split()
        cleaned_words: List[str] = []
        detected_form: Optional[str] = None
        detected_salt: Optional[str] = None

        for w in words:
            if w in DOSAGE_FORMS:
                detected_form = w
                continue
            if w.isdigit():
                continue
            if w in SECONDARY_SALTS:
                detected_salt = w
                # Only omit secondary salt if we already have a primary word
                if len(cleaned_words) >= 1:
                    continue
            cleaned_words.append(w)

        clean_name = " ".join(cleaned_words).strip()
        if not clean_name:
            clean_name = text.strip().lower()

        return clean_name, detected_release, detected_form, detected_salt

    def normalize(self, raw_name: str, dose_override_mg: Optional[float] = None) -> NormalizedMedication:
        """Performs structured normalization of a raw medication name string."""
        raw_name = raw_name.strip()
        extracted_dose_mg, dose_unit = self.extract_dosage_info(raw_name)
        dose_mg = dose_override_mg if dose_override_mg is not None else extracted_dose_mg

        clean, release_profile, dosage_form, salt_form = self.clean_drug_name(raw_name)

        # 1. Exact match in brand/generic index
        generic_target = self._brand_to_generic.get(clean)

        # 2. If exact match fails and a secondary salt was stripped, try appending or checking base
        if not generic_target and salt_form:
            name_with_salt = f"{clean} {salt_form}"
            generic_target = self._brand_to_generic.get(name_with_salt)

        # 3. Controlled prefix/token matching (safe matching without greedy substrings)
        if not generic_target:
            clean_tokens = set(clean.split())
            for indexed_name, gen_key in self._brand_to_generic.items():
                indexed_tokens = set(indexed_name.split())
                # If indexed multi-word name is fully contained in clean tokens (e.g. "potassium chloride" in "potassium chloride er")
                if indexed_tokens and indexed_tokens.issubset(clean_tokens):
                    generic_target = gen_key
                    break
                elif clean == indexed_name:
                    generic_target = gen_key
                    break

        if generic_target and generic_target in self._generic_index:
            details = self._generic_index[generic_target]
            return NormalizedMedication(
                original_name=raw_name,
                clean_name=clean,
                generic_name=details.get("generic_name", generic_target),
                active_ingredients=details.get("active_ingredients", [generic_target]),
                drug_class=details.get("drug_class"),
                dose_mg=dose_mg,
                dose_unit=dose_unit,
                release_profile=release_profile,
                dosage_form=dosage_form,
                salt_form=salt_form,
                is_recognized=True
            )

        # Unrecognized drug entity
        return NormalizedMedication(
            original_name=raw_name,
            clean_name=clean,
            generic_name=None,
            active_ingredients=[],
            drug_class=None,
            dose_mg=dose_mg,
            dose_unit=dose_unit,
            release_profile=release_profile,
            dosage_form=dosage_form,
            salt_form=salt_form,
            is_recognized=False
        )
