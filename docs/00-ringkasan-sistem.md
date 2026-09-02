# 00 — Ringkasan Sistem

Berkas ini adalah pintu masuk folder `docs/`. Tujuannya: siapa pun yang belum
pernah mendengar proyek ini bisa paham **sistemnya untuk apa** hanya dengan
membaca berkas ini, tanpa perlu membuka berkas lain.

Istilah teknis yang muncul di sini dijelaskan di
[`08-daftar-istilah.md`](08-daftar-istilah.md).

---

## 1. Identitas Proyek

| | |
|---|---|
| **Judul** | Pembuatan Sistem Jual Beli Tiket Event Berbasis *Non-Fungible Token* |
| **Penulis** | Benedictus Leonardo Edward Stephen Sugianto |
| **NRP** | 160423176 |
| **Program studi** | Teknik Informatika — Program Kekhususan *Network & Cyber Security* |
| **Fakultas** | Teknik, Universitas Surabaya |
| **Pembimbing** | Maya Hilda Lestari Louk, S.Kom., M.Kom. dan Dr. Daniel Soesanto, S.T., M.M. |

---

## 2. Masalah yang Diselesaikan

Industri event di Indonesia tumbuh pesat, tapi keamanan sistem tiketnya
tertinggal. Satu platform saja — Loket — telah memfasilitasi lebih dari 25.000
acara sejak 2022 hingga Juli 2025, dengan pertumbuhan volume penjualan tiket
51,21 persen sepanjang 2023 sampai 2025 (JawaPos, 2025). Skala sebesar ini
tidak diimbangi perlindungan yang memadai, baik bagi konsumen maupun bagi
penyelenggara acara.

Ada **tiga masalah pokok** yang menjadi sasaran sistem ini. Dua yang pertama
adalah masalah pada sistem tiket yang ada sekarang. Yang ketiga adalah masalah
pada **solusinya** — dan kalau tidak ikut diselesaikan, dua masalah pertama
tetap tidak tertangani karena solusinya tidak akan terpakai.

### 2.1 Pemalsuan tiket

Tiket konvensional berupa kode QR atau *e-voucher* yang disimpan di server
terpusat. Bentuk ini bisa digandakan, dan pembeli tidak punya cara mandiri
untuk memastikan tiket yang dipegangnya asli sebelum tiba di lokasi acara.

Kasus nyata:

- **2023** — Ghisca Deborah Aritonang memalsukan 2.268 tiket konser Coldplay,
  kerugian Rp5,1 miliar (detikNews, 2024).
- **Desember 2024** — Respati Bayu Adhi memalsukan 188 tiket pertandingan
  Timnas Indonesia, kerugian ratusan juta rupiah (kumparan, 2025).
- **Sepanjang 2023** — PPATK melaporkan 180 kasus penipuan tiket konser dengan
  total transaksi mencurigakan Rp3,1 miliar (Kompas, 2023).

Jumlah kasus yang berulang setiap tahun menunjukkan masalahnya **bukan
kecerobohan satu-dua orang, melainkan celah struktural** pada rancangan sistem
tiket yang ada.

### 2.2 Manipulasi harga di pasar sekunder

Calo memborong tiket bukan untuk dipakai, melainkan untuk dijual kembali
dengan harga jauh di atas harga resmi. Konsumen yang benar-benar ingin
menonton terpaksa membayar berlipat, penyelenggara acara tidak menerima
tambahan apa pun dari selisih harga itu, dan reputasi kanal resmi ikut rusak.

Sistem tiket konvensional tidak punya mekanisme untuk mengontrol harga jual
ulang, karena begitu tiket berpindah tangan di luar platform, penyelenggara
kehilangan kendali sepenuhnya.

### 2.3 Masyarakat awam kesulitan memakai sistem berbasis blockchain

Dua masalah di atas bisa diselesaikan dengan teknologi blockchain. Tapi
teknologi itu membawa masalahnya sendiri: **untuk memakainya, pengguna
diharuskan lebih dulu memahami hal-hal yang tidak ada di sistem tiket biasa.**

Pada sistem berbasis blockchain yang ada sekarang, pengguna harus:

1. **Memasang dompet kripto lebih dulu**, misalnya ekstensi peramban MetaMask,
   sebelum bisa melakukan apa pun.
2. **Mengurus kunci pribadi (*private key*) dan frasa rahasia sendiri.** Kalau
   hilang, tiketnya hilang selamanya dan tidak ada pihak yang bisa
   memulihkannya. Kalau bocor, isi dompetnya bisa dikuras.
3. **Memiliki aset kripto lebih dulu** untuk membayar biaya gas setiap
   transaksi — padahal yang ingin dibelinya hanya sebuah tiket konser.

Hasil analisis sistem sejenis menunjukkan masalah ini nyata. **FIFA Collect**,
platform NFT resmi FIFA, sudah menerapkan kepemilikan tiket secara *on-chain*,
tapi penggunanya tetap diharuskan menghubungkan dompet luar seperti MetaMask —
sehingga tetap menuntut pemahaman teknis blockchain.

Penelitian terdahulu menegaskan hal yang sama: **hambatan utama adopsi tiket
berbasis NFT bukan kelemahan teknologinya, melainkan rendahnya pemahaman
masyarakat terhadap blockchain** (Saputro & Lathifah, 2025).

**Kenapa ini dihitung sebagai masalah, bukan sekadar ketidaknyamanan:** sistem
yang aman tapi tidak bisa dipakai orang awam tidak menyelesaikan masalah apa
pun. Konsumen yang tidak sanggup memakainya akan kembali ke jalur lama —
termasuk kembali membeli dari calo. Artinya masalah ketiga ini **membatalkan
manfaat dua masalah pertama** kalau dibiarkan.

**Cara sistem ini mengatasinya:** protokol **ERC-4337 (*Account Abstraction*)**.
Pengguna mendaftar cukup dengan surel, dompet blockchain dibuatkan otomatis, dan
seluruh biaya gas ditanggung sistem lewat *Paymaster*. Pengguna tidak pernah
berhadapan dengan kunci pribadi, frasa rahasia, maupun keharusan membeli aset
kripto. Rinciannya di Bagian 5.4.

### 2.4 Bukti dari lapangan

Kedua masalah di atas dikonfirmasi lewat pengumpulan data pada tahap analisis:
wawancara dengan **empat narasumber** pelaku *war* tiket yang sekaligus
penyedia jasa titip (jastip), dan kuesioner kepada **30 responden** pengguna
umum.

| Temuan | Angka |
|---|---|
| Responden yang sering melihat tiket dijual kembali dengan *markup* tinggi | 97% |
| Responden yang merasa tiket resmi habis dalam waktu tidak wajar | 93% |
| Responden yang menduga ada bot atau pembelian massal ilegal saat *war* tiket | 87% |
| Responden yang pernah mendengar kasus orang lain tertipu tiket palsu | 83% |
| Responden yang terpaksa membeli dari calo karena tiket resmi habis | 63% |
| Responden yang merasa aman bertransaksi dengan calo | 50% |

Angka terakhir adalah yang paling menjelaskan duduk perkaranya: **63% terpaksa
membeli dari calo, tapi hanya 50% merasa aman saat melakukannya.** Konsumen
tahu jalur itu berisiko, dan tetap menempuhnya karena tidak ada pilihan lain.

Dari sisi penerimaan terhadap solusi yang diusulkan, hasilnya justru sangat
mendukung:

| Temuan | Angka |
|---|---|
| Tertarik memakai sistem tiket yang menjamin keaslian dan membatasi harga jual kembali | 100% |
| Lebih tenang bila memegang kendali penuh atas tiket digitalnya sendiri | 100% |
| Tidak keberatan memakai sistem baru meski tidak paham detail teknisnya | 97% |
| Lebih nyaman bila pendaftaran cukup dengan surel tanpa kata sandi | 97% |
| Bersedia menunjukkan identitas resmi (KTP atau paspor) saat penukaran tiket | 93% |

Dua angka terakhir penting untuk arah rancangan: pengguna **bersedia**
menyerahkan identitas resmi dan **tidak keberatan** dengan teknologi yang tidak
mereka pahami — asalkan tidak dipaksa mempelajarinya.

---

## 3. Tujuan Sistem

> **Membuat sistem jual beli tiket event berbasis *Non-Fungible Token* yang
> aman dari pemalsuan tiket dan manipulasi harga di pasar sekunder.**

Tujuan itu diturunkan menjadi tiga sasaran yang bisa diperiksa satu per satu:

1. **Keaslian tiket bisa dibuktikan secara mandiri oleh pemiliknya**, tanpa
   perlu mempercayai server platform mana pun.
2. **Keuntungan dari penjualan ulang tiket dihilangkan**, sehingga memborong
   tiket tidak lagi masuk akal secara ekonomi.
3. **Sistem tetap bisa dipakai orang yang sama sekali tidak paham blockchain**,
   karena kalau syaratnya harus paham dulu, solusinya tidak akan terpakai.

Ketiga sasaran itu menjawab tiga masalah di Bagian 2 secara berurutan.

**Sasaran ketiga bukan tambahan pelengkap**, melainkan syarat agar dua sasaran
pertama benar-benar tercapai — alasannya sudah diuraikan di Bagian 2.3.

---

## 4. Bagaimana Sistem Menyelesaikannya — Ringkasan Satu Paragraf

Setiap tiket diterbitkan sebagai satu NFT standar ERC-721 di blockchain,
sehingga kepemilikannya tercatat permanen dan bisa diperiksa siapa saja tanpa
perlu mempercayai server platform — ini mematikan pemalsuan tiket. Tiket hanya
boleh berpindah tangan lewat satu pintu resmi, yaitu `MarketplaceContract`, dan
di pintu itu harga jual ulang **dikunci sama persis dengan harga beli awal**,
sehingga memborong tiket tidak lagi menghasilkan keuntungan — ini mematikan
motif calo. Agar sistem tetap bisa dipakai orang yang tidak paham blockchain,
pendaftaran cukup dengan surel: dompet blockchain dibuatkan otomatis lewat
ERC-4337 dan seluruh biaya transaksi ditanggung sistem, sehingga pengguna tidak
perlu mengurus kunci pribadi maupun memiliki aset kripto sama sekali.

---

## 5. Empat Keputusan yang Membentuk Sistem Ini

Empat hal berikut adalah inti rancangan. Alasan lengkap tiap keputusan ada di
[`03-arsitektur-sistem.md`](03-arsitektur-sistem.md).

### 5.1 Tiket sebagai NFT — melawan pemalsuan

Satu tiket sama dengan satu NFT ERC-721. Kepemilikannya tercatat di blockchain,
permanen, dan bisa diperiksa siapa pun secara mandiri.

**Akibatnya:** tidak ada cara menggandakan tiket, karena menerbitkan tiket baru
hanya bisa dilakukan lewat smart contract yang kuotanya sudah dipaksakan.
Pembeli juga tidak perlu mempercayai server platform untuk yakin tiketnya asli
— ia bisa membuktikannya sendiri.

### 5.2 Satu pintu penjualan ulang + harga terkunci — melawan calo

Dua aturan yang bekerja berpasangan:

- **Pembatasan allowlist** — hanya `MarketplaceContract` yang boleh memindahkan
  kepemilikan tiket antar pengguna. Tiket tidak bisa dijual diam-diam di luar
  sistem.
- **Penguncian harga jual ulang** — harga jual ulang otomatis dikunci sama
  dengan `originalPrice`, harga beli awal yang tercatat permanen saat tiket
  dicetak.

**Kenapa harus keduanya:** penguncian harga tanpa pembatasan allowlist tidak
ada gunanya, karena calo tinggal bertransaksi di luar sistem. Pembatasan
allowlist tanpa penguncian harga juga tidak cukup, karena calo tetap bisa
menaikkan harga di dalam sistem. Digabung, keduanya menutup jalan: satu-satunya
pintu yang tersedia adalah pintu yang keuntungannya sudah dimatikan.

> **Catatan penting:** tiket **tidak** dikunci mati. Tiket tetap bisa dijual
> kembali secara sah — misalnya oleh orang yang batal hadir. Yang dihilangkan
> adalah keuntungannya, bukan kemampuannya berpindah tangan.

### 5.3 Pengikatan identitas berbasis KTP

Aturannya: **satu tiket → satu alamat dompet → satu identitas nyata.**

Yang disimpan **hanya sidik jari digitalnya**, yaitu `keccak256(data KTP +
salt)`. **Data KTP aslinya tidak disimpan di mana pun** — tidak di blockchain,
dan tidak juga di database. Data hanya melewati ingatan server saat pendaftaran,
dihitung sidik jarinya, lalu dibuang.

**Ini hash, bukan enkripsi** — perbedaannya menentukan. Data on-chain bersifat
permanen dan terbuka untuk umum. Kalau memakai enkripsi, kebocoran kunci di
masa depan akan membuka seluruh data KTP yang pernah tersimpan, dan data itu
tidak bisa ditarik kembali. Hash tidak bisa dibalik sama sekali, jadi tidak ada
kunci yang bisa bocor. *Salt* ditambahkan agar isi aslinya tidak bisa ditebak
dengan mencoba semua kemungkinan.

**Akibat yang perlu disadari:** karena hash tidak bisa dibalik dan data aslinya
tidak disimpan, **sistem tidak akan pernah bisa menampilkan data KTP kembali
kepada siapa pun.** Pencocokan identitas di lokasi acara karena itu dilakukan
terbalik: petugas memasukkan Nomor Induk Kependudukan dari KTP fisik, dan sistem
hanya menjawab **cocok atau tidak cocok**. Kebocoran seluruh isi database tidak
membocorkan identitas siapa pun.

### 5.4 Dompet otomatis dan bebas biaya — melawan hambatan pemahaman

Pengguna mendaftar cukup dengan surel. Dompet blockchain dibuat otomatis lewat
ERC-4337, dan seluruh biaya gas ditanggung sistem lewat *Paymaster*.

**Akibatnya:** pengguna tidak pernah berhadapan dengan kunci pribadi, frasa
rahasia, maupun keharusan membeli aset kripto lebih dulu. Dari sudut pandang
pengguna, alurnya tidak berbeda dari membeli tiket di situs biasa.

---

## 6. Manfaat

### Bagi penyelenggara acara

1. **Terhindar dari manipulasi harga oleh calo**, karena keuntungan penjualan
   ulang sudah dimatikan di tingkat smart contract — bukan sekadar dilarang
   lewat syarat dan ketentuan yang sulit ditegakkan.
2. **Penjualan ulang tetap berada di dalam kendali penyelenggara**, karena
   satu-satunya jalur yang tersedia adalah *marketplace* resmi. Penyelenggara
   tidak lagi kehilangan jejak tiketnya begitu tiket berpindah tangan.
3. **Terhindar dari kasus penipuan tiket yang merusak reputasi**, karena tiket
   palsu tidak mungkin diterbitkan di luar smart contract.

> **Catatan penyelarasan:** proposal awal menuliskan manfaat kedua sebagai
> "memastikan tiket tidak dijual ke pasar sekunder". Rumusan itu **sudah tidak
> tepat** untuk arsitektur final, karena penjualan ulang tetap diizinkan.
> Rumusan yang benar: penjualan ulang tidak lepas kendali ke pasar sekunder
> liar, melainkan diarahkan ke satu kanal resmi dengan harga terkunci.

### Bagi konsumen

1. **Keaslian tiket terjamin dan bisa dibuktikan sendiri**, tanpa bergantung
   pada klaim platform.
2. **Mendapat harga wajar**, karena tiket bekas tidak bisa dijual di atas harga
   resminya.
3. **Bisa mengakses sistem berbasis blockchain tanpa pengetahuan teknis apa
   pun**, dan tanpa perlu memiliki aset kripto.

---

## 7. Batasan Lingkup

Batasan berikut menentukan apa yang **tidak** dikerjakan dalam tugas akhir ini.
Keterbatasan yang timbul akibat batasan ini dibahas di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

### 7.1 Bentuk aplikasi

Sistem dibangun sebagai aplikasi berbasis web yang bisa diakses lewat peramban
desktop maupun ponsel. Tidak ada aplikasi *native* Android maupun iOS.

### 7.2 Kategori event yang dicakup

Hanya enam kategori berikut:

1. Konser musik
2. Pertandingan olahraga
3. Festival musik
4. *Stand-up comedy*
5. Pameran berbayar
6. Seminar atau konferensi berbayar

Kesamaan keenamnya: **berbayar dan berkapasitas terbatas** — dua syarat yang
membuat perebutan tiket dan praktik calo muncul. Event gratis atau berkapasitas
tidak terbatas tidak punya masalah yang ingin diselesaikan sistem ini, sehingga
tidak dicakup.

### 7.3 Jaringan blockchain

Seluruh sistem berjalan di **Sepolia Testnet**, jaringan uji coba resmi
Ethereum. Bukan jaringan Ethereum sungguhan.

### 7.4 Pembayaran

Pembayaran memakai **Midtrans sandbox**, yaitu lingkungan simulasi. **Tidak ada
transaksi keuangan nyata** dalam sistem ini.

### 7.5 Yang tidak dicakup

- Integrasi dengan sistem tiket pihak ketiga yang sudah ada.
- Manajemen denah kursi secara dinamis.
- Pencegahan serangan Sybil secara menyeluruh. Penyaring bot dirancang khusus
  untuk menghadang program otomatis, bukan untuk menghadang satu orang yang
  membuat banyak identitas.

### 7.6 Pemisahan penyimpanan data

Ini menentukan seluruh rancangan database dan smart contract, jadi ditulis
tegas sejak awal.

| Tempat | Data yang disimpan | Alasan |
|---|---|---|
| **On-chain** (blockchain) | Kepemilikan NFT tiket (`tokenId`, `ownerOf`), harga beli awal permanen (`originalPrice`), status pemakaian tiket, jumlah pembelian per alamat dompet per event, kuota event, status penawaran jual ulang, **sidik jari digital data KTP** | Hanya data yang keasliannya harus dijamin dan tidak boleh bisa diubah sepihak |
| **Off-chain — IPFS** (lewat Pinata) | Nama event, tanggal dan waktu pelaksanaan, lokasi venue, kategori tiket, nomor kursi, nama penyelenggara, gambar tiket | Keterangan deskriptif berukuran besar. Menyimpannya on-chain mahal dan tidak perlu |
| **Off-chain — MySQL** | Data pengguna, event, kategori tiket, salinan data tiket, riwayat pesanan, penawaran jual ulang, rekening penjual, pencairan dana, notifikasi, riwayat masuk, **sidik jari digital identitas beserta *salt*-nya** | Data operasional yang perlu bisa diubah, dicari cepat, dan **wajib bisa dibatasi aksesnya** |

Rincian tabelnya ada di
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md).

> **Perubahan dari proposal:** daftar tabel MySQL di proposal masih memuat tabel
> *flash sale*, tabel fase *flash sale*, dan pengingat *flash sale*. Ketiganya
> **sudah dihapus** — lihat Bagian 8.

### 7.7 Cakupan pengujian

Pengujian dilakukan secara fungsional dan keamanan terbatas pada skenario yang
sudah ditentukan, mencakup:

- Pembuktian bahwa pengguna dapat membuktikan sebuah NFT adalah miliknya
  sendiri.
- Percobaan serangan *front-running*.
- Percobaan memindahkan tiket langsung antar dompet di luar *marketplace*
  resmi, untuk membuktikan pembatasan allowlist bekerja.
- Pengukuran biaya gas per fungsi smart contract. `[BUTUH DATA UJI]`

---

## 8. Perubahan Rancangan dari Proposal Awal

Proposal awal (`Proposal_TA_160423176.pdf`) memuat beberapa keputusan yang
**sudah tidak berlaku** setelah dibahas dengan pembimbing. Bagian ini didaftar
supaya pembaca yang membandingkan kedua dokumen tidak salah paham.

| Di proposal | Sekarang | Alasan perubahan |
|---|---|---|
| *Soulbound Token* — tiket sama sekali tidak bisa dipindahkan | **Pembatasan allowlist** — bisa dipindahkan, tapi hanya lewat `MarketplaceContract` | Tiket tetap perlu bisa dijual ulang secara sah oleh orang yang batal hadir. Yang perlu dimatikan adalah keuntungannya, bukan perpindahannya |
| *Commit-reveal* — pembelian dua tahap | **Dihapus**, diganti pendaftaran satu tahap | Masalah yang diatasinya adalah perebutan cepat saat *flash sale*. Karena keuntungan calo sudah dimatikan lewat penguncian harga, insentif berebut ikut hilang |
| *Flash sale* sebagai salah satu dari **empat** alur utama | **Tidak ada.** Alur utama tinggal **tiga** | Ikut terhapus bersama *commit-reveal* |
| Chainlink VRF — pengundian acak | **Tidak dipakai** | Persaingan dinilai sudah cukup sehat tanpa pengundian |
| Ruang lingkup poin 7: "tidak mencakup KYC secara formal" | **Pendaftaran identitas berbasis KTP ditambahkan** | Agar satu tiket benar-benar terikat pada satu orang nyata |
| Model smart contract belum ditentukan | **Satu kontrak untuk banyak event**, dibedakan `eventId` | Lebih sederhana dan lebih hemat biaya penerapan |

Bagian proposal yang **masih berlaku sepenuhnya**: latar belakang, rumusan
masalah, tujuan, manfaat, kategori event, pemakaian Sepolia Testnet, Midtrans
sandbox, IPFS lewat Pinata, dan susunan teknologi dasar.

---

## 9. Peta Dokumen

| Berkas | Isinya | Baca kalau ingin tahu |
|---|---|---|
| [`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) | Berkas ini | Sistem ini untuk apa |
| [`01-kebutuhan-fungsional.md`](01-kebutuhan-fungsional.md) | Daftar apa yang sistem harus bisa lakukan | Fitur apa saja yang ada |
| [`02-kebutuhan-non-fungsional.md`](02-kebutuhan-non-fungsional.md) | Tuntutan mutu sistem | Seberapa baik sistem harus bekerja |
| [`03-arsitektur-sistem.md`](03-arsitektur-sistem.md) | Rancangan menyeluruh dan alasan tiap keputusan | **Kenapa** rancangannya begitu |
| [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) | Tabel database dan hubungannya | Data disimpan bagaimana |
| [`05-spesifikasi-smart-contract.md`](05-spesifikasi-smart-contract.md) | Rincian kedua smart contract | Aturan di blockchain seperti apa |
| [`06-spesifikasi-api.md`](06-spesifikasi-api.md) | Titik layanan penghubung antar bagian | Bagian sistem berkomunikasi bagaimana |
| [`07-alur-pengguna.md`](07-alur-pengguna.md) | Tiga alur utama, langkah demi langkah | Pengguna memakainya bagaimana |
| [`08-daftar-istilah.md`](08-daftar-istilah.md) | Kamus istilah | Arti sebuah istilah |
| [`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md) | Batas kemampuan sistem yang disadari | Apa yang sistem ini **tidak** bisa |
