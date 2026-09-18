"use client";

import { signup } from "@/app/signup/actions";
import { useActionState, useState } from "react";
import { registerPasskey } from "@/lib/passkey"; // untuk feature webauthn
import Link from "next/link";
import { startTransition } from "react";

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signup, undefined); // state untuk menyimpan hasil dari action
  const [passkeyStatus, setPasskeyStatus] = useState<string>("");
  const [isProcessingPasskey, setIsProcessingPasskey] = useState(false);

  // Handler submit: Picu biometrik terlebih dulu sblm kirim ke Server Action
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form); // buat object formData baru (kosongan)
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !name || !password) {
      alert("Harap masukkan email, nama dan/atau password terlebih dahulu!");
      return;
    }

    try {
      setIsProcessingPasskey(true);
      // setPasskeyStatus ini akan ditampikan di UI bawah input email
      setPasskeyStatus("Menunggu sensor biometrik..");

      // Panggil webAuthn di browser
      const passkey = await registerPasskey(email);

      setPasskeyStatus("Biometrik berhasil! Menyimpan akun...");

      // masukkan pubX, pubY, credential ID, dan walletAddress ke form datanya
      formData.set("pubX", passkey.pubX);
      formData.set("pubY", passkey.pubY);
      formData.set("credentialId", passkey.credentialId);
      formData.set("walletAddress", passkey.walletAddress);

      // Kirim ke Server Action
      action(formData);
    } catch (err: any) {
      console.error("Gagal registrasi Passkey:", err);
      setPasskeyStatus("Gagal: " + (err.message || err));
    } finally {
      setIsProcessingPasskey(false);
    }
  };

  const isBusy = pending || isProcessingPasskey;

  return (
    <form
      onSubmit={handleSubmit}
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
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Status Interaksi Biometrik */}
      {passkeyStatus && (
        <p className="text-xs text-center text-blue-600 font-medium animate-pulse">
          {passkeyStatus}
        </p>
      )}

      {/* 4. Tombol Registrasi Biometrik (Muncul sebelum submit) */}
      <button
        type="submit"
        disabled={isBusy}
        className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isBusy
          ? "Membuka sensor biometrik..."
          : "Daftar dengan Biometrik (Passkey)"}
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
