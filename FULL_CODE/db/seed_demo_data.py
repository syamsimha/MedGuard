"""Seed script to populate MedGuard SQLite database with initial clinical demonstration records.
Uses actual services so all records go through validation, H4 safety engine evaluation,
alert generation, and audit logging.
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "api"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.core.database import SessionLocal, init_db
from app.models.db_models import Patient, Prescription, SafetyAlert
from app.models.schemas import PatientCreate, PrescriptionCreate
from app.services.patient_service import patient_service
from app.services.prescription_service import prescription_service
from app.services.medication_service import medication_service
from app.models.schemas import MedicationCreate


def seed_database():
    init_db()
    db = SessionLocal()
    try:
        if db.query(Patient).count() > 0:
            print(f"Database already contains {db.query(Patient).count()} patients. Skipping seed.")
            return

        print("Seeding initial clinical cohort into SQLite medguard.db...")

        # 1. Eleanor Vance (eGFR 38, CKD, Diabetes)
        p1 = patient_service.create_patient(
            db,
            PatientCreate(
                id="PT-8021",
                name="Eleanor Vance",
                age=68,
                gender="F",
                weight_kg=72.0,
                egfr=38.0,
                crcl=36.0,
                pregnant="N",
                conditions=["Hypertension", "Type 2 Diabetes", "Chronic Kidney Disease Stage 3b"],
                allergies=["Penicillin"],
                phone="+1 (555) 234-8901",
                email="e.vance@hospital.internal",
                notes="Room: Ward 3 - Bed 12. Admitted with acute exacerbation of renal insufficiency.",
            ),
            actor_id="DR-ELLIS",
        )

        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p1.id,
                prescriber_id="Dr. C. Vance",
                medication_name="Metformin 1000mg",
                dosage="1000mg",
                dose_mg=1000.0,
                frequency="BID",
                route="Oral",
                notes="Type 2 diabetes glycemic control. Evaluate renal threshold.",
            ),
        )
        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p1.id,
                prescriber_id="Dr. C. Vance",
                medication_name="Lisinopril 20mg",
                dosage="20mg",
                dose_mg=20.0,
                frequency="Daily",
                route="Oral",
                notes="Hypertension management and nephroprotection.",
            ),
        )

        # 2. Marcus Chen (Atrial Fibrillation, on Warfarin + Aspirin)
        p2 = patient_service.create_patient(
            db,
            PatientCreate(
                id="PT-8022",
                name="Marcus Chen",
                age=54,
                gender="M",
                weight_kg=84.0,
                egfr=88.0,
                crcl=90.0,
                pregnant="N",
                conditions=["Atrial Fibrillation", "Hypertension"],
                allergies=["Aspirin"],
                phone="+1 (555) 345-9012",
                email="m.chen@hospital.internal",
                notes="Room: Ward 2 - Bed 04. Monitored for thromboembolic prophylaxis.",
            ),
            actor_id="DR-ADAMS",
        )

        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p2.id,
                prescriber_id="Dr. R. Sharma",
                medication_name="Warfarin 5mg",
                dosage="5mg",
                dose_mg=5.0,
                frequency="Daily at bedtime",
                route="Oral",
                notes="Anticoagulation for non-valvular Afib (CHA2DS2-VASc = 3). Target INR 2.0-3.0.",
            ),
        )
        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p2.id,
                prescriber_id="Dr. R. Sharma",
                medication_name="Aspirin 81mg",
                dosage="81mg",
                dose_mg=81.0,
                frequency="Daily",
                route="Oral",
                notes="Antiplatelet therapy.",
            ),
        )

        # 3. Sarah Jenkins (Pregnancy + ACE inhibitor contraindication)
        p3 = patient_service.create_patient(
            db,
            PatientCreate(
                id="PT-8023",
                name="Sarah Jenkins",
                age=32,
                gender="F",
                weight_kg=65.0,
                egfr=95.0,
                pregnant="Y",
                conditions=["Asthma", "Pregnancy First Trimester", "Hypertension"],
                allergies=["Sulfa drugs"],
                phone="+1 (555) 456-0123",
                email="s.jenkins@hospital.internal",
                notes="Room: Ward 4 - Bed 08. Obstetric triage.",
            ),
            actor_id="DR-TAYLOR",
        )

        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p3.id,
                prescriber_id="Dr. J. Miller",
                medication_name="Lisinopril 10mg",
                dosage="10mg",
                dose_mg=10.0,
                frequency="Daily",
                route="Oral",
                notes="Hypertension management during pregnancy intake.",
            ),
        )

        # 4. Robert Miller (Severe Renal Impairment eGFR 22)
        p4 = patient_service.create_patient(
            db,
            PatientCreate(
                id="PT-8024",
                name="Robert Miller",
                age=72,
                gender="M",
                weight_kg=68.0,
                egfr=22.0,
                crcl=20.0,
                pregnant="N",
                conditions=["Chronic Kidney Disease Stage 4", "Gout", "Hypertension"],
                allergies=[],
                phone="+1 (555) 567-1234",
                email="r.miller@hospital.internal",
                notes="Room: Ward 1 - Bed 02. Nephrology follow-up.",
            ),
            actor_id="DR-ELLIS",
        )

        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p4.id,
                prescriber_id="Dr. S. Clark",
                medication_name="Colchicine 0.6mg",
                dosage="0.6mg",
                dose_mg=0.6,
                frequency="Daily",
                route="Oral",
                notes="Gout flare acute management.",
            ),
        )

        # 5. David Patel (Depression & Neuropathic pain)
        p5 = patient_service.create_patient(
            db,
            PatientCreate(
                id="PT-8025",
                name="David Patel",
                age=61,
                gender="M",
                weight_kg=78.0,
                egfr=78.0,
                pregnant="N",
                conditions=["Major Depressive Disorder", "Diabetic Neuropathy"],
                allergies=["Codeine"],
                phone="+1 (555) 678-2345",
                email="d.patel@hospital.internal",
                notes="Room: Outpatient Ambulatory Clinic.",
            ),
            actor_id="DR-ADAMS",
        )

        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p5.id,
                prescriber_id="Dr. C. Vance",
                medication_name="Fluoxetine 20mg",
                dosage="20mg",
                dose_mg=20.0,
                frequency="Daily in morning",
                route="Oral",
                notes="Depression therapy.",
            ),
        )
        prescription_service.create_prescription(
            db,
            PrescriptionCreate(
                patient_id=p5.id,
                prescriber_id="Dr. C. Vance",
                medication_name="Tramadol 50mg",
                dosage="50mg",
                dose_mg=50.0,
                frequency="TID as needed",
                route="Oral",
                notes="Neuropathic pain analgesia.",
            ),
        )

        print(f"Successfully seeded database:")
        print(f"  Patients: {db.query(Patient).count()}")
        print(f"  Prescriptions: {db.query(Prescription).count()}")
        print(f"  Safety Alerts: {db.query(SafetyAlert).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

