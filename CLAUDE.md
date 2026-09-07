# CLAUDE.md — Konteks dan Panduan Proyek Tugas Akhir Sistem Tiket Berbasis NFT

> **Untuk Asisten (Claude Code / Antigravity):** baca seluruh berkas ini sebelum menulis panduan, rencana, maupun meninjau kode dan dokumen teknis apa pun. Berkas ini adalah **doktrin dan ingatan utama proyek** yang diselaraskan secara ketat dengan dua berkas resmi di folder `dokumen/`.
>
> **Patokan Mutlak Proyek (Single Source of Truth):**
> 1. `dokumen/Proposal TA_160423176.pdf` (Versi revisi final, 20 Agustus 2026)
> 2. `dokumen/TA_Benedictus Leonardo Edward Stephen Sugianto_160423176.pdf` (Laporan Tugas Akhir Bab 1–3)
>
> Jangan mengusulkan arsitektur alternatif atau alur yang menyimpang dari kedua dokumen tersebut tanpa persetujuan eksplisit dari Edward.

---

## 0. Navigasi Berkas

| Bagian | Topik | Kapan Dibaca |
|---|---|---|
| **Bagian 1** | Identitas Proyek & Patokan Dokumen | Sekali di awal sesi |
| **Bagian 2** | Kamus Istilah Resmi | Sebelum membaca spesifikasi teknis |
| **Bagian 3** | Batasan Ruang Lingkup Resmi (Proposal Poin 1–11) | Wajib, sebelum merancang fitur |
| **Bagian 4** | Arsitektur Sistem & Alur Proses Lengkap | **Wajib**, setiap kali mengerjakan alur/kode |
| **Bagian 5** | Pemisahan Data On-Chain vs Off-Chain | Sebelum membuat skema DB atau Smart Contract |
| **Bagian 6** | Susunan Teknologi & Versi Pustaka | Sebelum memberi contoh sintaks teknis |
| **Bagian 7** | Status Kode & Kontrak Saat Ini | Sebelum memulai sesi pengerjaan |
| **Bagian 8** | Batas Peran: Asisten Menjelaskan, Edward Menulis Kode | **Wajib ditaati di setiap interaksi teknis** |
| **Bagian 9** | Pedoman Teknis & Tiga Jebakan Krusial | Sebelum implementasi kontrak/integrasi |
| **Bagian 10** | Rencana Pengerjaan & Jadwal Menuju Sidang | Rujukan sinkronisasi tugas harian |
| **Bagian 11** | Larangan Keras Bagi Asisten | Sebelum memberi saran apa pun |

---

## 1. Identitas Proyek & Patokan Dokumen

- **Judul:** Pembuatan Sistem Jual Beli Tiket Event Berbasis Non-Fungible Token
- **Penulis:** Benedictus Leonardo Edward Stephen Sugianto
- **Nomor Pokok Mahasiswa (NRP):** 160423176
- **Program Studi:** Teknik Informatika, Program Network & Cyber Security, Fakultas Teknik, Universitas Surabaya (2026)
- **Dosen Pembimbing:** Maya Hilda Lestari Louk dan Dr. Daniel Soesanto
- **Rumusan Masalah:** *Bagaimana meningkatkan keamanan proses dalam sistem jual beli tiket event bagi pengguna umum agar terhindar dari praktik pemalsuan tiket serta manipulasi harga di pasar sekunder?*
- **Tujuan:** *Membuat sistem jual beli tiket event berbasis Non-Fungible Token yang aman dari pemalsuan tiket dan manipulasi harga di pasar sekunder.*
- **Target Sidang:** Pertengahan November 2026 (LSTA 10 November, Sidang mulai 17 November 2026).
- **Kapasitas Kerja:** 4–5 jam per hari kerja (sambil magang), lebih longgar di akhir pekan. Konsultasi rutin pembimbing tiap Senin 09.00 WIB.

---

## 2. Kamus Istilah Resmi

### Istilah Blockchain & Kriptografi
- **Blockchain:** Buku besar terdistribusi yang terdesentralisasi, transparan, dan tidak dapat diubah secara sepihak (*immutable*).
- **Ethereum (Sepolia Testnet):** Lingkungan jaringan uji coba Ethereum yang digunakan dalam penelitian ini. Seluruh transaksi bernilai simulasi tanpa menggunakan mata uang riil.
- **Smart Contract:** Program terprogram yang berjalan di atas EVM (Ethereum Virtual Machine) yang mengeksekusi aturan bisnis tiket secara otomatis dan transparan.
- **NFT (Non-Fungible Token) / ERC-721:** Standar token kriptografi unik di Ethereum. Dalam sistem ini, **1 token NFT = 1 lembar tiket event**.
- **ERC-4337 (Account Abstraction):** Protokol abstraksi akun cerdas (*smart account*) yang memungkinkan pembuatan dompet berbasis kontrak tanpa pengguna harus mengelola *private key* atau *seed phrase* secara manual.
- **Paymaster:** Komponen ERC-4337 yang mensponsori biaya gas transaksi di blockchain. Dalam sistem ini, seluruh biaya gas ditanggung sistem dari komponen biaya administrasi yang dibayar pembeli via rupiah, mewujudkan interaksi bebas gas (*gasless*) bagi pengguna.
- **EIP-712:** Standar penandatanganan dan verifikasi data terstruktur bertipe (*typed structured data*) yang aman dari serangan *replay* dan terbaca jelas oleh manusia.
- **ECDSA (secp256k1):** Algoritma tanda tangan digital kurva eliptik yang digunakan untuk memverifikasi otorisasi transaksi dari backend tepercaya (*systemSigner*).
- **Passkey (WebAuthn / FIDO2):** Mekanisme autentikasi kriptografis biometrik/kunci perangkat keras pengguna berbasis kurva eliptik P-256 (secp256r1) di dalam Secure Enclave / TPM perangkat.
- **CREATE2:** Opcode Ethereum yang digunakan ZeroDev SDK untuk menurunkan alamat dompet smart account secara deterministik dari public key passkey sebelum kontrak dompet itu sendiri di-deploy.
- **IPFS & Pinata:** Jaringan penyimpanan terdesentralisasi (*InterPlanetary File System*) dan layanan *pinning* Pinata untuk menyimpan file metadata deskriptif tiket (gambar tiket, deskripsi, venue, tanggal/jam).

### Istilah Fungsional Sistem
- **`originalPrice`:** Harga beli resmi awal tiket yang dicatat permanen di dalam smart contract saat proses *minting*. Menjadi patokan mutlak harga jual kembali.
- **Allowlist-Restricted Transfer:** Pembatasan transfer token NFT pada level smart contract (`_update`), di mana NFT hanya diizinkan berpindah kepemilikan melalui kontrak marketplace resmi, mencegah penjualan liar P2P di luar platform.
- **Resale Price-Lock:** Mekanisme smart contract pasar sekunder yang memaksa harga jual kembali sama persis dengan `originalPrice` (`harga = originalPrice`), mematikan insentif calo dan spekulan tiket.
- **`markUsed`:** Fungsi smart contract yang dipanggil petugas di lokasi acara untuk mengubah status penggunaan tiket menjadi `used = true`, mencegah penggunaan tiket berulang (*anti-double entry*).
- **`userIdentities`:** Pemetaan (*mapping*) alamat dompet ke hash NIK KTP pengguna on-chain untuk mencegah kepemilikan multi-akun anonim.

---

## 3. Batasan Ruang Lingkup Resmi (Proposal Poin 1–11)

Sesuai naskah Bab 1 Proposal TA (halaman 5–7), batasan pengerjaan sistem dirinci ke dalam 11 poin mutlak:
1. **Aplikasi Berbasis Web:** Sistem dibangun sebagai aplikasi web responsif yang dapat diakses melalui peramban desktop maupun mobile.
2. **Kategori Event Terbatas:** Hanya menangani tiket event konser musik, pertandingan olahraga, festival musik, *stand-up comedy*, pameran berbayar, dan seminar/konferensi berbayar berkapasitas terbatas.
3. **Jaringan Pengujian:** Sepolia Testnet Ethereum sebagai lingkungan pengujian.
4. **Simulasi Pembayaran Fiat:** Pembayaran menggunakan Midtrans sandbox tanpa transaksi keuangan nyata.
5. **Tanpa Tiket Pihak Ketiga & Denah Dinamis:** Tidak mencakup integrasi sistem tiket pihak ketiga maupun tata kelola denah kursi (*seat map*) interaktif dinamis.
6. **Mitigasi Bot Cloudflare Turnstile:** Turnstile diterapkan pada proses pembelian tiket untuk menyaring otomatisasi bot pada level aplikasi.
7. **Verifikasi Identitas Email & KTP:** Identitas pengguna diverifikasi melalui verifikasi email dan KTP sebagai penanda identitas unik setiap individu.
8. **Cakupan Data On-Chain:** Disimpan permanen di blockchain meliputi: hash NIK pengguna, kepemilikan NFT tiket (`tokenId` dan `ownerOf`), harga beli awal permanen (`originalPrice`), status penggunaan tiket (`used`), jumlah pembelian per dompet per event (`purchaseCount` terhadap `maxPerWallet`), serta kuota dan status listing tiket pada pasar sekunder.
9. **Cakupan Metadata Tiket Off-Chain (IPFS Pinata):** Nama event, tanggal & waktu pelaksanaan, lokasi venue, kategori tiket, nama penyelenggara, dan file gambar tiket.
10. **Cakupan Data Operasional Off-Chain (MySQL):** Data pengguna, data penyelenggara acara, data admin, data event, kategori tiket, data verifikasi KYC, kredensial passkey, *cache* data tiket, riwayat pesanan, data listing resale, dan notifikasi.
11. **Pengujian Terbatas:** Uji fungsional 3 alur utama, uji keamanan (pembuktian kepemilikan pribadi, pengujian *allowlist restriction* transfer di luar platform, dan uji bypass *resale price-lock*), pengukuran gas per fungsi smart contract, waktu konfirmasi minting, serta evaluasi kemudahan penggunaan (*usability testing* kuesioner SUS).

---

## 4. Arsitektur Sistem & Alur Proses Lengkap

Arsitektur sistem terdiri dari **tiga komponen utama**:
1. **Frontend:** Aplikasi web berbasis Next.js dengan antarmuka modern, interaksi passkey WebAuthn, integrasi widget Turnstile, popup Midtrans Snap, dan koneksi dompet Web3 (Viem/Wagmi).
2. **Backend:** Layanan API berbasis NestJS (Node.js) yang mengelola logika bisnis off-chain, TypeORM ke database MySQL, relay transaksi bersponsor ERC-4337 (ZeroDev SDK / Alchemy RPC), orkestrasi signature EIP-712, verifikasi token Turnstile di sisi server, penanganan webhook Midtrans yang idempoten, dan unggah metadata ke Pinata IPFS.
3. **Dua Smart Contract di Sepolia Testnet:**
   - `TicketContract.sol`: Standar ERC-721 yang mengelola pencetakan tiket NFT, penguncian `originalPrice`, batas `maxPerWallet`, `userIdentities` hash NIK, gerbang otorisasi EIP-712/ECDSA, pembatasan transfer allowlist, dan fungsi `markUsed()`.
   - `MarketplaceContract.sol`: Pengelola pasar sekunder resmi yang membaca `originalPrice` dari `TicketContract`, memvalidasi listing, menerima trigger pembelian resale pasca-Midtrans, dan memfasilitasi transfer NFT antar dompet secara sah melalui jalur allowlist.

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (Next.js)                                |
|  - Katalog Event & Detail Kategori     - Registrasi / Login (Email + Passkey)    |
|  - Cloudflare Turnstile Bot Shield     - Midtrans Snap Payment Popup             |
|  - Dashboard Tiket Saya & QR E-Ticket  - Listing & Beli Resale Resmi             |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST
                                           v
+-----------------------------------------------------------------------------------+
|                                 BACKEND (NestJS)                                  |
|  - Auth & Passkey Credential Manager   - Turnstile Server Verifier (siteverify)   |
|  - KYC NIK Hasher                      - Midtrans Webhook Handler (Idempoten)     |
|  - EIP-712 Signature Generator         - Pinata IPFS Metadata Uploader            |
|  - ZeroDev SDK / ERC-4337 Relay        - TypeORM Data Access Layer                |
+---------------------+--------------------+--------------------+-------------------+
                      |                    |                    |
        SQL Queries   v      RPC / UserOp  v    Metadata Upload v
+-----------------------+ +--------------------+ +----------------------------------+
|      MySQL DB         | |  Sepolia Testnet   | |            IPFS (Pinata)         |
| - users & organizers  | |  ERC-4337 Paymaster| | - ticket image (PNG/JPG)         |
| - kyc_records         | |                    | | - ticket metadata JSON           |
| - passkey_credentials | | 1. TicketContract  | |   (name, venue, datetime, desc) |
| - events & categories | | 2. Marketplace-    | +----------------------------------+
| - orders & resale     | |    Contract        |
+-----------------------+ +--------------------+
```

---

### Alur Proses Resmi (Sesuai Gambar 1 Proposal Hal 12 & Penjelasan Hal 13–14)

```
                                  [ Mulai ]
                                      |
                                      v
                           /---------------------\
                          <   Sudah punya akun?   >
                           \---------------------/
                            /                   \
                   Tidak   /                     \  Ya
                          v                       v
               [ 1. Registrasi ]              [ 2. Login ]
               (Email, Passkey,                    |
                Verifikasi KYC)                    |
                          \                       /
                           -----> [ Menu Utama ] <
                                        |
                                        v
                            /-----------------------\
                           <   Ingin melakukan apa?  >
                            \-----------------------/
                             /                     \
             Beli Tiket     /                       \  Jual Tiket
             Reguler       /                         \ (Resale)
                          v                           v
              [ Beli Tiket Reguler ]        [ Jual Tiket (Resale) ]
                          |                           |
                          v                           v
              [ Pembayaran Midtrans ]       [ Kunci Harga NFT ]
                          |                 (harga = originalPrice)
                          v                           |
                /-------------------\                 v
               < Pembayaran berhasil?>      /-------------------\
                \-------------------/      <      Terjual?       >
                  /               \         \-------------------/
            Ya   /                 \ Tidak    /               \
                v                   v   Ya   /                 \ Tidak
         [ Minting NFT ]      [ Pembelian ] v                   v
         (ke wallet pembeli,    dibatalkan  [ NFT Ditransfer ]  [ NFT Tetap di ]
          metadata ke IPFS)         |       (ke wallet pembeli)  dompet penjual
                |                   |               |                   |
                +--------->---------+               +--------->---------+
                                    |                           |
                                    v                           v
                       [ Kirim Notifikasi Pengguna ] <----------+
                                    |
                                    v
                               [ Selesai ]
```

#### 1. Alur Registrasi & Autentikasi Pengguna
1. Pengguna memasukkan alamat email dan kata sandi. Sistem mengirimkan email verifikasi dan pengguna memverifikasi link tersebut.
2. Pengguna mendaftarkan biometrik/passkey (WebAuthn). ZeroDev SDK secara otomatis menghitung alamat dompet smart account yang deterministik menggunakan opcode `CREATE2` dengan *salt* yang diturunkan dari *public key* passkey.
3. **Pembangkitan Seed Phrase BIP-39 (Backup Signer):** Bersamaan dengan pendaftaran passkey pertama, sistem membangkitkan (*generate*) seed phrase BIP-39 (12 kata) dan menampilkannya **SEKALI** kepada pengguna untuk disimpan sendiri secara mandiri. Di sisi client/browser, dari seed phrase tersebut diturunkan (*derive*) sepasang kunci kriptografi (kurva secp256k1). Hanya *public key* / address hasil turunan tersebut yang dikirim ke sistem dan didaftarkan on-chain sebagai **validator/signer cadangan (backup validator)** pada smart account pengguna (berdampingan dengan passkey P-256 sebagai validator utama). Seed phrase maupun private key hasil turunannya **TIDAK PERNAH dikirim ke server atau disimpan di database dalam bentuk apa pun** demi menjamin prinsip keamanan *self-custody* mutlak.
4. Pengguna melakukan verifikasi KYC dengan mengunggah KTP. Sistem menghitung hash satu arah dari NIK (`bytes32`) dan **hanya menyimpan hash NIK tersebut secara on-chain** pada smart contract (`mapping(address => bytes32) userIdentities`). Data foto/KTP fisik tersimpan off-chain di database terlindungi.
5. Pengguna yang telah terdaftar dapat langsung masuk (*login*) ke Menu Utama.

#### 2. Alur Pembelian Tiket Reguler
1. Pengguna membuka katalog event di menu utama dan memilih kategori tiket reguler yang diinginkan.
2. Pengguna menyelesaikan tantangan interaksi Cloudflare Turnstile pada antarmuka.
3. Pengguna melakukan pembayaran melalui payment gateway Midtrans sandbox (menggunakan QRIS, Virtual Account, dsb.).
4. **Gasless via Paymaster:** Biaya transaksi blockchain (*gas fee*) disubsidi penuh oleh sistem sebagai Paymaster sesuai protokol ERC-4337. Biaya gas ini dibiayai dari komponen biaya administrasi yang dibayarkan pembeli saat pembayaran tiket.
5. Evaluasi status transaksi:
   - **Jika Pembayaran Berhasil:** Webhook Midtrans diverifikasi backend -> Transaksi minting NFT dieksekusi ke alamat smart account pembeli -> Smart contract mengunci `originalPrice` permanen, mencatat `tokenId`, dan menambahkan penghitung `walletPurchases` -> Metadata deskriptif tiket disimpan di IPFS Pinata -> Sistem mengirim notifikasi konfirmasi pembelian berhasil ke pengguna.
   - **Jika Pembayaran Gagal/Batal:** Pembelian dibatalkan, kuota reservasi dilepas kembali, dan sistem mengirimkan notifikasi kegagalan ke pengguna.

#### 3. Alur Penjualan Kembali Tiket (Resale Ticket / Secondary Market)
1. Pengguna membuka menu tiket miliknya dan memilih tiket aktif yang ingin dijual kembali.
2. **Resale Price-Lock:** Sistem secara otomatis mengunci harga jual kembali sama persis dengan harga pembelian awal (`harga = originalPrice`). Penjual tidak dapat menaikkan harga 1 rupiah pun (*zero-profit resale*).
3. **Allowlist-Restricted Transfer:** Tiket dilisting pada pasar sekunder resmi. Smart contract melarang perpindahan kepemilikan selain melalui kontrak marketplace resmi (`MarketplaceContract`), sehingga tiket mustahil dijual liar di luar platform / P2P.
4. Pembeli kedua yang berminat membeli tiket resale melakukan pembayaran via Midtrans sandbox (bukan transfer kripto manual).
5. **Struktur Biaya Administrasi & Subsidi Gas:** Penjual dan pembeli pada transaksi resale sama-sama terpotong saldonya / dikenakan biaya administrasi (*admin fee*). Biaya administrasi ini dialokasikan ke sistem sebagai pendanaan Paymaster untuk mensubsidi biaya gas (*gas fee*) transaksi perpindahan tiket di blockchain, sehingga pengguna tidak perlu memiliki aset kripto sama sekali.
6. Evaluasi status penjualan:
   - **Jika Terjual:** Smart contract mentransfer NFT tiket dari alamat penjual ke dompet pembeli baru via izin allowlist -> Dana hasil penjualan (setelah terpotong biaya admin) diteruskan ke saldo penjual -> Sistem mengirimkan notifikasi transaksi ke kedua pihak.
   - **Jika Tidak Terjual / Batal:** Tiket NFT tetap aman berada pada dompet penjual, listing ditutup, dan sistem mengirim notifikasi.

#### 4. Alur Pendukung — Verifikasi Tiket di Lokasi Acara (Venue Check-In)
1. Pengguna menunjukkan E-Ticket di web yang menyajikan QR code tiket kepada petugas pintu masuk venue.
2. **Pemeriksaan Identitas via Scan KTP:** Petugas venue memindai KTP fisik pengguna untuk membaca NIK secara langsung.
3. **Hashing & Pencocokan NIK:** Sistem menghitung hash dari NIK hasil scan tersebut menggunakan algoritma satu arah, kemudian mencocokkannya dengan data di database off-chain serta verifikasi kepemilikan tiket on-chain (`userIdentities[ownerOf(tokenId)] == nikHash`).
4. **Eksekusi Tiket Digunakan (`markUsed`):**
   - **Jika Cocok:** Verifikasi identitas dinyatakan berhasil, sistem melanjutkan ke langkah berikutnya dengan memanggil fungsi `markUsed(tokenId)` pada `TicketContract` untuk mengubah status tiket menjadi `used = true`. Tiket yang sudah bertanda `used` akan otomatis ditolak jika dipindai kembali (*anti-double entry*).
   - **Jika Tidak Cocok:** Verifikasi ditolak dan pengguna tidak diizinkan masuk ke lokasi acara.

#### 5. Alur Pemulihan Akun (Account Recovery — Lupa Password / Kehilangan Perangkat)
Mekanisme pemulihan jika pengguna kehilangan satu-satunya perangkat yang terdaftar atau lupa kredensial:
1. **Akses Halaman Recovery:** Di perangkat baru, pengguna memasukkan alamat email akun dan mengetik ulang 12 kata seed phrase BIP-39 pada halaman pemulihan khusus (*bukan halaman login biasa*).
2. **Penurunan Kunci di Sisi Klien:** Dari seed phrase yang diketik di sisi browser/klien, diturunkan kembali sepasang kunci kriptografi (kurva secp256k1) yang identik dengan saat registrasi awal.
3. **Penandatanganan Pesan Otorisasi (Sign Message):** Private key hasil turunan tersebut dipakai di browser untuk menandatangani pesan otorisasi (misalnya: *"daftarkan public key passkey baru ini sebagai validator pengganti"*). Yang dikirim ke server **hanya hasil tanda tangan digitalnya (*signature*)**, BUKAN seed phrase maupun private key.
4. **Verifikasi Kriptografis ECDSA On-Chain / Sistem:** Signature diproses melalui `ECDSA.recover(digest, signature)` yang menghasilkan alamat penanda tangan. Alamat ini dicocokkan dengan alamat validator cadangan yang telah didaftarkan on-chain sejak registrasi awal (Langkah 3 Alur 1). Jika cocok, proses lanjut; jika tidak cocok, ditolak.
   > **Catatan Kriptografi:** Private key dari seed phrase (kurva secp256k1) dan kunci dari passkey lama (kurva P-256) adalah dua sistem kriptografi berbeda yang tidak pernah bisa dicocokkan secara langsung. Yang diverifikasi adalah kepemilikan atas validator cadangan yang sudah terdaftar on-chain melalui pembuktian tanda tangan digital.
5. **Verifikasi Faktor Kedua (2FA Email Confirmation):** Setelah signature terverifikasi, sistem mengirim email verifikasi ke alamat email akun sebagai faktor kedua. Pengguna wajib mengklik tautan/tombol konfirmasi sebelum proses recovery dieksekusi di blockchain. Lapisan ini mencegah pengambilalihan akun seandainya seed phrase sempat tersalin atau terscreenshot secara tidak aman oleh pengguna awam.
6. **Pendaftaran Passkey Baru:** Setelah konfirmasi email disetujui, sistem mendaftarkan *public key* passkey baru sebagai validator utama pada smart account pengguna (menggantikan validator perangkat lama yang hilang). Pengguna berhasil memulihkan akses penuh ke akun dan tiket NFT miliknya di perangkat baru.


---

## 5. Pemisahan Data On-Chain vs Off-Chain

| Komponen Data | Lokasi Penyimpanan | Keterangan & Karakteristik |
|---|---|---|
| **Hash NIK Pengguna** | On-Chain (`TicketContract`) | `mapping(address => bytes32) userIdentities` — hasil hash NIK satu arah, mencegah satu identitas nyata mendaftar multi-wallet. |
| **Kepemilikan Tiket NFT** | On-Chain (`TicketContract`) | Standar ERC-721 (`tokenId => ownerOf`), abadi dan transparan di Sepolia Testnet. |
| **Harga Beli Awal (`originalPrice`)** | On-Chain (`TicketContract`) | Disimpan di struct `TicketInfo`, dikunci permanen saat minting, menjadi patokan harga resale. |
| **Status Pemakaian Tiket (`used`)** | On-Chain (`TicketContract`) | Boolean di struct `TicketInfo`, diubah melalui fungsi `markUsed()` saat verifikasi venue. |
| **Batas Pembelian per Wallet** | On-Chain (`TicketContract`) | `walletPurchases[eventId][wallet] <= maxPerWallet`. |
| **Status Listing & Kuota Resale** | On-Chain (`MarketplaceContract`) | Status aktif/tidaknya listing tiket di pasar sekunder resmi. |
| **Backup Validator Address** | On-Chain (Smart Account / Kernel) | Alamat validator cadangan hasil turunan seed phrase BIP-39 (secp256k1) untuk otorisasi recovery. |
| **Metadata Deskriptif Tiket** | Off-Chain (IPFS via Pinata) | File JSON (nama event, venue, tanggal/jam, kategori, gambar tiket) dirujuk via `tokenURI`. |
| **Data Akun & Profil Pengguna** | Off-Chain (MySQL) | Email, hash password, status verifikasi email, nama lengkap, role (buyer/organizer/admin). |
| **Data Kredensial Passkey** | Off-Chain (MySQL) | `credential_id`, `public_key` (`pub_x`, `pub_y`), counter untuk verifikasi WebAuthn. |
| **Data Verifikasi KYC Fisik** | Off-Chain (MySQL) | Foto KTP, status verifikasi KYC internal, audit trail off-chain. |
| **Data Master Event & Jadwal** | Off-Chain (MySQL) | Detail deskripsi lengkap, banner, nama promotor, denah informasi statis. |
| **Riwayat Transaksi & Order** | Off-Chain (MySQL) | Invoice Midtrans, snap token, status pembayaran gateway, ID transaksi, notifikasi. |
| **Seed Phrase & Private Key Recovery** | Client-Side Only (Milik Pengguna) | **DILARANG KERAS disimpan di server/database**. Hanya disimpan oleh pengguna dan diproses di browser saat recovery. |

---

## 6. Susunan Teknologi & Versi Pustaka Resmi

| Lapisan | Komponen | Versi / Pustaka Resmi | Dokumentasi Acuan |
|---|---|---|---|
| **Blockchain** | Jaringan & Standar | Ethereum Sepolia Testnet, ERC-721, ERC-4337 v0.7, EIP-712 | https://eips.ethereum.org |
| **Smart Contract** | Bahasa & Compiler | Solidity `0.8.36` (EVM target: `prague` di `foundry.toml`) | https://docs.soliditylang.org |
| **Toolchain Kontrak** | Testing & Deployment | Foundry `1.7.1` (Forge, Cast, Anvil) di `~/.foundry/bin` | https://book.getfoundry.sh |
| **Library Kontrak** | Token & Keamanan | OpenZeppelin Contracts `v5.7.0` | https://docs.openzeppelin.com |
| **Abstraksi Akun** | Dompet & Paymaster | ZeroDev SDK `v5.5.10` (`@zerodev/sdk`, `@zerodev/passkey-validator`), Kernel v3 | https://docs.zerodev.app |
| **Koneksi Node** | RPC Provider | Alchemy Ethereum Sepolia RPC | https://docs.alchemy.com |
| **Backend** | Kerangka Kerja | Node.js (>=20) + NestJS `v11.x` | https://docs.nestjs.com |
| **Database & ORM** | Basis Data Off-Chain | MySQL + TypeORM `v1.1.0` (pola `DataSource`) + `mysql2` | https://typeorm.io |
| **Gateway Pembayaran** | Simulasi Fiat | Midtrans SDK `midtrans-client 1.4.x` (Sandbox Snap API) | https://docs.midtrans.com |
| **Penyaring Bot** | CAPTCHA Aplikasi | Cloudflare Turnstile (Client widget + server verify `/siteverify`) | https://developers.cloudflare.com/turnstile |
| **Penyimpanan File** | IPFS Gateway | Pinata SDK (`npm i pinata`, versi `2.5.6`) | https://docs.pinata.cloud |
| **Frontend** | Kerangka Web | Next.js `16.2.x` (App Router) + TypeScript | https://nextjs.org/docs |
| **Web3 Client** | Interaksi Kontrak | Viem `v2.x` & Wagmi `v2.x` + TanStack React Query | https://viem.sh, https://wagmi.sh |

---

## 7. Status Kode Saat Ini (Per 7 September 2026)

- **`TicketContract.sol`:**
  - *Sudah terimplementasi:* Error custom, struct `EventInfo`, `TicketCategory`, `TicketInfo` (dengan `originalPrice` & `used`), mapping `userIdentities`, `usedNonces`, `walletPurchases`, fungsi `createEvent()`, `addCategory()`, `setSalesOpen()`, `setMarketplace()`, `setSystemSigner()`.
  - *Kompilasi:* Sukses tanpa error via Foundry (`forge build`, Solc 0.8.36, EVM prague).
  - *Tahap berikutnya:* Unit test Foundry di `contracts/test/TicketContract.t.sol`, implementasi fungsi `registerIdentity()` (hash NIK), gerbang EIP-712 pada `mintTicket()`, penimpaan `_update()` untuk pembatasan allowlist, dan fungsi `markUsed()`.
- **`MarketplaceContract.sol`:**
  - Belum dibuat. Akan mengimplementasikan fungsi listing resale, pengecekan `originalPrice` dari `TicketContract`, eksekusi transfer via allowlist, dan penerimaan status pembayaran dari backend.
- **Backend & Database:**
  - Persiapan scaffolding NestJS 11, entitas TypeORM (users, kyc_records, passkey_credentials, events, categories, orders), integrasi Midtrans, dan pipeline sponsorship ZeroDev.
- **Frontend:**
  - Persiapan Next.js 16 App Router, antarmuka katalog event, integrasi Passkey WebAuthn, modal Midtrans Snap, dan dashboard e-ticket.

---

## 8. BATAS PERAN: Asisten Menjelaskan, Edward Menulis Kode

**Prinsip ini wajib dijaga tanpa kompromi demi integritas sidang tugas akhir Edward:**
1. **Edward menulis seluruh kode proyek sendiri.** Edward harus memahami setiap baris kode agar mampu mempertanggungjawabkannya dengan lancar dan tegas di hadapan dosen penguji.
2. **Peran Asisten AI:**
   - Menjelaskan konsep arsitektur, pola desain (*design patterns*), dan alur logika.
   - Memberikan tanda tangan fungsi (*function signature*), tipe data parameter, dan nilai kembalian tanpa memberikan blok kode utuh yang tinggal salin-tempel.
   - Menunjukkan potensi celah keamanan (*reentrancy*, *front-running*, *replay attack*), jebakan pustaka, dan kasus batas (*edge cases*).
   - Meninjau kode yang telah ditulis Edward, memberikan evaluasi apakah kode sudah sesuai spesifikasi dokumen tugas akhir.
   - Memandu *debugging* dengan menunjukkan akar masalah dan cara menganalisisnya.
   - Potongan kode hanya diizinkan maksimal 1–3 baris jika menyangkut sintaks spesifik pustaka versi baru yang sulit dicari dokumentasinya.

---

## 9. Pedoman Teknis & Tiga Jebakan Krusial

1. **Jebakan 1 — Penimpaan Hook Transfer OpenZeppelin v5.x:**
   Fungsi `_beforeTokenTransfer` dan `_afterTokenTransfer` sudah dihapus di OZ v5. Seluruh logika pencegatan perpindahan token dipusatkan pada satu fungsi:
   ```solidity
   function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address)
   ```
   Di dalamnya, panggil `address from = super._update(to, tokenId, auth);`.
   - Jika `from == address(0)`: ini proses **minting** (harus diizinkan).
   - Jika `to == address(0)`: ini proses **burning** (harus diizinkan).
   - Jika perpindahan biasa: **hanya boleh dieksekusi jika `msg.sender == marketplaceAddress`** (pembatasan allowlist). Jika dipanggil dari pihak luar/transfer langsung P2P, transaksi wajib di-`revert`.

2. **Jebakan 2 — Validasi Tanda Tangan Smart Account (ERC-1271 vs ECDSA):**
   Dompet pengguna adalah *smart account* ERC-4337. Jika ada verifikasi tanda tangan dompet pengguna, jangan gunakan `ecrecover` polos, melainkan `SignatureChecker.isValidSignatureNow` (ERC-1271).
   Sedangkan untuk otorisasi backend (*mint approval* dari `systemSigner`), backend beroperasi sebagai EOA tepercaya sehingga pemulihan ECDSA standar (`ECDSA.recover`) adalah sah dan tepat.

3. **Jebakan 3 — Perubahan Pustaka EIP-712 / MessageHashUtils di OZ v5.x:**
   Fungsi pembantu tanda tangan telah dipindahkan dari `ECDSA` ke `MessageHashUtils`. Pola verifikasi otorisasi EIP-712:
   - Buat digest: `bytes32 digest = _hashTypedDataV4(structHash);`
   - Pulihkan signer: `address signer = ECDSA.recover(digest, signature);`
   - Pastikan `signer == systemSigner` dan *nonce* belum pernah dipakai (`usedNonces[nonce] == false`).

---

## 10. Rencana Pengerjaan Berdasarkan Metodologi Penelitian

Rencana kerja disusun mengikuti 6 tahap metodologi penelitian di Bab 1 & Proposal:
- **Tahap 1: Persiapan** (Tinjauan literatur, instalasi Foundry, pustaka OZ 5, akun sandbox Midtrans/Alchemy/Pinata) — *Selesai*.
- **Tahap 2: Analisis** (Wawancara war tiket, kuesioner 30 responden, analisis sistem sejenis) — *Selesai, terdokumentasi di Bab 2 & 3*.
- **Tahap 3: Desain** (Desain 2 smart contract, skema database MySQL, desain alur sistem 3 alur utama, antarmuka) — *Terdokumentasi di Bab 4*.
- **Tahap 4: Implementasi Bertahap (Urutan Prioritas Resmi):**
  1. *Smart Contract:* Penyelesaian `TicketContract.sol` + Unit Test Foundry, disusul `MarketplaceContract.sol` + Test.
  2. *Deploy Sepolia Testnet:* Deployment script, konfigurasi alamat antar-kontrak, uji transaksi bersponsor Paymaster.
  3. *Backend NestJS:* TypeORM entity, endpoint auth & passkey credentials, KYC hashing, webhook Midtrans idempoten, pipeline minting on-chain bersponsor, Turnstile siteverify, Pinata IPFS uploader.
  4. *Frontend Next.js:* UI antarmuka katalog event, integrasi Passkey WebAuthn, widget Turnstile, popup Midtrans Snap, dashboard e-ticket, dan panel check-in venue.
- **Tahap 5: Uji Coba & Evaluasi (Bab 6):**
  1. *Verifikasi Fungsional:* Uji 3 alur utama (registrasi, beli reguler, resale) dan venue check-in.
  2. *Verifikasi Keamanan:* Uji pembatasan transfer allowlist (transfer direct P2P gagal), uji pencegahan manipulasi harga resale (bypass resale price-lock gagal), uji pembuktian kepemilikan NFT pribadi on-chain.
  3. *Pengukuran Kinerja:* Pengukuran konsumsi gas per fungsi smart contract dan waktu konfirmasi minting.
  4. *Validasi Usability:* Pengujian langsung oleh subjek pengguna umum dan pengukuran tingkat kemudahan sistem via kuesioner SUS.
- **Tahap 6: Penyusunan Laporan Akhir:** Penuntasan penulisan Bab 4, Bab 5, Bab 6, hingga Bab 7.

---

## 11. Larangan Keras Bagi Asisten

1. **DILARANG** mengklaim bahwa Proposal TA kedaluwarsa atau menyimpang dari dokumen di folder `dokumen/`. Berkas `Proposal TA_160423176.pdf` dan `TA_Benedictus Leonardo Edward Stephen Sugianto_160423176.pdf` adalah doktrin acuan mutlak.
2. **DILARANG** memasukkan kembali konsep yang tidak ada di dokumen acuan (seperti *Soulbound Token*, *Commit-Reveal Scheme*, *Flash Sale war queue*, atau *Chainlink VRF*).
3. **DILARANG** menulis kode utuh jadi untuk Edward (ikuti aturan Bagian 8).
4. **DILARANG** mengubah harga jual kembali pada pasar sekunder. Harga resale **wajib dikunci sama persis dengan `originalPrice`**.
5. **DILARANG** memperbolehkan transfer tiket bebas antar dompet di luar kontrak marketplace resmi.
6. **DILARANG** mengabaikan protokol ERC-4337 (Paymaster gasless) yang membebankan gas fee kepada pengguna akhir.
