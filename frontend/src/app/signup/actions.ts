"use server";

import { SignUpFormSchema, FormState } from "@/lib/definitions";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signup(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
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

  // Kembalikan status success TRUE agar UI bisa lanjut ke step berikutnya (Verify OTP)
  return {
    success: true,
    step: "verify_otp", // UI akan mengarahkan ke komponen Verify OTP
    email: email,
    message: "Registrasi berhasil! Masukkan kode OTP yang dikirim ke email Anda.",
  };
}

export async function verifyOtpAction(email: string, otp: string){
  try { // ini yang akan dikirim ke backend
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    // ini yang bakal diterima oleh frontend dari backend
    const data = await res.json();
    if (!res.ok){
      return {
        success: false, 
        message: data.message || "Kode OTP salah."
      };
    }

    return {
      success: true,
      message: data.message || "Email berhasil diverifikasi!"
    };    
  }
  catch (error){
    console.error("❌ [Verify OTP Action] Gagal terhubung ke backend:", error);
    return {
      success: false,
      message: "Terjadi kesalahan jaringan saat verifikasi OTP."
    };
  }
}

// Action untuk meminta kode OTP baru (Resend OTP)
export async function resendOtpAction(email: string){
  try{
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/resend-otp`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok){
      return{
        success : false,
        message: data.message || "Gagal mengirim ulang kode OTP.",
      };
    }

    return{
      success : true,
      message: data.message || "Kode OTP baru berhasil dikirim!"
    }
  }
  catch(error){
    console.error("❌ [Resend OTP Action] Gagal terhubung ke backend:", error);
    return {
      success: false,
      message: "Terjadi kesalahan jaringan saat meminta kode OTP."
    };
  }
}