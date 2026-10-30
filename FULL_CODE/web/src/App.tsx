import { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsDirectoryPage } from './pages/PatientsDirectoryPage';
import { AddPatientPage } from './pages/AddPatientPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { MedicationReviewPage } from './pages/MedicationReviewPage';
import { PatientMedicationsDetailPage } from './pages/PatientMedicationsDetailPage';
import { AddMedicationPage } from './pages/AddMedicationPage';
import { MedicationReviewDetailPage } from './pages/MedicationReviewDetailPage';
import { SafetyAlertsPage } from './pages/SafetyAlertsPage';
import { SafetyAlertDetailPage } from './pages/SafetyAlertDetailPage';
import { ClinicalReportsPage } from './pages/ClinicalReportsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import {
  SAMPLE_PATIENTS,
  SAMPLE_MEDICATION_REVIEWS,
  SAMPLE_SAFETY_ALERTS,
} from './data/sampleData';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
  ActiveMedication,
  ReviewStatus,
  AlertReviewStatus,
} from './types/clinical';
import type { NavigationTab } from './types/navigation';
import { CheckCircle2, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Patient module sub-navigation state
  const [patientSubView, setPatientSubView] = useState<'list' | 'add' | 'profile'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('PT-8021');

  // Medication Review sub-navigation state
  const [medicationSubView, setMedicationSubView] = useState<
    'list' | 'patient-meds' | 'add' | 'review-detail'
  >('list');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>('REV-401');
  const [selectedPatientForMedsId, setSelectedPatientForMedsId] = useState<string | null>(null);

  // Safety Alerts sub-navigation state
  const [safetyAlertSubView, setSafetyAlertSubView] = useState<'list' | 'detail'>('list');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('ALT-101');

  // Clinical Reports patient focus state (Phase 6)
  const [selectedPatientForReportId, setSelectedPatientForReportId] = useState<string>('PT-8021');

  // Shared in-memory clinical state
  const [patients, setPatients] = useState<PatientRecord[]>(SAMPLE_PATIENTS);
  const [reviews, setReviews] = useState<MedicationReviewRecord[]>(SAMPLE_MEDICATION_REVIEWS);
  const [alerts, setAlerts] = useState<SafetyAlertRecord[]>(SAMPLE_SAFETY_ALERTS);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (tab === 'patients') {
      setPatientSubView('list');
    }
    if (tab === 'medication-review') {
      setMedicationSubView('list');
    }
    if (tab === 'safety-alerts' || tab === 'interactions') {
      setSafetyAlertSubView('list');
    }
  };

  // Patient navigation handlers
  const handleViewPatientProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
    setPatientSubView('profile');
  };

  const handleNavigateToAddPatient = () => {
    setActiveTab('patients');
    setPatientSubView('add');
  };

  const handleSaveNewPatient = (newPatient: PatientRecord) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setPatientSubView('profile');
    showToast(`Patient ${newPatient.name} (${newPatient.id}) registered successfully.`);
  };

  const handleUpdatePatient = (updated: PatientRecord) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    showToast(`Patient record for ${updated.name} updated successfully.`);
  };

  // Medication review navigation handlers
  const handleNavigateToMedicationReview = (patientId?: string) => {
    setActiveTab('medication-review');
    if (patientId) {
      setSelectedPatientForMedsId(patientId);
      setMedicationSubView('patient-meds');
    } else {
      setMedicationSubView('list');
    }
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setActiveTab('medication-review');
    setMedicationSubView('review-detail');
  };

  const handleSelectPatientMeds = (patientId: string) => {
    setSelectedPatientForMedsId(patientId);
    setActiveTab('medication-review');
    setMedicationSubView('patient-meds');
  };

  const handleNavigateToAddMedication = (patientId?: string) => {
    setSelectedPatientForMedsId(patientId || null);
    setActiveTab('medication-review');
    setMedicationSubView('add');
  };

  const handleSaveNewMedication = (
    patientId: string,
    newMed: ActiveMedication,
    newReview: MedicationReviewRecord
  ) => {
    // 1. Add medication to target patient's current medications
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const currentMeds = p.currentMedications || [];
          return {
            ...p,
            currentMedications: [newMed, ...currentMeds],
          };
        }
        return p;
      })
    );

    // 2. Add review to reviews queue
    setReviews((prev) => [newReview, ...prev]);

    // 3. Navigate to review detail
    setSelectedReviewId(newReview.id);
    setMedicationSubView('review-detail');
    showToast(`Medication "${newMed.name}" added and queued for pharmacist verification.`);
  };

  const handleUpdateReviewStatus = (
    reviewId: string,
    newStatus: ReviewStatus,
    newNotes?: string
  ) => {
    setReviews((prev) =>
      prev.map((rev) => {
        if (rev.id === reviewId) {
          return {
            ...rev,
            status: newStatus,
            clinicalNotes: newNotes !== undefined ? newNotes : rev.clinicalNotes,
            notes: newNotes !== undefined ? newNotes : rev.notes,
            reviewDate: 'Just Now',
          };
        }
        return rev;
      })
    );
    showToast(`Review ${reviewId} status updated to "${newStatus}".`);
  };

  // Safety Alerts navigation and status handlers (Phase 5)
  const handleSelectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActiveTab('safety-alerts');
    setSafetyAlertSubView('detail');
  };

  const handleUpdateAlertStatus = (
    alertId: string,
    newStatus: AlertReviewStatus,
    notes?: string
  ) => {
    setAlerts((prev) =>
      prev.map((alt) => {
        if (alt.id === alertId) {
          return {
            ...alt,
            reviewStatus: newStatus,
            reviewNotes: notes !== undefined ? notes : alt.reviewNotes,
            reviewedBy: 'Pharm. R. Sharma (Clinical Pharmacist)',
          };
        }
        return alt;
      })
    );
    showToast(`Safety Alert ${alertId} marked as "${newStatus}".`);
  };

  // Clinical Reports navigation handler (Phase 6)
  const handleNavigateToClinicalReport = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientForReportId(patientId);
    }
    setActiveTab('clinical-reports');
  };

  // Determine dynamic Topbar title
  const getPageTitle = (tab: NavigationTab): string => {
    if (tab === 'patients') {
      if (patientSubView === 'add') return 'Patient Registration Form';
      if (patientSubView === 'profile') {
        const p = patients.find((pt) => pt.id === selectedPatientId);
        return p ? `Patient Profile: ${p.name}` : 'Patient Profile';
      }
      return 'Patient Management Directory';
    }

    if (tab === 'medication-review') {
      if (medicationSubView === 'add') return 'Prescribe Medication Order';
      if (medicationSubView === 'patient-meds') {
        const p = patients.find((pt) => pt.id === selectedPatientForMedsId);
        return p ? `Patient Medications: ${p.name}` : 'Patient Medication Profile';
      }
      if (medicationSubView === 'review-detail') {
        const r = reviews.find((rev) => rev.id === selectedReviewId);
        return r ? `Medication Review: ${r.medicationName}` : 'Medication Review Assessment';
      }
      return 'Medication Review Queue';
    }

    if (tab === 'safety-alerts' || tab === 'interactions') {
      if (safetyAlertSubView === 'detail') {
        const alt = alerts.find((a) => a.id === selectedAlertId);
        return alt ? `Safety Alert: ${alt.id} - ${alt.alertType}` : 'Medication Safety Alert Details';
      }
      return 'Medication Safety Alerts';
    }

    switch (tab) {
      case 'dashboard':
      case 'overview':
        return 'Hospital Medication Safety Dashboard';
      case 'clinical-reports':
      case 'audit-log':
        return 'Clinical Reports & Audit Analytics';
      case 'settings':
      case 'rules':
        return 'System & Clinical Settings';
      default:
        return 'MedGuard Dashboard';
    }
  };

  const currentPatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  const currentReview =
    reviews.find((r) => r.id === selectedReviewId) || reviews[0];

  const currentPatientForMeds =
    patients.find((p) => p.id === selectedPatientForMedsId) ||
    (currentReview ? patients.find((p) => p.id === currentReview.patientId) : patients[0]) ||
    patients[0];

  const currentAlert =
    alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const alertPatient = currentAlert
    ? patients.find((p) => p.id === currentAlert.patientId)
    : undefined;

  const pendingReviewsCount = reviews.filter((r) => r.status === 'Pending Review').length;

  const renderContent = () => {
    // 1. Dashboard Tab
    if (activeTab === 'dashboard' || activeTab === 'overview') {
      return (
        <DashboardPage
          patients={patients}
          reviews={reviews}
          alerts={alerts}
          onNavigateTab={handleSelectTab}
          onViewPatientProfile={handleViewPatientProfile}
          onNavigateToAddPatient={handleNavigateToAddPatient}
          onSelectReview={handleSelectReview}
          onSelectAlert={handleSelectAlert}
          searchQuery={searchQuery}
        />
      );
    }

    // 2. Patients Tab (Directory, Add, Profile)
    if (activeTab === 'patients') {
      if (patientSubView === 'add') {
        return (
          <AddPatientPage
            onCancel={() => setPatientSubView('list')}
            onSavePatient={handleSaveNewPatient}
            existingCount={patients.length}
          />
        );
      }

      if (patientSubView === 'profile' && currentPatient) {
        return (
          <PatientProfilePage
            patient={currentPatient}
            reviews={reviews}
            alerts={alerts}
            onBackToPatients={() => setPatientSubView('list')}
            onUpdatePatient={handleUpdatePatient}
            onNavigateToMedicationReview={handleNavigateToMedicationReview}
            onSelectAlert={handleSelectAlert}
            onNavigateToClinicalReport={handleNavigateToClinicalReport}
          />
        );
      }

      return (
        <PatientsDirectoryPage
          patients={patients}
          onViewProfile={handleViewPatientProfile}
          onAddNewPatient={handleNavigateToAddPatient}
        />
      );
    }

    // 3. Medication Review Tab (Queue, Patient Meds, Add Med, Review Detail)
    if (activeTab === 'medication-review' || activeTab === 'prescriptions') {
      if (medicationSubView === 'add') {
        return (
          <AddMedicationPage
            patients={patients}
            initialPatientId={selectedPatientForMedsId || undefined}
            onCancel={() => setMedicationSubView('list')}
            onSaveMedication={handleSaveNewMedication}
          />
        );
      }

      if (medicationSubView === 'patient-meds' && currentPatientForMeds) {
        return (
          <PatientMedicationsDetailPage
            patient={currentPatientForMeds}
            onBackToReviews={() => setMedicationSubView('list')}
            onAddNewMedication={(pId) => handleNavigateToAddMedication(pId)}
            onViewPatientProfile={handleViewPatientProfile}
          />
        );
      }

      if (medicationSubView === 'review-detail' && currentReview) {
        const reviewPatient = patients.find((p) => p.id === currentReview.patientId);
        return (
          <MedicationReviewDetailPage
            review={currentReview}
            patient={reviewPatient}
            onBackToReviews={() => setMedicationSubView('list')}
            onUpdateReviewStatus={handleUpdateReviewStatus}
          />
        );
      }

      return (
        <MedicationReviewPage
          reviews={reviews}
          onSelectReview={handleSelectReview}
          onSelectPatientMeds={handleSelectPatientMeds}
          onAddNewMedication={() => handleNavigateToAddMedication()}
        />
      );
    }

    // 4. Safety Alerts Tab (Phase 5: Queue & Alert Details)
    if (activeTab === 'safety-alerts' || activeTab === 'interactions') {
      if (safetyAlertSubView === 'detail' && currentAlert) {
        return (
          <SafetyAlertDetailPage
            alert={currentAlert}
            patient={alertPatient}
            onBackToAlerts={() => setSafetyAlertSubView('list')}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onViewPatientProfile={handleViewPatientProfile}
            onViewPatientMeds={handleSelectPatientMeds}
          />
        );
      }

      return (
        <SafetyAlertsPage
          alerts={alerts}
          onSelectAlert={handleSelectAlert}
          onViewPatientProfile={handleViewPatientProfile}
          searchQuery={searchQuery}
        />
      );
    }

    // 5. Clinical Reports Tab (Phase 6: Executive Analytics & Patient Dossiers)
    if (activeTab === 'clinical-reports' || activeTab === 'audit-log') {
      return (
        <ClinicalReportsPage
          patients={patients}
          reviews={reviews}
          alerts={alerts}
          initialPatientId={selectedPatientForReportId}
          onViewPatientProfile={handleViewPatientProfile}
          onViewMedicationReview={handleSelectPatientMeds}
        />
      );
    }

    // 6. Other Clinical Tabs (Placeholder pages with roadmap context)
    return (
      <PlaceholderPage
        tab={activeTab}
        onBackToDashboard={() => setActiveTab('dashboard')}
      />
    );
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pageTitle={getPageTitle(activeTab)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      alertCount={alerts.length}
      pendingReviewsCount={pendingReviewsCount}
      patientCount={patients.length}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-[#17324D] text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
