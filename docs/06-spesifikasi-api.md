```
STATUS: DAFTAR KASAR — MENUNGGU PERSETUJUAN RANCANGAN DATABASE
```

# 06 — Spesifikasi API

**API** adalah singkatan dari *Application Programming Interface*. Dalam
konteks berkas ini, artinya **daftar titik layanan** yang disediakan server
NestJS agar bisa dipanggil tampilan web maupun layanan luar.

> ## ⚠ Berkas Ini Belum Boleh Difinalkan
>
> Titik layanan API mengambil dan menyimpan data dari tabel database. Selama
> rancangan tabel masih bisa berubah — dan
> [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) masih berstatus
> **DRAF** menunggu konsultasi pembimbing sekitar **14 Agustus 2026** — merinci
> bentuk data setiap titik layanan berarti **pekerjaan yang berpotensi
> terbuang.**
>
> **Yang ada di berkas ini:** daftar kasar titik layanan yang dibutuhkan setiap
> alur, beserta perannya masing-masing.
>
> **Yang sengaja BELUM ada:** bentuk data yang dikirim, bentuk data yang
> dikembalikan, dan daftar pesan kesalahan. Ketiganya ditambahkan setelah
> rancangan database disetujui — lihat Bagian 8.

---

## 1. Kenapa Berkas Ini Dikerjakan Terakhir

Peta ketergantungan antar dokumen menempatkan berkas ini paling belakang:

```
Arsitektur (03)
      │
      ▼
Kebutuhan fungsional (01) ──► Alur pengguna (07)
      │                              │
      ▼                              ▼
Rancangan database (04) ─── TERTAHAN ───► Spesifikasi API (06)
                            konsultasi
```

Berkas ini bergantung pada dua hal sekaligus: **alur pengguna** menentukan
titik layanan apa saja yang dibutuhkan, dan **rancangan database** menentukan
bentuk datanya. Yang pertama sudah selesai, yang kedua belum.

Karena itu **daftar titik layanan** di bawah sudah bisa disusun sekarang —
sedangkan **bentuk datanya** menunggu.

---

## 2. Kelompok Titik Layanan

| Kelompok | Alur yang dilayani | Bagian |
|---|---|---|
| A | Akun dan dompet | 3 |
| B | Identitas pengguna | 4 |
| C | Katalog event | 5 |
| D | Pembelian tiket | 6 |
| E | Kepemilikan tiket | 7 |
| F | Penjualan kembali | 8 |
| G | Manajemen event — penyelenggara | 9 |
| H | Verifikasi di lokasi acara | 10 |
| I | Notifikasi | 11 |

---

## 3. A — Akun dan Dompet

Melayani **Alur 1 tahap A dan B**. Kebutuhan: KF-01 sampai KF-06.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Pendaftaran dengan surel | Menerima alamat surel dan mengirim tautan verifikasi | KF-01, KF-02 |
| Verifikasi surel | Memeriksa tautan verifikasi dan mengaktifkan akun | KF-02 |
| Kirim ulang tautan verifikasi | Untuk kasus surel tidak sampai | Alur 1 titik gagal |
| Permintaan masuk | Mengirim tautan masuk ke surel terdaftar | KF-01 |
| Penyelesaian masuk | Memeriksa tautan masuk dan menerbitkan sesi | KF-06 |
| Keluar | Mengakhiri sesi | — |
| Data akun sendiri | Mengembalikan data akun beserta status identitas | — |

**Catatan rancangan:** pembuatan dompet **tidak menjadi titik layanan
tersendiri**. Dompet dibuat sistem secara otomatis sebagai bagian dari
verifikasi surel (Alur 1 langkah 5), tanpa pengguna perlu memicunya. Menjadikan
pembuatan dompet sebagai titik layanan terpisah akan menyiratkan bahwa pengguna
harus melakukan sesuatu — bertentangan dengan KF-03.

**Perlu diputuskan:** apa yang terjadi bila pembuatan dompet gagal sementara
akun sudah aktif. Kemungkinan besar perlu satu titik layanan internal untuk
mengulang pembuatan dompet, tapi bentuknya bergantung pada bagaimana kegagalan
itu dicatat di database.

---

## 4. B — Identitas Pengguna

Melayani **Alur 1 tahap C**. Kebutuhan: KF-07 sampai KF-12.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Pendaftaran identitas | Menerima data KTP, membangkitkan *salt*, menghitung kedua hash, **membuang data terbacanya**, lalu mencatat hash ke blockchain | KF-07 sampai KF-11 |
| Status identitas | Mengembalikan status: belum daftar, menunggu pencatatan, atau terdaftar | Alur 1 langkah 15 |

**Tiga aturan yang mengikat titik layanan ini:**

**Data KTP terbaca hanya boleh ada di dalam ingatan server selama pemrosesan**
(KF-10). Titik layanan pendaftaran menerima data KTP, menghitung `nik_indeks`
dan `hash_identitas`, lalu **membuang data terbacanya** — tidak menyimpannya ke
tabel mana pun dan tidak menuliskannya ke catatan sistem.

**Tidak ada satu pun titik layanan yang mengembalikan data KTP** (KNF-24). Titik
layanan status hanya mengembalikan **statusnya**, bukan datanya. Ini berlaku
tanpa kecuali, termasuk untuk pemiliknya sendiri — karena datanya memang sudah
tidak ada.

**Penolakan karena NIK ganda tidak boleh menyebutkan dompet mana yang
memakainya** (Alur 1 titik gagal). Menyebutkannya membocorkan keterkaitan
identitas dengan pengguna lain.

---

## 5. C — Katalog Event

Melayani **Alur 2 tahap A**. Kebutuhan: KF-21 sampai KF-24.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Daftar event | Mengembalikan event yang sedang dibuka, dengan penyaringan kategori | KF-21, KF-23 |
| Rincian event | Mengembalikan keterangan lengkap beserta kategori tiket dan sisa kuota | KF-22 |

**Catatan rancangan:** sisa kuota yang ditampilkan di sini boleh diambil dari
salinan MySQL agar cepat. Tapi **pemeriksaan kuota sebelum pembelian wajib
membaca dari blockchain** (Alur 2 langkah 9). Keduanya adalah hal berbeda dan
tidak boleh disatukan — yang satu untuk tampilan, yang lain untuk keputusan.

---

## 6. D — Pembelian Tiket

Melayani **Alur 2 tahap B sampai D**. Kebutuhan: KF-25 sampai KF-34.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Mulai pembelian | Memverifikasi token penyaring bot, memeriksa identitas, kuota, dan batas beli, lalu membuat transaksi pembayaran | KF-25 sampai KF-29 |
| **Penerimaan hasil pembayaran Midtrans** | Menerima pemberitahuan status pembayaran dari Midtrans, dan **memicu penerbitan tiket** | KF-30 sampai KF-34 |
| Status pesanan | Mengembalikan status sebuah pesanan | Alur 2 langkah 21 |

### 6.1 Titik layanan penerimaan hasil pembayaran adalah yang paling rawan

Titik layanan ini berbeda dari yang lain: **ia dipanggil Midtrans, bukan
pengguna.** Akibatnya ia terbuka untuk umum dan bisa dipanggil siapa saja.

Empat hal yang wajib ada padanya:

| Yang wajib | Kenapa | Rujukan |
|---|---|---|
| **Memastikan pemberitahuan benar berasal dari Midtrans** | Kalau tidak, siapa pun bisa mengaku sudah membayar dan memperoleh tiket gratis | KF-30 |
| **Memeriksa apakah pesanan ini sudah pernah diproses** | Midtrans mengirim ulang pemberitahuan bila balasan pertama tidak diterima bersih. Tanpa pemeriksaan ini, satu pembayaran menghasilkan beberapa tiket | KNF-21, Alur 2 langkah 15 |
| **Tetap membalas berhasil** untuk pemberitahuan yang sudah pernah diproses | Membalas gagal justru memicu pengiriman ulang tanpa henti | KNF-21 |
| **Tidak memakai data jumlah bayar dari pemberitahuan begitu saja** | Bandingkan dengan jumlah yang tercatat di pesanan | KF-30 |

**Baris ketiga sering terlewat.** Membalas "gagal" karena pesanan sudah
diproses terlihat masuk akal, tapi bagi Midtrans itu berarti pemberitahuannya
belum sampai — sehingga ia akan mengirimnya lagi, berulang-ulang.

### 6.2 Pencetakan tiket tidak menjadi titik layanan

Tidak ada titik layanan yang bisa dipanggil untuk mencetak tiket. Pencetakan
**hanya** dipicu dari dalam sistem setelah pembayaran diverifikasi (KF-30).
Menyediakan titik layanan untuk itu berarti membuka jalan memperoleh tiket tanpa
membayar.

**Yang mungkin diperlukan:** satu titik layanan internal untuk **mengulang
penerbitan tiket** bagi pesanan yang sudah lunas tapi tiketnya belum terbit
(KNF-20). Titik layanan ini tidak boleh bisa diakses pengguna.

---

## 7. E — Kepemilikan Tiket

Kebutuhan: KF-35 sampai KF-38.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Daftar tiket saya | Mengembalikan tiket milik pengguna yang sedang masuk | KF-35 |
| Rincian tiket | Mengembalikan keterangan tiket beserta `tokenId` dan alamat kontrak untuk pembuktian mandiri | KF-36, KF-37 |

---

## 8. F — Penjualan Kembali

Melayani **Alur 3**. Kebutuhan: KF-39 sampai KF-47.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Daftar tiket yang dijual kembali | Mengembalikan penawaran yang sedang aktif | KF-43 |
| **Buat penawaran** | Membaca `originalPrice` dari blockchain lalu mencatat penawaran | KF-39, KF-40, KF-41 |
| Batalkan penawaran | Membatalkan penawaran yang belum terjual | KF-42 |
| **Mulai pembelian tiket jual ulang** | Memeriksa identitas pembeli, **mengunci penawaran**, lalu membuat transaksi pembayaran | KF-46, **KF-56** |
| Daftarkan rekening penjual | Menerima data rekening bank tujuan pencairan dana | **KF-58** |
| Daftar rekening saya | Mengembalikan rekening yang sudah didaftarkan | **KF-58** |
| Status pencairan dana | Mengembalikan status penerusan uang ke penjual | **KF-59** |

### 8.1 Penguncian penawaran adalah bagian dari titik layanan, bukan langkah terpisah

**Tidak ada titik layanan tersendiri untuk mengunci penawaran.** Penguncian
terjadi **di dalam** titik layanan "mulai pembelian tiket jual ulang", dalam
satu transaksi database yang sama dengan pemeriksaan statusnya (KF-56).

**Kenapa tidak dipisah:** kalau mengunci menjadi titik layanan tersendiri, ada
jeda antara pemeriksaan status dan penguncian — dan justru di jeda itulah dua
pembeli bisa sama-sama lolos. Menyatukannya menghapus jeda tersebut.

**Pelepasan kunci juga bukan titik layanan** (KF-57). Kunci dilepas oleh sistem
sendiri: saat pembayaran dinyatakan gagal, atau saat batas waktunya terlewati.

### 8.2 Pencairan dana bukan titik layanan yang bisa dipanggil

Sama seperti pencetakan tiket, **penerusan uang ke penjual tidak boleh bisa
dipicu dari luar**. Ia hanya dijalankan sistem setelah kepemilikan tiket
benar-benar berpindah di blockchain (KF-59).

Titik layanan "status pencairan dana" hanya **membaca**, tidak memicu apa pun.

**Aturan yang paling menentukan di kelompok ini:**

> **Titik layanan "buat penawaran" TIDAK BOLEH menerima harga sebagai masukan.**

Harga dibaca dari `originalPrice` di blockchain. Kalau harga diterima sebagai
masukan lalu diperiksa, masih ada jalan bagi kesalahan kode untuk meloloskannya.
Tidak menerimanya sama sekali membuat penyimpangan harga **tidak mungkin
dinyatakan** (KF-40).

**Pemberitahuan pembayaran untuk pembelian tiket jual ulang** memakai titik
layanan yang sama dengan Bagian 6, dibedakan lewat jenis pesanan. Ini disengaja:
kedua alur punya kerawanan yang sama, dan menyatukannya membuat perlindungan
tidak perlu ditulis dua kali di dua tempat yang bisa berbeda perlakuan.

---

## 9. G — Manajemen Event

Melayani **Alur pendukung 6.1**. Kebutuhan: KF-13 sampai KF-20.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Buat event | Menerima keterangan event, mengunggah ke IPFS, mencatat di blockchain | KF-14, KF-15 |
| Tambah kategori tiket | Menambahkan kategori beserta harga dan kuota | KF-16, KF-17, KF-18 |
| Buka atau tutup penjualan | Mengubah status penjualan event | — |
| Daftar event saya | Mengembalikan event milik penyelenggara yang sedang masuk | KF-20 |
| Rekapitulasi penjualan | Mengembalikan jumlah terjual, sisa kuota, dan jumlah tiket yang sedang ditawarkan | KF-20 |

**Seluruh titik layanan di kelompok ini wajib memeriksa** bahwa pemanggilnya
adalah penyelenggara yang berwenang atas event tersebut — bukan sekadar
penyelenggara mana pun.

---

## 10. H — Verifikasi di Lokasi Acara

Melayani **Alur pendukung 6.2**. Kebutuhan: KF-48 sampai KF-51.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Periksa tiket | Membaca kepemilikan dan status pemakaian dari blockchain | KF-48, KF-50 |
| **Cocokkan identitas** | Menerima NIK yang dimasukkan petugas, membandingkan sidik jari digitalnya, mengembalikan **cocok atau tidak cocok** | KF-51 |
| Tandai tiket terpakai | Mencatat penandaan di blockchain | KF-49 |

### 10.1 Arah titik layanan identitas dibalik

Rancangan sebelumnya menyediakan titik layanan yang **mengembalikan data KTP
terdaftar**. Titik layanan itu **sudah dihapus** — data KTP tidak lagi tersimpan
dalam bentuk terbaca (KF-10), sehingga tidak ada yang bisa dikembalikan.

Penggantinya bekerja sebaliknya: **petugas yang mengirim data, sistem yang
menjawab cocok atau tidak.**

| | Titik layanan lama (dihapus) | **Titik layanan baru** |
|---|---|---|
| Arah data | Sistem → petugas | **Petugas → sistem** |
| Yang dikembalikan | Identitas lengkap | **Satu jawaban: cocok atau tidak** |
| Bila disalahgunakan | Identitas pengguna bocor | Penyerang harus sudah tahu NIK-nya untuk menebak |

**Penjagaan yang tetap diperlukan:**

- Hanya boleh diakses akun berperan petugas.
- Sebaiknya hanya untuk event yang sedang berlangsung.
- **Setiap pemanggilan wajib dicatat.** Meskipun titik layanan ini tidak
  membocorkan identitas, ia tetap bisa dipakai untuk **memastikan tebakan** —
  seseorang yang menduga NIK tertentu milik pengguna tertentu bisa
  mengonfirmasinya lewat sini. Karena itu jumlah percobaan perlu dibatasi.

**Perlu diputuskan saat konsultasi:** apakah petugas perlu ditugaskan secara
khusus per event, atau cukup berperan petugas secara umum. Pertanyaan ini
tercatat di [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md)
Bagian 18.2 nomor 5.

**Urutan yang wajib dipatuhi:** penandaan tiket terpakai dilakukan **setelah**
pencocokan identitas berhasil (Alur 6.2 langkah 6). Kalau dibalik, tiket sudah
hangus padahal pemilik sahnya mungkin datang kemudian.

---

## 11. I — Notifikasi

Kebutuhan: KF-52 sampai KF-55.

| Titik layanan | Perannya | Kebutuhan |
|---|---|---|
| Daftar notifikasi | Mengembalikan notifikasi milik pengguna | KF-55 |
| Tandai sudah dibaca | Menandai satu atau semua notifikasi | KF-55 |

---

## 12. Yang Akan Ditambahkan Setelah Database Disetujui

Berkas ini menjadi lengkap setelah
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) berstatus
disetujui. Yang perlu ditambahkan:

| Yang ditambahkan | Kenapa menunggu database |
|---|---|
| **Cara pemanggilan** — metode dan alamat setiap titik layanan | Tidak bergantung database, tapi ditulis sekaligus agar tidak dikerjakan dua kali |
| **Data yang dikirim** — nama dan jenis setiap masukan | Bentuknya mengikuti kolom tabel |
| **Data yang dikembalikan** | Bentuknya mengikuti kolom tabel |
| **Daftar pesan kesalahan** beserta artinya | Bergantung pada aturan dan kunci unik yang berlaku di database |
| **Ketentuan hak akses** setiap titik layanan | Bergantung pada rancangan akhir tabel `pengguna` dan `penyelenggara` |

**Pesan kesalahan wajib memenuhi KNF-16:** menyebutkan penyebabnya dan langkah
yang harus diambil pengguna, ditulis dalam Bahasa Indonesia.

---

## 13. Aturan yang Sudah Berlaku Sekarang

Beberapa hal **tidak bergantung pada rancangan database**, sehingga sudah bisa
ditetapkan dan tidak akan berubah setelah konsultasi.

| Aturan | Rujukan |
|---|---|
| Seluruh komunikasi memakai HTTPS | KNF-31 |
| Token penyaring bot diverifikasi **di server**, sekali pakai, dan ditolak bila kedaluwarsa | KF-26, KNF-32 |
| **Tidak ada titik layanan yang mengembalikan kunci penandatangan sistem** dalam bentuk apa pun | KNF-26 |
| **Tidak ada titik layanan yang mengembalikan data KTP** — tanpa kecuali, termasuk untuk pemiliknya sendiri | KF-10, KNF-24 |
| **Tidak ada titik layanan yang bisa memicu pencetakan tiket secara langsung** | KF-30 |
| **Tidak ada titik layanan yang bisa memicu pencairan dana secara langsung** | KF-59 |
| **Tidak ada titik layanan yang menerima harga jual ulang sebagai masukan** | KF-40 |
| Keputusan yang menyangkut kepemilikan, harga, dan kuota **dibaca dari blockchain**, bukan dari salinan MySQL | KNF-03, KF-38 |
| Pemberitahuan pembayaran yang berulang **tidak menghasilkan tiket ganda** | KNF-21 |

**Enam baris yang dimulai dengan "tidak ada" adalah larangan, bukan fitur.**
Keenamnya menjadi daftar periksa saat menelaah kode: bila salah satu dilanggar,
ada celah yang terbuka — sekalipun seluruh titik layanan berjalan normal.
