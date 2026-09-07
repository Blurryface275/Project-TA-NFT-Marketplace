# 04 — Dompet dan Passkey

## Masalah yang dipecahkan

Di dunia blockchain biasa, punya "dompet" berarti: pasang aplikasi khusus,
catat 12 kata rahasia di kertas (hilang = tamat), dan beli koin dulu buat
bayar biaya tiap transaksi. Tiga rintangan untuk orang yang cuma mau beli
tiket konser. Sistem ini membuang ketiganya.

## Perumpamaan: brankas dengan sidik jari

Bayangkan brankas yang cuma bisa dibuka dengan sidik jarimu. Kuncinya bukan
benda yang bisa difotokopi — kuncinya *kamu*.

**Passkey** persis begitu. Saat kamu mendaftar, perangkatmu (HP atau laptop)
membuat **sepasang kunci**:

- **Kunci rahasia** — disimpan di chip khusus di perangkat (TPM di Windows,
  Secure Enclave di Apple). Bisa *dipakai* untuk tanda tangan, tapi **tidak
  bisa dibaca keluar** oleh aplikasi mana pun. Termasuk oleh kami.
- **Kunci publik** — "gembok"-nya. Boleh dibagikan ke siapa saja. Bentuknya
  dua angka: `pubX` dan `pubY`.

## Dua kunci untuk dua pintu

| Pintu | Kuncinya |
|---|---|
| Masuk ke situs (lihat katalog, riwayat pesanan) | Email + kata sandi |
| Menandatangani urusan blockchain (mengizinkan tiket berpindah, dll.) | Passkey — sidik jari / wajah / PIN perangkat |

Kata sandi **tidak bisa** dipakai untuk tanda tangan. Passkey **tidak
dipakai** untuk login. Dua kunci, dua pintu — jangan tertukar.

## Dari gembok ke alamat dompet

Alamat dompetmu **dihitung secara pasti** dari gembok itu (tekniknya bernama
CREATE2, dijalankan lewat ZeroDev SDK; "rumah" dompetnya bernama Kernel,
pintu masuk standarnya EntryPoint versi 0.7 dari ERC-4337).

Uniknya: **alamatnya sudah sah menerima tiket sebelum rumahnya dibangun** di
blockchain. Rumah baru dibangun saat kamu mengirim transaksi pertama — dan
biayanya ditanggung **sponsor** (Paymaster ZeroDev), bukan kamu.

Perumpamaannya: alamat rumahmu sudah ada di peta dan paket bisa dikirim ke
sana, padahal rumahnya baru dibangun saat kamu pertama kali mau keluar.

## Ini tetap dompetmu sendiri

Kami **tidak bisa** menandatangani apa pun atas namamu, karena kuncinya tidak
ada di kami. Kalimat "kendali dompet bergantung pada sistem" — yang sempat
tertulis di rancangan lama — **salah**, dan jangan ditulis lagi.

Catatan jujur yang harus ikut disebut: tiketmu **bisa dipindahkan oleh loket
resmi** (`MarketplaceContract`) tanpa tanda tanganmu. Itu memang disengaja —
supaya jual ulang berjalan tanpa kamu harus mengerti blockchain. Artinya yang
kamu percayai adalah **kode kontrak yang terbuka dan bisa dibaca semua
orang**, bukan server kami. Dicatat juga di `10-keterbatasan.md`.

## Kalau HP hilang

Dua jalur:

1. **Tambah perangkat baru** — harus disetujui tanda tangan dari perangkat
   yang masih ada.
2. **Darurat**, kalau satu-satunya perangkat hilang: **12 kata cadangan**
   (standar BIP-39) yang kamu simpan saat daftar. 12 kata ini **hanya** untuk
   mendaftarkan perangkat baru lewat server (percobaannya dibatasi) — tidak
   bisa dipakai langsung untuk tanda tangan. Sehari-hari kamu tidak pernah
   menyentuhnya.

## Hal teknis yang perlu diketahui developer

- **Passkey terikat ke domain** (`rpId`). Passkey yang dibuat di `localhost`
  tidak berlaku di domain produksi. Responden kuesioner harus daftar langsung
  di domain produksi; akun uji coba lokal tidak bisa dibawa.
- Kunci passkey memakai kurva **P-256**, beda dari kurva Ethereum
  (secp256k1). Memverifikasi tanda tangannya di blockchain butuh penanganan
  khusus dan lebih mahal — ZeroDev sudah menyediakannya (*passkey
  validator*).
- Dompet pengguna adalah **smart account**, bukan dompet biasa. Kalau kontrak
  perlu memeriksa tanda tangan dompet pengguna, caranya lewat ERC-1271 (pakai
  `SignatureChecker` OpenZeppelin), bukan `ECDSA.recover` biasa. Kalau yang
  tanda tangan server (dompet biasa), `ECDSA.recover` cukup.
- Pustaka: `@zerodev/sdk` 5.5.x, `@zerodev/passkey-validator` 5.6.x, `viem`
  2.x. Di peramban butuh polyfill `Buffer`. ZeroDev API v3 memakai **satu URL**
  untuk bundler sekaligus paymaster.

## Sampai di mana percobaannya (2 September 2026)

| Yang dicoba | Hasil |
|---|---|
| Registrasi passkey (percobaan Vite, pagi) | **Terbukti** — menghasilkan `pubX`, `pubY`, `authenticatorId`, `authenticatorIdHash` |
| Buat smart account + kirim transaksi tersponsori (percobaan Next.js di `spike-next/`, siang; **lokal, tidak masuk repo**) | **Kodenya sudah lengkap**: passkey validator (`KERNEL_V3_3`, validator `V0_0_3_PATCHED`) → kernel account → paymaster → `sendTransaction`. **Hasil jalannya belum tercatat** |
| Masuk lagi dengan passkey yang sudah ada | Belum dicoba |

Aturan yang dipakai: sponsor gas dianggap **belum terbukti** sampai ada hash
transaksi tersponsori yang dicatat di `kerja/alamat-kontrak.md`. Versi
Kernel (`V3_1` di catatan lama, `V3_3` di kode percobaan) dikunci setelah
terbukti jalan.

## Yang masih dibahas 🔶

- **Siapa yang mengirim transaksi ke blockchain:** (a) ditandatangani
  dompetmu dan disponsori — paling sesuai cerita di atas; (b) server memakai
  dompetnya sendiri, dompetmu cuma penerima tiket — paling cepat dibangun;
  (c) campuran. Kode percobaan mengarah ke (a).
- **Isi tabel `passkey_credentials`:** arah yang disepakati — simpan salinan
  penuh (`pubX`, `pubY`, credential id) supaya server bisa mengecek sendiri
  bahwa alamat dompet benar berasal dari passkey terdaftar, bukan percaya
  alamat yang dikirim peramban.
- **Kunci publik disimpan sebagai dua kolom atau satu** — disarankan dua
  (`pub_x`, `pub_y`), karena dipakai terpisah saat membangun ulang validator.
