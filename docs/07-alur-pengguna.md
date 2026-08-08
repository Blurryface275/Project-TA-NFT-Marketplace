# 07 — Alur Pengguna

Berkas ini menguraikan **langkah demi langkah** bagaimana sistem dipakai, dari
sudut pandang orang yang memakainya. Setiap alur adalah rangkaian dari fitur
yang sudah didaftar di
[`01-kebutuhan-fungsional.md`](01-kebutuhan-fungsional.md).

Alasan di balik rancangan tiap langkah tidak diulang di sini — ada di
[`03-arsitektur-sistem.md`](03-arsitektur-sistem.md).

---

## 1. Jumlah Alur Utama: Tiga

Sistem ini punya **tiga alur utama**:

| No | Alur | Bagian |
|---|---|---|
| 1 | Pendaftaran akun dan identitas | 3 |
| 2 | Pembelian tiket | 4 |
| 3 | Penjualan kembali tiket | 5 |

> **Perbedaan dengan proposal awal:** proposal menyebut **empat** alur utama
> karena masih memasukkan *flash sale*. Alur itu **sudah dihapus** bersama
> *commit-reveal*, sehingga alur utama sekarang tinggal **tiga**. Alasannya ada
> di [`03-arsitektur-sistem.md`](03-arsitektur-sistem.md) Bagian 4.3.

Selain ketiganya ada **alur pendukung** — penukaran tiket di lokasi acara dan
pembuatan event oleh penyelenggara. Keduanya dibahas di Bagian 6, dan **tidak
dihitung sebagai alur utama** karena bukan bagian dari perjalanan pembeli tiket.

---

## 2. Cara Membaca Diagram

Setiap langkah diberi keterangan **di lapisan mana langkah itu terjadi**:

| Tanda | Artinya |
|---|---|
| `[P]` | Pengguna — tindakan manusia |
| `[W]` | Tampilan web (Next.js) |
| `[S]` | Server (NestJS) |
| `[B]` | Blockchain (Sepolia Testnet) |
| `[L]` | Layanan luar — Midtrans, Pinata, Cloudflare |

Langkah bertanda **⚠** adalah **titik yang menentukan keamanan**. Kalau
langkahnya dilewati atau urutannya diubah, ada celah yang terbuka.

---

## 3. Alur 1 — Pendaftaran Akun dan Identitas

**Aktor:** Pengguna
**Prasyarat:** tidak ada
**Hasil akhir:** pengguna punya akun aktif, dompet blockchain, dan identitas
terdaftar — siap membeli tiket
**Kebutuhan tercakup:** KF-01 sampai KF-12

### 3.1 Langkah

**Tahap A — Pendaftaran akun**

```
 1. [P] Membuka halaman pendaftaran dan mengisi alamat surel
 2. [S] Mengirim tautan verifikasi ke alamat surel tersebut
 3. [P] Membuka tautan verifikasi dari kotak masuk surel
 4. [S] Memastikan tautan sah dan belum kedaluwarsa → akun diaktifkan
```

**Tahap B — Pembuatan dompet otomatis**

```
 5. [S] Membuat smart account ERC-4337 lewat ZeroDev SDK
 6. [S] Menyimpan alamat dompet ke MySQL, terhubung ke akun pengguna
 7. [W] Menampilkan pemberitahuan bahwa akun siap dipakai
```

**Tahap C — Pendaftaran identitas**

```
 8. [P] Mengisi data Kartu Tanda Penduduk:
        Nomor Induk Kependudukan, nama lengkap, tanggal lahir
 9. [S] Menghitung nik_indeks = keccak256(NIK + pepper sistem)        ⚠
10. [S] Memeriksa apakah nik_indeks itu sudah terikat pada dompet lain ⚠
        → bila sudah, permintaan ditolak dan alur berhenti di sini
11. [S] Membangkitkan salt acak khusus untuk pengguna ini             ⚠
12. [S] Menghitung hash_identitas =
        keccak256(NIK + nama + tanggal lahir + salt)
13. [S] Menyimpan nik_indeks, salt, dan hash_identitas ke MySQL       ⚠
        → statusnya masih "menunggu pencatatan"
        → DATA KTP TERBACA DIBUANG DI SINI, tidak disimpan ke mana pun
14. [B] Mengirim hash_identitas ke TicketContract
        → biaya gas ditanggung sistem lewat Paymaster
15. [S] Mengubah status identitas menjadi "terdaftar"
16. [W] Menampilkan pemberitahuan bahwa pengguna sudah boleh membeli tiket
```

### 3.2 Empat hal yang menentukan pada alur ini

**Langkah 5 — pengguna tidak melakukan apa pun.** Dompet dibuat sistem tanpa
pengguna diminta memasang apa pun, mencatat frasa rahasia, atau menyiapkan
saldo. Dari sudut pandang pengguna, ia hanya mendaftar dengan surel seperti di
situs biasa. Inilah wujud nyata KF-03 dan KF-04.

**Langkah 10 mendahului langkah 11 dengan sengaja.** Pemeriksaan NIK ganda
dilakukan **sebelum** *salt* dibangkitkan dan apa pun disimpan. Kalau urutannya
terbalik, sistem sempat menyimpan data untuk pendaftaran yang pada akhirnya
ditolak.

**Langkah 13 harus mendahului langkah 14, dan ini penting.** *Salt* wajib
tersimpan lebih dulu sebelum hash-nya dicatat di blockchain. Alasannya: hash
tidak bisa dibalik. Kalau hash sudah tercatat permanen di blockchain sementara
*salt*-nya hilang karena penyimpanan gagal, **tidak ada cara apa pun untuk
mencocokkan data KTP dengan hash tersebut** — dan hash itu tidak bisa dihapus
dari blockchain. Identitas pengguna itu menjadi macet permanen.

**Langkah 13 juga titik di mana data KTP terbaca dibuang** (KF-10). Setelah
kedua hash dihitung, data aslinya tidak lagi diperlukan sistem untuk keperluan
apa pun. Menyimpannya "untuk berjaga-jaga" adalah pelanggaran KNF-24, dan
justru mengembalikan risiko kebocoran yang ingin dihapus.

**Langkah 15 memisahkan "tersimpan" dari "terdaftar".** Selama hash belum
tercatat di blockchain, identitas belum dianggap sah. Pemisahan ini yang
memungkinkan langkah 14 diulang tanpa mengulang seluruh alur bila transaksi
blockchain gagal.

**Kenapa ada dua hash yang dihitung** (langkah 9 dan 12): `nik_indeks` sengaja
dibuat **tetap** — memakai *pepper* yang sama untuk semua pengguna — supaya NIK
yang sama selalu menghasilkan nilai yang sama dan pendaftaran ganda bisa
dideteksi. `hash_identitas` memakai *salt* per pengguna karena nilainya tercatat
**permanen dan terbuka untuk umum** di blockchain, dan di sana perlindungan
terhadap penebakan menyeluruh mutlak diperlukan. Rinciannya di
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 5.1.

### 3.3 Titik gagal dan penanganannya

| Gagal di | Akibatnya | Penanganan |
|---|---|---|
| Langkah 2 — surel tidak sampai | Akun belum aktif | Sediakan kirim ulang, dengan jeda agar tidak disalahgunakan |
| Langkah 4 — tautan kedaluwarsa | Akun belum aktif | Minta pengguna meminta tautan baru |
| Langkah 5 — pembuatan dompet gagal | Akun aktif tapi belum punya dompet | Ulangi pembuatan dompet; akun tidak perlu didaftar ulang |
| Langkah 10 — NIK sudah terpakai | Pendaftaran ditolak | Tampilkan alasan penolakan dengan jelas (KNF-16). **Jangan** menyebutkan dompet mana yang memakainya — itu membocorkan keterkaitan identitas dengan pengguna lain |
| Langkah 14 — transaksi blockchain gagal | Data tersimpan, status masih menunggu | Ulangi pengiriman hash. **Hash yang sudah tersimpan wajib dipakai ulang**, jangan dihitung ulang — data KTP-nya sudah dibuang dan tidak bisa dihitung ulang meskipun mau |

**Baris terakhir adalah jebakan yang mudah terlewat, dan sekarang lebih ketat
lagi.** Karena data KTP terbaca sudah dibuang di langkah 13, `hash_identitas`
**tidak bisa dihitung ulang sama sekali** — satu-satunya salinannya ada di
MySQL. Pengulangan pengiriman ke blockchain wajib memakai nilai itu apa adanya.

Kalau nilai itu ikut hilang, identitas pengguna tersebut **tidak bisa
diselamatkan** dan pendaftaran harus diulang dari awal dengan pengguna mengisi
kembali data KTP-nya.

---

## 4. Alur 2 — Pembelian Tiket

**Aktor:** Pengguna, Sistem
**Prasyarat:** akun aktif, dompet sudah dibuat, **identitas sudah terdaftar**
**Hasil akhir:** tiket NFT tercetak di dompet pengguna
**Kebutuhan tercakup:** KF-21 sampai KF-34, KF-52, KF-53

### 4.1 Langkah

**Tahap A — Pemilihan**

```
 1. [P] Membuka daftar event dan memilih satu event
 2. [W] Menampilkan rincian event beserta sisa kuota
        → keterangan event diambil dari IPFS
 3. [P] Memilih kategori tiket dan menekan tombol beli
```

**Tahap B — Pemeriksaan sebelum pembayaran**

```
 4. [W] Menampilkan penyaring bot Cloudflare Turnstile
 5. [P] Melewati penyaring bot
 6. [W] Mengirim permintaan pembelian beserta token Turnstile ke server
 7. [S] Memverifikasi token Turnstile ke layanan Cloudflare            ⚠
        → token tidak sah, kedaluwarsa, atau sudah dipakai → ditolak
 8. [S] Memeriksa status identitas pengguna                            ⚠
        → belum terdaftar → ditolak
 9. [B] Memeriksa sisa kuota event                                     ⚠
10. [B] Memeriksa batas maksimal pembelian dompet ini untuk event ini  ⚠
```

**Tahap C — Pembayaran**

```
11. [S] Membuat transaksi pembayaran di Midtrans
12. [W] Menampilkan halaman pembayaran kepada pengguna
13. [P] Menyelesaikan pembayaran
14. [L] Midtrans mengirim pemberitahuan status lunas ke server         ⚠
```

**Tahap D — Penerbitan tiket**

```
15. [S] Memastikan pesanan ini belum pernah diproses sebelumnya        ⚠
16. [L] Mengunggah keterangan tiket ke IPFS lewat Pinata               ⚠
        → memperoleh alamat berkas (CID)
17. [S] Membuat tanda tangan digital EIP-712 sebagai izin pencetakan   ⚠
18. [B] Mencetak tiket NFT ke dompet pengguna
        → originalPrice tercatat permanen
        → biaya gas ditanggung sistem lewat Paymaster
19. [S] Menyimpan salinan data tiket ke MySQL
20. [S] Mengirim notifikasi kepada pengguna
21. [W] Tiket muncul di halaman "tiket saya"
```

### 4.2 Enam titik yang menentukan keamanan

**Langkah 7 — verifikasi token bot dilakukan di server, bukan di peramban.**
Kalau peramban yang memeriksa jawabannya sendiri, pemeriksaan itu tidak ada
artinya — penyerang tinggal mengubah hasilnya sebelum dikirim.

**Langkah 9 dan 10 membaca dari blockchain, bukan dari MySQL.** Kuota dan
jumlah pembelian per dompet adalah keputusan yang menentukan siapa berhak
mendapat tiket, dan aturannya di
[`03-arsitektur-sistem.md`](03-arsitektur-sistem.md) Bagian 6.3 menyatakan
keputusan semacam itu wajib dibaca dari sumber kebenaran.

**Langkah 14 adalah gerbang yang menentukan seluruh alur.** Pencetakan tiket
**hanya** dipicu oleh pemberitahuan resmi dari Midtrans. Kalau dipicu oleh
peramban pengguna yang mengaku sudah membayar, siapa pun bisa memalsukan klaim
itu dan memperoleh tiket gratis.

**Langkah 15 mencegah satu pembayaran menghasilkan banyak tiket.** Layanan
pembayaran pada umumnya **mengirim ulang pemberitahuan** bila balasan pertama
tidak diterima dengan baik. Tanpa pemeriksaan ini, pemberitahuan kedua akan
memicu pencetakan kedua — dan tiket yang terlanjur tercetak di blockchain tidak
bisa ditarik kembali. Ini pelaksanaan langsung dari KNF-21.

**Langkah 16 harus mendahului langkah 18.** NFT menyimpan *penunjuk* ke
keterangan tiket, bukan keterangannya sendiri. Kalau tiket dicetak lebih dulu,
sempat ada tiket yang menunjuk ke alamat kosong.

**Langkah 17 menutup jalur RPC.** Tanpa tanda tangan sah dari sistem,
`TicketContract` menolak pencetakan — sehingga program otomatis yang memanggil
kontrak langsung tanpa pernah membuka situs web tetap tidak bisa mencetak tiket.
Penyaring bot di langkah 4 tidak bisa menghadang jalur ini, dan sebaliknya
tanda tangan tidak menghadang bot yang memakai situs web. Keduanya menjaga
pintu yang berbeda.

### 4.3 Titik gagal dan penanganannya

| Gagal di | Akibatnya | Penanganan |
|---|---|---|
| Langkah 7 — token bot ditolak | Pembelian tidak diproses | Muat ulang penyaring bot, minta pengguna mencoba lagi |
| Langkah 8 — identitas belum terdaftar | Pembelian ditolak | Arahkan pengguna ke alur pendaftaran identitas |
| Langkah 9 — kuota habis | Pembelian ditolak | Tampilkan status kuota. **Belum ada uang yang berpindah**, jadi tidak ada yang perlu dikembalikan |
| Langkah 10 — batas beli terlampaui | Pembelian ditolak | Sebutkan berapa batasnya dan berapa yang sudah dibeli |
| Langkah 13 — pembayaran gagal atau kedaluwarsa | Tidak ada tiket | Beri tahu pengguna, biarkan mengulang dari langkah 3 |
| **Langkah 16 sampai 18 — gagal setelah pembayaran lunas** | **Pengguna sudah membayar tapi belum punya tiket** | **Wajib bisa diulang tanpa pembayaran ulang** (KNF-19, KNF-20) |

**Baris terakhir adalah keadaan paling berbahaya di seluruh sistem.** Uang sudah
berpindah, tapi tiket belum ada. Rancangan alur ini menanganinya dengan cara
memastikan langkah 16 sampai 18 **bisa dijalankan ulang kapan saja** berdasarkan
catatan pesanan yang sudah lunas, tanpa melibatkan pengguna sama sekali.

Pembatas antara "aman diulang" dan "berbahaya diulang" adalah langkah 15. Selama
pemeriksaan itu ada, mengulang pencetakan tidak menghasilkan tiket ganda.

---

## 5. Alur 3 — Penjualan Kembali Tiket

**Aktor:** Pemilik tiket (penjual), Pembeli, Sistem
**Prasyarat penjual:** memiliki tiket yang belum terpakai dan eventnya belum
lewat
**Prasyarat pembeli:** akun aktif, **identitas sudah terdaftar**
**Hasil akhir:** kepemilikan tiket berpindah ke pembeli, dengan harga sama
persis seperti harga beli awal
**Kebutuhan tercakup:** KF-39 sampai KF-47, KF-54

### 5.1 Bagian A — Penjual menawarkan tiket

```
 1. [P] Membuka halaman "tiket saya" dan memilih tiket yang akan dijual
 2. [S] Memastikan tiket belum terpakai dan eventnya belum lewat        ⚠
 3. [B] Membaca originalPrice tiket tersebut dari blockchain            ⚠
 4. [W] Menampilkan harga jual — SEBAGAI ANGKA TETAP, BUKAN KOLOM ISIAN ⚠
        → penjual tidak pernah diberi kesempatan mengisi harga
 5. [P] Menyetujui penawaran
 6. [B] Mencatat penawaran di MarketplaceContract
        → kontrak menolak bila harganya bukan originalPrice            ⚠
 7. [W] Tiket muncul di daftar tiket yang dijual kembali
```

### 5.2 Bagian B — Pembeli membeli tiket yang ditawarkan

```
 8. [P] Membuka daftar tiket jual ulang dan memilih satu tiket
 9. [S] Memeriksa status identitas pembeli                              ⚠
        → belum terdaftar → ditolak
10. [S] MENGUNCI penawaran untuk pembeli ini                            ⚠
        → penawaran berstatus 'terkunci' dengan batas waktu
        → pembeli lain yang mencoba masuk DITOLAK di sini
11. [S] Membuat transaksi pembayaran Midtrans sebesar originalPrice
12. [P] Menyelesaikan pembayaran
13. [L] Midtrans mengirim pemberitahuan status lunas ke server          ⚠
14. [S] Memastikan penawaran ini belum pernah diproses sebelumnya       ⚠
15. [B] MarketplaceContract menjalankan perpindahan kepemilikan         ⚠
        → TicketContract mengizinkan karena pemanggilnya
          ada di dalam allowlist
16. [S] Memperbarui salinan data tiket di MySQL
17. [S] MEMULAI pencairan dana ke rekening penjual lewat Midtrans       ⚠
        → hanya setelah langkah 15 benar-benar berhasil
18. [S] Mengirim notifikasi kepada penjual bahwa tiketnya terjual
19. [W] Tiket muncul di halaman "tiket saya" milik pembeli
```

**Bila pembayaran gagal atau batas waktu kunci terlewati:**

```
    [S] Melepas kunci → penawaran kembali berstatus 'aktif'
        → pembeli lain sudah bisa mencoba lagi
```

### 5.3 Kenapa langkah 4 ditulis dengan huruf besar

Ini **inti mekanisme anti-calo** sistem ini, dan bentuknya mudah salah dipahami.

Harga jual ulang **bukan sesuatu yang diisi penjual lalu diperiksa sistem**.
Harga itu **tidak pernah menjadi masukan pengguna sejak awal** — penjual hanya
melihat angkanya, tidak bisa mengubahnya.

Perbedaan kedua pendekatan itu besar:

| | Diisi lalu diperiksa | **Tidak pernah bisa diisi** |
|---|---|---|
| Kalau pemeriksaannya lolos karena kesalahan kode | Harga bisa menyimpang | Tidak ada yang bisa menyimpang |
| Kalau permintaan dikirim langsung tanpa lewat situs web | Bergantung pada pemeriksaan di server | Langkah 6 tetap menolak di tingkat smart contract |

**Langkah 4 dan langkah 6 adalah pasangan yang sama-sama wajib.** Langkah 4
menutup jalur lewat situs web; langkah 6 menutup jalur lewat pemanggilan
langsung ke smart contract. Menghapus langkah 6 berarti seluruh perlindungan
bergantung pada halaman web — padahal halaman web bisa dilewati sepenuhnya.

### 5.4 Kenapa langkah 10 ada — mencegah perebutan pembeli

> **Keputusan 7 Agustus 2026:** perebutan dua pembeli atas satu tiket
> **dicegah**, bukan diperbaiki setelah terjadi.

Tanpa langkah 10, dua orang bisa sama-sama membayar tiket yang sama. Hanya satu
perpindahan yang akan berhasil di blockchain — yang kedua ditolak karena tiket
sudah bukan milik penjual lagi. Akibatnya ada satu orang yang **sudah membayar
tapi tidak mendapat apa-apa**, dan uangnya harus dikembalikan.

**Kenapa mencegah lebih baik daripada mengembalikan:**

| | Biarkan bersaing lalu kembalikan | **Kunci di depan (dipakai)** |
|---|---|---|
| Ada uang yang perlu dikembalikan | Ya | **Tidak pernah** |
| Butuh alur pengembalian dana | Ya | Tidak |
| Bisa diuji di Midtrans sandbox | **Tidak** | Ya |
| Yang dirasakan pembeli kedua | Sudah bayar, lalu ditolak | Ditolak sebelum mengeluarkan uang |

Baris ketiga yang menentukan: pengembalian dana **tidak bisa diuji sungguhan**
di lingkungan sandbox, sehingga alur yang bergantung padanya tidak akan pernah
terbukti bekerja.

**Jebakan yang wajib dihindari saat menulis kode:** pemeriksaan status penawaran
dan pengubahannya menjadi terkunci harus terjadi **dalam satu transaksi database
yang mengunci baris tersebut**. Kalau ditulis sebagai dua langkah terpisah —
periksa dulu, baru ubah — dua permintaan yang datang bersamaan bisa sama-sama
lolos pemeriksaan sebelum salah satunya sempat mengubah status. Perebutan yang
ingin dicegah justru terjadi persis di celah itu.

### 5.5 Kenapa langkah 17 harus setelah langkah 15

> **Keputusan 7 Agustus 2026:** uang hasil penjualan diteruskan ke **rekening
> bank penjual lewat Midtrans**.

Urutannya tidak boleh dibalik:

| Urutan | Akibatnya |
|---|---|
| Bayar lunas → **cairkan** → pindahkan tiket | **Berbahaya.** Bila perpindahan gagal, uang sudah keluar sementara tiket masih milik penjual dan pembeli tidak dapat apa-apa |
| Bayar lunas → pindahkan tiket → **cairkan** | **Benar.** Uang baru keluar setelah pembeli benar-benar menerima tiketnya |

**Kenapa ini lebih penting daripada urutan lain di sistem:** tiket yang terlanjur
tercetak atau berpindah masih bisa diperbaiki lewat transaksi tambahan. **Uang
yang sudah dicairkan ke rekening orang lain tidak bisa ditarik kembali.**

### 5.6 Kenapa perpindahan tidak dijalankan pemilik tiket sendiri

Perpindahan kepemilikan dijalankan **`MarketplaceContract`**, bukan oleh dompet
penjual maupun oleh server.

`TicketContract` hanya mengizinkan `MarketplaceContract` yang memindahkan tiket
antar pengguna. Setiap upaya perpindahan lain — termasuk penjual yang mencoba
mengirim tiketnya langsung ke dompet lain lewat RPC — **ditolak smart contract**.

**Akibat yang perlu disadari:** karena satu-satunya jalur perpindahan melewati
pembayaran resmi, transaksi tiket di luar sistem menjadi tidak mungkin
diselesaikan. Calo bisa saja menerima uang di luar sistem, tapi ia tetap tidak
bisa memindahkan tiketnya.

### 5.7 Titik gagal dan penanganannya

| Gagal di | Akibatnya | Penanganan |
|---|---|---|
| Langkah 2 — tiket sudah terpakai atau event sudah lewat | Penawaran ditolak | Sebutkan alasannya |
| Langkah 6 — pencatatan penawaran gagal | Tiket belum ditawarkan | Ulangi. Belum ada pihak lain yang terpengaruh |
| Langkah 9 — identitas pembeli belum terdaftar | Pembelian ditolak | Arahkan ke alur pendaftaran identitas |
| Langkah 10 — penawaran sedang dikunci pembeli lain | Pembelian ditolak | Beri tahu bahwa tiket sedang dalam proses pembelian, dan sarankan mencoba lagi nanti. **Belum ada uang yang berpindah** |
| Langkah 12 — pembayaran gagal atau batas waktu kunci lewat | Tiket tetap milik penjual | **Lepas kunci**, penawaran kembali terbuka untuk pembeli lain |
| **Langkah 15 — perpindahan gagal setelah pembayaran lunas** | **Pembeli sudah membayar tapi tiket belum berpindah** | **Wajib bisa diulang tanpa pembayaran ulang**, dengan penjagaan langkah 14 agar tidak berpindah dua kali. Pencairan dana **belum boleh dimulai** |
| **Langkah 17 — pencairan dana gagal** | Tiket sudah berpindah, penjual belum menerima uang | **Wajib bisa diulang**, dengan penjagaan agar tidak mencairkan dua kali. Pembeli tidak terpengaruh — tiketnya sudah aman |

**Baris terakhir menunjukkan kenapa urutannya dirancang begitu.** Kegagalan
pencairan dana adalah kegagalan yang **paling tidak merugikan**: pembeli sudah
menerima tiketnya, dan penjual hanya perlu menunggu pengulangan. Kalau urutannya
dibalik, kegagalan yang sama akan menyisakan uang yang sudah keluar tanpa tiket
yang berpindah.

### 5.8 Yang masih perlu diputuskan

| Yang belum ditentukan | Kenapa perlu dibahas |
|---|---|
| **Berapa lama batas waktu penguncian penawaran** | Terlalu pendek merugikan pembeli yang sedang membayar; terlalu panjang menahan tiket tanpa perlu |
| **Adakah potongan biaya pada pencairan dana** | Menentukan berapa yang benar-benar diterima penjual |

Keduanya tercatat di
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 18.2
sebagai bahan konsultasi.

---

## 6. Alur Pendukung

Dua alur berikut **tidak dihitung sebagai alur utama** karena bukan bagian dari
perjalanan pembeli tiket. Keduanya tetap perlu ada agar sistem lengkap.

### 6.1 Pembuatan event oleh penyelenggara acara

**Aktor:** Penyelenggara acara
**Kebutuhan tercakup:** KF-13 sampai KF-20

```
1. [P] Penyelenggara masuk ke akunnya
2. [P] Mengisi keterangan event: nama, kategori, tanggal dan waktu, lokasi
3. [P] Menentukan kategori tiket beserta harga dan kuota masing-masing
4. [P] Menentukan batas maksimal pembelian per dompet
5. [L] Sistem mengunggah keterangan event ke IPFS lewat Pinata
6. [B] Sistem memanggil pembuatan event di TicketContract
       → memperoleh eventId
       → kuota, harga, dan batas beli tercatat di blockchain
7. [S] Menyimpan salinan data event ke MySQL
8. [W] Event muncul di katalog
```

**Langkah 6 adalah alasan kuota tidak bisa dilampaui siapa pun.** Karena kuota
tercatat di blockchain, bahkan pengelola sistem tidak bisa menerbitkan tiket
melebihi jumlah itu — persis celah yang menyebabkan pemalsuan tiket pada sistem
konvensional.

### 6.2 Penukaran tiket di lokasi acara

**Aktor:** Petugas lokasi acara, Pengguna
**Kebutuhan tercakup:** KF-48 sampai KF-51

```
1. [P] Pengguna menunjukkan tiket elektronik DAN KTP fisiknya
2. [B] Petugas memeriksa kepemilikan tiket dari blockchain          ⚠
3. [B] Petugas memeriksa apakah tiket sudah pernah dipakai          ⚠
       → sudah terpakai → ditolak
4. [P] Petugas MEMASUKKAN NIK dari KTP fisik ke sistem              ⚠
5. [S] Sistem menghitung sidik jari digital dari NIK yang
       dimasukkan, lalu membandingkannya dengan yang terdaftar
       atas dompet pemilik tiket                                    ⚠
       → jawabannya hanya COCOK atau TIDAK COCOK
       → sistem tidak pernah menampilkan identitas apa pun
       → tidak cocok → ditolak
6. [B] Sistem menandai tiket sebagai sudah terpakai
7. [P] Pengguna dipersilakan masuk
```

### Arah pencocokan dibalik sejak 7 Agustus 2026

Rancangan sebelumnya menampilkan data KTP terdaftar di layar petugas untuk
dicocokkan. **Itu tidak mungkin lagi**, karena data KTP tidak lagi disimpan
dalam bentuk terbaca di mana pun (KF-10).

| | Sebelumnya | **Sekarang** |
|---|---|---|
| Yang dilakukan sistem | Menampilkan identitas terdaftar | Menerima NIK dari petugas, lalu membandingkan |
| Yang dilihat petugas | Data identitas pemilik tiket | **Hanya jawaban cocok atau tidak** |
| Bila layar terlihat orang lain | Identitas pemilik bocor | Tidak ada yang bocor |
| Bila database bocor | Identitas seluruh pengguna bocor | Tidak ada yang bocor |
| Petugas perlu memegang KTP fisik | Tidak wajib | **Wajib** |

**Baris terakhir bukan kerugian, melainkan keharusan yang selama ini tersirat.**
Tujuan pencocokan adalah memastikan orang yang berdiri di depan petugas sama
dengan yang terdaftar — dan itu memang menuntut KTP fisiknya ada di tangan.
Rancangan lama membuka peluang petugas meloloskan pengunjung hanya dengan
melihat layar, tanpa benar-benar memeriksa KTP.

**Langkah 6 harus dilakukan setelah langkah 5 berhasil.** Kalau tiket ditandai
terpakai lebih dulu lalu pencocokan identitas ternyata gagal, tiket itu sudah
hangus padahal pemiliknya yang sah mungkin datang kemudian.

---

## 7. Ringkasan Perbandingan Ketiga Alur Utama

| | Alur 1 — Pendaftaran | Alur 2 — Pembelian | Alur 3 — Jual ulang |
|---|---|---|---|
| Yang memulai | Pengguna | Pengguna | Penjual, lalu pembeli |
| Melibatkan uang | Tidak | Ya — masuk | Ya — masuk **dan keluar** |
| Transaksi blockchain | 1 — pencatatan hash KTP | 1 — pencetakan tiket | 2 — pencatatan penawaran dan perpindahan |
| Penyaring bot | Tidak | **Ya** | Tidak |
| Tanda tangan digital sistem | Ya | **Ya** | Ya |
| Titik paling berisiko | Hash tercatat tapi *salt* hilang | Sudah bayar tapi tiket belum tercetak | Uang dicairkan padahal tiket belum berpindah |
| Bisa diulang bila gagal | Ya, dengan *salt* yang sama | Ya, tanpa pembayaran ulang | Ya, tanpa pembayaran ulang |
| Perebutan antar pengguna | Tidak ada | Diredam kuota dan batas beli | **Dicegah penguncian penawaran** |

**Pola yang berulang di ketiga alur:** titik paling berisiko selalu berada
**setelah sesuatu yang tidak bisa dibatalkan sudah terjadi** — uang sudah
berpindah, atau data sudah tercatat permanen di blockchain. Karena itu setiap
alur dirancang agar langkah-langkah setelah titik itu **bisa dijalankan ulang
dengan aman**, dan setiap pengulangan selalu didahului pemeriksaan apakah
langkah tersebut sudah pernah berhasil.

---

## 8. Daftar Periksa Kelengkapan

Diperiksa terhadap ketentuan di `tasks.md` Langkah 6.

- [x] **Jumlah alur utama tiga, bukan empat.** Dinyatakan tegas di Bagian 1,
      dan alur pendukung di Bagian 6 diberi keterangan bahwa tidak termasuk
      hitungan itu.
- [x] Tidak ada satu pun langkah yang menyebut *flash sale*, *commit-reveal*,
      Chainlink VRF, atau *Soulbound Token* sebagai bagian aktif sistem.
- [x] Alur pendaftaran memuat pembuatan dompet otomatis dan pendaftaran
      identitas KTP, dengan hash disimpan di blockchain dan data asli di MySQL.
- [x] Alur pembelian memuat penyaring bot, pembayaran Midtrans, verifikasi
      pembayaran, pencetakan NFT, dan penyimpanan keterangan di IPFS.
- [x] Alur penjualan kembali menegaskan harga dikunci di `originalPrice` dan
      perpindahan hanya lewat `MarketplaceContract`.
- [x] Setiap alur disertai titik gagal dan penanganannya.
- [x] Tidak ada angka kinerja yang dikarang.
