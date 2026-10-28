# Sistem Jual Beli Tiket Event Berbasis Non-Fungible Token (NFT)

> **Tugas Akhir Program Studi Teknik Informatika — Network & Cyber Security**  
> **Universitas Surabaya (UBAYA) 2026**  
> **Penulis:** Benedictus Leonardo Edward Stephen Sugianto (NRP: 160423176)  
> **Dosen Pembimbing:** Maya Hilda Lestari Louk, S.T., M.Sc. & Dr. Daniel Soesanto, S.T., M.M.  
> **Target Sidang:** November 2026  

---

## 1. Ringkasan Proyek & Arsitektur Sistem

Sistem ini memecahkan masalah **pemalsuan tiket** dan **manipulasi harga calo (scalping)** pada acara konser/event berkapasitas besar menggunakan teknologi blockchain Ethereum (Sepolia Testnet), standar token **ERC-721**, dan abstraksi akun **ERC-4337 (Account Abstraction)**.

### Karakteristik Utama Arsitektur (Web2.5):
1. **Passkey WebAuthn (NIST P-256):** Pengguna awam membuat smart account tanpa mengelola seed phrase atau private key manual.
2. **Gasless via Paymaster:** Biaya gas blockchain disubsidi sistem melalui komponen biaya administrasi rupiah Midtrans.
3. **Anti-Scalping (Resale Price-Lock):** Penjualan kembali tiket di pasar sekunder dikunci permanen setara harga beli resmi (`harga == originalPrice`).
4. **Allowlist-Restricted Transfer:** Token NFT dilarang dipindah-tangankan di luar kontrak marketplace resmi, mematikan praktik calo P2P liar.
5. **Dual-Scan Gate Verification:** Verifikasi pintu masuk venue memvalidasi Dynamic QR Code (countdown 60 detik berbasis WebAuthn) dan pencocokan KTP fisik menggunakan hash satu arah `keccak256(NIK)` sesuai UU Perlindungan Data Pribadi (UU PDP No. 27/2022).

---

## 2. Matriks Status Implementasi Fitur (Audit Codebase)

Keterangan:
- ✅ **Selesai (Production Ready):** Sudah terimplementasi, teruji, dan aktif di codebase.
- 🚧 **Parsial (In Progress):** Logika sebagian sudah ada, namun belum terintegrasi penuh antar-lapisan.
- ❌ **Belum Diimplementasi (Missing):** Belum ada kode atau baru berupa placeholder antarmuka.

| Modul & Fitur | Smart Contract | Backend (NestJS) | Frontend (Next.js) | Status Akhir | Catatan Audit Codebase |
|---|:---:|:---:|:---:|:---:|---|
| **1. Autentikasi & Akun** | | | | | |
| Registrasi Email & Password (bcrypt) | N/A | ✅ | ✅ | ✅ **Selesai** | Tersimpan di tabel `users` MySQL. |
| OTP Verifikasi Email (Mailtrap) | N/A | ✅ | ✅ | ✅ **Selesai** | Template 6 digit OTP via Nodemailer & Mailtrap. |
| Smart Account Passkey (WebAuthn P-256) | ✅ | ✅ | ✅ | ✅ **Selesai** | Penurunan alamat via ZeroDev CREATE2 (`customers`). |
| Backup Seed Phrase BIP-39 (12 Kata) | ❌ | ❌ | ❌ | ❌ **Belum** | Cadangan signer mandiri di client untuk pemulihan akun. |
| Pendaftaran KYC KTP (`kyc_records`) | ❌ | ❌ | ❌ | ❌ **Belum** | Tabel `kyc_records` & endpoint registrasi NIK belum dibuat. |
| Fungsi Identitas On-Chain (`registerIdentity`) | 🚧 | ❌ | ❌ | 🚧 **Parsial** | Mapping `userIdentities` ada; fungsi setter/getter baru dirancang. |
| **2. Master Event & Katalog** | | | | | |
| Pembuatan Event & Kategori On-Chain | ✅ | ✅ | ✅ | ✅ **Selesai** | `createEvent` & `addCategory` di Sepolia Testnet. |
| Portal Admin Penyelenggara Event | N/A | ✅ | ✅ | ✅ **Selesai** | Formulir `/dashboard/admin/events/new` + preview tiket. |
| Katalog Event & Detail Kategori | N/A | ✅ | ✅ | ✅ **Selesai** | Dinamis dari database MySQL (`/dashboard/buy`). |
| Upload Banner Tiket ke IPFS Pinata | ❌ | ❌ | ❌ | 🚧 **Parsial** | Saat ini file disimpan di folder lokal `uploads/`. |
| **3. Pembelian Tiket (Primary Market)** | | | | | |
| Gateway Pembayaran Midtrans Snap | N/A | ✅ | ✅ | ✅ **Selesai** | Sandbox Snap popup, status settlement webhook. |
| Minting NFT On-Chain via Relayer | ✅ | ✅ | ✅ | ✅ **Selesai** | `mintTicket` dengan EIP-712 digital signature. |
| Penguncian Harga Asli (`originalPrice`) | ✅ | ✅ | ✅ | ✅ **Selesai** | Tersimpan di struct `TicketInfo` smart contract. |
| Penegakan Batas Kuota (`maxPerWallet`) | ✅ | 🚧 | 🚧 | 🚧 **Parsial** | On-chain aktif; validasi di `createSnapTransaction` perlu dipasang. |
| Mitigasi Bot Cloudflare Turnstile | N/A | ❌ | ❌ | ❌ **Belum** | Widget client & endpoint `/siteverify` belum dipasang. |
| **4. E-Ticket & Sinkronisasi Cache** | | | | | |
| Dashboard Tiket Saya (`/dashboard/tickets`) | ✅ | ✅ | ✅ | ✅ **Selesai** | Menampilkan tiket on-chain Sepolia pengguna. |
| Dynamic QR Code Anti-Screenshot | N/A | N/A | ✅ | ✅ **Selesai** | Countdown timer 60s, CSPRNG nonce, P-256 signature. |
| Tabel Cache Tiket (`ticket_cache`) | N/A | ❌ | N/A | ❌ **Belum** | Tabel fondasional ERD untuk eliminasi loop RPC 50x. |
| **5. Verifikasi Gerbang Masuk (Venue Gate)** | | | | | |
| Kamera Scanner QR Code WebAuthn | N/A | N/A | ❌ | ❌ **Belum** | Halaman `/dashboard/verify` masih placeholder statis. |
| Dual-Scan: Validasi KTP `keccak256(NIK)` | ❌ | ❌ | ❌ | ❌ **Belum** | Form input/scan KTP dan sanitasi RAM instan belum ada. |
| Eksekusi On-Chain `markUsed(tokenId)` | ✅ | ✅ | ❌ | 🚧 **Parsial** | Endpoint backend `POST /api/tickets/redeem` siap; UI belum ada. |
| **6. Pasar Sekunder (Resale Market)** | | | | | |
| Kontrak `MarketplaceContract.sol` | ❌ | N/A | N/A | ❌ **Belum** | Smart contract resale sekunder belum dibuat. |
| Allowlist-Restricted Transfer (`_update`) | 🚧 | N/A | N/A | 🚧 **Parsial** | Logika override `_update` & `isApprovedForAll` siap pasang. |
| Resale Price-Lock (`harga == originalPrice`) | ❌ | ❌ | ❌ | ❌ **Belum** | Menu resale di navbar masih disabled ("Soon"). |
| Entitas `resale_listings` (Anti-Race Lock) | N/A | ❌ | N/A | ❌ **Belum** | Memerlukan relasi ke `ticket_cache` dan status `LOCKED`. |

---

## 3. Rencana Detail Implementasi 3 Fitur Kunci TA

Berdasarkan naskah resmi Bab 1–4 Tugas Akhir, diagram ERD resmi `design/erd-nft-revisi-24-8.png`, dan prinsip arsitektur perangkat lunak terdistribusi, berikut adalah spesifikasi teknis dan rencana implementasi mendalam:

```
+---------------------------------------------------------------------------------------------------+
|                            PETA JALUR IMPLEMENTASI 3 FITUR UTAMA TA                               |
+---------------------------------------------------------------------------------------------------+
| [Fitur 1: Pasar Sekunder Resmi]       [Fitur 2: Dual-Scan Venue Gate]     [Fitur 3: Anti-Bot Turnstile]   |
| 1. Hook _update & isApprovedForAll    1. Onboarding KYC NIK on-chain      1. Widget Client Turnstile      |
| 2. Entitas ticket_cache (Fondasi ERD) 2. Scanner Kamera (html5-qrcode)    2. Turnstile Server Verifier    |
| 3. Smart Contract MarketplaceContract 3. Parser JSON Dynamic QR & Expiry  3. Blokir Checkout Jika Bot     |
| 4. State Machine Resale (Anti-Race)   4. Hashing keccak256 di RAM         4. Single-use Token Expiry      |
| 5. Frontend Listing & Katalog Resale  5. Eksekusi On-Chain markUsed()                                     |
+---------------------------------------------------------------------------------------------------+
```

---

### FITUR 1: Pasar Sekunder Resmi & Anti-Scalping (Resale Ticket)

#### A. Landasan Dokumen & Tujuan
* **Dokumen Acuan:** Proposal Halaman 12–14 (Alur Utama #3) & Rumusan Masalah #2 (Pemberantasan Manipulasi Harga Calo).
* **Prinsip Utama:**
  1. **Resale Price-Lock Mutlak:** Penjual dilarang menentukan harga sendiri. Harga listing otomatis dikunci sama persis dengan harga beli awal tiket (`harga = originalPrice`). Penjual tidak dapat menaikkan harga 1 rupiah pun (*Zero-Profit Resale*).
  2. **Allowlist-Restricted Transfer:** Pemilik tiket dilarang mentransfer NFT secara langsung (P2P) antar-dompet di luar platform. Tiket hanya dapat berpindah tangan jika diproses oleh kontrak `MarketplaceContract.sol`.

#### B. Spesifikasi Smart Contract (`contracts/src/`)
1. **Penimpaan Hook `_update` pada `TicketContract.sol`:**
   ```solidity
   function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
       address from = super._update(to, tokenId, auth);
       // Izinkan minting (from == 0) dan burning (to == 0)
       if (from == address(0) || to == address(0)) {
           return from;
       }
       // Blokir seluruh transfer langsung antar-dompet pengguna
       // Perpindahan HANYA boleh dipicu oleh kontrak Marketplace resmi
       if (msg.sender != marketplaceAddress) {
           revert TransferNotAllowed();
       }
       return from;
   }
   ```
2. **Pola Bebas Transaksi Tambahan (*Zero-Approval Pattern* via `isApprovedForAll`):**
   * *Problem:* Di OpenZeppelin v5, `_checkAuthorized` akan menolak `transferFrom` jika penjual belum memanggil `approve()`.
   * *Solusi:* Override `isApprovedForAll` di `TicketContract.sol` agar `marketplaceAddress` otomatis menjadi *trusted operator*:
   ```solidity
   function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
       if (marketplaceAddress != address(0) && operator == marketplaceAddress) {
           return true; // Marketplace otomatis terotorisasi tanpa transaksi approve manual
       }
       return super.isApprovedForAll(owner, operator);
   }
   ```
3. **Pembuatan Kontrak `MarketplaceContract.sol`:**
   * **Struktur Data:**
     ```solidity
     struct Listing {
         uint256 tokenId;
         address seller;
         uint96 price; // Wajib dibaca langsung dari TicketContract.getTicket(tokenId).originalPrice
         bool active;
     }
     ```
   * **Fungsi Utama:**
     * `listTicket(uint256 tokenId)`: Memvalidasi pemanggil adalah pemilik sah, membaca `originalPrice` dari `TicketContract`, menyimpan data listing, dan mengunci status listing.
     * `cancelListing(uint256 tokenId)`: Membatalkan listing aktif (hanya oleh penjual).
     * `executeResale(uint256 tokenId, address buyer)`: Hanya dapat dipanggil oleh backend relayer tepercaya setelah pembayaran Midtrans pembeli baru berstatus `settlement`. Mentransfer tiket NFT dari penjual ke pembeli melalui pemanggilan fungsi transfer resmi.

#### C. Fondasi Basis Data Sesuai ERD Resmi (`ticket_cache` & `resale_listings`)
1. **Entitas `ticket_cache` (Wajib Dibuat Pertama):**
   * Sesuai diagram ERD `design/erd-nft-revisi-24-8.png`, tabel ini menjadi penghubung resmi antara pesanan awal dengan listing resale.
   * **Kolom:** `token_id` (PK, INT), `owner_wallet` (VARCHAR 42), `original_price` (DECIMAL 12,2), `used` (TINYINT), `synced_at` (DATETIME), `events_id` (INT), `orders_id` (CHAR 36).
   * **Keuntungan Teknis:** Mengeliminasi perulangan lambat 50x RPC ke Sepolia Testnet.
2. **Entitas `resale_listings` & Proteksi Concurrency:**
   * **Kolom:** `id` (CHAR 36), `seller_wallet` (CHAR 42), `locked_price` (DECIMAL 12,2), `status` (ENUM), `listed_at` (DATETIME), `ticket_cache_token_id` (INT 11, FK ke `ticket_cache`), `buyer_wallet` (CHAR 42), `admin_fee` (DECIMAL 12,2), `buyer_midtrans_transaction_id` (VARCHAR 100).
   * **State Machine Anti-Race Condition:**
     * `ACTIVE`: Tiket siap dibeli.
     * `LOCKED`: Kunci sementara 15 menit saat pembeli baru membuka modal kasir Midtrans Snap. Mencegah 2 pembeli membayar tiket yang sama secara bersamaan.
     * `SOLD`: Pembayaran sukses dan NFT berhasil berpindah tangan on-chain.
     * `CANCELLED`: Dibatalkan penjual atau kunci 15 menit kedaluwarsa.

#### D. Spesifikasi Frontend (`frontend/src/`)
* **Tombol Listing pada Kartu Tiket:** Di [TicketCard.tsx](file:///d:/STEVE/Project-TA-NFT-Marketplace/frontend/src/app/dashboard/tickets/TicketCard.tsx), tambahkan tombol "Jual Tiket Resmi".
* **Modal Konfirmasi Jual:** Menampilkan rincian bahwa harga jual terkunci otomatis pada `originalPrice` sesuai aturan anti-calo sistem.
* **Halaman Katalog Resale (`/dashboard/resale`):** Halaman publik/dashboard menampilkan tiket-tiket resale yang tersedia, dilengkapi tombol "Beli Tiket Resale" via Midtrans.

---

### FITUR 2: Verifikasi Gerbang Masuk Dual-Scan (Venue Gate Access Control)

#### A. Landasan Dokumen & Tujuan
* **Dokumen Acuan:** Proposal Halaman 14 (Alur Pendukung Verifikasi di Lokasi Acara) & Rekomendasi Dosen Pembimbing.
* **Prinsip Utama:**
  1. **Dual-Scan Verification:** Gerbang masuk venue memverifikasi **dua faktor otentikasi**:
     * **Scan 1 (Dynamic QR):** Membuktikan kepemilikan dompet kriptografis tanpa risiko screenshot (WebAuthn P-256 signature + expiry 60s).
     * **Scan 2 (KTP Fisik):** Membuktikan bahwa pemegang fisik tiket adalah orang yang sah terdaftar sesuai NIK.
  2. **Kepatuhan Privasi (UU PDP No. 27/2022):** NIK mentah 16 digit **dilarang keras disimpan di disk atau database**. NIK hanya diproses sesaat di memori kerja (RAM) untuk dihitung `keccak256(NIK)`, dicocokkan ke smart contract, lalu langsung dibuang seketika (*Instant Memory Sanitization*).

#### B. Pendaftaran KYC & Identitas On-Chain (`registerIdentity`)
* **Waktu Pendaftaran:** Dilakukan 1 kali saat pengguna mengaktifkan dompet atau melalui menu Profil/KYC.
* **Alur:**
  1. Pengguna memasukkan nama lengkap dan 16 digit NIK.
  2. Backend menghitung `nikHash = keccak256(toUtf8Bytes(nik))`.
  3. Backend menyimpan record ke tabel `kyc_records` (`nik_hash CHAR(66)`, tanpa menyimpan NIK mentah).
  4. Backend relayer memanggil fungsi smart contract:
     ```solidity
     function registerIdentity(address user, bytes32 nikHash) external onlyOwner
     ```
  5. Identitas resmi dompet terkunci permanen di smart contract pada `mapping(address => bytes32) userIdentities`.

#### C. Alur Verifikasi Venue Check-In (Step-by-Step)
```
[ Penonton Menunjukkan HP ]               [ Staf Venue Memindai ]
           |                                         |
           v                                         v
   +---------------+                         +----------------+
   |  Dynamic QR   |  ==== Scan 1 ====>      | Kamera Scanner |
   | (WebAuthn QR) |                         | (html5-qrcode) |
   +---------------+                         +----------------+
                                                     |
                                                     v
                                      +-------------------------------+
                                      | Validasi JSON & Expiry (<60s) |
                                      +-------------------------------+
                                                     |
[ Penonton Tunjukkan KTP Fisik ]                     v
           |                          +-------------------------------+
           +========== Scan 2 ======> | Input/Scan NIK 16 Digit       |
                                      +-------------------------------+
                                                     |
                                                     v
                                      +-------------------------------+
                                      | Hitung keccak256(NIK) di RAM  |
                                      | (NIK Mentah Langsung Dibuang) |
                                      +-------------------------------+
                                                     |
                                                     v
                                      +-------------------------------+
                                      | Cek On-Chain Sepolia:         |
                                      | userIdentities == nikHash ?   |
                                      +-------------------------------+
                                            /                  \
                                     Cocok /                    \ Tidak Cocok
                                          v                      v
                             +------------------------+  +-------------------+
                             | markUsed(tokenId) Tx   |  | Akses Ditolak!    |
                             | Lampu Hijau: Lolos     |  | Lampu Merah Gagal |
                             +------------------------+  +-------------------+
```

#### D. Spesifikasi Frontend (`frontend/src/app/dashboard/verify/page.tsx`)
* **Komponen Pemindai Kamera:** Menggunakan library `html5-qrcode` yang terhubung ke webcam/kamera smartphone staf venue.
* **Indikator Visual:**
  * **HIJAU BESAR (ACCESS GRANTED):** Tampil nama kategori tiket, nomor kursi, dan txHash Etherscan `markUsed`.
  * **MERAH BESAR (ACCESS DENIED):** Tiket sudah pernah dipakai (*TicketAlreadyUsed*), QR kedaluwarsa, atau NIK tidak sesuai.

---

### FITUR 3: Mitigasi Bot Calo (Cloudflare Turnstile)

#### A. Landasan Dokumen & Tujuan
* **Dokumen Acuan:** Proposal Halaman 6 (Batasan Ruang Lingkup Resmi Poin #6).
* **Prinsip Utama:** Menangkis skrip otomatisasi bot calo saat proses pemesanan tiket tanpa menyulitkan manusia awam (CAPTCHA non-intrusif berbasis tantangan terenkripsi Cloudflare).

#### B. Spesifikasi Frontend & Backend
1. **Frontend ([BuyTicketCard.tsx](file:///d:/STEVE/Project-TA-NFT-Marketplace/frontend/src/app/dashboard/buy/BuyTicketCard.tsx)):**
   * Script Cloudflare: `https://challenges.cloudflare.com/turnstile/v0/api.js`.
   * Tombol "Beli Tiket Sekarang" `disabled` sampai token `cf-turnstile-response` berhasil diterbitkan.
2. **Backend Relayer ([tickets.service.ts](file:///d:/STEVE/Project-TA-NFT-Marketplace/backend/src/tickets/tickets.service.ts)):**
   * Verifikasi token ke endpoint resmi Cloudflare sebelum menyimpan order:
     ```typescript
     const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: new URLSearchParams({
         secret: process.env.TURNSTILE_SECRET_KEY,
         response: dto.turnstileToken,
       }),
     });
     ```
   * Token Cloudflare hanya valid selama 300 detik (5 menit) dan berstatus *single-use*.

---

## 4. Matriks Pengujian Unit Foundry (`contracts/test/`)

Sesuai Batasan Proposal Poin #11, perubahan smart contract wajib lulus pengujian unit Foundry dengan skenario berikut:

| No | Nama Unit Test | Tujuan Pengujian & Asersi | Status |
|:---:|---|---|:---:|
| 1 | `test_TransferFrom_RevertIfNotMarketplace()` | Membuktikan transfer langsung via MetaMask/wallet P2P di luar marketplace resmi otomatis melempar `TransferNotAllowed()`. | 🚧 Baru |
| 2 | `test_TransferFrom_SuccessIfMarketplace()` | Membuktikan transfer via alamat `marketplaceAddress` sukses berpindah tangan tanpa revert. | 🚧 Baru |
| 3 | `test_isApprovedForAll_Marketplace()` | Membuktikan bahwa `isApprovedForAll(owner, marketplaceAddress)` otomatis mengembalikan nilai `true`. | 🚧 Baru |
| 4 | `test_RegisterIdentity_Success()` | Membuktikan owner/relayer dapat mendaftarkan `nikHash` dan terbaca via `getUserIdentity`. | 🚧 Baru |
| 5 | `test_RegisterIdentity_RevertIfNotOwner()` | Membuktikan akun selain owner ditolak saat mencoba mendaftarkan identitas pengguna (`OwnableUnauthorizedAccount`). | 🚧 Baru |
| 6 | `test_ResalePriceLock_CannotMarkup()` | Membuktikan kontrak marketplace mengunci harga listing sama persis dengan `originalPrice` dari `TicketContract`. | 🚧 Baru |

---

## 5. Prosedur & Blast Radius Re-deployment Sepolia

Ketika smart contract [TicketContract.sol](file:///d:/STEVE/Project-TA-NFT-Marketplace/contracts/src/TicketContract.sol) di-deploy ulang, lakukan sinkronisasi serentak pada 4 berkas berikut untuk mencegah *runtime crash*:

```bash
# 1. Kompilasi & Pengujian Unit Kontrak
cd contracts
forge build
forge test

# 2. Deploy Kontrak Baru ke Sepolia
cd ../backend
npm run db:deploy-contract

# 3. Checklist Sinkronisasi Alamat Kontrak Baru:
# - backend/.env                  -> TICKET_CONTRACT_ADDRESS=<ALAMAT_BARU>
# - contracts/.env                -> TICKET_CONTRACT_ADDRESS=<ALAMAT_BARU>
# - frontend/.env.local           -> NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS=<ALAMAT_BARU>

# 4. Sinkronisasi Data Event & Kategori ke Kontrak Baru
npm run db:sync-onchain
```

---

## 6. Cara Menjalankan Proyek di Lingkungan Lokal

### Prasyarat
- Node.js >= 20.x
- MySQL Server (Port 3306)
- Foundry Toolkit (`forge`, `cast`, `anvil`)
- Akun Midtrans Sandbox & Mailtrap

### 1. Menjalankan Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
Backend berjalan di: `http://localhost:3001`

### 2. Menjalankan Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:3000`

---

## 7. Alamat Kontrak Sepolia Aktif

- **TicketContract.sol:** `0x08F9F8e90570A08851ca60419ae656FEF227c8a4`  
- **Jaringan:** Ethereum Sepolia Testnet (Chain ID: 11155111)  
- **Etherscan Explorer:** [Sepolia Contract Link](https://sepolia.etherscan.io/address/0x08F9F8e90570A08851ca60419ae656FEF227c8a4)
