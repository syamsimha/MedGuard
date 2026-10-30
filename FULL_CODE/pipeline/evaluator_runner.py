#!/usr/bin/env python3
"""Official Evaluator Runner for MedGuard H4 Medication Safety Engine.

Generates official submission files:
- H4_predictions.csv
- H4_resolution.csv

Supports both train validation and test submission splits.
Optionally invokes H4_Dataset/evaluate.py to compute and display verified scores.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure MedGuard modules can be imported
MEDGUARD_ROOT = Path(__file__).resolve().parent.parent
if str(MEDGUARD_ROOT) not in sys.path:
    sys.path.insert(0, str(MEDGUARD_ROOT))

from pipeline.safety_engine import MedicationSafetyEngine
from pipeline.rules import SafetyRuleRepository, SeverityLevel, EngineConfig


PRED_COLUMNS = [
    "patient_id",
    "issue_type",
    "severity",
    "drugs_involved",
    "suggested_action",
    "confidence",
]

RES_COLUMNS = [
    "patient_id",
    "written_token",
    "resolved_generic",
]


def run_pipeline(
    patients_csv: Path,
    out_dir: Path,
    min_severity: SeverityLevel = SeverityLevel.MODERATE,
    h4_data_dir: Optional[Path] = None,
) -> Tuple[int, int, int]:
    """Runs the MedGuard safety engine over a patient dataset and exports submission CSVs.

    Returns:
        Tuple of (patient_count, alert_count, resolution_count)
    """
    repo = SafetyRuleRepository(
        external_dataset_path=str(h4_data_dir) if h4_data_dir else None
    )
    engine = MedicationSafetyEngine(repository=repo)

    out_dir.mkdir(parents=True, exist_ok=True)
    pred_path = out_dir / "H4_predictions.csv"
    res_path = out_dir / "H4_resolution.csv"

    all_alerts: List[Dict[str, Any]] = []
    all_res: List[Dict[str, Any]] = []
    patient_count = 0

    with open(patients_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            patient_count += 1
            pid = row["patient_id"].strip().upper()
            med_list = row.get("medication_list", "")
            raw_egfr = (row.get("egfr_ml_min_1_73m2") or row.get("egfr") or "").strip()
            egfr_val: Optional[float] = None
            if raw_egfr:
                try:
                    egfr_val = float(raw_egfr)
                except ValueError:
                    egfr_val = None

            preg_val = row.get("pregnant", "N").strip()
            diag_val = row.get("diagnoses", "").strip()
            allg_val = row.get("allergies", "").strip()

            alerts, res_rows = engine.evaluate_h4_patient(
                patient_id=pid,
                medication_list=med_list,
                egfr=egfr_val,
                pregnant=preg_val,
                diagnoses=diag_val,
                allergies=allg_val,
                min_severity=min_severity,
            )

            all_alerts.extend(alerts)
            all_res.extend(res_rows)

    # Write H4_predictions.csv
    with open(pred_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=PRED_COLUMNS)
        writer.writeheader()
        for a in all_alerts:
            writer.writerow({
                "patient_id": a["patient_id"],
                "issue_type": a["issue_type"],
                "severity": a["severity"],
                "drugs_involved": a["drugs_involved"],
                "suggested_action": a["suggested_action"],
                "confidence": a["confidence"],
            })

    # Write H4_resolution.csv
    with open(res_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=RES_COLUMNS)
        writer.writeheader()
        for r in all_res:
            writer.writerow({
                "patient_id": r["patient_id"],
                "written_token": r["written_token"],
                "resolved_generic": r["resolved_generic"],
            })

    return patient_count, len(all_alerts), len(all_res)


def main():
    parser = argparse.ArgumentParser(description="MedGuard H4 Submission Generator & Evaluator")
    parser.add_argument(
        "--split",
        choices=["train", "test"],
        default="train",
        help="Dataset split to evaluate ('train' or 'test')",
    )
    parser.add_argument(
        "--patients-file",
        type=str,
        default=None,
        help="Path to patients CSV file (defaults to H4_Dataset/data/patients_{split}.csv)",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default=None,
        help="Directory where H4_predictions.csv and H4_resolution.csv will be written",
    )
    parser.add_argument(
        "--min-severity",
        choices=["minor", "moderate", "major", "contraindicated"],
        default="moderate",
        help="Minimum alert severity to emit (default: moderate, suppressing minor alerts to eliminate noise)",
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Run H4_Dataset/evaluate.py after generating prediction CSVs (valid for train split)",
    )
    parser.add_argument(
        "--score-out",
        type=str,
        default=None,
        help="Optional path to output score.json when evaluating",
    )
    args = parser.parse_args()

    # Determine default paths
    h4_dir = MEDGUARD_ROOT.parent / "H4_Dataset" if (MEDGUARD_ROOT.parent / "H4_Dataset").exists() else MEDGUARD_ROOT / "H4_Dataset"
    data_dir = h4_dir / "data"

    if args.patients_file:
        patients_csv = Path(args.patients_file).resolve()
    else:
        patients_csv = data_dir / f"patients_{args.split}.csv"

    if args.out_dir:
        out_dir = Path(args.out_dir).resolve()
    else:
        if args.split == "train":
            out_dir = h4_dir / "validation_submission"
        else:
            out_dir = MEDGUARD_ROOT / "submission"

    sev_map = {
        "minor": SeverityLevel.MINOR,
        "moderate": SeverityLevel.MODERATE,
        "major": SeverityLevel.MAJOR,
        "contraindicated": SeverityLevel.CONTRAINDICATED,
    }
    min_sev = sev_map[args.min_severity]

    print(f"==================================================")
    print(f" MedGuard H4 Pipeline Runner")
    print(f"==================================================")
    print(f" Split:         {args.split}")
    print(f" Patients File: {patients_csv}")
    print(f" Output Dir:    {out_dir}")
    print(f" Min Severity:  {args.min_severity}")
    print(f"==================================================")

    pats, alerts, res = run_pipeline(
        patients_csv=patients_csv,
        out_dir=out_dir,
        min_severity=min_sev,
        h4_data_dir=data_dir,
    )

    print(f"Processed {pats:,} patients.")
    print(f"Generated {alerts:,} alerts -> {out_dir / 'H4_predictions.csv'}")
    print(f"Generated {res:,} resolutions -> {out_dir / 'H4_resolution.csv'}")

    if args.evaluate or args.split == "train":
        truth_labels = data_dir / "train_labels.csv"
        if truth_labels.exists():
            score_out = Path(args.score_out).resolve() if args.score_out else h4_dir / "score.json"
            eval_py = h4_dir / "evaluate.py"
            pred_csv = out_dir / "H4_predictions.csv"
            res_csv = out_dir / "H4_resolution.csv"

            cmd = [
                sys.executable,
                str(eval_py),
                "--submission",
                str(pred_csv),
                "--submission-resolution",
                str(res_csv),
                "--truth",
                str(truth_labels),
                "--out",
                str(score_out),
            ]
            print(f"\nRunning official scorer: {' '.join(cmd)}")
            proc = subprocess.run(cmd, capture_output=True, text=True)
            print(proc.stdout)
            if proc.stderr:
                print(proc.stderr, file=sys.stderr)

            if score_out.exists():
                with open(score_out, "r", encoding="utf-8") as f:
                    scores = json.load(f)
                print("\n==================================================")
                print(f" Official Scorer Result: Primary Score = {scores.get('primary_score')}")
                print("==================================================")
                print(json.dumps(scores, indent=2))


if __name__ == "__main__":
    main()
