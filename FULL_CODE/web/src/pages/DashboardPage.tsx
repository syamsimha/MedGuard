import { useState, useMemo } from 'react';
import {
  Users,
  FileText,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { PatientTable } from '../components/PatientTable';
import { MedicationReviewTable } from '../components/MedicationReviewTable';
import { SafetyAlertList } from '../components/SafetyAlertList';
import { QuickActionCard } from '../components/QuickActionCard';
import { AlertDetailModal } from '../components/modals/AlertDetailModal';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
  StatCardData,
} from '../types/clinical';
import type { NavigationTab } from '../types/navigation';

interface DashboardPageProps {
  patients: PatientRecord[];
  reviews: MedicationReviewRecord[];
  alerts?: SafetyAlertRecord[];
  onNavigateTab: (tab: NavigationTab) => void;
  onViewPatientProfile: (patientId: string) => void;
  onNavigateToAddPatient: () => void;
  onSelectReview: (reviewId: string) => void;
  onSelectAlert?: (alertId: string) => void;
  searchQuery: string;
}

export const DashboardPage = ({
  patients,
  reviews,
  alerts = [],
  onNavigateTab,
  onViewPatientProfile,
  onNavigateToAddPatient,
  onSelectReview,
  onSelectAlert,
  searchQuery,
}: DashboardPageProps) => {
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlertRecord | null>(null);

  // Search filtering across patients, reviews, alerts
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.room.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.medicationName.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts;
    const q = searchQuery.toLowerCase();
    return alerts.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.alertType.toLowerCase().includes(q) ||
        a.severity.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q)
    );
  }, [alerts, searchQuery]);

  // Phase 6: Live clinical metrics directly derived from backend database records
  const statCardsData = useMemo<StatCardData[]>(() => {
    const totalPatients = patients.length;
    const totalPrescriptions = reviews.length;
    const flaggedPrescriptions = reviews.filter((r) => r.status === 'Flagged').length;
    const pendingReviews = reviews.filter((r) => r.status === 'Pending Review').length;
    const activeAlerts = alerts.filter((a) => a.reviewStatus !== 'Resolved').length;
    const resolvedAlerts = alerts.filter((a) => a.reviewStatus === 'Resolved').length;
    const criticalAlerts = alerts.filter((a) => a.severity === 'Critical').length;

    return [
      {
        id: 'total-patients',
        title: 'Total Patients',
        value: totalPatients.toLocaleString(),
        changeLabel: `${patients.filter((p) => p.status === 'Active').length} active in database`,
        badge: 'Live DB',
        variant: 'default',
      },
      {
        id: 'total-prescriptions',
        title: 'Total Prescriptions',
        value: totalPrescriptions.toLocaleString(),
        changeLabel: `${reviews.filter((r) => r.status === 'Approved').length} approved therapy`,
        badge: 'Live DB',
        variant: 'default',
      },
      {
        id: 'flagged-prescriptions',
        title: 'Flagged Prescriptions',
        value: flaggedPrescriptions.toLocaleString(),
        changeLabel: 'Clinical hazards intercepted',
        badge: 'H4 Engine',
        variant: flaggedPrescriptions > 0 ? 'danger' : 'success',
      },
      {
        id: 'pending-reviews',
        title: 'Pending Reviews',
        value: pendingReviews.toLocaleString(),
        changeLabel: 'In pharmacist queue',
        badge: 'Queue',
        variant: pendingReviews > 0 ? 'warning' : 'default',
      },
      {
        id: 'active-alerts',
        title: 'Active Safety Alerts',
        value: activeAlerts.toLocaleString(),
        changeLabel: `${criticalAlerts} critical severity`,
        badge: 'Safety',
        variant: activeAlerts > 0 ? 'danger' : 'success',
      },
      {
        id: 'resolved-alerts',
        title: 'Resolved Alerts',
        value: resolvedAlerts.toLocaleString(),
        changeLabel: 'Interventions signed-off',
        badge: 'Mitigated',
        variant: 'success',
      },
    ];
  }, [patients, reviews, alerts]);

  const statIcons = [
    <Users key="1" className="w-5 h-5 text-blue-600" />,
    <FileText key="2" className="w-5 h-5 text-emerald-600" />,
    <AlertTriangle key="3" className="w-5 h-5 text-rose-600" />,
    <Clock key="4" className="w-5 h-5 text-amber-600" />,
    <ShieldAlert key="5" className="w-5 h-5 text-rose-600" />,
    <CheckCircle2 key="6" className="w-5 h-5 text-emerald-600" />,
  ];

  return (
    <div className="space-y-6">
      {/* Search Feedback Banner (if active) */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-blue-900">
          <span>
            Filtering results for: <strong className="text-[#17324D]">&ldquo;{searchQuery}&rdquo;</strong>
          </span>
          <span className="font-semibold text-blue-700">
            {filteredPatients.length} patients • {filteredReviews.length} reviews • {filteredAlerts.length} alerts
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActionCard
        onAddPatient={onNavigateToAddPatient}
        onReviewMedication={() => onNavigateTab('medication-review')}
        onViewSafetyAlerts={() => onNavigateTab('safety-alerts')}
        onUploadPrescription={() => onNavigateTab('prescription-analysis')}
      />

      {/* Phase 6: 6 Live Clinical Statistic Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {statCardsData.map((stat, idx) => (
          <StatCard key={stat.id} data={stat} icon={statIcons[idx]} />
        ))}
      </section>

      {/* Dashboard Sections (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Patients & Medication Reviews) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Recent Patients */}
          <PatientTable
            patients={filteredPatients}
            onViewProfile={(p) => onViewPatientProfile(p.id)}
            onViewAll={() => onNavigateTab('patients')}
          />

          {/* Section B: Recent Medication Reviews */}
          <MedicationReviewTable
            reviews={filteredReviews}
            onViewReview={(r) => onSelectReview(r.id)}
            onViewAll={() => onNavigateTab('medication-review')}
          />
        </div>

        {/* Right Column (Safety Alerts) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section C: Recent Safety Alerts */}
          <SafetyAlertList
            alerts={filteredAlerts}
            onViewDetails={(a) => {
              if (onSelectAlert) {
                onSelectAlert(a.id);
              } else {
                setSelectedAlert(a);
              }
            }}
            onViewAll={() => onNavigateTab('safety-alerts')}
          />
        </div>
      </div>

      {/* Interactive Safety Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
};

export default DashboardPage;
