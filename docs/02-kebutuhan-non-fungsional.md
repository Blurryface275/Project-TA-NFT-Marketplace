# 02 — Kebutuhan Non-Fungsional

**Kebutuhan non-fungsional (KNF)** bukan tentang *apa* yang sistem lakukan,
melainkan **seberapa baik sistem melakukannya**.

Bedanya dengan kebutuhan fungsional bisa dilihat dari sepasang contoh:

| | Contoh |
|---|---|
| **Kebutuhan fungsional** (KF) | "Sistem harus dapat mencetak tiket sebagai NFT ke dompet pengguna." → fiturnya ada atau tidak |
| **Kebutuhan non-fungsional** (KNF) | "Data KTP tidak boleh pernah tersimpan dalam bentuk terbaca di mana pun." → fiturnya layak dipakai atau tidak |

Kebutuhan fungsional ada di
[`01-kebutuhan-fungsional.md`](01-kebutuhan-fungsional.md).

---

## 1. ATURAN KERAS: Angka Kinerja Belum Boleh Diisi

**Setiap target angka yang belum diukur ditandai `[BUTUH DATA UJI]`.**

Ini bukan kelalaian penulisan, melainkan keputusan sadar. Menuliskan angka
seperti "waktu tanggap di bawah 2 detik" tanpa pengukuran berarti mengarang
klaim yang **bisa diminta buktinya saat sidang**. Kalau bukti pengukurannya
tidak ada, kredibilitas seluruh dokumen ikut jatuh — termasuk bagian-bagian yang
sebenarnya benar.

Menuliskan `[BUTUH DATA UJI]` justru menunjukkan bahwa penulis membedakan mana
yang sudah diukur dan mana yang belum.

**Daftar lengkap angka yang masih harus diukur ada di Bagian 10**, supaya saat
tahap pengujian tiba, tidak ada yang terlewat.

---

## 2. Kategori yang Dipakai: ISO/IEC 25010

**ISO/IEC 25010** adalah standar internasional tentang **model mutu perangkat
lunak**. Standar ini membagi mutu sebuah sistem menjadi beberapa karakteristik,
sehingga pembahasan mutu tidak bergantung pada selera penulis.

Standar ini dipakai sebagai kerangka pengelompokan agar tidak ada aspek mutu
yang terlewat begitu saja.

**Berkas ini memakai tujuh dari delapan karakteristik** ISO/IEC 25010:

| Kode | Karakteristik | Nama aslinya | Kode KNF |
|---|---|---|---|
| A | Kesesuaian Fungsional | *Functional Suitability* | KNF-01 – KNF-03 |
| B | Efisiensi Kinerja | *Performance Efficiency* | KNF-04 – KNF-08 |
| C | Kompatibilitas | *Compatibility* | KNF-09 – KNF-12 |
| D | Kebergunaan | *Usability* | KNF-13 – KNF-18 |
| E | Keandalan | *Reliability* | KNF-19 – KNF-23 |
| F | Keamanan | *Security* | KNF-24 – KNF-32, **KNF-37 – KNF-38** |
| G | Kemampuan Pemeliharaan | *Maintainability* | KNF-33 – KNF-36 |

**Total: 38 kebutuhan non-fungsional.**

> **KNF-37 dan KNF-38 ditambahkan pada 7 Agustus 2026**, mengikuti keputusan
> meng-*hash* seluruh data KTP. Kodenya **hanya ditambah di belakang**, tidak
> disisipkan di tengah kategori F — menyisipkannya akan menggeser penomoran
> seluruh kebutuhan sesudahnya dan membuat rujukan di berkas lain ikut salah.

**Karakteristik kedelapan — Portabilitas (*Portability*) — sengaja tidak
dipakai.** Portabilitas menyangkut kemudahan memindahkan perangkat lunak ke
lingkungan lain. Untuk sistem ini pertanyaan itu tidak bermakna: sisi
penggunanya berjalan di dalam peramban, sehingga tidak terikat sistem operasi
mana pun; sedangkan smart contract-nya terikat pada mesin virtual Ethereum dan
memang tidak dimaksudkan dipindahkan ke luar itu. Aspek "bisa dipakai di
perangkat apa saja" yang tetap relevan sudah tercakup di Kompatibilitas
(KNF-10).

> **Catatan penyusunan:** `tasks.md` menyebut adanya draf 15 kebutuhan
> non-fungsional dalam 7 kategori. Draf tersebut **tidak ditemukan** di dalam
> repositori maupun di kedua berkas PDF di folder `dokumen/`. Daftar ini karena
> itu disusun ulang dari arsitektur final, sehingga jumlahnya berbeda. Jumlah
> kategorinya tetap tujuh.

---

## 3. A — Kesesuaian Fungsional

*Sejauh mana sistem menyediakan fungsi yang benar dan tepat.*

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-01** | `TicketContract` harus memenuhi **seluruh antarmuka wajib standar ERC-721**, sehingga tiket dapat dikenali alat pihak ketiga mana pun yang mendukung standar tersebut | Pengujian kesesuaian antarmuka standar |
| **KNF-02** | Setiap kebutuhan fungsional di [`01-kebutuhan-fungsional.md`](01-kebutuhan-fungsional.md) harus memiliki **minimal satu skenario pengujian** yang merujuk kodenya | Penelusuran kode KF ke berkas uji |
| **KNF-03** | Data kepemilikan tiket yang ditampilkan sistem harus **selalu sama dengan yang tercatat di blockchain**. Bila salinan di MySQL berbeda, yang berlaku adalah blockchain | Pembandingan salinan MySQL dengan blockchain |

**KNF-03 adalah penegasan aturan di [`03-arsitektur-sistem.md`](03-arsitektur-sistem.md)
Bagian 6.3:** blockchain adalah sumber kebenaran, MySQL hanya salinan untuk
mempercepat tampilan.

---

## 4. B — Efisiensi Kinerja

*Seberapa cepat sistem bekerja dan seberapa hemat sumber daya yang dipakainya.*

**Seluruh kategori ini belum punya angka.** Semua target menunggu pengukuran
pada tahap uji coba.

| Kode | Kebutuhan | Cara mengukurnya |
|---|---|---|
| **KNF-04** | Biaya gas setiap fungsi smart contract tidak boleh melebihi `[BUTUH DATA UJI]` gas | Laporan gas Foundry per fungsi |
| **KNF-05** | Halaman katalog dan rincian event harus tampil dalam waktu tidak lebih dari `[BUTUH DATA UJI]` detik | Pengukuran waktu muat halaman |
| **KNF-06** | Jarak waktu antara pembayaran dinyatakan lunas dan tiket tercetak di dompet pengguna tidak boleh lebih dari `[BUTUH DATA UJI]` detik | Pencatatan waktu dari terimanya pemberitahuan Midtrans sampai transaksi tercatat di blockchain |
| **KNF-07** | Sistem harus sanggup melayani `[BUTUH DATA UJI]` permintaan pembelian serentak tanpa kegagalan | Pengujian beban |
| **KNF-08** | Berkas gambar tiket yang diunggah ke IPFS tidak boleh melebihi `[BUTUH DATA UJI]` | Pemeriksaan batas ukuran unggahan |

**KNF-06 dan KNF-07 menjawab keluhan nyata dari lapangan.** Hasil wawancara
menunjukkan tiga dari empat narasumber mengeluhkan performa sistem tiket
konvensional yang tidak stabil saat perebutan tiket berlangsung — server
kewalahan, pembayaran gagal, dan kesalahan sistem seperti *error* 404. Salah
satu narasumber bahkan kehilangan tiket karena pembayarannya gagal padahal
antreannya sudah di depan.

**Catatan penting tentang KNF-06:** waktu ini **tidak sepenuhnya berada dalam
kendali sistem**, karena bergantung pada waktu konfirmasi jaringan Sepolia yang
ditentukan jaringan itu sendiri. Saat mengukurnya nanti, waktu tunggu jaringan
harus **dipisahkan** dari waktu pemrosesan sistem, supaya angka yang dilaporkan
menggambarkan hal yang benar-benar bisa dipertanggungjawabkan.

---

## 5. C — Kompatibilitas

*Sejauh mana sistem dapat bekerja bersama sistem lain.*

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-09** | Tiket harus dapat dibaca dan diperiksa lewat **penjelajah blockchain umum** tanpa memakai aplikasi sistem ini | Pemeriksaan langsung di penjelajah blockchain Sepolia |
| **KNF-10** | Aplikasi harus berjalan pada peramban **desktop maupun ponsel** | Pengujian pada beberapa peramban dan ukuran layar |
| **KNF-11** | Sistem harus memakai **EntryPoint ERC-4337 versi 0.7 pada alamat resminya**, bukan kontrak buatan sendiri | Pemeriksaan alamat kontrak yang dipakai |
| **KNF-12** | Keterangan tiket yang disimpan di IPFS harus memakai format yang lazim dipakai NFT, sehingga terbaca alat pihak ketiga | Pemeriksaan format keterangan |

**KNF-09 adalah kebutuhan yang menopang KF-37** — pembuktian kepemilikan secara
mandiri. Kalau tiket hanya bisa dibaca lewat aplikasi ini, maka pengguna kembali
harus mempercayai platform, dan salah satu manfaat utama sistem hilang.

---

## 6. D — Kebergunaan

*Seberapa mudah sistem dipakai oleh penggunanya.*

Kategori ini **langsung menjawab masalah ketiga** di
[`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) Bagian 2.3, sehingga
bobotnya di sistem ini lebih besar daripada di sistem web biasa.

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-13** | Pengguna harus dapat menyelesaikan pendaftaran akun sampai memiliki dompet aktif **tanpa pengetahuan blockchain apa pun** | Pengujian terhadap responden yang belum pernah memakai blockchain |
| **KNF-14** | Antarmuka **tidak boleh menampilkan istilah teknis blockchain** — *gas*, *minting*, *private key*, *smart contract* — tanpa penjelasan dalam bahasa sehari-hari | Penelaahan seluruh teks antarmuka |
| **KNF-15** | Pengguna **tidak boleh diwajibkan memasang perangkat lunak tambahan** apa pun, termasuk ekstensi peramban | Penelusuran alur pendaftaran sampai pembelian |
| **KNF-16** | Setiap pesan kesalahan harus **menyebutkan penyebabnya dan langkah yang harus diambil pengguna**, ditulis dalam Bahasa Indonesia | Pendataan seluruh pesan kesalahan |
| **KNF-17** | Alur pembelian tiket dari pemilihan sampai tiket diterima harus dapat diselesaikan dalam tidak lebih dari `[BUTUH DATA UJI]` langkah | Penghitungan langkah pada alur akhir |
| **KNF-18** | Tingkat kemudahan penggunaan sistem menurut penilaian pengguna harus mencapai `[BUTUH DATA UJI]` | Kuesioner kepada responden setelah mencoba sistem |

**KNF-14 dan KNF-15 adalah penegasan KF-04 di sisi mutu.** Keduanya menjadi
titik periksa yang tegas: kalau ada satu halaman saja yang meminta pengguna
memasang ekstensi atau menampilkan istilah "*private key*" tanpa penjelasan,
kebutuhan ini gagal — sekalipun seluruh fitur berjalan sempurna.

**KNF-18 akan diukur lewat kuesioner pada tahap validasi**, bagian dari
metodologi penelitian. Angkanya belum bisa ditulis sekarang.

---

## 7. E — Keandalan

*Seberapa besar kemungkinan sistem tetap bekerja benar, termasuk saat ada yang
gagal.*

Kategori ini penting karena sistem ini melibatkan **uang dan blockchain
sekaligus**. Kegagalan di tengah alur bisa menyebabkan pengguna sudah membayar
tapi tidak mendapat tiket — dan transaksi blockchain tidak bisa dibatalkan
begitu tercatat.

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-19** | Kegagalan pada langkah mana pun dalam alur pembelian **tidak boleh menyebabkan pengguna kehilangan uang tanpa memperoleh tiket** | Pengujian dengan kegagalan disengaja di tiap langkah |
| **KNF-20** | Bila pencetakan tiket gagal setelah pembayaran dinyatakan lunas, sistem harus dapat **mengulang pencetakan tanpa meminta pembayaran ulang** | Pengujian dengan kegagalan pencetakan disengaja |
| **KNF-21** | Pemberitahuan pembayaran yang sama dari Midtrans, bila diterima lebih dari sekali, **tidak boleh menghasilkan lebih dari satu tiket** | Pengiriman pemberitahuan berulang secara sengaja |
| **KNF-22** | Bila layanan luar — Midtrans, Pinata, atau Alchemy — tidak tersedia, sistem harus **memberi tahu pengguna secara jelas**, bukan gagal diam-diam atau menampilkan halaman kosong | Pengujian dengan layanan luar dimatikan |
| **KNF-23** | Ketersediaan sistem selama masa pengujian harus mencapai `[BUTUH DATA UJI]` | Pencatatan waktu sistem tidak dapat diakses |

**KNF-21 patut mendapat perhatian khusus saat menulis kode.** Layanan pembayaran
pada umumnya **mengirim ulang pemberitahuan** bila balasan pertama tidak
diterima dengan baik. Kalau setiap pemberitahuan langsung memicu pencetakan
tanpa memeriksa apakah pesanan itu sudah pernah diproses, satu pembayaran bisa
menghasilkan beberapa tiket — dan tiket yang terlanjur tercetak di blockchain
**tidak bisa ditarik kembali**, hanya bisa dibakar lewat transaksi tambahan.

**KNF-19 dan KNF-20 berpasangan.** KNF-19 menyatakan hasil akhir yang tidak
boleh terjadi; KNF-20 menyatakan cara pemulihannya. Tanpa KNF-20, satu-satunya
cara memenuhi KNF-19 adalah mengembalikan uang — padahal pengguna sebenarnya
menginginkan tiketnya, bukan uangnya kembali.

---

## 8. F — Keamanan

*Sejauh mana sistem melindungi data dan menegakkan aturannya.*

Kategori terbesar di berkas ini, sesuai program kekhususan penelitian.

### 8.1 Perlindungan data identitas

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-24** | Data KTP dalam bentuk terbaca **tidak boleh tersimpan di mana pun** — tidak di blockchain, tidak di IPFS, tidak di MySQL, tidak di catatan sistem (*log*), dan tidak di balasan yang dikirim ke peramban. Data hanya boleh berada di dalam ingatan server selama pemrosesan berlangsung, lalu dibuang | Penelusuran seluruh jalur data KTP di dalam kode |
| **KNF-25** | *Salt* setiap pengguna harus **acak, berbeda untuk setiap pengguna**, dan dibangkitkan dengan pembangkit bilangan acak yang layak dipakai untuk keperluan kriptografi — bukan pembangkit acak biasa | Penelaahan kode pembangkitan *salt* |
| **KNF-26** | Kunci penandatangan milik sistem **tidak boleh pernah dikirim ke sisi peramban** dalam bentuk apa pun | Pemeriksaan seluruh balasan server dan berkas yang dikirim ke peramban |
| **KNF-37** | ***Pepper* sistem harus disimpan di luar database** yang dilindunginya, dan harus dapat diganti tanpa kehilangan data | Pemeriksaan tempat penyimpanan *pepper* |
| **KNF-38** | Titik layanan pencocokan identitas harus **membatasi jumlah percobaan** dan **mencatat setiap pemanggilan** | Percobaan pemanggilan berulang |

**KNF-24 diperketat pada 7 Agustus 2026.** Rumusan sebelumnya masih mengizinkan
data KTP asli tersimpan di MySQL. Sekarang tidak lagi — yang tersimpan hanya
sidik jari digitalnya. Akibatnya kebocoran seluruh isi database **tidak lagi
membocorkan identitas siapa pun.**

**KNF-24 mencakup catatan sistem (*log*) dengan sengaja.** Kebocoran data
rahasia lewat catatan sistem adalah kesalahan yang sangat umum dan mudah
terlewat, karena catatan biasanya tidak dianggap sebagai "penyimpanan data".

**KNF-37 adalah syarat agar KNF-24 benar-benar berarti.** *Pepper* adalah
satu-satunya rahasia yang tersisa setelah data KTP tidak lagi disimpan.
Menyimpannya di dalam database yang sama dengan data yang dilindunginya
membatalkan seluruh manfaatnya — penyerang yang memperoleh salinan database
sekaligus memperoleh kuncinya.

**KNF-38 menutup celah yang muncul justru karena rancangan barunya.** Titik
layanan pencocokan identitas menjawab "cocok" atau "tidak cocok". Tanpa
pembatasan, jawaban itu bisa dipakai untuk **memastikan tebakan** — seseorang
yang menduga sebuah NIK milik pengguna tertentu dapat mengonfirmasinya dengan
mencoba. Pembatasan percobaan membuat cara itu tidak sepadan.

**KNF-25 menyebut jenis pembangkit acaknya secara khusus** karena pembangkit
acak biasa dapat ditebak bila keadaan awalnya diketahui. *Salt* yang bisa
ditebak sama saja dengan tidak memakai *salt*, dan seluruh perlindungan pada
Bagian 4.4 arsitektur ikut gugur.

### 8.2 Penegakan aturan yang tidak boleh dilanggar

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-27** | Kuota event, `originalPrice`, dan pembatasan jalur perpindahan tiket **harus tetap berlaku meskipun server sistem sepenuhnya dikuasai penyerang** | Pengujian dengan menganggap kunci sistem sudah bocor |
| **KNF-28** | Tanda tangan EIP-712 harus **terikat pada satu alamat kontrak di satu jaringan tertentu**, sehingga tidak dapat dipakai ulang di kontrak lain maupun di jaringan lain | Percobaan memakai ulang tanda tangan di kontrak dan jaringan berbeda |
| **KNF-29** | Setiap tanda tangan izin hanya boleh **berlaku sekali pakai** dan memiliki batas waktu berlaku | Percobaan memakai ulang tanda tangan yang sama |
| **KNF-30** | `TicketContract` harus **menolak perpindahan kepemilikan antar pengguna yang tidak dijalankan `MarketplaceContract`**, termasuk bila dipanggil langsung lewat RPC di luar aplikasi | Percobaan memindahkan tiket langsung antar dompet |

**KNF-27 adalah kebutuhan keamanan paling menentukan di sistem ini.** Ia
menuntut agar ketiga aturan inti tetap berdiri **meskipun seluruh server jatuh
ke tangan penyerang**. Inilah alasan ketiga hal itu ditegakkan smart contract
dan bukan server — pembahasan lengkapnya di
[`03-arsitektur-sistem.md`](03-arsitektur-sistem.md) Bagian 8.

**KNF-30 adalah salah satu skenario pengujian keamanan yang sudah disebutkan di
ruang lingkup** buku tugas akhir: percobaan memindahkan tiket antar dompet
secara langsung di luar platform.

### 8.3 Perlindungan jalur masuk

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-31** | Seluruh komunikasi antara peramban, server, dan layanan luar harus memakai HTTPS | Pemeriksaan konfigurasi jalur komunikasi |
| **KNF-32** | Token Cloudflare Turnstile harus **diverifikasi di sisi server**, diperlakukan sebagai **sekali pakai**, dan ditolak bila sudah melewati masa berlakunya | Percobaan mengirim ulang token yang sama |

---

## 9. G — Kemampuan Pemeliharaan

*Seberapa mudah sistem diperbaiki, diuji, dan dilanjutkan pengerjaannya.*

Kategori ini punya alasan tambahan yang khas proyek ini: **setelah 10 Agustus
2026, kegiatan pemrograman turun menjadi hanya perbaikan kesalahan.** Kode yang
sulit dipahami kembali akan menjadi hambatan nyata pada masa itu.

| Kode | Kebutuhan | Cara memeriksanya |
|---|---|---|
| **KNF-33** | Berkas `foundry.toml` harus **menuliskan versi kompilator dan versi mesin virtual Ethereum secara eksplisit**, tidak mengandalkan nilai bawaan | Pemeriksaan isi `foundry.toml` |
| **KNF-34** | Cakupan pengujian smart contract harus mencapai `[BUTUH DATA UJI]` | Laporan cakupan pengujian Foundry |
| **KNF-35** | Aturan keamanan **tidak boleh ditaruh di sisi peramban**. Setiap aturan yang menentukan harus berada di server atau di smart contract | Penelaahan pembagian tanggung jawab antar lapisan |
| **KNF-36** | Setiap fungsi smart contract yang memeriksa tanda tangan harus **menyatakan dengan jelas siapa penandatangan yang diharapkan** — sistem atau pengguna — pada keterangan fungsinya | Penelaahan keterangan setiap fungsi |

**Kenapa KNF-33 sampai perlu ditulis sebagai kebutuhan:** nilai bawaan versi
mesin virtual pada kompilator Solidity **sudah beberapa kali berubah**. Kalau
tidak dituliskan eksplisit, hasil kompilasi bisa berbeda antara satu waktu dan
waktu lain tanpa ada perubahan kode sama sekali — dan perbedaan itu sangat sulit
dilacak penyebabnya. Saat ini `contracts/foundry.toml` **belum memenuhi
kebutuhan ini**.

**Kenapa KNF-36 perlu ada:** karena pengguna sistem ini memakai *smart account*
ERC-4337, cara memeriksa tanda tangan pengguna **berbeda** dari cara memeriksa
tanda tangan sistem. Salah menebak siapa penandatangannya menghasilkan fungsi
yang selalu menolak tanda tangan yang sebenarnya sah, tanpa pesan kesalahan yang
menunjuk ke penyebabnya. Menuliskannya di keterangan fungsi membuat kesalahan
ini ketahuan saat penelaahan kode, bukan saat pengujian.

---

## 10. Daftar Angka yang Masih Harus Diukur

Sembilan butir berikut adalah **seluruh** angka yang masih bertanda
`[BUTUH DATA UJI]`. Daftar ini menjadi acuan tahap uji coba.

| Kode | Yang harus diukur | Alat atau cara pengukuran |
|---|---|---|
| KNF-04 | Biaya gas per fungsi smart contract | Laporan gas Foundry |
| KNF-05 | Waktu muat halaman katalog dan rincian event | Pengukuran waktu muat di peramban |
| KNF-06 | Waktu dari pembayaran lunas sampai tiket tercetak | Pencatatan waktu di server dan blockchain |
| KNF-07 | Jumlah permintaan pembelian serentak yang sanggup dilayani | Pengujian beban |
| KNF-08 | Batas ukuran berkas gambar tiket | Percobaan unggah berbagai ukuran |
| KNF-17 | Jumlah langkah alur pembelian | Penghitungan pada alur akhir |
| KNF-18 | Tingkat kemudahan penggunaan menurut pengguna | Kuesioner tahap validasi |
| KNF-23 | Ketersediaan sistem selama masa pengujian | Pencatatan waktu sistem tidak dapat diakses |
| KNF-34 | Cakupan pengujian smart contract | Laporan cakupan Foundry |

**Setelah setiap angka terukur:** ganti tanda `[BUTUH DATA UJI]` dengan angkanya
**beserta keterangan bagaimana angka itu diperoleh**. Angka tanpa keterangan cara
pengukurannya sama rawannya dengan angka yang dikarang, karena tetap tidak bisa
dipertanggungjawabkan saat ditanya.

---

## 11. Daftar Periksa Kelengkapan

Diperiksa terhadap ketentuan di `tasks.md` Langkah 5.

- [x] Dikelompokkan memakai kategori ISO/IEC 25010, dengan kepanjangan dan
      penjelasan standarnya disebutkan.
- [x] Tujuh kategori dipakai, dan **alasan tidak memakai kategori kedelapan
      ditulis terbuka** di Bagian 2.
- [x] Setiap kebutuhan punya kode `KNF-xx` yang bisa dirujuk.
- [x] **Tidak ada satu pun angka kinerja yang dikarang.** Seluruhnya bertanda
      `[BUTUH DATA UJI]` dan didaftar ulang di Bagian 10.
- [x] Setiap kebutuhan disertai cara memeriksanya, sehingga bisa diuji dan tidak
      berhenti sebagai pernyataan yang bagus di atas kertas.
- [x] Tidak ada kebutuhan yang menyebut *flash sale*, *commit-reveal*,
      Chainlink VRF, atau *Soulbound Token* sebagai bagian aktif sistem.
