import { z } from "zod";

// Skema validasi formulir pendaftaran (Sign Up) menggunakan Zod
export const SignUpFormSchema = z.object({
  // Validasi Nama: Wajib berupa teks dan minimal 2 karakter
  name: z
    .string()
    .min(2, { message: "Name minimal 2 characters" })
    .trim(),

  // Validasi Email: Memastikan format alamat email valid
  email: z
    .string()
    .email({ message: "Please enter a valid email." })
    .trim(),

  // Validasi Password: Wajib minimal 8 karakter dengan kombinasi huruf, angka, dan simbol
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter." }) // Minimal 1 huruf
    .regex(/[0-9]/, { message: "Contain at least one number." }) // Minimal 1 angka
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    }) // Minimal 1 simbol
    .trim(),
});

// Tipe data state kembalian dari Server Action ke UI (useActionState)
export type FormState =
  | {
      // Objek penampung pesan kesalahan validasi per field input
      errors?: {
        name?: string[]; // Array string: Menampung daftar pesan error untuk field name
        email?: string[]; // Array string: Menampung daftar pesan error untuk field email
        password?: string[]; // Array string: Menampung lebih dari 1 pesan error jika password melanggar beberapa aturan sekaligus
      };
      message?: string; // Pesan status umum/global (misal: "Pendaftaran gagal" atau pesan sistem)
    }
  | undefined; // Nilai awal (initial state) sebelum pengguna pertama kali menekan tombol submit