import { useState, type FormEvent } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Stethoscope,
  Info,
  X,
  ArrowRight,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { DEMO_CREDENTIALS, type AuthUser } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [idOrEmail, setIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedInput = idOrEmail.trim();
    const trimmedPass = password.trim();

    // Validation 1: Required fields
    if (!trimmedInput && !trimmedPass) {
      setErrorMessage('Please enter your Doctor / Clinic ID or Email, and your password.');
      return;
    }
    if (!trimmedInput) {
      setErrorMessage('Please enter your Doctor / Clinic ID or Email address.');
      return;
    }
    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    // Simulate brief authentication verification
    setTimeout(() => {
      // Find matching credential (case-insensitive for email/id, exact for password)
      const matched = DEMO_CREDENTIALS.find(
        (cred) =>
          (cred.idOrEmail.toLowerCase() === trimmedInput.toLowerCase() ||
            cred.user.id.toLowerCase() === trimmedInput.toLowerCase() ||
            cred.user.email.toLowerCase() === trimmedInput.toLowerCase()) &&
          cred.password === trimmedPass
      );

      if (matched) {
        if (rememberMe) {
          try {
            localStorage.setItem('medguard_remember_email', trimmedInput);
          } catch {
            // Ignore storage errors in restricted contexts
          }
        } else {
          try {
            localStorage.removeItem('medguard_remember_email');
          } catch {
            // Ignore
          }
        }
        onLoginSuccess(matched.user);
      } else {
        setErrorMessage(
          'Invalid Doctor ID/Email or password. Please verify your credentials or use the demonstration accounts listed below.'
        );
        setIsSubmitting(false);
      }
    }, 350);
  };

  const handleFillDemo = (type: 'Doctor' | 'Pharmacist' | 'Clinic') => {
    const cred = DEMO_CREDENTIALS.find((c) => c.accountType === type);
    if (cred) {
      setIdOrEmail(cred.idOrEmail);
      setPassword(cred.password);
      setErrorMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F6F8] via-[#eaf0f6] to-[#dbeafe] flex flex-col justify-between text-[#17324D] antialiased p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#168C83] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#17324D]">MedGuard</span>
            <span className="text-[10px] text-slate-500 block leading-none">Clinical Safety</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-xs hidden sm:inline-block">
            CDS Engine v2.4 Active
          </span>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="w-full max-w-4xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Left Column: Hospital CDS Branding & Mission (Desktop/Tablet) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#17324D] via-[#1b3b5b] to-[#168C83] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background ambient glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-[#168C83]/30 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">MedGuard</h2>
                <p className="text-xs text-slate-300">Medication Safety Platform</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-white leading-snug">
                Clinical Decision Support for Hospital Patient Safety
              </h3>
              <p className="text-xs text-slate-200/90 leading-relaxed">
                Automated multi-layer verification for drug-drug interactions, duplicate therapies, allergy contraindications, and renal dosing limits.
              </p>
            </div>

            {/* Safety Badges */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time prescription contraindication detection</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Renal clearance monitoring with eGFR thresholding</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pharmacovigilance audit logs and PDF dossiers</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Notice */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/15 text-[11px] text-slate-300 flex items-center justify-between">
            <span>St. Jude Metropolitan Medical Center</span>
            <span className="font-mono text-[10px] text-emerald-300">Protected CDS</span>
          </div>
        </div>

        {/* Right Column: Controlled Sign-In Form */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            {/* Welcoming Heading & Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#17324D] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to access your MedGuard clinical workspace.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Doctor / Clinic ID or Email */}
              <div>
                <label
                  htmlFor="doctor-id-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Doctor / Clinic ID or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="doctor-id-input"
                    type="text"
                    value={idOrEmail}
                    onChange={(e) => {
                      setIdOrEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. dr.vance@medguard.org or DOC-8021"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#17324D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field 2 & 3: Password with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Password
                  </label>
                  {/* Field 5: Forgot Password link */}
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your clinical password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#17324D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    autoComplete="current-password"
                  />
                  {/* Show/Hide password toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Field 4: Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember Me on this workstation</span>
                </label>
              </div>

              {/* Field 6: Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Demonstration Credentials Callout Card (Task 2) */}
            <div className="mt-6 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                  <span>Demonstration Credentials (Click to Auto-fill)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  Demo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Doctor Credential Pill */}
                <button
                  type="button"
                  onClick={() => handleFillDemo('Doctor')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-blue-200 rounded-lg text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#17324D] group-hover:text-blue-700">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dr. Christopher Vance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    dr.vance@medguard.org
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Password: <span className="text-slate-600">MedGuard@2026!</span>
                  </p>
                </button>

                {/* Pharmacist Credential Pill */}
                <button
                  type="button"
                  onClick={() => handleFillDemo('Pharmacist')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-blue-200 rounded-lg text-left transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#17324D] group-hover:text-blue-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pharm. Rajesh Sharma</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    pharm.sharma@medguard.org
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Password: <span className="text-slate-600">MedGuard@2026!</span>
                  </p>
                </button>

                {/* Clinic Administrator Credential Pill */}
                <button
                  type="button"
                  onClick={() => handleFillDemo('Clinic')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-blue-200 rounded-lg text-left transition-all shadow-2xs group cursor-pointer col-span-1 sm:col-span-2"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#17324D] group-hover:text-blue-700">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>St. Jude Metropolitan Clinic (Clinic Administrator)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    clinic.admin@medguard.org
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Password: <span className="text-slate-600">MedGuard@2026!</span>
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Small Footer (Task 1) */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              MedGuard – Medication Safety Platform
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Demonstration Modal (Task 5) */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17324D]">
                    Password Recovery Information
                  </h3>
                  <p className="text-[11px] text-slate-400">Clinical Identity Notice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Demonstration Mode Active</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Automated clinical password recovery and hospital Active Directory / OAuth2 synchronization will be activated after backend authentication service integration.
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                For this frontend demonstration, please use the provided demonstration credentials:
                <br />
                <strong className="text-slate-900 font-mono">dr.vance@medguard.org</strong> or{' '}
                <strong className="text-slate-900 font-mono">pharm.sharma@medguard.org</strong> with password{' '}
                <strong className="text-slate-900 font-mono">MedGuard@2026!</strong>.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  handleFillDemo('Doctor');
                }}
                className="px-4 py-2 bg-[#17324D] hover:bg-[#12273D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Auto-fill Doctor Demo Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Legal / Environment Subtext */}
      <div className="w-full max-w-6xl mx-auto py-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1">
        <span>© 2026 MedGuard Clinical Systems. All rights reserved.</span>
        <span>Healthcare Track H4 • Medication Safety Verification</span>
      </div>
    </div>
  );
};

export default LoginPage;
