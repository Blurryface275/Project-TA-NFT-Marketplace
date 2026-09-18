# Penjelasan 05: Arsitektur Autentikasi Fullstack & Troubleshooting Server Actions

Dokumen ini menjelaskan arsitektur komunikasi antara Frontend Next.js dan Backend NestJS, mekanisme Session Cookie, penanganan HTTP status code (409 Conflict & 401 Unauthorized), serta penyelesaian bug teknis seputar `redirect()` dan scoping variabel.

---

## 1. Diagram Arsitektur Autentikasi

```
┌────────────────────────────────────────┐       ┌──────────────────────────────────────┐
│           FRONTEND (Next.js)           │       │           BACKEND (NestJS)           │
│                                        │       │                                      │
│  [SignUpForm.tsx / LoginForm.tsx]      │       │  [AuthController / AuthService]      │
│               │                        │       │                  │                   │
│         useActionState                 │       │           Bcrypt & TypeORM           │
│               │                        │       │                  │                   │
│               ▼                        │       │                  ▼                   │
│       [actions.ts] ───────fetch───────┼───────┼──────> [MySQL: nft-marketplace]      │
│  (Next.js Server Action)               │       │        - users                       │
│               │                        │       │        - customers                   │
│               ▼                        │       │        - passkey_credentials         │
│       [createSession()]                │       │                                      │
│    (HttpOnly JWT Cookie)               │       │                                      │
└────────────────────────────────────────┘       └──────────────────────────────────────┘
```

---

## 2. Alur Pesan Error: Siapa yang Menampilkan Pesan (Backend vs Frontend)?

### Pertanyaan Sering Muncul:
> *"Jika terjadi error HTTP 409 (Conflict), pesan yang muncul di layar itu berasal dari `auth.service.ts` di backend atau `actions.ts` di frontend?"*

### Penjelasan:
1. **Sumber Asli Pesan:** Berasal dari **Backend NestJS** (`backend/src/auth/auth.service.ts`):
   ```ts
   throw new ConflictException('Email sudah terdaftar');
   ```
   NestJS secara otomatis mengirimkan JSON berikut ke frontend dengan HTTP status code 409:
   ```json
   {
     "statusCode": 409,
     "message": "Email sudah terdaftar",
     "error": "Conflict"
   }
   ```
2. **Penangkap & Pengirim:** Ditangkap oleh **Server Action** (`frontend/src/app/signup/actions.ts`):
   ```ts
   const resData = await response.json();
   if (!response.ok) {
     return {
       message: resData.message || "Registrasi gagal",
     };
   }
   ```
   Server Action memprioritaskan `resData.message` dari backend. String `"Registrasi gagal"` hanyalah *fallback* jika backend tidak mengirim properti `message`.
3. **Penampil di Layar:** Ditangkap oleh hook `useActionState` di `SignUpForm.tsx`:
   ```tsx
   {state?.message && (
     <p className="text-sm text-red-500 text-center">{state.message}</p>
   )}
   ```
   Maka teks yang muncul di layar pengguna adalah teks asli dari backend: **`"Email sudah terdaftar"`**.

---

## 3. Troubleshooting Kunci Server Actions Next.js

### A. Jebakan `redirect()` di dalam Blok `try...catch`

#### Gejala Masalah:
User berhasil login/register dan data valid, namun bukannya berpindah ke `/dashboard`, di layar justru muncul pesan error merah: *"Terjadi kesalahan jaringan, coba lagi"*.

#### Penyebab Teknis:
Di Next.js App Router, pemanggilan fungsi `redirect("/dashboard")` **TIDAK** mengembalikan nilai biasa, melainkan **sengaja melempar Error internal (`throw NEXT_REDIRECT`)** untuk menghentikan eksekusi thread saat itu juga.

Jika `redirect()` diletakkan di dalam blok `try`:
```ts
// ❌ KODE BERMASALAH
try {
  await createSession(resData.id.toString());
  redirect("/dashboard"); // <-- Melempar error 'NEXT_REDIRECT'
} catch (error) {
  // Blok catch salah mengira NEXT_REDIRECT sebagai error koneksi!
  return { message: "Terjadi kesalahan jaringan, coba lagi" };
}
```

#### Solusi Standar (Best Practice):
Letakkan pemanggilan `createSession()` dan `redirect()` **di luar blok `try...catch`**:
```ts
// ✅ KODE YANG BENAR
let response;
try {
  response = await fetch(...);
} catch (error) {
  return { message: "Gagal terhubung ke backend" };
}

const resData = await response.json();
if (!response.ok) {
  return { message: resData.message || "Gagal!" };
}

// Eksekusi di luar try...catch
await createSession(resData.id.toString());
redirect("/dashboard");
```

---

### B. Masalah Block Scope Variabel (`let` vs `const`)

#### Gejala Masalah:
Muncul garis cacing merah pada `response.json()` dengan pesan: *Cannot find name 'response'*.

#### Penyebab:
Di JavaScript/TypeScript, variabel yang dideklarasikan dengan `const` di dalam tanda kurung kurawal `{ ... }` hanya hidup di dalam blok tersebut:
```ts
try {
  const response = await fetch(...); // <-- hanya hidup di dalam blok try
} catch (error) { ... }

const resData = await response.json(); // <-- Error: response tidak dikenal di luar try
```

#### Solusi:
Deklarasikan wadah variabel `let response;` satu baris sebelum blok `try`:
```ts
let response;
try {
  response = await fetch(...);
} catch (error) { ... }

const resData = await response.json();
```

---

## 4. Sumber & Referensi Resmi

1. **Dokumentasi Resmi Next.js - Server Actions and Mutations:**
   * Link: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
2. **Dokumentasi Resmi Next.js - `redirect()` Function Reference:**
   * Link: https://nextjs.org/docs/app/api-reference/functions/redirect
   * Penjelasan resmi: *"redirect internally throws an error so it should be called outside of try/catch blocks."*
3. **Dokumentasi Resmi NestJS - Built-in HTTP Exceptions:**
   * Link: https://docs.nestjs.com/exception-filters#built-in-http-exceptions
   * Penjelasan mengenai `ConflictException` (409) dan `UnauthorizedException` (401).
