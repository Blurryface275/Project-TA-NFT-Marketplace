"use server";

import { SignUpFormSchema, FormState } from "@/lib/definitions";
import { createSession } from "@/lib/session";
import { register } from "module";
import { redirect } from "next/navigation";

export async function signup(state: FormState, formData: FormData) {
  // Validasi field form menggunakan skema dari definitions.ts
  // safeParse fugnsinya untuk mengecek data apakah sudah valid atau belum
  const validatedFields = SignUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Cek jika validasi gagal -> return error
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Input gagal",
    };
  }

  const { name, email, password } = validatedFields.data; // validatedFields.data =  ini berisi data yang sudah valid

  // Ambil data kriptografi dari passkey.ts (Passkey & Smart Account yang dikirim browser)
  const pubX = formData.get("pubX") as string; // diubah ke string biar tidak terjadi error type "undefined"
  const pubY = formData.get("pubY") as string;
  const credentialId = formData.get("credentialId") as string;
  const walletAddress = formData.get("walletAddress") as string;

  console.log("============================================");
  console.log("Nama:", name);
  console.log("Email:", email);
  console.log("Public Key (X):", pubX);
  console.log("Public Key (Y):", pubY);
  console.log("Credential ID:", credentialId);
  console.log("Wallet Address:", walletAddress);
  console.log("============================================");

  // Kirim data lengkap ke Backend NestJS
  const response = await fetch(`${process.env.BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
      pubX,
      pubY,
      credentialId,
      walletAddress,
    }),
  });

  const resData = await response.json();

  // Jika Backend menolak (misal: Email udh terdaftar / HTTP 409 conflict)
  if (!response.ok) {
    return {
      message: resData.message || "Registrasi gagal",
    };
  }

  // Jika berhasil, simpan ID user asli dari database MySQL ke Cookie Session
  await createSession(resData.id.toString());

  // Redirect pengguna ke dashboard
  redirect("/dashboard");
}
