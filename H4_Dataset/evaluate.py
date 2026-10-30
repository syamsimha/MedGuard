#!/usr/bin/env python3
"""H4 - Medication Safety Second Pair of Eyes: official scorer.

Usage:
    python evaluate.py --submission submission/H4_predictions.csv --truth data/train_labels.csv [--out score.json]

The resolution files are found automatically next to the given files:
    submission/H4_predictions.csv  ->  submission/H4_resolution.csv   ("predictions" replaced by "resolution")
    data/train_labels.csv          ->  data/train_resolution.csv      ("_labels"/"_truth" replaced by "_resolution")
Override with --submission-resolution / --truth-resolution.

Standard library + numpy + pandas only. Deterministic. Exit code 2 on any format error.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd

# ----------------------------------------------------------------------------- constants (repeated in README)
ISSUE_TYPES = ["interaction", "duplicate_therapy", "renal_dose", "contraindication"]
SEVERITIES = ["contraindicated", "major", "moderate", "minor"]
SERIOUS = {"contraindicated", "major"}
W_SERIOUS_RECALL = 0.40      # recall on serious (contraindicated + major) true issues
W_NEAR_MISS_RECALL = 0.15    # recall on the seeded near-miss issues (all serious)
W_PRECISION = 0.15           # share of your alerts that match a true issue (any severity)
W_GRADED_RECALL = 0.15       # share of non-minor true issues matched WITH the exact correct severity
W_RESOLUTION = 0.15          # share of written medication entries resolved to the exact set of generics
NOISE_TOLERANCE = 2.0        # noise per patient at which the alert-fatigue multiplier reaches 0
MINOR_NOISE_WEIGHT = 0.25    # an alert that matches a true MINOR issue counts as 0.25 of a false alert
PRED_COLS = ["patient_id", "issue_type", "severity", "drugs_involved", "suggested_action", "confidence"]
RES_COLS = ["patient_id", "written_token", "resolved_generic"]
TRUTH_COLS = ["patient_id", "issue_type", "severity", "drugs_involved", "near_miss"]


def fail(msg: str) -> None:
    print("\nSUBMISSION FORMAT ERROR\n" + "-" * 60 + "\n" + msg + "\n" + "-" * 60, file=sys.stderr)
    sys.exit(2)


_INVISIBLE = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\u00ad"), None)


def clean(s) -> str:
    """Unicode NFKC, drop zero-width characters, collapse whitespace (incl. NBSP), strip."""
    s = unicodedata.normalize("NFKC", str(s)).translate(_INVISIBLE)
    return re.sub(r"\s+", " ", s).strip()


def norm_pid(s) -> str:
    return clean(s).upper()


def norm_drugs(s: str) -> frozenset:
    return frozenset(clean(x).lower() for x in clean(s).split(";") if clean(x))


def norm_token(s: str) -> str:
    return clean(s).lower()


def read_csv(path: Path, what: str) -> pd.DataFrame:
    if not path.exists():
        fail(f"{what} file not found: {path}\nCheck the path (relative to where you run the command).")
    try:
        return pd.read_csv(path, dtype=str, keep_default_na=False)
    except Exception as e:  # noqa: BLE001
        fail(f"Could not read {what} file {path} as CSV: {e}")


def resolution_path_for_submission(p: Path) -> Path:
    if "predictions" not in p.name:
        fail(f"Cannot derive the resolution file name from {p.name} (expected 'predictions' in the name). "
             "Pass --submission-resolution explicitly.")
    return p.with_name(p.name.replace("predictions", "resolution"))


def resolution_path_for_truth(p: Path) -> Path:
    stem = p.stem
    for suf in ("_labels", "_truth"):
        if stem.endswith(suf):
            return p.with_name(stem[: -len(suf)] + "_resolution" + p.suffix)
    fail(f"Cannot derive the truth resolution file from {p.name}; pass --truth-resolution.")


def validate_predictions(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in PRED_COLS if c not in df.columns]
    if missing:
        fail(f"Predictions file is missing column(s): {missing}\nRequired columns (exact names): {PRED_COLS}")
    df = df[PRED_COLS].copy()
    for c in ["patient_id", "issue_type", "severity", "drugs_involved", "suggested_action"]:
        df[c] = df[c].map(clean)
    df["patient_id"] = df.patient_id.map(norm_pid)
    if (df.patient_id == "").any():
        fail(f"{int((df.patient_id == '').sum())} row(s) have an empty patient_id.")
    df["issue_type"] = df.issue_type.str.lower()
    bad = df[~df.issue_type.isin(ISSUE_TYPES)]
    if len(bad):
        fail(f"{len(bad)} row(s) have an invalid issue_type, e.g. {bad.issue_type.iloc[0]!r} (row {bad.index[0] + 2}).\n"
             f"Allowed values: {ISSUE_TYPES}")
    df["severity"] = df.severity.str.lower()
    bad = df[~df.severity.isin(SEVERITIES)]
    if len(bad):
        fail(f"{len(bad)} row(s) have an invalid severity, e.g. {bad.severity.iloc[0]!r} (row {bad.index[0] + 2}).\n"
             f"Allowed values: {SEVERITIES}")
    if (df.drugs_involved == "").any():
        r = df.index[df.drugs_involved == ""][0]
        fail(f"Row {r + 2}: drugs_involved is empty. List the generic name(s), separated by ';' (e.g. 'aspirin;warfarin').")
    if df.drugs_involved.str.contains(",").any():
        r = df.index[df.drugs_involved.str.contains(",")][0]
        fail(f"Row {r + 2}: drugs_involved contains a comma ({df.drugs_involved[r]!r}). Separate generic names with ';'.")
    if (df.suggested_action == "").any():
        r = df.index[df.suggested_action == ""][0]
        fail(f"Row {r + 2}: suggested_action is empty. Every alert needs a concrete suggested action.")
    conf = pd.to_numeric(df.confidence, errors="coerce")
    if conf.isna().any() or (conf < 0).any() or (conf > 1).any():
        r = df.index[conf.isna() | (conf < 0) | (conf > 1)][0]
        fail(f"Row {r + 2}: confidence must be a number between 0 and 1 (got {df.confidence[r]!r}).")
    df["confidence"] = conf
    df["drug_set"] = df.drugs_involved.map(norm_drugs)
    if (df.drug_set.map(len) == 0).any():
        r = df.index[df.drug_set.map(len) == 0][0]
        fail(f"Row {r + 2}: drugs_involved {df.drugs_involved[r]!r} contains no drug name.")
    key = df.patient_id + "|" + df.issue_type + "|" + df.drug_set.map(lambda s: ";".join(sorted(s)))
    dup = key.duplicated(keep=False)
    if dup.any():
        r = df.index[dup][0]
        fail(f"Duplicate alert: patient {df.patient_id[r]} / {df.issue_type[r]} / {sorted(df.drug_set[r])} appears more than once "
             f"(first at row {r + 2}). Each (patient_id, issue_type, set of drugs) may appear only once.")
    return df


def validate_resolution(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in RES_COLS if c not in df.columns]
    if missing:
        fail(f"Resolution file is missing column(s): {missing}\nRequired columns (exact names): {RES_COLS}")
    df = df[RES_COLS].copy()
    df["patient_id"] = df.patient_id.map(norm_pid)
    df["tok"] = df.written_token.map(norm_token)
    if (df.tok == "").any():
        fail("Resolution file has row(s) with an empty written_token.")
    dup = (df.patient_id + "|" + df.tok).duplicated(keep=False)
    if dup.any():
        r = df.index[dup][0]
        fail(f"Resolution file: written_token {df.written_token[r]!r} for patient {df.patient_id[r]} appears more than once "
             f"(row {r + 2}). One row per (patient_id, written_token).")
    if df.resolved_generic.str.contains(",").any():
        r = df.index[df.resolved_generic.str.contains(",")][0]
        fail(f"Resolution file row {r + 2}: use ';' (not ',') between generic names in resolved_generic.")
    df["gen_set"] = df.resolved_generic.map(norm_drugs)
    return df


def score(pred: pd.DataFrame, res: pd.DataFrame, truth: pd.DataFrame, tres: pd.DataFrame) -> dict:
    tres = tres.copy()
    tres["patient_id"] = tres.patient_id.map(norm_pid)
    truth = truth.copy()
    truth["patient_id"] = truth.patient_id.map(norm_pid)
    scope = set(tres.patient_id)
    if len(pred) and not pred.patient_id.isin(scope).any():
        fail("None of the patient_ids in your predictions file are in this truth file. "
             "Did you score test predictions against train labels (or vice versa), or change the id format?")
    if len(res) and not res.patient_id.isin(scope).any():
        fail("None of the patient_ids in your resolution file are in this truth file - check you passed the right files.")
    n_pat = len(scope)
    truth = truth[truth.patient_id.isin(scope)].copy()
    truth["drug_set"] = truth.drugs_involved.map(norm_drugs)
    truth["key"] = list(zip(truth.patient_id, truth.issue_type, truth.drug_set))
    truth["near_miss"] = pd.to_numeric(truth.near_miss, errors="coerce").fillna(0).astype(int)
    tmap = {k: (s, nm) for k, s, nm in zip(truth.key, truth.severity, truth.near_miss)}

    n_extra = int((~pred.patient_id.isin(scope)).sum())
    pred = pred[pred.patient_id.isin(scope)].copy()
    pred["key"] = list(zip(pred.patient_id, pred.issue_type, pred.drug_set))
    pred["matched"] = pred.key.map(lambda k: k in tmap)
    pred["true_sev"] = pred.key.map(lambda k: tmap[k][0] if k in tmap else None)
    matched_keys = set(pred.key[pred.matched])
    pred_sev = dict(zip(pred.key, pred.severity))

    serious = truth[truth.severity.isin(SERIOUS)]
    nm = truth[truth.near_miss == 1]
    nonminor = truth[truth.severity != "minor"]
    serious_recall = float(serious.key.isin(matched_keys).mean()) if len(serious) else 0.0
    nm_recall = float(nm.key.isin(matched_keys).mean()) if len(nm) else 0.0
    precision = float(pred.matched.mean()) if len(pred) else 0.0
    graded = nonminor.key.map(lambda k: k in matched_keys and pred_sev.get(k) == tmap[k][0])
    graded_recall = float(graded.mean()) if len(nonminor) else 0.0
    false_alerts = int((~pred.matched).sum())
    minor_alerts = int((pred.matched & (pred.true_sev == "minor")).sum())
    noise_per_patient = (false_alerts + MINOR_NOISE_WEIGHT * minor_alerts) / max(n_pat, 1)
    fatigue_multiplier = max(0.0, 1.0 - noise_per_patient / NOISE_TOLERANCE)

    # resolution
    sub = {(p, t): g for p, t, g in zip(res.patient_id, res.tok, res.gen_set)}
    tres["tok"] = tres.written_token.map(norm_token)
    tres["gen_set"] = tres.resolved_generic.map(norm_drugs)
    tres["pred"] = [sub.get((p, t)) for p, t in zip(tres.patient_id, tres.tok)]
    tres["correct"] = [pg is not None and pg == tg for pg, tg in zip(tres.pred, tres.gen_set)]
    resolution_accuracy = float(tres.correct.mean()) if len(tres) else 0.0
    n_tok_missing = int(tres.pred.isna().sum())
    per_kind = {}
    if "token_kind" in tres.columns:
        for k, d in tres.groupby("token_kind"):
            per_kind[k] = round(float(d.correct.mean()), 4)
        mis = tres[tres.token_kind.str.startswith("misspelled")]
        res_mis = float(mis.correct.mean()) if len(mis) else None
    else:
        res_mis = None
    pats_without_res = sorted(scope - set(res.patient_id))

    base = (W_SERIOUS_RECALL * serious_recall + W_NEAR_MISS_RECALL * nm_recall + W_PRECISION * precision
            + W_GRADED_RECALL * graded_recall + W_RESOLUTION * resolution_accuracy)
    primary = float(np.clip(base * fatigue_multiplier, 0.0, 1.0))

    per_type = {}
    for t in ISSUE_TYPES:
        s = serious[serious.issue_type == t]
        per_type[t] = dict(serious_true=int(len(s)), serious_recall=round(float(s.key.isin(matched_keys).mean()), 4) if len(s) else None,
                           alerts=int((pred.issue_type == t).sum()), alerts_matched=int((pred.matched & (pred.issue_type == t)).sum()))
    return dict(
        primary_score=round(primary, 6),
        score_range="0 (worst) to 1 (best)",
        components=dict(serious_recall=round(serious_recall, 6), near_miss_serious_recall=round(nm_recall, 6),
                        precision_all=round(precision, 6), graded_recall_non_minor=round(graded_recall, 6),
                        resolution_accuracy=round(resolution_accuracy, 6), base_score=round(base, 6),
                        noise_alerts_per_patient=round(noise_per_patient, 6), alert_fatigue_multiplier=round(fatigue_multiplier, 6)),
        counts=dict(patients_scored=n_pat, true_issues=int(len(truth)), true_serious=int(len(serious)), true_near_miss=int(len(nm)),
                    alerts_scored=int(len(pred)), alerts_matched=int(pred.matched.sum()), false_alerts=false_alerts,
                    alerts_on_minor_issues=minor_alerts, alerts_ignored_unknown_patient=n_extra,
                    tokens_scored=int(len(tres)), tokens_without_prediction=n_tok_missing,
                    patients_without_resolution_rows=len(pats_without_res)),
        per_issue_type=per_type,
        resolution_accuracy_misspelled=None if res_mis is None else round(res_mis, 6),
        resolution_accuracy_by_token_kind=per_kind,
        constants=dict(W_SERIOUS_RECALL=W_SERIOUS_RECALL, W_NEAR_MISS_RECALL=W_NEAR_MISS_RECALL, W_PRECISION=W_PRECISION,
                       W_GRADED_RECALL=W_GRADED_RECALL, W_RESOLUTION=W_RESOLUTION, NOISE_TOLERANCE=NOISE_TOLERANCE,
                       MINOR_NOISE_WEIGHT=MINOR_NOISE_WEIGHT),
        _missing_patients_example=pats_without_res[:5],
    )


def main(argv=None):
    ap = argparse.ArgumentParser(description="Score an H4 submission.")
    ap.add_argument("--submission", required=True, help="path to H4_predictions.csv")
    ap.add_argument("--truth", required=True, help="path to the truth labels (e.g. data/train_labels.csv)")
    ap.add_argument("--submission-resolution", default=None, help="default: predictions file name with 'predictions'->'resolution'")
    ap.add_argument("--truth-resolution", default=None, help="default: truth file name with '_labels'/'_truth'->'_resolution'")
    ap.add_argument("--out", default="score.json")
    a = ap.parse_args(argv)
    sp, tp = Path(a.submission), Path(a.truth)
    srp = Path(a.submission_resolution) if a.submission_resolution else resolution_path_for_submission(sp)
    trp = Path(a.truth_resolution) if a.truth_resolution else resolution_path_for_truth(tp)

    truth = read_csv(tp, "truth")
    tres = read_csv(trp, "truth resolution")
    for c in TRUTH_COLS:
        if c not in truth.columns:
            fail(f"Truth file {tp} lacks column {c!r} - did you pass the right file?")
    pred = validate_predictions(read_csv(sp, "predictions"))
    if srp.exists():
        res = validate_resolution(read_csv(srp, "resolution"))
        res_missing = False
    else:
        res = validate_resolution(pd.DataFrame(columns=RES_COLS))
        res_missing = True
    out = score(pred, res, truth, tres)
    if res_missing:
        print("!" * 66 + f"\nWARNING: resolution file NOT FOUND ({srp}).\n"
              "Resolution accuracy is scored as 0 (worst case). Submit H4_resolution.csv next to your predictions.\n" + "!" * 66)

    c, n = out["components"], out["counts"]
    print("=" * 66)
    print("H4 Medication Safety Checker - evaluation")
    print("=" * 66)
    print(f"Patients scored            : {n['patients_scored']}")
    print(f"True issues (serious)      : {n['true_issues']} ({n['true_serious']}), near-misses: {n['true_near_miss']}")
    print(f"Your alerts / matched      : {n['alerts_scored']} / {n['alerts_matched']}")
    print(f"Serious-issue recall       : {c['serious_recall']:.4f}   (weight {W_SERIOUS_RECALL})")
    print(f"NEAR-MISS recall           : {c['near_miss_serious_recall']:.4f}   (weight {W_NEAR_MISS_RECALL})")
    print(f"Precision (all alerts)     : {c['precision_all']:.4f}   (weight {W_PRECISION})")
    print(f"Graded recall (severity ok): {c['graded_recall_non_minor']:.4f}   (weight {W_GRADED_RECALL})")
    print(f"Resolution accuracy        : {c['resolution_accuracy']:.4f}   (weight {W_RESOLUTION})")
    if out["resolution_accuracy_misspelled"] is not None:
        print(f"  ...on misspelled entries : {out['resolution_accuracy_misspelled']:.4f}")
    print(f"Noise alerts per patient   : {c['noise_alerts_per_patient']:.4f}  (false + {MINOR_NOISE_WEIGHT} x minor; tolerance {NOISE_TOLERANCE})")
    print(f"Alert-fatigue multiplier   : {c['alert_fatigue_multiplier']:.4f}")
    print("-" * 66)
    print(f"PRIMARY SCORE              : {out['primary_score']:.4f}   (0 worst - 1 best)")
    print("=" * 66)
    if n["patients_without_resolution_rows"]:
        print(f"WARNING: {n['patients_without_resolution_rows']} patient(s) have NO rows in your resolution file "
              f"(scored as wrong), e.g. {out['_missing_patients_example']}")
    if n["tokens_without_prediction"]:
        print(f"WARNING: {n['tokens_without_prediction']} written medication entries have no resolution prediction (scored as wrong).")
    if n["alerts_ignored_unknown_patient"] > max(n["alerts_scored"], 1):
        print(f"WARNING: most of your alerts ({n['alerts_ignored_unknown_patient']}) are for patients not in this truth file.")
    elif n["alerts_ignored_unknown_patient"]:
        print(f"Note: {n['alerts_ignored_unknown_patient']} alert(s) for patients not in this truth file were ignored.")
    out.pop("_missing_patients_example")
    Path(a.out).write_text(json.dumps(out, indent=2))
    print(f"Wrote {a.out}")
    return out


if __name__ == "__main__":
    main()
