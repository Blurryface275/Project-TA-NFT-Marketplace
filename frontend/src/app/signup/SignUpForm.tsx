"use client";

import { signup } from "@/app/signup/actions";
import { useActionState } from "react";
import Link from "next/link";

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signup, undefined); // state untuk menyimpan hasil dari action

  return (
    <form
      action={action}
      className="flex w-full max-w-sm flex-col gap-4 p-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold">Daftar Akun Baru</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Lengkapi data berikut untuk membuat akun
        </p>
      </div>

      {/* Pesan error global */}
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

      {/* Tombol Submit Standar Web2 */}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending ? "Mendaftarkan Akun..." : "Daftar"}
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
