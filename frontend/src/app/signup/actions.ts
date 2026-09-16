"use server";

import { SignUpFormSchema, FormState } from "@/lib/definitions";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signup(state: FormState, formData: FormData) {
  // Validasi field form menggunakan skema dari definitions.ts
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

  const { name, email, password } = validatedFields.data;

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

  // Buat user session
  // (Nanti di tahap berikutnya, di sini tempat menyimpan ke MySQL dan mendaftarkan Passkey)
  const userId = "user-" + Date.now();
  await createSession(userId);

  // Redirect pengguna ke dashboard
  redirect("/dashboard");
}
