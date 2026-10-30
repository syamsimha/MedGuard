import {
  ShieldCheck,
  CheckCircle2,
  FolderTree,
  Palette,
  Layers,
  Info
} from 'lucide-react';

export const WelcomePage = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <section className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#17324D] via-[#1a3d60] to-[#168C83] p-8 sm:p-10 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium text-white mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E6F4F3]" />
              <span>Hospital Medication Safety System</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Welcome to <span className="text-[#E6F4F3]">MedGuard</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 font-medium italic mb-2">
              &ldquo;Every Prescription Deserves a Second Look.&rdquo;
            </p>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
              MedGuard is a clinical decision support application engineered to prevent adverse drug events,
              uncover contraindicated interactions, and verify dosing safety for hospital patient care.
            </p>
          </div>
        </div>

        {/* Phase 1 Foundation Status Bar */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-semibold text-[#17324D]">
              Phase 1 Status: Frontend Foundation Initialized
            </span>
          </div>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md font-medium">
            Assigned Directory: FULL_CODE/web/
          </span>
        </div>
      </section>

      {/* Foundation Architecture Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Core Technologies */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#17324D] mb-2">Framework & Tooling</h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Standardized on a modern, ultra-fast frontend toolchain configured exclusively within the assigned workspace.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>React 19 Application Shell</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vite 6 Fast HMR & Build System</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Strict Type Checking Enabled</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Clinical Design System */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#E6F4F3] text-[#168C83] flex items-center justify-center mb-4 border border-[#168C83]/20">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#17324D] mb-2">Clinical Design System</h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Engineered specifically for clinical environments using medical blue, navy, and high-contrast white surfaces.
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#17324D] border border-slate-300"></span>
              <span>Deep Navy (<code className="text-[11px]">#17324D</code>) for Headers & Brand</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#168C83] border border-slate-300"></span>
              <span>Clinical Teal (<code className="text-[11px]">#168C83</code>) for Actions</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
              <span>Clean Medical White (<code className="text-[11px]">#FFFFFF</code>) Surfaces</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Modular Directory Layout */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#17324D] flex items-center justify-center mb-4 border border-slate-200">
            <FolderTree className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#17324D] mb-2">Structured Architecture</h2>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Organized according to Phase 1 structural guidelines into modular domains for scalable clinical development.
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-700">
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/components/</span>
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/pages/</span>
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/layouts/</span>
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/services/</span>
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/assets/</span>
            <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200">src/styles/</span>
          </div>
        </div>
      </section>

      {/* Scope Boundaries Notice (Task 5 compliance) */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#17324D] mb-1">
              Phase 1 Scope & Safety Boundaries
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In strict accordance with Phase 1 development requirements, full clinical dashboards, patient management tables,
              medication interaction safety engines, and backend API connections are deferred to Phase 2 and subsequent releases.
              This screen confirms that the frontend application foundation is fully operational.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
