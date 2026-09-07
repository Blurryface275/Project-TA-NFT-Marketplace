# 02 — Fitur Sistem

Daftar semua yang bisa dilakukan, dikelompokkan **per siapa yang memakai**.
Kolom status jujur: ✅ sudah ada di kode, 🚧 belum, 🔶 bentuknya masih
dibahas dengan dosen.

**Keadaan 2 September 2026:** yang ✅ baru sebagian `TicketContract.sol`, dan
itu pun **belum diuji**. Situs web dan server belum ada sama sekali.

## Pembeli tiket

| Fitur | Penjelasan singkat | Status |
|---|---|---|
| Daftar akun | Email + kata sandi, seperti situs biasa | 🚧 |
| Buat dompet lewat passkey | Sekali sentuh sidik jari/wajah, dompet blockchain jadi. Tidak ada 12 kata rahasia, tidak ada aplikasi tambahan | 🚧 (dicoba di `spike-next/`) |
| Daftarkan identitas KTP | Isi data KTP sekali. Satu KTP = satu dompet = satu orang | 🔶 bentuk penyimpanannya belum putus |
| Lihat katalog event | Daftar event yang sedang buka penjualan, bisa disaring per kategori | 🚧 |
| Lihat detail event | Nama, tanggal, lokasi, kategori tiket, harga, **sisa kuota** — keterangannya diambil dari IPFS | 🚧 |
| Beli tiket | Lolos satpam bot → bayar di Midtrans → tiket dicetak otomatis ke dompetmu | 🚧 |
| Lihat tiket saya | Daftar tiket + rincian dan gambarnya | 🚧 |
| Buktikan tiket asli sendiri | Nomor tiket (`tokenId`) + alamat kontrak bisa dicek siapa pun di Etherscan Sepolia — tanpa percaya pada kami | 🚧 |
| Jual ulang tiket | Tawarkan lewat loket resmi. **Tidak ada kolom harga** — harganya otomatis = harga beli awal | 🚧 |
| Batalkan penawaran | Selama belum terjual | 🚧 |
| Beli tiket jual ulang | Bayar tepat harga asli lewat Midtrans; kepemilikan pindah di blockchain | 🚧 |
| Notifikasi | Status bayar, tiket tercetak, tiket terjual | 🚧 (boleh dipotong) |
| Pulihkan dompet | Tambah perangkat baru (disetujui perangkat lama), atau 12 kata darurat | 🚧 |

## Penyelenggara acara

| Fitur | Penjelasan singkat | Status |
|---|---|---|
| Akun penyelenggara | Terpisah dari akun pembeli, disetujui admin | 🔶 seberapa formal verifikasinya |
| Buat event | Nama, tanggal, lokasi, kategori, kapasitas, gambar | ✅ di kontrak (`createEvent`), 🚧 di web |
| Kategori tiket | Tiap event bisa punya beberapa kategori (harga + kuota masing-masing) | ✅ di kontrak (`addCategory`), 🚧 di web |
| Kuota dipatok di blockchain | Terjual tidak bisa melebihi kuota — bahkan oleh pengelola sistem | ✅ tersimpan, 🚧 penegakan saat cetak |
| Batas tiket per dompet | Satu dompet maksimal N tiket per event | ✅ di kontrak, 🔶 masih dipertahankan? |
| Buka/tutup penjualan | Sakelar per event | ✅ (`setSalesOpen`) |
| Rekap penjualan | Terjual, sisa kuota, yang sedang ditawarkan ulang | 🚧 |

## Petugas di lokasi acara

| Fitur | Penjelasan singkat | Status |
|---|---|---|
| Cek tiket asli & pemiliknya | Dibaca langsung dari blockchain | 🚧 |
| Tandai tiket terpakai | Dicatat di blockchain, satu tiket tidak bisa masuk dua kali | 🚧 (boleh ditunda sampai setelah kuesioner) |
| Cocokkan identitas pemegang tiket | Bentuknya tergantung skema KTP: lihat foto/nama, atau ketik NIK dan sistem jawab cocok/tidak | 🔶 |

## Admin

| Fitur | Penjelasan singkat | Status |
|---|---|---|
| Setujui penyelenggara | Status menunggu → disetujui / ditolak | 🚧 |
| Verifikasi KTP | Hanya ada kalau skema KTP-nya versi terbaca + foto | 🔶 |

## Yang dikerjakan sistem sendiri (tanpa diminta)

| Fitur | Kenapa penting | Status |
|---|---|---|
| Cetak tiket hanya setelah Midtrans bilang lunas | Kalau bisa dipicu dari peramban, siapa pun bisa mengaku sudah bayar | 🚧 |
| Tolak tanda terima Midtrans ganda | Kasir kadang mengirim tanda terima dua kali; satu pembayaran harus tetap satu tiket | 🚧 |
| Unggah keterangan ke IPFS **sebelum** cetak | Supaya tidak ada tiket yang menunjuk ke alamat kosong | 🚧 |
| Beri stempel izin cetak (EIP-712) | Smart contract menolak cetak tanpa stempel sah | 🚧 |
| Tanggung biaya transaksi | Lewat sponsor gas ZeroDev; pengguna tidak butuh koin | 🚧 (kode percobaan ada, hasil belum tercatat) |
| Simpan salinan tiket ke database | Untuk tampilan cepat — **bukan** acuan kepemilikan | 🚧 |
| Alamat tujuan & stempel bisa diganti pemilik kontrak | `setMarketplace`, `setSystemSigner` | ✅ |

## Kalau waktu habis, urutan yang boleh dipotong

Ada di `TASKS.md` bagian "boleh dipotong". Yang **tidak boleh** dipotong
karena terkunci di metodologi skripsi: tiga alur utama (daftar, beli, jual
ulang), uji keamanan transfer di luar loket dan pelanggaran harga, bukti
kepemilikan, pengukuran gas dan waktu cetak, kuesioner ke orang nyata.
