# CLAUDE.md — Konteks Proyek Tugas Akhir Sistem Tiket Berbasis NFT

> **Untuk asisten (Claude Code):** baca seluruh file ini sebelum menulis kode
> atau dokumen apa pun. File ini berisi keputusan yang sudah final bersama
> dosen pembimbing. Jangan mengusulkan arsitektur alternatif kecuali Edward
> yang memintanya lebih dulu.
>
> **Untuk Edward:** file ini adalah "ingatan" proyek. Setiap kali ada
> keputusan arsitektur baru atau status berubah, perbarui file ini — bukan
> menjelaskan ulang lewat percakapan.

---

## 0. Cara Memakai File Ini

| Bagian        | Isinya                                                    | Kapan dibaca                                 |
| ------------- | --------------------------------------------------------- | -------------------------------------------- |
| Bagian 1      | Siapa dan proyek apa                                      | Sekali di awal                               |
| Bagian 2      | Kamus istilah                                             | Baca sebelum bagian 4                        |
| Bagian 3      | Isi proposal yang sudah tidak berlaku                     | **Wajib**, sebelum menyentuh proposal PDF    |
| Bagian 4      | Arsitektur final                                          | Setiap kali menulis kode atau dokumen teknis |
| Bagian 5–6    | Teknologi dan status kode                                 | Sebelum implementasi                         |
| Bagian 7      | Keterbatasan yang disadari                                | Sebelum menulis dokumen                      |
| **Bagian 8**  | **Batas peran: asisten menjelaskan, Edward menulis kode** | **Setiap kali diminta bantuan teknis**       |
| **Bagian 9**  | **Versi pustaka terkini**                                 | **Sebelum memberi contoh sintaks apa pun**   |
| **Bagian 10** | **Cara memakai sub-agent**                                | **Saat tugas butuh banyak pencarian**        |
| Bagian 11–12  | Status terkini dan larangan                               | Sebelum memberi saran apa pun                |

---

## 1. Identitas Proyek

- **Judul:** Pembuatan Sistem Jual Beli Tiket Event Berbasis Non-Fungible Token
- **Penulis:** Benedictus Leonardo Edward Stephen Sugianto
- **Nomor Pokok Mahasiswa (NRP):** 160423176
- **Program Studi:** Teknik Informatika, Fakultas Teknik, Universitas Surabaya
- **Dosen Pembimbing:** Maya Hilda Lestari Louk dan Dr. Daniel Soesanto
- **Target sidang tugas akhir:** mulai 17 November 2026 (LSTA 10 November)
- **Tenggat antara (ditetapkan awal September 2026):** kuesioner SUS disebar
  19 September; draf Bab 5 26 September; titik go/no-go 6–8 Oktober; setor
  Bab 5 10 Oktober; setor Bab 6 17 Oktober; cek plagiarisme + ACC pembimbing
  1–7 November. Rincian harian/mingguan: `docs/kerja/panduan-pengerjaan.md`.
  Checklist per fase: `TASKS.md`.
- **Kapasitas kerja:** 4–5 jam per hari kerja (sambil magang), lebih longgar
  di akhir pekan. Konsultasi pembimbing tiap Senin 09.00.
- Catatan: batas lama "penambahan fitur berhenti 10 Agustus 2026" **tidak
  berlaku lagi** — digantikan jadwal di atas. Pembekuan fitur yang nyata:
  18 September malam (menjelang kuesioner) dan 31 Oktober (kode selesai).

**Masalah yang diselesaikan:** pemalsuan tiket event dan manipulasi harga
tiket di pasar sekunder (penjualan kembali oleh calo dengan harga jauh di
atas harga resmi).

---

## 2. Kamus Istilah

**Istilah blockchain dasar**

- **Blockchain** — buku catatan digital yang tersebar di banyak komputer.
  Sekali dicatat, isinya tidak bisa diubah diam-diam.
- **Ethereum** — jaringan blockchain yang bisa menjalankan program.
- **Sepolia Testnet** — "jaringan latihan" Ethereum. Uangnya tidak bernilai
  nyata. Proyek ini memakai ini, bukan jaringan sungguhan.
- **Smart contract** — program yang berjalan di atas blockchain. Aturannya
  otomatis dan tidak bisa dilanggar, bahkan oleh pembuatnya.
- **Wallet address (alamat dompet)** — semacam nomor rekening di blockchain.
- **On-chain** — data di dalam blockchain. Permanen dan terbuka untuk umum.
- **Off-chain** — data di luar blockchain, misalnya di database biasa.
- **Gas** — biaya setiap transaksi di blockchain.
- **RPC (Remote Procedure Call)** — cara aplikasi "berbicara" langsung ke
  blockchain lewat internet. Siapa pun bisa memakai cara ini, tidak harus
  lewat situs web resmi kita.
- **EOA (Externally Owned Account)** — dompet biasa yang dikendalikan kunci
  pribadi manusia. Lawannya adalah _smart account_ (dompet berupa program).

**Standar dan protokol yang dipakai**

- **NFT (Non-Fungible Token)** — token digital unik. Di sini, satu NFT = satu
  tiket.
- **ERC-721** — standar resmi pembuatan NFT di Ethereum.
- **ERC-4337 (Account Abstraction)** — standar yang memungkinkan pengguna
  punya dompet blockchain **tanpa** perlu mengerti kunci pribadi atau frasa
  rahasia.
- **Paymaster** — bagian ERC-4337 yang membuat **sistem yang membayar biaya
  gas**, bukan penggunanya.
- **EIP-712** — standar penandatanganan data digital dengan format yang bisa
  dibaca manusia.
- **ECDSA** — metode matematis di balik tanda tangan digital tersebut.
- **ERC-1271** — standar cara _smart account_ membuktikan tanda tangannya sah.
  Berbeda dari cara EOA. **Penting untuk proyek ini** (lihat Bagian 9).
- **Passkey** — pasangan kunci kriptografis yang dibuat dan disimpan di
  perangkat pengguna. Menggantikan kata sandi dan frasa rahasia.
- **WebAuthn** — standar resmi W3C yang mengatur cara peramban memakai
  passkey.
- **P-256 (secp256r1)** — kurva eliptik yang dipakai passkey. **Berbeda dari
  secp256k1** yang dipakai Ethereum, sehingga verifikasi tanda tangan passkey
  di blockchain butuh penanganan khusus dan lebih mahal.
- **CREATE2** — cara menghitung alamat kontrak secara pasti sebelum kontraknya
  dibuat. Dipakai menurunkan alamat dompet dari public key passkey.
- **TPM / Secure Enclave** — penyimpanan kunci berbasis hardware. Kunci di
  dalamnya bisa dipakai tapi tidak bisa dibaca keluar.
- **BIP-39** — standar frasa pemulihan 12 kata. Di sini hanya untuk keadaan
  darurat, bukan pemakaian sehari-hari.
- **keccak256** — fungsi _hash_, pengubah data menjadi sidik jari digital.
  **Satu arah**: dari data bisa dibuat sidik jari, tapi dari sidik jari
  **tidak bisa** kembali ke data aslinya.
- **Salt** — data acak tambahan sebelum di-_hash_, mencegah penebakan isi asli
  dengan mencoba satu per satu.
- **IPFS** — penyimpanan file tersebar, untuk keterangan tiket.
- **Pinata** — layanan penjaga agar file IPFS tidak hilang.

**Istilah proyek**

- **`eventId`** — nomor pembeda antar event dalam satu smart contract.
- **`originalPrice`** — harga beli awal tiket, patokan harga jual ulang.
- **Allowlist** — daftar pihak yang diizinkan. Di sini hanya kontrak
  marketplace yang boleh memindahkan tiket.
- **Pasar sekunder** — penjualan kembali tiket ke orang lain.
- **Scalping / calo** — memborong tiket lalu menjual dengan harga jauh lebih
  tinggi.
- **Jastip (jasa titip)** — orang yang dititipi membelikan tiket, sering sudah
  memegang data identitas penitip.

---

## 3. PERINGATAN: Proposal PDF Sudah Sebagian Kedaluwarsa

Berkas `Proposal_TA_160423176.pdf` adalah versi **awal**. Arsitektur sudah
berubah setelah dibahas dengan pembimbing.

| Tertulis di proposal (SUDAH TIDAK DIPAKAI)                     | Yang benar sekarang                                                                     | Alasan perubahan                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Soulbound Token** — tiket sama sekali tidak bisa dipindahkan | **Pembatasan allowlist** — bisa dipindahkan, tapi hanya lewat kontrak marketplace resmi | Tiket tetap perlu bisa dijual ulang secara sah, asal harganya terkunci                                                                                 |
| **Commit-Reveal Scheme** — pembelian dua tahap                 | **Dihapus.** Diganti pendaftaran satu tahap                                             | Masalah yang diatasinya adalah perebutan cepat saat flash sale; karena keuntungan calo sudah dimatikan lewat penguncian harga, insentif berebut hilang |
| **Flash sale** sebagai salah satu dari empat alur utama        | **Tidak ada.** Alur utama tinggal **tiga**                                              | Ikut terhapus bersama commit-reveal                                                                                                                    |
| **Chainlink VRF** — pengundian acak                            | **Tidak dipakai**                                                                       | Persaingan dinilai sudah cukup sehat                                                                                                                   |
| Ruang lingkup poin 7: _"tidak mencakup KYC formal"_            | **KYC ditambahkan** lewat data Kartu Tanda Penduduk                                     | Agar satu tiket terikat pada satu orang nyata                                                                                                          |
| Ruang lingkup poin 6 soal serangan Sybil                       | Perlu ditulis ulang                                                                     | Alasannya berubah setelah commit-reveal dan VRF dihapus                                                                                                |
| Model smart contract tidak jelas                               | **Model B**: satu kontrak untuk banyak event, dibedakan `eventId`                       | Lebih sederhana dan hemat biaya                                                                                                                        |

**Bagian proposal yang masih valid:** latar belakang, rumusan masalah, tujuan,
manfaat, kategori event, Sepolia Testnet, Midtrans sandbox, IPFS/Pinata, dan
susunan teknologi dasar.

---

## 4. Arsitektur Final

Sudah disetujui pembimbing. Perubahan hanya atas permintaan Edward.

### 4.1 Bentuk tiket

Setiap tiket adalah satu NFT standar **ERC-721** di **Sepolia Testnet**.

### 4.2 Satu kontrak untuk banyak event (Model B)

Hanya ada **satu** `TicketContract`. Pembeda antar event adalah `eventId`.
Setiap event punya kuota sendiri yang dipaksakan smart contract.

### 4.3 Alur pembelian: satu tahap

Satu tahap bernama **"Pendaftaran"**. Tidak ada tahap sembunyi-sembunyi,
pengundian acak, atau perebutan flash sale.

### 4.4 Pengikatan identitas (KYC)

Aturan: **satu tiket → satu alamat dompet → satu identitas nyata.**

> **⚠ BELUM PUTUS — keputusan K10, target konsultasi 7 September 2026.**
> Dua versi skema pernah dirancang. Badan bagian ini mengikuti versi yang
> **lebih baru** (ERD `design/erd-nft.mwb` 24–25 Agustus +
> `kamus-data-bab4.docx`); versi 7 Agustus diringkas sebagai catatan
> pembanding di bawah. **Jangan mengimplementasikan versi mana pun sebelum
> K10 putus** — perbandingan lengkap di `docs/kerja/keputusan.md`.

**Yang perlu disiapkan sebelum konsultasi 7 September:** versi ERD menyimpan
`full_name` dalam bentuk terbaca dan `ktp_photo`. Ini keputusan privasi, bukan
detail teknis. Siapkan jawaban untuk pertanyaan "kenapa foto KTP disimpan
padahal narasi keamanan menyatakan data identitas tidak disimpan terbaca" —
pertanyaan ini wajar muncul di sidang untuk konsentrasi Network & Cyber
Security.

**Skema berjalan (versi ERD 24–25 Agustus):**

- Tabel `kyc_records` di MySQL menyimpan `full_name` (terbaca, sesuai KTP),
  `nik_hash` (`CHAR(66)`, **unik** — rumus hash-nya belum dituliskan di
  rancangan mana pun, tetapkan saat K10), `ktp_photo` (path/URL foto KTP),
  dan `verified_at` (verifikasi manual oleh admin); terikat satu-ke-satu ke
  `users`.
- Pendaftaran ganda dicegah lewat kunci unik `nik_hash`.
- Yang dicatat ke blockchain: hash identitas ke mapping `userIdentities` di
  `TicketContract` — bahan persis hash ini ikut keputusan K10.

**Catatan pembanding — skema 7 Agustus (kandidat yang bersaing di K10):**
data KTP tidak disimpan terbaca di mana pun. Yang disimpan:
`keccak256(NIK + nama + tanggal lahir + salt)` di blockchain (salt acak per
pengguna), plus `salt` dan `keccak256(NIK + pepper sistem)` di MySQL
(pepper = rahasia tunggal di luar database, supaya NIK ganda terdeteksi lewat
kunci unik). Konsekuensinya sistem tidak pernah bisa menampilkan data KTP ke
siapa pun, dan verifikasi di lokasi acara dibalik: petugas memasukkan NIK
dari KTP fisik → jawaban sistem hanya "cocok / tidak cocok". Kekuatannya:
privasi dan narasi keamanan; kelemahannya: verifikasi manual mustahil dan
salah ketik data = hash tidak cocok. Rincian versi ini masih ada di
`docs/04-rancangan-database-erd.md` Bagian 5 dan
`docs/09-keterbatasan-sistem.md` Bagian 2–3 — kedua berkas itu **masih
menganut versi lama**; jangan dipakai sebagai acuan skema sampai K10 putus.

### 4.5 Pembatasan pemindahan tiket (allowlist)

Tiket **tidak** dimatikan total seperti Soulbound Token. Smart contract hanya
mengizinkan **`MarketplaceContract`** menjalankan perpindahan kepemilikan.
Akibatnya tiket tidak bisa dijual diam-diam di luar sistem.

### 4.6 Penguncian harga jual ulang — senjata utama anti-calo

Harga jual ulang **otomatis dikunci sama dengan `originalPrice`**. Penjual
tidak bisa mengambil untung.

Gabungan 4.5 dan 4.6 adalah **mekanisme anti-calo paling utama**: tiket hanya
bisa dijual lewat satu pintu, dan di pintu itu harga dikunci — memborong tiket
jadi tidak menguntungkan.

### 4.7 Gerbang tanda tangan digital (EIP-712 + ECDSA)

Fungsi penting hanya bisa dipanggil dengan tanda tangan digital sah dari
sistem.

**Cara menjelaskannya ke penguji sangat penting:** sebut sebagai **"lapisan
kontrol akses berstandar industri"**. Jangan pernah menyebutnya tambalan atas
kelemahan smart contract. Smart contract memang terbuka dan bisa dipanggil
siapa saja lewat RPC — itu sifat bawaan blockchain, bukan cacat rancangan.

### 4.8 Dompet otomatis untuk pengguna awam (ERC-4337 + passkey)

**Model autentikasi hibrida.** Ada dua hal berbeda yang sering tertukar:

| Untuk apa | Pakai apa |
| --- | --- |
| Masuk ke akun aplikasi | Email + kata sandi |
| Menandatangani transaksi blockchain | Passkey (WebAuthn) |

Keduanya terpisah. Kata sandi tidak bisa dipakai menandatangani transaksi,
dan passkey tidak dipakai untuk login akun biasa.

**Cara dompet dibuat.** Saat mendaftarkan passkey, perangkat pengguna
membangkitkan sepasang kunci ECC pada kurva P-256. Private key masuk ke
penyimpanan terlindungi hardware (TPM di Windows, Secure Enclave di perangkat
Apple) dan **tidak bisa diekspor oleh siapa pun** — termasuk oleh sistem ini.
Yang keluar ke aplikasi hanya public key (koordinat `pubX` dan `pubY`) dan
credential ID.

Public key itulah yang jadi bahan salt CREATE2. Alamat dompet dihitung secara
deterministik dari situ lewat ZeroDev SDK, memakai Kernel sebagai smart
account dan EntryPoint v0.7. Alamatnya sudah sah menerima NFT sebelum kontrak
dompetnya di-deploy; deployment baru terjadi saat UserOperation pertama
dikirim, dan biayanya ditanggung sistem lewat Paymaster.

**Akibatnya pengguna tidak perlu punya aset kripto sama sekali**, dan tidak
pernah diminta menyimpan frasa rahasia dalam pemakaian sehari-hari.

**Ini tetap self-custody.** Sistem tidak bisa menandatangani atas nama
pengguna, karena kuncinya tidak ada di sistem. Jangan pernah menulis bahwa
"kendali dompet bergantung pada sistem" — itu salah dan menghancurkan
justifikasi pemakaian ERC-4337.

**Pemulihan saat perangkat hilang.** Dua jalur: menambah perangkat baru
(wajib disetujui tanda tangan dari perangkat yang sudah terdaftar), atau
passphrase BIP-39 12 kata untuk kasus darurat perangkat tunggal hilang.
Jalur kedua hanya bisa mendaftarkan perangkat baru lewat backend dengan
pembatasan laju percobaan — tidak bisa dipakai menandatangani transaksi
langsung.

Ini menjawab langsung temuan penelitian terdahulu bahwa hambatan utama adopsi
tiket NFT adalah rendahnya pemahaman masyarakat terhadap blockchain.

### 4.9 Pencegahan bot (Cloudflare Turnstile)

Menyaring bot di sisi situs web.

**Sering salah dipahami:** penyaring bot dan pengamanan smart contract adalah
**dua lapisan berbeda yang tidak saling menggantikan.** Penyaring bot bekerja
di halaman web; smart contract tetap bisa dipanggil langsung lewat RPC tanpa
membuka halaman web sama sekali — itulah alasan lapisan 4.7 tetap diperlukan.

---

## 5. Susunan Teknologi

| Bagian                       | Teknologi            | Fungsinya                              |
| ---------------------------- | -------------------- | -------------------------------------- |
| Smart contract               | Solidity + Foundry   | Bahasa dan alat uji program blockchain |
| Backend                      | NestJS + TypeORM     | Logika sistem dan penghubung database  |
| Database                     | MySQL                | Data operasional di luar blockchain    |
| Frontend                     | Next.js              | Halaman web yang dilihat pengguna      |
| Penghubung blockchain        | Alchemy              | Jalur komunikasi backend ke Ethereum   |
| Dompet otomatis              | ZeroDev SDK          | Membuat dompet ERC-4337                |
| Penyimpanan keterangan tiket | IPFS lewat Pinata    | Nama event, tanggal, lokasi, gambar    |
| Pembayaran                   | Midtrans sandbox     | Simulasi pembayaran                    |
| Penyaring bot                | Cloudflare Turnstile | Membedakan manusia dan robot           |

---

## 6. Status Smart Contract Saat Ini

**Diperbarui 2 September 2026.** Rincian tugas: `TASKS.md` Fase B–D.

**`TicketContract.sol` — sebagian sudah ditulis, belum ada test.**

Sudah ada dan berfungsi: tujuh custom error, struct `EventInfo` /
`TicketCategory` / `TicketInfo` (dengan `originalPrice` dan `used`), mapping
`userIdentities` (hash KYC), `usedNonces` (anti pengulangan tanda tangan),
`walletPurchases`, `createEvent()` lengkap (validasi + emit), `addCategory()`
lengkap, `setSalesOpen()` (organizer atau owner), `setMarketplace()`,
`setSystemSigner()`.

Belum ada sama sekali: `mintTicket()`, `registerIdentity()` (menunggu K10),
gerbang EIP-712, penimpaan `_update` untuk pembatasan allowlist, penimpaan
`isApprovedForAll`, penukaran tiket — dan **belum ada satu pun test**
(`contracts/test/` kosong; menulis test adalah pekerjaan pertama berikutnya).

**`MarketplaceContract.sol` — belum dibuat.** Bentuknya menunggu keputusan
K2 (listing on-chain penuh, atau hanya `executeResale()` yang on-chain).

---

## 7. Keterbatasan yang Sudah Disadari

**Pengikatan identitas KTP bisa ditembus dalam kondisi tertentu.** Praktik
jastip dan calo sering sudah memegang data KTP pembeli **sebelum** perebutan
tiket dimulai. Dalam kondisi itu calo tetap bisa mendaftar memakai identitas
orang lain. Ini keterbatasan yang diketahui sejak awal, bukan kesalahan
pemrograman. Tulis apa adanya di dokumen teknis.

---

## 8. BATAS PERAN: Asisten Menjelaskan, Edward Menulis Kode

**Aturan ini tidak bisa ditawar dan berlaku di setiap sesi.**

Edward menulis **seluruh** kode proyek ini sendiri dari nol. Alasannya bukan
gaya-gayaan: ia harus bisa mempertanggungjawabkan setiap baris kode di depan
penguji sidang. Kode yang tinggal disalin tidak bisa dipertahankan saat
ditanya "kenapa barisnya begini?".

### Yang BOLEH dilakukan asisten

- Menjelaskan **konsep dan pola** ("untuk membatasi transfer, kamu perlu
  menimpa fungsi `_update`, dan di dalamnya cek apakah pemanggilnya
  marketplace")
- Menunjukkan **tanda tangan fungsi** (nama fungsi, jenis parameter, jenis
  kembalian) tanpa isi lengkapnya
- Menjelaskan **jebakan umum** ("kalau lupa menangani kasus cetak dan bakar
  di dalam `_update`, pencetakan tiket ikut terblokir")
- **Meninjau kode yang sudah Edward tulis** — cari celah keamanan, kesalahan
  logika, kasus yang belum ditangani
- Menjawab "kenapa ini tidak jalan" dengan **menunjuk penyebabnya**, bukan
  langsung menuliskan versi perbaikannya
- Memberi **potongan sangat pendek (1–3 baris)** hanya kalau itu satu-satunya
  cara menjelaskan sintaks, misalnya bentuk pemanggilan sebuah pustaka

### Yang TIDAK BOLEH dilakukan asisten

- Menulis fungsi utuh yang tinggal disalin-tempel
- Menulis seluruh isi sebuah berkas kode
- Langsung memperbaiki kode Edward tanpa diminta — **jelaskan dulu apa yang
  salah dan kenapa**, biar Edward yang memperbaiki
- Mengambil alih tugas hanya karena lebih cepat begitu

**Berlaku untuk kode spike juga** (ditegaskan 2 September 2026). Kode
percobaan tetap ditulis Edward; asisten hanya menjelaskan pola dan tanda
tangan fungsi. Kalau suatu saat mau dikecualikan, ubah paragraf ini secara
eksplisit.

### Cara menjawab yang benar

Kalau Edward bertanya "bagaimana cara membatasi transfer NFT?", jangan
langsung menulis kontraknya. Jawabannya harus berbentuk:

1. Konsepnya apa dan kenapa begitu
2. Fungsi mana yang perlu ditimpa, dengan tanda tangan fungsinya
3. Apa saja kasus yang wajib ditangani di dalamnya
4. Jebakan yang sering terjadi
5. Lalu **berhenti** — biarkan Edward menulis, tawarkan untuk meninjau
   hasilnya

---

## 9. Versi Pustaka Terkini dan Sumber Dokumentasi Resmi

**Diverifikasi: Agustus 2026.** Jangan memberi contoh sintaks dari ingatan
tanpa memeriksa bagian ini. Banyak tutorial lama sudah tidak jalan.

### 9.1 Tiga jebakan yang paling berbahaya untuk proyek ini

**Jebakan 1 — `_beforeTokenTransfer` sudah dihapus.**
OpenZeppelin versi 5 menghapus `_beforeTokenTransfer` dan
`_afterTokenTransfer`, diganti satu fungsi
`_update(address to, uint256 tokenId, address auth)`.
**Ini persis fungsi yang Edward butuhkan untuk pembatasan allowlist.** Semua
tutorial sebelum OpenZeppelin 5 akan gagal dikompilasi. Di dalam `_update`,
panggil `super._update(...)` yang mengembalikan pemilik sebelumnya (`from`),
lalu bedakan: `from == address(0)` berarti pencetakan, `to == address(0)`
berarti pembakaran — keduanya harus tetap diizinkan, hanya perpindahan biasa
yang dibatasi.

**Jebakan 2 — pengguna proyek ini memakai _smart account_, bukan EOA.**
Karena memakai ERC-4337, tanda tangan pengguna divalidasi lewat **ERC-1271**,
bukan tanda tangan EOA biasa. Akibatnya `ECDSA.recover` saja **tidak cukup**
kalau penanda tangannya adalah dompet pengguna. Untuk kasus itu gunakan
`SignatureChecker` dari OpenZeppelin, yang menangani keduanya. Kalau yang
menandatangani adalah kunci milik sistem (EOA backend), `ECDSA.recover` masih
benar. **Pastikan Edward sadar siapa yang menandatangani di setiap fungsi.**

**Jebakan 3 — fungsi bantu tanda tangan pindah tempat.**
Di OpenZeppelin versi 4, `toEthSignedMessageHash` ada di pustaka `ECDSA`. Di
versi 5 sudah **pindah ke `MessageHashUtils`**. Pola yang benar sekarang:
buat digest dengan `_hashTypedDataV4(structHash)` dari kontrak `EIP712`, lalu
pulihkan alamat penanda tangan dengan `ECDSA.recover(digest, signature)`.
`recover` membatalkan transaksi kalau tanda tangannya tidak sah; `tryRecover`
mengembalikan kode kesalahan tanpa membatalkan.

### 9.2 Tabel versi

| Alat                       | Versi                 | Cara pasang / catatan penting                                                                                                                                                                                                                                                                                            |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Foundry**                | 1.7.1                 | `curl -L https://foundry.paradigm.xyz \| bash` lalu `foundryup`. Sekarang `foundryup` memasang jalur **stabil** secara bawaan (dulu nightly). Paket npm-nya **sudah tidak diterbitkan**. Di Windows wajib Git Bash atau WSL. **Sudah terpasang** di lingkungan Edward                                                    |
| **Solidity**               | 0.8.36                | Versi bawaan EVM sudah berpindah (cancun → prague → osaka). **Wajib** menulis `evm_version` dan `solc_version` secara eksplisit di `foundry.toml`, jangan mengandalkan bawaan. `contracts/foundry.toml` **sudah** mengunci `solc_version = "0.8.36"` dan `evm_version = "prague"`                                        |
| **OpenZeppelin Contracts** | 5.7.0                 | `npm install @openzeppelin/contracts` atau `forge install OpenZeppelin/openzeppelin-contracts`. Pragma minimum sudah naik ke 0.8.24. _Remapping_ `@openzeppelin/contracts/` sudah dibuat otomatis oleh Foundry 1.7.x, tidak perlu `remappings.txt` manual. **Sudah terpasang** di `contracts/lib/openzeppelin-contracts` |
| **ZeroDev SDK**            | 5.5.10                | `npm i @zerodev/sdk @zerodev/passkey-validator viem`. Paket lama `@zerodevapp/sdk` dan `zerodev-sdk` **sudah usang**. `@zerodev/ecdsa-validator` hanya relevan bila penanda tangannya EOA — untuk dompet pengguna proyek ini yang dipakai `@zerodev/passkey-validator`. `toWebAuthnKey` mensyaratkan `passkeyServerUrl` dari dasbor ZeroDev; peran passkey server terhadap tabel `passkey_credentials` = keputusan K12                                                                                                                                                                                       |
| **EntryPoint (ERC-4337)**  | v0.7                  | Alamat resmi: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`, sama di Sepolia. Panggil lewat `getEntryPoint("0.7")`. Versi kernel `[PERLU VERIFIKASI]`: catatan lama menyebut `KERNEL_V3_1`, tutorial passkey resmi ZeroDev memakai `KERNEL_V3_3` — kunci setelah terbukti jalan di kode (percobaan lanjutan ≤ 10 Sep). Versi v0.8 sudah ada tapi belum jadi bawaan SDK — **untuk tugas akhir ini pakai v0.7**                                                                                           |
| **NestJS**                 | 11.x                  | `npm install -g @nestjs/cli@11` lalu `nest new nama-proyek`. Butuh Node.js 20 ke atas. Versi 11 memakai Express 5                                                                                                                                                                                                        |
| **TypeORM**                | 1.1.0                 | `npm install typeorm reflect-metadata`. **Versi 1.0 mengganti `Connection` menjadi `DataSource`** dan menghapus `createConnection`, `getConnection`, `getRepository`. Tutorial lama akan gagal                                                                                                                           |
| **mysql2**                 | 3.23.2                | `npm install mysql2`                                                                                                                                                                                                                                                                                                     |
| **Next.js**                | 16.2.x                | `npx create-next-app@latest`. App Router adalah bawaan. **`params` dan `searchParams` sekarang berupa Promise — wajib di-`await`.** Berkas `middleware.ts` berganti nama jadi `proxy.ts`                                                                                                                                 |
| **wagmi + viem**           | 2.x                   | `npm i wagmi viem @tanstack/react-query`. Versi 2 mengganti nama banyak hook: `usePrepareContractWrite` → `useSimulateContract`, `useContractWrite` → `useWriteContract`                                                                                                                                                 |
| **Pinata**                 | 2.5.6                 | Paketnya sekarang **cukup `pinata`** — `npm i pinata`. Paket lama `@pinata/sdk` dan `pinata-web3` sudah usang. Pemanggilan sekarang `pinata.upload.public.file(...)` dan jawabannya berisi `cid`, bukan `IpfsHash` seperti dulu                                                                                          |
| **Midtrans**               | midtrans-client 1.4.x | `npm install midtrans-client`. Sandbox: `new midtransClient.Snap({ isProduction: false, ... })`                                                                                                                                                                                                                          |
| **Cloudflare Turnstile**   | —                     | Verifikasi **wajib di sisi server** ke `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Token hanya berlaku 300 detik dan **sekali pakai**                                                                                                                                                                   |

### 9.3 Sumber dokumentasi resmi

| Alat         | Alamat                                       |
| ------------ | -------------------------------------------- |
| Foundry      | https://book.getfoundry.sh/                  |
| Solidity     | https://docs.soliditylang.org/               |
| OpenZeppelin | https://docs.openzeppelin.com/contracts/5.x/ |
| ZeroDev      | https://docs.zerodev.app/                    |
| Alchemy      | https://accountkit.alchemy.com/              |
| NestJS       | https://docs.nestjs.com/                     |
| TypeORM      | https://typeorm.io/                          |
| Next.js      | https://nextjs.org/docs                      |
| wagmi        | https://wagmi.sh/                            |
| viem         | https://viem.sh/                             |
| Pinata       | https://docs.pinata.cloud/                   |
| Midtrans     | https://docs.midtrans.com/                   |
| Turnstile    | https://developers.cloudflare.com/turnstile/ |

### 9.4 Aturan saat memberi contoh sintaks

1. **Periksa tabel 9.2 dulu.** Kalau contohnya memakai fungsi yang sudah
   dihapus, contohnya salah.
2. **Kalau ragu versi terpasang, minta Edward menjalankan pemeriksaan** —
   `npm list nama-paket`, `forge --version` — jangan menebak.
3. **Sebutkan versinya** saat memberi contoh: "di OpenZeppelin 5.x, polanya
   begini". Ini membantu Edward menyaring tutorial lama di internet.
4. **Kalau ada pertentangan** antara tabel ini dan tutorial yang Edward
   temukan, tabel ini lebih baru — tapi arahkan Edward memastikan ke
   dokumentasi resmi di 9.3.
5. Beberapa nomor versi belum terkonfirmasi penuh (khususnya `wagmi`, `viem`,
   dan `midtrans-client`). Untuk hal-hal itu **verifikasi dulu**, jangan
   menuliskannya ke buku tugas akhir tanpa dicek.

---

## 10. Cara Memakai Sub-Agent untuk Menghemat Konteks

### 10.1 Masalahnya

Setiap sesi punya "meja kerja" (_context window_) dengan luas terbatas.
Semua yang dibaca — isi berkas, hasil pencarian, daftar direktori — menumpuk
di meja itu. Kalau meja penuh dengan hasil pencarian, tidak ada ruang tersisa
untuk pekerjaan sesungguhnya, dan kualitas jawaban menurun.

### 10.2 Solusinya

**Sub-agent** adalah asisten pembantu dengan **meja kerjanya sendiri yang
terpisah**. Ia disuruh mencari sesuatu, mengaduk-aduk banyak berkas di
mejanya sendiri, lalu **hanya melaporkan kesimpulannya** ke meja utama.

| Tanpa sub-agent                                                                    | Dengan sub-agent                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| Baca berkas 1, 2, 3, cari, daftar isi direktori — **semua menumpuk di meja utama** | Semua kegiatan itu terjadi di meja sub-agent      |
| Meja utama penuh sebelum pekerjaan asli dimulai                                    | Meja utama hanya menerima satu kalimat kesimpulan |
| Sisa ruang sedikit untuk menulis dan meninjau                                      | Ruang tetap lega                                  |

### 10.3 Kapan asisten sebaiknya memakai sub-agent

Untuk tugas **mencari dan memeriksa** yang butuh membuka banyak berkas tapi
hasil akhirnya pendek:

- Mencari sesuatu di dalam proposal PDF ("bagian mana yang menyebut Soulbound
  Token?")
- **Pemeriksaan konsistensi seluruh folder `docs/`** — dulu Langkah 11 di
  `tasks.md` lama (kini digantikan `TASKS.md`; isi lama:
  `git show 075d78b:tasks.md`), dan paling cocok dikerjakan sub-agent karena
  harus membuka sepuluh berkas tapi hasilnya cuma daftar temuan
- Menelusuri kode yang sudah ada ("di mana kuota event diperiksa?")
- Memeriksa apakah sebuah sumber rujukan benar-benar ada dan sesuai
- Mencocokkan sebuah pola dengan dokumentasi resmi terbaru

### 10.4 Kapan JANGAN memakai sub-agent

- **Saat menulis atau meninjau kode** — butuh seluruh konteks percakapan, dan
  hasilnya panjang. Sub-agent justru merugikan
- **Tugas kecil** — membuka satu berkas yang sudah diketahui letaknya. Biaya
  memanggil sub-agent lebih mahal daripada manfaatnya
- **Saat butuh riwayat percakapan** — sub-agent tidak tahu apa yang sudah
  dibahas sebelumnya, ia hanya menerima perintah yang diberikan

### 10.5 Akibatnya bagi berkas ini

**Setiap sub-agent memuat ulang salinan `CLAUDE.md` ini di mejanya sendiri.**
Artinya semakin panjang berkas ini, semakin besar biayanya — dikalikan jumlah
sub-agent yang dipanggil.

Karena itu: **jaga berkas ini tetap fokus.** Kalau ada bagian yang tumbuh
terlalu panjang (misalnya catatan riset atau daftar bacaan), pindahkan ke
berkas terpisah di dalam `docs/` dan cukup rujuk dari sini, jangan disalin
utuh ke dalam berkas ini.

**Hal yang sama berlaku untuk MCP tools:** setiap alat tambahan yang
disambungkan ikut dimuat di **setiap** meja kerja, termasuk meja setiap
sub-agent. Menyambungkan banyak alat yang jarang dipakai membuat semua sesi
jadi lebih berat. Sambungkan hanya yang benar-benar dipakai rutin.

---

## 11. Status Implementasi Terkini

**Diperbarui terakhir: 2 September 2026**

Checklist kerja per fase: `TASKS.md` (root). Jadwal harian/mingguan:
`docs/kerja/panduan-pengerjaan.md`. Log tiga belas keputusan terbuka (K1–K13; K6 digabung ke K12):
`docs/kerja/keputusan.md`.

| Bagian                                              | Status                                                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/` 00–09 + `docs/modules/`                     | **Ada** (dipulihkan 2 Sep setelah sempat terhapus). Bagian status 01 dan 05 sudah disinkronkan; isi 01/03/04/05/07/09 menunggu revisi hasil K10                                                                     |
| `docs/kerja/`                                       | **Baru, 2 Sep**: keputusan.md, panduan-pengerjaan.md, catatan-konsultasi.md, alamat-kontrak.md, catatan-spike-passkey.md — berkas kerja, tidak masuk buku                                                           |
| ERD                                                 | **Dua versi bertentangan (K10):** `docs/04` lama (hash + salt + pepper) vs `design/erd-nft.mwb` 25 Agu + `kamus-data-bab4.docx` (`full_name` + `ktp_photo` + `nik_hash` + kata sandi). Belum final sampai K10 putus |
| `TicketContract.sol`                                | **Terisi sebagian** — lihat Bagian 6. **Belum ada test**                                                                                                                                                            |
| `MarketplaceContract.sol`                           | Belum ada — menunggu K2 (target 7 Sep)                                                                                                                                                                              |
| Test (`contracts/test/`)                            | **Kosong** — pekerjaan pertama berikutnya (mulai 3 Sep, tidak terblokir keputusan apa pun)                                                                                                                          |
| Backend NestJS / Frontend Next.js                   | Belum ada — mulai ±11 Sep / ±14 Sep sesuai panduan                                                                                                                                                                  |
| `spike/` registrasi passkey ZeroDev                 | **Dihapus 2 Sep** (hanya uji coba, tidak dirawat). **Terbukti:** registrasi passkey WebAuthn → `pubX`, `pubY`, `authenticatorId`, `authenticatorIdHash`. **Belum terbukti:** pembentukan alamat Kernel + UserOperation tersponsori Paymaster (bahan K7). Temuan + cara memulihkan kode: `docs/kerja/catatan-spike-passkey.md`                       |
| Toolchain                                           | Foundry di `~/.foundry/bin` (tidak otomatis di PATH sesi non-interaktif); OpenZeppelin 5.7.0; **dua** foundry.toml (root yang dipakai — jaga identik dengan `contracts/foundry.toml`)                               |
| Deploy Sepolia, akun Midtrans, akun Pinata, hosting | Belum. Akun Midtrans dan Pinata belum ada jejaknya; hosting = K11 (batas 10 Sep). Gas policy sudah **diaktifkan di dasbor ZeroDev** (2 Sep), tapi tetap tulis **belum terbukti** sampai ada 1 transaksi tersponsori yang berhasil (`TASKS.md` Fase D)                            |

**Temuan spike 2 September** (rinci di `docs/kerja/catatan-spike-passkey.md`):

- Pustaka ZeroDev memerlukan polyfill `Buffer` saat dijalankan di peramban
- `rpId` mengikat passkey ke satu domain. Passkey yang dibuat di `localhost`
  **TIDAK** berlaku di domain produksi — responden kuesioner harus mendaftar
  langsung di domain produksi, tidak bisa memakai akun uji coba
- API ZeroDev v3 memakai **SATU** URL untuk bundler sekaligus paymaster
- `.gitignore` yang dibuat dengan `>>` di PowerShell menghasilkan UTF-16 dan
  tidak terbaca Git. Pakai `Set-Content -Encoding utf8`

**Hambatan aktif:** tiga belas keputusan terbuka (K1–K13; K6 digabung ke
K12), terutama **K10
(skema KYC)** yang memblokir kontrak, backend, dan narasi keamanan Bab 4 —
target putus di konsultasi 7 September.

**Tenggat terdekat:** kuesioner **19 September** — lingkupnya hanya alur
pembelian; jual ulang dan penukaran tiket menyusul untuk uji fungsional
Oktober.

> Perbarui tabel ini setiap kali ada perubahan berarti. Sejak 7 Agustus 2026
> ini dilakukan otomatis oleh asisten setiap sesi pengerjaan kode/dokumen,
> atas permintaan Edward — lihat catatan di memori asisten.

---

## 12. Hal yang TIDAK Boleh Dilakukan Asisten

1. **Jangan** mengambil arsitektur dari proposal PDF tanpa memeriksa Bagian 3.
2. **Jangan** menyebut Soulbound Token, commit-reveal, flash sale, atau
   Chainlink VRF sebagai bagian aktif sistem. Boleh disebut hanya sebagai
   "sempat dipertimbangkan, tidak jadi dipakai".
3. **Jangan** menuliskan angka target kinerja yang belum diukur. Tandai
   `[BUTUH DATA UJI]`.
4. **Jangan** menganggap rancangan database final sebelum disetujui
   pembimbing, sekalipun berkasnya sudah lengkap.
5. **Jangan menulis kode utuh yang tinggal disalin** — lihat Bagian 8.
   Jelaskan polanya, biar Edward yang menulis.
6. **Jangan** memberi contoh sintaks dari ingatan tanpa memeriksa Bagian 9.
7. **Jangan** mengarang sumber rujukan. Semua rujukan akademik harus sudah
   ditelaah sejawat, terbit 2021 ke atas, dan bisa diverifikasi (kecuali
   sumber primer seperti whitepaper resmi).
   - Catatan: **Aldweesh (2023) bermasalah** — ada _Expression of Concern_
     aktif di PLoS ONE. Ganti dengan Feulner dkk. (2022).

8. **Jangan** menjadikan `docs/arsip/` sebagai acuan — isinya rancangan
   usang. (Per 2 September folder ini belum ada; buat saat mengarsipkan versi
   dokumen yang sudah digantikan, misalnya `docs/04` lama setelah K10 putus.)
