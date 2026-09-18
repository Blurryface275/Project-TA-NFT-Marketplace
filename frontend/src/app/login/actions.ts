"use server";

import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Zod Schema for Login Form
const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password minimal harus 8 karakter" })
    .trim(),
});

// state returned to UI
export type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

let resData;
// Login Action Handler
export async function login(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    console.log(
      "⚠️ [Action] Validasi Zod gagal:",
      result.error.flatten().fieldErrors,
    );
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Input gagal!",
    };
  }

  const { email, password } = result.data; // result ditampilkan ketika valid
  console.log("📩 [Action] Memproses login untuk email:", email);

  let response;
  // ambil data (fetch ke backend api login)
  try {
    response = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
  } catch (error) {
    console.error("❌ [Action] Terjadi kesalahan network saat login:", error);
    return {
      message: "Terjadi kesalahan jaringan, coba lagi",
    };
  }

  // ambil response JSON
  resData = await response.json();
  console.log(
    "✅ [Action] Kredensial valid, membuat session untuk userId:",
    resData.id,
  );

  if (!response.ok) {
    return {
      message: resData.message || "Gagal login!",
    };
  }

  // Buat session cookie via helper session yang tadi kamu buat
  await createSession(resData.id.toString());
  // Redirect pengguna ke halaman dashboard
  redirect("/dashboard");
}

// Logout Action Handler
export async function logout() {
  console.log("🚪 [Action] Trigger logout action");
  await deleteSession();
  redirect("/login");
}
