import React from 'react';
import {
  UploadCloud,
  FileSearch,
  Pill,
  ShieldAlert,
  FileCheck2,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { ProcessingStageId } from '../../types/prescription';

interface ProcessingStagesTimelineProps {
  currentStage: ProcessingStageId | null;
  isProcessing: boolean;
  isFailed?: boolean;
}

interface StageMeta {
  id: ProcessingStageId;
  label: string;
  subtext: string;
  icon: React.ElementType;
}

const STAGES: StageMeta[] = [
  {
    id: 'uploading',
    label: 'Uploading Documents',
    subtext: 'Multipart form payload packaging',
    icon: UploadCloud,
  },
  {
    id: 'extracting',
    label: 'Extracting Prescription Data',
    subtext: 'OCR parsing & entity recognition',
    icon: FileSearch,
  },
  {
    id: 'identifying',
    label: 'Identifying Medicines',
    subtext: 'Dosage, route, frequency & duration',
    icon: Pill,
  },
  {
    id: 'comparing',
    label: 'Comparing Against H4 Dataset',
    subtext: 'Cross-checking DDI, allergies & renal safety',
    icon: ShieldAlert,
  },
  {
    id: 'generating',
    label: 'Generating Safety Report',
    subtext: 'Clinical decision dossier compilation',
    icon: FileCheck2,
  },
];

export const ProcessingStagesTimeline: React.FC<ProcessingStagesTimelineProps> = ({
  currentStage,
  isProcessing,
  isFailed = false,
}) => {
  const getStageIndex = (stageId: ProcessingStageId | null): number => {
    if (!stageId) return -1;
    return STAGES.findIndex((s) => s.id === stageId);
  };

  const currentIndex = getStageIndex(currentStage);

  const calculateProgressPercent = (): number => {
    if (!isProcessing && currentIndex === -1) return 0;
    if (currentIndex === -1) return 10;
    if (currentIndex === 0) return 20;
    if (currentIndex === 1) return 40;
    if (currentIndex === 2) return 60;
    if (currentIndex === 3) return 80;
    return 100;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#17324D] flex items-center gap-2">
            <span>Prescription Safety Engine Pipeline</span>
            {isProcessing && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Active Processing
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Multi-stage validation pipeline communicating with backend H4 clinical interaction engine.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 font-semibold self-end sm:self-auto">
          {calculateProgressPercent()}% Completed
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className={`h-full transition-all duration-500 ${
            isFailed
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-[#17324D] via-[#168C83] to-emerald-500'
          }`}
          style={{ width: `${calculateProgressPercent()}%` }}
        />
      </div>

      {/* Stages Grid / Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
        {STAGES.map((stage, idx) => {
          const isDone = currentIndex > idx;
          const isActive = currentIndex === idx && isProcessing;
          const isCurrentFailed = currentIndex === idx && isFailed;
          const isPending = currentIndex < idx;

          const IconComponent = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-blue-400 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : isCurrentFailed
                  ? 'border-rose-300 bg-rose-50/60'
                  : 'border-slate-200 bg-slate-50/40 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-[#17324D] text-white animate-pulse'
                      : isCurrentFailed
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentFailed ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  Step {idx + 1}/5
                </span>
              </div>

              <div>
                <h4
                  className={`text-xs font-bold leading-tight mb-0.5 ${
                    isActive
                      ? 'text-[#17324D]'
                      : isDone
                      ? 'text-emerald-900'
                      : isCurrentFailed
                      ? 'text-rose-900'
                      : 'text-slate-700'
                  }`}
                >
                  {stage.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {stage.subtext}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1 text-[10px] font-medium">
                {isDone && (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
                {isActive && (
                  <span className="text-blue-700 flex items-center gap-1 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" /> In Progress...
                  </span>
                )}
                {isCurrentFailed && (
                  <span className="text-rose-700 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" /> Awaiting Engine
                  </span>
                )}
                {isPending && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Queued
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
