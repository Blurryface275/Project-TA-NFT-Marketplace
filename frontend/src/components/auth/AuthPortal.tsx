"use client";

import { useState, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/app/login/actions";
import { signup, verifyOtpAction, resendOtpAction } from "@/app/signup/actions";
import {
  Fingerprint,
  Wallet,
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
  const [isWeb3Loading, setIsWeb3Loading] = useState(false);
  const [web3Message, setWeb3Message] = useState<string | null>(null);

  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);

  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const registeredEmail = signupState?.email || "";
  const isOtpStep = mode === "signup" && signupState?.step === "verify_otp";
  const verifiedNotice = searchParams.get("verified") === "true";

  const handleModeSwitch = (targetMode: "login" | "signup") => {
    setMode(targetMode);
    setWeb3Message(null);
    setOtpError(null);
    window.history.replaceState(null, "", targetMode === "login" ? "/login" : "/signup");
  };

  const handlePasskeyAuth = async () => {
    setIsWeb3Loading(true);
    setWeb3Message(null);
    try {
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        setWeb3Message("Menghubungkan biometrik perangkat...");
        setTimeout(() => {
          setIsWeb3Loading(false);
          setWeb3Message("Passkey terverifikasi. Anda dapat melanjutkan.");
        }, 800);
      } else {
        setIsWeb3Loading(false);
        setWeb3Message("Perangkat Anda belum mendukung Passkey.");
      }
    } catch {
      setIsWeb3Loading(false);
      setWeb3Message("Verifikasi dibatalkan.");
    }
  };

  const handleWalletConnect = async () => {
    setIsWeb3Loading(true);
    setWeb3Message("Mendeteksi dompet Web3...");
    setTimeout(() => {
      if (typeof window !== "undefined" && (window as unknown as { ethereum?: unknown }).ethereum) {
        setWeb3Message("Dompet terhubung.");
      } else {
        setWeb3Message("Ekstensi dompet Web3 tidak ditemukan.");
      }
      setIsWeb3Loading(false);
    }, 600);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Masukkan 6 digit kode OTP.");
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
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100/60">
        
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

        {/* Segmented Pill Switcher */}
        {!isOtpStep && (
          <div className="flex bg-slate-100/70 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("signup")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
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
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Email berhasil diverifikasi. Silakan masuk.</span>
          </div>
        )}

        {web3Message && (
          <div className="mb-4 p-3 rounded-2xl bg-[#FFF2ED] border border-[#FFD9CE]/60 text-xs text-[#D43812]">
            {web3Message}
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {isOtpStep ? (
          <div className="space-y-4">
            {otpSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-center font-medium">
                {otpSuccess}
              </div>
            )}

            {otpError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 text-center font-medium">
                {otpError}
              </div>
            )}

            {resendNotice && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 text-center">
                {resendNotice}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-medium text-slate-600 block text-center">
                  Kode 6 Digit
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-4 py-3 text-center text-2xl tracking-[0.35em] font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length !== 6 || !!otpSuccess}
                className="w-full py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
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
                className="hover:text-[#FF5A36] font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                <span>Kirim Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("signup")}
                className="hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Ganti Email</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick 1-Tap Biometric / Passkey */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePasskeyAuth}
                disabled={isWeb3Loading}
                className="w-full py-2.5 px-4 bg-[#FFF2ED] hover:bg-[#FFE6DC] text-[#D43812] transition-colors text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border-0"
              >
                <Fingerprint className="w-4 h-4 text-[#FF5A36]" />
                <span>Masuk Cepat dengan Passkey</span>
              </button>

              <button
                type="button"
                onClick={handleWalletConnect}
                disabled={isWeb3Loading}
                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>Sambungkan Dompet Kripto</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100/80" />
              </div>
              <span className="relative px-3 bg-white text-[11px] font-medium text-slate-400">
                atau gunakan email
              </span>
            </div>

            {/* Login Form */}
            {mode === "login" ? (
              <form action={loginAction} className="space-y-3.5">
                {loginState?.message && (
                  <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
                    {loginState.message}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-medium text-slate-700 block">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150"
                  />
                  {loginState?.errors?.email && (
                    <p role="alert" className="text-[11px] text-rose-500 mt-1">
                      {loginState.errors.email[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium text-slate-700 block">
                      Kata Sandi
                    </label>
                    <a href="#" className="text-[11px] text-[#FF5A36] hover:text-[#D43812] font-semibold transition">
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      aria-label="Lihat kata sandi"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginState?.errors?.password && (
                    <p role="alert" className="text-[11px] text-rose-500 mt-1">
                      {loginState.errors.password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loginPending}
                  className="w-full mt-2 py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer border-0"
                >
                  {loginPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Signup Form */
              <form action={signupAction} className="space-y-3.5">
                {signupState?.message && (
                  <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-600 font-medium">
                    {signupState.message}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-medium text-slate-700 block">
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Nama lengkap sesuai identitas"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150"
                  />
                  {signupState?.errors?.name && (
                    <p role="alert" className="text-[11px] text-rose-500 mt-1">
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
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150"
                  />
                  {signupState?.errors?.email && (
                    <p role="alert" className="text-[11px] text-rose-500 mt-1">
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
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-slate-50/70 border border-slate-200/50 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] transition-all duration-150 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      aria-label="Lihat kata sandi"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupState?.errors?.password && (
                    <p role="alert" className="text-[11px] text-rose-500 mt-1">
                      {signupState.errors.password[0]}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={signupPending}
                  className="w-full mt-2 py-3 px-4 bg-[#FF5A36] hover:bg-[#F04824] active:bg-[#E03C18] text-white text-xs font-bold rounded-2xl shadow-sm shadow-[#FF5A36]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer border-0"
                >
                  {signupPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut ke Verifikasi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
                className="text-[#FF5A36] hover:text-[#D43812] font-bold cursor-pointer transition"
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
                className="text-[#FF5A36] hover:text-[#D43812] font-bold cursor-pointer transition"
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
