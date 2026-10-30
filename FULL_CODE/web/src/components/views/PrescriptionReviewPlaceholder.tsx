import React from 'react';
import { FileCheck2, Info } from 'lucide-react';

export const PrescriptionReviewPlaceholder: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-[#168C83]/10 text-[#168C83] flex items-center justify-center mx-auto mb-4">
        <FileCheck2 className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-[#17324D]">
        Prescription Safety Review Module (Phase 2)
      </h2>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        This module is reserved for parsing, validating, and presenting clinician-submitted prescriptions.
        In accordance with Phase 1 constraints, mock patient records and placeholder medical data are omitted.
      </p>
      <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 text-left text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-[#17324D] mb-1">
          <Info className="w-4 h-4 text-[#168C83]" />
          <span>Planned Phase 2 Features:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-500 ml-1">
          <li>Prescription entry & EHR/EMR ingestion</li>
          <li>Patient allergy and active regimen cross-referencing</li>
          <li>Real-time automated second-look safety alerts</li>
        </ul>
      </div>
    </div>
  );
};
