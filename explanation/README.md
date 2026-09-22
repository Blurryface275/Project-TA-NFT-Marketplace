# Index Penjelasan & Dokumentasi Teknis Tugas Akhir (TA)

Folder ini berisi rangkuman teknis, kajian teori, dan pemecahan masalah (*troubleshooting*) dari perdebatan serta diskusi pengembangan sistem **NFT Marketplace Berbasis ERC-4337 Account Abstraction & Passkey Biometrik**.

Semua penjelasan disusun secara sistematis dan dilengkapi referensi standar resmi (Ethereum EIPs, W3C WebAuthn, FIDO Alliance, NestJS, Next.js).

---

## Daftar Dokumen Penjelasan

### 📄 [01. Struktur initCode ERC-4337, Hubungan dengan ERC-1967, & ZeroDev Kernel](./01-erc4337-initcode-and-erc1967.md)
* **Topik Utama:**
  * Penjelasan 3 kontrak: `KernelFactory`, `Kernel Implementation`, dan `ERC-1967 Proxy`.
  * Mitos vs Fakta struktur byte `initCode` (Bukan bytecode akun, melainkan `[factory address] + [calldata]`).
  * Alasan ERC-4337 tidak menyebut ERC-1967, serta alasan penghematan gas 95% via minimal proxy.
  * Formula slot memori implementasi ERC-1967 (`0x3608...`).

### 📄 [02. Kriptografi Passkey (WebAuthn) & Perhitungan Alamat Smart Account (Data Riil)](./02-passkey-cryptography-and-address-derivation.md)
* **Topik Utama:**
  * Karakteristik kurva eliptik P-256 / secp256r1.
  * Struktur 96 bytes `enableData` (`pubX` 32B + `pubY` 32B + `authenticatorIdHash` 32B).
  * Perhitungan bertahap menggunakan data riil akun pengujian (Andi):
    * Konversi nilai koordinat ke hexadecimal.
    * Hashing `keccak256` pada byte `authenticatorId`.
    * Penggabungan 96 bytes data.
    * Penurunan alamat counterfactual wallet: `0x811aed8154d90B9454AFbe246f167106eF4361Eb`.

### 📄 [03. Panduan Lengkap EVM Opcodes (Operation Codes)](./03-evm-opcodes-guide.md)
* **Topik Utama:**
  * Penjelasan fundamental arsitektur EVM sebagai *Stack-based Virtual Machine*.
  * Apa itu Opcode (instruksi 1 byte `0x00` - `0xFF`) dan bagaimana gas dihitung.
  * Analisis mendalam opcode penting dalam ERC-4337:
    * `CREATE2` (`0xF5`) untuk deployment alamat deterministik.
    * `DELEGATECALL` (`0xF4`) untuk eksekusi logika proxy dan modular validator.
    * `STATICCALL` (`0xFA`) untuk simulasi validasi UserOperation tanpa modifikasi state.
    * `SSTORE` / `SLOAD` untuk penyimpanan permanen.

### 📄 [04. Siklus Hidup WebAuthn Passkey (Registrasi vs Login & Perubahan Credential ID)](./04-webauthn-lifecycle-register-vs-login.md)
* **Topik Utama:**
  * Menjawab pertanyaan: *"Kenapa credentialId selalu berbeda setiap kali registrasi meskipun emailnya sama?"*.
  * Perbedaan upacara Registrasi (`navigator.credentials.create`) vs Autentikasi (`navigator.credentials.get`).
  * Peran chip keamanan hardware (TPM / Secure Enclave) dalam menghasilkan entropi acak baru (*anti-tracking* & *privacy* standar FIDO2).
  * Penelusuran alur eksekusi baris kode (*call stack trace*) dari UI form Next.js hingga pemanggilan native Web API.

### 📄 [05. Arsitektur Autentikasi Fullstack & Troubleshooting Server Actions](./05-fullstack-auth-architecture-and-troubleshooting.md)
* **Topik Utama:**
  * Arsitektur integrasi Next.js 15+ Server Action + NestJS 11 + TypeORM + MySQL.
  * Alur perjalanan pesan error (Error 409 Conflict & Error 401 Unauthorized) dari backend ke UI via `useActionState`.
  * Analisis bug teknis Next.js: Kenapa `redirect()` di dalam `try...catch` memicu `catch` (`NEXT_REDIRECT` error exception).
  * Penjelasan aturan JavaScript Block Scope (`let response` vs `const response`).

### 📄 [06. Fondasi Smart Contract Solidity & Alur Eksekusi Minting Tiket](./06-smart-contract-fundamentals-and-mint-flow.md)
* **Topik Utama:**
  * Bentuk objek tiket di smart contract via kombinasi `struct TicketInfo` dan `mapping`.
  * Peran dan fungsi kata kunci: `error`, `revert`, `event`, `emit`.
  * Aturan visibilitas (`external`, `public`, `internal`, `private`) dan mutabilitas (`view`, `pure`).
  * Optimasi Gas: Alasan variasi tipe data `uint` (Teknik *Struct / Storage Packing* menghemat 20.000 gas).
  * Simulasi alur eksekusi baris demi baris saat pengguna membeli tiket (`mintTicket`).

### 📄 [07. Mekanisme Deployment Smart Contract via Foundry & Analisis Script Deploy](./07-foundry-deployment-mechanism-and-scripting.md)
* **Topik Utama:**
  * Cara kerja deployment di balik layar: peran `vm.startBroadcast`, kata kunci `new TicketContract()`, dan transaksi `to: null`.
  * Bagaimana EVM mengeksekusi opcode `CREATE` dan menghitung alamat kontrak via `keccak256(rlp.encode([sender, nonce]))`.
  * Perbedaan simulasi lokal (*dry-run*) vs transmisi publik (`--broadcast`).
  * Asal-usul data dan parameter di `Deploy.s.sol` (`eventId`, `eventTimestamp`, `maxPerWallet`, `price`, `quota`).

### 📄 [08. Arsitektur Multi-Event dalam 1 Kontrak & Kapasitas Penyimpanan Storage EVM](./08-evm-storage-capacity-and-multi-event-architecture.md)
* **Topik Utama:**
  * Arsitektur pasangan 1 `MarketplaceContract` resmi dengan 1 `TicketContract` master multi-event.
  * Mekanisme penguncian transfer allowlist dan pembacaan `originalPrice` on-chain (Anti-Scalping).
  * Analisis kapasitas matematis ruang alamat 256-bit EVM (`2^256 ≈ 1,15 x 10^77` slot storage unik).
  * Batasan fisik dunia nyata: biaya gas `SSTORE` (20.000 gas), batasan gas per blok, dan kapasitas tipe data struct.
  * Tabel perbandingan komprehensif antara Database Relasional (MySQL) vs Storage Smart Contract EVM.

### 📄 [09. Integrasi Viem di NestJS, Validasi DTO, dan Standar ABI Smart Contract](./09-viem-integration-dto-validation-and-contract-abi.md)
* **Topik Utama:**
  * Arsitektur Relayer: Menghubungkan HTTP API NestJS dengan node blockchain Sepolia.
  * Peran validasi DTO (`class-validator`) dalam mencegah transaksi gagal dan pemborosan gas fee.
  * Konsep ABI (Application Binary Interface) sebagai kamus JSON antara runtime JS dan EVM Bytecode.
  * Mengapa Viem mewajibkan `as const` (TypeScript Const Assertion & ABIType Static Type Inference).
  * Perbedaan peran `PublicClient` (Read-Only) vs `WalletClient` (Signing & Transacting).

### 📄 [10. Panduan Lengkap & Mudah Memahami TicketsService (Relayer Transaksi Blockchain)](./10-tickets-service-relayer-deep-dive.md)
* **Topik Utama:**
  * Analogi loket konser: Bagaimana pengguna awam (Asep) mendapatkan tiket NFT tanpa perlu membeli koin kripto/gas fee (*Gasless User Experience*).
  * Konsep "Dua Tangan" Viem: Pemisahan peran `publicClient` (Mata Pengawas, read-only gratis) dan `walletClient` (Tangan Eksekutor, bayar gas admin).
  * Bedah anatomi baris demi baris: Constructor, `mintTicket`, `redeemTicket`, dan `getTicket`.
  * Penjelasan teknis: Kenapa wajib `BigInt()`, beda `txHash` vs `receipt`, dan manfaat `error?.shortMessage`.
  * Mekanisme on-chain penolakan tiket ganda (*Anti-Double-Spend*) dan pembacaan gratis `ownerOf`.
  * Kumpulan tanya-jawab (FAQ) kritis seputar Relayer untuk persiapan sidang Tugas Akhir.

### 📄 [11. Arsitektur HTTP Controller, Modul NestJS, dan Dependency Injection Wiring](./11-tickets-controller-module-and-app-wiring.md)
* **Topik Utama:**
  * Analogi restoran: Peran `TicketsController` sebagai pelayan penerima pesanan dan `TicketsModule` sebagai pembatas departemen.
  * Diagram alur perjalanan HTTP Request dari tombol web Next.js ke method smart contract Sepolia.
  * Bedah anatomi baris demi baris `tickets.controller.ts` (38 baris) & peran satpam `ParseIntPipe`.
  * Bedah anatomi baris demi baris `tickets.module.ts` (11 baris): Peran `controllers`, `providers`, dan `exports`.
  * Bedah anatomi `app.module.ts` (39 baris) & analisa teknis mendalam: Mengapa `TypeOrmModule.forRootAsync` hanya mengimpor `ConfigModule` & `ConfigService` (mencegah bencana *Circular Dependency*).
  * Tanya-jawab (FAQ) ujian sidang TA seputar alasan pemilihan framework modular NestJS vs Express.js.

### 📄 [12. Arsitektur Frontend Navbar, Server Component Session, dan Layouting Next.js](./12-frontend-navbar-layout-and-session.md)
* **Topik Utama:**
  * Alasan teknis Navbar dirancang sebagai Server Component (Zero Bundle Size & No Layout Shift).
  * Bedah baris demi baris `session.ts`: Penyimpanan `name` & `walletAddress` di cookie JWT untuk menghindari waterfall fetch.
  * Bedah baris demi baris `Navbar.tsx`: Helper pemotong dompet `formatAddress`, Optional Chaining `?.`, dan styling Tailwind CSS (sticky, glassmorphism).
  * Analisis troubleshooting: Mengapa Navbar belum muncul di layar (tag flexbox kosong vs penempatan di dalam container centered).
  * Tanya-jawab (FAQ) ujian sidang TA terkait UX Web3 truncation alamat dompet dan progressive enhancement Server Action.

---

## Panduan Penggunaan untuk Tugas Akhir (TA)

Dokumen-dokumen ini dapat langsung kamu gunakan sebagai bahan rujukan dan argumentasi untuk:
1. **Bab 2 (Landasan Teori):** Penjelasan ERC-4337, ERC-1967, EVM Opcodes, dan kurva secp256r1 WebAuthn.
2. **Bab 3 / 4 (Perancangan & Implementasi Sistem):** Skema 96 bytes `enableData`, penurunan counterfactual address, dan arsitektur autentikasi ganda (Passkey + Session Cookie).
3. **Persiapan Sidang / Tanya Jawab Dosen Penguji:** Jawaban ilmiah atas pertanyaan kritis mengenai alasan pemilihan arsitektur proxy, cara kerja chip TPM hardware, dan alur eksekusi transaksi.
