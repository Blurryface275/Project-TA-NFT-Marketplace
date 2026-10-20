"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "./actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ArrowRight, RefreshCw, Check } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);

  const verifiedNotice = searchParams.get("verified") === "true";
  const defaultEmail = searchParams.get("email") || "";

  return (
    <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100/60 transition-all">
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Masuk ke Akun
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Silakan masuk untuk mengakses tiket pesananmu
        </p>
      </div>

      {/* Segmented Pill Navigation */}
      <div
        role="tablist"
        aria-label="Pilihan Autentikasi"
        className="flex bg-slate-100/70 p-1 rounded-2xl mb-6"
      >
        <span
          role="tab"
          aria-selected={true}
          className="flex-1 py-2 text-xs font-semibold rounded-xl bg-white text-slate-900 shadow-sm text-center min-h-[38px] flex items-center justify-center"
        >
          Masuk
        </span>
        <Link
          href="/signup"
          role="tab"
          aria-selected={false}
          className="flex-1 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 text-center min-h-[38px] flex items-center justify-center transition-all duration-200"
        >
          Daftar
        </Link>
      </div>

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

      {/* Login Form */}
      <form action={loginAction} className="space-y-3.5" noValidate>
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
            defaultValue={defaultEmail}
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
          <PasswordInput
            id="login-password"
            name="password"
            aria-required="true"
            aria-invalid={!!loginState?.errors?.password}
            aria-describedby={loginState?.errors?.password ? "login-password-error" : undefined}
          />
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

      {/* Footer Switcher */}
      <div className="mt-6 pt-4 border-t border-slate-100/60 text-center text-xs text-slate-500">
        <p>
          Belum punya akun?{" "}
          <Link
            href="/signup"
            className="text-[#FF5A36] hover:text-[#D43812] font-bold cursor-pointer transition min-h-[32px] inline-flex items-center"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
