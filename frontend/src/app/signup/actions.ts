"use server";

import { SignUpFormSchema, FormState } from "@/lib/definitions";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signup(state: FormState, formData: FormData) {
  // 1. Validasi field form menggunakan Zod schema
  const validatedFields = SignUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Jika validasi form gagal, kembalikan pesan error ke UI
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Input gagal. Periksa kembali data pendaftaran Anda.",
    };
  }

  const { name, email, password } = validatedFields.data;

  console.log("============================================");
  console.log("🚀 [Signup Action] Registrasi Akun Baru (Progressive Onboarding)");
  console.log("Nama :", name);
  console.log("Email:", email);
  console.log("Status Dompet: Ditangguhkan (Aktivasi saat beli tiket)");
  console.log("============================================");

  let response;
  try {
    // 2. Kirim data registrasi Web2 (nama, email, password) ke Backend NestJS
    response = await fetch(`${process.env.BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
  } catch (error) {
    console.error("❌ [Signup Action] Gagal terhubung ke backend:", error);
    return {
      message: "Gagal terhubung ke server backend. Pastikan server backend berjalan.",
    };
  }

  const resData = await response.json();

  // 3. Jika backend menolak (misal: Email sudah pernah terdaftar)
  if (!response.ok) {
    return {
      message: resData.message || "Registrasi gagal.",
    };
  }

  // 4. Simpan session cookie pengguna (walletAddress bernilai null sebelum diaktivasi)
  await createSession(
    resData.id.toString(),
    resData.name,
    resData.walletAddress || null,
    resData.email || email,
  );

  // 5. Arahkan pengguna ke dashboard utama
  redirect("/dashboard");
}
