# TASKS.md — Rencana Pengerjaan dan Peta Kerja Menuju Sidang

> **Dokumen Patokan Mutlak:**
> 1. `dokumen/Proposal TA_160423176.pdf` (20 Agustus 2026)
> 2. `dokumen/TA_Benedictus Leonardo Edward Stephen Sugianto_160423176.pdf` (Bab 1–3)
>
> **Aturan Pengerjaan:**
> - Tugas disusun mengikuti **6 Tahap Metodologi Penelitian** resmi dari Bab 1 Tugas Akhir.
> - Suatu kotak tugas hanya boleh dicentang (`[x]`) jika **bukti selesai** sudah terpenuhi secara nyata (kode teruji, transaksi on-chain terverifikasi, atau dokumen selesai).
> - Seluruh kode ditulis sendiri oleh Edward mengacu pada panduan di [CLAUDE.md](file:///d:/STEVE/Project%20NFT%20Marketplace/CLAUDE.md) Bagian 8.

---

## Ringkasan Progres Utama

| Fase | Deskripsi | Target Selesai | Status |
|---|---|---|---|
| **Tahap 1–2** | Persiapan & Analisis Sistem (Bab 1, 2, 3) | Selesai | [x] Selesai (Naskah Bab 1–3 di dokumen TA) |
| **Tahap 3** | Desain Sistem & Arsitektur (Bab 4) | 10 September 2026 | [ ] Sedang Berjalan (Diagram & skema siap) |
| **Tahap 4A** | Smart Contract: `TicketContract.sol` & Test | 11 September 2026 | [ ] Sedang Berjalan (Kode awal ada, tes dimulai) |
| **Tahap 4B** | Smart Contract: `MarketplaceContract.sol` & Test | 13 September 2026 | [ ] Menunggu Tahap 4A |
| **Tahap 4C** | Deploy Sepolia & Validasi Paymaster ZeroDev | 15 September 2026 | [ ] Menunggu Tahap 4B |
| **Tahap 4D** | Backend NestJS & Integrasi (Midtrans, IPFS, Turnstile) | 22 September 2026 | [ ] Menunggu Tahap 4C |
| **Tahap 4E** | Frontend Next.js (Passkey, Snap, Resale, Venue) | 29 September 2026 | [ ] Menunggu Tahap 4D |
| **Tahap 5** | Uji Coba & Evaluasi Usability SUS (Bab 6) | 10 Oktober 2026 | [ ] Menunggu Tahap 4E |
| **Tahap 6** | Penyusunan Laporan Akhir (Bab 4, 5, 6, 7) | 17–24 Oktober 2026 | [ ] Menuju LSTA 10 Nov & Sidang 17 Nov |

---

## Tahap 3 — Desain Sistem & Arsitektur (Bab 4)

- [x] **Arsitektur Sistem 3 Komponen:** Frontend Next.js, Backend NestJS, dan 2 Smart Contract di Sepolia Testnet (Proposal Hal 11).
- [x] **Desain 3 Alur Proses Utama:** Registrasi Passkey/KYC, Pembelian Tiket Reguler, dan Jual Kembali Resale (Gambar 1 Proposal Hal 12).
- [x] **Desain Alur Verifikasi Tiket di Venue:** Validasi kepemilikan on-chain dan pemanggilan `markUsed()`.
- [ ] **Finalisasi Skema Database MySQL (TypeORM):**
  - Tabel: `users`, `organizers`, `kyc_records` (`nik_hash`, status KYC, file KTP), `passkey_credentials` (`credential_id`, `pub_x`, `pub_y`), `events`, `ticket_categories`, `ticket_cache`, `orders`, `resale_listings`, `notifications`.
  - **Bukti Selesai:** Skema ERD final selaras dengan naskah Bab 4 dan kamus data.

---

## Tahap 4 — Implementasi Sistem Bertahap

### 4A. Smart Contract: `TicketContract.sol` Selesai dan Teruji
*Status saat ini:* Struktur awal sudah dikompilasi (`forge build` sukses), belum ada unit test.

- [x] **Suite Pengujian Unit Foundry:** Buat `contracts/test/TicketContract.t.sol` untuk menguji fungsi dasar yang sudah ada:
  - Uji sukses dan revert `createEvent` (ID nol, alamat nol, timestamp lampau, event duplikat).
  - Uji sukses dan revert `addCategory` (event tidak ada, harga/kuota nol, kategori duplikat).
  - Uji `setSalesOpen`, `setMarketplace`, dan `setSystemSigner` (hak akses owner/organizer).
  - **Bukti Selesai:** `forge test` berjalan hijau 100% (25 tests passed).
- [ ] **Pencatatan Identitas KYC (`registerIdentity`):**
  - Fungsi untuk mencatat mapping `userIdentities[userWallet] = nikHash`.
  - Hanya dapat dipanggil oleh sistem tepercaya / owner.
  - **Bukti Selesai:** Test Foundry berhasil mencatat dan menolak input tidak sah.
- [ ] **Pencetakan Tiket (`mintTicket`) dengan Penguncian `originalPrice`:**
  - Validasi: event aktif & `salesOpen`, kuota tersedia (`minted < quota`), pembeli terdaftar di `userIdentities`, dan tidak melebihi `maxPerWallet`.
  - Gerbang tanda tangan EIP-712: validasi `_hashTypedDataV4` dengan penanda tangan `systemSigner`, *nonce* sekali pakai anti-replay, dan batas waktu kedaluwarsa.
  - Simpan `TicketInfo` permanen dengan parameter `originalPrice = price`, `used = false`.
  - Eksekusi `_safeMint(to, tokenId)`.
  - **Bukti Selesai:** Test Foundry skenario sukses dan revert untuk setiap kondisi pelanggaran.
- [ ] **Pencegatan Transfer Bebas via Penimpaan Hook `_update()`:**
  - Penimpaan `_update(address to, uint256 tokenId, address auth)` sesuai OpenZeppelin v5.7.
  - Loloskan jika proses *minting* (`from == address(0)`) atau *burning* (`to == address(0)`).
  - Jika transfer biasa: **wajib tolak jika `msg.sender != marketplaceAddress`** (*allowlist restriction*).
  - **Bukti Selesai:** Test Foundry membuktikan transfer langsung P2P via `transferFrom` otomatis revert, sedangkan transfer lewat alamat marketplace lolos.
- [ ] **Fungsi Verifikasi Penggunaan Tiket (`markUsed`):**
  - Fungsi untuk menandai tiket telah digunakan di lokasi acara (`used = true`).
  - Tolak jika tiket sudah pernah dipakai sebelumnya atau event belum tiba saatnya.
  - **Bukti Selesai:** Test Foundry untuk skenario pemakaian sah dan penolakan tiket ganda.
- [x] **Snapshot Gas Smart Contract:** Jalankan `forge snapshot` untuk mencatat konsumsi gas setiap fungsi (bahan Bab 6). Berkas `.gas-snapshot` telah dihasilkan.

---

### 4B. Smart Contract: `MarketplaceContract.sol` (Pasar Sekunder Resmi)

- [ ] **Rancang Kontrak Pasar Sekunder:**
  - Menyimpan referensi ke `TicketContract`.
  - Struct listing tiket resale: `tokenId`, `seller`, `price`, `active`.
- [ ] **Mekanisme Penguncian Harga Mutlak (`resale price-lock`):**
  - Saat mendaftarkan listing, harga **wajib dibaca langsung dari `TicketContract.getOriginalPrice(tokenId)`**.
  - Penjual sama sekali tidak dapat memasukkan parameter harga sendiri.
  - **Bukti Selesai:** Test Foundry membuktikan harga listing selalu sama persis dengan harga beli awal.
- [ ] **Fungsi Eksekusi Resale (`executeResale`):**
  - Dipanggil setelah pembeli kedua menyelesaikan pembayaran via Midtrans.
  - Memindahkan kepemilikan NFT dari `seller` ke `buyer` memanfaatkan hak allowlist pada `TicketContract`.
  - **Bukti Selesai:** Test Foundry integrasi mint -> listing resale -> executeResale berhasil.
- [ ] **Uji Keamanan Marketplace (Bahan Bab 6):**
  - Verifikasi bahwa pihak luar tidak bisa memanipulasi listing atau memotong alur pembayaran.

---

### 4C. Deployment ke Sepolia Testnet & Verifikasi On-Chain

- [ ] **Skrip Deployment Foundry (`script/Deploy.s.sol`):**
  - Deploy `TicketContract.sol` dan `MarketplaceContract.sol`.
  - Panggil `TicketContract.setMarketplace(marketplaceAddress)`.
  - Panggil `TicketContract.setSystemSigner(backendSignerAddress)`.
  - **Bukti Selesai:** Alamat kontrak Sepolia tercatat di `docs/kerja/alamat-kontrak.md`.
- [ ] **Seeding Data Awal di Testnet:**
  - Buat 1 event uji dan minimal 1 kategori tiket via smart contract.
- [ ] **Verifikasi Transaksi Bersponsor Paymaster ERC-4337:**
  - Eksekusi 1 transaksi UserOperation tersponsori penuh oleh ZeroDev Paymaster di Sepolia.
  - **Bukti Selesai:** Hash transaksi di Sepolia Etherscan membuktikan gas ditanggung Paymaster (tanpa saldo ETH pada dompet pengguna).

---

### 4D. Backend NestJS & Integrasi Layanan

- [ ] **Inisialisasi Proyek NestJS 11 & TypeORM:**
  - Konfigurasi koneksi MySQL via `DataSource`.
  - Buat entitas dan migrasi database sesuai rancangan ERD final.
- [ ] **Modul Autentikasi Hibrida:**
  - Pendaftaran & Login akun via Email + Kata Sandi + Verifikasi email.
  - Pendaftaran Passkey WebAuthn (simpan `credential_id`, `pub_x`, `pub_y` di tabel `passkey_credentials`).
  - Perhitungan alamat dompet smart account deterministik via ZeroDev SDK (`CREATE2`).
- [ ] **Modul KYC Identitas:**
  - Endpoint upload foto KTP dan input data identitas.
  - Pembuatan hash NIK satu arah (`bytes32`) dan pemanggilan fungsi on-chain `registerIdentity()`.
- [ ] **Modul Katalog Event & Kategori:**
  - Endpoint daftar event aktif, detail event, kuota kategori tiket, dan riwayat transaksi.
- [ ] **Integrasi Midtrans Sandbox:**
  - Endpoint inisiasi transaksi dan perolehan Snap Token.
  - Endpoint webhook Midtrans berulang yang idempoten (mencegah pencetakan ganda saat menerima notifikasi ganda).
- [ ] **Pipeline Minting Tiket On-Chain:**
  - Begitu webhook status lunas (`settlement`/`capture`) diterima: generate EIP-712 signature -> panggil minting via bundler/paymaster -> catat `tokenId` ke `ticket_cache`.
  - Catat durasi konfirmasi transaksi untuk data pengujian Bab 6.
- [ ] **Integrasi Cloudflare Turnstile:**
  - Verifikasi token tantangan Turnstile di sisi server melalui endpoint `/siteverify` sebelum transaksi tiket diproses.
- [ ] **Integrasi Pinata IPFS:**
  - Modul unggah file gambar dan payload metadata JSON ke IPFS via Pinata SDK (`npm i pinata`), simpan CID.
- [ ] **Modul Penjualan Kembali (Resale API):**
  - Endpoint listing tiket milik pengguna ke marketplace, pengambilan katalog resale aktif, dan webhook penyelesaian pembelian resale.
  - Skema biaya administrasi: pemotongan saldo penjual dan penambahan biaya admin pada pembeli yang dialokasikan sebagai dana subsidi gas fee Paymaster.
- [ ] **Modul Pemulihan Akun (Account Recovery API):**
  - Pendaftaran public key / address backup validator (secp256k1) saat registrasi akun.
  - Endpoint verifikasi signature recovery via `ECDSA.recover` untuk mencocokkan address validator cadangan on-chain.
  - Pengiriman email konfirmasi faktor kedua (2FA).
  - Eksekusi penggantian validator utama smart account dengan public key passkey baru setelah 2FA disetujui.

---

### 4E. Frontend Next.js & Antarmuka Pengguna

- [ ] **Inisialisasi Next.js 16 (App Router):**
  - Penyiapan antarmuka responsif dan modern (desain clean, modern UI).
- [ ] **Antarmuka Registrasi, Login & Passkey:**
  - Halaman pendaftaran email, aktivasi verifikasi email, pendaftaran biometrik/passkey via browser WebAuthn API, dan formulir verifikasi KYC KTP.
  - Tampilan modal seed phrase BIP-39 (12 kata) yang ditampilkan **sekali** untuk disimpan pengguna, serta penurunan kunci secp256k1 di browser untuk mendaftarkan backup validator on-chain.
- [ ] **Halaman Pemulihan Akun (Account Recovery Page):**
  - Halaman khusus (terpisah dari login biasa) untuk memasukkan email dan mengetik ulang 12 kata seed phrase BIP-39.
  - Penurunan kembali private key secp256k1 di sisi browser, penandatanganan pesan otorisasi penggantian passkey, pendaftaran passkey baru di perangkat baru, dan verifikasi tautan email konfirmasi 2FA.
- [ ] **Halaman Katalog & Detail Event:**
  - Tampilan event, banner, jadwal, sisa kuota, dan harga per kategori.
- [ ] **Modal Checkout & Pembayaran:**
  - Integrasi komponen Cloudflare Turnstile widget.
  - Pemanggilan popup Midtrans Snap untuk pembayaran fiat simulasi (QRIS/VA).
- [ ] **Dashboard "Tiket Saya":**
  - Daftar tiket NFT yang dimiliki pengguna beserta metadata dari IPFS.
  - Tampilan QR E-Ticket dinamis untuk ditunjukkan saat verifikasi masuk venue.
- [ ] **Antarmuka Jual Kembali (Resale Hub):**
  - Tombol jual tiket dengan konfirmasi harga terkunci (`originalPrice`).
  - Halaman penjelajahan tiket pasar sekunder bagi pembeli lain dengan rincian biaya admin.
- [ ] **Panel Verifikasi Tiket di Lokasi Acara (Venue Staff Tool):**
  - Antarmuka pemindai QR E-Ticket dan pemindai KTP fisik (OCR/scan NIK).
  - Alur verifikasi identitas: sistem membaca NIK -> menghitung hash NIK -> mencocokkan ke database dan kepemilikan token on-chain (`userIdentities[ownerOf(tokenId)] == nikHash`).
  - Jika cocok: sistem mengeksekusi pemanggilan on-chain `markUsed(tokenId)`. Jika tidak cocok: akses masuk ditolak.

---

## Tahap 5 — Uji Coba & Evaluasi Sistem (Bab 6)

### 5A. Verifikasi Fungsional & Keamanan (Otomatis & Testnet)
- [ ] **Uji Fungsional Alur Utama & Pemulihan:** Registrasi (passkey + seed phrase), Pembelian Reguler, Resale, Verifikasi Venue, dan Pemulihan Akun di perangkat baru tercatat lengkap di matriks pengujian.
- [ ] **Uji Keamanan Pembatasan Transfer Allowlist:** Percobaan transfer NFT secara langsung antar dompet via RPC/Etherscan terbukti gagal (*revert*).
- [ ] **Uji Keamanan Resale Price-Lock:** Percobaan mengubah atau me-markup harga listing pasar sekunder terbukti gagal (*revert*).
- [ ] **Uji Pembuktian Kepemilikan Pribadi:** Membuktikan bahwa pengguna dapat memverifikasi kepemilikan tiket on-chain secara mandiri.
- [ ] **Uji Keamanan Alur Recovery:** Percobaan recovery dengan seed phrase salah atau tanpa konfirmasi email 2FA terbukti ditolak.
- [ ] **Pengukuran Performa On-Chain:**
  - Pengukuran konsumsi gas (*gas cost*) per fungsi smart contract (via Foundry snapshot).
  - Pengukuran waktu konfirmasi transaksi minting di Sepolia Testnet (rata-rata detik).

### 5B. Validasi Usability Pengguna Umum (Kuesioner SUS)
- [ ] **Penyebaran Skenario Pembelian Langsung:** Uji coba alur pembelian tiket oleh responden pengguna umum.
- [ ] **Pengumpulan Kuesioner SUS:** Rekapitulasi skor System Usability Scale (SUS) untuk mengukur tingkat kemudahan sistem bagi masyarakat awam tanpa latar belakang Web3.

---

## Tahap 6 — Penyusunan Laporan Tugas Akhir

- [ ] **Penyusunan Bab 4 (Desain Sistem):** Dokumentasi detail arsitektur, diagram alur, smart contract spec, skema basis data, dan antarmuka.
- [ ] **Penyusunan Bab 5 (Implementasi Sistem):** Dokumentasi realisasi kode smart contract, integrasi ERC-4337, backend, dan frontend.
- [ ] **Penyusunan Bab 6 (Uji Coba dan Evaluasi):** Hasil pengujian fungsional, pengujian keamanan, metrik gas/waktu, dan skor kuesioner SUS.
- [ ] **Penyusunan Bab 7 (Kesimpulan dan Saran):** Evaluasi pencapaian tujuan penelitian dan rekomendasi pengembangan lanjutan.
- [ ] **Pemeriksaan Plagiarisme & Persetujuan Dosen Pembimbing Menuju Sidang.**
