-- MedGuard SQLite Database Schema (Phase 1 Foundation)
-- Medication Safety Intelligence
-- Designed for easy migration to Supabase (PostgreSQL) in subsequent phases

PRAGMA foreign_keys = ON;

-- Prescriptions submitted for clinical safety validation
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    patient_ref TEXT NOT NULL,
    prescriber_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    notes TEXT
);

-- Known drug-drug interactions library
CREATE TABLE IF NOT EXISTS drug_interactions (
    id TEXT PRIMARY KEY,
    drug_a TEXT NOT NULL,
    drug_b TEXT NOT NULL,
    severity_level TEXT NOT NULL, -- CONTRAINDICATED, MAJOR, MODERATE, MINOR
    mechanism TEXT,
    clinical_recommendation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clinical safety audit logs
CREATE TABLE IF NOT EXISTS safety_audit_logs (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    prescription_id TEXT,
    actor_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL
);
