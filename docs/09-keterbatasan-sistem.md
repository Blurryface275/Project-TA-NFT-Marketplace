# 09 — Keterbatasan Sistem

Berkas ini mendaftar **apa yang sistem ini tidak bisa lakukan**, beserta
alasannya.

**Kenapa berkas seperti ini justru menambah kredibilitas:** menuliskan
keterbatasan sendiri jauh lebih baik daripada ditemukan penguji saat sidang.
Perancang yang sadar batas sistemnya menunjukkan pemahaman yang lebih dalam
daripada perancang yang mengklaim sistemnya menyelesaikan segalanya. Tidak ada
sistem keamanan yang menutup semua celah; yang membedakan adalah apakah
celahnya diketahui atau tidak.

Setiap butir ditulis dengan pola yang sama:

> **Apa batasnya → kenapa terjadi → seberapa besar dampaknya → apa yang
> meredamnya.**

---

## Ringkasan

| No | Keterbatasan | Sifatnya |
|---|---|---|
| 1 | Pengikatan identitas bisa ditembus lewat praktik jastip | **Melekat pada masalahnya** |
| 2 | Pemeriksaan NIK ganda ikut jatuh bila server dikuasai | Akibat pertukaran rancangan |
| 3 | Kebocoran identitas — sebagian besar sudah ditutup, sisanya bergantung pada *pepper* | Akibat pertukaran rancangan |
| 4 | Pengguna tidak memegang kunci pribadinya sendiri | Akibat pertukaran rancangan |
| 5 | Satu celah pada kontrak berdampak ke semua event | Akibat pilihan Model B |
| 6 | Penyaring bot tidak menghentikan pelaku yang bekerja manual | **Melekat pada masalahnya** |
| 7 | Serangan Sybil tidak ditangani menyeluruh | Batasan ruang lingkup |
| 8 | Berjalan di jaringan uji coba, bukan jaringan sungguhan | Batasan ruang lingkup |
| 9 | Pembayaran hanya simulasi | Batasan ruang lingkup |
| 10 | Bergantung pada beberapa layanan pihak ketiga | Akibat pilihan teknologi |
| 11 | Biaya gas ditanggung sistem tanpa model pembiayaan | Belum dirancang |
| 12 | Verifikasi di lokasi acara bergantung pada kejujuran petugas | **Melekat pada masalahnya** |
| 13 | Beberapa hal belum diputuskan | Menunggu konsultasi |
| 14 | Kinerja sistem belum terukur | Menunggu pengujian |

**Kolom "sifatnya" membedakan tiga jenis keterbatasan**, dan pembedaan ini
penting saat menjawab penguji:

- **Melekat pada masalahnya** — tidak bisa dihilangkan pendekatan mana pun,
  termasuk pendekatan alternatif. Bukan kelemahan rancangan ini secara khusus.
- **Akibat pertukaran rancangan** — muncul karena satu hal dipilih dan hal lain
  dikorbankan. Bisa berbeda kalau pilihannya berbeda, tapi pilihan lain punya
  kerugiannya sendiri.
- **Batasan ruang lingkup** — sengaja tidak dikerjakan dalam tugas akhir ini.

---

## 1. Pengikatan Identitas Bisa Ditembus Lewat Praktik Jastip

**Ini keterbatasan terpenting di seluruh sistem**, dan sudah diketahui sejak
tahap analisis — bukan ditemukan belakangan.

### Apa batasnya

Sistem menegakkan aturan **satu tiket → satu alamat dompet → satu identitas
nyata**. Aturan ini efektif menghadang satu orang yang ingin memborong banyak
tiket atas namanya sendiri. Tapi **tidak menghadang praktik jasa titip
(jastip)**.

### Kenapa terjadi

Temuan ini berasal langsung dari lapangan. Wawancara dengan empat narasumber
pelaku *war* tiket yang sekaligus penyedia jastip menunjukkan bahwa **seluruh
narasumber sudah memegang data identitas calon pembeli — Nomor Induk
Kependudukan, nomor telepon, dan tanggal lahir — sebelum sesi perebutan tiket
dimulai**, sebagai bagian dari proses pemesanan jasa.

Artinya, saat sistem meminta pendaftaran identitas, penyedia jastip **memang
punya data identitas yang sah** milik penitipnya. Ia bisa mendaftar memakai data
itu, dan sistem tidak punya cara membedakannya dari pendaftaran oleh pemilik
identitas itu sendiri.

Narasumber juga mengonfirmasi praktik lanjutannya: penyedia jasa menunggu di
lokasi acara untuk membantu penukaran tiket pelanggannya menggunakan KTP yang
ada padanya.

### Seberapa besar dampaknya

**Praktik jastip tetap mungkin berjalan.** Yang berubah adalah bentuknya:
penyedia jasa tidak lagi bisa memborong tiket untuk ditimbun dan dijual ke siapa
pun, karena tiket sudah terikat pada identitas penitip tertentu sejak awal, dan
harganya tidak bisa dinaikkan.

### Apa yang meredamnya

**Motif keuntungannya, bukan praktiknya.** Yang tersisa bagi penyedia jastip
hanyalah **upah jasa** — berdasarkan wawancara, berkisar Rp25.000 sampai
Rp200.000 per tiket, dan bisa mencapai Rp500.000 untuk tiket yang sangat
diperebutkan. Yang hilang adalah keuntungan dari *markup* harga tiket itu
sendiri, yang bisa berlipat-lipat dari harga resmi.

### Kenapa ini bukan kelemahan rancangan

**Tidak ada pendekatan teknis mana pun yang bisa membedakan** antara seseorang
yang mendaftarkan identitasnya sendiri dan seseorang yang mendaftarkan identitas
orang lain yang datanya memang diserahkan secara sukarela. Pembedaan itu
memerlukan verifikasi kehadiran fisik pada saat pendaftaran — dan itu berada di
luar ruang lingkup tugas akhir ini.

Ini alasan kenapa keterbatasan ini digolongkan **melekat pada masalahnya**.

---

## 2. Pemeriksaan NIK Ganda Ikut Jatuh Bila Server Dikuasai

### Apa batasnya

Sistem menolak pendaftaran bila Nomor Induk Kependudukan yang sama sudah terikat
pada dompet lain (KF-11). **Pemeriksaan ini dilakukan server terhadap data di
MySQL, bukan di dalam smart contract.** Bila server dikuasai penyerang,
pemeriksaan ini bisa dilewati.

### Kenapa terjadi

Karena *salt* dibangkitkan **acak dan berbeda untuk setiap pengguna** (KNF-25),
dua orang yang mendaftarkan NIK yang sama menghasilkan **dua hash yang sama
sekali berbeda**. Smart contract hanya melihat hash, sehingga tidak punya cara
mengetahui keduanya berasal dari NIK yang sama.

### Kenapa rancangannya tetap begitu

Ini pertukaran yang disadari. Alternatifnya adalah memakai satu *salt* bersama
untuk semua pengguna — dengan itu, NIK yang sama menghasilkan hash yang sama,
dan pemeriksaan bisa dilakukan di dalam kontrak. Tapi harganya:

| | *Salt* per pengguna (dipakai) | *Salt* bersama (ditolak) |
|---|---|---|
| Pemeriksaan NIK ganda di kontrak | Tidak bisa | Bisa |
| Tahan penebakan menyeluruh atas NIK | **Ya** | **Tidak** |
| Ada satu rahasia bersama yang bisa bocor | Tidak | **Ya** |
| Bila rahasia itu bocor | — | **Seluruh data terbuka sekaligus** |

Perlindungan terhadap kerahasiaan data KTP dinilai lebih penting, karena data
yang terlanjur tertulis di blockchain **tidak bisa ditarik kembali oleh siapa
pun**.

> **Kenapa MySQL boleh memakai rahasia bersama padahal blockchain tidak.**
> Sejak 7 Agustus 2026, MySQL menyimpan satu sidik jari tambahan yang memakai
> ***pepper*** — rahasia yang sama untuk semua pengguna — supaya NIK yang sama
> selalu menghasilkan nilai yang sama dan pendaftaran ganda bisa dideteksi.
>
> Ini **bukan pembatalan** atas penolakan di atas. Perbedaannya pada tempat
> data yang dilindunginya berada: nilai ber-*pepper* itu tersimpan di MySQL
> yang tertutup dan **bisa dihitung ulang** dengan *pepper* baru bila bocor.
> Nilai ber-*salt* yang tercatat di blockchain terbuka untuk umum dan
> **permanen** — di sana rahasia bersama yang bocor tidak punya jalan
> perbaikan sama sekali. Uraiannya di Bagian 3.

### Perbandingan dengan aturan lain

| Aturan | Tetap berlaku bila server dikuasai? | Ditegakkan oleh |
|---|---|---|
| Kuota event | **Ya** | Smart contract |
| Penguncian harga jual ulang | **Ya** | Smart contract |
| Jalur perpindahan lewat *marketplace* | **Ya** | Smart contract |
| **Pemeriksaan NIK ganda** | **Tidak** | Server |

---

## 3. Kebocoran Identitas — Sebagian Besar Sudah Ditutup

> **Keputusan 7 Agustus 2026 mengubah keterbatasan ini secara mendasar.**
> Rancangan sebelumnya menyimpan **data KTP asli** di MySQL, sehingga kebocoran
> database berarti kebocoran identitas seluruh pengguna. **Data KTP kini tidak
> disimpan dalam bentuk terbaca di mana pun** (KF-10).

### Apa yang sudah tertutup

**Kebocoran seluruh isi database tidak lagi membocorkan identitas siapa pun.**
Yang tersimpan hanya dua nilai hash, dan hash tidak bisa dibalik menjadi data
asli.

Harganya dibayar di tempat lain: petugas di lokasi acara **tidak lagi bisa
melihat** identitas terdaftar. Ia harus memegang KTP fisik dan memasukkan NIK-nya
untuk dicocokkan (KF-51). Ini menambah pekerjaan di pintu masuk, tapi
menghilangkan seluruh jalur kebocoran lewat layar petugas.

### Apa yang masih terbuka

**Tiga celah yang tersisa, dan semuanya lebih sempit dari sebelumnya.**

| Celah | Apa yang bisa terjadi | Seberapa besar |
|---|---|---|
| ***Pepper* ikut bocor bersama database** | Penyerang bisa menghitung sidik jari semua kemungkinan NIK dan mencocokkannya. `nik_indeks` terbuka | **Terbesar.** Karena itu *pepper* wajib disimpan **di luar** database yang dilindunginya |
| **Titik layanan pencocokan dipakai untuk memastikan tebakan** | Seseorang yang menduga NIK tertentu milik pengguna tertentu bisa mengonfirmasinya | Sedang. Diredam dengan pembatasan jumlah percobaan dan pencatatan setiap pemanggilan |
| **Data bocor saat pemrosesan, bukan saat penyimpanan** | Data KTP tetap melewati server saat pendaftaran. Bila tercatat ke *log* atau tertahan di suatu tempat, kebocoran tetap mungkin | Kecil tapi mudah terjadi karena kelalaian — KNF-24 melarangnya secara khusus |

**Baris pertama adalah yang paling penting.** *Pepper* adalah satu-satunya
rahasia yang tersisa, dan seluruh perlindungan bergantung padanya. Menyimpannya
di dalam database yang sama dengan data yang dilindunginya membatalkan seluruh
manfaatnya.

**Yang membedakannya dari rahasia bersama untuk data on-chain yang ditolak di
Bagian 2:** bila *pepper* bocor, seluruh `nik_indeks` **bisa dihitung ulang**
dengan *pepper* baru, karena datanya ada di MySQL yang bisa diubah. Data yang
terlanjur tertulis di blockchain tidak punya jalan keluar seperti itu.

### Catatan dari lapangan

Kekhawatiran ini muncul langsung dari narasumber wawancara. Salah satu
narasumber secara khusus menyampaikan kekhawatiran terhadap risiko kebocoran
data KTP yang dinilainya sudah banyak beredar dan berpotensi disalahgunakan.

**Keputusan meng-*hash* seluruh data KTP adalah tanggapan langsung terhadap
kekhawatiran itu**, dan membuat sistem ini menyimpan lebih sedikit data pribadi
daripada sistem tiket konvensional mana pun yang meminta KTP.

---

## 4. Pengguna Tidak Memegang Kunci Pribadinya Sendiri

### Apa batasnya

Dompet pengguna adalah *smart account* ERC-4337 yang dikendalikan sistem.
Pengguna **tidak memegang kunci pribadinya sendiri**, sehingga kendali atas
tiketnya bergantung pada sistem tetap beroperasi.

### Kenapa terjadi

Ini konsekuensi langsung dari cara sistem mengatasi masalah ketiga: masyarakat
awam kesulitan memakai sistem berbasis blockchain. Menghapus keharusan mengurus
kunci pribadi berarti seseorang lain harus mengurusnya.

### Pertukarannya

| | Pengguna pegang kunci sendiri | **Sistem yang mengurus (dipakai)** |
|---|---|---|
| Perlu paham blockchain | **Ya** | Tidak |
| Perlu punya aset kripto | **Ya** | Tidak |
| Kunci hilang | **Tiket hilang selamanya** | Tidak terjadi |
| Kendali penuh di tangan pengguna | **Ya** | Tidak |
| Sistem berhenti beroperasi | Tiket tetap bisa diakses | **Akses bergantung pada sistem** |

### Catatan yang perlu ditulis jujur

Hasil kuesioner menunjukkan **100% responden menyatakan lebih tenang bila
memegang kendali penuh atas penyimpanan tiket digitalnya sendiri**, dibandingkan
sepenuhnya diserahkan pada server platform.

Rancangan ini **belum sepenuhnya menjawab keinginan itu.** Kepemilikan tiket
memang tercatat atas nama dompet pengguna di blockchain — sesuatu yang tidak ada
pada sistem tiket konvensional — tapi kendali atas dompet itu masih berada di
sistem.

**Arah pengembangan lanjutan yang mungkin:** ERC-4337 memungkinkan penambahan
cara pemulihan kendali oleh pengguna sendiri di kemudian hari. Hal itu **tidak
dikerjakan dalam tugas akhir ini**.

---

## 5. Satu Celah pada Kontrak Berdampak ke Semua Event

### Apa batasnya

Sistem memakai **satu** `TicketContract` untuk seluruh event (Model B). Bila
ditemukan celah keamanan pada kontrak itu, **seluruh event ikut terdampak**,
bukan hanya satu.

### Kenapa rancangannya tetap begitu

Alternatifnya adalah menerbitkan satu kontrak baru untuk setiap event (Model A),
sehingga celah hanya berdampak pada satu event. Tapi Model A menuntut biaya gas
setiap kali ada event baru, menghasilkan banyak alamat kontrak yang harus
dikelola, dan membuat pembaruan aturan harus dilakukan di setiap kontrak.

**Pertimbangan yang menentukan:** satu kontrak berarti **satu permukaan serangan
yang bisa diuji secara menyeluruh**. Banyak kontrak yang masing-masing diuji
seadanya justru berisiko lebih besar. Untuk ruang lingkup tugas akhir dengan
jumlah event terbatas, menyeluruh dinilai lebih penting daripada terpisah.

---

## 6. Penyaring Bot Tidak Menghentikan Pelaku yang Bekerja Manual

### Apa batasnya

Cloudflare Turnstile menghadang **program otomatis**. Ia tidak menghadang
**manusia yang bekerja cepat dengan banyak perangkat**.

### Kenapa terjadi

Temuan ini juga berasal dari wawancara. Keempat narasumber menyatakan bahwa
proses *war* tiket mereka **dilakukan manual, tanpa bot maupun program
otomatis** — memakai kombinasi laptop dan ponsel secara bersamaan, atau bahkan
mengajak orang lain membantu membeli.

Terhadap CAPTCHA, pandangan mereka beragam. Salah satu narasumber menilai
tingkat hambatannya mencapai 8 dari 10. Tapi seluruh narasumber sepakat bahwa
hambatan itu **tidak menghentikan, hanya memperlambat** — dan strategi banyak
perangkat tetap membuat mereka berhasil.

### Seberapa besar dampaknya

**Kecil, karena motifnya sudah dimatikan di tempat lain.** Seseorang yang
berhasil membeli beberapa tiket dengan cara manual tetap tidak bisa menjualnya
di atas harga resmi, dan tetap terikat batas beli per dompet per event.

Ini menunjukkan pola yang berulang di seluruh rancangan: **penyaring bot bukan
pertahanan utama terhadap calo.** Pertahanan utamanya adalah penguncian harga.
Penyaring bot hanya mengurangi beban server dan memperlambat pembelian massal
lewat situs web.

---

## 7. Serangan Sybil Tidak Ditangani Menyeluruh

### Apa batasnya

Penyaring bot dirancang khusus untuk mencegah **program otomatis**, dan **tidak
mencakup pencegahan serangan Sybil secara menyeluruh** — yaitu satu orang yang
membuat banyak identitas berbeda.

### Apa yang meredamnya

Pengikatan identitas KTP menekan serangan Sybil secara berarti: satu orang tidak
bisa membuat banyak akun dengan identitas fiktif, karena setiap akun menuntut
satu NIK yang belum terpakai.

### Apa yang tetap terbuka

Seseorang yang memperoleh data KTP milik orang lain — lewat jastip seperti pada
keterbatasan nomor 1, atau lewat data yang sudah beredar — **tetap bisa
mendaftarkan banyak akun**. Sistem tidak punya cara memastikan bahwa pemilik NIK
benar-benar orang yang sedang mendaftar.

---

## 8. Berjalan di Jaringan Uji Coba

### Apa batasnya

Seluruh sistem berjalan di **Sepolia Testnet**, bukan jaringan Ethereum
sungguhan. Mata uang di jaringan ini tidak bernilai nyata.

### Akibatnya bagi hasil penelitian

| Hal | Akibatnya |
|---|---|
| Biaya gas | Angka yang terukur sahih secara teknis, tapi **nilai rupiahnya tidak bisa disimpulkan** dari sini |
| Kepadatan jaringan | Sepolia jauh lebih lengang, sehingga **waktu konfirmasi tidak menggambarkan keadaan sungguhan** |
| Tekanan serangan sungguhan | Karena tidak ada nilai ekonomi nyata, **tidak ada penyerang sungguhan yang tertarik** — pengujian keamanan sepenuhnya bergantung pada skenario yang dirancang sendiri |
| Kelangsungan jaringan | Jaringan uji coba **bisa disetel ulang atau dihentikan** pengelolanya |

**Butir ketiga adalah yang paling penting untuk ditulis jujur.** Pengujian
keamanan pada tugas akhir ini hanya sekuat skenario yang terpikirkan
perancangnya. Celah yang tidak terpikirkan tidak akan ketahuan, karena tidak ada
pihak luar yang punya motif menemukannya.

---

## 9. Pembayaran Hanya Simulasi

### Apa batasnya

Pembayaran memakai **Midtrans sandbox**. Tidak ada transaksi keuangan nyata.

### Yang tidak bisa diuji karenanya

| Hal | Kenapa tidak bisa diuji |
|---|---|
| Kegagalan pembayaran sungguhan | Pola kegagalan di lingkungan simulasi tidak sama dengan di lingkungan sungguhan |
| **Penerusan dana ke rekening penjual** | Pencairan dana ke rekening bank sungguhan tidak bisa dijalankan di sandbox. Alurnya bisa diuji, **keberhasilan pencairannya tidak** — `[BUTUH DATA UJI]` |
| Perselisihan pembayaran | Di luar ruang lingkup |

**Justru karena pengembalian dana tidak bisa diuji di sandbox**, rancangan
memilih **mencegah** perebutan pembeli lewat penguncian penawaran, bukan
mengembalikan uang setelahnya (KF-56). Keterbatasan lingkungan ini secara
langsung memengaruhi keputusan rancangan — bukan sekadar catatan pinggir.

### Penerusan uang tidak punya penjagaan di luar server

Ini keterbatasan yang **melekat pada keputusan memakai Midtrans untuk urusan
uang**, bukan blockchain.

| | Ditegakkan oleh | Tetap aman bila server dikuasai? |
|---|---|---|
| Kepemilikan tiket, kuota, `originalPrice` | Smart contract | **Ya** |
| Jalur perpindahan tiket | Smart contract | **Ya** |
| **Penerusan uang ke rekening penjual** | **Server saja** | **Tidak** |

Penyerang yang menguasai server bisa mengarahkan pencairan dana ke rekening
lain. Tiketnya tetap tidak bisa disalahgunakan — kuota, harga, dan jalur
perpindahan tetap berdiri — tapi uangnya tidak terlindungi.

**Kenapa rancangannya tetap begitu:** memindahkan urusan uang ke blockchain
berarti pengguna harus memegang aset kripto, dan itu **mengembalikan persis
hambatan yang ingin dihapus sistem ini** (masalah ketiga di
[`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) Bagian 2.3). Pertukarannya
dipilih secara sadar: kemudahan pengguna ditukar dengan perlindungan uang yang
bertumpu pada server.

---

## 10. Bergantung pada Beberapa Layanan Pihak Ketiga

### Apa batasnya

Sistem ini **tidak sepenuhnya terdesentralisasi**, meskipun berjalan di atas
blockchain.

| Layanan | Perannya | Bila layanan berhenti |
|---|---|---|
| **Alchemy** | Jalur komunikasi server ke blockchain | Sistem tidak bisa membaca maupun menulis ke blockchain |
| **Pinata** | Penjaga berkas di IPFS | Keterangan dan gambar tiket bisa hilang, sementara NFT-nya tetap menunjuk ke sana |
| **ZeroDev** | Pembuatan dan pengoperasian dompet ERC-4337 | Pembuatan dompet baru terhenti |
| **Midtrans** | Pembayaran | Pembelian terhenti |
| **Cloudflare** | Penyaring bot | Penyaringan di situs web hilang |

### Yang perlu disadari tentang baris Pinata

**Kepemilikan tiket tetap aman** meskipun Pinata berhenti — itu tercatat di
blockchain. Yang hilang adalah **keterangan dan gambar tiketnya**. Tiket tetap
sah dan tetap milik pemiliknya, tapi keterangannya tidak lagi bisa ditampilkan.

Ini menunjukkan bahwa jaminan yang diberikan blockchain **hanya berlaku untuk
apa yang benar-benar disimpan di dalamnya.**

---

## 11. Biaya Gas Ditanggung Sistem Tanpa Model Pembiayaan

### Apa batasnya

Seluruh biaya gas ditanggung sistem lewat *Paymaster* (KF-05). **Belum ada
rancangan tentang dari mana biaya itu dibiayai** bila sistem dipakai dalam skala
sungguhan.

### Kenapa belum jadi masalah sekarang

Di Sepolia Testnet, biaya gas tidak bernilai nyata. Masalah ini hanya muncul
bila sistem dipindahkan ke jaringan sungguhan — dan itu di luar ruang lingkup
tugas akhir ini.

### Yang perlu diperhatikan

Setiap transaksi yang bisa dipanggil siapa saja dan menghabiskan gas sistem
adalah **beban yang berpotensi disalahgunakan**. Gerbang tanda tangan digital
sudah meredamnya — pemanggilan tanpa tanda tangan sah ditolak sebelum pekerjaan
berat dilakukan.

---

## 12. Verifikasi di Lokasi Acara Bergantung pada Kejujuran Petugas

### Apa batasnya

Pencocokan antara data KTP terdaftar dan KTP fisik yang ditunjukkan pengunjung
dilakukan **oleh manusia** (KF-51, Alur 6.2 langkah 4 dan 5). Sistem tidak bisa
memastikan pencocokan itu benar-benar dilakukan.

### Kenapa terjadi

Sistem hanya bisa menyajikan data pembanding. Keputusan cocok atau tidak berada
di tangan petugas.

### Kenapa ini melekat pada masalahnya

Menghilangkan peran manusia menuntut verifikasi biometrik atau pembacaan KTP
elektronik — keduanya di luar ruang lingkup tugas akhir ini, dan keduanya punya
persoalan privasinya sendiri.

**Yang meredamnya:** penandaan tiket terpakai dicatat **di blockchain** (KF-49),
sehingga meskipun pencocokan identitas dilewati, **satu tiket tetap tidak bisa
dipakai dua kali**. Kelonggaran pada pencocokan identitas tidak merembet menjadi
kelonggaran pada penggandaan tiket.

---

## 13. Hal yang Belum Diputuskan

### 13.1 Sudah diputuskan 7 Agustus 2026

| Yang sebelumnya belum diputuskan | Keputusannya |
|---|---|
| Cara uang hasil penjualan kembali sampai ke penjual | **Diteruskan ke rekening bank penjual lewat Midtrans**, dan baru dimulai setelah kepemilikan tiket benar-benar berpindah (KF-58, KF-59) |
| Cara mengembalikan uang pembeli kedua bila dua orang membayar tiket yang sama | **Tidak ada pengembalian dana** — perebutan dicegah dengan mengunci penawaran begitu satu pembeli mulai membayar (KF-56, KF-57) |
| Perlukah data KTP dienkripsi di database | **Tidak dienkripsi, melainkan di-*hash*** — tidak ada data KTP terbaca di mana pun (KF-10) |

### 13.2 Masih perlu dibahas

| Yang belum diputuskan | Kenapa penting | Rujukan |
|---|---|---|
| **Berapa lama batas waktu penguncian penawaran** | Terlalu pendek merugikan pembeli yang sedang membayar; terlalu panjang menahan tiket tanpa perlu | [`07-alur-pengguna.md`](07-alur-pengguna.md) Bagian 5.8 |
| **Di mana *pepper* disimpan dan bagaimana menggantinya bila bocor** | Seluruh perlindungan identitas bergantung padanya — lihat Bagian 3 | [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 5.2 |
| **Adakah potongan biaya pada pencairan dana** | Menentukan berapa yang benar-benar diterima penjual | [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 18.2 |
| **Rancangan database secara keseluruhan** | Masih berstatus draf, menunggu persetujuan pembimbing | [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) |

---

## 14. Kinerja Sistem Belum Terukur

Seluruh tuntutan kinerja masih bertanda `[BUTUH DATA UJI]`. Daftar lengkapnya
ada di [`02-kebutuhan-non-fungsional.md`](02-kebutuhan-non-fungsional.md)
Bagian 10.

**Yang belum diketahui:**

- Biaya gas per fungsi smart contract
- Waktu dari pembayaran lunas sampai tiket tercetak
- Jumlah permintaan serentak yang sanggup dilayani
- Ketersediaan sistem selama masa pengujian
- Tingkat kemudahan penggunaan menurut pengguna

Ini **bukan keterbatasan permanen**, melainkan keadaan sementara sampai tahap
uji coba dilaksanakan.

---

## 15. Yang Sengaja Tidak Dicakup

Bukan keterbatasan yang muncul dari rancangan, melainkan batas ruang lingkup
yang ditetapkan sejak awal.

| Tidak dicakup | Alasan |
|---|---|
| Integrasi dengan sistem tiket pihak ketiga | Batasan ruang lingkup |
| Manajemen denah kursi dinamis | Batasan ruang lingkup |
| Event gratis atau berkapasitas tidak terbatas | Tidak punya masalah yang ingin diselesaikan sistem ini — perebutan dan calo hanya muncul pada event berbayar berkapasitas terbatas |
| Aplikasi *native* Android dan iOS | Sistem dibangun berbasis web |
| Jenis event di luar enam kategori yang ditetapkan | Batasan ruang lingkup |

---

## 16. Cara Berkas Ini Dipakai

**Tambahkan butir baru seiring pengerjaan.** Keterbatasan yang ditemukan saat
menulis kode — hal yang ternyata tidak bisa dilakukan, atau kasus yang ternyata
tidak tertangani — sebaiknya dicatat di sini saat itu juga, bukan diingat-ingat
sampai akhir.

**Setiap butir baru sebaiknya menjawab empat pertanyaan yang sama:** apa
batasnya, kenapa terjadi, seberapa besar dampaknya, dan apa yang meredamnya.
Butir yang hanya menyebutkan batasnya tanpa penjelasan justru melemahkan
dokumen, karena terbaca sebagai kelemahan yang tidak dipahami.
