import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ChevronRight,
  Pill,
  ExternalLink,
  Shield,
  Stethoscope,
  Info,
} from 'lucide-react';
import type {
  SafetyAlertRecord,
  AlertCategory,
  AlertSeverity,
  AlertReviewStatus,
} from '../types/clinical';

interface SafetyAlertsPageProps {
  alerts: SafetyAlertRecord[];
  onSelectAlert: (alertId: string) => void;
  onViewPatientProfile: (patientId: string) => void;
  searchQuery?: string;
}

export const SafetyAlertsPage = ({
  alerts,
  onSelectAlert,
  onViewPatientProfile,
  searchQuery = '',
}: SafetyAlertsPageProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'severity'>('date-desc');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter((a) => a.severity === 'Critical').length;
    const high = alerts.filter((a) => a.severity === 'High').length;
    const moderate = alerts.filter((a) => a.severity === 'Moderate').length;
    const resolved = alerts.filter((a) => a.reviewStatus === 'Resolved').length;

    return { total, critical, high, moderate, resolved };
  }, [alerts]);

  // Categories with counts for tab pills
  const categories: { label: string; value: string; count: number }[] = [
    { label: 'All Categories', value: 'All', count: alerts.length },
    {
      label: 'Drug-Drug Interactions',
      value: 'Drug-Drug Interaction',
      count: alerts.filter((a) => a.category === 'Drug-Drug Interaction').length,
    },
    {
      label: 'Duplicate Medications',
      value: 'Duplicate Medication',
      count: alerts.filter((a) => a.category === 'Duplicate Medication').length,
    },
    {
      label: 'Renal Safety',
      value: 'Renal Safety',
      count: alerts.filter((a) => a.category === 'Renal Safety').length,
    },
    {
      label: 'Other Warnings',
      value: 'Other Warning',
      count: alerts.filter((a) => a.category === 'Other Warning').length,
    },
  ];

  // Filtered and Sorted alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        // Category filter
        if (selectedCategory !== 'All' && alert.category !== selectedCategory) {
          return false;
        }

        // Severity filter
        if (selectedSeverity !== 'All' && alert.severity !== selectedSeverity) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'All' && alert.reviewStatus !== selectedStatus) {
          return false;
        }

        // Search filter
        const query = searchTerm.trim().toLowerCase();
        if (query) {
          const matchId = alert.id.toLowerCase().includes(query);
          const matchPatientName = alert.patientName.toLowerCase().includes(query);
          const matchPatientId = alert.patientId.toLowerCase().includes(query);
          const matchType = alert.alertType.toLowerCase().includes(query);
          const matchSummary = alert.summary.toLowerCase().includes(query);
          const matchMeds = alert.affectedMedications.some((m) =>
            m.toLowerCase().includes(query)
          );
          if (!matchId && !matchPatientName && !matchPatientId && !matchType && !matchSummary && !matchMeds) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'severity') {
          const weight: Record<AlertSeverity, number> = {
            Critical: 4,
            High: 3,
            Moderate: 2,
            Low: 1,
          };
          return weight[b.severity] - weight[a.severity];
        }
        if (sortBy === 'date-asc') {
          return a.date.localeCompare(b.date);
        }
        return b.date.localeCompare(a.date);
      });
  }, [alerts, selectedCategory, selectedSeverity, selectedStatus, searchTerm, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSeverity('All');
    setSelectedStatus('All');
    setSearchTerm('');
    setSortBy('date-desc');
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            High Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
            Moderate Risk
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Low Risk
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertReviewStatus) => {
    switch (status) {
      case 'Unresolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Unresolved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolved
          </span>
        );
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'Drug-Drug Interaction':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case 'Duplicate Medication':
        return <Pill className="w-3.5 h-3.5 text-amber-600" />;
      case 'Renal Safety':
        return <Stethoscope className="w-3.5 h-3.5 text-blue-600" />;
      case 'Other Warning':
        return <Shield className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#17324D]">
                Medication Safety Alerts
              </h1>
              <p className="text-xs text-slate-500">
                Active clinical decision support alerts, drug interactions, duplicate therapy, and renal safety warnings
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono font-medium border border-slate-200">
            CDS Engine v2.4 Active
          </span>
        </div>
      </div>

      {/* Task 1: 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Alerts
            </p>
            <h3 className="text-2xl font-bold text-[#17324D] mt-1">{metrics.total}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Across active registry</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-gradient-to-br from-white to-rose-50/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Critical Alerts
            </p>
            <h3 className="text-2xl font-bold text-rose-800 mt-1">{metrics.critical}</h3>
            <p className="text-[11px] text-rose-600/80 mt-0.5">Immediate intervention</p>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* High-Risk Alerts */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              High-Risk Alerts
            </p>
            <h3 className="text-2xl font-bold text-amber-800 mt-1">{metrics.high}</h3>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Action required today</p>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Moderate-Risk Alerts */}
        <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-800">
              Moderate-Risk
            </p>
            <h3 className="text-2xl font-bold text-yellow-900 mt-1">{metrics.moderate}</h3>
            <p className="text-[11px] text-yellow-700/80 mt-0.5">Dose & lab monitoring</p>
          </div>
          <div className="p-2.5 bg-yellow-100 text-yellow-800 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Resolved Alerts
            </p>
            <h3 className="text-2xl font-bold text-emerald-800 mt-1">{metrics.resolved}</h3>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Clinical sign-off</p>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Task 2: Category Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
              selectedCategory === cat.value
                ? 'bg-[#17324D] text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCategory === cat.value
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task 4: Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient, medication, alert ID, or trigger..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Review Statuses</option>
              <option value="Unresolved">Unresolved</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="severity">Severity Rank</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline lg:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Filter Summary Indicator */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-slate-800">{filteredAlerts.length}</strong> of{' '}
              {alerts.length} medication safety alerts
            </span>
          </div>

          {(selectedCategory !== 'All' ||
            selectedSeverity !== 'All' ||
            selectedStatus !== 'All' ||
            searchTerm) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-blue-600 hover:underline text-xs font-medium cursor-pointer"
            >
              Clear active filters
            </button>
          )}
        </div>
      </div>

      {/* Task 1 & 2: Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Alert ID & Date</th>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Category & Trigger Type</th>
                  <th className="px-4 py-3.5">Affected Medication(s)</th>
                  <th className="px-4 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectAlert(alert.id)}
                  >
                    {/* Alert ID & Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-[#17324D] border border-slate-200">
                          {alert.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {alert.date}
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewPatientProfile(alert.patientId);
                            }}
                            className="font-bold text-[#17324D] hover:text-blue-600 hover:underline flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <span>{alert.patientName}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {alert.patientId} • {alert.patientContext?.room || 'Inpatient'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Trigger Type */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5 mb-1">
                        {getCategoryIcon(alert.category)}
                        <span className="text-[11px] font-semibold text-slate-600">
                          {alert.category}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {alert.alertType}
                      </div>
                    </td>

                    {/* Affected Medications */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {alert.affectedMedications.map((med, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            <Pill className="w-3 h-3 text-slate-400 mr-1" />
                            {med}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getSeverityBadge(alert.severity)}
                    </td>

                    {/* Review Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(alert.reviewStatus)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No matching medication safety alerts found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              We couldn&apos;t find any safety alerts matching the current category, severity, status, or search query.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* Table Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Hospital Clinical Decision Support (CDS) Rules Engine Registry • Demonstration Data Only
          </span>
          <span className="italic">
            Severity protocol aligned with ISMP and Joint Commission Standards
          </span>
        </div>
      </div>
    </div>
  );
};

export default SafetyAlertsPage;
