
from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Paths
ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUTPUT = ROOT / "models"
OUTPUT.mkdir(exist_ok=True)

# Load datasets
patients = pd.read_csv(DATA / "patients_train.csv")
labels = pd.read_csv(DATA / "train_labels.csv")

# Join each issue to its patient's information
df = labels.merge(
    patients,
    on="patient_id",
    how="left",
    validate="many_to_one"
)

if df["age"].isna().any():
    raise ValueError("Some labelled patients have no matching patient record.")

# Target
target = "issue_type"

# Build combined clinical text
text_columns = ["diagnoses", "allergies", "medication_list"]

for col in text_columns:
    df[col] = df[col].fillna("").astype(str)

df["clinical_text"] = df[text_columns].agg(" ".join, axis=1)
df["drugs_involved"] = (
    df["drugs_involved"]
    .fillna("")
    .astype(str)
)

# Features: deliberately exclude IDs, severity, suggested_action,
# drugs_involved, near_miss and other label-derived information.
numeric = [
    "age",
    "weight_kg",
    "egfr_ml_min_1_73m2",
    "prescriber_count"
]

categorical = ["sex", "pregnant"]

X = df[
    ["clinical_text", "drugs_involved"]
    + numeric
    + categorical
].copy()
y = df[target].astype(str)
groups = df["patient_id"]

# Preprocessing
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(
        strategy="constant",
        fill_value="unknown"
    )),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("clinical_text", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_features=20000
    ), "clinical_text"),

    ("involved_drugs", TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_features=10000,
        sublinear_tf=True
    ), "drugs_involved"),

    ("numeric", numeric_pipeline, numeric),

    ("categorical", categorical_pipeline, categorical)
])

# First baseline model
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42
    ))
])

# Split by patient, not individual issue rows
splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

train_idx, val_idx = next(
    splitter.split(X, y, groups=groups)
)

X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

# Verify no patient overlap
train_patients = set(groups.iloc[train_idx])
val_patients = set(groups.iloc[val_idx])

assert train_patients.isdisjoint(val_patients)

print("Training rows:", len(X_train))
print("Validation rows:", len(X_val))
print("Training patients:", len(train_patients))
print("Validation patients:", len(val_patients))

# Train
print("\nTraining Logistic Regression...")
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_val)


# Evaluate
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score
)
from sklearn.dummy import DummyClassifier

predictions = model.predict(X_val)

print("\n=== CONFUSION MATRIX ===")
print("Class order:", list(model.classes_))
print(confusion_matrix(
    y_val,
    predictions,
    labels=model.classes_
))

print("\n=== CLASSIFICATION REPORT ===")
print(classification_report(
    y_val,
    predictions,
    zero_division=0
))

model_f1 = f1_score(
    y_val,
    predictions,
    average="macro"
)

# Majority-class comparison
dummy = DummyClassifier(strategy="most_frequent")
dummy.fit(X_train, y_train)

dummy_predictions = dummy.predict(X_val)

dummy_f1 = f1_score(
    y_val,
    dummy_predictions,
    average="macro"
)

print("\n=== MODEL COMPARISON ===")
print("Logistic Regression Macro F1:", round(model_f1, 4))
print("Majority Baseline Macro F1:", round(dummy_f1, 4))

# Save trained model
joblib.dump(model, OUTPUT / "issue_type_model.joblib")

metrics = {
    "model": "TF-IDF + Logistic Regression",
    "validation_macro_f1": float(model_f1),
    "majority_baseline_macro_f1": float(dummy_f1)
}

with open(OUTPUT / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("\nModel saved successfully!")