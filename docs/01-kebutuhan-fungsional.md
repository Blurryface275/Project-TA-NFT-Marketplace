# 01 — Kebutuhan Fungsional

**Kebutuhan fungsional (KF)** adalah daftar **apa yang sistem harus bisa
lakukan**. Bentuknya kalimat "sistem harus dapat …". Setiap butir diberi kode
`KF-xx` agar bisa dirujuk dari dokumen lain, dari kode program, dan dari
skenario pengujian.

Lawannya adalah **kebutuhan non-fungsional (KNF)** — bukan *apa*-nya, melainkan
*seberapa baik*-nya. Itu dibahas di
[`02-kebutuhan-non-fungsional.md`](02-kebutuhan-non-fungsional.md).

Daftar ini diturunkan dari **delapan fitur hasil analisis kebutuhan sistem**
(Bab 3.4 buku tugas akhir), disesuaikan dengan **arsitektur final** di
[`03-arsitektur-sistem.md`](03-arsitektur-sistem.md). Penelusuran dari fitur ke
kode KF ada di Bagian 13.

---

## 1. Status Pelaksanaan

**Per 7 Agustus 2026: seluruh kebutuhan di berkas ini berstatus
`[BELUM DIIMPLEMENTASI]`.**

Folder `contracts/` baru berisi kerangka bawaan Foundry (`Counter.sol`), dan
belum ada berkas program untuk `TicketContract` maupun `MarketplaceContract`.
Karena statusnya seragam, kolom status tidak ditulis berulang di setiap baris
tabel. Kolom itu **ditambahkan begitu ada kebutuhan pertama yang selesai
dikerjakan.**

---

## 2. Aktor Sistem

Empat pihak yang berinteraksi dengan sistem. Penyebutan aktor di seluruh
dokumen mengacu ke daftar ini.

| Aktor | Siapa | Perannya |
|---|---|---|
| **Pengguna** | Pembeli tiket | Mendaftar, mendaftarkan identitas, membeli tiket, menjual kembali tiket, menghadiri acara |
| **Penyelenggara acara** | Pihak yang mengadakan event | Membuat event, menentukan kuota dan harga, memantau penjualan |
| **Petugas lokasi acara** | Petugas di pintu masuk venue | Memverifikasi keaslian dan kepemilikan tiket saat penukaran |
| **Sistem** | Server NestJS | Menandatangani izin, memverifikasi pembayaran, menanggung biaya gas, mengirim transaksi ke blockchain |

> **Catatan:** "Sistem" didaftar sebagai aktor karena ia **bertindak atas
> inisiatifnya sendiri** pada beberapa alur — misalnya mencetak tiket begitu
> Midtrans memberi tahu pembayaran lunas, tanpa menunggu perintah pengguna.

---

## 3. Modul dan Pembagiannya

Kebutuhan dikelompokkan menjadi **sembilan modul**.

| Modul | Nama | Kode | Aktor utama |
|---|---|---|---|
| M1 | Akun dan Dompet | KF-01 – KF-06 | Pengguna |
| M2 | Identitas Pengguna (KYC) | KF-07 – KF-12 | Pengguna |
| M3 | Manajemen Event | KF-13 – KF-20 | Penyelenggara acara |
| M4 | Katalog Event | KF-21 – KF-24 | Pengguna |
| M5 | Pembelian Tiket | KF-25 – KF-34 | Pengguna, Sistem |
| M6 | Kepemilikan Tiket | KF-35 – KF-38 | Pengguna |
| M7 | Penjualan Kembali | KF-39 – KF-47, **KF-56 – KF-59** | Pengguna, Sistem |
| M8 | Verifikasi Tiket di Lokasi Acara | KF-48 – KF-51 | Petugas lokasi acara |
| M9 | Notifikasi | KF-52 – KF-55 | Sistem |

**Total: 59 kebutuhan fungsional.**

> **Kenapa KF-56 sampai KF-59 tidak disisipkan di tengah M7:** menyisipkannya
> akan menggeser penomoran seluruh kebutuhan sesudahnya, dan setiap rujukan di
> berkas lain ikut salah. Penomoran karena itu **hanya ditambah di belakang**,
> tidak pernah disusun ulang.

> **Catatan penyusunan:** `tasks.md` menyebut adanya draf 27 kebutuhan
> fungsional dalam 8 modul. Draf tersebut **tidak ditemukan** di dalam repositori
> maupun di kedua berkas PDF di folder `dokumen/`. Daftar ini karena itu disusun
> ulang dari delapan fitur di Bab 3.4 buku tugas akhir yang digabung dengan
> arsitektur final, sehingga jumlah dan pengelompokannya berbeda dari angka
> tersebut. Jumlahnya lebih banyak terutama karena satu fitur di Bab 3.4 —
> misalnya "pembelian tiket reguler" — ternyata memuat banyak langkah yang
> masing-masing perlu diuji terpisah.

---

## 4. M1 — Akun dan Dompet

Modul ini menjawab masalah ketiga di
[`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) Bagian 2.3: masyarakat awam
kesulitan memakai sistem berbasis blockchain.

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-01** | Sistem harus dapat mendaftarkan pengguna baru **cukup dengan alamat surel**, tanpa kata sandi dan tanpa meminta pengguna menyiapkan dompet kripto lebih dulu | Arsitektur 4.8 |
| **KF-02** | Sistem harus dapat memverifikasi kepemilikan alamat surel sebelum akun diaktifkan | — |
| **KF-03** | Sistem harus dapat **membuatkan dompet blockchain secara otomatis** berupa *smart account* ERC-4337 setelah verifikasi surel berhasil, tanpa pengguna perlu memasang perangkat lunak apa pun | Arsitektur 4.8 |
| **KF-04** | Sistem **tidak boleh** meminta pengguna mencatat, menyimpan, atau memasukkan kunci pribadi maupun frasa rahasia pada titik mana pun | Arsitektur 4.8 |
| **KF-05** | Sistem harus dapat **menanggung seluruh biaya gas** setiap transaksi blockchain lewat *Paymaster*, sehingga pengguna tidak perlu memiliki aset kripto sama sekali | Arsitektur 4.8 |
| **KF-06** | Sistem harus dapat mencatat riwayat masuk (*login*) setiap pengguna | Ruang lingkup poin 10 |

**KF-04 sengaja ditulis sebagai larangan, bukan kemampuan.** Kebutuhan ini
menjadi acuan pemeriksaan saat pengujian: kalau di salah satu halaman pengguna
diminta menyalin frasa rahasia, sasaran ketiga sistem tidak tercapai — sekalipun
seluruh kebutuhan lain terpenuhi.

---

## 5. M2 — Identitas Pengguna (KYC)

Menegakkan aturan pokok: **satu tiket → satu alamat dompet → satu identitas
nyata.**

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-07** | Sistem harus dapat menerima pendaftaran data identitas Kartu Tanda Penduduk (KTP) dari pengguna, meliputi Nomor Induk Kependudukan (NIK), nama lengkap, dan tanggal lahir | Arsitektur 4.4 |
| **KF-08** | Sistem harus dapat membangkitkan ***salt* acak yang berbeda untuk setiap pengguna** | Arsitektur 4.4 |
| **KF-09** | Sistem harus dapat menghitung `keccak256(data KTP + salt)` dan **menyimpan hasilnya di blockchain** | Arsitektur 4.4 |
| **KF-10** | Sistem **tidak boleh menyimpan data KTP dalam bentuk terbaca di mana pun** — tidak di blockchain, tidak di IPFS, tidak di MySQL, dan tidak di catatan sistem. Yang boleh disimpan hanya sidik jari digitalnya | Arsitektur 4.4, ERD 5 |
| **KF-11** | Sistem harus **menolak** pendaftaran identitas bila NIK yang sama sudah terikat pada alamat dompet lain | Arsitektur 4.4 |
| **KF-12** | Sistem harus **menolak pembelian tiket** dari pengguna yang belum menyelesaikan pendaftaran identitas | Arsitektur 4.4 |

**KF-10 diperketat pada 7 Agustus 2026.** Rumusan sebelumnya masih mengizinkan
data KTP asli tersimpan di MySQL. Sekarang tidak lagi: data KTP hanya boleh
berada di dalam ingatan server selama pemrosesan berlangsung, lalu dibuang —
yang tersimpan hanya hasil hash-nya.

**Kenapa KF-10 ditulis sebagai larangan:** ini adalah kebutuhan yang paling
tidak boleh dilanggar di seluruh sistem. Data yang terlanjur ditulis ke
blockchain **tidak bisa ditarik kembali oleh siapa pun**, termasuk oleh pembuat
sistem. Kesalahan di sini bersifat permanen dan tidak bisa diperbaiki dengan
tambalan di kemudian hari.

**Akibat langsung KF-10 yang harus disadari:** karena data aslinya tidak pernah
tersimpan, **sistem tidak akan pernah bisa menampilkannya kembali** kepada siapa
pun — termasuk kepada pemiliknya sendiri. Pencocokan identitas hanya bisa
dilakukan dengan cara pengguna menyerahkan kembali datanya untuk dibandingkan
(KF-51).

**KF-11 tidak bisa ditegakkan smart contract.** Karena *salt* berbeda untuk
setiap pengguna, NIK yang sama menghasilkan hash yang berbeda. Penegakannya
memakai kunci unik pada kolom `nik_indeks` di MySQL — lihat
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 5.1.

---

## 6. M3 — Manajemen Event (Penyelenggara Acara)

Modul untuk sisi penyelenggara acara. **Bagian ini kurang terurai di ruang
lingkup proposal awal**, padahal tanpanya tidak ada event yang bisa dijual.

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-13** | Sistem harus dapat mendaftarkan dan mengautentikasi akun penyelenggara acara, terpisah dari akun pengguna biasa | — |
| **KF-14** | Penyelenggara harus dapat **membuat event baru** dengan mengisi nama event, kategori, tanggal dan waktu pelaksanaan, serta lokasi venue | Fitur Bab 3.4 |
| **KF-15** | Sistem harus memberi setiap event **nomor pembeda `eventId` yang unik** di dalam `TicketContract` | Arsitektur 4.2 |
| **KF-16** | Penyelenggara harus dapat menentukan **satu atau lebih kategori tiket** per event, masing-masing dengan harga dan kuotanya sendiri | Ruang lingkup poin 10 |
| **KF-17** | Sistem harus **mencatat kuota setiap event di blockchain**, sehingga jumlah tiket yang terjual tidak dapat melampauinya — bahkan oleh pengelola sistem | Arsitektur 4.1, 6.2 |
| **KF-18** | Sistem harus mencatat harga tiket yang ditentukan penyelenggara sebagai **`originalPrice` yang bersifat permanen** dan tidak dapat diubah setelah tiket dicetak | Arsitektur 4.6 |
| **KF-19** | Penyelenggara harus dapat menentukan **batas maksimal pembelian tiket per alamat dompet per event**, dan batas itu dicatat di blockchain | Fitur Bab 3.4 |
| **KF-20** | Penyelenggara harus dapat melihat rekapitulasi penjualan tiket eventnya, meliputi jumlah terjual, sisa kuota, dan jumlah tiket yang sedang ditawarkan untuk dijual kembali | — |

**KF-17 dan KF-18 sengaja menyebut "di blockchain" secara eksplisit.** Keduanya
adalah aturan yang **harus tidak bisa dilanggar bahkan oleh pengelola sistem**.
Kalau kuota hanya diperiksa di server, pemalsuan tiket kembali mungkin terjadi
lewat pengelola yang menerbitkan tiket melebihi kuota — persis celah yang ingin
ditutup sistem ini.

---

## 7. M4 — Katalog Event

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-21** | Sistem harus dapat menampilkan daftar event yang sedang dibuka penjualannya | — |
| **KF-22** | Sistem harus dapat menampilkan rincian sebuah event, meliputi nama, tanggal dan waktu, lokasi venue, kategori tiket, harga, dan **sisa kuota** | — |
| **KF-23** | Sistem harus dapat menyaring dan mencari event berdasarkan kategori event | Ruang lingkup poin 2 |
| **KF-24** | Sistem harus dapat menampilkan keterangan event yang **diambil dari IPFS**, bukan dari salinan yang bisa disunting sepihak | Arsitektur 6.2 |

---

## 8. M5 — Pembelian Tiket

Alur terpanjang di sistem ini. Urutannya menentukan keamanan, jadi kebutuhan
ditulis mengikuti urutan pelaksanaannya. Alur lengkapnya di
[`07-alur-pengguna.md`](07-alur-pengguna.md).

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-25** | Sistem harus memuat **penyaring bot Cloudflare Turnstile** pada halaman pembelian tiket | Arsitektur 4.9 |
| **KF-26** | Sistem harus **memverifikasi token Turnstile di sisi server** ke layanan Cloudflare sebelum permintaan pembelian diproses, dan menolak permintaan yang tokennya tidak sah, sudah kedaluwarsa, atau sudah pernah dipakai | Arsitektur 4.9 |
| **KF-27** | Sistem harus **menolak pembelian bila kuota event sudah habis** | Arsitektur 4.1 |
| **KF-28** | Sistem harus **menolak pembelian bila batas maksimal pembelian per alamat dompet untuk event tersebut sudah terlampaui** | KF-19 |
| **KF-29** | Sistem harus dapat membuat transaksi pembayaran lewat Midtrans dan menampilkannya kepada pengguna | Ruang lingkup poin 4 |
| **KF-30** | Sistem harus **hanya memicu pencetakan tiket setelah menerima pemberitahuan resmi status lunas dari Midtrans**, dan tidak boleh memicunya berdasarkan klaim dari sisi peramban pengguna | Arsitektur 3.2 |
| **KF-31** | Sistem harus mengunggah keterangan tiket ke IPFS lewat Pinata dan memperoleh alamat berkasnya **sebelum** tiket dicetak | Arsitektur 3.2, 6.2 |
| **KF-32** | Sistem harus membubuhkan **tanda tangan digital EIP-712** sebagai izin pencetakan, dan `TicketContract` harus menolak pencetakan yang tidak disertai tanda tangan sah | Arsitektur 4.7 |
| **KF-33** | Sistem harus dapat **mencetak tiket sebagai NFT ERC-721** ke alamat dompet pengguna, dengan `originalPrice` tercatat permanen | Arsitektur 4.1, 4.6 |
| **KF-34** | Sistem harus menyimpan salinan data tiket ke MySQL untuk keperluan penampilan dan pencarian, **tanpa menjadikannya acuan kepemilikan** | Arsitektur 6.3 |

**KF-30 adalah kebutuhan keamanan terpenting di modul ini.** Kalau pencetakan
tiket bisa dipicu dari sisi peramban, siapa pun dapat mengaku sudah membayar dan
memperoleh tiket gratis. Pemberitahuan dari Midtrans adalah satu-satunya bukti
pembayaran yang tidak bisa dipalsukan pengguna.

**KF-31 harus mendahului KF-33 dengan sengaja.** NFT menyimpan *penunjuk* ke
keterangan tiket, bukan keterangannya sendiri. Kalau urutannya terbalik, sempat
ada tiket yang menunjuk ke alamat kosong.

---

## 9. M6 — Kepemilikan Tiket

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-35** | Sistem harus dapat menampilkan daftar tiket yang dimiliki seorang pengguna | Fitur Bab 3.4 |
| **KF-36** | Sistem harus dapat menampilkan tiket elektronik beserta keterangannya: nama event, tanggal dan waktu, lokasi venue, kategori tiket, nomor kursi, dan gambar tiket | Ruang lingkup poin 9 |
| **KF-37** | Sistem harus menyediakan cara bagi pengguna untuk **membuktikan kepemilikan tiketnya secara mandiri**, dengan menampilkan `tokenId` dan alamat kontrak yang dapat diperiksa siapa pun di penjelajah blockchain | Tujuan sasaran 1 |
| **KF-38** | Sistem harus **membaca status kepemilikan tiket dari blockchain**, bukan dari salinan MySQL, pada setiap keputusan yang menyangkut kepemilikan | Arsitektur 6.3 |

**KF-37 adalah kebutuhan yang membedakan sistem ini dari tiket konvensional.**
Pada sistem berbasis kode QR, pembeli harus mempercayai klaim platform bahwa
tiketnya asli. Di sini pembeli bisa memeriksanya sendiri tanpa perlu
mempercayai siapa pun.

---

## 10. M7 — Penjualan Kembali

Modul yang memuat **mekanisme anti-calo utama** sistem ini.

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-39** | Pemilik tiket harus dapat **menawarkan tiketnya untuk dijual kembali** lewat *marketplace* resmi | Arsitektur 4.5 |
| **KF-40** | Sistem **tidak boleh menyediakan kolom pengisian harga** pada halaman penawaran. Harga jual ulang **diambil otomatis dari `originalPrice`** yang tercatat di blockchain | Arsitektur 4.6 |
| **KF-41** | `MarketplaceContract` harus **menolak penawaran dengan harga selain `originalPrice`**, sekalipun permintaannya datang dari luar situs web | Arsitektur 4.6, 4.7 |
| **KF-42** | Pemilik harus dapat **membatalkan penawaran** yang belum terjual | — |
| **KF-43** | Pembeli harus dapat membeli tiket yang sedang ditawarkan, dengan membayar tepat sebesar `originalPrice` | Arsitektur 4.6 |
| **KF-44** | Perpindahan kepemilikan tiket **hanya boleh dijalankan lewat `MarketplaceContract`** | Arsitektur 4.5 |
| **KF-45** | `TicketContract` harus **menolak setiap upaya perpindahan kepemilikan antar pengguna yang tidak dijalankan `MarketplaceContract`**, termasuk pemanggilan langsung lewat RPC | Arsitektur 4.5, 4.7 |
| **KF-46** | Sistem harus **menolak pembelian tiket jual ulang** dari pengguna yang belum menyelesaikan pendaftaran identitas | KF-12 |
| **KF-47** | Sistem harus **menolak penawaran atas tiket yang sudah ditandai terpakai** atau yang eventnya sudah lewat | KF-49 |

**KF-40 dan KF-41 terlihat mirip tapi berdiri di lapisan berbeda, dan keduanya
wajib ada.** KF-40 di sisi situs web — penjual tidak pernah diberi kesempatan
mengisi harga sejak awal. KF-41 di sisi smart contract — kalau ada yang
memanggil kontrak langsung lewat RPC tanpa membuka situs web sama sekali,
penolakan tetap terjadi. Menghapus KF-41 membuat KF-40 bisa dilewati sepenuhnya.

**KF-44 dan KF-45 juga berpasangan dengan pola yang sama:** yang satu menyatakan
jalur yang diizinkan, yang lain menyatakan penolakan terhadap semua jalur lain.

> **Penegasan istilah:** tiket **tetap bisa berpindah tangan**. Yang dibatasi
> adalah **jalurnya** — hanya lewat `MarketplaceContract` — dan **harganya** —
> terkunci di `originalPrice`. Tidak ada satu pun kebutuhan di berkas ini yang
> menyatakan tiket tidak bisa dipindahkan sama sekali.

### 10.1 Penguncian penawaran dan pencairan dana

Empat kebutuhan berikut **ditambahkan pada 7 Agustus 2026**, menjawab dua hal
yang sebelumnya belum diputuskan. Kodenya melanjutkan penomoran agar rujukan
yang sudah ada tidak berubah.

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-56** | Sistem harus **mengunci sebuah penawaran untuk satu pembeli** begitu pembeli itu memulai pembayaran, dan **menolak pembeli lain** selama kunci masih berlaku | ERD 11.1 |
| **KF-57** | Sistem harus **melepas kunci dan membuka kembali penawaran** bila pembayaran gagal atau batas waktu kunci terlewati | ERD 11.1 |
| **KF-58** | Penjual harus dapat **mendaftarkan rekening bank** sebagai tujuan pencairan dana hasil penjualan | ERD 12 |
| **KF-59** | Sistem harus **meneruskan uang hasil penjualan ke rekening penjual lewat Midtrans**, dan hanya boleh memulainya **setelah kepemilikan tiket benar-benar berpindah di blockchain** | ERD 13 |

**KF-56 dan KF-57 mencegah perebutan pembeli, bukan memperbaikinya.** Kalau dua
pembeli dibiarkan sama-sama membayar, salah satunya pasti harus dikembalikan
uangnya — dan pengembalian dana **tidak bisa diuji sungguhan** di lingkungan
sandbox. Mencegah di depan menghapus seluruh kebutuhan itu.

**Urutan pada KF-59 tidak boleh dibalik.** Kalau uang dicairkan sebelum
kepemilikan berpindah, dan perpindahan itu ternyata gagal, uang sudah terlanjur
keluar sementara tiket masih milik penjual. Berbeda dari tiket yang bisa dibakar,
**uang yang sudah dicairkan tidak bisa ditarik kembali.**

---

## 11. M8 — Verifikasi Tiket di Lokasi Acara

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-48** | Petugas lokasi acara harus dapat memverifikasi **keaslian dan kepemilikan** sebuah tiket dengan membaca statusnya dari blockchain | Fitur Bab 3.4 |
| **KF-49** | Sistem harus dapat **menandai tiket sebagai sudah terpakai di blockchain** setelah penukaran berhasil | Ruang lingkup poin 8 |
| **KF-50** | Sistem harus **menolak tiket yang sudah ditandai terpakai**, sehingga satu tiket tidak dapat dipakai dua kali | Fitur Bab 3.4 |
| **KF-51** | Petugas harus dapat **mencocokkan identitas** pemegang tiket dengan identitas yang terdaftar, dengan cara **memasukkan NIK dari KTP fisik** dan menerima jawaban **cocok atau tidak cocok** | Arsitektur 4.4, ERD 5 |

**KF-51 berubah bentuk pada 7 Agustus 2026, mengikuti KF-10.** Rumusan
sebelumnya adalah "menampilkan data KTP terdaftar untuk dicocokkan petugas".
Itu **tidak mungkin lagi**, karena data KTP tidak tersimpan dalam bentuk
terbaca.

Bentuk barunya membalik arah pencocokan:

| | Sebelumnya | **Sekarang** |
|---|---|---|
| Yang dilakukan sistem | Menampilkan data KTP terdaftar | Menerima NIK dari petugas, lalu membandingkan hash-nya |
| Yang dilihat petugas | Data identitas pemilik | **Hanya jawaban cocok atau tidak** |
| Bila layar terlihat orang lain | Identitas pemilik bocor | Tidak ada yang bocor |
| Bila database bocor | Identitas seluruh pengguna bocor | Tidak ada yang bocor |

**Sistem tidak pernah menampilkan identitas siapa pun.** Petugas harus sudah
memegang KTP fisiknya untuk bisa melakukan pencocokan — dan itu memang urutan
yang benar, karena tujuan pencocokan adalah memastikan orang yang berdiri di
depan petugas sama dengan yang terdaftar.

---

## 12. M9 — Notifikasi

| Kode | Kebutuhan | Rujukan |
|---|---|---|
| **KF-52** | Sistem harus memberi tahu pengguna tentang **status pembayaran**: berhasil, gagal, atau kedaluwarsa | Fitur Bab 3.4 |
| **KF-53** | Sistem harus memberi tahu pengguna ketika **tiket berhasil dicetak** ke dompetnya | Fitur Bab 3.4 |
| **KF-54** | Sistem harus memberi tahu penjual ketika **tiket yang ditawarkannya terjual** | Fitur Bab 3.4 |
| **KF-55** | Sistem harus menyimpan riwayat notifikasi agar dapat dibuka kembali pengguna | Ruang lingkup poin 10 |

---

## 13. Penelusuran dari Fitur Hasil Analisis

Tabel ini menghubungkan **delapan fitur di Bab 3.4 buku tugas akhir** dengan
kode kebutuhan di berkas ini. Gunanya: membuktikan bahwa daftar kebutuhan
benar-benar berasal dari hasil analisis, bukan disusun sendiri tanpa dasar.

| Fitur di Bab 3.4 | Kode KF | Catatan penyesuaian |
|---|---|---|
| Registrasi otomatis cukup dengan verifikasi surel | KF-01 – KF-05 | Sesuai |
| *Flash sale* dengan CAPTCHA dan batas maksimal pembelian | KF-19, KF-25, KF-26, KF-28 | **Bagian *flash sale* dihapus.** Yang dipertahankan adalah penyaring bot dan batas maksimal pembelian, karena keduanya tetap berguna pada pembelian biasa |
| Pembelian tiket reguler menghasilkan tiket digital unik | KF-25 – KF-34 | Diurai menjadi sepuluh butir karena tiap langkah perlu diuji terpisah |
| *Resale* tiket dengan harga dikunci sesuai harga pembelian awal | KF-39 – KF-47 | Ditambah kebutuhan penolakan di sisi smart contract (KF-41, KF-45) |
| Verifikasi tiket oleh petugas venue | KF-48 – KF-51 | Ditambah pencocokan identitas KTP (KF-51) |
| Notifikasi status transaksi | KF-52 – KF-55 | Notifikasi hasil *flash sale* dihapus, diganti notifikasi status pembayaran |
| Bebas biaya transaksi | KF-05 | Sesuai |
| Melihat tiket elektronik yang sudah dibeli | KF-35 – KF-38 | Ditambah pembuktian kepemilikan mandiri (KF-37) |
| *(Tidak ada di Bab 3.4)* | KF-06 – KF-12 | **Pendaftaran identitas KTP.** Belum ada saat Bab 3.4 disusun, ditambahkan setelah arsitektur final |
| *(Tidak ada di Bab 3.4)* | KF-13 – KF-24 | **Manajemen event dan katalog.** Kurang terurai di ruang lingkup proposal |

---

## 14. Kebutuhan yang Sengaja Tidak Ada

Empat hal berikut muncul di proposal awal tapi **tidak menjadi kebutuhan
sistem**. Didaftar di sini supaya ketiadaannya terbaca sebagai keputusan, bukan
kelalaian.

| Yang tidak ada | Kenapa | Rujukan |
|---|---|---|
| Kebutuhan *flash sale* | Terhapus bersama *commit-reveal*. Alur utama tinggal tiga | Arsitektur 4.3 |
| Kebutuhan pembelian dua tahap (*commit-reveal*) | Masalah yang diatasinya adalah perebutan cepat. Karena keuntungan calo sudah dimatikan lewat penguncian harga, insentif berebut hilang | Arsitektur 4.3 |
| Kebutuhan pengundian acak (Chainlink VRF) | Persaingan dinilai sudah cukup sehat tanpa pengundian | Arsitektur 4.3 |
| Kebutuhan tiket yang sama sekali tidak bisa dipindahkan (*Soulbound Token*) | Diganti pembatasan allowlist. Orang yang batal hadir tetap perlu bisa mengalihkan tiketnya secara sah | Arsitektur 4.5 |

---

## 15. Daftar Periksa Kelengkapan

Diperiksa terhadap ketentuan di `tasks.md` Langkah 4.

- [x] **Tidak ada satu pun kebutuhan yang menyebut *flash sale* atau
      *commit-reveal*** sebagai bagian aktif sistem. Keduanya hanya disebut di
      Bagian 13 dan 14 dalam bingkai "dihapus".
- [x] **Tidak ada kebutuhan yang menyatakan tiket "tidak bisa dipindahkan sama
      sekali".** KF-44 dan KF-45 menyatakan pembatasan **jalur**, bukan larangan
      perpindahan. Ditegaskan ulang di penutup Bagian 10.
- [x] **Sudah ada kebutuhan pendaftaran identitas (KYC)** — seluruh modul M2
      (KF-07 sampai KF-12), ditambah KF-46 dan KF-51.
- [x] Setiap kebutuhan punya kode yang bisa dirujuk.
- [x] Kebutuhan dikelompokkan per modul.
- [x] **Ada modul untuk sisi penyelenggara acara** — M3 (KF-13 sampai KF-20),
      mencakup pembuatan event dan pengaturan kuota.
- [x] Tidak ada angka kinerja yang dikarang. Seluruh tuntutan angka berada di
      [`02-kebutuhan-non-fungsional.md`](02-kebutuhan-non-fungsional.md) dan
      ditandai `[BUTUH DATA UJI]`.
