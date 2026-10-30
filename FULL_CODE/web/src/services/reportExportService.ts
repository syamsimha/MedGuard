import { jsPDF } from 'jspdf';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
  ClinicalAnalyticsMetrics,
} from '../types/clinical';

/**
 * Client-Side PDF Generation and Print Service for MedGuard Clinical Reports
 * Complies with Phase 6 requirements:
 * - Generates actual visible vector PDF content with MedGuard branding
 * - Includes prominent "DEMO REPORT – NOT FOR CLINICAL USE" watermark & disclaimer
 * - Does not modify or require backend services
 */

export const printCurrentReport = () => {
  if (typeof window !== 'undefined') {
    window.print();
  }
};

export const exportPatientReportPdf = (
  patient: PatientRecord,
  reviews: MedicationReviewRecord[],
  alerts: SafetyAlertRecord[],
  reportId?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const actualReportId = reportId || `MGR-2026-${patient.id.replace('PT-', '')}-01`;
  const generationTimestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper to check page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 14;
      // Draw continuation header
      doc.setFillColor(23, 50, 77); // MedNavy
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`MedGuard Clinical Safety Dossier (Cont.) • ${patient.name} (${patient.id})`, margin + 3, y + 5.5);
      doc.setTextColor(200, 200, 200);
      doc.text(actualReportId, margin + contentWidth - 25, y + 5.5);
      y += 12;
    }
  };

  // 1. Header Banner
  doc.setFillColor(23, 50, 77); // MedNavy #17324D
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('MedGuard Hospital Safety System', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(219, 234, 254);
  doc.text('Clinical Pharmacovigilance & Medication Safety Dossier', margin + 5, y + 14);
  doc.text('St. Jude Metropolitan Medical Center • Division of Clinical Pharmacy', margin + 5, y + 18.5);

  // Report ID & Date (Right aligned in header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Report ID: ${actualReportId}`, margin + contentWidth - 45, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generationTimestamp}`, margin + contentWidth - 45, y + 14);
  doc.text('CDS Engine: v2.4 Certified', margin + contentWidth - 45, y + 18.5);

  y += 26;

  // 2. Demo Disclaimer Banner (Mandatory Task 4 & 6)
  doc.setFillColor(254, 242, 242); // Rose-50
  doc.setDrawColor(244, 63, 94); // Rose-500
  doc.rect(margin, y, contentWidth, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 18, 60); // Rose-700
  doc.text('DEMO REPORT – NOT FOR CLINICAL USE', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(159, 18, 57);
  doc.text(
    'Simulated clinical decision support output for system demonstration only. Does not constitute actual diagnostic validation or treatment directives.',
    margin + 4,
    y + 8
  );

  y += 14;

  // 3. Patient Demographics Card
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(23, 50, 77);
  doc.text(`PATIENT: ${patient.name.toUpperCase()}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Column 1
  doc.text(`MRN / Patient ID: ${patient.id}`, margin + 4, y + 10);
  doc.text(`Age / Gender: ${patient.age} yrs • ${patient.gender}`, margin + 4, y + 15);
  doc.text(`Blood Group: ${patient.bloodGroup}`, margin + 4, y + 20);

  // Column 2
  doc.text(`Care Unit / Bed: ${patient.room}`, margin + 65, y + 10);
  doc.text(`Status: ${patient.status}`, margin + 65, y + 15);
  doc.text(`Last Encounter: ${patient.lastVisit}`, margin + 65, y + 20);

  // Column 3
  doc.text(`Primary Diagnosis: ${patient.primaryDiagnosis || 'Clinical intake pending'}`, margin + 125, y + 10);
  const allergiesStr = (patient.allergies || ['None on record']).join(', ');
  doc.text(`Documented Allergies: ${allergiesStr.substring(0, 30)}`, margin + 125, y + 15);

  y += 28;

  // 4. Active Medications Table
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 50, 77);
  doc.text('1. ACTIVE MEDICATION REGIMEN', margin, y);
  y += 3.5;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Medication Name', margin + 3, y + 4.2);
  doc.text('Dosage', margin + 55, y + 4.2);
  doc.text('Frequency & Route', margin + 85, y + 4.2);
  doc.text('Prescribing Clinician', margin + 130, y + 4.2);
  doc.text('Status', margin + 165, y + 4.2);
  y += 7;

  const currentMeds = patient.currentMedications || [];
  if (currentMeds.length > 0) {
    currentMeds.forEach((med) => {
      checkPageBreak(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(med.name.substring(0, 30), margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(med.dosage, margin + 55, y + 4);
      doc.text(`${med.frequency} (${med.route})`.substring(0, 26), margin + 85, y + 4);
      doc.text(med.prescriber, margin + 130, y + 4);
      doc.text(med.status, margin + 165, y + 4);

      // Line
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
      y += 6.5;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No active prescription orders recorded.', margin + 3, y + 4);
    y += 7;
  }

  y += 4;

  // 5. Clinical Safety Alerts Section
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 50, 77);
  doc.text('2. ASSOCIATED CLINICAL SAFETY ALERTS & CONTRAINDICATIONS', margin, y);
  y += 3.5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Alert ID', margin + 3, y + 4.2);
  doc.text('Severity', margin + 22, y + 4.2);
  doc.text('Category & Trigger Summary', margin + 45, y + 4.2);
  doc.text('Clinical Recommendation', margin + 120, y + 4.2);
  doc.text('Status', margin + 165, y + 4.2);
  y += 7;

  const patientAlerts = alerts.filter((a) => a.patientId === patient.id);
  if (patientAlerts.length > 0) {
    patientAlerts.forEach((alt) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(alt.id, margin + 3, y + 4);

      // Severity styling
      if (alt.severity === 'Critical') {
        doc.setTextColor(190, 18, 60);
      } else if (alt.severity === 'High') {
        doc.setTextColor(194, 65, 12);
      } else {
        doc.setTextColor(37, 99, 235);
      }
      doc.text(alt.severity, margin + 22, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`[${alt.category}] ${alt.summary}`.substring(0, 48), margin + 45, y + 4);

      doc.setTextColor(71, 85, 105);
      doc.text((alt.clinicalRecommendation || alt.recommendation).substring(0, 32) + '...', margin + 120, y + 4);

      doc.setFont('helvetica', 'bold');
      if (alt.reviewStatus === 'Resolved') {
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setTextColor(180, 83, 9);
      }
      doc.text(alt.reviewStatus, margin + 165, y + 4);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 8;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Zero active safety alerts logged. Prescriptions clear of documented contraindications.', margin + 3, y + 4);
    y += 7;
  }

  y += 4;

  // 6. Medication Review History
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 50, 77);
  doc.text('3. PHARMACIST MEDICATION REVIEW AUDIT TRAIL', margin, y);
  y += 3.5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Review Date', margin + 3, y + 4.2);
  doc.text('Medication & Dosage', margin + 35, y + 4.2);
  doc.text('Reviewer / Pharmacist', margin + 90, y + 4.2);
  doc.text('Status', margin + 135, y + 4.2);
  doc.text('Clinical Rationale', margin + 155, y + 4.2);
  y += 7;

  const patientReviews = reviews.filter((r) => r.patientId === patient.id);
  if (patientReviews.length > 0) {
    patientReviews.forEach((rev) => {
      checkPageBreak(8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(rev.reviewDate.substring(0, 18), margin + 3, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${rev.medicationName} ${rev.dosage}`.substring(0, 32), margin + 35, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(rev.reviewer, margin + 90, y + 4);

      doc.setFont('helvetica', 'bold');
      if (rev.status === 'Approved') {
        doc.setTextColor(5, 150, 105);
      } else if (rev.status === 'Flagged') {
        doc.setTextColor(225, 29, 72);
      } else {
        doc.setTextColor(217, 119, 6);
      }
      doc.text(rev.status, margin + 135, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text((rev.clinicalNotes || rev.notes || 'Routine check').substring(0, 24), margin + 155, y + 4);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 7.5;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No historical medication review logs recorded for this patient.', margin + 3, y + 4);
    y += 7;
  }

  y += 6;

  // 7. Clinical Sign-off Section
  checkPageBreak(30);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(23, 50, 77);
  doc.text('CLINICAL REVIEWER SIGN-OFF & VERIFICATION', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Reviewing Pharmacist: Pharm. R. Sharma, PharmD, BCPS', margin + 4, y + 9);
  doc.text('Signature: [VERIFIED ELECTRONICALLY - CDS RECORD]', margin + 4, y + 13);
  doc.text(`Verification Timestamp: ${generationTimestamp}`, margin + 4, y + 17);

  doc.text('Attending Physician Countersign: ______________________', margin + 95, y + 9);
  doc.text('Clinical Department: Inpatient Pharmacotherapy & ICU', margin + 95, y + 13);
  doc.text('Verification Token: CDS-MGR-SHA256-VALIDATED', margin + 95, y + 17);

  // Bottom footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MedGuard Medication Safety Intelligence • Demonstration Document • Page ${p} of ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text('CONFIDENTIAL MEDICAL RECORD SIMULATION', margin + contentWidth - 55, pageHeight - 8);
  }

  // Save the PDF
  const filename = `MedGuard_Clinical_Report_${patient.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

export const exportSystemAnalyticsPdf = (
  metrics: ClinicalAnalyticsMetrics,
  alerts: SafetyAlertRecord[],
  reviews: MedicationReviewRecord[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const generationTimestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Banner
  doc.setFillColor(23, 50, 77); // MedNavy
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('MedGuard Hospital Safety System', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(219, 234, 254);
  doc.text('System-Wide Pharmacovigilance & Medication Safety Analytics', margin + 5, y + 14);
  doc.text(`Reporting Period: ${metrics.periodLabel} • Executive Quality Summary`, margin + 5, y + 18.5);

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${generationTimestamp}`, margin + contentWidth - 45, y + 10);
  doc.text('Audit Level: Hospital Board', margin + contentWidth - 45, y + 15);

  y += 26;

  // Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(244, 63, 94);
  doc.rect(margin, y, contentWidth, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 18, 60);
  doc.text('DEMO REPORT – NOT FOR CLINICAL USE', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(159, 18, 57);
  doc.text(
    'Demonstration quality assurance reporting based on fictional clinical records. Does not represent production hospital metrics.',
    margin + 4,
    y + 8
  );

  y += 14;

  // Key Metrics Grid
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 20, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('TOTAL REVIEWS', margin + 5, y + 6);
  doc.text('SAFETY ALERTS', margin + 42, y + 6);
  doc.text('HIGH-RISK CASES', margin + 78, y + 6);
  doc.text('RESOLVED ALERTS', margin + 115, y + 6);
  doc.text('PENDING REVIEWS', margin + 150, y + 6);

  doc.setFontSize(13);
  doc.setTextColor(23, 50, 77);
  doc.text(String(metrics.totalReviews), margin + 5, y + 14);
  doc.text(String(metrics.totalAlerts), margin + 42, y + 14);

  doc.setTextColor(225, 29, 72);
  doc.text(String(metrics.highRiskCases), margin + 78, y + 14);

  doc.setTextColor(5, 150, 105);
  doc.text(String(metrics.resolvedAlerts), margin + 115, y + 14);

  doc.setTextColor(217, 119, 6);
  doc.text(String(metrics.pendingReviews), margin + 150, y + 14);

  y += 24;

  // Safety Alerts Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 50, 77);
  doc.text('1. SAFETY ALERTS REGISTRY BREAKDOWN', margin, y);
  y += 3.5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Alert ID', margin + 3, y + 4.2);
  doc.text('Patient', margin + 25, y + 4.2);
  doc.text('Severity', margin + 65, y + 4.2);
  doc.text('Category', margin + 95, y + 4.2);
  doc.text('Review Status', margin + 140, y + 4.2);
  y += 7;

  alerts.forEach((alt) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(alt.id, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${alt.patientName} (${alt.patientId})`.substring(0, 24), margin + 25, y + 4);

    if (alt.severity === 'Critical') doc.setTextColor(190, 18, 60);
    else if (alt.severity === 'High') doc.setTextColor(194, 65, 12);
    else doc.setTextColor(37, 99, 235);
    doc.text(alt.severity, margin + 65, y + 4);

    doc.setTextColor(71, 85, 105);
    doc.text(alt.category, margin + 95, y + 4);

    doc.setFont('helvetica', 'bold');
    if (alt.reviewStatus === 'Resolved') {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(180, 83, 9);
    }
    doc.text(alt.reviewStatus, margin + 140, y + 4);

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 6.5;
  });

  y += 6;

  // Medication Reviews Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(23, 50, 77);
  doc.text('2. RECENT MEDICATION REVIEWS AUDIT', margin, y);
  y += 3.5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Review ID', margin + 3, y + 4.2);
  doc.text('Patient', margin + 25, y + 4.2);
  doc.text('Medication & Dosage', margin + 70, y + 4.2);
  doc.text('Review Status', margin + 130, y + 4.2);
  doc.text('Reviewer', margin + 155, y + 4.2);
  y += 7;

  reviews.slice(0, 6).forEach((rev) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(rev.id, margin + 3, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(rev.patientName, margin + 25, y + 4);

    doc.text(`${rev.medicationName} ${rev.dosage}`.substring(0, 32), margin + 70, y + 4);

    doc.setFont('helvetica', 'bold');
    if (rev.status === 'Approved') {
      doc.setTextColor(5, 150, 105);
    } else if (rev.status === 'Flagged') {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(217, 119, 6);
    }
    doc.text(rev.status, margin + 130, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(rev.reviewer, margin + 155, y + 4);

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
    y += 6.5;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MedGuard Quality & Safety Intelligence • Demonstration Analytics Document', margin, pageHeight - 8);

  const filename = `MedGuard_System_Analytics_${metrics.periodLabel.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
};
