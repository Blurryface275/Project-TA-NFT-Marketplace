"use client";

import { signup } from "@/app/signup/actions";
import { useActionState } from "react";
import Link from "next/link";

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4 p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Daftar Akun Baru</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Lengkapi data berikut untuk membuat akun
        </p>
      </div>

      {/* Pesan Error Global (jika ada) */}
      {state?.message && (
        <p className="text-sm text-red-500 text-center">
          {state.message}
        </p>
      )}

      {/* 1. Input Nama Lengkap */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nama Lengkap
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Nama Lengkap Anda"
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      {/* 2. Input Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

      {/* 3. Input Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Minimal 8 karakter"
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.password && (
          <div className="text-xs text-red-500 mt-1">
            <p className="font-semibold">Password harus memenuhi:</p>
            <ul className="list-disc pl-4 space-y-0.5 mt-1">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tombol Submit */}
      <button
        disabled={pending}
        type="submit"
        className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending ? "Memproses..." : "Daftar Akun"}
      </button>

      {/* Navigasi kembali ke Login */}
      <p className="text-center text-xs text-muted-foreground mt-1">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
