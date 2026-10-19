"use client";

import { useState } from "react";
import { signup, verifyOtpAction, resendOtpAction } from "@/app/signup/actions";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SignUpForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signup, undefined);

  // State untuk verifikasi OTP
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const registeredEmail = state?.email || "";

  // Handler saat user submit kode OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Kode OTP harus terdiri dari 6 digit angka.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    const res = await verifyOtpAction(registeredEmail, otp);
    setIsVerifying(false);

    if (!res.success) {
      setOtpError(res.message);
      return;
    }

    setOtpSuccess("Email berhasil diverifikasi! Mengalihkan ke halaman login...");
    setTimeout(() => {
      router.push("/login?verified=true");
    }, 1500);
  };

  // Handler saat user meminta kirim ulang kode OTP
  const handleResendOtp = async () => {
    setIsResending(true);
    setResendMessage(null);
    setOtpError(null);

    const res = await resendOtpAction(registeredEmail);
    setIsResending(false);
    setResendMessage(res.message);
  };

  // -------------------------------------------------------------
  // TAMPILAN LANGKAH 2: INPUT KODE OTP 6-DIGIT
  // -------------------------------------------------------------
  if (state?.step === "verify_otp") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Verifikasi Email Anda</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Kode OTP 6 digit telah dikirimkan ke:
          </p>
          <p className="text-xs font-semibold text-foreground mt-0.5">
            {registeredEmail}
          </p>
        </div>

        {/* Pesan Sukses Verifikasi */}
        {otpSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{otpSuccess}</span>
          </div>
        )}

        {/* Pesan Error OTP */}
        {otpError && (
          <p className="text-xs text-red-500 text-center font-medium bg-red-500/10 p-2 rounded-md border border-red-500/20">
            {otpError}
          </p>
        )}

        {/* Notifikasi Kirim Ulang */}
        {resendMessage && (
          <p className="text-xs text-blue-500 text-center font-medium bg-blue-500/10 p-2 rounded-md">
            {resendMessage}
          </p>
        )}

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 mt-1">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp" className="text-xs font-medium text-center text-muted-foreground">
              Masukkan 6 Digit Kode OTP
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
              className="border border-border rounded-lg px-3 py-2.5 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary bg-background font-bold shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || otp.length !== 6 || !!otpSuccess}
            className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Verifikasi Akun</span>
            )}
          </button>
        </form>

        {/* Kirim Ulang & Kembali */}
        <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || !!otpSuccess}
            className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
            <span>Kirim Ulang Kode OTP</span>
          </button>

          <Link
            href="/signup"
            className="text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Ganti Email / Daftar Ulang</span>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TAMPILAN LANGKAH 1: FORM REGISTRASI NAMA, EMAIL & PASSWORD
  // -------------------------------------------------------------
  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4 p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Daftar Akun Baru</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Lengkapi data berikut untuk membuat akun
        </p>
      </div>

      {state?.message && (
        <p className="text-sm text-red-500 text-center">{state.message}</p>
      )}

      {/* Input Nama Lengkap */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nama Lengkap
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Nama Lengkap Anda"
          required
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Input Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email Anda"
          required
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Input Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Minimal 8 karakter"
          required
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending ? "Mendaftarkan Akun..." : "Daftar"}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-1">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
