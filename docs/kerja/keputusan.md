# Log Keputusan (K1–K11)

> **Berkas kerja — tidak pernah masuk buku tugas akhir.**
> Satu bagian per keputusan: konteks, opsi beserta akibatnya, usulan asisten
> (usulan, bukan keputusan — yang memutuskan Edward dan pembimbing), dan hasil.
> Berkas ini sekaligus **bahan konsultasi Senin 7 dan 14 September 2026**.
>
> Setelah sebuah keputusan putus: isi baris **Hasil** + tanggal, lalu perbarui
> `TASKS.md` Bagian 0 dan `CLAUDE.md`, dan catat di `catatan-konsultasi.md`.

## Status ringkas

| No | Topik | Target | Status |
|---|---|---|---|
| K1 | Formalitas verifikasi penyelenggara | 7 Sep | BELUM PUTUS |
| K2 | Listing jual ulang on-chain atau tidak | 7 Sep | BELUM PUTUS |
| K3 | Batas tiket per wallet | 7 Sep | BELUM PUTUS |
| K4 | Log audit dituntut konsentrasi? | 7 Sep (boleh 14 Sep) | BELUM PUTUS |
| K5 | `username` unik? | 7 Sep | BELUM PUTUS |
| K6 | Passkey server ZeroDev vs tabel `passkey_credentials` | 7 Sep | BELUM PUTUS |
| K7 | EOA relay vs UserOperation ERC-4337 | 7 Sep (usulan) | BELUM PUTUS |
| K8 | Kuota Paymaster habis setelah pembayaran | 14 Sep | BELUM PUTUS |
| K9 | Metode dokumentasi uji fungsional Bab 6 | 14 Sep | BELUM PUTUS |
| K10 | **Skema KYC mana yang berlaku** | **7 Sep** | BELUM PUTUS |
| K11 | Hosting publik untuk kuesioner | ≤10 Sep (putusan sendiri) | BELUM PUTUS |

---

## K1 — Seberapa formal verifikasi dokumen penyelenggara event

**Konteks:** ERD terbaru sudah punya `organizers.status`
(pending/approved/rejected), `verified_by` → admins, dan email + password
untuk penyelenggara. Metodologi proposal tidak menguji proses ini.

**Opsi & akibat:**
- (a) Formal: penyelenggara mengunggah dokumen legalitas, admin memeriksa →
  butuh penyimpanan berkas + layar tambahan.
- (b) Persetujuan admin tanpa unggah dokumen → kolom ERD yang ada sudah cukup.

**Usulan asisten:** (b) untuk tugas akhir; verifikasi dokumen formal dicatat
sebagai saran pengembangan di Bab 7.

**Hasil:** _BELUM PUTUS._

## K2 — Listing jual ulang: transaksi on-chain terpisah, atau cukup `executeResale()` on-chain

**Konteks:** penguncian harga tetap ditegakkan saat eksekusi, model mana pun.
Pembeli jual-ulang membayar lewat Midtrans (rupiah) — ERD sudah punya
`resale_listings.buyer_midtrans_transaction_id` — jadi "pembelian" tidak
pernah sepenuhnya on-chain; yang on-chain adalah perpindahan NFT.

**Opsi & akibat:**
- (a) Listing on-chain: setiap pasang/batal listing = transaksi bergas,
  kontrak lebih besar (status listing di kontrak, mungkin escrow).
  Nilai demonstrasi blockchain lebih besar; perkiraan +2–3 hari kerja.
- (b) Listing dicatat di MySQL, hanya `executeResale()` on-chain: kontrak
  kecil (periksa izin EIP-712 → pindahkan NFT lewat jalur allowlist →
  catat). Klaim keamanan inti (allowlist + price-lock) tetap on-chain penuh.

**Usulan asisten:** (b) — lebih sedikit kode dan gas, jadwal 19 Sep lebih aman.

**Hasil:** _BELUM PUTUS._ ⚠ Memblokir seluruh `MarketplaceContract.sol`.

## K3 — Batas tiket per wallet masih berlaku?

**Konteks:** alasan lama (flash sale) sudah hilang. Tapi kontrak **sudah
telanjur** punya `maxPerWallet` (wajib > 0 di `createEvent`) dan
`walletPurchases`. Tanpa commit-reveal, batas per wallet adalah satu-satunya
rem pemborongan di lapisan kontrak; KTP membatasi satu identitas per wallet,
`maxPerWallet` membatasi jumlah tiket per wallet.

**Usulan asisten:** pertahankan — kodenya sudah ada, menghapus justru kerja
tambahan dan melemahkan cerita anti-calo.

**Hasil:** _BELUM PUTUS._ ⚠ Memblokir `mintTicket()`.

## K4 — Apakah log audit dituntut konsentrasi Network & Cyber Security

**Konteks:** ERD terbaru tidak punya tabel riwayat masuk (versi docs lama
punya, KF-06). Perlu jawaban pembimbing, bukan tebakan.

**Usulan asisten:** tanyakan eksplisit. Kalau wajib → satu tabel log sederhana
(siapa, kapan, aksi apa) — murah. Kalau tidak → catat di keterbatasan.

**Hasil:** _BELUM PUTUS._

## K5 — Kolom `username` perlu batasan unik?

**Konteks:** kamus data Bab 4 menyebut `username` = "nama tampilan pengguna";
login memakai email (yang sudah unik).

**Usulan asisten:** kalau `username` hanya tampilan → tidak perlu unik; kalau
dipakai untuk disebut publik/pencarian → unik. Dua-duanya murah sekarang,
mahal kalau diubah setelah data terisi.

**Hasil:** _BELUM PUTUS._ ⚠ Memblokir migrasi database.

## K6 — Peran passkey server ZeroDev terhadap tabel `passkey_credentials`

**Konteks:** spike memakai `passkeyServerUrl` ZeroDev — artinya ZeroDev
menyimpan credential passkey di servernya. Tabel `passkey_credentials` MySQL
menyimpan hal serupa (`credential_id`, `public_key`, `counter`).

**Opsi & akibat:**
- (a) Hapus tabel — ZeroDev satu-satunya sumber kebenaran.
- (b) Tabel = cermin metadata (daftar "perangkat terdaftar", deteksi ganda),
  verifikasi kriptografis tetap di ZeroDev/dompet.
- (c) Verifikasi WebAuthn mandiri di backend tanpa passkey server ZeroDev —
  paling berat, praktis menulis ulang sebagian kerja ZeroDev.

**Usulan asisten:** (b), dan jelaskan pembagian perannya di Bab 4.

**Hasil:** _BELUM PUTUS._

## K7 — Backend kirim transaksi: EOA biasa, atau merelay UserOperation ERC-4337

**Konteks:** `design/desain-blockchain-2.png` condong ke UserOperation lewat
backend (pengguna → backend → bundler → EntryPoint → kontrak + Paymaster
ZeroDev). Spike passkey baru membuktikan **registrasi**; pembuatan smart
account + pengiriman UserOperation tersponsori **belum pernah dicoba** — ini
risiko teknis terbesar. Menentukan seberapa dalam ERC-4337 dipakai dan klaim
Paymaster di Bab 4.

**Opsi & akibat:**
- (a) UserOperation penuh (dompet pengguna menandatangani, Paymaster
  mensponsori) — paling sesuai klaim CLAUDE.md 4.8, paling berisiko waktu.
- (b) EOA backend mengirim semua transaksi; smart account pengguna hanya
  penerima NFT — tercepat, tapi Paymaster praktis tak terpakai dan Bab 4
  harus ditulis ulang jujur.
- (c) Campuran: mint oleh EOA sistem; perpindahan jual-ulang oleh marketplace
  lewat allowlist (tanpa tanda tangan dompet pengguna); persetujuan pengguna
  direkam lewat login passkey di aplikasi.

**Usulan asisten:** putuskan arah 7 Sep; uji kelayakan (a) lewat percobaan
lanjutan paling lambat 10 Sep (buat smart account + kirim 1 UserOperation
tersponsori di Sepolia). Gagal → jatuh ke (b)/(c) untuk kuesioner, tulis
jujur di keterbatasan.

**Hasil:** _BELUM PUTUS._ ⚠ Memblokir modul koneksi blockchain backend.

## K8 — Kuota sponsorship Paymaster habis setelah pembayaran Midtrans diterima

**Konteks:** pembayaran sukses tapi gas gagal disponsori → pengguna sudah
"bayar" (sandbox), tiket belum tercetak.

**Usulan prosedur:** (1) UI tidak pernah menjanjikan tiket instan — status
"sedang diterbitkan"; (2) antrean mint di backend dengan pengulangan
otomatis; (3) selama periode kuesioner, cek kuota di dasbor ZeroDev tiap
pagi; (4) cadangan: EOA sistem diisi ETH Sepolia agar bisa mengirim
transaksi biasa bila sponsorship mati.

**Hasil:** _BELUM PUTUS._

## K9 — Metode dokumentasi uji fungsional Bab 6

**Catatan tegas:** test Foundry per fungsi dan test API per modul **wajib dan
berjalan sejak awal** — bukan bagian keputusan ini.

**Opsi & akibat:**
- (a) Otomasi alur ujung-ke-ujung — bukti kuat, mahal waktu.
- (b) Manual berbasis skenario: tabel langkah–hasil harapan–hasil nyata +
  tangkapan layar + hash transaksi — cepat, bentuknya langsung cocok untuk
  Bab 6.

**Usulan asisten:** (b), diperkuat lampiran keluaran `forge test` dan test API
otomatis yang memang sudah ada.

**Hasil:** _BELUM PUTUS._ (Eksekusi pengujian tetap Oktober.)

## K10 — SKEMA KYC MANA YANG BERLAKU ⚠ paling penting

**Fakta: dua versi bertentangan hidup berdampingan di repositori.**

| | Versi (a) — CLAUDE.md 4.4 + docs lama (7 Agu) | Versi (b) — ERD 24–25 Agu + kamus data Bab 4 |
|---|---|---|
| Yang disimpan | `keccak256(NIK+nama+tgl lahir+salt)` on-chain; `salt` + `keccak256(NIK+pepper)` di MySQL; **tidak ada data terbaca di mana pun** | `full_name` **terbaca**, `ktp_photo` (path foto KTP), satu `nik_hash`, `verified_at`; plus `users.password` |
| Verifikasi | Otomatis lewat pencocokan hash; di venue petugas memasukkan NIK | Manual — admin melihat foto KTP |
| Kekuatan | Privasi kuat; narasi keamanan Bab 4 kuat untuk konsentrasi Network & Cyber Security | Sederhana dibangun; verifikasi manusiawi |
| Kelemahan | Tidak bisa menampilkan data ke siapa pun; wajib menjaga salt + pepper; salah ketik NIK = hash beda | Menyimpan data KTP terbaca + foto = risiko bocor nyata; **meruntuhkan klaim "tidak ada data terbaca"** di docs/09 dan sebagian argumen keamanan Bab 4; wajib membahas enkripsi saat disimpan, retensi, dan kontrol akses |

**Usulan asisten:** bawa tabel ini ke pembimbing 7 Sep dan putuskan sadar.
Jangan implementasi versi mana pun sebelum putus. Kalau (b) menang: jadwalkan
revisi docs 01/03/04/05/07/09 + CLAUDE.md 4.4 + narasi Bab 4.

**Hasil:** _BELUM PUTUS._ ⚠ Memblokir `registerIdentity()`, modul KYC
backend, dan penulisan ulang Bab 4.

## K11 — Hosting publik untuk kuesioner 19 September

**Kebutuhan:** URL publik untuk responden; backend menerima webhook Midtrans
dari internet (bukan tunnel sementara); MySQL; `.env` aman di server.

**Kandidat (verifikasi harga/kuota saat memutuskan, jangan dari ingatan):**
frontend Next.js di Vercel; backend NestJS + MySQL di VPS kecil atau layanan
seperti Railway/Render; MySQL bisa juga layanan terkelola. Kriteria: webhook
stabil, biaya ringan untuk ±2 bulan, gampang redeploy.

**Hasil:** _BELUM PUTUS._ Batas: 10 Sep.
