# MedGuard Medication Safety Intelligence Pipeline

The Medication Safety Pipeline provides clinical decision support (CDS) intelligence for prescription validation. It cross-examines multi-medication regimens against verified clinical pharmacology rules, detects duplicate therapies, validates organ-specific dosage adjustments, and checks patient contraindications.

---

## 1. Architecture & Core Components

```text
pipeline/
├── data/                           # Verified clinical reference tables
│   ├── drugs.json                  # Formulary mappings, brand aliases, active ingredients
│   ├── interactions.json           # Validated DDI pairs with clinical mechanism & citations
│   ├── renal_rules.json            # Validated eGFR/CrCl thresholds & dosage ceilings
│   └── contraindications.json      # Validated disease & allergy contraindications
├── normalizer.py                   # Name, dosage, formulation & release profile parser
├── rules.py                        # Rule definitions, severity enums & dataset repository
├── safety_engine.py                # Multi-point clinical safety evaluation engine
└── __init__.py                     # Module public interface exports
```

---

## 2. Dataset Availability & Provenance

### H4 Dataset Discovery
MedGuard automatically probes standard repository locations for the official competition dataset `H4_Dataset`:
1. Explicitly configured path via `EngineConfig(external_dataset_path=...)`
2. `./H4_Dataset` (Current working directory)
3. `<repo_root>/H4_Dataset`
4. `FULL_CODE/H4_Dataset`
5. `FULL_CODE/pipeline/H4_Dataset`

When `H4_Dataset` is located and contains `.json` or `.csv` files, the engine loads it dynamically into memory. When absent, the engine falls back to `BUNDLED_REFERENCE` mode without disruption. The active mode and discovery status are transparently reported in every evaluation payload under `dataset_info` and via `GET /api/safety/rules`.

### Verified Clinical Evidence Sources
All bundled rules are derived from primary, authoritative clinical reference bodies:
- **FDA Orange Book**: Approved Drug Products with Therapeutic Equivalence Evaluations
- **FDA Drug Safety Communications & Boxed Warnings**:
  - *Metformin in reduced kidney function* (2016-04-08): eGFR $< 30$ mL/min/1.73m² contraindication.
  - *Simvastatin CYP3A4 drug interactions* (2011): Clarithromycin contraindication.
  - *Dual Renin-Angiotensin System Blockade* (2014): Lisinopril + Losartan contraindication.
- **FDA Prescribing Information**:
  - *Neurontin (gabapentin)* Section 2.3 Table 2: CrCl $< 15$ mL/min dosage ceiling ($\le 150$ mg/day or 300 mg QOD).
  - *Zyloprim (allopurinol)* Section 2: CrCl $< 10$ mL/min ceiling ($\le 100$ mg/day).
  - *Coumadin (warfarin)* Section 7: Antiplatelet hemorrhage interaction.
  - *Inderal (propranolol)* Section 4: Bronchospastic disease / asthma contraindication.
  - *Amoxil (amoxicillin)* Section 4: Penicillin hypersensitivity anaphylaxis contraindication.
  - *Trexall (methotrexate)* Boxed Warning: Pregnancy Category X teratogenicity.
- **KDIGO 2024 Clinical Practice Guideline**: Evaluation and Management of Chronic Kidney Disease.
- **ISMP**: Targeted Medication Safety Best Practices for duplicate therapy prevention.

---

## 3. Clinical Normalization & Safeguards

1. **Therapeutic Cation Protection**: Normalization safeguards therapeutic electrolyte cations (e.g. `potassium chloride`, `sodium bicarbonate`). Cation words are never stripped when they constitute the primary therapeutic compound.
2. **Formulation & Release Profile Extraction**: Suffixes indicating extended release (`ER`, `XR`, `CR`, `XL`, `LA`), delayed release (`DR`), and immediate release (`IR`) are extracted and preserved on `NormalizedMedication.release_profile`.
3. **Combination Product Multi-Moiety Indexing**: Fixed-dose combinations (e.g. *Augmentin* $\rightarrow$ Amoxicillin + Clavulanic Acid) preserve all active ingredients, enabling multi-drug interaction and duplicate therapy screening across components.
4. **Biomarker Sanity Verification**: Renal biomarkers (`eGFR`, `CrCl`) are strictly validated ($0 < \text{val} \le 300$). Non-finite values (`NaN`, `Inf`), negative numbers, zero, and biologically impossible entries are rejected with an explicit `INSUFFICIENT_DATA` finding.
5. **Dose Parsing Integrity**: Dose parsing handles comma-separated thousands (`1,000 mg`), metric conversions (`g`, `mcg`), and rejects negative or malformed inputs. Non-weight units (`mEq`, `units`) are parsed without false milligram conversion.

---

## 4. Qualified Clinical Decision Support (CDS) Reporting

To prevent the **negative proof fallacy** (assuming a drug is universally safe simply because no rule exists in a local database):
- Regimens with no indexed hazards are labeled `NO_INDEXED_HAZARDS_IDENTIFIED` rather than "PROVEN_SAFE".
- Evaluated vs uncompleted checks are itemized in `checks_accounting`:
  - `drug_interaction_check`: `EVALUATED` | `SKIPPED`
  - `duplicate_therapy_check`: `EVALUATED` | `SKIPPED`
  - `renal_safety_check`: `EVALUATED` | `INCOMPLETE_MISSING_OR_INVALID_BIOMARKER` | `NOT_APPLICABLE`
  - `condition_contraindication_check`: `EVALUATED` | `NO_CONDITIONS_RECORDED`
  - `allergy_contraindication_check`: `EVALUATED` | `NO_ALLERGIES_RECORDED`
  - `pregnancy_safety_check`: `EVALUATED` | `NOT_APPLICABLE_PATIENT_NOT_PREGNANT`
  - `dose_ceiling_check`: `NOT_EVALUATED_REQUIRES_CUMULATIVE_DAILY_SCHEDULE`
  - `formulary_coverage`: `FULL_COVERAGE` | `PARTIAL_UNVERIFIED_ENTITIES`

---

## 5. Clinical Reference Coverage & Architectural Limitations

1. **Cumulative Daily Dose Ceilings (`max_daily_dose_mg`)**:
   - `drug_reference.csv` provides static adult 24-hour cumulative dose ceilings (`max_daily_dose_mg`).
   - Prescription inputs convey per-administration unit doses (e.g. `500 mg`) without standardized, verified dosing frequency (e.g. QID, PRN) or 24-hour schedule duration.
   - Comparing a single administered unit dose against a 24-hour cumulative ceiling is clinically invalid, while assuming unit dose equals daily dose risks severe under-detection or false security.
   - Consequently, MedGuard reports `dose_ceiling_check: "NOT_EVALUATED_REQUIRES_CUMULATIVE_DAILY_SCHEDULE"` in check accounting rather than fabricating an unverified cumulative dosing rule. Renal-specific dose caps tied to verified kidney function tiers remain strictly enforced.
2. **Pregnancy Safety Stratification (FDA Categories A, B, C, D, X, N)**:
   - **Category X**: Absolute contraindication (`CONTRAINDICATED`, `CONFIRMED_HAZARD`).
   - **Category D**: Positive evidence of human fetal risk (`MAJOR`, `CONFIRMED_HAZARD`).
   - **Category C**: Animal risk or lack of adequate human data (`MODERATE`, `REQUIRES_CLINICAL_REVIEW`).
   - **Category N**: Unclassified pregnancy safety in reference formulary (`INSUFFICIENT_DATA`, `DATA_GAP`).
   - Regimens containing Category C or Category N medications never report `is_safe: true` when a patient is flagged as pregnant.
3. **Explicit Handling of Unrecognized Severity Values**:
   - When external clinical reference records contain unrecognized or empty severity values, the engine maps them strictly to `INSUFFICIENT_DATA` with an explicit clinical review flag.
   - The engine never invents a `MAJOR` or `CONTRAINDICATED` severity rating for unclassified reference rows.

### Mandatory Clinical Disclaimer
*MedGuard provides clinical decision support intelligence for licensed healthcare professionals. MedGuard does not autonomously alter, withhold, or discontinue any medication. Prescribing clinician verification is required for all regimens.*
