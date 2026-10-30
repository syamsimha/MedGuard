import { useState } from 'react';
import type { SafetyAlertRecord } from '../../types/clinical';
import { AlertCircle } from 'lucide-react';

interface SeverityDistributionChartProps {
  alerts: SafetyAlertRecord[];
}

export const SeverityDistributionChart = ({ alerts }: SeverityDistributionChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = alerts.length;
  const critical = alerts.filter((a) => a.severity === 'Critical').length;
  const high = alerts.filter((a) => a.severity === 'High').length;
  const moderate = alerts.filter((a) => a.severity === 'Moderate').length;
  const low = alerts.filter((a) => a.severity === 'Low').length;

  const data = [
    { label: 'Critical Risk', count: critical, color: '#E11D48', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
    { label: 'High Risk', count: high, color: '#EA580C', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: 'Moderate Risk', count: moderate, color: '#CA8A04', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    { label: 'Low Risk', count: low, color: '#2563EB', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  ];

  // Calculate SVG Donut strokeDasharray and strokeDashoffset
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = data.map((item, idx) => {
    const percent = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">
              Safety Alerts by Severity
            </h3>
            <p className="text-xs text-slate-500">Risk stratification of active CDS alerts</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {total} Total
          </span>
        </div>

        {/* Donut Chart Visual */}
        <div className="relative flex items-center justify-center my-3">
          <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="13"
            />

            {/* Segments */}
            {total > 0 ? (
              segments.map((seg) => (
                <circle
                  key={seg.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredIndex === seg.idx ? 15 : 13}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(seg.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))
            ) : (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute text-center pointer-events-none">
            {hoveredIndex !== null ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {segments[hoveredIndex].label}
                </p>
                <p className="text-xl font-bold text-[#17324D]">
                  {segments[hoveredIndex].count}
                </p>
                <p className="text-[11px] font-semibold text-blue-600">
                  {segments[hoveredIndex].percent}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-[#17324D]">{total}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Alerts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        {segments.map((seg) => (
          <div
            key={seg.label}
            onMouseEnter={() => setHoveredIndex(seg.idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              hoveredIndex === seg.idx ? 'bg-slate-50 border-slate-300 shadow-xs' : 'border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-slate-600 font-medium text-[11px]">{seg.label}</span>
            </div>
            <div className="flex items-center justify-between mt-1 pl-4.5">
              <span className="font-bold text-slate-800 text-xs">{seg.count} alerts</span>
              <span className="text-[11px] font-semibold text-slate-500">{seg.percent}%</span>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 mt-2">
          <AlertCircle className="w-4 h-4 mx-auto mb-1 text-slate-400" />
          No alerts recorded in this reporting period.
        </div>
      )}
    </div>
  );
};

export default SeverityDistributionChart;
