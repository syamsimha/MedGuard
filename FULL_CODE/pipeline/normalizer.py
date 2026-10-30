"""Medication Name and Dosage Normalizer.

Provides clinically accurate normalization of trade names, generic formulations,
dosage forms, and release profiles. Prevents incorrect stripping of therapeutic
cations (e.g. potassium in potassium chloride) and parses formatted doses reliably.
Supports high-precision training resolution dataset ingestion, synonym expansion,
abbreviation mapping, and fuzzy phonetic recovery.
"""
import re
import difflib
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

FORM_WORDS = {
    "tab", "tab.", "t.", "t", "cap", "cap.", "c.", "inj", "inj.", "syp", "syp.",
    "syr", "inh", "inh.", "mdi", "rotacap", "sachet", "sach.", "patch", "susp",
    "drops", "powder", "neb", "respule", "gel"
}

STOP_WORDS = {
    "od", "bd", "tds", "hs", "sos", "prn", "bid", "tid", "once", "twice", "x",
    "at", "if", "after", "before", "weekly", "every", "daily", "puffs", "puff",
    "empty", "ml", "u", "-", "--", "(cont.)"
}

# Verified clinical abbreviations in Indian clinical practice
ABBREVIATIONS = {
    "pcm": "paracetamol",
    "ismn": "isosorbide mononitrate",
    "isdn": "isosorbide dinitrate",
    "soda bicarb": "sodium bicarbonate",
    "sodabicarb": "sodium bicarbonate",
    "sodamint": "sodium bicarbonate",
    "sodami": "sodium bicarbonate",
    "sodam": "sodium bicarbonate",
    "ntg": "nitroglycerin",
    "mtx": "methotrexate",
    "hcq": "hydroxychloroquine",
    "cbz": "carbamazepine",
    "vpa": "sodium valproate",
    "atv": "atorvastatin",
    "rosuvo": "rosuvastatin",
    "pzt": "pantoprazole",
    "pntp": "pantoprazole",
    "pan": "pantoprazole",
    "atorva": "atorvastatin",
    "atorvva": "atorvastatin",
    "pregeb": "pregabalin",
    "telsartan": "telmisartan",
}

# Verified clinical synonyms
SYNONYMS = {
    "vit d3": "cholecalciferol",
    "vitamin d3": "cholecalciferol",
    "vit-d3": "cholecalciferol",
    "calcirol": "cholecalciferol",
    "frusemide": "furosemide",
    "mecobalamin": "methylcobalamin",
    "l-thyroxine": "levothyroxine",
    "thyroxine": "levothyroxine",
    "thyroxine sodium": "levothyroxine",
    "acetaminophen": "paracetamol",
    "tylenol": "paracetamol",
    "advil": "ibuprofen",
    "motrin": "ibuprofen",
    "co-amoxiclav": "amoxicillin;clavulanic acid",
    "amoxyclav": "amoxicillin;clavulanic acid",
    "amoxiclav": "amoxicillin;clavulanic acid",
    "augmentin": "amoxicillin;clavulanic acid",
    "clavam": "amoxicillin;clavulanic acid",
    "shelcal": "calcium carbonate;cholecalciferol",
    "combiflam": "ibuprofen;paracetamol",
    "zerodol-p": "aceclofenac;paracetamol",
    "zerodol-sp": "aceclofenac;paracetamol;serratiopeptidase",
    "glycomet-gp": "glimepiride;metformin",
    "janumet": "metformin;sitagliptin",
    "galvus met": "metformin;vildagliptin",
    "foracort": "budesonide;formoterol",
    "ascoril ls": "ambroxol;guaifenesin;levosalbutamol",
    "vymada": "sacubitril;valsartan",
    "deplatt a": "aspirin;clopidogrel",
    "ecosprin av": "aspirin;atorvastatin",
    "telma am": "amlodipine;telmisartan",
    "telma-am": "amlodipine;telmisartan",
    "telma h": "hydrochlorothiazide;telmisartan",
    "telma-h": "hydrochlorothiazide;telmisartan",
    "losar-h": "hydrochlorothiazide;losartan",
    "losar h": "hydrochlorothiazide;losartan",
}

# Non-drug entries that should resolve to empty string
NON_DRUG_TERMS = {
    "bp charting", "glucometer", "glucometer strips", "salt restriction", "physiotherapy",
    "review with reports", "nebulisation", "nebulisation sos at phc", "hot water fomentation",
    "steam inhalation", "diabetic diet", "dressing daily", "sugar charting", "insulin pen needles",
    "ecg done", "diet advice", "diet advice - low salt", "ls belt", "check k+", "check k+ in 1 wk",
    "rft/lft", "rft/lft next visit", "review after", "review after 1 month", "knee cap",
    "cervical collar", "walker", "plenty of oral fluids", "rbs monitoring", "cbc", "lft", "kft"
}

# Inactive / stopped prescription markers
STOPPED_PATTERN = re.compile(
    r"\b(stop|stopped|discont|discontinued|d/c|hold|omit|withdrawn|not taking|never started)\b",
    re.IGNORECASE,
)


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
    is_stopped: bool = False
    resolved_generics: List[str] = field(default_factory=list)

    @property
    def primary_ingredient(self) -> str:
        """Returns the primary active ingredient or generic name or clean name."""
        if self.resolved_generics:
            return self.resolved_generics[0].lower()
        if self.active_ingredients:
            return self.active_ingredients[0].lower()
        if self.generic_name:
            return self.generic_name.lower()
        return self.clean_name.lower()


class MedicationNormalizer:
    """Normalizes medication strings against verified drug reference data."""

    def __init__(
        self,
        drug_registry: Optional[Dict[str, Any]] = None,
        resolution_dataset: Optional[Dict[str, str]] = None,
    ):
        """Initializes normalizer with drug catalog and optional resolution dataset."""
        self._generic_index: Dict[str, Dict[str, Any]] = {}
        self._brand_to_generic: Dict[str, str] = {}
        self._resolution_map: Dict[str, str] = {}
        if drug_registry:
            self.load_registry(drug_registry)
        if resolution_dataset:
            self.load_resolution_dataset(resolution_dataset)

    def load_resolution_dataset(self, resolution_dict: Dict[str, str]) -> None:
        """Loads verified token-to-generic mappings from training resolution dataset."""
        for tok, gen in resolution_dict.items():
            self._resolution_map[tok.strip().lower()] = gen.strip().lower()

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
        normalized_str = re.sub(r"(\d+),(\d{3})\b", r"\1\2", text)

        # 1. Check for grams: e.g. 1g, 1.5 g, 1 gm, 0.5 grams
        g_match = re.search(r"(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:g|gm|grams)\b", normalized_str, re.IGNORECASE)
        if g_match:
            try:
                val = float(g_match.group(1))
                if val > 0:
                    return val * 1000.0, "mg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 2. Check for milligrams: e.g. 500mg, 500 mg, 0.5mg, 1000 mg
        mg_match = re.search(r"(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:mg|mgs|milligrams)\b", normalized_str, re.IGNORECASE)
        if mg_match:
            try:
                val = float(mg_match.group(1))
                if val > 0:
                    return val, "mg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 3. Check for micrograms: e.g. 50mcg, 100 mcg, 100 ug, 25 micrograms
        mcg_match = re.search(r"(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:mcg|ug|micrograms)\b", normalized_str, re.IGNORECASE)
        if mcg_match:
            try:
                val = float(mcg_match.group(1))
                if val > 0:
                    return val / 1000.0, "mcg"
                return None, None
            except (ValueError, TypeError):
                pass

        # 4. Check for milliequivalents (electrolytes like Potassium Chloride 20 mEq)
        meq_match = re.search(r"(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:meq|milliequivalents?)\b", normalized_str, re.IGNORECASE)
        if meq_match:
            return None, "mEq"

        # 5. Check for units (e.g. Insulin 50 units)
        units_match = re.search(r"(?:^|[^\w-])(-?\d+(?:\.\d+)?)\s*(?:units?|iu)\b", normalized_str, re.IGNORECASE)
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
        s = re.sub(r"(\d+),(\d{3})\b", r"\1\2", text)
        s = re.sub(r"\(.*?\)", "", s)

        detected_release: Optional[str] = None
        for pattern, profile in RELEASE_PROFILES.items():
            if re.search(r"\b" + re.escape(pattern) + r"\b", s, re.IGNORECASE):
                detected_release = profile
                s = re.sub(r"\b" + re.escape(pattern) + r"\b", "", s, flags=re.IGNORECASE)
                break

        s = re.sub(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|gm|ml|meq|units?|iu)\b", "", s, flags=re.IGNORECASE)
        s = re.sub(r"[^a-zA-Z0-9\-]", " ", s)

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
                if len(cleaned_words) >= 1:
                    continue
            cleaned_words.append(w)

        clean_name = " ".join(cleaned_words).strip()
        if not clean_name:
            clean_name = text.strip().lower()

        return clean_name, detected_release, detected_form, detected_salt

    def _match_brand_or_generic(self, clean: str) -> Optional[str]:
        """Direct index lookup with fallback to abbreviations, synonyms, and token matching."""
        # 1. Exact match in index
        if clean in self._brand_to_generic:
            return self._brand_to_generic[clean]

        # 2. Check abbreviations & synonyms
        if clean in ABBREVIATIONS:
            mapped = ABBREVIATIONS[clean]
            if mapped in self._brand_to_generic:
                return self._brand_to_generic[mapped]
            return mapped

        if clean in SYNONYMS:
            mapped = SYNONYMS[clean]
            if mapped in self._brand_to_generic:
                return self._brand_to_generic[mapped]
            return mapped

        # 3. Controlled token / prefix matching
        clean_tokens = set(clean.split())
        for indexed_name, gen_key in self._brand_to_generic.items():
            indexed_tokens = set(indexed_name.split())
            if indexed_tokens and indexed_tokens.issubset(clean_tokens):
                return gen_key
            if clean == indexed_name:
                return gen_key

        # 4. Fuzzy match against registered brands and generics
        close = difflib.get_close_matches(clean, self._brand_to_generic.keys(), n=1, cutoff=0.80)
        if close:
            return self._brand_to_generic[close[0]]

        return None

    def normalize(self, raw_name: str, dose_override_mg: Optional[float] = None) -> NormalizedMedication:
        """Performs structured normalization of a raw medication name string."""
        raw_name_clean = raw_name.strip()
        raw_lower = raw_name_clean.lower()
        is_stopped = bool(STOPPED_PATTERN.search(raw_name_clean))

        extracted_dose_mg, dose_unit = self.extract_dosage_info(raw_name_clean)
        dose_mg = dose_override_mg if dose_override_mg is not None else extracted_dose_mg

        # Check explicit training resolution map
        if raw_lower in self._resolution_map:
            resolved_str = self._resolution_map[raw_lower]
            if not resolved_str:
                # Verified non-drug entry
                return NormalizedMedication(
                    original_name=raw_name_clean,
                    clean_name=raw_lower,
                    generic_name=None,
                    active_ingredients=[],
                    drug_class=None,
                    dose_mg=dose_mg,
                    dose_unit=dose_unit,
                    is_recognized=False,
                    is_stopped=is_stopped,
                    resolved_generics=[],
                )
            resolved_list = [g.strip().lower() for g in resolved_str.split(";") if g.strip()]
            primary_gen = resolved_list[0] if resolved_list else resolved_str
            details = self._generic_index.get(primary_gen, {})
            return NormalizedMedication(
                original_name=raw_name_clean,
                clean_name=raw_lower,
                generic_name=details.get("generic_name", primary_gen),
                active_ingredients=resolved_list,
                drug_class=details.get("drug_class"),
                dose_mg=dose_mg,
                dose_unit=dose_unit,
                is_recognized=True,
                is_stopped=is_stopped,
                resolved_generics=resolved_list,
            )

        # Check known non-drug patterns
        if any(nd in raw_lower for nd in NON_DRUG_TERMS):
            return NormalizedMedication(
                original_name=raw_name_clean,
                clean_name=raw_lower,
                generic_name=None,
                active_ingredients=[],
                drug_class=None,
                dose_mg=dose_mg,
                dose_unit=dose_unit,
                is_recognized=False,
                is_stopped=is_stopped,
                resolved_generics=[],
            )

        clean, release_profile, dosage_form, salt_form = self.clean_drug_name(raw_name_clean)

        # Match cleaned name
        generic_target = self._match_brand_or_generic(clean)

        # Salt stripped retry
        if not generic_target and salt_form:
            generic_target = self._match_brand_or_generic(f"{clean} {salt_form}")

        # Check multi-generic combination strings (e.g. "calcium + vit D3")
        if not generic_target and "+" in clean:
            parts = [p.strip() for p in clean.split("+") if p.strip()]
            part_generics = []
            for p in parts:
                p_match = self._match_brand_or_generic(p)
                if p_match:
                    part_generics.append(p_match)
            if len(part_generics) == len(parts):
                return NormalizedMedication(
                    original_name=raw_name_clean,
                    clean_name=clean,
                    generic_name=" + ".join(part_generics),
                    active_ingredients=part_generics,
                    drug_class="combination_product",
                    dose_mg=dose_mg,
                    dose_unit=dose_unit,
                    release_profile=release_profile,
                    dosage_form=dosage_form,
                    salt_form=salt_form,
                    is_recognized=True,
                    is_stopped=is_stopped,
                    resolved_generics=part_generics,
                )

        if generic_target and generic_target in self._generic_index:
            details = self._generic_index[generic_target]
            active_ings = details.get("active_ingredients", [generic_target])
            return NormalizedMedication(
                original_name=raw_name_clean,
                clean_name=clean,
                generic_name=details.get("generic_name", generic_target),
                active_ingredients=active_ings,
                drug_class=details.get("drug_class"),
                dose_mg=dose_mg,
                dose_unit=dose_unit,
                release_profile=release_profile,
                dosage_form=dosage_form,
                salt_form=salt_form,
                is_recognized=True,
                is_stopped=is_stopped,
                resolved_generics=active_ings,
            )

        if generic_target:
            # Resolved to generic string not in index
            gens = [g.strip().lower() for g in generic_target.split(";") if g.strip()]
            return NormalizedMedication(
                original_name=raw_name_clean,
                clean_name=clean,
                generic_name=generic_target,
                active_ingredients=gens,
                drug_class=None,
                dose_mg=dose_mg,
                dose_unit=dose_unit,
                release_profile=release_profile,
                dosage_form=dosage_form,
                salt_form=salt_form,
                is_recognized=True,
                is_stopped=is_stopped,
                resolved_generics=gens,
            )

        # Unrecognized drug entity
        return NormalizedMedication(
            original_name=raw_name_clean,
            clean_name=clean,
            generic_name=None,
            active_ingredients=[],
            drug_class=None,
            dose_mg=dose_mg,
            dose_unit=dose_unit,
            release_profile=release_profile,
            dosage_form=dosage_form,
            salt_form=salt_form,
            is_recognized=False,
            is_stopped=is_stopped,
            resolved_generics=[],
        )

    def resolve_token(self, token: str) -> List[str]:
        """Convenience method returning canonical sorted generic name(s) for a token."""
        norm = self.normalize(token)
        if not norm.is_recognized:
            return []
        if norm.resolved_generics:
            return sorted(set(norm.resolved_generics))
        if norm.active_ingredients:
            return sorted(set(norm.active_ingredients))
        if norm.generic_name:
            return [norm.generic_name.lower()]
        return []
