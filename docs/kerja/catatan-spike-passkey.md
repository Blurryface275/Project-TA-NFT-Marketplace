# Catatan Percobaan (Spike) — Registrasi Passkey ZeroDev

> **Berkas kerja — tidak masuk buku.** Folder `spike/` sudah **dihapus 2
> September 2026** (keputusan Edward: hanya uji coba, tidak dirawat). Kode
> lamanya masih bisa dilihat lewat riwayat git:
> `git show 630bf25^:spike/src/main.ts`

## Apa yang dicoba

Proyek kecil Vite + TypeScript yang memanggil `toWebAuthnKey` dari
`@zerodev/passkey-validator` dengan `WebAuthnMode.Register`, menunjuk ke
passkey server ZeroDev untuk project Sepolia (URL project ada di `.env`
root — jangan disalin ke berkas ini karena berkas ini ikut git).

Versi yang dipakai saat percobaan (2 Sep 2026):
`@zerodev/passkey-validator` ^5.6.0, `@zerodev/sdk` ^5.5.10, `viem` ^2.56.2,
Vite ^8.2.2, TypeScript ~6.0.

## Apa yang TERBUKTI

- Registrasi passkey lewat prompt biometrik browser berhasil dan
  mengembalikan objek berisi `pubX`, `pubY`, `authenticatorId`, dan
  `authenticatorIdHash` (nilai bigint perlu diubah ke string sebelum
  di-JSON-kan).
- Perlu penjaga anti klik ganda — pemanggilan `toWebAuthnKey` dua kali
  bersamaan membuat prompt bentrok.
- Perlu polyfill `Buffer` di browser (`globalThis.Buffer = Buffer` dari paket
  `buffer`) sebelum impor pustaka ZeroDev — tanpa ini gagal di runtime.
  Dependensi `buffer` waktu itu terpasang di `package.json` **root** (masih
  ada di sana).
- `rpId` mengikat passkey ke **satu domain**. Passkey yang dibuat di
  `localhost` tidak berlaku di domain produksi. Akibat operasionalnya:
  responden kuesioner mendaftar langsung di domain produksi, dan akun uji
  coba `localhost` tidak bisa dibawa ke sana.
- API ZeroDev v3 memakai **satu** URL untuk bundler sekaligus paymaster.
- Gas policy sudah diaktifkan di dasbor ZeroDev (2 September) — tetap
  dianggap belum terbukti sampai satu UserOperation tersponsori berhasil.
- Pelajaran alat: berkas yang dibuat dengan `>`/`>>` di Windows PowerShell
  5.1 tersimpan UTF-16 dan tidak terbaca git (kejadian nyata pada
  `.gitignore` pagi ini). Pakai `Set-Content -Encoding utf8`.

## Apa yang BELUM terbukti (bahan keputusan K7)

- Membuat smart account (kernel) dari hasil `toWebAuthnKey`.
- Mengirim UserOperation yang **disponsori Paymaster** di Sepolia — klaim
  "gas policy aktif" belum pernah dibuktikan dengan transaksi nyata.
- Mode `WebAuthnMode.Login` (masuk kembali dengan passkey yang sudah ada).

## Langkah percobaan berikutnya (target ≤ 10 Sep, lihat panduan-pengerjaan.md)

1. Dari passkey terdaftar → buat kernel smart account (perhatikan CLAUDE.md
   9.2: EntryPoint v0.7, `KERNEL_V3_1`).
2. Kirim satu UserOperation sederhana yang disponsori → catat hash-nya di
   `alamat-kontrak.md` sebagai bukti sponsorship.
3. Coba `WebAuthnMode.Login` di peramban yang sama.
