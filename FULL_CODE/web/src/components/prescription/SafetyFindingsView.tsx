import React, { useState } from 'react';
import {
  ShieldAlert,
  Info,
  Pill,
  BookOpen,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import type { PrescriptionSafetyFinding, SafetyFindingCategory } from '../../types/prescription';
import type { AlertSeverity } from '../../types/clinical';

interface SafetyFindingsViewProps {
  findings: PrescriptionSafetyFinding[];
}

export const SafetyFindingsView: React.FC<SafetyFindingsViewProps> = ({ findings }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: SafetyFindingCategory[] = [
    'Drug-Drug Interaction',
    'Duplicate Medication',
    'Contraindication',
    'Renal Safety',
    'Other Warning',
  ];

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            High Risk
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
            Moderate Risk
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-500" />
            Low / Formulary
          </span>
        );
    }
  };

  const getCategoryBadgeClass = (category: SafetyFindingCategory) => {
    switch (category) {
      case 'Contraindication':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Drug-Drug Interaction':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Renal Safety':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Duplicate Medication':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Other Warning':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity =
      selectedSeverity === 'all' || f.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesCategory =
      selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSeverity && matchesCategory;
  });

  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  const modCount = findings.filter((f) => f.severity === 'Moderate').length;
  const lowCount = findings.filter((f) => f.severity === 'Low').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#17324D] text-white flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
              <span>4. H4 Safety Engine Contraindication Findings</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {findings.length} alerts
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated across Drug-Drug Interactions, Allergies, Renal Tolerability, and Duplicate Therapy.
            </p>
          </div>
        </div>

        {/* Severity Count Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedSeverity('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              selectedSeverity === 'all'
                ? 'bg-[#17324D] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({findings.length})
          </button>
          {criticalCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeverity('critical')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Critical ({criticalCount})
            </button>
          )}
          {highCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeverity('high')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'high'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              High ({highCount})
            </button>
          )}
          {modCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeverity('moderate')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'moderate'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              Moderate ({modCount})
            </button>
          )}
          {lowCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeverity('low')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedSeverity === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Low ({lowCount})
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter Domain:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#168C83] text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Domains
        </button>
        {categories.map((cat) => {
          const count = findings.filter((f) => f.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedCategory === cat
                  ? 'bg-[#168C83] text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <span>{cat}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Findings List */}
      <div className="p-5 sm:p-6 space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <h4 className="text-sm font-bold text-[#17324D] mb-1">
              No Safety Warnings Matching Filter
            </h4>
            <p className="text-xs text-slate-500">
              No active findings in the selected severity or category filter.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                finding.severity === 'Critical'
                  ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                  : finding.severity === 'High'
                  ? 'bg-amber-50/40 border-amber-300'
                  : finding.severity === 'Moderate'
                  ? 'bg-yellow-50/30 border-yellow-200'
                  : 'bg-blue-50/20 border-blue-200'
              }`}
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(finding.severity)}
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadgeClass(
                      finding.category
                    )}`}
                  >
                    {finding.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {finding.id}
                  </span>
                </div>

                {finding.reviewStatus && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 self-end sm:self-auto">
                    Status: {finding.reviewStatus}
                  </span>
                )}
              </div>

              {/* Affected Medications */}
              <div className="mb-3 flex items-center flex-wrap gap-1.5">
                <span className="text-xs font-bold text-[#17324D] flex items-center gap-1 mr-1">
                  <Pill className="w-3.5 h-3.5 text-[#168C83]" />
                  <span>Involved Medication(s):</span>
                </span>
                {finding.affectedMedications.map((medName) => (
                  <span
                    key={medName}
                    className="px-2.5 py-0.5 bg-white text-slate-800 font-bold text-xs rounded-md border border-slate-300 shadow-2xs"
                  >
                    {medName}
                  </span>
                ))}
              </div>

              {/* Clinical Explanation */}
              <div className="text-xs text-slate-700 leading-relaxed mb-3">
                <p className="font-medium">{finding.explanation}</p>
              </div>

              {/* Recommendation Block */}
              {finding.recommendation && (
                <div className="p-3 rounded-lg bg-white/90 border border-slate-200/90 text-xs mb-3 shadow-2xs">
                  <span className="font-bold text-[#17324D] block mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    <span>Prescriber Clinical Recommendation:</span>
                  </span>
                  <p className="text-slate-700 leading-normal font-medium">
                    {finding.recommendation}
                  </p>
                </div>
              )}

              {/* Evidence & H4 Rule Reference */}
              {finding.evidenceSource && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                  <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    <strong>H4 Evidence:</strong> {finding.evidenceSource}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
