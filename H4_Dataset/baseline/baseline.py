#!/usr/bin/env python3
"""H4 baseline: exact-match brand/generic lookup + interaction-table join.

Deliberately simple (and honest about it):
  * resolves a medication entry only if its cleaned name EXACTLY matches a brand, combination brand or generic name;
  * flags ONLY drug-drug interactions found in data/interactions.csv, at the table severity (minor ones included);
  * no duplicate-therapy, renal-dose or contraindication checks, no fuzzy matching.
Improve on every one of these!

Usage (from the package folder):
    python baseline/baseline.py --split train --out submission_train
    python baseline/baseline.py --split test  --out submission
Writes <out>/H4_predictions.csv and <out>/H4_resolution.csv.
"""
from __future__ import annotations

import argparse
import re
from itertools import combinations
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent.parent
DATA = HERE / "data"

FORM_WORDS = {"tab", "tab.", "t.", "t", "cap", "cap.", "c.", "inj", "inj.", "syp", "syp.", "syr", "inh", "inh.", "mdi", "rotacap",
              "sachet", "sach.", "patch", "susp", "drops", "powder", "neb", "respule", "gel"}
STOP_WORDS = {"od", "bd", "tds", "hs", "sos", "prn", "bid", "tid", "once", "twice", "x", "at", "if", "after", "before", "weekly",
              "every", "daily", "puffs", "puff", "empty", "ml", "u", "-", "--", "(cont.)"}


def key(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def build_lookup():
    ref = pd.read_csv(DATA / "drug_reference.csv", keep_default_na=False)
    combos = pd.read_csv(DATA / "combination_brands.csv", keep_default_na=False)
    lk = {}
    for g, brands in zip(ref.generic_name, ref.common_brands):
        lk[key(g)] = [g]
        for b in [x for x in brands.split(";") if x]:
            lk[key(b)] = [g]
    for b, comps in zip(combos.brand_name, combos.generic_components):
        lk.setdefault(key(b), comps.split(";"))
    return lk


def split_entries(med_list: str):
    return [t.strip() for t in re.split(r"[;\n]", str(med_list)) if t.strip()]


def resolve(entry: str, lk: dict):
    words = entry.split()
    while words and words[0].lower() in FORM_WORDS:
        words = words[1:]
    name = []
    for w in words:
        lw = w.lower()
        if lw in STOP_WORDS or re.match(r"^[0-9]", lw) or re.fullmatch(r"[0-9]-[0-9]-[0-9].*", lw):
            break
        name.append(w)
    for n in range(len(name), 0, -1):  # longest exact match first
        k = key(" ".join(name[:n]))
        if k in lk:
            return lk[k]
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", choices=["train", "test"], default="test")
    ap.add_argument("--out", default="submission")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    pats = pd.read_csv(DATA / f"patients_{a.split}.csv", keep_default_na=False)
    ix = pd.read_csv(DATA / "interactions.csv", keep_default_na=False)
    table = {(r.drug_a, r.drug_b): (r.severity, r.recommended_action) for r in ix.itertuples()}
    lk = build_lookup()
    res_rows, alerts = [], []
    for pid, meds in zip(pats.patient_id, pats.medication_list):
        gens = set()
        for tok in split_entries(meds):
            g = resolve(tok, lk)
            gens.update(g)
            res_rows.append(dict(patient_id=pid, written_token=tok, resolved_generic=";".join(sorted(g))))
        for a_, b_ in combinations(sorted(gens), 2):
            hit = table.get((a_, b_))
            if hit:
                alerts.append(dict(patient_id=pid, issue_type="interaction", severity=hit[0], drugs_involved=f"{a_};{b_}",
                                   suggested_action=hit[1], confidence=0.9))
    pd.DataFrame(alerts, columns=["patient_id", "issue_type", "severity", "drugs_involved", "suggested_action", "confidence"]).to_csv(
        out / "H4_predictions.csv", index=False)
    pd.DataFrame(res_rows).to_csv(out / "H4_resolution.csv", index=False)
    print(f"{a.split}: {len(pats)} patients, {len(res_rows)} entries ({sum(1 for r in res_rows if r['resolved_generic'])} resolved), "
          f"{len(alerts)} alerts -> {out}/")


if __name__ == "__main__":
    main()
