"use server";

import { z } from "zod";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Dummy database
const testUsers = [
  {
    id: "1",
    email: "steve@gmail.com",
    password: "12345678",
  },
  {
    id: "2",
    email: "budi@mail.com",
    password: "12345678",
  },
];

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

// Login Action Handler
export async function login(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    console.log("⚠️ [Action] Validasi Zod gagal:", result.error.flatten().fieldErrors);
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Input gagal!",
    };
  }

  const { email, password } = result.data; // result ditampilkan ketika valid
  console.log("📩 [Action] Memproses login untuk email:", email);

  const testUser = testUsers.find((user) => user.email === email);
  if (!testUser || password !== testUser.password) {
    console.log("❌ [Action] Kredensial tidak cocok untuk email:", email);
    return {
      errors: {
        email: ["Email atau password salah"],
      },
    };
  }

  console.log("✅ [Action] Kredensial valid, membuat session untuk userId:", testUser.id);
  // Buat session cookie via helper session yang tadi kamu buat
  await createSession(testUser.id);
  // Redirect pengguna ke halaman dashboard
  redirect("/dashboard");
}

// Logout Action Handler
export async function logout() {
  console.log("🚪 [Action] Trigger logout action");
  await deleteSession();
  redirect("/login");
}
