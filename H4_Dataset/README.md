# H4 — The Medication Safety Second Pair of Eyes

**Scenario.** A patient at **Chandrapuri District Hospital** (a fictional government district hospital) takes medicines prescribed by up to three different doctors over two years. These are a physician, a specialist (cardiology, orthopaedics, psychiatry…) and an OPD or private-clinic doctor. Nobody has the full list.

A ward nurse copies everything the patient brings into one consolidated list. This includes handwritten slips, old strips and bottles. The list mixes brand names, generic names, abbreviations and misspellings. (A **brand name** is a company's product name, for example `Glycomet`. A **generic name** is the medicine inside it, for example `metformin`.)

Dangerous problems slip through: drug–drug interactions, duplicate therapies, kidney-unsafe doses and drug–condition contraindications. This happens especially in elderly patients on 8 or more medicines.

**Problem statement.** You get a patient's consolidated medication list and basic clinical context: age, weight, eGFR (a kidney-function value), pregnancy status, diagnoses and allergies. Your job is to **flag the safety risks**.

- Each alert needs a clear severity and a specific suggested action for the prescriber.
- Alert fatigue is the real enemy, and it is scored. (Alert fatigue means doctors stop reading alerts when too many are useless.) You are rewarded for catching serious problems. You are penalised for noisy, low-value alerts.
- You must also **resolve every written medication entry to its generic name(s)**. Doing this resolution well is much of the real difficulty.

> **In short**
>
> - **You get:** simplified drug reference tables, 1,500 training patients with their true safety issues, and 3,500 test patients whose issues are hidden.
> - **You build:** an automated pipeline that (1) resolves every written medication entry to its generic name(s) and (2) flags safety issues (interaction, duplicate therapy, renal dose, contraindication), each with a severity and a suggested action.
> - **You submit:** two files inside `teamID_H4.zip`: `submission/H4_predictions.csv` and `submission/H4_resolution.csv`. You also include all your code and a `README.md` (see **What to submit**).
> - **You are scored:** mainly on how many serious issues you catch. Noisy, useless alerts reduce your score. The score runs from 0 to 1; higher is better.
> - **Special rules:** predictions must come from your automated pipeline (no hand-labelling of test patients). Show "confidence and limitations" text with every alert, plus a disclaimer that **a clinician decides**. Never claim a list is "safe".

---

## Synthetic data notice

All healthcare data is synthetic. No team may use real patient data. Every healthcare solution must be positioned as clinician-assisting, not clinician-replacing, and must include a safety/escalation path. Teams that present an autonomous diagnostic system without a human-in-the-loop will lose points on the Responsibility criterion.

**Drug names.** With organiser approval, this dataset uses **real generic drug names and real, common Indian brand names**. This makes the brand-to-generic problem realistic.

- The drug facts are **simplified for this hackathon; not a clinical reference.**
- The interaction table, the renal rules and the contraindication list are deliberately small, simplified subsets.
- Severity grades follow common references. But they are not complete and must not be used to treat real patients.
- Pregnancy letters use the retired US FDA A/B/C/D/X system as a simplified teaching field ('N' = not classified here).
- The pregnancy logic has **no trimester information**. Only letters D/X and the listed pregnancy rows are labelled. So, for example, NSAIDs (anti-inflammatory painkillers) in late pregnancy (avoid from about 30 weeks in real practice) are **not** labelled in this simplified exercise.
- Patients, the hospital and all records are fictional.

**What your solution must show.** Your solution must show a **"confidence and limitations"** text with every alert, plus a mandatory disclaimer that **a clinician decides**. It must never claim a list is "safe". It may only say that no issue was found *in what it saw*, because the list may be incomplete.

---

## What's in the box

| File | Rows | Description |
|---|---|---|
| `data/drug_reference.csv` | 496 | Simplified drug reference: generic, class, therapeutic group, duplicate-therapy group, common Indian brands, dose forms, usual dose, max daily dose, renal flag/rule, pregnancy letter |
| `data/combination_brands.csv` | 98 | Combination brands (79 brands, some with several strengths) → generic components and strengths |
| `data/interactions.csv` | 2,196 | Curated drug–drug interaction pairs with severity, effect and recommended action |
| `data/renal_rules.csv` | 169 | Kidney-function (eGFR) dose rules: threshold, severity, action (136 drugs) |
| `data/duplicate_therapy_groups.csv` | 74 | Duplicate-therapy groups, their severity, action and member generics |
| `data/drug_disease_contraindications.csv` | 152 | Drug × condition / allergy / pregnancy contraindications with severity and action |
| `data/conditions.csv` | 58 | Condition ids used in the contraindication table, with a few example terms |
| `data/patients_train.csv` | 1,500 | Training patients (labels public) |
| `data/patients_test.csv` | 3,500 | Test patients (labels hidden) |
| `data/train_labels.csv` | 3,241 | True safety issues for training patients (incl. 90 seeded near-misses) |
| `data/train_resolution.csv` | 9,087 | Every written medication entry of training patients → its generic(s) |
| `evaluate.py` | – | Official scorer (same file the organisers use on the hidden test truth) |
| `baseline/baseline.py` | – | Simple, honest baseline: exact-match lookup + interaction-table join |
| `sample_submission_H4_predictions.csv`, `sample_submission_H4_resolution.csv` | – | A valid submission for the TEST patients (the baseline's output) |

All files are UTF-8 CSV with a header row. Some cells are empty. To keep empty cells as empty strings, load files with `pd.read_csv(path, keep_default_na=False)`.

Words used in this README:

- **Combination brand:** one product that contains two or more generics, for example `Glycomet-GP` (glimepiride + metformin).
- **Interaction:** two drugs that are risky when taken together.
- **Duplicate therapy:** the same drug, or two drugs of the same kind, given in separate entries.
- **Renal dose issue:** a drug or dose that is unsafe when kidney function is low. "Renal" means kidney.
- **eGFR:** an estimate of kidney function calculated from a blood test (creatinine), in mL/min/1.73m². Lower means weaker kidneys.
- **Contraindication:** a drug that should not be used (or needs great care) with a patient's condition, allergy or pregnancy.
- **Near-miss:** a deliberately seeded serious issue that is hidden in a way that is easy to miss (see the list below).
- **Resolution:** turning one written entry into its generic name(s).

---

## Data dictionary

### `drug_reference.csv`

| Column | Type | Description | Example | Missing? |
|---|---|---|---|---|
| drug_id | str | Random drug id | DRG1100 | no |
| generic_name | str | Canonical generic name. **Use exactly these names in your outputs** | acarbose | no |
| drug_class | str | Pharmacological class | Alpha-glucosidase inhibitor | no |
| therapeutic_group | str | Broad therapeutic area | Diabetes & metabolic | no |
| duplicate_group | str | Duplicate-therapy group id (see `duplicate_therapy_groups.csv`) | agi | yes (no group) |
| common_brands | str | Common Indian single-ingredient brands, `;`-separated | Glucobay | yes |
| dose_forms | str | `;`-separated forms (tab, cap, inj, syrup, inhaler…) | tab | no |
| usual_adult_daily_dose_range | str | Simplified usual adult dose (text) | 25-100 mg three times daily | no |
| max_daily_dose_mg | float | Simplified max daily dose in mg where meaningful | 300.0 | yes |
| renal_adjustment_flag | Y/N | Y if the drug has rows in `renal_rules.csv` | N | no |
| renal_rule | str | Compact form of the renal tiers, e.g. `egfr<45:moderate\|egfr<30:major` | | yes |
| pregnancy_category | A/B/C/D/X/N | Simplified (retired) FDA letter; N = not classified here | B | no |
| notes | str | Short notes | | yes |

### `combination_brands.csv`

| Column | Type | Description | Example |
|---|---|---|---|
| brand_name | str | Combination brand | Glycomet-GP |
| strength_label | str | Strength variant as usually written after the name (may be blank) | 1 |
| dose_form | str | Form | tab |
| components | str | Components with strengths | glimepiride 1 mg + metformin 500 mg |
| generic_components | str | Generic names, `;`-separated, sorted | glimepiride;metformin |

### `interactions.csv`

| Column | Type | Description | Example |
|---|---|---|---|
| drug_a, drug_b | str | Generic names, `drug_a < drug_b` alphabetically | aceclofenac, acenocoumarol |
| severity | str | contraindicated / major / moderate / minor | major |
| mechanism_effect | str | Short effect / mechanism | Increased bleeding risk… |
| recommended_action | str | Suggested action | Avoid the NSAID; use paracetamol… |

### `renal_rules.csv`

| Column | Type | Description | Example |
|---|---|---|---|
| generic_name | str | Generic | metformin |
| egfr_below | int | The tier applies when eGFR **<** this value (strictly less) | 30 |
| severity | str | Severity of the tier | major |
| recommended_action | str | Action | Stop metformin… |

### `duplicate_therapy_groups.csv`

| Column | Type | Description |
|---|---|---|
| duplicate_group | str | Group id (matches `drug_reference.duplicate_group`) |
| group_name | str | Human-readable name |
| severity | str | Severity of a duplicate within this group |
| recommended_action | str | Action |
| member_generics | str | Members, `;`-separated |

### `drug_disease_contraindications.csv`

| Column | Type | Description | Example |
|---|---|---|---|
| condition_id | str | Condition / allergy / `pregnancy` (see `conditions.csv`) | asthma |
| condition_name | str | Readable name | Asthma |
| generic_name | str | Generic | propranolol |
| severity | str | contraindicated / major / moderate | contraindicated |
| reason | str | Why | Non-selective beta-blockade… |
| recommended_action | str | Action | Stop; use … |

### `conditions.csv`

Columns: `condition_id`, `condition_name`, `kind` (diagnosis / pregnancy_field / allergy), `description`, `example_terms`.

`example_terms` gives a **few** examples only. Real diagnosis text is much more varied.

### `patients_train.csv` / `patients_test.csv`

| Column | Type | Description | Example | Missing? |
|---|---|---|---|---|
| patient_id | str | Random patient id | H4P-0166PVZK | no |
| age | int | Years | 73 | no |
| sex | M/F | | M | no |
| weight_kg | float | Body weight | 61.4 | yes |
| egfr_ml_min_1_73m2 | int | Most recent eGFR (kidney function) | 28 | yes |
| pregnant | Y / N / NA | Pregnancy status (NA for males) | N | no |
| diagnoses | str | Free-text diagnoses, usually `;`-separated, with abbreviations and variants | HTN; DM2; CKD 3b; post MI | no |
| allergies | str | Free-text allergy history | NKDA | yes |
| medication_list | str | Consolidated list as transcribed by the nurse. **Entries are separated by `;` or by line breaks.** | Tab Glycomet-GP 1 1-0-1; pantop 40 od; Dolo 650 sos | no |
| prescriber_count | int | Number of different prescribers (1–3) whose prescriptions are in the list | 3 | no |

### `train_labels.csv` (the hidden `test_truth.csv` has the same schema)

| Column | Type | Description | Example |
|---|---|---|---|
| issue_id | str | Random id | ISS-IIWD1LPZ |
| patient_id | str | Patient | H4P-00CMDDBN |
| issue_type | str | interaction / duplicate_therapy / renal_dose / contraindication | interaction |
| severity | str | contraindicated / major / moderate / minor | major |
| drugs_involved | str | Generic names, `;`-separated, sorted | domperidone;escitalopram |
| suggested_action | str | Reference action (from the tables) | Avoid combination if possible… |
| near_miss | 0/1 | 1 = one of the deliberately seeded near-miss cases | 0 |

### `train_resolution.csv` (the hidden test version has the same schema)

| Column | Type | Description | Example |
|---|---|---|---|
| patient_id | str | Patient | H4P-00CMDDBN |
| written_token | str | One medication entry exactly as written (after splitting on `;` / line breaks and trimming spaces) | T croken 500 mg SOS |
| resolved_generic | str | Generic name(s) of that entry, `;`-separated, sorted. **Empty** if the line is not a medicine | paracetamol |
| token_kind | str | How the entry was written (exact_brand, brand_variant, generic, synonym, abbreviation, generic_combo, misspelled_brand, misspelled_generic, misspelled_truncated, non_drug). Use it to measure your resolver; it is not needed for scoring | misspelled_brand |

---

## How the labels are defined (the reference tables are authoritative)

Labels were produced by a deterministic rule engine (a fixed set of rules that gives the same result every time). It runs on each patient's *true* current regimen, meaning the generics behind the written entries. It uses the tables above.

**For this exercise, the tables are complete and authoritative.** If a pair is not in `interactions.csv`, it is not an interaction issue here.

There are four issue types:

1. **interaction**
    - Every pair of *different* generics in the current regimen that appears in `interactions.csv`.
    - Severity is the table severity.
    - `drugs_involved` holds both generics.
2. **duplicate_therapy**. There are two cases:
    - (a) The *same generic* appears in two or more list entries. This includes a combination brand plus a single brand, or a brand plus its generic name. `drugs_involved` = that one generic.
    - (b) Two *different* generics from the same `duplicate_group` are written in *different* entries. Components of a single combination product are intended to be taken together, so they do not count. `drugs_involved` = the two generics.
    - Severity = the group's severity in `duplicate_therapy_groups.csv`. A drug with no group defaults to **moderate**.
3. **renal_dose**
    - Labelled when eGFR is recorded and is below a tier's `egfr_below` (strictly `<`).
    - The issue takes the severity and action of the **most restrictive applicable tier**. This is the lowest threshold that eGFR is below.
    - **If eGFR is missing, no renal issue is labelled.**
    - Renal rules use the eGFR field only, never the "CKD" text.
    - eGFR is used as a simplification of creatinine clearance.
4. **contraindication**
    - Each drug in the regimen is checked against `drug_disease_contraindications.csv` for:
        - the patient's conditions (from the diagnosis text);
        - allergies (from the allergy text);
        - pregnancy (`pregnant = Y`).
    - When `pregnant = Y`, pregnancy letter **X → contraindicated** and **D → major** also apply.
    - A drug gets **at most one** contraindication issue, at the most severe applicable level.

General points:

- A combination brand counts as each of its generic components.
- Lines that are not current medicines do not belong to the regimen. These are notes such as "Physiotherapy", and medicines explicitly marked as stopped or discontinued.
- Each issue is identified by **(patient_id, issue_type, set of drugs)**.

Two grading notes:

- **Paracetamol duplication** is graded **major**, because of the overdose and liver-toxicity risk. An example is a combination brand containing paracetamol plus a separate paracetamol product.
- **Intended guideline combinations still count.** Examples: an aldosterone antagonist with an ACE inhibitor/ARB in heart failure, or digoxin with a loop diuretic. These are labelled when the table lists them, because they need monitoring. Your suggested action can say "intended - monitor potassium".

**The tables are authoritative for this exercise even where they omit real-world pairs.** If a pair, rule or contraindication is not in the tables, it is not a labelled issue here. Clinically, of course, it may still matter.

**Severity scale (single, published):** `contraindicated` > `major` > `moderate` > `minor`. **Serious = contraindicated or major.**

**Near-misses.** We deliberately seeded **300 serious issues** (≈90 in train, ≈210 in test, `near_miss = 1`). Each one is hidden behind a hard surface form, such as:

- a misspelled brand of the culprit;
- a combination brand that hides a duplicated or interacting generic;
- an eGFR just around a threshold;
- a pregnant patient on a teratogen (a drug that can harm an unborn baby) written by brand;
- an interaction across two prescribers.

---

## Know your data

- The medication text is **deliberately messy**. It mixes brands and generics. It is full of misspellings, truncations, abbreviations, odd spacing and hyphenation, and inconsistent case. Prefixes (Tab/T./Cap/Inj/Syp/Inh), strengths and frequencies (1-0-1, BD, OD, HS, SOS, "x 5 days", "after food") are mixed into the same line.
- The same brand can come in several strengths. A strength suffix can change the product (for example `Glycomet` vs `Glycomet-GP 1`). **Combination brands hide extra generics.** Resolve them before checking.
- Some lines are not medicines, and some medicines are marked as stopped.
- Diagnosis text uses abbreviations, local variants and typos ("sugar", "BA", "IHD"). Some diagnosis lists also mention conditions the patient **does not** have ("no h/o …", "… ruled out"). Allergy text is free-form too.
- Values may be missing. eGFR is blank for some patients, and so is weight.
- Every written medicine maps to a generic or a combination in the reference tables, apart from the non-medicine lines.
- The list may still be incomplete in real life. Your output must say "no issue found in what was seen", never "safe".

## Train / test split

There is no time axis, so patients are split at random by patient: 1,500 train and 3,500 test. No patient appears in both.

- Train labels and train resolution are public.
- Test labels and test resolution are hidden.
- You must predict for **every test patient** and resolve **every test medication entry**.

## What to submit

Put **two files** in a `submission/` folder inside your team zip. Both are required.

```
teamID_H4.zip                  a zip of your project (a fresh git clone)
├── README.md                  how to set up and run your code
├── submission/
│   ├── H4_predictions.csv    one row per alert
│   └── H4_resolution.csv     one row per written medication entry
└── FULL_CODE/                 This folder should contain all of your code:
                               your demo app + the code that created the
                               submission/ files
```

**Your code is required too.** Every team submits one zip of its whole project, as the *Participant Coding Guidelines* explain (zip a fresh `git clone` of your project). The zip holds **all** your code, not only the code that makes your submission files: also the code of the solution you demo (for example a web or mobile app, dashboard, API, command-line tool or notebook). It also holds your own `README.md` that explains how to set up and run everything. It is fine if everything sits inside one project folder in the zip.

- Write your **own** `README.md`. The *Participant Coding Guidelines* (rule 12) list what it must cover. If you built inside this pack's folder, replace this pack's README with yours (rename this one to `PACK_README.md` if you want to keep it).
- Put **all** your code inside a folder named exactly `FULL_CODE/`, at the top of your project: your demo app + the code that created the `submission/` files. At the top of your project, keep only `README.md`, `submission/`, `FULL_CODE/` and your `.gitignore` (plus a `LICENSE` file if you have one).
- Put `submission/` at the top of your project, next to your `README.md`.
- Commit the files in `submission/` to git. Make sure your `.gitignore` does not exclude them (for example with `*.csv` or `*.jsonl`).
- Before you commit, list `data/`, `models/`, `.env`, `.venv/` and `node_modules/` in your `.gitignore`. This keeps the pack's data files and downloaded models out of your zip. Your README should say where to put the data and how to get any models.

### File 1: `submission/H4_predictions.csv` (one row per alert)

All six columns are required.

| Column | Type | Rules |
|---|---|---|
| patient_id | str | Test patient id |
| issue_type | str | interaction / duplicate_therapy / renal_dose / contraindication |
| severity | str | contraindicated / major / moderate / minor |
| drugs_involved | str | Generic names from `drug_reference.csv`, separated by `;` (any order) |
| suggested_action | str | Non-empty, concrete action for the prescriber |
| confidence | float | 0–1 (reported, not scored) |

Example row:

```
patient_id,issue_type,severity,drugs_involved,suggested_action,confidence
H4P-0166PVZK,interaction,major,acenocoumarol;aceclofenac,Avoid NSAID; use paracetamol; check INR,0.86
```

### File 2: `submission/H4_resolution.csv` (one row per written medication entry)

| Column | Rules |
|---|---|
| patient_id | Test patient id |
| written_token | The entry exactly as it appears in `medication_list`, after splitting on `;` / line breaks and trimming. Matching ignores case and repeated spaces |
| resolved_generic | Generic name(s) `;`-separated; leave empty for a non-medicine line |

### Checklist

1. Both files are in the `submission/` folder of `teamID_H4.zip`.
2. Your predictions must come from your automated pipeline. **Hand-labelling the test patients, or having someone or something label them case by case, is not allowed.**
3. Predict for every test patient. Patients with no alerts simply have no rows in `H4_predictions.csv`.
4. The same (patient_id, issue_type, set of drugs) must not appear twice in `H4_predictions.csv`.
5. Every alert has a non-empty `suggested_action` and a `confidence` between 0 and 1.
6. Separate generic names with `;`. `evaluate.py` rejects a comma inside `drugs_involved` or `resolved_generic`.
7. `H4_resolution.csv` has one row for **every** written medication entry of every test patient.

**Tip:** to check your file format, run `evaluate.py` on your output for the training patients (see Hour Zero). It stops with a clear message if the format is wrong.

## How you're scored

`evaluate.py` matches your alerts to the truth on **(patient_id, issue_type, set of drugs_involved)**, ignoring case and order.

```
serious_recall    = matched serious true issues / all serious true issues
near_miss_recall  = matched near-miss issues / all near-miss issues
precision_all     = matched alerts / all your alerts            (0 if you send none)
graded_recall     = non-minor true issues matched WITH the exact severity / all non-minor true issues
resolution_acc    = written entries whose resolved generic set is exactly right / all entries

base = 0.40*serious_recall + 0.15*near_miss_recall + 0.15*precision_all
     + 0.15*graded_recall + 0.15*resolution_acc

noise_per_patient = (alerts that match no true issue + 0.25 x alerts that match a MINOR true issue) / patients scored
alert_fatigue_multiplier = max(0, 1 - noise_per_patient / 2.0)

primary_score = base * alert_fatigue_multiplier          (range 0 to 1, higher is better)
```

Constants: `W_SERIOUS_RECALL=0.40, W_NEAR_MISS_RECALL=0.15, W_PRECISION=0.15, W_GRADED_RECALL=0.15, W_RESOLUTION=0.15, NOISE_TOLERANCE=2.0, MINOR_NOISE_WEIGHT=0.25`.

What each part means in plain words:

- **serious_recall:** the share of true serious issues that you caught. 1 means you caught all of them. ("Recall" = how many of the real issues you found.)
- **near_miss_recall:** the share of the seeded near-miss issues that you caught. 1 is best.
- **precision_all:** the share of your alerts that match a true issue. 1 means none of your alerts is wrong. ("Precision" = how many of your alerts are correct.)
- **graded_recall:** the share of non-minor true issues that you caught **and** gave the exact right severity. 1 is best.
- **resolution_acc:** the share of written entries where your set of generics is exactly right. 1 is best.
- **base:** a weighted average of the five parts above. Serious recall has the largest weight (0.40).
- **noise_per_patient:** how many useless alerts you send per patient, on average. 0 is best.
- **alert_fatigue_multiplier:** 1 when you send no noise. It falls to 0 when noise reaches 2 per patient.
- **primary_score:** your final score, base times the multiplier. 1 is best.

Important points:

- **Alert fatigue is scored.** A false alert counts as 1 unit of noise. Minor issues are real but low-value. So an alert on a true *minor* issue counts as 0.25 units: a small cost, but cheaper than relabelling severities. A system that flags everything scores **0**. Two units of noise per patient zero your score.
- Patients or entries you leave out count as misses or wrong resolutions, and the scorer reports them loudly.
- If the resolution file is missing altogether, resolution accuracy is scored as 0 with a warning. `evaluate.py` looks for `H4_resolution.csv` in the same folder as `H4_predictions.csv`.
- Rows for unknown patients are ignored. Patient ids are matched case-insensitively.
- The score on the test patients is **20% of the judging rubric**. The rubric is: Problem framing 20%, Technical soundness 25%, Score on hidden split 20%, Real-world usability 15%, Responsibility 15%, Demo 5%.
- **Report your near-miss recall and your resolution accuracy on misspelled entries prominently.** `evaluate.py` prints both (the `NEAR-MISS recall` line and the `...on misspelled entries` line).

## Hour Zero quick start

You need Python ≥ 3.9 with `pandas` and `numpy`. Open a terminal in this folder (the one that contains this `README.md`). Run these three commands one at a time:

```bash
python baseline/baseline.py --split train --out submission_train
python evaluate.py --submission submission_train/H4_predictions.csv --truth data/train_labels.csv
python -m json.tool score.json
```

On Mac/Linux, type `python3` instead of `python`.

What these commands do:

1. The first command runs the baseline on the **training** patients. It writes `submission_train/H4_predictions.csv` and `submission_train/H4_resolution.csv`.
2. The second command scores those files against the training answers. It prints a report and saves it as `score.json`.
3. The third command shows `score.json` in a readable way.

**Check your result.** Find the line `PRIMARY SCORE` in the report. The baseline scores about **0.41** on train. Its near-miss recall is essentially 0 (0.00 on train, under 0.01 on test), because it does exact matching only and checks interactions only.

**Make the test submission.** Run this command:

```bash
python baseline/baseline.py --split test --out submission
```

It writes your test submission: `submission/H4_predictions.csv` and `submission/H4_resolution.csv`. These are the two files you put in your team zip. (They are the same as the two `sample_submission_H4_*.csv` files.) You cannot score them yourself, because the test answers are hidden.

## Assumptions you may make

- The medication list may be incomplete. The system must not claim the list is safe, only that no issue was found in what it saw.
- Brand-to-generic mapping must be resolved before checking. This is much of the real difficulty.
- The reference tables are authoritative and complete for this exercise.
- No allergy history is available unless it is present in the record.

**Stretch (optional):** a deprescribing suggestion (advice to stop or reduce medicines) for polypharmacy patients (patients on many medicines), with the reasoning chain shown.

## Licence

Synthetic data generated for the TalentAP Mega Hackathon 2026. CC BY 4.0. Contains no real personal data. Drug and brand names are used for realism only; drug facts are simplified for this hackathon; not a clinical reference.
