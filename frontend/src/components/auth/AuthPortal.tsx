"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/app/login/actions";
import { signup, verifyOtpAction, resendOtpAction } from "@/app/signup/actions";
import {
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

interface AuthPortalProps {
  initialMode?: "login" | "signup";
}

export default function AuthPortal({ initialMode = "login" }: AuthPortalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);

  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const registeredEmail = signupState?.email || "";
  const isOtpStep = mode === "signup" && signupState?.step === "verify_otp";
  const verifiedNotice = searchParams.get("verified") === "true";

  const handleModeSwitch = (targetMode: "login" | "signup") => {
    startTransition(() => {
      setMode(targetMode);
      setOtpError(null);
      window.history.replaceState(null, "", targetMode === "login" ? "/login" : "/signup");
    });
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Masukkan 6 digit kode verifikasi.");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError(null);
    const res = await verifyOtpAction(registeredEmail, otp);
    setIsVerifyingOtp(false);

    if (!res.success) {
      setOtpError(res.message);
      return;
    }

    setOtpSuccess("Email terverifikasi. Mengalihkan ke login...");
    setTimeout(() => {
      setMode("login");
      router.push("/login?verified=true");
    }, 1200);
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setResendNotice(null);
    setOtpError(null);
    const res = await resendOtpAction(registeredEmail);
    setIsResending(false);
    setResendNotice(res.message);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-slate-800 flex items-center justify-center p-4 font-sans antialiased selection:bg-[#FF5A36]/15 selection:text-[#FF5A36]">
      {/* Centered Main Card */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100/60 transition-all">
        
        {/* Title & Subtitle */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isOtpStep
              ? "Verifikasi Email"
              : mode === "login"
              ? "Masuk ke Akun"
              : "Daftar Akun"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isOtpStep
              ? `Kode dikirim ke ${registeredEmail}`
              : mode === "login"
              ? "Silakan masuk untuk mengakses tiket pesananmu"
              : "Buat akun baru untuk mulai memesan tiket"}
          </p>
        </div>

        {/* Accessible Segmented Pill Switcher */}
        {!isOtpStep && (
          <div
            role="tablist"
            aria-label="Pilihan Autentikasi"
            className="flex bg-slate-100/70 p-1 rounded-2xl mb-6"
          >
            <button
              role="tab"
              id="tab-login"
              aria-selected={mode === "login"}
              aria-controls="panel-login"
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer min-h-[38px] ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Masuk
            </button>
            <button
              role="tab"
              id="tab-signup"
              aria-selected={mode === "signup"}
              aria-controls="panel-signup"
              type="button"
              onClick={() => handleModeSwitch("signup")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer min-h-[38px] ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Daftar
            </button>
          </div>
        )}

        {/* Verification Notification */}
        {verifiedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Email berhasil diverifikasi. Silakan masuk.</span>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {isOtpStep ? (
          <div className="space-y-4">
            {otpSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-center font-medium"
              >
                {otpSuccess}
              </div>
            )}

            {otpError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 text-center font-medium"
              >
                {otpError}
              </div>
            )}

            {resendNotice && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 text-center"
              >
                {resendNotice}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="otp"
                  className="text-xs font-medium text-slate-600 block text-center"
                >
                  Kode 6 Digit
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  autoFocus
                  aria-required="true"
                  aria-invalid={!!otpError}
                  className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.35em] font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all min-h-[52px]"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length !== 6 || !!otpSuccess}
                className="w-full py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer border-0 min-h-[46px]"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Memverifikasi...</span>
                    <span className="sr-only">Sedang memverifikasi kode</span>
                  </>
                ) : (
                  <span>Verifikasi Akun</span>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || !!otpSuccess}
                className="hover:text-[#FF5A36] font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-40 min-h-[36px]"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>Kirim Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("signup")}
                className="hover:text-slate-800 transition flex items-center gap-1 cursor-pointer min-h-[36px]"
              >
                <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                <span>Ganti Email</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Login Form */}
            {mode === "login" ? (
              <form
                id="panel-login"
                role="tabpanel"
                aria-labelledby="tab-login"
                action={loginAction}
                className="space-y-3.5"
                noValidate
              >
                {loginState?.message && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium"
                  >
                    {loginState.message}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="login-email" className="text-xs font-medium text-slate-700 block">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    aria-required="true"
                    aria-invalid={!!loginState?.errors?.email}
                    aria-describedby={loginState?.errors?.email ? "login-email-error" : undefined}
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 min-h-[44px]"
                  />
                  {loginState?.errors?.email && (
                    <p id="login-email-error" role="alert" className="text-[11px] text-rose-500 mt-1">
                      {loginState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-medium text-slate-700 block">
                      Kata Sandi
                    </label>
                    <a
                      href="#"
                      className="text-[11px] text-[#FF5A36] hover:text-[#D43812] font-semibold transition"
                    >
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={!!loginState?.errors?.password}
                      aria-describedby={loginState?.errors?.password ? "login-password-error" : undefined}
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 pr-10 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {loginState?.errors?.password && (
                    <p id="login-password-error" role="alert" className="text-[11px] text-rose-500 mt-1">
                      {loginState.errors.password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loginPending}
                  className="w-full mt-2 py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 min-h-[46px]"
                >
                  {loginPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Memproses...</span>
                      <span className="sr-only">Sedang memproses masuk</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form
                id="panel-signup"
                role="tabpanel"
                aria-labelledby="tab-signup"
                action={signupAction}
                className="space-y-3.5"
                noValidate
              >
                {signupState?.message && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium"
                  >
                    {signupState.message}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="signup-name" className="text-xs font-medium text-slate-700 block">
                    Nama Lengkap
                  </label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={!!signupState?.errors?.name}
                    aria-describedby={signupState?.errors?.name ? "signup-name-error" : undefined}
                    placeholder="Nama lengkap sesuai identitas"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 min-h-[44px]"
                  />
                  {signupState?.errors?.name && (
                    <p id="signup-name-error" role="alert" className="text-[11px] text-rose-500 mt-1">
                      {signupState.errors.name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-email" className="text-xs font-medium text-slate-700 block">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    aria-required="true"
                    aria-invalid={!!signupState?.errors?.email}
                    aria-describedby={signupState?.errors?.email ? "signup-email-error" : undefined}
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 min-h-[44px]"
                  />
                  {signupState?.errors?.email && (
                    <p id="signup-email-error" role="alert" className="text-[11px] text-rose-500 mt-1">
                      {signupState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-password" className="text-xs font-medium text-slate-700 block">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={!!signupState?.errors?.password}
                      aria-describedby={signupState?.errors?.password ? "signup-password-error" : undefined}
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 pr-10 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {signupState?.errors?.password && (
                    <p id="signup-password-error" role="alert" className="text-[11px] text-rose-500 mt-1">
                      {signupState.errors.password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={signupPending}
                  className="w-full mt-2 py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 min-h-[46px]"
                >
                  {signupPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Mendaftarkan...</span>
                      <span className="sr-only">Sedang memproses pendaftaran</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut ke Verifikasi</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer toggle switcher */}
        <div className="mt-6 pt-4 border-t border-slate-100/60 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <p>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => handleModeSwitch("signup")}
                className="text-[#FF5A36] hover:text-[#D43812] font-bold cursor-pointer transition min-h-[32px] inline-flex items-center"
              >
                Daftar di sini
              </button>
            </p>
          ) : (
            <p>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className="text-[#FF5A36] hover:text-[#D43812] font-bold cursor-pointer transition min-h-[32px] inline-flex items-center"
              >
                Masuk di sini
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
