import {
  Users,
  FileCheck2,
  AlertTriangle,
  BarChart3,
  Settings,
  ArrowLeft,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { NavigationTab } from '../types/navigation';

interface PlaceholderPageProps {
  tab: NavigationTab;
  onBackToDashboard: () => void;
}

export const PlaceholderPage = ({ tab, onBackToDashboard }: PlaceholderPageProps) => {
  const getTabConfig = (id: NavigationTab) => {
    switch (id) {
      case 'patients':
        return {
          title: 'Patients Management',
          icon: <Users className="w-8 h-8 text-blue-600" />,
          subtitle: 'Comprehensive inpatient and outpatient patient directory & clinical history',
          roadmapPhase: 'Phase 3: Patient & Prescription Management',
          previewPoints: [
            'Full patient demographics and electronic medical record (EMR) synchronization',
            'Active medication profile with historical prescription logs',
            'Documented allergies, renal function indicators, and diagnostic panels',
          ],
        };
      case 'medication-review':
        return {
          title: 'Medication Review Workflow',
          icon: <FileCheck2 className="w-8 h-8 text-emerald-600" />,
          subtitle: 'Clinical pharmacist verification queue and dosing confirmation',
          roadmapPhase: 'Phase 3: Clinical Decision Support & Ingestion',
          previewPoints: [
            'Real-time prescription review queue with automated prioritization',
            'Dosing range verification against age, weight, and renal clearance',
            'Pharmacist sign-off and clinical rationale documentation',
          ],
        };
      case 'safety-alerts':
        return {
          title: 'Safety Alerts Console',
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          subtitle: 'Active contraindications, drug-drug interaction matrix, and risk mitigation',
          roadmapPhase: 'Phase 4: Medication Safety Intelligence Engine',
          previewPoints: [
            'Drug-drug, drug-disease, and drug-allergy contraindication checks',
            'Multi-tier clinical severity categorization (High, Moderate, Advisory)',
            'Actionable intervention recommendations for prescribing physicians',
          ],
        };
      case 'clinical-reports':
        return {
          title: 'Clinical Reports & Analytics',
          icon: <BarChart3 className="w-8 h-8 text-indigo-600" />,
          subtitle: 'Medication error interception metrics, compliance reports, and safety audits',
          roadmapPhase: 'Phase 5: Safety Audits & Reporting',
          previewPoints: [
            'Interception rate tracking across inpatient departments',
            'Most frequently flagged drug combinations and dosage anomalies',
            'Automated regulatory compliance export and hospital safety committee audits',
          ],
        };
      case 'settings':
        return {
          title: 'System & Safety Configuration',
          icon: <Settings className="w-8 h-8 text-slate-600" />,
          subtitle: 'Rules engine sensitivity, hospital formulary, and alert preferences',
          roadmapPhase: 'System Administration',
          previewPoints: [
            'Hospital formulary database management and drug catalog updates',
            'Alert sensitivity thresholds by care unit (e.g. ICU vs Ambulatory)',
            'Role-based access control and clinical audit logging parameters',
          ],
        };
      default:
        return {
          title: 'Clinical Module',
          icon: <ShieldCheck className="w-8 h-8 text-[#168C83]" />,
          subtitle: 'Hospital Medication Safety Intelligence module',
          roadmapPhase: 'Upcoming Phase',
          previewPoints: [
            'Clinical workflow interface',
            'Safety rule validation',
            'Hospital pharmacy data integration',
          ],
        };
    }
  };

  const config = getTabConfig(tab);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-[#17324D]">{config.title}</h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Placeholder
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{config.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-[#17324D] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Roadmap Phase Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Clock className="w-4 h-4 text-[#168C83] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#17324D]">
              Scheduled for: {config.roadmapPhase}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              In accordance with project safety guidelines, full clinical workflows and backend API connections
              for this module are reserved for subsequent implementation phases.
            </p>
          </div>
        </div>

        {/* Feature Preview Checklist */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Planned Clinical Capabilities
          </h3>
          <ul className="space-y-2.5">
            {config.previewPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start space-x-2.5 text-xs text-slate-700 bg-white border border-slate-100 rounded-lg p-3"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
