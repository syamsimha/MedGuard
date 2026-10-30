import type {
  ExtractedMedication,
  PrescriptionSafetyFinding,
  PrescriptionAnalysisResult,
} from '../types/prescription';

export const SAMPLE_EXTRACTED_MEDICATIONS: ExtractedMedication[] = [
  {
    id: 'EXT-001',
    name: 'Warfarin Sodium',
    genericName: 'Warfarin Sodium',
    strength: '5 mg',
    dosage: '1 tablet (5 mg)',
    frequency: 'Once daily at 18:00',
    route: 'Oral',
    duration: 'Ongoing',
    sourceFile: 'Dr_Patel_Cardio_Prescription_Oct2026.pdf',
    confidenceScore: 0.98,
    isConfirmed: true,
  },
  {
    id: 'EXT-002',
    name: 'Aspirin Cardio',
    genericName: 'Acetylsalicylic Acid',
    strength: '81 mg',
    dosage: '1 tablet (81 mg)',
    frequency: 'Once daily with breakfast',
    route: 'Oral',
    duration: 'Ongoing',
    sourceFile: 'Dr_Patel_Cardio_Prescription_Oct2026.pdf',
    confidenceScore: 0.99,
    isConfirmed: true,
  },
  {
    id: 'EXT-003',
    name: 'Metformin HCl',
    genericName: 'Metformin Hydrochloride',
    strength: '850 mg',
    dosage: '1 tablet (850 mg)',
    frequency: 'Twice daily with meals (BID)',
    route: 'Oral',
    duration: 'Ongoing',
    sourceFile: 'General_Practice_Discharge_Rx.pdf',
    confidenceScore: 0.94,
    isConfirmed: false,
  },
  {
    id: 'EXT-004',
    name: 'Amoxicillin Trihydrate',
    genericName: 'Amoxicillin',
    strength: '500 mg',
    dosage: '1 capsule (500 mg)',
    frequency: 'Three times daily (TID)',
    route: 'Oral',
    duration: '7 days',
    sourceFile: 'Urgent_Care_Prescription_Acute.pdf',
    confidenceScore: 0.96,
    isConfirmed: false,
  },
  {
    id: 'EXT-005',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    strength: '20 mg',
    dosage: '1 tablet (20 mg)',
    frequency: 'Once daily in the morning',
    route: 'Oral',
    duration: 'Ongoing',
    sourceFile: 'Dr_Patel_Cardio_Prescription_Oct2026.pdf',
    confidenceScore: 0.97,
    isConfirmed: true,
  },
];

export const SAMPLE_SAFETY_FINDINGS: PrescriptionSafetyFinding[] = [
  {
    id: 'H4-CRIT-001',
    category: 'Contraindication',
    severity: 'Critical',
    affectedMedications: ['Amoxicillin Trihydrate'],
    explanation:
      'Patient Eleanor Vance has a documented SEVERE allergy to Penicillin (Anaphylaxis and respiratory distress). Amoxicillin is a beta-lactam penicillin derivative with near 100% immunological cross-reactivity.',
    evidenceSource: 'H4 Dataset Rule #ALLERGY-BETA-LACTAM-01 & FDA Black Box Cross-Sensitivity',
    recommendation:
      'CRITICAL SAFETY WARNING: Do NOT administer Amoxicillin. Immediately cancel order and substitute with a non-beta-lactam antibiotic (e.g. Azithromycin or Doxycycline) based on antimicrobial culture.',
    reviewStatus: 'Unresolved',
  },
  {
    id: 'H4-HIGH-002',
    category: 'Drug-Drug Interaction',
    severity: 'High',
    affectedMedications: ['Warfarin Sodium', 'Aspirin Cardio'],
    explanation:
      'Concomitant administration of Warfarin (vitamin K oral anticoagulant) and Aspirin (antiplatelet COX-1 inhibitor) causes a synergistic 3- to 5-fold elevation in major bleeding incidence, particularly upper GI hemorrhage and intracranial bleeding.',
    evidenceSource: 'H4 Interaction Engine Rule #DDI-HEM-1044 & CHEST Antithrombotic Guidelines',
    recommendation:
      'Review indication for dual anticoagulant/antiplatelet therapy. If required post-PCI/CABG, prescribe gastroprotective PPI therapy (e.g. Pantoprazole 40mg) and tightly monitor target INR (2.0-2.5).',
    reviewStatus: 'Under Review',
  },
  {
    id: 'H4-MOD-003',
    category: 'Renal Safety',
    severity: 'Moderate',
    affectedMedications: ['Metformin HCl'],
    explanation:
      'Patient has documented moderate renal impairment (eGFR 48 mL/min/1.73m², CKD Stage 3a). Metformin prescribing guidelines recommend capping total daily dose at 1000 mg/day for eGFR between 30–45 mL/min to prevent drug accumulation and lactic acidosis.',
    evidenceSource: 'H4 Renal Formulary Rule #RENAL-MET-302 & KDIGO 2024 Clinical Guidelines',
    recommendation:
      'Current prescribed dose (850 mg BID = 1700 mg/day) exceeds renal threshold. Reduce dose to 500 mg BID (1000 mg/day max) and schedule repeat serum creatinine/eGFR evaluation within 30 days.',
    reviewStatus: 'Under Review',
  },
  {
    id: 'H4-LOW-004',
    category: 'Duplicate Medication',
    severity: 'Low',
    affectedMedications: ['Lisinopril'],
    explanation:
      'Lisinopril is an ACE inhibitor prescribed alongside an intensive antihypertensive regimen. Verify no concurrent Angiotensin Receptor Blocker (ARB) or direct renin inhibitor is active in concurrent outpatient profile.',
    evidenceSource: 'H4 Formulary Rule #DUP-RAAS-01',
    recommendation:
      'Confirm single RAAS blockade strategy. Dual ACE-i/ARB therapy is contraindicated due to increased risk of hyperkalemia and acute kidney injury.',
    reviewStatus: 'Resolved',
  },
];

export const SAMPLE_DEMO_ANALYSIS_RESULT: PrescriptionAnalysisResult = {
  outcome: 'analysis_completed_with_findings',
  summaryMessage:
    'Safety analysis completed against H4 Dataset: 4 clinical safety findings identified (1 Critical allergy contraindication, 1 High-risk drug interaction, 1 Moderate renal dose warning, 1 Formulary note).',
  patient: {
    patientId: 'PT-8021',
    name: 'Eleanor Vance',
    ageOrDob: '68 (1958-04-12)',
    gender: 'Female',
    weight: '68 kg',
    allergies: 'Penicillin (Severe - Anaphylaxis), Sulfa drugs (Moderate - Rash)',
    conditions: 'Atrial Fibrillation with RVR, Hypertension Stage 2, Osteoarthritis',
    renalHistory: 'eGFR: 48 mL/min/1.73m² (CKD Stage 3a), Serum Cr: 1.4 mg/dL',
    clinicalNotes: 'CHADS-VASc score 4. Recent fatigue and mild peripheral edema.',
  },
  files: [
    { name: 'Dr_Patel_Cardio_Prescription_Oct2026.pdf', size: 348160 },
    { name: 'General_Practice_Discharge_Rx.pdf', size: 198400 },
    { name: 'Urgent_Care_Prescription_Acute.pdf', size: 142336 },
  ],
  medications: SAMPLE_EXTRACTED_MEDICATIONS,
  findings: SAMPLE_SAFETY_FINDINGS,
  analyzedAt: new Date().toLocaleString(),
  backendEndpoint: '/api/prescriptions/analyze',
};

// ========================================================
// DEMONSTRATION SIMULATION SCENARIO GENERATOR
// For transparent clinical interface verification when backend is pending
// ========================================================

export function generateDemonstrationSimulationScenario(
  proposedMed: {
    name: string;
    genericName?: string;
    strength?: string;
    dosage: string;
    dosageUnit?: string;
    frequency: string;
    route: string;
    proposedDuration?: string;
    clinicalNotes?: string;
  },
  existingMeds: ExtractedMedication[],
  originalFindings: PrescriptionSafetyFinding[]
) {
  const normName = (proposedMed.name || '').toLowerCase();
  const normGeneric = (proposedMed.genericName || '').toLowerCase();

  const newFindings: any[] = [];

  // Check Ciprofloxacin / Fluoroquinolone
  if (normName.includes('cipro') || normGeneric.includes('cipro')) {
    newFindings.push({
      id: 'H4-NEW-SIM-001',
      category: 'Drug-Drug Interaction',
      severity: 'Critical',
      affectedMedications: [proposedMed.name, 'Warfarin Sodium'],
      explanation:
        'Ciprofloxacin potently inhibits hepatic CYP1A2 and CYP3A4 isoenzymes, drastically reducing metabolic clearance of Warfarin. Concomitant therapy causes acute PT/INR spikes (often > 6.0) within 48 to 72 hours, resulting in life-threatening bleeding risk.',
      evidenceSource: 'H4 Interaction Engine Rule #DDI-CYP-302 & CHEST Anticoagulation Guidelines',
      recommendation:
        'AVOID CONCURRENT PRESCRIBING. Recommend substituting with a non-interacting antimicrobial (e.g. Doxycycline 100mg BID or Ceftriaxone pending culture). If clinically required, empirically reduce Warfarin dose by 33-50% with daily INR monitoring.',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });

    newFindings.push({
      id: 'H4-NEW-SIM-002',
      category: 'Renal Safety',
      severity: 'Moderate',
      affectedMedications: [proposedMed.name],
      explanation:
        'Patient has baseline moderate renal impairment (eGFR 48 mL/min/1.73m², CKD Stage 3a). Ciprofloxacin is cleared primarily through renal filtration and requires dosage reduction when eGFR is between 30-50 mL/min.',
      evidenceSource: 'H4 Renal Formulary Rule #RENAL-CIP-104 & KDIGO 2024 Guidelines',
      recommendation:
        'Adjust proposed Ciprofloxacin dosage to 250-500 mg every 12 hours (maximum 500 mg/day if eGFR drops below 40 mL/min).',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });
  } else if (normName.includes('ibuprofen') || normName.includes('advil') || normName.includes('motrin') || normName.includes('nsaid')) {
    // Check Ibuprofen / NSAID
    newFindings.push({
      id: 'H4-NEW-SIM-001',
      category: 'Drug-Drug Interaction',
      severity: 'Critical',
      affectedMedications: [proposedMed.name, 'Warfarin Sodium', 'Aspirin Cardio'],
      explanation:
        'Triple antithrombotic & NSAID combination (Warfarin + Aspirin Cardio + Ibuprofen) elevates major upper gastrointestinal bleeding incidence by over 8-fold and can cause fatal hemorrhagic events.',
      evidenceSource: 'H4 Interaction Rule #DDI-HEM-TRIPLE-01 & FDA Black Box NSAID/Anticoagulant Warning',
      recommendation:
        'CONTRAINDICATED. Immediately cancel proposed Ibuprofen. Prescribe topical analgesics or Paracetamol (Acetaminophen) max 2g/day for musculoskeletal pain.',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });

    newFindings.push({
      id: 'H4-NEW-SIM-002',
      category: 'Contraindication',
      severity: 'High',
      affectedMedications: [proposedMed.name],
      explanation:
        'Systemic NSAID administration inhibits renal prostaglandin synthesis, reducing renal blood flow and precipitating acute-on-chronic kidney injury in patients with CKD Stage 3 (eGFR 48 mL/min).',
      evidenceSource: 'H4 Renal Contraindication Rule #RENAL-NSAID-CKD-01',
      recommendation:
        'Avoid all systemic NSAIDs (Ibuprofen, Naproxen, Ketorolac). Monitor serum creatinine.',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });
  } else if (normName.includes('clopidogrel') || normName.includes('plavix')) {
    // Check Clopidogrel
    newFindings.push({
      id: 'H4-NEW-SIM-001',
      category: 'Drug-Drug Interaction',
      severity: 'Critical',
      affectedMedications: [proposedMed.name, 'Warfarin Sodium', 'Aspirin Cardio'],
      explanation:
        'Triple therapy (Warfarin + Aspirin + Clopidogrel) produces profound platelet inhibition and hypoprothrombinemia, with prohibitive bleeding rates in patients aged > 65.',
      evidenceSource: 'H4 Antithrombotic Engine Rule #DDI-TRIPLE-PLT-02',
      recommendation:
        'Validate indication for triple antithrombotic regimen. If patient has recent ACS, limit duration to 1-4 weeks, add PPI, and set INR target 2.0-2.5.',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });
  } else if (normName.includes('doxycycline') || normName.includes('paracetamol') || normName.includes('acetaminophen')) {
    // Safe alternatives
    newFindings.push({
      id: 'H4-NEW-SIM-001',
      category: 'Other Warning',
      severity: 'Low',
      affectedMedications: [proposedMed.name],
      explanation:
        'No major CYP-mediated interaction or allergy contraindication detected against current patient profile. Well-tolerated non-beta-lactam option.',
      evidenceSource: 'H4 Safety Dataset Formulary Match #FORM-DOX-01',
      recommendation:
        'Take with full glass of water and remain upright for 30 minutes to prevent localized esophageal irritation.',
      reviewStatus: 'New Risk - Reviewed',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });
  } else {
    // Generic evaluation
    newFindings.push({
      id: 'H4-NEW-SIM-001',
      category: 'Other Warning',
      severity: 'Moderate',
      affectedMedications: [proposedMed.name, 'Warfarin Sodium'],
      explanation: `Proposed medication (${proposedMed.name}) requires clinical monitoring when introduced alongside oral anticoagulation (Warfarin) and moderate renal impairment (eGFR 48 mL/min).`,
      evidenceSource: 'H4 Safety Dataset General Rule #GEN-COADMIN-01',
      recommendation:
        'Perform baseline PT/INR and repeat within 3 to 5 days of initiating therapy. Monitor for signs of bruising or petechiae.',
      reviewStatus: 'New Risk - Unresolved',
      isNewFinding: true,
      involvesProposedMed: true,
      riskType: 'new_risk',
    });
  }

  // Pre-existing baseline findings from original assessment
  const preExistingFindings = originalFindings.map((f) => ({
    ...f,
    isNewFinding: false,
    involvesProposedMed: false,
    riskType: 'pre_existing' as const,
  }));

  const allFindings = [...newFindings, ...preExistingFindings];

  return {
    id: `SIM-${Date.now().toString().slice(-4)}`,
    title: `Hypothetical Test: ${proposedMed.name} ${proposedMed.strength || ''}`,
    testedAt: new Date().toLocaleString(),
    proposedMedication: {
      id: `PROP-${Date.now()}`,
      ...proposedMed,
    },
    existingMedicationsSnapshot: [...existingMeds],
    originalFindingsSnapshot: [...originalFindings],
    simulatedFindings: allFindings,
    newFindingsCount: newFindings.length,
    preExistingFindingsCount: preExistingFindings.length,
    outcome: (newFindings.some((f) => f.severity === 'Critical')
      ? 'analysis_completed_with_findings'
      : 'no_issues_detected') as any,
    summaryMessage:
      newFindings.length > 0
        ? `Hypothetical safety evaluation completed: Proposed ${proposedMed.name} introduces ${newFindings.length} NEW potential risk finding(s) against the patient's existing regimen.`
        : `Hypothetical safety evaluation completed: No new high-risk contraindications detected for proposed ${proposedMed.name}.`,
    isBackendMissing: true,
    backendEndpoint: '/api/prescriptions/simulate-medication',
  };
}
