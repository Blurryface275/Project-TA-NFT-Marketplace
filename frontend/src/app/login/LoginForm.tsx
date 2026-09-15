"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "./actions";
import Link from "next/link";

export function LoginForm() {
  // Hook React 19 untuk mengelola state return dari Server Action
  // hook adalah fitur react yang memungkinkan kita untuk menambahkan fungsionalitas pada komponen tanpa harus membuat komponen baru
  // useActionState adalah sebuah hook yang memungkinkan kita untuk mengelola state return dari Server Action
  // useActionState menerima dua parameter: 
  // 1. Server Action yang akan dieksekusi -> function login dari actions.ts
  // 2. State awal (opsional) -> karena tidak ada state awal maka undefined
  const [state, loginAction] = useActionState(login, undefined);

  return (
    <form
      action={loginAction} // loginAction disini akan menerima form data yang dikirim oleh <form> tag
      className="flex w-full max-w-sm flex-col gap-4 p-6 bg-card border rounded-xl shadow-sm"
    >
      <h2 className="text-xl font-bold text-center">Login Akun</h2>

      {/* Pesan error umum (jika ada) */}
      {state?.message && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
          {state.message}
        </div>
      )}

      {/* Input Email */}
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

      {/* Input Password */}
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
          <p className="text-xs text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Tombol Submit dengan Status Pending */}
      <SubmitButton />

      {/* Navigasi ke Sign Up */}
      <p className="text-center text-xs text-muted-foreground mt-1">
        Belum punya akun?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}

// Komponen tombol submit yang otomatis mendeteksi status loading form
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
    >
      {pending ? "Memproses..." : "Masuk"}
    </button>
  );
}
