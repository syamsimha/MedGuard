-- MedGuard Database Schema
-- TalentAP Mega Hackathon 2026 - Healthcare Problem H4: Medication Safety
-- Supports SQLite and PostgreSQL / Supabase migration

PRAGMA foreign_keys = ON;

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(32),
    weight_kg FLOAT,
    egfr FLOAT, -- mL/min/1.73m²
    crcl FLOAT, -- mL/min
    pregnant VARCHAR(16) DEFAULT 'N',
    conditions TEXT DEFAULT '[]', -- JSON-encoded array of condition names
    allergies TEXT DEFAULT '[]',  -- JSON-encoded array of allergens
    phone VARCHAR(64),
    email VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_patients_name ON patients(name);

-- 2. Medications Formulary Table
CREATE TABLE IF NOT EXISTS medications (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    active_ingredients TEXT DEFAULT '[]', -- JSON-encoded array
    drug_class VARCHAR(255),
    default_dosage VARCHAR(128),
    dosage_form VARCHAR(128),
    renal_adjustment_flag VARCHAR(8) DEFAULT 'N',
    pregnancy_category VARCHAR(8) DEFAULT 'N',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS ix_medications_generic ON medications(generic_name);
CREATE INDEX IF NOT EXISTS ix_medications_drug_class ON medications(drug_class);

-- 3. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    prescriber_id VARCHAR(128) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(128) NOT NULL,
    dose_mg FLOAT,
    frequency VARCHAR(128) NOT NULL,
    route VARCHAR(64) DEFAULT 'oral',
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, FLAGGED, APPROVED, DISCONTINUED, REJECTED
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(128),
    review_notes TEXT,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS ix_prescriptions_prescriber ON prescriptions(prescriber_id);
CREATE INDEX IF NOT EXISTS ix_prescriptions_status ON prescriptions(status);

-- 4. Safety Alerts Table (Clinical Findings)
CREATE TABLE IF NOT EXISTS safety_alerts (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    prescription_id VARCHAR(64),
    rule_id VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL, -- DRUG_DRUG_INTERACTION, DUPLICATE_THERAPY, RENAL_SAFETY, CONTRAINDICATION, DATA_GAP
    severity VARCHAR(32) NOT NULL, -- CONTRAINDICATED, MAJOR, MODERATE, MINOR, INSUFFICIENT_DATA
    drugs_involved TEXT DEFAULT '[]', -- JSON-encoded array
    reason TEXT NOT NULL,
    suggested_action TEXT,
    evidence_source VARCHAR(255),
    review_status VARCHAR(64) DEFAULT 'UNRESOLVED', -- UNRESOLVED, UNDER_REVIEW, RESOLVED, OVERRIDDEN
    reviewed_by VARCHAR(128),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_safety_alerts_patient ON safety_alerts(patient_id);
CREATE INDEX IF NOT EXISTS ix_safety_alerts_prescription ON safety_alerts(prescription_id);
CREATE INDEX IF NOT EXISTS ix_safety_alerts_severity ON safety_alerts(severity);
CREATE INDEX IF NOT EXISTS ix_safety_alerts_category ON safety_alerts(category);
CREATE INDEX IF NOT EXISTS ix_safety_alerts_review_status ON safety_alerts(review_status);

-- 5. Safety Audit Logs Table
CREATE TABLE IF NOT EXISTS safety_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64),
    prescription_id VARCHAR(64),
    safety_alert_id VARCHAR(64),
    actor_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL, -- CREATE, EVALUATE, APPROVE, FLAG, OVERRIDE, DISCONTINUE, DELETE
    summary TEXT NOT NULL,
    details TEXT, -- JSON-encoded context snapshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (safety_alert_id) REFERENCES safety_alerts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type ON safety_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_patient ON safety_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_prescription ON safety_audit_logs(prescription_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor ON safety_audit_logs(actor_id);
