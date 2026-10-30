import { useState } from 'react';
import type { SafetyAlertRecord } from '../../types/clinical';
import { AlertTriangle, Pill, Stethoscope, Shield, Info } from 'lucide-react';

interface CategoryBreakdownChartProps {
  alerts: SafetyAlertRecord[];
}

export const CategoryBreakdownChart = ({ alerts }: CategoryBreakdownChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const total = alerts.length;
  const ddiCount = alerts.filter((a) => a.category === 'Drug-Drug Interaction').length;
  const dupCount = alerts.filter((a) => a.category === 'Duplicate Medication').length;
  const renalCount = alerts.filter((a) => a.category === 'Renal Safety').length;
  const otherCount = alerts.filter((a) => a.category === 'Other Warning').length;

  const categories = [
    {
      name: 'Drug-Drug Interactions',
      category: 'Drug-Drug Interaction',
      count: ddiCount,
      color: '#E11D48',
      barColor: 'bg-gradient-to-r from-rose-500 to-rose-600',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
      description: 'Synergistic adverse drug event & clearance antagonism',
    },
    {
      name: 'Duplicate Medications',
      category: 'Duplicate Medication',
      count: dupCount,
      color: '#EA580C',
      barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: <Pill className="w-3.5 h-3.5 text-amber-600" />,
      description: 'Therapeutic redundancy across overlapping regimens',
    },
    {
      name: 'Renal Safety Warnings',
      category: 'Renal Safety',
      count: renalCount,
      color: '#0284C7',
      barColor: 'bg-gradient-to-r from-sky-500 to-blue-600',
      icon: <Stethoscope className="w-3.5 h-3.5 text-blue-600" />,
      description: 'eGFR dose adjustment & renal elimination thresholding',
    },
    {
      name: 'Other Warnings & Allergies',
      category: 'Other Warning',
      count: otherCount,
      color: '#4F46E5',
      barColor: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      icon: <Shield className="w-3.5 h-3.5 text-indigo-600" />,
      description: 'Documented allergy cross-reactions & geriatric limits',
    },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">
              Alerts by Clinical Category
            </h3>
            <p className="text-xs text-slate-500">Distribution across CDS pharmacological domains</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            4 Domains
          </span>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-4 my-2">
          {categories.map((cat) => {
            const percent = total > 0 ? Math.round((cat.count / total) * 100) : 0;
            const isHovered = hoveredCategory === cat.name;

            return (
              <div
                key={cat.name}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered ? 'bg-slate-50 border-slate-300 shadow-xs' : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded bg-slate-100">{cat.icon}</div>
                    <span className="font-bold text-[#17324D]">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{cat.count} alerts</span>
                    <span className="text-[11px] font-semibold text-slate-400 font-mono">
                      ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cat.barColor}`}
                    style={{ width: `${Math.max(percent, 4)}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 mt-1 pl-1 line-clamp-1">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Cross-referenced against ACCP, KDIGO and Beers Criteria
        </span>
        <span className="font-semibold text-slate-600">100% Categorized</span>
      </div>
    </div>
  );
};

export default CategoryBreakdownChart;
