import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Daftar Akun | Antigravity",
  description: "Buat akun baru untuk mulai memesan tiket event impianmu.",
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full bg-[#FAF9F6] text-slate-800 flex items-center justify-center p-4 font-sans antialiased selection:bg-[#FF5A36]/15 selection:text-[#FF5A36]">
      <Suspense
        fallback={
          <div className="w-full max-w-[400px] h-[520px] bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100/60 animate-pulse" />
        }
      >
        <SignUpForm />
      </Suspense>
    </main>
  );
}
