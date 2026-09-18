# Penjelasan 04: Siklus Hidup WebAuthn Passkey (Registrasi vs Login & Perubahan Credential ID)

Dokumen ini menjelaskan secara mendalam arsitektur WebAuthn (FIDO2), alasan teknis mengapa `credentialId` selalu berubah di setiap pendaftaran baru meskipun emailnya sama, serta perbandingan antara alur Registrasi dan Login.

---

## 1. Pertanyaan Inti

> *"Kenapa saat saya mendaftar ulang dengan email yang sama persis (misal `andi@gmail.com`), `credentialId` yang dihasilkan selalu berbeda dari sebelumnya?"*

Jawaban singkatnya: **Karena spesifikasi resmi W3C WebAuthn dan FIDO2 mewajibkan chip keamanan hardware (TPM / Secure Enclave) untuk selalu menciptakan pasangan kunci kriptografi dan identifier acak baru setiap kali fungsi Registrasi (`create`) dipanggil.**

---

## 2. Dua Upacara Inti WebAuthn: Registrasi vs Autentikasi (Login)

Standar W3C WebAuthn membagi interaksi pengguna menjadi dua upacara (*ceremonies*):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      1. REGISTRATION CEREMONY                           │
│                                                                         │
│   Frontend (SignUp)  ──────>  navigator.credentials.create()            │
│                                           │                             │
│                                           ▼                             │
│                               Chip TPM / Secure Enclave                 │
│                               (Generate KUNCI & ID BARU)                │
│                                           │                             │
│                                           ▼                             │
│                               Kembalikan Credential ID Baru             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      2. AUTHENTICATION CEREMONY (LOGIN)                 │
│                                                                         │
│   Frontend (Login)   ──────>  navigator.credentials.get()               │
│                               (Kirim Credential ID Lama)                │
│                                           │                             │
│                                           ▼                             │
│                               Chip TPM / Secure Enclave                 │
│                               (TIDAK buat kunci baru.                   │
│                                Tanda tangani challenge pakai kunci lama)│
└─────────────────────────────────────────────────────────────────────────┘
```

### A. Upacara Registrasi (`navigator.credentials.create`)
1. Browser menerima opsi pendaftaran dari server (`challenge`, `rpId`, `user`).
2. Browser memanggil API sistem operasi (Windows Hello, Touch ID, Face ID).
3. Chip hardware (**TPM**) membangkitkan bilangan acak dari generator entropi fisik (*Hardware True Random Number Generator*).
4. Chip TPM mencetak:
   * **Private Key Baru** (disimpan permanen di brankas hardware).
   * **Public Key Baru** (`pubX`, `pubY`).
   * **`credentialId` Baru** (handle acak unik sebagai nomor indeks kunci tersebut).
5. Nilai `credentialId` ini disimpan ke database backend (`passkey_credentials`) agar kelak bisa dicari saat user ingin login kembali.

### B. Upacara Autentikasi / Login (`navigator.credentials.get`)
1. Server memberikan `challenge` dan daftar `credentialId` yang terdaftar atas nama user tersebut (`allowCredentials`).
2. Browser meminta chip TPM mencari kunci yang sesuai dengan `credentialId` yang dikirimkan.
3. Chip TPM **TIDAK membuat kunci baru**. Chip TPM hanya menandatangani *challenge* menggunakan *private key* lama yang sudah tersimpan.
4. Tanda tangan dikirim kembali ke server/smart contract untuk diverifikasi.

---

## 3. Mengapa Email Tidak Mempengaruhi `credentialId`?

Mitos yang sering muncul adalah:
> *"Jika emailnya sama, sistem akan meng-hash email tersebut menjadi kunci yang sama."*

Hal ini **salah secara prinsip keamanan WebAuthn**:
1. **Email Hanyalah Metadata Tampilan:**
   Di standar WebAuthn, parameter `email` atau `passkeyName` hanya dikirimkan pada field `user.name` dan `user.displayName`. Fungsinya murni untuk antarmuka pengguna (misal: tulisan *"Simpan passkey untuk andi@gmail.com di Windows Hello"*).
2. **Prinsip Anti-Tracking & Unlinkability:**
   Spesifikasi FIDO2 melarang keras pembuatan *credentialId* yang deterministik. Jika satu email selalu menghasilkan *credentialId* yang sama, maka penyerang atau situs web pihak ketiga dapat melacak aktivitas pengguna di berbagai platform (*tracking across services*).

---

## 4. Penelusuran Alur Kode (Call Stack Trace) Pembuatan Credential

Berikut adalah alur baris kode nyata dalam repositori ini ketika `credentialId` dihasilkan:

1. **Komponen Form:**
   `frontend/src/app/signup/SignUpForm.tsx` (Baris 35)
   ```ts
   const passkey = await registerPasskey(email);
   ```

2. **Fungsi Registrasi Klien:**
   `frontend/src/lib/passkey.ts` (Baris 30–37)
   ```ts
   export async function registerPasskey(email: string) {
     const webAuthnKey = await toWebAuthnKey({
       passkeyName: email,
       passkeyServerUrl: process.env.NEXT_PUBLIC_PASSKEY_SERVER_URL!,
       mode: WebAuthnMode.Register, // <--- Mode Registrasi
       passkeyServerHeaders: {},
     });
   ```

3. **Pengambilan Tantangan dari Passkey Server:**
   `node_modules/@zerodev/webauthn-key/toWebAuthnKey.ts` (Baris 121–133)
   ```ts
   const registerOptionsResponse = await fetch(`${passkeyServerUrl}/register/options`, ...);
   const registerOptions = await registerOptionsResponse.json();
   ```

4. **Pemicu Dialog Sistem Operasi via SimpleWebAuthn:**
   `node_modules/@zerodev/webauthn-key/toWebAuthnKey.ts` (Baris 136–137)
   ```ts
   const { startRegistration } = await import("@simplewebauthn/browser");
   const registerCred = await startRegistration(registerOptions.options);
   ```

5. **Panggilan Web API Browser Native:**
   `node_modules/@simplewebauthn/browser/dist/bundle/index.js` (Baris 201)
   ```js
   credential = (await navigator.credentials.create(options));
   ```
   *Pada baris inilah browser berkomunikasi langsung dengan chip hardware TPM laptop.*

6. **Penangkapan ID Baru:**
   `node_modules/@zerodev/webauthn-key/toWebAuthnKey.ts` (Baris 139)
   ```ts
   authenticatorId = registerCred.id; // <--- Credential ID baru ditangkap
   ```

---

## 5. Sumber & Referensi Resmi

1. **W3C Web Authentication Specification (WebAuthn Level 3):**
   * Section 5.1: *Cryptographic Operations and Key Generation in [[Create]]*
   * Link: https://www.w3.org/TR/webauthn-3/#sctn-op-make-cred
2. **FIDO Alliance Architectural Overview:**
   * Link: https://fidoalliance.org/specs/fido-v2.0-id-20180227/fido-overview-v2.0-id-20180227.html
3. **SimpleWebAuthn Browser Package:**
   * Link: https://simplewebauthn.dev/docs/packages/browser
