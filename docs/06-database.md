# 06 — Database

## Perumpamaan: papan pengumuman vs lemari arsip

- **Blockchain** = papan pengumuman di alun-alun. Semua orang bisa baca,
  tidak bisa dihapus, dan **mahal** tiap kali menempel kertas baru.
- **Database MySQL** = lemari arsip di kantor. Murah, rahasia, bisa
  dikoreksi.

Aturannya: yang **harus tidak bisa diakali siapa pun** → papan. Sisanya →
lemari. Dan kalau lemari dan papan beda, **yang benar papan**. Kolom yang
cuma "salinan" dari blockchain tidak boleh jadi dasar keputusan soal siapa
pemilik tiket, berapa harganya, atau berapa kuotanya.

## Sumber rancangan

Rancangan terbaru: **`design/erd-nft.mwb`** (MySQL Workbench, 25 Agustus
2026). Gambar versi 24 Agustus: `design/erd-nft-revisi-24-8.png`. Ciri
rancangan ini: nama tabel bahasa Inggris, dan tiga jenis akun dipisah jadi
tabel sendiri (`admins`, `customers`, `organizers`) yang menempel ke `users`.

Rancangan lama (nama Indonesia, tanpa kata sandi, KYC dua hash) ada di
`arsip/04-rancangan-database-erd.md` — riwayat saja.

## Tabel-tabelnya, dalam bahasa manusia

Kolom persisnya lihat berkas `.mwb`; di sini artinya.

| Tabel | Isinya |
|---|---|
| `users` | Akun: email, kata sandi (disimpan sebagai hash), nama tampilan (🔶 harus unik atau tidak?) |
| `customers` | Data pembeli: alamat dompet, hash 12 kata pemulihan |
| `organizers` | Penyelenggara: nama organisasi, status (menunggu / disetujui / ditolak), admin yang menyetujui, kata sandi sendiri. 🔶 seberapa formal verifikasinya |
| `admins` | Akun admin |
| `passkey_credentials` | "Gembok" passkey: credential id, kunci publik, counter anti-ulang. 🔶 arah disepakati: simpan salinan penuh; kunci publik dua kolom (`pub_x`, `pub_y`) atau satu — disarankan dua |
| `kyc_records` | 🔶 **Menunggu keputusan 7 September.** Versi 25 Agustus: nama lengkap terbaca, hash NIK (unik), foto KTP, tanggal verifikasi. Versi 7 Agustus: hanya hash + salt, tanpa satu pun data terbaca |
| `events` | Nama, tanggal, lokasi, kategori (daftar nilainya belum ditetapkan), kapasitas, gambar (alamat IPFS), nomor event di blockchain |
| `ticket_categories` | Nama kategori, harga, kuota |
| `ticket_cache` | **Salinan** tiket dari blockchain: nomor tiket, pemilik, harga asli, sudah dipakai?, waktu terakhir disinkron. **Bukan sumber kebenaran** |
| `orders` | Pesanan: jumlah, total, id transaksi Midtrans, status (daftar nilainya belum ditetapkan), biaya admin |
| `resale_listings` | Penawaran jual ulang: penjual, harga terkunci, status, pembeli, id transaksi Midtrans pembeli, biaya admin |
| `notifications` | Pemberitahuan ke pengguna |

## Yang belum ada atau belum putus

- Daftar nilai untuk **kategori event** dan **status pesanan** (kamus data
  menulis "menunggu konfirmasi nilai").
- **Nama tampilan** unik atau tidak.
- **Log audit / riwayat masuk** — tidak ada tabelnya. 🔶 Dituntut konsentrasi
  Network & Cyber Security atau tidak?
- **Pencairan dana ke penjual** — rancangan lama punya tabel rekening dan
  pencairan; rancangan baru **tidak**. Perlu keputusan sebelum alur jual
  ulang dibangun penuh.
- Rancangan ini **belum dinyatakan final** oleh pembimbing. Jangan menulis
  migrasi sebelum butir-butir di atas putus.

## Untuk developer

NestJS 11 + TypeORM 1.x (pakai `DataSource`; `createConnection` dan
`getRepository` sudah dihapus) + `mysql2`. Migrasi dibuat dari rancangan final
**satu versi** — jangan mencampur versi 24 dan 25 Agustus. Kolom salinan
ditandai jelas di entity supaya tidak ada yang tergoda memakainya sebagai
acuan.
