import type { ReactNode } from 'react';
import { ShieldCheck, HeartPulse } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-[#17324D] antialiased">
      {/* Clinical Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#17324D] text-white shadow-md border-b border-[#0D1C2B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* MedGuard Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-[#168C83] text-white p-2 rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xl tracking-tight text-white">MedGuard</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-[#168C83]/30 text-[#E6F4F3] border border-[#168C83]/50">
                    Phase 1 Foundation
                  </span>
                </div>
                <p className="text-xs text-slate-300">Hospital Medication Safety Intelligence</p>
              </div>
            </div>

            {/* System Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs bg-[#0D1C2B]/60 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-slate-200">Frontend Environment Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Hospital System Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-4 h-4 text-[#168C83]" />
            <span>MedGuard Clinical Decision Support & Medication Safety</span>
          </div>
          <div>
            <span>Phase 1: Frontend Foundation • Decoupled Clinical Client</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
