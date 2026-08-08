# 03 — Arsitektur Sistem

Berkas ini menjelaskan **rancangan menyeluruh sistem dan alasan di balik setiap
keputusannya.** Berbeda dari berkas lain yang menjawab "apa", berkas ini
menjawab **"kenapa begitu, dan apa akibatnya"**.

Pola penulisan yang dipakai konsisten di seluruh berkas:

> **Apa yang dipilih → kenapa dipilih → apa akibatnya → apa yang ditolak dan
> kenapa.**

Arsitektur di berkas ini **sudah final dan disetujui pembimbing.** Perbedaan
dengan proposal awal didaftar di
[`00-ringkasan-sistem.md`](00-ringkasan-sistem.md) Bagian 8.

Istilah teknis dijelaskan di [`08-daftar-istilah.md`](08-daftar-istilah.md).

---

## 1. Gambaran Umum

Sistem terdiri dari **tiga lapisan** dengan pembagian tanggung jawab yang tegas.

```
┌─────────────────────────────────────────────────────────────┐
│  LAPISAN 1 — TAMPILAN (Next.js)                             │
│  Yang dilihat dan disentuh pengguna.                        │
│  Tidak menyimpan rahasia apa pun.                           │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│  LAPISAN 2 — SERVER (NestJS)                                │
│  Otak sistem. Satu-satunya yang boleh:                      │
│   • memproses data KTP (tanpa pernah menyimpannya)          │
│   • memegang kunci penandatangan sistem                     │
│   • memerintahkan pencetakan tiket                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │  MySQL   │  │ Midtrans │  │  Pinata  │  │ Cloudflare │   │
│  │          │  │ (sandbox)│  │  (IPFS)  │  │ Turnstile  │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │  RPC lewat Alchemy
┌──────────────────────────▼──────────────────────────────────┐
│  LAPISAN 3 — BLOCKCHAIN (Sepolia Testnet)                   │
│                                                             │
│   ┌──────────────────────┐    ┌──────────────────────────┐  │
│   │   TicketContract     │◄───┤   MarketplaceContract    │  │
│   │   (ERC-721)          │    │                          │  │
│   │  • data event        │    │  • penawaran jual ulang  │  │
│   │  • kuota             │    │  • penguncian harga      │  │
│   │  • kepemilikan tiket │    │                          │  │
│   │  • originalPrice     │    │  Satu-satunya pihak yang │  │
│   │  • hash KTP          │    │  boleh memindahkan tiket │  │
│   └──────────────────────┘    └──────────────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Infrastruktur ERC-4337: EntryPoint v0.7 + Paymaster │  │
│   │  Dompet pengguna berupa smart account, bukan EOA     │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Prinsip pembagian tanggung jawabnya:**

| Lapisan | Yang dipercaya menanganinya | Yang **tidak** boleh ditaruh di sini |
|---|---|---|
| Tampilan | Kenyamanan dan tampilan | Aturan keamanan apa pun — semuanya bisa dilewati |
| Server | Data rahasia, kunci penandatangan, integrasi layanan luar | Aturan yang harus tidak bisa dilanggar bahkan oleh pemilik server |
| Blockchain | Aturan yang tidak boleh dilanggar siapa pun | Data rahasia — semua isinya terbuka untuk umum |

Baris terakhir tabel itu adalah inti seluruh rancangan: **blockchain dipakai
untuk hal yang harus tidak bisa dilanggar, bukan untuk hal yang harus
dirahasiakan.** Data rahasia justru ditaruh di tempat yang paling
konvensional — database biasa — karena di sanalah aksesnya bisa dibatasi.

---

## 2. Susunan Teknologi

| Lapisan | Teknologi | Perannya |
|---|---|---|
| Smart contract | Solidity + Foundry | Bahasa dan perkakas pengujian program blockchain |
| Server | NestJS + TypeORM | Logika sistem dan penghubung ke database |
| Database | MySQL | Data operasional di luar blockchain |
| Tampilan | Next.js | Halaman web yang dilihat pengguna |
| Penghubung blockchain | Alchemy | Jalur komunikasi server ke Ethereum |
| Dompet otomatis | ZeroDev SDK | Pembuatan dan pengoperasian dompet ERC-4337 |
| Penyimpanan keterangan tiket | IPFS lewat Pinata | Nama event, tanggal, lokasi, gambar |
| Pembayaran | Midtrans sandbox | Simulasi pembayaran |
| Penyaring bot | Cloudflare Turnstile | Membedakan manusia dan program otomatis |

Versi tiap pustaka dan jebakan pemakaiannya dicatat di `CLAUDE.md` Bagian 9,
tidak diulang di sini agar tidak ada dua sumber yang bisa saling bertentangan.

---

## 3. Alur Data Antar Lapisan

Bagian ini menunjukkan bagaimana ketiga lapisan bekerja sama. Rincian langkah
demi langkah dari sudut pandang pengguna ada di
[`07-alur-pengguna.md`](07-alur-pengguna.md).

### 3.1 Pola umum: pengguna tidak pernah berbicara langsung ke blockchain

```
Pengguna  →  Tampilan  →  Server  →  Blockchain
                              ↓
                        (server yang membayar gas
                         dan yang menandatangani)
```

**Keputusan:** seluruh transaksi ke blockchain dikirim oleh **server**, bukan
oleh peramban pengguna.

**Kenapa:** tiga alasan yang saling menguatkan.

1. **Pengguna tidak punya aset kripto.** Biaya gas ditanggung sistem lewat
   *Paymaster*. Kalau transaksi dikirim dari peramban, pengguna harus mengurus
   sendiri saldo untuk gas — persis hambatan yang ingin dihapus.
2. **Kunci penandatangan sistem tidak boleh keluar dari server.** Gerbang tanda
   tangan digital (Bagian 4.7) hanya bermakna kalau kuncinya tidak pernah
   sampai ke sisi pengguna. Apa pun yang dikirim ke peramban harus dianggap
   sudah bocor.
3. **Verifikasi pembayaran harus terjadi sebelum pencetakan tiket.** Hanya
   server yang bisa memastikan Midtrans benar-benar sudah menyatakan lunas.

**Akibatnya:** server menjadi titik terpusat. Konsekuensi keamanannya dibahas
jujur di Bagian 8.

### 3.2 Alur pembelian tiket — jalur lengkap

```
 1. Pengguna memilih tiket                    [Tampilan]
 2. Token Turnstile dikirim bersama permintaan[Tampilan → Server]
 3. Token Turnstile diperiksa ke Cloudflare   [Server]
 4. Pemeriksaan: kuota, batas beli, status KYC[Server + Blockchain]
 5. Transaksi pembayaran dibuat               [Server → Midtrans]
 6. Pengguna membayar                         [Tampilan → Midtrans]
 7. Midtrans memberi tahu status lunas        [Midtrans → Server]
 8. Keterangan tiket diunggah, CID diperoleh  [Server → Pinata/IPFS]
 9. Tanda tangan izin pencetakan dibuat       [Server]
10. Tiket dicetak ke dompet pengguna          [Server → Blockchain]
11. Salinan data tiket disimpan               [Server → MySQL]
12. Pengguna diberi tahu                      [Server → Tampilan]
```

**Dua hal yang perlu diperhatikan pada urutan ini:**

**Langkah 7 adalah gerbang yang menentukan.** Pencetakan tiket **hanya**
dipicu oleh pemberitahuan resmi dari Midtrans, bukan oleh peramban pengguna
yang mengaku sudah membayar. Kalau dipicu dari sisi pengguna, siapa pun bisa
memalsukan klaim "saya sudah bayar" dan mendapat tiket gratis.

**Langkah 8 mendahului langkah 10 dengan sengaja.** Keterangan tiket harus
sudah ada di IPFS sebelum tiket dicetak, karena NFT menyimpan *penunjuk* ke
keterangan itu, bukan keterangannya sendiri. Kalau urutannya dibalik, sempat
ada tiket yang menunjuk ke alamat kosong.

### 3.3 Alur penjualan kembali

```
1. Pemilik menawarkan tiketnya                [Tampilan → Server]
2. Harga diambil dari originalPrice on-chain  [Server → Blockchain]
   → pemilik TIDAK diminta memasukkan harga
3. Penawaran dicatat di MarketplaceContract   [Server → Blockchain]
4. Penawaran DIKUNCI untuk satu pembeli       [Server]
   → pembeli lain ditolak selama kunci berlaku
5. Pembeli membayar sebesar originalPrice     [Tampilan → Midtrans]
6. Midtrans memberi tahu status lunas         [Midtrans → Server]
7. MarketplaceContract memindahkan tiket      [Server → Blockchain]
   → TicketContract mengizinkan karena
     pemanggilnya ada di allowlist
8. Uang diteruskan ke rekening penjual        [Server → Midtrans]
   → HANYA setelah langkah 7 berhasil
```

**Langkah 2 adalah inti anti-calo.** Penjual tidak pernah diberi kolom untuk
mengisi harga. Harganya bukan "divalidasi" setelah diisi — harga itu **tidak
pernah menjadi masukan pengguna sejak awal**. Ini pilihan sadar: aturan yang
tidak bisa dilanggar lebih kuat daripada aturan yang diperiksa.

**Langkah 4 mencegah dua pembeli mengejar satu tiket.** Tanpa penguncian,
keduanya bisa sama-sama membayar dan salah satunya harus dikembalikan uangnya —
padahal pengembalian dana tidak bisa diuji sungguhan di lingkungan sandbox.
Masalahnya karena itu **dicegah di depan, bukan diperbaiki setelah terjadi.**

**Langkah 8 tidak boleh mendahului langkah 7.** Tiket yang terlanjur berpindah
masih bisa diperbaiki lewat transaksi tambahan; **uang yang sudah dicairkan ke
rekening orang lain tidak bisa ditarik kembali.**

---

## 4. Keputusan Arsitektur dan Alasannya

### 4.1 Tiket berupa NFT standar ERC-721

**Yang dipilih:** setiap tiket adalah satu NFT ERC-721 di Sepolia Testnet.

**Kenapa NFT, bukan kode QR di database:** perbedaannya ada pada **siapa yang
harus dipercaya.**

| | Kode QR di database | NFT di blockchain |
|---|---|---|
| Cara membuktikan tiket asli | Percaya pada server platform | Diperiksa sendiri oleh siapa pun |
| Kalau server dibobol | Tiket palsu bisa disisipkan | Tidak bisa — pencetakan hanya lewat smart contract berkuota |
| Kalau platform tutup | Tiket hilang | Kepemilikan tetap tercatat |
| Riwayat kepemilikan | Bisa diubah pengelola | Permanen, bisa ditelusuri |

Baris kedua adalah alasan utamanya. Pemalsuan tiket pada sistem konvensional
mungkin terjadi karena **penerbitan tiket dan pencatatan tiket berada di tangan
yang sama**. Dengan NFT, kuota dipaksakan smart contract, sehingga bahkan
pengelola sistem tidak bisa menerbitkan tiket melebihi kuota.

**Kenapa ERC-721, bukan standar lain:** ERC-721 dirancang untuk aset yang
**unik dan tidak saling tertukar** — persis sifat tiket bernomor kursi.
Standar ERC-20 tidak cocok karena semua satuannya identik. ERC-1155 cocok untuk
barang massal yang identik dalam jumlah besar, tapi menyulitkan pelacakan
kepemilikan per satuan, padahal justru itu yang dibutuhkan sistem ini.

**Akibatnya:** tiket bisa dibaca alat mana pun yang mendukung ERC-721, dan
pengguna bisa membuktikan kepemilikannya secara mandiri — salah satu sasaran
sistem.

---

### 4.2 Satu kontrak untuk banyak event (Model B)

**Yang dipilih:** hanya ada **satu** `TicketContract` untuk seluruh event.
Pembeda antar event adalah `eventId`. Setiap event punya kuota, harga, dan
keterangan sendiri yang ditandai nomor itu.

**Yang ditolak (Model A):** menerbitkan satu smart contract baru setiap kali
ada event baru.

**Kenapa Model B:**

| Segi | Model A — satu kontrak per event | **Model B — satu kontrak, banyak event** |
|---|---|---|
| Biaya penerapan | Bayar gas setiap kali ada event baru | Bayar sekali di awal |
| Alamat kontrak | Berbeda-beda, harus dicatat dan dikelola | Satu alamat tetap |
| Pembaruan aturan | Harus dilakukan di setiap kontrak | Cukup sekali |
| Kerumitan sisi server | Server harus melacak alamat mana untuk event mana | Server cukup memakai `eventId` |
| Kerumitan smart contract | Lebih sederhana per kontrak | Butuh pemeriksaan `eventId` di setiap fungsi |
| Dampak bila ada celah keamanan | Terbatas pada satu event | **Menjalar ke semua event** |

**Baris terakhir adalah harga yang dibayar Model B, dan itu diakui.** Karena
semua event bertumpu pada satu kontrak, satu celah berdampak ke semuanya.
Pilihan tetap jatuh ke Model B dengan dua pertimbangan: pertama, ruang lingkup
tugas akhir ini adalah lingkungan uji coba dengan jumlah event terbatas;
kedua, satu kontrak berarti **satu permukaan serangan yang bisa diuji secara
menyeluruh**, lebih terkendali daripada banyak kontrak yang masing-masing diuji
seadanya.

**Akibat yang wajib ditangani di kode:** setiap fungsi yang menerima `eventId`
**wajib** memeriksa bahwa event itu benar ada sebelum melakukan apa pun. Tanpa
pemeriksaan itu, pemanggilan dengan `eventId` yang tidak ada akan dibaca
sebagai event kosong berkuota nol atau — lebih berbahaya — sebagai nilai bawaan
yang tidak dimaksudkan. Ini jebakan khas Model B yang tidak ada di Model A.

---

### 4.3 Alur pembelian satu tahap

**Yang dipilih:** satu tahap bernama **"Pendaftaran"**. Pengguna memilih tiket,
membayar, tiket dicetak. Tidak ada tahap tersembunyi, pengundian acak, maupun
perebutan berbatas waktu.

**Yang ditolak:** skema *commit-reveal* dua tahap dan *flash sale*, keduanya
sempat ada di proposal awal.

**Kenapa dihapus:** *commit-reveal* dirancang untuk mengatasi perebutan cepat
dan serangan *front-running* saat *flash sale*. Tapi **kedua masalah itu
bersumber dari satu hal yang sama: adanya keuntungan yang layak diperebutkan.**

Begitu penguncian harga jual ulang (Bagian 4.6) diterapkan, memborong tiket
tidak lagi menghasilkan keuntungan. Tidak ada keuntungan berarti tidak ada
motif berebut; tidak ada motif berebut berarti tidak perlu mekanisme peredam
perebutan.

**Prinsip yang dipakai:** *hilangkan motifnya, bukan tambal gejalanya.*
Menambahkan *commit-reveal* di atas sistem yang motif calonya sudah mati justru
menambah kerumitan tanpa manfaat — dan setiap kerumitan tambahan adalah
permukaan serangan tambahan.

**Akibatnya:** alur pembelian jadi jauh lebih sederhana, lebih mudah dipahami
pengguna awam, dan lebih sedikit yang bisa salah.

---

### 4.4 Pengikatan identitas: hash, bukan enkripsi

**Yang dipilih:** aturan **satu tiket → satu alamat dompet → satu identitas
nyata**, ditegakkan dengan menyimpan `keccak256(data KTP + salt)` di
blockchain. Data KTP **asli** hanya tersimpan di MySQL, di luar blockchain.

**Yang ditolak:** menyimpan data KTP terenkripsi di blockchain.

**Kenapa hash, bukan enkripsi:**

| | Enkripsi | **Hash** |
|---|---|---|
| Bisa dikembalikan ke data asli? | Ya, kalau punya kuncinya | **Tidak pernah** |
| Titik lemahnya | Kunci | Tidak ada kunci |
| Kalau titik lemahnya bocor | Semua data KTP terbaca | Tidak ada yang bisa dibuka |
| Bisa ditarik kembali dari blockchain? | **Tidak** | **Tidak** |

**Baris terakhir yang menentukan keputusannya.** Data on-chain bersifat
permanen dan terbuka untuk umum — sekali tertulis, tidak bisa dihapus oleh
siapa pun, termasuk oleh pembuat sistem. Kalau data KTP disimpan terenkripsi,
maka:

- kunci enkripsi harus dijaga aman **selamanya**, bukan sekadar selama sistem
  beroperasi;
- kalau kunci itu bocor sepuluh tahun lagi, seluruh data KTP yang pernah
  tersimpan langsung terbaca;
- dan data itu **tidak bisa ditarik kembali**, karena sifat blockchain yang
  permanen.

Dengan hash, risiko itu tidak ada sama sekali. Tidak ada kunci yang bisa bocor,
karena tidak ada kunci.

**Kenapa perlu *salt*:** hash sendirian belum cukup untuk data KTP. Nomor Induk
Kependudukan (NIK) punya **format tetap 16 digit dengan struktur yang bisa
ditebak** — kode wilayah, tanggal lahir, nomor urut. Jumlah kemungkinannya
terbatas, sehingga penyerang bisa menghitung hash semua kemungkinan lalu
mencocokkannya dengan yang tersimpan on-chain. *Salt* acak yang berbeda untuk
setiap pengguna membuat cara itu tidak lagi sepadan, karena penyerang harus
mengulang seluruh perhitungan dari awal untuk setiap pengguna.

**Akibatnya, dan ini penting untuk dipahami:** karena hash tidak bisa dibalik,
**sistem hanya bisa memeriksa kecocokan, tidak pernah bisa membaca ulang data
KTP.**

**Keputusan 7 Agustus 2026 memperluas ini lebih jauh: data KTP tidak disimpan
dalam bentuk terbaca di mana pun**, termasuk di MySQL. Data hanya melewati
ingatan server saat pendaftaran, dihitung sidik jarinya, lalu dibuang.

Akibat langsungnya, verifikasi petugas di lokasi acara **berubah arah**:

| | Kalau data KTP disimpan | **Rancangan sekarang** |
|---|---|---|
| Yang dilakukan sistem | Menampilkan identitas terdaftar | Menerima NIK dari petugas, lalu membandingkan |
| Yang dilihat petugas | Data identitas pemilik | **Hanya jawaban cocok atau tidak** |
| Bila database bocor | Identitas seluruh pengguna bocor | Tidak ada yang bocor |

**Satu masalah yang timbul dari pilihan ini, dan cara mengatasinya:** *salt* per
pengguna membuat NIK yang sama menghasilkan sidik jari yang berbeda — sehingga
**pendaftaran NIK ganda tidak bisa dideteksi**. Karena itu MySQL menyimpan satu
sidik jari tambahan yang sengaja dibuat **tetap**, memakai *pepper* alih-alih
*salt*. Rinciannya di
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 5.1.

**Keterbatasannya diakui:** pengikatan identitas ini bisa ditembus dalam
kondisi tertentu. Dibahas jujur di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

---

### 4.5 Pembatasan transfer: allowlist, bukan Soulbound Token

**Yang dipilih:** tiket **boleh** berpindah tangan, tapi hanya lewat
`MarketplaceContract`. Smart contract menolak perpindahan yang dijalankan pihak
lain.

**Yang ditolak:** *Soulbound Token* — tiket yang sama sekali tidak bisa
dipindahkan setelah dicetak. Ini rancangan yang tertulis di proposal awal.

**Kenapa berubah:**

*Soulbound Token* memang mematikan calo sepenuhnya. Tapi ia juga mematikan hal
yang **sah dan wajar**: orang yang batal hadir tidak bisa mengalihkan tiketnya
ke siapa pun. Tiketnya hangus.

Ini bukan kasus langka. Hasil analisis pada tahap awal justru menemukan
sebaliknya — **kesulitan menjual kembali tiket untuk event yang batal dihadiri
adalah salah satu keluhan pengguna yang teridentifikasi**. Artinya *Soulbound
Token* menyelesaikan satu masalah sambil memperparah masalah lain yang juga
nyata.

Rumusan masalah yang lebih tepat: **yang perlu dimatikan adalah keuntungan
calo, bukan kemampuan tiket berpindah tangan.** Allowlist menjawab rumusan itu
— perpindahan tetap mungkin, tapi hanya lewat satu pintu, dan di pintu itu
keuntungannya dimatikan (Bagian 4.6).

**Akibatnya bagi kode:** pembatasan ini harus ditanam di lapisan terdalam
ERC-721, yaitu titik yang dilewati **semua** perpindahan kepemilikan tanpa
kecuali. Kalau ditaruh di lapisan yang lebih luar, penyerang tinggal memanggil
fungsi lain yang melewatinya.

**Tiga kasus yang wajib dibedakan di titik itu:**

| Kasus | Ciri | Harus |
|---|---|---|
| Pencetakan tiket baru | Pemilik sebelumnya kosong | **Diizinkan** |
| Pembakaran tiket | Pemilik berikutnya kosong | **Diizinkan** |
| Perpindahan antar pengguna | Keduanya terisi | **Hanya lewat `MarketplaceContract`** |

**Jebakan yang paling sering terjadi:** lupa mengecualikan kasus pencetakan.
Pencetakan tiket secara teknis juga merupakan "perpindahan" — dari ketiadaan ke
pemilik pertama. Kalau pembatasannya ditulis tanpa memisahkan kasus ini,
**pencetakan tiket ikut terblokir dan sistem tidak bisa menerbitkan tiket sama
sekali.**

---

### 4.6 Penguncian harga jual ulang

**Yang dipilih:** harga jual ulang **otomatis dikunci sama dengan
`originalPrice`**, yaitu harga beli awal yang tercatat permanen saat tiket
pertama kali dicetak. Penjual tidak diberi kesempatan menentukan harga.

**Kenapa dikunci di `originalPrice`, bukan diberi batas atas:** batas atas —
misalnya "maksimal 110% harga asli" — masih menyisakan keuntungan. Selama masih
ada keuntungan, memborong tiket masih masuk akal secara ekonomi, hanya jadi
lebih tipis. Mengunci tepat di `originalPrice` menghilangkan motifnya
seluruhnya, bukan menguranginya.

**Kenapa `originalPrice` dicatat permanen dan tidak pernah berubah:** kalau
patokannya adalah harga transaksi terakhir, calo bisa menaikkannya bertahap
lewat penjualan berantai antar dompet miliknya sendiri. Dengan mengunci ke
harga cetak pertama, jumlah perpindahan tangan tidak memengaruhi harga sama
sekali.

**Kenapa Bagian 4.5 dan 4.6 harus dipasangkan:**

| | Tanpa allowlist | Dengan allowlist |
|---|---|---|
| **Tanpa penguncian harga** | Sistem tiket biasa — calo bebas | Calo tetap untung, hanya harus lewat sistem |
| **Dengan penguncian harga** | Calo bertransaksi di luar sistem, penguncian tidak ada artinya | **Tidak ada jalan untung** |

Hanya kotak kanan bawah yang menutup masalah. Masing-masing sendirian bisa
ditembus:

- Penguncian harga **tanpa** allowlist bisa dilewati dengan bertransaksi di
  luar sistem — tiket dipindahkan lewat dompet, uangnya lewat jalur lain.
- Allowlist **tanpa** penguncian harga hanya memindahkan praktik calo ke dalam
  sistem, tidak menghapusnya.

**Gabungan keduanya adalah mekanisme anti-calo utama sistem ini:** tiket hanya
bisa dijual lewat satu pintu, dan di pintu itu keuntungan sudah dimatikan.

---

### 4.7 Gerbang tanda tangan digital (EIP-712 + ECDSA)

**Yang dipilih:** fungsi-fungsi penting di smart contract hanya mau dijalankan
bila disertai tanda tangan digital sah dari sistem.

**Kenapa diperlukan:** smart contract bersifat **terbuka**. Siapa pun bisa
memanggilnya langsung lewat RPC, tanpa pernah membuka situs web kita.
Konsekuensinya, seluruh pemeriksaan yang ada di sisi web — penyaring bot,
pemeriksaan pembayaran, pemeriksaan status KYC — **bisa dilewati sepenuhnya**
oleh siapa pun yang memanggil kontrak secara langsung.

Gerbang tanda tangan digital menutup celah itu: tanpa tanda tangan sah dari
sistem, pemanggilan langsung tetap ditolak smart contract.

**Cara membingkainya — dan ini penting saat sidang:**

> Gerbang tanda tangan digital adalah **lapisan kontrol akses berstandar
> industri**, setara dengan pemeriksaan izin di sistem mana pun.

Ini **bukan** tambalan atas kelemahan smart contract. Keterbukaan smart
contract adalah **sifat bawaan blockchain, bukan cacat rancangan** — justru
sifat itulah yang membuat siapa pun bisa memverifikasi kepemilikan tiket secara
mandiri, salah satu manfaat utama sistem ini. Membingkainya sebagai "kelemahan
yang ditambal" akan terdengar seperti pengakuan bahwa rancangannya bermasalah,
padahal tidak.

**Kenapa EIP-712, bukan tanda tangan biasa:** EIP-712 membuat isi yang
ditandatangani **terbaca manusia** dan **terikat pada satu kontrak di satu
jaringan tertentu**. Dua sifat itu menutup serangan pengulangan tanda tangan
(*replay*): tanda tangan untuk satu kontrak tidak bisa dipakai ulang di kontrak
lain atau di jaringan lain.

**Yang wajib diperhatikan saat menulis kode — siapa yang menandatangani:**

Ini jebakan khusus sistem ini. Karena memakai ERC-4337, **dompet pengguna
adalah *smart account*, bukan EOA.** Cara memeriksa tanda tangan keduanya
**berbeda**.

| Penandatangan | Jenis dompet | Cara memeriksanya |
|---|---|---|
| **Sistem** (kunci milik server) | EOA | Pemulihan alamat penandatangan biasa sudah benar |
| **Pengguna** | *Smart account* (ERC-4337) | Harus lewat ERC-1271 — pemulihan alamat biasa **tidak akan berhasil** |

Sebelum menulis fungsi apa pun yang memeriksa tanda tangan, **pastikan dulu
siapa yang menandatanganinya.** Salah menebak di sini menghasilkan fungsi yang
selalu menolak tanda tangan sah, dan penyebabnya sulit ditemukan karena tidak
ada pesan kesalahan yang menunjuk ke sana.

Dalam rancangan ini, penandatangan untuk izin pencetakan tiket adalah
**sistem**, bukan pengguna. Rinciannya di
[`05-spesifikasi-smart-contract.md`](05-spesifikasi-smart-contract.md).

---

### 4.8 Dompet otomatis lewat ERC-4337

**Yang dipilih:** pengguna mendaftar cukup dengan surel. Dompet dibuat otomatis
lewat ZeroDev SDK, memakai EntryPoint versi 0.7. Seluruh biaya gas ditanggung
sistem lewat *Paymaster*.

**Kenapa:** ini menjawab langsung temuan penelitian terdahulu (Saputro &
Lathifah, 2025) bahwa **hambatan utama adopsi tiket berbasis NFT adalah
rendahnya pemahaman masyarakat terhadap blockchain** — bukan kelemahan
teknologinya.

Hasil kuesioner mendukung arah ini: 97% responden tidak keberatan memakai
sistem baru meski tidak paham detail teknisnya, dan 97% lebih nyaman bila
pendaftaran cukup dengan surel tanpa kata sandi. Artinya pengguna bersedia
memakai teknologi yang tidak dipahaminya — **asalkan tidak dipaksa
mempelajarinya lebih dulu.**

**Yang ditolak:** mewajibkan pengguna menghubungkan dompet luar seperti
MetaMask. Ini pendekatan yang dipakai FIFA Collect, dan hasil analisis sistem
sejenis menunjukkan pendekatan itu **tetap menuntut pemahaman teknis
blockchain** dari penggunanya.

**Akibatnya:**

| Dengan MetaMask | Dengan ERC-4337 + Paymaster |
|---|---|
| Pasang ekstensi peramban lebih dulu | Tidak perlu memasang apa pun |
| Catat dan simpan frasa rahasia | Tidak ada frasa rahasia |
| Beli aset kripto untuk biaya gas | Tidak perlu aset kripto sama sekali |
| Setujui setiap transaksi secara manual | Berjalan di latar belakang |

**Harga yang dibayar, dan ini diakui:** pengguna tidak memegang kunci
pribadinya sendiri. Kendali atas dompet bergantung pada sistem. Ini pertukaran
yang disadari — kemudahan ditukar dengan sebagian kemandirian — dan dicatat di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

---

### 4.9 Penyaring bot: Cloudflare Turnstile

**Yang dipilih:** Cloudflare Turnstile di sisi halaman web, dengan **verifikasi
token dilakukan di server**, bukan di peramban.

**Kenapa verifikasinya wajib di server:** kalau peramban yang memeriksa
tokennya sendiri, pemeriksaan itu tidak ada artinya — penyerang tinggal
mengubah jawabannya. Token juga **hanya berlaku sekali pakai dan berumur
pendek**, sehingga tidak bisa disimpan lalu dipakai berulang.

**Kenapa Turnstile, bukan CAPTCHA bergambar:** hasil wawancara menunjukkan
CAPTCHA konvensional memang menghambat — salah satu narasumber menilai tingkat
hambatannya 8 dari 10. Tapi hambatan itu **dirasakan pengguna sah juga**, dan
narasumber tetap berhasil menembusnya lewat strategi banyak perangkat. Artinya
CAPTCHA bergambar membebani pengguna jujur tanpa benar-benar menghentikan
pelaku. Turnstile menilai di latar belakang, sehingga sebagian besar pengguna
tidak perlu menyelesaikan teka-teki apa pun.

---

## 5. Dua Lapisan Pertahanan yang Tidak Saling Menggantikan

Bagian ini dipisahkan sendiri karena **paling sering disalahpahami**, dan hampir
pasti ditanyakan penguji.

Pertanyaan yang biasa muncul: *"Kalau sudah ada penyaring bot, kenapa masih
perlu tanda tangan digital?"* — atau kebalikannya.

Jawabannya: **keduanya berdiri di jalur masuk yang berbeda.**

```
JALUR 1 — lewat situs web
  Penyerang → Halaman web → Server → Blockchain
                  ▲
            Turnstile berdiri di sini
            Tanda tangan digital tidak relevan,
            karena server yang menandatangani

JALUR 2 — langsung lewat RPC
  Penyerang ─────────────────────────→ Blockchain
                                            ▲
                              Tanda tangan digital berdiri di sini
                              Turnstile TIDAK PERNAH DILEWATI,
                              karena halaman web tidak pernah dibuka
```

| | Turnstile | Gerbang tanda tangan digital |
|---|---|---|
| Berdiri di | Halaman web | Smart contract |
| Menghadang | Program otomatis yang memakai situs web | Pemanggilan langsung lewat RPC |
| Dilewati kalau | Penyerang memanggil kontrak langsung | Penyerang tidak punya kunci sistem |
| Kalau ini satu-satunya | Kontrak bisa dipanggil bebas lewat RPC | Bot bisa membanjiri server lewat web |

**Kesimpulan:** menghapus salah satunya membuka salah satu jalur sepenuhnya.
Keduanya bukan pengulangan yang berlebihan, melainkan **dua penjagaan untuk dua
pintu berbeda**.

---

## 6. Pemisahan Penyimpanan Data

Tiga tempat penyimpanan, dengan pertanyaan penentu yang berbeda untuk
masing-masing.

### 6.1 Aturan penempatannya

```
Apakah data ini harus TIDAK BISA DIUBAH,
bahkan oleh pengelola sistem?
        │
        ├── YA ──► Apakah data ini rahasia?
        │             ├── YA  ──► ON-CHAIN, tapi HANYA hash-nya.
        │             │            Aslinya di MySQL.
        │             └── TIDAK ─► ON-CHAIN langsung.
        │
        └── TIDAK ─► Apakah ukurannya besar dan hanya perlu dibaca?
                      ├── YA  ──► IPFS lewat Pinata
                      └── TIDAK ─► MySQL
```

### 6.2 Rinciannya

**On-chain (Sepolia Testnet)**

| Data | Kenapa harus on-chain |
|---|---|
| Kepemilikan tiket (`tokenId`, pemilik) | Inti dari jaminan keaslian. Kalau bisa diubah pengelola, seluruh sistem kehilangan maknanya |
| `originalPrice` | Patokan penguncian harga. Kalau bisa diubah, penguncian harga bisa dilewati dengan menaikkan patokannya |
| Kuota per event | Kalau bisa dilampaui, pemalsuan tiket kembali mungkin terjadi |
| Jumlah pembelian per dompet per event | Batas pembelian tidak boleh bisa diakali dengan mengubah catatan di server |
| Status pemakaian tiket | Mencegah satu tiket dipakai dua kali |
| Status penawaran jual ulang | Mencegah satu tiket ditawarkan ke dua pembeli sekaligus |
| **Sidik jari digital data KTP** | Bukti bahwa data identitas di MySQL belum diubah setelah didaftarkan |

**Off-chain — IPFS lewat Pinata**

| Data | Kenapa di sini |
|---|---|
| Nama event, tanggal dan waktu, lokasi venue | Keterangan deskriptif. Perlu tersedia untuk umum, tapi tidak perlu ditegakkan smart contract |
| Kategori tiket, nomor kursi, nama penyelenggara | Sama seperti di atas |
| Gambar tiket | **Berukuran besar.** Menyimpan gambar on-chain biayanya sangat mahal dan tidak sepadan |

**Kenapa IPFS, bukan server biasa:** alamat berkas di IPFS dihitung dari isinya.
Kalau isi berkas diubah, alamatnya ikut berubah — sehingga NFT yang menunjuk ke
alamat lama otomatis ketahuan tidak lagi cocok. Ini mencegah keterangan tiket
diubah diam-diam setelah tiket terjual, misalnya mengganti tanggal atau lokasi
acara. Server biasa tidak punya sifat ini.

**Kenapa perlu Pinata:** IPFS tidak menjamin berkas tersimpan selamanya kalau
tidak ada komputer yang bersedia menyimpannya. Pinata mengambil peran itu.

**Off-chain — MySQL**

| Data | Kenapa di sini |
|---|---|
| **Sidik jari digital identitas beserta *salt*-nya**, dan **rekening penjual** | **Rahasia.** Tidak boleh on-chain karena data on-chain terbuka untuk umum dan permanen. Di sini aksesnya bisa dibatasi dan datanya bisa dihapus. **Data KTP terbaca tidak disimpan di sini maupun di mana pun** |
| Data akun pengguna | Perlu sering diubah, dan tidak perlu jaminan tidak bisa diubah |
| Data event dan kategori tiket | Perlu bisa disunting penyelenggara sebelum event dibuka |
| Salinan data tiket | Untuk pencarian cepat. Membaca semuanya dari blockchain lambat dan berbiaya |
| Riwayat pesanan, penawaran jual ulang | Data operasional yang perlu dicari dan disaring |
| Notifikasi, riwayat masuk | Data operasional biasa |

Rincian kolom setiap tabel ada di
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md).

### 6.3 Kenapa ada data yang sengaja disimpan dua kali

Data tiket ada di blockchain **dan** ada salinannya di MySQL. Ini disengaja,
bukan kelalaian rancangan.

**Alasannya:** membaca data dari blockchain lambat dan berbiaya. Menampilkan
halaman "tiket saya" dengan membaca satu per satu dari blockchain akan terasa
lambat bagi pengguna.

**Aturan yang mengikutinya, dan ini wajib dipatuhi di seluruh kode:**

> **Blockchain adalah sumber kebenaran. MySQL hanya salinan untuk mempercepat
> tampilan.**

Kalau keduanya berbeda, yang benar adalah blockchain. Semua keputusan yang
menyangkut kepemilikan, harga, atau kuota **wajib** dibaca dari blockchain,
tidak boleh dari salinan MySQL. Salinan MySQL hanya boleh dipakai untuk
menampilkan dan mencari.

---

## 7. Peran Setiap Bagian Secara Ringkas

| Bagian | Yang menjadi tanggung jawabnya | Yang **bukan** tanggung jawabnya |
|---|---|---|
| **Next.js** | Tampilan, navigasi, memuat penyaring bot | Aturan keamanan apa pun — semuanya bisa dilewati |
| **NestJS** | Pemeriksaan token bot, verifikasi pembayaran, pemrosesan data KTP, penandatanganan izin, pengiriman transaksi, pencairan dana | Menegakkan aturan yang harus tidak bisa dilanggar, dan **menyimpan data KTP terbaca** |
| **MySQL** | Data operasional dan data rahasia | Menjadi acuan kepemilikan, harga, atau kuota |
| **IPFS/Pinata** | Keterangan tiket dan gambar | Data rahasia apa pun — isinya terbuka untuk umum |
| **`TicketContract`** | Kepemilikan, kuota, `originalPrice`, hash KTP, pembatasan perpindahan | Menyimpan data rahasia |
| **`MarketplaceContract`** | Penawaran jual ulang dan penguncian harga | Menerbitkan tiket baru |
| **EntryPoint + Paymaster** | Menjalankan transaksi ERC-4337 dan menanggung gas | Logika bisnis apa pun |

---

## 8. Batas Kepercayaan dan Akibatnya Bila Ditembus

Bagian ini menuliskan secara jujur **apa yang terjadi bila salah satu bagian
dikuasai penyerang.** Menuliskannya sendiri lebih baik daripada ditemukan
penguji.

| Yang ditembus | Yang bisa dilakukan penyerang | Yang **tetap tidak bisa** dilakukan |
|---|---|---|
| **Peramban pengguna** | Melewati penyaring bot, mengirim permintaan palsu ke server | Mencetak tiket — server tetap menuntut bukti pembayaran dari Midtrans |
| **Database MySQL** | Membaca sidik jari digital identitas — **tidak membocorkan identitas siapa pun** selama *pepper* tidak ikut bocor | Membaca data KTP, karena tidak ada yang tersimpan. Mengubah kepemilikan tiket, harga, atau kuota — semuanya on-chain |
| **Database MySQL *dan* *pepper* sekaligus** | Menebak NIK dengan mencoba semua kemungkinan lalu mencocokkannya | Mengubah kepemilikan tiket, harga, atau kuota |
| **Kunci penandatangan sistem** | Mencetak tiket tanpa membayar, sampai kuota event habis | Melampaui kuota, atau menjual ulang di atas `originalPrice` — keduanya dipaksakan smart contract |
| **Server NestJS sepenuhnya** | Semua di atas sekaligus, termasuk mencairkan dana ke rekening lain | Melampaui kuota, mengubah `originalPrice`, atau memindahkan tiket di luar `MarketplaceContract` |

**Yang bisa dibaca dari tabel ini:** kolom terakhir selalu berisi hal yang
sama — kuota, harga, dan jalur perpindahan. Ketiganya **tetap aman meskipun
seluruh server dikuasai**, karena ditegakkan smart contract, bukan server.
Inilah alasan ketiga hal itu ditaruh on-chain dan bukan di tempat lain.

**Dua risiko terbesar yang tersisa:**

**Pertama, *pepper* bocor bersama database.** Sejak data KTP tidak lagi disimpan
dalam bentuk terbaca, *pepper* adalah satu-satunya rahasia yang melindungi
identitas pengguna. Karena itu ia **wajib disimpan di luar database yang
dilindunginya** (KNF-37) — baris kedua dan ketiga tabel di atas sengaja
dipisahkan untuk menunjukkan betapa berbeda akibatnya.

**Kedua, pencairan dana bisa diarahkan ke rekening lain bila server dikuasai.**
Berbeda dari tiket yang tetap terlindungi smart contract, **penerusan uang tidak
punya penjagaan di luar server.** Ini pertukaran yang melekat pada keputusan
memakai Midtrans, bukan blockchain, untuk urusan uang.

Keduanya dicatat di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

---

## 9. Ringkasan: Setiap Masalah dan Lapisan yang Menanganinya

| Masalah | Lapisan yang menanganinya | Bagian |
|---|---|---|
| Pemalsuan tiket | Tiket sebagai NFT ERC-721 dengan kuota dipaksakan smart contract | 4.1 |
| Manipulasi harga di pasar sekunder | Allowlist **+** penguncian harga jual ulang | 4.5, 4.6 |
| Bot memborong tiket lewat situs web | Cloudflare Turnstile | 4.9 |
| Bot memanggil smart contract langsung lewat RPC | Gerbang tanda tangan digital EIP-712 | 4.7 |
| Satu orang memborong banyak tiket | Pengikatan identitas KTP + batas beli per dompet per event | 4.4 |
| Pengguna tidak paham blockchain | ERC-4337 + Paymaster | 4.8 |
| Data KTP bocor dari blockchain | Hash dengan *salt*, aslinya tidak pernah on-chain | 4.4 |
| Keterangan tiket diubah setelah terjual | Alamat IPFS dihitung dari isi berkas | 6.2 |
