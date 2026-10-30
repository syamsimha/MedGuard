import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const InteractionSafetyPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-[#17324D]">
        Drug-Drug Interaction Engine (Phase 2)
      </h2>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        The drug interaction engine will cross-examine multi-medication therapies against clinical pharmacology rule bases.
        Fake drug interaction results are prohibited in Phase 1 to preserve clinical integrity.
      </p>
      <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 text-left text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-[#17324D] mb-1">
          <Info className="w-4 h-4 text-[#168C83]" />
          <span>Planned Phase 2 Features:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-500 ml-1">
          <li>Multi-drug combinatorial interaction matrix</li>
          <li>Severity categorization (Contraindicated, Major, Moderate, Minor)</li>
          <li>Clinical recommendation summaries & alternative suggestions</li>
        </ul>
      </div>
    </div>
  );
};
