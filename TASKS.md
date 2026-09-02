# TASKS.md — Peta Kerja Menuju Sidang (2 September – 17 November 2026)

> Berkas ini menggantikan `tasks.md` lama (checklist penyusunan folder `docs/`,
> yang tugasnya sudah selesai). Isi lama tetap bisa dibaca lewat
> `git show 075d78b:tasks.md`.
>
> **Cara pakai:** tugas dikelompokkan per **fase**, bukan per tanggal. Jadwal
> harian dan mingguan ada di panduan pengerjaan (jawaban asisten, 2 September
> 2026). Satu kotak hanya boleh dicentang bila **bukti selesai**-nya terpenuhi —
> tidak ada "hampir selesai".
>
> **Penanda:**
> - `[MEMBLOKIR → X]` — tugas ini menahan X; kerjakan lebih dulu.
> - `[TERBLOKIR K-n]` — belum boleh dikerjakan sebelum keputusan nomor n.
> - `[BATAS: tanggal]` — lewat tanggal ini belum selesai = jalankan aturan
>   meleset di panduan pengerjaan.
>
> Perbarui berkas ini setiap Senin sesudah konsultasi.

**Terakhir diperbarui: 2 September 2026, sore — Fase A sudah dieksekusi.**

---

## 0. Keputusan Terbuka (K1–K11)

Sumber K1–K9: daftar Edward per 1 September. K10–K11: temuan pemeriksaan
repositori 2 September. Jangan menulis kode yang bergantung pada keputusan
yang belum diambil.

| No | Keputusan | Target | Memblokir apa |
|---|---|---|---|
| K1 | Seberapa formal verifikasi dokumen penyelenggara event (ERD sudah punya `organizers.status` pending/approved/rejected + `verified_by`) | Konsultasi 7 Sep | Modul penyelenggara di backend; Bab 4 |
| K2 | Pencatatan listing jual ulang: transaksi on-chain terpisah, atau cukup `executeResale()` yang on-chain | Konsultasi 7 Sep | **Seluruh `MarketplaceContract.sol` (Fase C)**; spesifikasi API; Bab 4 |
| K3 | Batas tiket per wallet masih berlaku atau tidak (kontrak sudah telanjur punya `maxPerWallet` dan `walletPurchases`) | Konsultasi 7 Sep | `mintTicket()` (Fase B); kemungkinan revisi `createEvent()` |
| K4 | Apakah log audit dituntut konsentrasi Network & Cyber Security | Konsultasi 7 Sep (boleh mundur 14 Sep) | Tabel log/riwayat masuk; KNF terkait |
| K5 | Kolom `username` perlu batasan unik atau tidak | Konsultasi 7 Sep | Migrasi database backend (Fase E) |
| K6 | Peran passkey server ZeroDev terhadap tabel `passkey_credentials` di MySQL (dua-duanya menyimpan credential — siapa sumber kebenaran?) | Konsultasi 7 Sep | Modul auth backend (Fase E) |
| K7 | Backend mengirim transaksi sebagai EOA biasa, atau merelay UserOperation ERC-4337 (diagram `design/desain-blockchain-2.png` condong ke UserOperation lewat backend) | **Usulan: majukan ke 7 Sep** (semula tanpa tanggal — padahal memblokir backend mulai ±9 Sep) | Modul koneksi blockchain backend; klaim Paymaster di Bab 4; bukti sponsorship Fase D |
| K8 | Penanganan bila kuota sponsorship Paymaster habis setelah pembayaran Midtrans diterima | Konsultasi 14 Sep | Prosedur operasional saat kuesioner (Fase G) |
| K9 | Metode dokumentasi uji fungsional Bab 6: otomasi atau manual berbasis skenario (uji per fungsi Foundry/API **bukan** bagian keputusan ini — itu wajib sejak awal) | Konsultasi 14 Sep | Fase H (eksekusinya tetap Oktober) |
| K10 | **Skema KYC mana yang berlaku:** (a) hash + salt + pepper tanpa satu pun data KTP terbaca (CLAUDE.md 4.4, docs lama), atau (b) `full_name` terbaca + `ktp_photo` + satu `nik_hash` + verifikasi manual (ERD 24–25 Agustus + kamus data Bab 4). Dua-duanya ada di repositori dan saling bertentangan | **Konsultasi 7 Sep** | `registerIdentity()` di kontrak (Fase B); modul KYC backend (Fase E); narasi keamanan/privasi Bab 4; revisi docs 01/03/04/05/07/09 |
| K11 | Tempat hosting publik untuk kuesioner: frontend, backend, MySQL, dan URL webhook Midtrans harus bisa diakses responden dari internet (belum pernah dibahas di dokumen mana pun) | Keputusan sendiri, paling lambat 10 Sep | Fase G |

---

## Fase A — Kebersihan Repositori & Bahan Konsultasi `[BATAS: 6 Sep]`

- [x] Nasib berkas terhapus (2 Sep): `docs/` **dipulihkan** dari commit
  `075d78b`; `design/` sudah di-commit Edward sendiri; `spike/` dihapus
  Edward (kodenya tetap di riwayat git — lihat
  `docs/kerja/catatan-spike-passkey.md`).
- [x] `.gitignore` root ditulis ulang lengkap (2 Sep): `.env`,
  `node_modules/`, `cache/`, `out/`, `dist/`, `.next/`, `spike/`. `design/`
  **sengaja tetap dilacak git** — isinya sumber diagram Bab 3–4.
- [x] `.env` dan `cache/solidity-files-cache.json` dikeluarkan dari pelacakan
  (`git rm --cached`, 2 Sep). Catatan: keduanya sempat ter-commit pagi ini,
  jadi project id ZeroDev ada di riwayat git — ini testnet, risikonya kecil;
  kalau mau benar-benar bersih, buat project baru di dasbor ZeroDev
  (opsional).
- [x] Bahan konsultasi 7 Sep tersusun: `docs/kerja/keputusan.md` (K1–K11,
  opsi + akibat + usulan). **Baca ulang dan tambahkan pendapatmu sendiri
  sebelum Senin.**
- [x] `CLAUDE.md` disinkronkan (2 Sep): jadwal baru di Bagian 1, peringatan
  K10 di Bagian 4.4, status kontrak di Bagian 6, tabel status di Bagian 11.
- [ ] **Commit hasil penataan 2 Sep** (docs pulih + docs/kerja + .gitignore +
  un-track .env/cache + TASKS.md). **Bukti:** `git status` bersih.
- [ ] Setelah K10 putus: finalisasi `CLAUDE.md` Bagian 4.4 + revisi docs
  01/03/04/05/07/09 mengikuti skema terpilih. `[TERBLOKIR K10]`

## Fase B — `TicketContract.sol` Selesai dan Teruji `[BATAS: 9 Sep]`

Sudah ada: struct, mapping, error, `createEvent()`, `addCategory()`,
`setSalesOpen()`, `setMarketplace()`, `setSystemSigner()`. Belum ada test
sama sekali.

- [ ] Test Foundry untuk yang **sudah ada**: `createEvent`, `addCategory`,
  `setSalesOpen` (termasuk semua jalur revert). **Bukti:** `forge test` hijau.
- [ ] `registerIdentity()` sesuai K10 + `mintTicket()` menolak dompet yang
  belum ber-KYC. `[TERBLOKIR K10]` **Bukti:** test.
- [ ] `mintTicket()`: cek event ada + `salesOpen`, kategori ada, kuota
  (`minted < quota`), batas per wallet (sesuai K3), simpan `TicketInfo` dengan
  `originalPrice`, `_safeMint`, emit. `[TERBLOKIR K3, K10]`
  **Bukti:** test skenario sukses + tiap jalur revert.
- [ ] Gerbang EIP-712: struct izin mint (pembeli, event, kategori, nonce,
  deadline), `_hashTypedDataV4` + pemulihan penanda tangan = `systemSigner`,
  nonce sekali pakai, deadline. Perhatikan CLAUDE.md Bagian 9.1 jebakan 2–3.
  **Bukti:** test tanda tangan salah / nonce dipakai ulang / kedaluwarsa —
  semuanya revert.
- [ ] Penimpaan `_update()`: mint dan burn tetap lolos; perpindahan biasa hanya
  boleh lewat marketplace (CLAUDE.md 9.1 jebakan 1). **Bukti:** test transfer
  langsung antar dompet revert; jalur marketplace lolos.
  `[MEMBLOKIR → Fase C, uji keamanan Fase H]`
- [ ] Gas snapshot pertama (`forge snapshot`). **Bukti:** berkas snapshot ada.
- [ ] `markUsed()` / penukaran di lokasi acara — **boleh ditunda sampai sesudah
  19 Sep** (alur pendukung, bukan alur utama).

## Fase C — `MarketplaceContract.sol` `[TERBLOKIR K2]` `[BATAS: 10 Sep]`

- [ ] Rancang bentuk kontrak sesuai hasil K2 (listing on-chain penuh vs hanya
  `executeResale()` on-chain).
- [ ] Penguncian harga: harga jual **dipaksa sama** dengan `originalPrice` dari
  `TicketContract`; penjual tidak pernah bisa memasukkan angka harga.
  **Bukti:** test upaya menjual di atas harga asal revert / tidak mungkin dari
  bentuk fungsinya.
- [ ] `executeResale()`: perpindahan NFT lewat jalur allowlist, tercatat.
  **Bukti:** test integrasi mint → tawarkan → beli di Foundry.
- [ ] Test keamanan (bahan Fase H): transfer di luar allowlist gagal,
  price-lock tidak bisa dilanggar. **Bukti:** berkas test khusus keamanan.

## Fase D — Deploy ke Sepolia `[BATAS: 11 Sep]`

- [ ] Skrip deploy Foundry: kedua kontrak + `setMarketplace` +
  `setSystemSigner`. **Bukti:** alamat kontrak tercatat di catatan kerja.
- [ ] Seed on-chain: 1 event + ≥1 kategori. **Bukti:** transaksi sukses.
- [ ] **Bukti sponsorship gas:** 1 transaksi sukses sesuai hasil K7 — kalau
  UserOperation: satu UserOperation tersponsori Paymaster ZeroDev di Sepolia;
  kalau EOA: satu transaksi EOA backend. Ini sekaligus membuktikan klaim "gas
  policy aktif" yang belum pernah terverifikasi. **Bukti:** hash transaksi.
  `[TERBLOKIR K7]`

## Fase E — Backend NestJS `[TERBLOKIR K5, K6, K7, K10]` `[BATAS: 15 Sep]`

- [ ] Scaffold NestJS 11 + TypeORM (pakai `DataSource`, bukan API lama) +
  MySQL; migrasi sesuai ERD final satu versi. **Bukti:** migrasi jalan di
  database kosong.
- [ ] Auth sesuai ERD: pendaftaran + masuk + registrasi passkey (angkat hasil
  `spike/`) + simpan `wallet_address`. **Bukti:** test API
  daftar → masuk → passkey → wallet tercatat.
- [ ] Modul KYC sesuai K10. **Bukti:** test API; data tersimpan sesuai skema.
- [ ] Modul event + katalog (termasuk `on_chain_event_id`). **Bukti:** endpoint
  daftar/detail berfungsi.
- [ ] Midtrans sandbox: buat transaksi Snap, terima webhook, idempoten (webhook
  ganda tidak mencetak tiket ganda). **Bukti:** pembayaran uji berstatus lunas
  memicu mint. `[MEMBLOKIR → Fase G]`
- [ ] Pipeline mint: webhook lunas → kirim transaksi sesuai K7 → tunggu
  konfirmasi → tulis `ticket_cache` (+ catat lama konfirmasi sejak awal —
  datanya dibutuhkan Bab 6). **Bukti:** NFT muncul di Sepolia + baris
  `ticket_cache` terisi.
- [ ] Pinata: unggah gambar/metadata event, simpan CID. **Bukti:** CID bisa
  dibuka lewat gateway.
- [ ] Cloudflare Turnstile diverifikasi di sisi server pada endpoint pembelian
  (lihat §12 — boleh dipotong).
- [ ] Test API per modul, berjalan seiring kode (wajib, bukan bagian K9).

## Fase F — Frontend Next.js `[BATAS: 17 Sep]`

- [ ] Scaffold Next.js + halaman: daftar akun, masuk, isi KYC, katalog, detail
  event, beli (Midtrans Snap), status pesanan, tiket saya. **Bukti:** orang
  selain Edward bisa menyelesaikan alur beli tanpa dipandu.
- [ ] Halaman jual ulang — **wajib ada sebelum uji fungsional Oktober; boleh
  belum ada saat kuesioner 19 Sep** (kuesioner hanya skenario pembelian).
- [ ] Panel penyelenggara/admin — boleh diganti skrip seed (lihat §12).

## Fase G — Jalur Tembus + Kuesioner `[BATAS KERAS: 19 Sep; mundur maksimal 26 Sep]`

- [ ] Hosting publik terpasang sesuai K11; webhook Midtrans tembus dari
  internet. **Bukti:** alur beli sukses dari jaringan di luar rumah.
- [ ] **GERBANG 16 Sep:** uji tembus ujung-ke-ujung di URL publik
  (daftar → KYC → beli → bayar sandbox → NFT tercetak → tiket tampil).
- [ ] Skenario responden tertulis + kuesioner SUS 10 butir (pakai adaptasi
  bahasa Indonesia dari sumber tepercaya yang bisa dirujuk — jangan
  menerjemahkan sendiri tanpa rujukan) + formulir daring.
- [ ] Uji pilot ≥2 orang → perbaikan → **bekukan fitur 18 Sep malam**.
- [ ] Sebar kuesioner 19 Sep; pantau; cadangkan jawaban harian; pantau kuota
  Paymaster di dasbor ZeroDev selama periode responden (K8).
  **Bukti:** jumlah responden tercatat per hari.

## Fase H — Verifikasi untuk Bab 6 (Oktober, metode sesuai K9)

- [ ] Uji fungsional alur 1 (pendaftaran akun + identitas), alur 2 (pembelian),
  alur 3 (penjualan kembali) — terdokumentasi sesuai K9.
- [ ] Uji keamanan di Sepolia, dengan bukti transaksi: percobaan transfer di
  luar allowlist **gagal**; percobaan melanggar price-lock **gagal**;
  pembuktian kepemilikan NFT lewat kueri on-chain.
- [ ] Pengukuran biaya gas per fungsi (createEvent, addCategory,
  registerIdentity, mintTicket, fungsi marketplace).
- [ ] Pengukuran waktu konfirmasi minting (jumlah sampel disepakati
  pembimbing).
- [ ] Rekap kuesioner SUS: skor per responden, rata-rata, interpretasi.
- [ ] Semua penanda `[BUTUH DATA UJI]` di dokumen terisi angka hasil ukur.

## Fase I — Penulisan dan Administrasi

- [ ] Bab 4 dikunci: ERD, kamus data, dan arsitektur konsisten **satu versi**
  (dua `ENUM` yang masih "menunggu konfirmasi nilai" di kamus data terisi).
  `[TERBLOKIR K1, K3, K5, K10]`
- [ ] Draf Bab 5 selesai — **26 Sep**; setor Bab 5 — **10 Okt**.
- [ ] Titik keputusan go/no-go — **6–8 Okt** (kriteria di panduan pengerjaan).
- [ ] Setor Bab 6 — **17 Okt**; draf Bab 7 — 17 Okt.
- [ ] Rakit naskah lengkap + revisi — 18–31 Okt.
- [ ] Cek plagiarisme → ACC pembimbing → ajukan sidang — 1–7 Nov.
- [ ] LSTA — 10 Nov. Sidang — mulai 17 Nov.

---

## §11. TIDAK BOLEH DIPOTONG (terkunci di metodologi proposal)

1. Uji fungsional **tiga alur utama** (pendaftaran akun + identitas,
   pembelian, penjualan kembali).
2. Uji keamanan: percobaan transfer di luar allowlist.
3. Uji keamanan: percobaan melanggar penguncian harga (price-lock).
4. Pembuktian kepemilikan NFT.
5. Pengukuran biaya gas per fungsi.
6. Pengukuran waktu konfirmasi minting.
7. Pengujian subjek nyata dengan skenario pembelian tiket.
8. Kuesioner kemudahan penggunaan dengan instrumen SUS.

Turunan yang otomatis ikut wajib: kedua kontrak terpasang di Sepolia; alur
pembelian bisa dipakai orang lain; alur penjualan kembali berfungsi (minimal
cukup untuk diuji fungsional, tidak harus dipoles).

## §12. BOLEH DIPOTONG bila waktu habis (urutan memotong)

1. Panel penyelenggara/admin di web → ganti skrip seed.
2. Notifikasi (modul M9 di docs lama).
3. Riwayat masuk / log audit — **kecuali K4 memutuskan wajib**.
4. Penukaran tiket di lokasi acara (`markUsed`) → catat di keterbatasan.
5. Batas tiket per wallet — mengikuti K3.
6. Verifikasi alamat surel saat pendaftaran (bila skema akhirnya memang
   pakai kata sandi, sesuai ERD baru).
7. Multi-kategori per event → cukup satu kategori.
8. Polesan tampilan halaman jual ulang (fungsional minimal cukup).
9. Cloudflare Turnstile — potong paling terakhir, wajib dicatat jujur di
   keterbatasan dan tidak diklaim di Bab 4.

Apa pun di §11 tidak pernah boleh masuk daftar ini.

## §13. Asumsi dan Risiko yang Harus Diverifikasi

- Akun Midtrans sandbox + kuncinya **tidak ada jejaknya di repositori** —
  buat/verifikasi sebelum Fase E.
- Akun Pinata + kuncinya — sama, belum ada jejak.
- Layanan pengirim surel belum dipilih (hanya relevan bila verifikasi surel
  dipertahankan).
- Klaim "gas policy ZeroDev aktif" belum terbukti dari repositori — buktikan
  lewat butir bukti sponsorship di Fase D.
- Spike passkey baru membuktikan **registrasi** (pubX, pubY, authenticatorId).
  Pembuatan smart account + pengiriman UserOperation tersponsori **belum pernah
  dicoba** — risiko teknis terbesar K7.
- Foundry terpasang di `~/.foundry/bin` tapi tidak ada di PATH sesi
  non-interaktif — jalankan lewat Git Bash yang PATH-nya benar.
- Hasil kuesioner butuh aplikasi stabil: selama responden aktif, jangan ubah
  kode kecuali kerusakan fatal.
