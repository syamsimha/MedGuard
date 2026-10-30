import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FolderOpen,
  FileText,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import type { PrescriptionUploadFile } from '../../types/prescription';

interface PrescriptionUploadZoneProps {
  files: PrescriptionUploadFile[];
  onFilesChange: (files: PrescriptionUploadFile[]) => void;
  onPreviewFile: (file: PrescriptionUploadFile) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

export const PrescriptionUploadZone: React.FC<PrescriptionUploadZoneProps> = ({
  files,
  onFilesChange,
  onPreviewFile,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clean up object URLs when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) {
          try {
            URL.revokeObjectURL(f.previewUrl);
          } catch {
            // Ignore revoke errors
          }
        }
      });
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setValidationError(null);
    const newUploads: PrescriptionUploadFile[] = [];
    const errorMessages: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      // 1. Check if PDF (mime type or .pdf extension)
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        errorMessages.push(`"${file.name}" is not a PDF file. Only PDF files (application/pdf) are accepted.`);
        return;
      }

      // 2. Check 0-byte empty file
      if (file.size === 0) {
        errorMessages.push(`"${file.name}" is an empty 0-byte file and cannot be processed.`);
        return;
      }

      // 3. Check max file size limit (10MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errorMessages.push(
          `"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size of 10 MB.`
        );
        return;
      }

      // 4. Prevent duplicate selection of the same file unintentionally (Task 3)
      const alreadyExists = files.some(
        (existing) => existing.name === file.name && existing.size === file.size
      );
      if (alreadyExists) {
        errorMessages.push(`"${file.name}" has already been selected.`);
        return;
      }

      // Generate object URL for in-memory preview
      const previewUrl = URL.createObjectURL(file);
      newUploads.push({
        id: `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        previewUrl,
      });
    });

    if (errorMessages.length > 0) {
      setValidationError(errorMessages.join(' '));
    }

    if (newUploads.length > 0) {
      onFilesChange([...files, ...newUploads]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    // Reset file input value so same file can be re-selected if removed and re-added
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (idToRemove: string) => {
    const fileToRemove = files.find((f) => f.id === idToRemove);
    if (fileToRemove?.previewUrl) {
      try {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      } catch {
        // Safe ignore
      }
    }
    onFilesChange(files.filter((f) => f.id !== idToRemove));
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div id="upload-prescriptions-section" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with Exact Task 2 Required Heading and Supporting Text */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#168C83] text-white flex items-center justify-center shadow-xs shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#17324D] tracking-tight">
              Upload Existing Prescriptions
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Upload one or more existing prescriptions to extract medications and perform medication safety analysis.
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium self-end sm:self-auto shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{files.length} {files.length === 1 ? 'PDF' : 'PDFs'} Attached ({formatFileSize(totalBytes)})</span>
            </span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">PDF Validation Error</span>
              <p className="leading-relaxed">{validationError}</p>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
              title="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Large Drag and Drop Upload Area (Task 2) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer relative ${
            isDragging
              ? 'border-[#168C83] bg-teal-50/70 scale-[1.008] shadow-md ring-4 ring-teal-100'
              : 'border-slate-300 hover:border-[#168C83] bg-slate-50/60 hover:bg-teal-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            disabled={disabled}
            onChange={handleFileInputChange}
            className="hidden"
            id="prescription-pdf-input"
          />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 text-[#17324D] flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8 text-[#168C83]" />
          </div>

          <h3 className="text-base font-bold text-[#17324D] mb-1.5">
            Drag & Drop Prescription PDF Files Here
          </h3>

          <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4 leading-relaxed">
            Upload single or multiple prescription documents. The safety engine will parse active medication entities, dosages, and schedules for H4 dataset screening.
          </p>

          {/* Visible Browse PDF Files Button (Task 2 & 4 requirement) */}
          <div className="mb-4">
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#17324D] hover:bg-[#12273D] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>Browse PDF Files</span>
            </button>
          </div>

          {/* Clear Accepted Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 max-w-md mx-auto">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Accepted: application/pdf only</span>
            </span>
            <span>•</span>
            <span>Max 10 MB per file</span>
            <span>•</span>
            <span>Multiple files supported</span>
          </div>
        </div>

        {/* Uploaded File Display (Task 3) */}
        {files.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Selected Prescription Documents ({files.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Total size: <strong>{formatFileSize(totalBytes)}</strong>
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white shadow-2xs">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    {/* PDF Icon (Task 3) */}
                    <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        {/* PDF Filename (Task 3) */}
                        <span className="text-xs font-bold text-[#17324D] truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        {/* File Size (Task 3) */}
                        <span className="font-semibold text-slate-700">{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Added at {file.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {/* Upload Status (Task 3) */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ready for Analysis</span>
                    </span>

                    {/* Preview Option (Task 3) */}
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#17324D] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Preview</span>
                    </button>

                    {/* Remove File Option (Task 3) */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action to add more files */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#168C83] hover:text-[#12726b] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>+ Add another PDF document</span>
              </button>
              <span className="text-[11px] text-slate-400">
                You can select multiple files at once in the file browser
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
