import { useEffect } from 'react';
import { X, Download, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import type { PrescriptionUploadFile } from '../../types/prescription';

interface PdfPreviewModalProps {
  uploadFile: PrescriptionUploadFile | null;
  onClose: () => void;
}

export const PdfPreviewModal = ({ uploadFile, onClose }: PdfPreviewModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!uploadFile) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#17324D] text-white flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{uploadFile.name}</h3>
              <p className="text-[11px] text-slate-300">
                Size: {formatFileSize(uploadFile.size)} • Uploaded: {uploadFile.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={uploadFile.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors text-xs flex items-center gap-1 px-2.5"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
            <a
              href={uploadFile.previewUrl}
              download={uploadFile.name}
              className="p-1.5 rounded-lg bg-[#168C83] hover:bg-[#12726b] text-white transition-colors text-xs flex items-center gap-1 px-2.5"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 bg-slate-100 min-h-[500px] overflow-hidden relative flex flex-col">
          <object
            data={uploadFile.previewUrl}
            type="application/pdf"
            className="w-full flex-1 min-h-[550px] border-0"
          >
            {/* Fallback for browsers without inline PDF object support */}
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
              <h4 className="text-base font-bold text-[#17324D] mb-1">
                Inline PDF Preview Unavailable
              </h4>
              <p className="text-xs text-slate-600 max-w-md mb-4">
                Your browser may not support inline rendering of blob-backed PDF documents. You can still open the prescription PDF directly in a new tab or download it.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={uploadFile.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#17324D] text-white text-xs font-semibold rounded-lg hover:bg-[#12273d] transition-colors"
                >
                  Open in New Window
                </a>
                <a
                  href={uploadFile.previewUrl}
                  download={uploadFile.name}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Download File
                </a>
              </div>
            </div>
          </object>
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Client-side secure preview • File binary is held in memory and never stored in localStorage</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
};
