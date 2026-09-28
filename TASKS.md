# TASKS.md — Rencana Pengerjaan dan Peta Kerja Menuju Sidang Tugas Akhir

> **Dokumen Patokan Mutlak:**
> 1. `dokumen/Proposal TA_160423176.pdf` (20 Agustus 2026)
> 2. `dokumen/TA_Benedictus Leonardo Edward Stephen Sugianto_160423176.pdf` (Bab 1–3)
> 3. Catatan Rekomendasi Dosen Pembimbing:
>    - *Dual-Scan Verification*: Scan 1 = Dynamic QR (layar HP); Scan 2 = KTP Fisik dicocokkan dengan `keccak256(NIK)` (NIK mentah tidak pernah disimpan permanen, UU PDP No. 27/2022).
>    - *Seat Selection*: Sequential Auto-Assignment per kategori (`VIP-01`, `VIP-02`), tanpa interaktif SVG seat map (Batasan Proposal #5).
>    - *Ticket Banner Image*: Banner dinamis (1200x500px, 16:9) dengan *dark gradient overlay* agar teks tetap kontras.
>    - *Batas Tiket Dinamis*: Penyelenggara/Organizer dapat menentukan sendiri `max_per_wallet` per event.
>
> **Aturan Pengerjaan:**
> - Tugas disusun mengikuti **6 Tahap Metodologi Penelitian** resmi dari Bab 1 Tugas Akhir.
> - Suatu kotak tugas hanya boleh dicentang (`[x]`) jika **bukti selesai** sudah terpenuhi secara nyata (kode teruji, transaksi on-chain terverifikasi, atau dokumen selesai).
> - Seluruh kode ditulis sendiri oleh Edward (Steve) mengacu pada panduan di [CLAUDE.md](file:///d:/STEVE/Project%20NFT%20Marketplace/CLAUDE.md).

---

## Ringkasan Progres Utama

| Fase | Deskripsi | Target Selesai | Status |
|---|---|---|---|
| **Tahap 1–2** | Persiapan & Analisis Sistem (Bab 1, 2, 3) | Selesai | [x] **Selesai** (Naskah Bab 1–3 di dokumen TA) |
| **Tahap 3** | Desain Sistem & Arsitektur (Bab 4) | 10 September 2026 | [x] **Selesai** (ERD, BPMN, Sequence Diagram, Skema TypeORM) |
| **Tahap 4A** | Smart Contract: `TicketContract.sol` & Test | 11 September 2026 | [x] **Selesai** (Foundry 25 Unit Tests Passed 100%, Gas Snapshot Selesai) |
| **Tahap 4B** | Smart Contract: `MarketplaceContract.sol` (Resale) | Oktober 2026 | [ ] Direncanakan setelah Customer & Gate Flow tuntas |
| **Tahap 4C** | Deploy Sepolia & Validasi On-Chain | 15 September 2026 | [x] **Selesai** (Kontrak `0x4A6e85...` aktif, Event 1 Kategori 1–3 terverifikasi) |
| **Tahap 4D** | Backend NestJS 12 Relayer & Data Dinamis | 25 September 2026 | [x] **90% Selesai** (Auth, Events API, Seeder, Mint Relayer selesai; sync-onchain in progress) |
| **Tahap 4E** | Frontend Next.js (Passkey, Buy Ticket, Dynamic QR) | 28 September 2026 | [x] **85% Selesai** (Customer-side siap; finishing Event Selector & Gate Verify) |
| **Tahap 5** | Uji Coba & Evaluasi Usability SUS (Bab 6) | 10 Oktober 2026 | [ ] Menunggu Tahap 4 Tuntas |
| **Tahap 6** | Penyusunan Laporan Akhir (Bab 4, 5, 6, 7) | 17–24 Oktober 2026 | [ ] Menuju LSTA 10 Nov & Sidang 17 Nov |

---

## Tahap 3 — Desain Sistem & Arsitektur (Bab 4)

- [x] **Arsitektur Sistem 3 Komponen:** Frontend Next.js, Backend NestJS, dan Smart Contract di Sepolia Testnet (Proposal Hal 11).
- [x] **Desain 3 Alur Proses Utama:** Registrasi Passkey/KYC, Pembelian Tiket Reguler, dan Jual Kembali Resale (Gambar 1 Proposal Hal 12).
- [x] **Desain Alur Verifikasi Dual-Scan di Venue:** Validasi Dynamic QR (Scan 1) dan KTP fisik `keccak256(NIK)` (Scan 2) dengan pemanggilan `markUsed()`.
- [x] **Finalisasi Skema Database MySQL & Entitas TypeORM:**
  - Tabel yang sudah aktif & tersinkronisasi:
    - `users` (id, name, email, password bcrypt, timestamps)
    - `passkey_credentials` (id, credential_id, pub_x, pub_y, counter, users_id)
    - `organizers` (id, organization_name, status, created_at, users_id)
    - `events` (id, on_chain_event_id, event_name, start_date, venue_location, category, capacity, image_ipfs_cid, max_per_wallet, organizers_id)
    - `ticket_categories` (id CHAR 36, name, price, quota, events_id dengan CASCADE DELETE)
  - **Bukti Selesai:** Entitas TypeORM ([`event.entity.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/entities/event.entity.ts) & [`ticket-category.entity.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/entities/ticket-category.entity.ts)) tersinkronisasi otomatis ke MySQL `nft-marketplace`.
- [x] **Dokumen Kajian Arsitektur & Teori ORM:**
  - Dokumen resmi di [`explanation/18-orm-typeorm-architecture-and-multi-event-vs-factory.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/18-orm-typeorm-architecture-and-multi-event-vs-factory.md) memuat justifikasi Multi-Tenant vs Factory Pattern (hemat gas 98%), fungsi `on_chain_event_id`, dan Data Mapper Pattern.

---

## Tahap 4 — Implementasi Sistem Bertahap

### 4A. Smart Contract: `TicketContract.sol` Selesai dan Teruji
*Status:* Kontrak utama selesai, lulus pengujian Foundry 100%, dan ter-deploy di Sepolia.

- [x] **Suite Pengujian Unit Foundry:**
  - 25 tests passed di `contracts/test/TicketContract.t.sol` menguji `createEvent`, `addCategory`, `setSalesOpen`, `setMarketplace`, `setSystemSigner`.
- [x] **Pencetakan Tiket (`mintTicket`) dengan Penguncian `originalPrice`:**
  - Validasi guard clauses: event aktif, `salesOpen`, kuota tersedia (`minted < quota`), batas pembelian per akun (`walletPurchases <= maxPerWallet`).
  - Struct `TicketInfo` mengunci parameter `originalPrice = price`, `used = false` secara on-chain sebagai fondasi anti-scalping.
  - Eksekusi `_safeMint(to, tokenId)` dan emisi event `TicketMinted`.
- [x] **Fungsi Verifikasi Penggunaan Tiket (`markUsed`):**
  - Mengubah status tiket menjadi `used = true` di blockchain.
  - Revert jika tiket sudah terpakai (*Anti-Double-Spend*) atau event belum dimulai.
- [x] **Snapshot Gas Smart Contract:**
  - Eksekusi `forge snapshot` selesai, menghasilkan file `.gas-snapshot` sebagai data empiris konsumsi gas untuk Bab 6.

---

### 4B. Smart Contract: `MarketplaceContract.sol` (Pasar Sekunder Resmi)
*Status:* Dijadwalkan setelah seluruh alur Customer & Gate Verification tuntas.

- [ ] **Rancang Kontrak Pasar Sekunder (`MarketplaceContract.sol`):**
  - Struct listing resale: `tokenId`, `seller`, `price`, `active`.
  - Penegakan **Resale Price-Lock**: Harga listing wajib dibaca langsung dari `TicketContract.getOriginalPrice(tokenId)` sehingga calo tidak dapat me-markup harga.
- [ ] **Fungsi Eksekusi Resale (`executeResale`):**
  - Transfer hak milik NFT dari penjual ke pembeli baru setelah verifikasi pembayaran.

---

### 4C. Deployment ke Sepolia Testnet & Verifikasi On-Chain
*Status:* Kontrak resmi aktif di Sepolia.

- [x] **Deployment `TicketContract.sol` di Sepolia Testnet:**
  - **Alamat Kontrak:** `0x4A6e85fACA6df9eb2dB5BA832B4B48790D60F9b3`
  - **Deployer / Admin Relayer:** `0x8C2CF82F28567478eE12d2fDE1bF6E7304D1e0DA`
- [x] **Pendaftaran Event 1 & Kategori di Sepolia:**
  - Event 1: *UBAYA Music Fest 2026* (`exists = true`, `salesOpen = true`)
  - Kategori 1: VIP (Harga 150.000, Kuota 50)
  - Kategori 2: CAT 1 TRIBUN (Harga 100.000, Kuota 100)
  - Kategori 3: FESTIVAL (Harga 75.000, Kuota 150)
- [x] **Sinkronisasi On-Chain Otomatis untuk Event 2 & 3:**
  - Eksekusi skrip [`backend/src/database/seeds/sync-onchain.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/database/seeds/sync-onchain.ts) berhasil mendaftarkan Event 2 (*Rock in Indonesia*, Blok #11794929, Kategori 4 & 5) dan Event 3 (*Art & Tech Expo*, Blok #11794933, Kategori 6) ke smart contract Sepolia.

---

### 4D. Backend NestJS 12 & Integrasi Relayer

- [x] **Inisialisasi NestJS 12 & TypeORM:**
  - Konfigurasi koneksi MySQL async dengan `ConfigService` (`synchronize: true` pada development).
- [x] **Modul Autentikasi Hibrida & Session:**
  - Registrasi & Login akun dengan hashing password `bcryptjs` (salt round 10).
  - Registrasi Passkey WebAuthn (NIST P-256) dan penyimpanan `credential_id`, `pub_x`, `pub_y`.
  - Penurunan alamat counterfactual wallet deterministik (`CREATE2`).
  - Pembuatan JWT Session Cookie (`userId`, `name`, `walletAddress`) yang tahan refresh.
- [x] **Modul Events & Kategori (REST API Backend):**
  - [`backend/src/events/events.module.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/events.module.ts)
  - [`backend/src/events/events.service.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/events.service.ts)
  - [`backend/src/events/events.controller.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/events.controller.ts)
  - Endpoint `GET /api/events`: Mengembalikan array seluruh event aktif beserta relasi `ticketCategories`.
  - Endpoint `GET /api/events/:id`: Mengambil detail 1 event spesifik (ParseIntPipe validasi).
- [x] **Database Seeder Otomatis (`npm run db:seed`):**
  - [`backend/src/database/seeds/seed.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/database/seeds/seed.ts)
  - Memasukkan data akun admin organizer (password dari `ORGANIZER_SEED_PASSWORD`), data 3 event, dan 6 kategori tiket secara idempoten (`ON DUPLICATE KEY UPDATE`).
- [x] **Pipeline Relayer Minting Tiket On-Chain:**
  - [`backend/src/tickets/tickets.service.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/tickets/tickets.service.ts): Relayer Viem mengeksekusi `mintTicket` dengan biaya gas ditanggung dompet admin backend.
  - [`backend/src/tickets/tickets.controller.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/tickets/tickets.controller.ts): Endpoint `POST /api/tickets/mint` dan `GET /api/tickets/my-tickets/:walletAddress`.
  - Validasi DTO: [`backend/src/tickets/dto/mint-ticket.dto.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/tickets/dto/mint-ticket.dto.ts).
- [x] **Kolom Batas Tiket Dinamis (`max_per_wallet`):**
  - Ditambahkan `@Column({ name: 'max_per_wallet', default: 2 })` di [`event.entity.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/events/entities/event.entity.ts).
- [x] **Skrip Sinkronisasi On-Chain (`sync-onchain.ts` / `npm run db:sync-onchain`):**
  - Skrip [`backend/src/database/seeds/sync-onchain.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/database/seeds/sync-onchain.ts) sukses mengeksekusi pendaftaran multi-event dan seluruh kategori ke blockchain Sepolia.

---

### 4E. Frontend Next.js & Antarmuka Pengguna

- [x] **Inisialisasi Antarmuka Modern & Responsif:**
  - Next.js 16 App Router, Tailwind CSS, tema modern dark/purple aesthetic, glassmorphism.
- [x] **Autentikasi & Navbar Layout:**
  - Formulir pendaftaran & login email + Passkey biometrik.
  - Navbar responsif menampilkan status login, nama pengguna, pemotongan alamat dompet (`formatAddress`), dan tombol logout.
- [x] **Halaman Pembelian Tiket Dinamis (`/dashboard/buy`):**
  - Terhubung langsung ke Backend REST API via Server Component [`page.tsx`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/dashboard/buy/page.tsx).
  - Banner poster konser dinamis dari `image_ipfs_cid` dengan efek *dark gradient overlay* (rekomendasi dosen pembimbing).
  - Format jadwal tanggal Indonesia (WIB) dan nama venue lokasi konser.
  - Pilihan kategori tiket dinamis dari database (`activeCategories`) yang sinkron dengan smart contract Sepolia.
  - Estimasi alokasi nomor kursi otomatis (*Sequential Auto-Assignment*: `VIP-01`, `VIP-02`) sesuai Batasan Proposal #5.
  - Server Action [`buy/actions.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/dashboard/buy/actions.ts) memanggil relayer dan merender resi sukses + tautan Sepolia Etherscan.
- [x] **Fitur Event Selector di Halaman Beli (`/dashboard/buy`):**
  - Mengintegrasikan tab selector interaktif multi-event pada [`BuyTicketCard.tsx`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/dashboard/buy/BuyTicketCard.tsx) untuk memilih Event 1 (*UBAYA Music Fest*), Event 2 (*Rock in Indonesia*), atau Event 3 (*Art & Tech Expo*).
  - Menggunakan batas kuota dinamis `event.maxPerWallet` dari database MySQL dan mengisolasi penghitungan kepemilikan tiket spesifik per-event.
- [x] **Dashboard "Tiket Saya" (`/dashboard/tickets`):**
  - Komponen [`TicketCard.tsx`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/dashboard/tickets/TicketCard.tsx) menampilkan NFT yang dimiliki dari blockchain Sepolia.
  - **Dynamic QR Code Berbasis WebAuthn Passkey:**
    - Pertahanan Anti-Screenshot: Countdown timer 60 detik dengan auto-expiry.
    - Pertahanan Anti-Replay: Nonce CSPRNG 32-bit (`crypto.getRandomValues`).
    - Tanda tangan kriptografi NIST P-256 $(r, s)$ yang dihasilkan chip hardware TPM/Secure Enclave.
- [ ] **Panel Verifikasi Gerbang Masuk Venue (Venue Staff Scanner - `/dashboard/verify`):**
  - [ ] **Komponen Kamera Pemindai:** Pemindai QR berbasis browser (`html5-qrcode`).
  - [ ] **Alur Verifikasi Dual-Scan (2-Step Gate Verification):**
    - [ ] **Scan 1 (Dynamic QR dari HP Penonton):**
      - Parsing payload JSON: `tokenId`, `walletAddress`, `nonce`, `signedAt`, `signature: { r, s }`.
      - Validasi kedaluwarsa ($\le 60$ detik) & keunikan nonce anti-replay.
      - Pengecekan status kepemilikan on-chain (`used == false`).
    - [ ] **Scan 2 (KTP Fisik Penonton - Barcode / Input NIK):**
      - Staf gate memindai barcode KTP fisik atau menginput 16 digit NIK.
      - Penghitungan instan `calculatedHash = keccak256(toUtf8Bytes(nik))` di memori sementara (*ephemeral RAM*).
      - Sanitasi instan: NIK mentah langsung dibuang seketika dari RAM tanpa disimpan ke database/disk (UU PDP No. 27/2022).
    - [ ] **Pencocokan Identitas & Eksekusi On-Chain `markUsed`:**
      - Pencocokan deterministik: `calculatedHash === identityHash`.
      - Panggil endpoint relayer `POST /api/tickets/redeem` untuk menjalankan transaksi `markUsed(tokenId)` di Sepolia.
      - Tampilan visual hasil: Hijau (*Akses Diizinkan*) atau Merah (*Akses Ditolak*).

---

## Tahap 5 — Uji Coba & Evaluasi Sistem (Bab 6)

### 5A. Verifikasi Fungsional & Keamanan (Testnet)
- [ ] **Uji Fungsional Alur Utama:** Registrasi Passkey, Pembelian Tiket, dan Dual-Scan Gate Verification tercatat lengkap di matriks pengujian.
- [ ] **Uji Keamanan Anti-Scalping:**
  - Pembuktian bahwa pembelian tiket ke-3 oleh akun yang sama otomatis ditolak on-chain (`MaxPerWalletExceeded`).
  - Pembuktian bahwa harga tiket asli terkunci di blockchain (`originalPrice`).
- [ ] **Uji Keamanan Anti-Screenshot & Anti-Replay:**
  - Pembuktian QR Code yang kedaluwarsa (> 60 detik) atau nonce duplikat ditolak oleh scanner gerbang.
- [ ] **Pengukuran Performa On-Chain:**
  - Rekapitulasi gas cost per fungsi dari `.gas-snapshot`.
  - Pengukuran waktu konfirmasi transaksi rata-rata (detik) di Sepolia Testnet.

### 5B. Validasi Usability Pengguna Umum (Kuesioner SUS)
- [ ] **Penyebaran Skenario Uji Coba Pengguna:** Responden umum mencoba alur pembelian tiket via Passkey tanpa instalasi wallet ekstensi MetaMask.
- [ ] **Rekapitulasi Skor System Usability Scale (SUS):** Evaluasi kemudahan sistem bagi masyarakat awam.

---

## Tahap 6 — Penyusunan Laporan Tugas Akhir

- [ ] **Bab 4 (Desain Sistem):** Dokumentasi arsitektur Web2.5, diagram BPMN, ERD, dan spesifikasi smart contract.
- [ ] **Bab 5 (Implementasi Sistem):** Dokumentasi realisasi kode NestJS relayer, Passkey WebAuthn, Next.js, dan Sepolia.
- [ ] **Bab 6 (Uji Coba dan Evaluasi):** Hasil pengujian fungsional, pengujian keamanan anti-scalping, metrik gas, dan skor SUS.
- [ ] **Bab 7 (Kesimpulan dan Saran):** Evaluasi pencapaian tujuan penelitian anti-scalping dan ERC-4337.
- [ ] **Pemeriksaan Plagiarisme & Persetujuan Dosen Pembimbing Menuju Sidang.**

---

## Indeks Dokumen Penjelasan Teknis Terkait

| No | Judul Dokumen | Topik Relevan |
|---|---|---|
| **13** | [`13-end-to-end-ticket-purchase-flow.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/13-end-to-end-ticket-purchase-flow.md) | Alur transaksi pembelian, data kirim/respon, dan pemisahan On-chain vs Off-chain |
| **14** | [`14-api-communication-patterns-and-bff-architecture.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/14-api-communication-patterns-and-bff-architecture.md) | Pola komunikasi API, RESTful NestJS, dan BFF Next.js |
| **16** | [`16-data-integrity-single-source-of-truth-and-anti-fraud.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/16-data-integrity-single-source-of-truth-and-anti-fraud.md) | Single source of truth, pemisahan kasta data, dan mekanisme anti-fraud |
| **17** | [`17-dynamic-qr-webauthn-signature-and-gate-redemption.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/17-dynamic-qr-webauthn-signature-and-gate-redemption.md) | Dynamic QR Code, WebAuthn Passkey signature, countdown 60s, dan protokol gate |
| **18** | [`18-orm-typeorm-architecture-and-multi-event-vs-factory.md`](file:///d:/STEVE/Project%20NFT%20Marketplace/explanation/18-orm-typeorm-architecture-and-multi-event-vs-factory.md) | Multi-Tenant vs Factory smart contract, fungsi `on_chain_event_id`, dan teori TypeORM |
