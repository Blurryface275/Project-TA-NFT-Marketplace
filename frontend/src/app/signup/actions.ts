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
  console.log("✅ [Signup] Data lolos validasi:", { name, email });

  // Buat user session
  // (Nanti di tahap berikutnya, di sini tempat menyimpan ke MySQL dan mendaftarkan Passkey)
  const userId = "user-" + Date.now();
  await createSession(userId);

  // Redirect pengguna ke dashboard
  redirect("/dashboard");
}
