# 08 — Daftar Istilah

Berkas ini adalah rujukan istilah untuk seluruh dokumen di folder `docs/`.
Tujuannya satu: **penyebutan istilah seragam di semua berkas.** Kalau ada
perbedaan penyebutan antara berkas ini dan berkas lain, yang dipakai adalah
berkas ini.

Semua penjelasan ditulis untuk pembaca yang **belum tentu paham blockchain**.
Penguji sidang bisa saja berlatar belakang di luar bidang ini, jadi setiap
istilah dijelaskan dengan perumpamaan sehari-hari lebih dulu, baru definisi
teknisnya.

---

## Cara Membaca Berkas Ini

Istilah dikelompokkan menjadi empat bagian:

| Bagian | Isinya |
|---|---|
| A | Istilah dasar blockchain — pondasi, baca ini dulu |
| B | Standar dan protokol yang dipakai sistem ini |
| C | Istilah khusus proyek ini |
| D | Istilah bisnis dan industri tiket |

---

## A. Istilah Dasar Blockchain

### Blockchain

Buku catatan digital yang salinannya tersebar di banyak komputer sekaligus.
Setiap catatan baru dikunci ke catatan sebelumnya, sehingga mengubah satu
catatan lama berarti harus mengubah semua catatan sesudahnya di semua
komputer secara bersamaan — praktis mustahil.

**Kenapa penting untuk sistem ini:** karena catatan kepemilikan tiket tidak
bisa diubah diam-diam, tiket palsu tidak bisa "disisipkan" ke dalam sistem.

### Ethereum

Salah satu jaringan blockchain. Bedanya dengan blockchain generasi awal:
Ethereum tidak hanya mencatat perpindahan uang, tapi juga bisa **menjalankan
program**. Program itulah yang disebut *smart contract*.

### Sepolia Testnet

"Jaringan latihan" resmi milik Ethereum. Cara kerjanya sama persis dengan
jaringan sungguhan, tapi mata uangnya tidak bernilai nyata dan bisa diminta
gratis. Dipakai untuk menguji sistem tanpa mengeluarkan uang sungguhan.

**Proyek ini berjalan di Sepolia Testnet, bukan jaringan Ethereum sungguhan.**
Akibat dan keterbatasannya dibahas di [`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

### Smart contract

Program yang tersimpan dan berjalan di atas blockchain. Sekali dipasang,
aturannya berjalan otomatis dan **tidak bisa dilanggar oleh siapa pun,
termasuk oleh pembuatnya sendiri**.

Perumpamaan: mesin penjual minuman otomatis. Kalau uang yang dimasukkan
kurang, mesin tidak akan mengeluarkan minuman — tidak peduli siapa yang
menekan tombolnya, termasuk pemilik mesin.

**Kenapa penting untuk sistem ini:** aturan "harga jual ulang dikunci" ditaruh
di dalam smart contract, bukan di server biasa. Kalau ditaruh di server biasa,
aturan itu bisa dimatikan oleh siapa pun yang menguasai server.

### Wallet address (alamat dompet)

Deretan huruf dan angka yang berfungsi seperti nomor rekening di blockchain.
Contoh bentuknya: `0x71C7656EC7ab88b098defB751B7401B5f6d8976F`.

Alamat dompet bersifat terbuka — siapa pun bisa melihat isi dan riwayat
transaksi sebuah alamat. Yang rahasia adalah **kunci pribadi** yang mengendalikan
alamat tersebut.

### Kunci pribadi (*private key*)

Kunci rahasia yang membuktikan bahwa seseorang berhak mengendalikan sebuah
alamat dompet. Siapa pun yang memegang kunci pribadi memegang kendali penuh
atas dompet itu.

Ini sekaligus **hambatan terbesar bagi pengguna awam**: kalau kunci pribadi
hilang, isi dompet hilang selamanya; kalau bocor, isi dompet bisa dikuras.
Sistem ini menghindari masalah tersebut lewat ERC-4337 (lihat Bagian B).

### On-chain

Data yang disimpan **di dalam** blockchain. Sifatnya permanen dan **terbuka
untuk umum** — siapa pun di dunia bisa membacanya tanpa izin.

Sifat "terbuka untuk umum" inilah alasan data Kartu Tanda Penduduk (KTP) tidak
boleh disimpan on-chain dalam bentuk aslinya.

### Off-chain

Data yang disimpan **di luar** blockchain, misalnya di database MySQL biasa
atau di jaringan IPFS. Bisa diubah dan dihapus, dan aksesnya bisa dibatasi.

### Gas

Biaya yang harus dibayar untuk setiap transaksi di blockchain. Besarnya
tergantung seberapa berat perhitungan yang diminta.

Dalam sistem ini, **biaya gas ditanggung sistem, bukan pengguna** — lihat
*Paymaster* di Bagian B.

### Transaksi

Satu perintah yang dikirim ke blockchain dan mengubah isinya, misalnya
"cetak tiket nomor 12 untuk alamat X". Setiap transaksi memerlukan gas dan
tercatat permanen.

### RPC (*Remote Procedure Call*)

Cara sebuah aplikasi "berbicara" langsung ke blockchain lewat internet, tanpa
melalui halaman web mana pun.

**Ini konsep yang wajib dipahami sebelum membaca dokumen keamanan sistem ini.**
Karena RPC terbuka untuk siapa saja, smart contract bisa dipanggil langsung
oleh siapa pun — termasuk oleh program otomatis yang tidak pernah membuka
situs web kita sama sekali. Itulah sebabnya penyaring bot di halaman web
**tidak cukup** dan diperlukan lapisan pengamanan kedua di dalam smart contract
itu sendiri.

### EOA (*Externally Owned Account*)

Dompet blockchain "biasa" yang dikendalikan langsung oleh kunci pribadi milik
manusia. MetaMask adalah contoh dompet jenis ini.

Lawannya adalah *smart account* — dompet yang sebenarnya berupa program.
Perbedaan ini penting karena cara keduanya membuktikan tanda tangan digital
berbeda (lihat *ERC-1271* di Bagian B).

### Hash / *hashing*

Proses mengubah data apa pun menjadi "sidik jari digital" berupa deretan
karakter dengan panjang tetap.

Dua sifat yang membuatnya berguna:

1. **Satu arah.** Dari data bisa dibuat sidik jari, tapi dari sidik jari
   **tidak bisa** kembali ke data aslinya. Ini berbeda dari enkripsi.
2. **Konsisten.** Data yang sama selalu menghasilkan sidik jari yang sama
   persis, sehingga bisa dipakai untuk mencocokkan.

### keccak256

Nama fungsi hash yang dipakai Ethereum. Menghasilkan sidik jari sepanjang 256
bit (64 karakter heksadesimal).

Dipakai di sistem ini untuk membuat sidik jari data KTP sebelum disimpan
on-chain.

### Hash vs enkripsi — perbedaan yang sering tertukar

| | Enkripsi | Hash |
|---|---|---|
| Bisa dikembalikan ke data asli? | **Ya**, kalau punya kuncinya | **Tidak pernah**, sama sekali |
| Risiko utama | Kunci bocor → semua data terbaca | Tidak ada kunci yang bisa bocor |
| Kegunaan | Menyimpan data yang nanti perlu dibaca lagi | Membuktikan kecocokan tanpa menyimpan aslinya |

**Sistem ini memakai hash, bukan enkripsi, untuk data KTP yang disimpan
on-chain.** Alasannya: data on-chain permanen dan terbuka untuk umum. Kalau
memakai enkripsi, kebocoran kunci di masa depan akan membuka seluruh data KTP
yang pernah tersimpan — dan data itu tidak bisa ditarik kembali karena sifat
blockchain yang permanen. Dengan hash, tidak ada kunci yang bisa bocor.

### Salt

Data acak tambahan yang digabungkan ke data asli **sebelum** di-hash.

**Kenapa perlu:** tanpa salt, penyerang yang tahu format data bisa menebak
isinya dengan mencoba semua kemungkinan satu per satu, lalu mencocokkan
hasilnya. Nomor Induk Kependudukan (NIK) punya format yang tetap dan jumlah
kemungkinannya terbatas, sehingga rawan cara ini. Salt yang acak dan berbeda
untuk setiap pengguna membuat percobaan semacam itu tidak lagi sepadan.

### Pepper

Rahasia tambahan yang digabungkan ke data sebelum di-hash, mirip salt — tapi
dengan **dua perbedaan penting**:

| | Salt | **Pepper** |
|---|---|---|
| Berbeda untuk tiap pengguna | **Ya** | Tidak — sama untuk semua |
| Disimpan bersama datanya | Ya | **Tidak — disimpan di luar database** |
| Hasil hash untuk data yang sama | Selalu berbeda | **Selalu sama** |

**Kenapa sistem ini memakai keduanya.** Sifat "hasilnya selalu sama" adalah
syarat mutlak untuk bisa mendeteksi NIK yang didaftarkan dua kali — dan salt
justru menghilangkan sifat itu. Karena itu sistem menyimpan dua nilai berbeda:
satu ber-*pepper* untuk mendeteksi pendaftaran ganda, satu ber-*salt* untuk
dicatat di blockchain.

**Kenapa pepper harus disimpan di luar database** (KNF-37): karena ia sama untuk
semua pengguna, siapa pun yang memperolehnya bisa menghitung sidik jari semua
kemungkinan NIK sekaligus. Menyimpannya di dalam database yang dilindunginya
berarti penyerang yang mencuri database sekaligus mendapat kuncinya.

### IPFS (*InterPlanetary File System*)

Sistem penyimpanan berkas yang tersebar di banyak komputer. Setiap berkas
diberi alamat berdasarkan isinya, sehingga isi yang berubah otomatis
menghasilkan alamat berbeda.

Dipakai di sistem ini untuk menyimpan keterangan tiket: nama event, tanggal,
lokasi, dan gambar tiket.

### CID (*Content Identifier*)

Alamat sebuah berkas di IPFS. Karena dihitung dari isi berkas, CID sekaligus
berfungsi sebagai bukti bahwa berkasnya belum diubah.

### Pinata

Layanan pihak ketiga yang menjaga agar berkas di IPFS tidak hilang. IPFS
sendiri tidak menjamin berkas tersimpan selamanya kalau tidak ada komputer
yang mau menyimpannya; Pinata mengambil peran itu.

---

## B. Standar dan Protokol yang Dipakai

### NFT (*Non-Fungible Token*)

Token digital yang **unik dan tidak bisa saling ditukar**.

"*Fungible*" berarti bisa saling ditukar tanpa ada bedanya — uang Rp50.000
milik siapa pun nilainya sama. "*Non-fungible*" berarti sebaliknya: setiap
satuan berbeda dan punya identitas sendiri, seperti nomor kursi di bioskop.

**Dalam sistem ini: satu NFT = satu tiket.** Setiap tiket punya nomor unik,
pemilik yang tercatat, dan riwayat kepemilikan yang bisa ditelusuri.

### ERC-721

Standar resmi pembuatan NFT di Ethereum. "ERC" adalah singkatan dari
*Ethereum Request for Comments*, yaitu dokumen usulan standar di lingkungan
Ethereum.

Standar ini mengatur hal-hal seperti bagaimana kepemilikan dicatat dan
bagaimana perpindahan kepemilikan dijalankan. Karena standar, tiket buatan
sistem ini bisa dibaca oleh alat mana pun yang mendukung ERC-721.

### ERC-4337 (*Account Abstraction*)

Standar yang memungkinkan pengguna punya dompet blockchain **tanpa perlu
mengerti kunci pribadi atau frasa rahasia**.

Alih-alih dompet berupa kunci pribadi milik manusia (EOA), dompetnya berupa
smart contract yang aturan pemakaiannya bisa diatur — misalnya "cukup login
pakai surel".

**Kenapa dipakai di sistem ini:** penelitian terdahulu (Saputro & Lathifah,
2025) menemukan bahwa hambatan terbesar adopsi tiket berbasis NFT adalah
rendahnya pemahaman masyarakat terhadap blockchain. ERC-4337 menghapus
hambatan itu.

### *Smart account*

Dompet berbentuk smart contract, hasil penerapan ERC-4337. Inilah jenis dompet
yang dipakai seluruh pengguna sistem ini.

Bedanya dari EOA sangat penting saat memeriksa tanda tangan digital — lihat
*ERC-1271*.

### Paymaster

Bagian dari ERC-4337 yang membuat **pihak lain yang membayar biaya gas**, bukan
pengguna.

Dalam sistem ini, Paymaster dijalankan oleh sistem, sehingga **pengguna tidak
perlu memiliki aset kripto sama sekali** untuk membeli, memiliki, atau menjual
kembali tiket.

### EntryPoint

Satu smart contract pusat yang menjadi gerbang seluruh transaksi ERC-4337.
Semua permintaan dari smart account melewati kontrak ini.

Sistem ini memakai EntryPoint versi 0.7.

### EIP-712

Standar penandatanganan data digital dengan format yang **bisa dibaca manusia**.
"EIP" adalah singkatan dari *Ethereum Improvement Proposal*.

Sebelum ada standar ini, pengguna diminta menandatangani deretan angka yang
tidak bisa dipahami. Dengan EIP-712, isi yang ditandatangani muncul dalam
bentuk terbaca, misalnya "izinkan pencetakan tiket untuk event nomor 3".

### ECDSA (*Elliptic Curve Digital Signature Algorithm*)

Metode matematis di balik tanda tangan digital di Ethereum. Fungsinya
membuktikan dua hal sekaligus: bahwa sebuah pesan benar berasal dari pemilik
kunci tertentu, dan bahwa pesan itu tidak diubah setelah ditandatangani.

### ERC-1271

Standar tentang bagaimana sebuah **smart account** membuktikan bahwa tanda
tangannya sah.

**Kenapa ini penting khusus untuk proyek ini:** cara memeriksa tanda tangan EOA
dan smart account **berbeda**. Karena seluruh pengguna sistem ini memakai smart
account (akibat ERC-4337), pemeriksaan tanda tangan pengguna tidak bisa memakai
cara EOA biasa. Rinciannya dibahas di
[`05-spesifikasi-smart-contract.md`](05-spesifikasi-smart-contract.md).

### *Signature gating* (gerbang tanda tangan digital)

Pola pengamanan di mana sebuah fungsi smart contract hanya mau dijalankan
kalau disertai tanda tangan digital sah dari pihak yang berwenang.

**Cara membingkainya dalam dokumen ini:** *signature gating* adalah **lapisan
kontrol akses berstandar industri**, setara dengan pemeriksaan izin di sistem
mana pun. Ini **bukan** tambalan atas kelemahan smart contract. Smart contract
memang terbuka dan bisa dipanggil siapa saja lewat RPC — itu sifat bawaan
blockchain, bukan cacat rancangan.

### CAPTCHA

Uji pembeda manusia dan program otomatis di halaman web. Kepanjangannya
*Completely Automated Public Turing test to tell Computers and Humans Apart*.

### Cloudflare Turnstile

Layanan CAPTCHA dari Cloudflare yang dipakai sistem ini. Kelebihannya:
kebanyakan pengguna tidak perlu menyelesaikan teka-teki apa pun karena
penilaian dilakukan di latar belakang.

**Batas kemampuannya:** Turnstile hanya bekerja di halaman web. Program otomatis
yang memanggil smart contract langsung lewat RPC tidak pernah melewati Turnstile
sama sekali. Karena itu Turnstile dan *signature gating* adalah **dua lapisan
berbeda yang tidak saling menggantikan**.

---

## C. Istilah Khusus Proyek Ini

### `eventId`

Nomor pembeda antar event di dalam satu smart contract.

Sistem ini memakai **satu** `TicketContract` untuk **semua** event. Yang
membedakan satu event dari event lain adalah `eventId`. Setiap event punya
kuota, harga, dan keterangan sendiri yang ditandai dengan nomor ini.

### `tokenId`

Nomor unik setiap tiket NFT. Berbeda dari `eventId`: satu `eventId` menaungi
banyak `tokenId`.

Contoh: event nomor 3 (konser) menjual 500 tiket, maka ada 500 `tokenId`
berbeda yang semuanya bernaung di bawah `eventId` 3.

### `originalPrice`

Harga beli awal sebuah tiket, tercatat permanen di blockchain saat tiket
pertama kali dicetak.

**Ini adalah patokan penguncian harga jual ulang.** Nilainya tidak pernah
berubah sepanjang umur tiket, sehingga tidak bisa dinaikkan bertahap lewat
penjualan berantai.

### Allowlist

Daftar pihak yang diizinkan melakukan sesuatu.

**Dalam sistem ini, allowlist berisi tepat satu pihak: `MarketplaceContract`.**
Hanya kontrak itu yang boleh menjalankan perpindahan kepemilikan tiket antar
pengguna. Akibatnya tiket tidak bisa dipindahkan diam-diam di luar sistem.

**Perhatikan:** tiket **tidak** dikunci mati. Tiket tetap bisa berpindah
tangan — hanya saja harus lewat satu pintu resmi, dan di pintu itu harga
dikunci.

### Penguncian harga jual ulang (*resale price lock*)

Aturan di dalam smart contract yang memaksa harga jual ulang **sama persis
dengan `originalPrice`**. Penjual tidak bisa mengambil untung dari penjualan
kembali.

**Ini senjata utama anti-calo sistem ini.** Digabung dengan allowlist, memborong
tiket menjadi tidak menguntungkan: tiket hanya bisa dijual lewat satu pintu, dan
di pintu itu keuntungan sudah dimatikan.

### Hash KTP

Sidik jari digital data Kartu Tanda Penduduk pengguna. **Sistem ini menyimpan
dua**, dengan tugas berbeda:

| | `hash_identitas` | `nik_indeks` |
|---|---|---|
| Rumusnya | `keccak256(NIK + nama + tanggal lahir + salt)` | `keccak256(NIK + pepper)` |
| Disimpan di | **Blockchain**, salinannya di MySQL | MySQL saja |
| Tugasnya | Mengikat satu identitas utuh pada satu dompet secara permanen | Mendeteksi NIK yang didaftarkan dua kali, dan mencocokkan identitas di lokasi acara |

**Data KTP asli tidak disimpan di mana pun** — tidak di blockchain, dan sejak
7 Agustus 2026 juga tidak di MySQL. Data hanya melewati ingatan server saat
pendaftaran, dihitung hash-nya, lalu dibuang.

**Akibatnya:** sistem tidak akan pernah bisa menampilkan data KTP kembali kepada
siapa pun. Pencocokan identitas hanya bisa dilakukan dengan cara pengguna
menyerahkan kembali datanya untuk dibandingkan.

### Pencairan dana (*payout*)

Penerusan uang hasil penjualan kembali tiket dari sistem ke **rekening bank
penjual**, dijalankan lewat Midtrans.

**Urutannya tidak boleh dibalik:** pencairan hanya dimulai **setelah**
kepemilikan tiket benar-benar berpindah di blockchain. Tiket yang terlanjur
berpindah masih bisa diperbaiki lewat transaksi tambahan; **uang yang sudah
dicairkan ke rekening orang lain tidak bisa ditarik kembali.**

### Penguncian penawaran

Penandaan sebuah penawaran tiket jual ulang sebagai "sedang dalam proses
pembelian" oleh satu pembeli, dengan batas waktu tertentu. Selama kunci berlaku,
pembeli lain ditolak **sebelum sempat membayar**.

**Kenapa ada:** tanpa ini, dua orang bisa sama-sama membayar tiket yang sama,
lalu salah satunya harus dikembalikan uangnya. Pengembalian dana tidak bisa
diuji sungguhan di lingkungan sandbox, sehingga masalahnya **dicegah di depan**,
bukan diperbaiki setelah terjadi.

### Pengikatan identitas

Aturan pokok sistem ini: **satu tiket → satu alamat dompet → satu identitas
nyata.**

Tujuannya memastikan tiket benar-benar dipakai oleh orang yang membelinya,
bukan diperjualbelikan sebagai komoditas.

Keterbatasan aturan ini dibahas jujur di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

### KYC (*Know Your Customer*)

Proses memastikan identitas nyata seorang pengguna. Istilah ini berasal dari
dunia perbankan.

**Dalam sistem ini, KYC dilakukan lewat pendaftaran data KTP**, bukan lewat
verifikasi bertatap muka atau pemeriksaan dokumen oleh pihak ketiga.

> **Catatan perbedaan dengan proposal awal:** ruang lingkup proposal poin 7
> menyatakan sistem "tidak mencakup proses KYC secara formal". Keputusan itu
> **sudah berubah** — pendaftaran identitas berbasis KTP kini menjadi bagian
> aktif sistem.

### Pasar sekunder

Penjualan kembali tiket dari pembeli pertama ke orang lain, berbeda dari
pembelian awal langsung dari penyelenggara acara ("pasar primer").

### *Marketplace* resmi

Satu-satunya tempat penjualan kembali tiket yang diizinkan sistem ini,
dijalankan oleh `MarketplaceContract`.

---

## D. Istilah Bisnis dan Industri Tiket

### *War* tiket

Istilah sehari-hari di Indonesia untuk perebutan tiket saat penjualan dibuka,
di mana tiket habis dalam hitungan menit atau bahkan detik.

### Calo / *scalper*

Pihak yang memborong tiket bukan untuk dipakai sendiri, melainkan untuk dijual
kembali dengan harga jauh di atas harga resmi.

### *Scalping*

Praktik yang dilakukan calo: membeli banyak tiket lalu menjualnya kembali
dengan *markup* tinggi.

### *Markup*

Selisih kenaikan harga di atas harga resmi.

### Jastip (jasa titip)

Orang yang dititipi untuk membelikan tiket atas nama orang lain, dengan imbalan
jasa.

**Ciri penting yang memengaruhi rancangan sistem ini:** berdasarkan wawancara
pada tahap analisis, penyedia jastip **sudah memegang data identitas penitip
— NIK, nomor telepon, tanggal lahir — sebelum perebutan tiket dimulai**, sebagai
bagian dari proses pemesanan jasa. Fakta inilah yang membuat pengikatan
identitas tidak bisa menghentikan praktik jastip sepenuhnya. Dibahas di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

### Bot

Program otomatis yang menjalankan pembelian tiket jauh lebih cepat daripada
manusia.

### Serangan Sybil

Serangan di mana satu orang membuat banyak identitas palsu untuk mendapat
keuntungan berlipat.

Berbeda dari serangan bot: bot soal **kecepatan**, Sybil soal **jumlah
identitas**. Sistem ini menangani bot lewat Turnstile, dan menekan Sybil lewat
pengikatan identitas KTP — tapi tidak menanganinya secara menyeluruh.

### *Front-running*

Serangan di mana pihak lain melihat transaksi yang sedang menunggu diproses di
blockchain, lalu menyelipkan transaksinya sendiri agar diproses lebih dulu.

Karena transaksi blockchain terlihat semua orang sebelum benar-benar tercatat,
serangan semacam ini mungkin terjadi. Sistem ini menekan motifnya lewat
penguncian harga jual ulang: mendahului transaksi orang lain tidak menghasilkan
keuntungan.

### NIK (*Nomor Induk Kependudukan*)

Nomor identitas 16 digit pada Kartu Tanda Penduduk warga negara Indonesia.

---

## E. Daftar Singkatan Cepat

| Singkatan | Kepanjangan | Keterangan |
|---|---|---|
| API | *Application Programming Interface* | Daftar titik layanan yang disediakan server agar bisa dipanggil bagian lain. Lihat [`06-spesifikasi-api.md`](06-spesifikasi-api.md) |
| CAPTCHA | *Completely Automated Public Turing test to tell Computers and Humans Apart* | Bagian B |
| CID | *Content Identifier* | Bagian A |
| ECDSA | *Elliptic Curve Digital Signature Algorithm* | Bagian B |
| EIP | *Ethereum Improvement Proposal* | Bagian B |
| EOA | *Externally Owned Account* | Bagian A |
| ERC | *Ethereum Request for Comments* | Bagian B |
| ERD | *Entity Relationship Diagram* | Gambaran tabel database beserta hubungan antar tabelnya. Lihat [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) |
| EVM | *Ethereum Virtual Machine* — mesin virtual Ethereum | Bagian dalam Ethereum yang menjalankan smart contract. Versinya wajib ditulis eksplisit saat kompilasi (KNF-33) |
| HTTPS | *HyperText Transfer Protocol Secure* | Cara berkomunikasi di internet yang isinya disandikan, sehingga tidak bisa dibaca pihak di tengah jalan (KNF-31) |
| ISO/IEC | *International Organization for Standardization / International Electrotechnical Commission* | Dua lembaga penyusun standar internasional. ISO/IEC 25010 adalah standar mutu perangkat lunak yang dipakai di [`02-kebutuhan-non-fungsional.md`](02-kebutuhan-non-fungsional.md) |
| KF | Kebutuhan Fungsional | Apa yang sistem harus bisa lakukan |
| KNF | Kebutuhan Non-Fungsional | Seberapa baik sistem harus melakukannya |
| KTP | Kartu Tanda Penduduk | Bagian D |
| KYC | *Know Your Customer* | Bagian C |
| NFT | *Non-Fungible Token* | Bagian B |
| NIK | Nomor Induk Kependudukan | Bagian D |
| NRP | Nomor Pokok Mahasiswa | Nomor induk mahasiswa di Universitas Surabaya |
| PPATK | Pusat Pelaporan dan Analisis Transaksi Keuangan | Lembaga negara yang memantau transaksi keuangan mencurigakan. Dirujuk di [`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) Bagian 2.1 |
| QR | *Quick Response* | Kode gambar kotak yang bisa dipindai. Bentuk tiket pada sistem konvensional |
| RPC | *Remote Procedure Call* | Bagian A |
| SDK | *Software Development Kit* | Kumpulan perkakas siap pakai untuk membangun perangkat lunak. Dipakai menyebut ZeroDev SDK |
| VRF | *Verifiable Random Function* | Pengundian acak yang hasilnya bisa dibuktikan tidak dicurangi. **Tidak dipakai sistem ini** — lihat Bagian F |

---

## F. Istilah yang TIDAK Dipakai Sistem Ini

Empat istilah berikut muncul di proposal awal tapi **sudah tidak menjadi bagian
sistem**. Didaftar di sini supaya tidak salah dipakai di dokumen lain, dan
supaya pembaca yang membandingkan dengan proposal tidak kebingungan.

| Istilah | Artinya | Kenapa tidak jadi dipakai |
|---|---|---|
| *Soulbound Token* | NFT yang sama sekali tidak bisa dipindahkan | Tiket tetap perlu bisa dijual ulang secara sah. Diganti pembatasan allowlist plus penguncian harga |
| *Commit-reveal* | Pembelian dua tahap: kirim tebakan tersembunyi dulu, buka kemudian | Masalah yang diatasinya adalah perebutan cepat saat *flash sale*. Karena keuntungan calo sudah dimatikan lewat penguncian harga, insentif berebut hilang |
| *Flash sale* | Penjualan kilat berbatas waktu | Ikut terhapus bersama *commit-reveal* |
| Chainlink VRF | Layanan pengundian acak yang hasilnya bisa dibuktikan | Persaingan dinilai sudah cukup sehat tanpa pengundian |

**Aturan penulisan:** keempat istilah di atas boleh disebut di dokumen lain
**hanya** dalam bingkai "sempat dipertimbangkan, tidak jadi dipakai" — tidak
pernah sebagai bagian aktif sistem.
