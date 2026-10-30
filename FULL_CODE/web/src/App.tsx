import { useState, useEffect, useCallback } from 'react';
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
import { PrescriptionAnalysisPage } from './pages/PrescriptionAnalysisPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
  ActiveMedication,
  ReviewStatus,
  AlertReviewStatus,
} from './types/clinical';
import type { NavigationTab } from './types/navigation';
import { DEMO_CREDENTIALS, type AuthUser } from './types/auth';
import {
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
  ServerOff,
  Loader2,
} from 'lucide-react';
import api, {
  toFrontendPatient,
  toFrontendReview,
  toFrontendAlert,
  type ApiPrescription,
  type ApiPatient,
  type ApiSafetyAlert,
} from './services/api';

export function App() {
  // Demonstration authentication state (Session-persisted)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('medguard_demo_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('medguard_current_user');
      if (saved) return JSON.parse(saved) as AuthUser;
      const isAuth = sessionStorage.getItem('medguard_demo_auth') === 'true';
      if (isAuth) return DEMO_CREDENTIALS[0].user;
      return null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Patient module sub-navigation state
  const [patientSubView, setPatientSubView] = useState<'list' | 'add' | 'profile'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Medication Review sub-navigation state
  const [medicationSubView, setMedicationSubView] = useState<
    'list' | 'patient-meds' | 'add' | 'review-detail'
  >('list');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedPatientForMedsId, setSelectedPatientForMedsId] = useState<string | null>(null);

  // Safety Alerts sub-navigation state
  const [safetyAlertSubView, setSafetyAlertSubView] = useState<'list' | 'detail'>('list');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Clinical Reports patient focus state
  const [selectedPatientForReportId, setSelectedPatientForReportId] = useState<string>('PT-8021');

  // Prescription Analysis patient focus state
  const [selectedPatientForAnalysisId, setSelectedPatientForAnalysisId] = useState<string | null>(null);

  // Live Database Clinical State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [reviews, setReviews] = useState<MedicationReviewRecord[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlertRecord[]>([]);

  // Reliability & Network State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    try {
      sessionStorage.setItem('medguard_demo_auth', 'true');
      sessionStorage.setItem('medguard_current_user', JSON.stringify(user));
    } catch {
      // Storage fallback
    }
    setIsAuthenticated(true);
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}. Clinical session activated.`);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('medguard_demo_auth');
      sessionStorage.removeItem('medguard_current_user');
    } catch {
      // Storage fallback
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('You have been signed out of MedGuard.');
  };

  // ============================================================================
  // Central Data Synchronizer (FastAPI & SQLite Integration)
  // ============================================================================

  const loadData = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setApiError(null);

    try {
      // 1. Check API Health
      await api.getHealth();
      setIsBackendConnected(true);

      // 2. Fetch parallel entities from SQLite database via FastAPI
      const [patientsRes, prescriptionsRes, alertsRes] = await Promise.all([
        api.getPatients(undefined, 0, 100),
        api.getPrescriptions(),
        api.getAlerts(),
      ]);

      const rawPatients: ApiPatient[] = patientsRes.items || [];
      const rawRx: ApiPrescription[] = prescriptionsRes.items || [];
      const rawAlerts: ApiSafetyAlert[] = Array.isArray(alertsRes) ? alertsRes : ((alertsRes as any).items || []);

      // 3. Map to rich frontend domain models
      const mappedPatients = rawPatients.map((p) => toFrontendPatient(p, rawRx));
      const mappedReviews = rawRx.map((rx) => {
        const patient = rawPatients.find((p) => p.id === rx.patient_id);
        return toFrontendReview(rx, patient?.name || rx.patient_id);
      });
      const mappedAlerts = rawAlerts.map((alt) => {
        const patient = rawPatients.find((p) => p.id === alt.patient_id);
        return toFrontendAlert(alt, patient?.name || alt.patient_id);
      });

      setPatients(mappedPatients);
      setReviews(mappedReviews);
      setAlerts(mappedAlerts);

      // Auto-select initial patient if none selected
      if (!selectedPatientId && mappedPatients.length > 0) {
        setSelectedPatientId(mappedPatients[0].id);
      }
      if (!selectedReviewId && mappedReviews.length > 0) {
        setSelectedReviewId(mappedReviews[0].id);
      }
      if (!selectedAlertId && mappedAlerts.length > 0) {
        setSelectedAlertId(mappedAlerts[0].id);
      }
    } catch (err: any) {
      console.warn('MedGuard backend unreachable or error during data load:', err);
      setIsBackendConnected(false);
      setApiError(err?.message || 'Could not connect to FastAPI backend on port 8000.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPatientId, selectedReviewId, selectedAlertId]);

  // Initial load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // ============================================================================
  // Patient CRUD Action Handlers
  // ============================================================================

  const handleViewPatientProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
    setPatientSubView('profile');
  };

  const handleNavigateToAddPatient = () => {
    setActiveTab('patients');
    setPatientSubView('add');
  };

  const handleSaveNewPatient = async (newPatient: PatientRecord) => {
    try {
      const payload = {
        id: newPatient.id,
        name: newPatient.name,
        age: newPatient.age,
        gender: newPatient.gender.startsWith('F') ? 'F' : newPatient.gender.startsWith('M') ? 'M' : newPatient.gender,
        pregnant: newPatient.pregnant || 'N',
        weight_kg: newPatient.weight_kg ?? null,
        egfr: newPatient.egfr ?? null,
        crcl: newPatient.crcl ?? null,
        conditions: newPatient.conditions || [],
        allergies: newPatient.allergies || [],
        phone: newPatient.phone && newPatient.phone !== 'Not Recorded' ? newPatient.phone : null,
        email: newPatient.email && newPatient.email !== 'Not Recorded' ? newPatient.email : null,
        notes: `Room: ${newPatient.room || 'Not Assigned'}. ${newPatient.medicalHistory || ''}`,
      };

      const created = await api.createPatient(payload, 'DR-ADMISSION');
      const mapped = toFrontendPatient(created);

      setPatients((prev) => [mapped, ...prev]);
      setSelectedPatientId(mapped.id);
      setPatientSubView('profile');
      showToast(`Patient ${mapped.name} (${mapped.id}) registered and persisted to SQLite database.`, 'success');
      loadData(true);
    } catch (err: any) {
      showToast(`Error creating patient: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleUpdatePatient = async (updated: PatientRecord) => {
    try {
      const payload = {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        conditions: updated.conditions,
        notes: `Room: ${updated.room}. ${updated.medicalHistory || ''}`,
      };

      const res = await api.updatePatient(updated.id, payload, 'DR-CLINICAL');
      const mapped = toFrontendPatient(res);

      setPatients((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
      showToast(`Patient record for ${mapped.name} updated in SQLite database.`, 'success');
    } catch (err: any) {
      showToast(`Error updating patient: ${err?.message || 'Database error'}`, 'error');
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await api.deletePatient(patientId, 'DR-CHIEF');
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      if (selectedPatientId === patientId) {
        setSelectedPatientId(patients.find((p) => p.id !== patientId)?.id || null);
        setPatientSubView('list');
      }
      showToast(`Patient record ${patientId} successfully removed from database.`, 'success');
      loadData(true);
    } catch (err: any) {
      showToast(`Error deleting patient: ${err?.message || 'Database error'}`, 'error');
    }
  };

  // ============================================================================
  // Medication & Prescription Handlers
  // ============================================================================

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

  const handleSaveNewMedication = async (
    patientId: string,
    newMed: ActiveMedication,
    newReview: MedicationReviewRecord
  ) => {
    try {
      const payload = {
        patient_id: patientId,
        prescriber_id: newMed.prescriber || 'DR-CLINICAL',
        medication_name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        route: newMed.route,
        notes: newMed.notes,
      };

      const result = await api.createPrescription(payload);
      const rxStatus = result.prescription.status;
      const alertsCount = result.alerts_generated?.length || 0;

      await loadData(true);

      setSelectedReviewId(result.prescription.id);
      setActiveTab('medication-review');
      setMedicationSubView('review-detail');

      if (rxStatus === 'FLAGGED' || alertsCount > 0) {
        showToast(
          `Prescription evaluated by H4 Engine: FLAGGED with ${alertsCount} safety alerts!`,
          'warning'
        );
      } else {
        showToast(
          `Prescription "${newMed.name}" approved. Verified safe by H4 intelligence engine.`,
          'success'
        );
      }
    } catch (err: any) {
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
      setReviews((prev) => [newReview, ...prev]);
      setSelectedReviewId(newReview.id);
      setActiveTab('medication-review');
      setMedicationSubView('review-detail');
      showToast(
        `Backend offline: prescription added to temporary session state. ${err?.message || ''}`,
        'warning'
      );
    }
  };

  const handleReviewPrescription = async (
    reviewId: string,
    newStatus: ReviewStatus,
    newNotes?: string
  ) => {
    try {
      const action = newStatus === 'Approved' ? 'APPROVE' : newStatus === 'Flagged' ? 'FLAG' : 'REJECT';
      await api.reviewPrescription(reviewId, action, 'DR-CLINICAL', newNotes);
      showToast(`Prescription ${reviewId} marked as "${newStatus}" in database.`, 'success');
      loadData(true);
    } catch (err: any) {
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId) {
            return {
              ...rev,
              status: newStatus,
              clinicalNotes: newNotes !== undefined ? newNotes : rev.clinicalNotes,
              reviewDate: 'Just Now',
            };
          }
          return rev;
        })
      );
      showToast(`Updated locally (API error: ${err?.message || 'offline'})`, 'warning');
    }
  };

  // ============================================================================
  // Safety Alerts Navigation & Action Handlers
  // ============================================================================



  const handleSelectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActiveTab('safety-alerts');
    setSafetyAlertSubView('detail');
  };

  const handleNavigateToReport = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientForReportId(patientId);
    }
    setActiveTab('clinical-reports');
  };

  const handleNavigateToPrescriptionAnalysis = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientForAnalysisId(patientId);
    }
    setActiveTab('prescription-analysis');
  };

  const handleReviewAlert = async (
    alertId: string,
    newStatus: AlertReviewStatus,
    rationale?: string
  ) => {
    try {
      let action: 'RESOLVE' | 'OVERRIDE' | 'UNDER_REVIEW' | 'UNRESOLVED' = 'RESOLVE';
      if (newStatus === 'Resolved') action = 'RESOLVE';
      else if (newStatus === 'Under Review') action = 'UNDER_REVIEW';
      else if (newStatus === 'Unresolved') action = 'UNRESOLVED';

      await api.reviewAlert(alertId, action, rationale, 'DR-PHARMACIST');
      showToast(`Safety alert ${alertId} status persisted as "${newStatus}".`, 'success');
      loadData(true);
    } catch (err: any) {
      setAlerts((prev) =>
        prev.map((alt) => {
          if (alt.id === alertId) {
            return {
              ...alt,
              reviewStatus: newStatus,
              reviewNotes: rationale !== undefined ? rationale : alt.reviewNotes,
              reviewedBy: 'Pharm. R. Sharma (Clinical Pharmacist)',
            };
          }
          return alt;
        })
      );
      showToast(`Updated in local state (API notice: ${err?.message || 'offline'})`, 'warning');
    }
  };

  // Compute pending items count for badge
  const pendingReviewsCount = reviews.filter((r) => r.status === 'Pending Review').length;

  // Selected entities for detail sub-views
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const selectedPatientForMeds =
    patients.find((p) => p.id === selectedPatientForMedsId) || selectedPatient || patients[0];
  const selectedReview = reviews.find((r) => r.id === selectedReviewId) || reviews[0];
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const getPageTitle = (tab: NavigationTab): string => {
    switch (tab) {
      case 'dashboard':
        return 'Medication Safety Dashboard';
      case 'patients':
        return 'Patient Directory & Clinical Intake';
      case 'medication-review':
        return 'Clinical Medication Reviews';
      case 'safety-alerts':
      case 'interactions':
        return 'Real-Time Drug Safety Alerts';
      case 'clinical-reports':
        return 'Clinical Analytics & Compliance Dossier';
      case 'prescription-analysis':
        return 'Upload Prescriptions (PDF) & Safety Analysis';
      case 'settings':
        return 'System Configuration & Safety Thresholds';
      case 'audit-log':
        return 'Immutable Clinical Safety Audit Trail';
      default:
        return 'MedGuard Medication Safety System';
    }
  };

  // Render main tab view content
  const renderContent = () => {
    if (isLoading && patients.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] p-8 space-y-4">
          <Loader2 className="w-8 h-8 text-[#168C83] animate-spin" />
          <p className="text-sm font-semibold text-[#17324D]">Connecting to MedGuard Safety Intelligence...</p>
          <p className="text-xs text-slate-400">Loading electronic health records from SQLite database</p>
        </div>
      );
    }

    // 1. Dashboard Tab
    if (activeTab === 'dashboard') {
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

    // 2. Patients Tab
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

      if (patientSubView === 'profile' && selectedPatient) {
        return (
          <PatientProfilePage
            patient={selectedPatient}
            reviews={reviews.filter((r) => r.patientId === selectedPatient.id)}
            alerts={alerts.filter((a) => a.patientId === selectedPatient.id)}
            onBackToPatients={() => setPatientSubView('list')}
            onNavigateToMedicationReview={handleNavigateToMedicationReview}
            onNavigateToClinicalReport={handleNavigateToReport}
            onNavigateToPrescriptionAnalysis={handleNavigateToPrescriptionAnalysis}
            onSelectAlert={handleSelectAlert}
            onDeletePatient={handleDeletePatient}
            onUpdatePatient={handleUpdatePatient}
          />
        );
      }

      return (
        <PatientsDirectoryPage
          patients={patients}
          onViewProfile={handleViewPatientProfile}
          onAddNewPatient={handleNavigateToAddPatient}
          onDeletePatient={handleDeletePatient}
        />
      );
    }

    // 3. Medication Review Tab
    if (activeTab === 'medication-review') {
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

      if (medicationSubView === 'patient-meds' && selectedPatientForMeds) {
        return (
          <PatientMedicationsDetailPage
            patient={selectedPatientForMeds}
            onBackToReviews={() => setMedicationSubView('list')}
            onAddNewMedication={(pId) => handleNavigateToAddMedication(pId)}
            onViewPatientProfile={handleViewPatientProfile}
          />
        );
      }

      if (medicationSubView === 'review-detail' && selectedReview) {
        return (
          <MedicationReviewDetailPage
            review={selectedReview}
            patient={patients.find((p) => p.id === selectedReview.patientId)}
            onBackToReviews={() => setMedicationSubView('list')}
            onUpdateReviewStatus={handleReviewPrescription}
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

    // 4. Safety Alerts Tab
    if (activeTab === 'safety-alerts' || activeTab === 'interactions') {
      if (safetyAlertSubView === 'detail' && selectedAlert) {
        return (
          <SafetyAlertDetailPage
            alert={selectedAlert}
            patient={patients.find((p) => p.id === selectedAlert.patientId)}
            onBackToAlerts={() => setSafetyAlertSubView('list')}
            onUpdateAlertStatus={(alertId, newStatus, notes) =>
              handleReviewAlert(alertId, newStatus, notes)
            }
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

    // 5. Clinical Reports Tab
    if (activeTab === 'clinical-reports') {
      return (
        <ClinicalReportsPage
          patients={patients}
          alerts={alerts}
          reviews={reviews}
          initialPatientId={selectedPatientForReportId}
          onViewPatientProfile={handleViewPatientProfile}
        />
      );
    }

    // 6. Prescription PDF Analysis Tab
    if (activeTab === 'prescription-analysis') {
      return (
        <PrescriptionAnalysisPage
          patients={patients}
          initialPatientId={selectedPatientForAnalysisId || undefined}
          onViewPatientProfile={handleViewPatientProfile}
          onBackToDashboard={() => setActiveTab('dashboard')}
          onNavigateToMedicationReview={() => handleNavigateToMedicationReview(selectedPatientForAnalysisId || undefined)}
          onSavePrescribedMedication={async (patientId, newMed) => {
            try {
              await api.createPrescription({
                patient_id: patientId,
                medication_name: newMed.name,
                dosage: newMed.dosage,
                frequency: newMed.frequency,
                route: newMed.route,
                prescriber_id: newMed.prescriber || 'DR-CLINICAL',
                notes: newMed.notes,
              });
              showToast(`Medication order "${newMed.name}" persisted to SQLite database.`, 'success');
              loadData(true);
            } catch (err: any) {
              setPatients((prev) =>
                prev.map((p) => {
                  if (p.id === patientId) {
                    return {
                      ...p,
                      currentMedications: [newMed, ...(p.currentMedications || [])],
                    };
                  }
                  return p;
                })
              );
              showToast(`Medication order "${newMed.name}" added to session state.`, 'warning');
            }
          }}
        />
      );
    }

    // 7. Other Clinical Tabs
    return (
      <PlaceholderPage
        tab={activeTab}
        onBackToDashboard={() => setActiveTab('dashboard')}
      />
    );
  };

  // Protected Route Guard: If user is not authenticated, show the Login Page first
  if (!isAuthenticated) {
    return (
      <>
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
              toastType === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toastType === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-[#17324D] text-white border-slate-700'
            }`}
          >
            {toastType === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : toastType === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
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

        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

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
      currentUser={currentUser || undefined}
      onLogout={handleLogout}
    >
      {/* Backend Connection Error Banner (Phase 7) */}
      {!isBackendConnected && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
              <ServerOff className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-900">Backend Connection Disconnected</p>
              <p className="text-slate-600 mt-0.5">
                {apiError || 'Failed to communicate with FastAPI at http://127.0.0.1:8000. Start backend server to restore persistence.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Database Status Indicator Bar */}
      {isBackendConnected && !isLoading && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Live Backend Connected</span>
            <span>•</span>
            <span className="font-mono text-slate-600">SQLite (medguard.db)</span>
            <span>•</span>
            <span>{patients.length} patients • {reviews.length} prescriptions • {alerts.length} safety alerts</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1 text-slate-600 hover:text-[#17324D] font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toastType === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : toastType === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-[#17324D] text-white border-slate-700'
          }`}
        >
          {toastType === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toastType === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
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

      {/* Main Page Dynamic Routing Content */}
      <div className="space-y-6">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}

export default App;
