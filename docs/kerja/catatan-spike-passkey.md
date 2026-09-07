# Catatan Percobaan (Spike) — Passkey dan Dompet ZeroDev

> **Berkas kerja — tidak masuk buku.** Kode percobaan **tidak di-commit** —
> hanya uji coba, tidak dirawat. Yang dicatat di sini adalah temuannya,
> supaya tidak hilang saat kodenya dibuang.

## Percobaan 1 — registrasi passkey (Vite + TypeScript, 2 Sep pagi)

Folder `spike/` sudah dihapus; kodenya masih di riwayat git
(`git show 630bf25^:spike/src/main.ts`). Memanggil `toWebAuthnKey` dari
`@zerodev/passkey-validator` dengan `WebAuthnMode.Register` ke passkey server
ZeroDev project Sepolia.

**Terbukti:**
- Registrasi lewat prompt biometrik peramban berhasil; hasilnya `pubX`,
  `pubY`, `authenticatorId`, `authenticatorIdHash` (nilai bigint harus diubah
  ke string sebelum di-JSON-kan).
- Perlu penjaga anti klik ganda — dua panggilan bersamaan membuat prompt
  bentrok.
- Perlu polyfill `Buffer` di peramban sebelum impor pustaka ZeroDev.

## Percobaan 2 — smart account + transaksi tersponsori (Next.js, `spike-next/`, 2 Sep siang)

Folder `spike-next/` ada di komputer lokal, **di-gitignore, tidak akan
di-commit**. Alur kodenya (`src/app/page.tsx`):

1. `toWebAuthnKey` mode Register (seperti percobaan 1).
2. `toPasskeyValidator(publicClient, { webAuthnKey, entryPoint 0.7,
   kernelVersion: KERNEL_V3_3, validatorContractVersion: V0_0_3_PATCHED })`.
3. `createKernelAccount(publicClient, { plugins: { sudo: passkeyValidator },
   entryPoint, kernelVersion })` → alamat dompet.
4. `createZeroDevPaymasterClient` + `createKernelAccountClient` dengan
   `paymaster.getPaymasterData` → `sponsorUserOperation`. Bundler dan
   paymaster memakai **satu URL** yang sama (`NEXT_PUBLIC_ZERODEV_RPC`).
5. `kernelClient.sendTransaction({ to: alamat sendiri, value: 0 })` → hash.

Variabel lingkungan: `NEXT_PUBLIC_ZERODEV_RPC`, `NEXT_PUBLIC_PASSKEY_SERVER_URL`
(nilainya di `.env`, jangan disalin ke sini).

**Hasil eksekusi: BELUM TERCATAT.** Isi tabel ini begitu dijalankan:

| Hal | Nilai |
|---|---|
| Alamat smart account yang dihasilkan | `[BELUM]` |
| Hash transaksi tersponsori pertama | `[BELUM]` |
| Gas terpakai (dari Etherscan) | `[BELUM]` |
| Waktu konfirmasi | `[BELUM]` |
| Versi kernel yang terbukti jalan | `[BELUM]` — kode memakai `KERNEL_V3_3`; catatan lama menyebut `KERNEL_V3_1` |
| Tanggal | `[BELUM]` |

Begitu ada hash: salin ke `alamat-kontrak.md` (baris "bukti sponsor gas") dan
kunci versi kernel di `CLAUDE.md` Bagian 9.2.

## Temuan umum

- `rpId` mengikat passkey ke **satu domain**. Passkey `localhost` tidak
  berlaku di domain produksi → responden kuesioner mendaftar langsung di
  domain produksi; akun uji coba lokal tidak bisa dibawa.
- Gas policy sudah diaktifkan di dasbor ZeroDev (2 Sep) — tetap dianggap
  **belum terbukti** sampai satu transaksi tersponsori berhasil.
- Pelajaran alat: berkas yang dibuat dengan `>`/`>>` di Windows PowerShell 5.1
  tersimpan UTF-16 dan tidak terbaca git (kejadian nyata pada `.gitignore`).
  Pakai `Set-Content -Encoding utf8`.
- Dependensi `buffer` terpasang di `package.json` root.

## Belum terbukti

- Hasil eksekusi percobaan 2 (lihat tabel).
- Mode `WebAuthnMode.Login` — masuk kembali dengan passkey yang sudah ada.

## Langkah berikutnya (target ≤ 10 Sep)

1. Jalankan percobaan 2 sampai dapat hash, isi tabel di atas.
2. Coba `WebAuthnMode.Login` di peramban yang sama.
3. Bawa hasilnya ke keputusan **"siapa pengirim transaksi"** (lihat
   `keputusan.md`): kalau jalur UserOperation terbukti, itu pilihan utama;
   kalau macet lebih dari sehari, jatuh ke dompet server untuk kuesioner.

Keputusan terkait di `keputusan.md`: siapa pengirim transaksi; isi tabel
`passkey_credentials`; bentuk kolom kunci publik.
