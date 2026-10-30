import React from 'react';
import { BookOpen, Info } from 'lucide-react';

export const RulesEnginePlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-[#168C83]/10 text-[#168C83] flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-[#17324D]">
        Dosage & Contraindication Rules (Phase 2)
      </h2>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        Rule evaluation and knowledgebase retrieval logic will reside in the pipeline and backend services.
      </p>
      <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 text-left text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-[#17324D] mb-1">
          <Info className="w-4 h-4 text-[#168C83]" />
          <span>Planned Phase 2 Features:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-500 ml-1">
          <li>Age, renal function, and hepatic adjustment thresholds</li>
          <li>Maximum daily dosage & frequency caps</li>
          <li>Black box warning flag trigger mechanism</li>
        </ul>
      </div>
    </div>
  );
};
