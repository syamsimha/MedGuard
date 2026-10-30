import { useState, useMemo } from 'react';
import {
  Users,
  FileCheck2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { PatientTable } from '../components/PatientTable';
import { MedicationReviewTable } from '../components/MedicationReviewTable';
import { SafetyAlertList } from '../components/SafetyAlertList';
import { QuickActionCard } from '../components/QuickActionCard';
import { AlertDetailModal } from '../components/modals/AlertDetailModal';
import {
  SAMPLE_STAT_CARDS,
  SAMPLE_SAFETY_ALERTS,
} from '../data/sampleData';
import type {
  PatientRecord,
  MedicationReviewRecord,
  SafetyAlertRecord,
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
  alerts = SAMPLE_SAFETY_ALERTS,
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

  // Dynamic stat cards calculating current patient and review totals
  const statCardsData = useMemo(() => {
    return SAMPLE_STAT_CARDS.map((stat) => {
      if (stat.id === 'total-patients') {
        const total = 1248 + (patients.length - 5);
        return {
          ...stat,
          value: total.toLocaleString(),
          changeLabel: `+${14 + (patients.length - 5)} admitted this week`,
        };
      }
      if (stat.id === 'medications-reviewed') {
        const approvedCount = reviews.filter((r) => r.status === 'Approved').length;
        const totalReviews = 3892 + (reviews.length - 8);
        return {
          ...stat,
          value: totalReviews.toLocaleString(),
          changeLabel: `${approvedCount} verified in current queue`,
        };
      }
      return stat;
    });
  }, [patients.length, reviews]);

  const statIcons = [
    <Users key="1" className="w-5 h-5 text-blue-600" />,
    <FileCheck2 key="2" className="w-5 h-5 text-emerald-600" />,
    <AlertTriangle key="3" className="w-5 h-5 text-amber-600" />,
    <ShieldAlert key="4" className="w-5 h-5 text-rose-600" />,
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

      {/* Quick Actions (Task 3.D) */}
      <QuickActionCard
        onAddPatient={onNavigateToAddPatient}
        onReviewMedication={() => onNavigateTab('medication-review')}
        onViewSafetyAlerts={() => onNavigateTab('safety-alerts')}
        onUploadPrescription={() => onNavigateTab('prescription-analysis')}
      />

      {/* Task 2: 4 Statistic Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCardsData.map((stat, idx) => (
          <StatCard key={stat.id} data={stat} icon={statIcons[idx]} />
        ))}
      </section>

      {/* Task 3: Dashboard Sections (Grid) */}
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
