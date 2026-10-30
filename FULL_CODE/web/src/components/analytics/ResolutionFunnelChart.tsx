import { useState } from 'react';
import type { SafetyAlertRecord } from '../../types/clinical';
import { CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

interface ResolutionFunnelChartProps {
  alerts: SafetyAlertRecord[];
}

export const ResolutionFunnelChart = ({ alerts }: ResolutionFunnelChartProps) => {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  const total = alerts.length;
  const unresolved = alerts.filter((a) => a.reviewStatus === 'Unresolved').length;
  const underReview = alerts.filter((a) => a.reviewStatus === 'Under Review').length;
  const resolved = alerts.filter((a) => a.reviewStatus === 'Resolved').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const inProgressRate = total > 0 ? Math.round((underReview / total) * 100) : 0;
  const unresolvedRate = total > 0 ? Math.round((unresolved / total) * 100) : 0;

  const statusItems = [
    {
      label: 'Open / Unresolved',
      count: unresolved,
      percent: unresolvedRate,
      color: '#E11D48',
      barColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      subtext: 'Awaiting clinical review and pharmacist intervention',
    },
    {
      label: 'Under Active Review',
      count: underReview,
      percent: inProgressRate,
      color: '#D97706',
      barColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      subtext: 'Escalated to attending physician or in dosage titration',
    },
    {
      label: 'Clinically Resolved',
      count: resolved,
      percent: resolutionRate,
      color: '#059669',
      barColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      subtext: 'Mitigation accepted, order reconciled, and verified',
    },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">
              Alert Resolution Lifecycle
            </h3>
            <p className="text-xs text-slate-500">
              Pharmacovigilance mitigation workflow throughput
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {resolutionRate}% Resolved
          </span>
        </div>

        {/* Stacked Resolution Bar */}
        <div className="mb-4">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${unresolvedRate}%` }}
              className="bg-rose-500 h-full transition-all duration-500 cursor-pointer"
              title={`Open Alerts: ${unresolved} (${unresolvedRate}%)`}
              onMouseEnter={() => setHoveredStatus('Open / Unresolved')}
              onMouseLeave={() => setHoveredStatus(null)}
            />
            <div
              style={{ width: `${inProgressRate}%` }}
              className="bg-amber-500 h-full transition-all duration-500 cursor-pointer"
              title={`Under Review: ${underReview} (${inProgressRate}%)`}
              onMouseEnter={() => setHoveredStatus('Under Active Review')}
              onMouseLeave={() => setHoveredStatus(null)}
            />
            <div
              style={{ width: `${resolutionRate}%` }}
              className="bg-emerald-500 h-full transition-all duration-500 cursor-pointer"
              title={`Resolved: ${resolved} (${resolutionRate}%)`}
              onMouseEnter={() => setHoveredStatus('Clinically Resolved')}
              onMouseLeave={() => setHoveredStatus(null)}
            />
          </div>
        </div>

        {/* Status Stages List */}
        <div className="space-y-3">
          {statusItems.map((st) => {
            const isHovered = hoveredStatus === st.label;
            return (
              <div
                key={st.label}
                onMouseEnter={() => setHoveredStatus(st.label)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isHovered ? 'bg-slate-50 border-slate-300 shadow-xs' : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded bg-slate-100">{st.icon}</div>
                    <span className="font-bold text-[#17324D]">{st.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 font-mono text-xs">
                      {st.count} alerts
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 font-mono">
                      ({st.percent}%)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                  {st.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Average resolution turnaround: <strong>1.4 hrs</strong></span>
        <span className="italic text-slate-400">CDS Closed-Loop Workflow</span>
      </div>
    </div>
  );
};

export default ResolutionFunnelChart;
