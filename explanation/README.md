# Indeks dokumentasi teknis dan arsitektur sistem tugas akhir

Dokumentasi ini memuat spesifikasi teknis, analisis arsitektur, dan justifikasi rekayasa sistem untuk platform **NFTix: Marketplace Tiket Konser Berbasis ERC-4337 Account Abstraction, Passkey Biometrik, dan Midtrans Payment Gateway**.

Seluruh dokumen disusun berstandar akademik dan rekayasa perangkat lunak (siap digunakan untuk naskah Buku Tugas Akhir Bab 4 dan Bab 5 serta materi argumentasi sidang skripsi), lengkap dengan diagram desain sistem Mermaid, analisis alur sekuensial, dan rujukan standar terbuka resmi (Ethereum EIPs, W3C WebAuthn, FIDO Alliance, IETF RFC).

---

## Daftar dokumen spesifikasi modul

### 1. Modul abstraksi akun dan kriptografi WebAuthn

* [01-erc4337-initcode-and-erc1967.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/01-erc4337-initcode-and-erc1967.md)
  * **Judul:** Desain dan spesifikasi teknis initCode ERC-4337, proxy ERC-1967, dan ZeroDev Kernel.
  * **Topik inti:** Arsitektur deployment counterfactual, struktur calldata `createAccount`, formula slot implementasi ERC-1967 (`0x3608...bbc`), penghematan gas 93% via minimal proxy, dan isolasi eksekusi `DELEGATECALL`.

* [02-passkey-cryptography-and-address-derivation.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/02-passkey-cryptography-and-address-derivation.md)
  * **Judul:** Desain dan spesifikasi teknis kriptografi passkey dan derivasi alamat counterfactual.
  * **Topik inti:** Kurva eliptik NIST P-256 (secp256r1), struktur data 96-byte `enableData` (`pubX` 32B + `pubY` 32B + `authenticatorIdHash` 32B), formula matematis EIP-1014 `CREATE2`, studi kasus data uji riil akun Andi di Windows Hello, dan mitigasi isolasi chip TPM hardware.

* [03-evm-opcodes-guide.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/03-evm-opcodes-guide.md)
  * **Judul:** Desain dan spesifikasi teknis eksekusi opcode EVM pada smart contract dan ERC-4337.
  * **Topik inti:** Arsitektur mesin stack 256-bit, empat domain memori EVM (Stack, Memory, Storage, Calldata), semantik opcode `CREATE2` (0xF5), `DELEGATECALL` (0xF4), `STATICCALL` (0xFA), `SSTORE` (0x55), dan dinamika biaya gas EIP-2200/EIP-2929.

* [04-webauthn-lifecycle-register-vs-login.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/04-webauthn-lifecycle-register-vs-login.md)
  * **Judul:** Desain dan spesifikasi teknis siklus hidup WebAuthn passkey (upacara registrasi vs autentikasi).
  * **Topik inti:** Perbedaan upacara registrasi (`create`) dan autentikasi (`get`), penyebab matematis mutasi `credentialId` baru pada pendaftaran ulang, entropi TRNG chip TPM 2.0 / Apple Secure Enclave, dan arsitektur progressive onboarding.

---

### 2. Modul fullstack autentikasi dan komunikasi sistem

* [05-fullstack-auth-architecture-and-troubleshooting.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/05-fullstack-auth-architecture-and-troubleshooting.md)
  * **Judul:** Desain dan spesifikasi teknis arsitektur autentikasi fullstack dan penanganan kesalahan server actions.
  * **Topik inti:** Pola arsitektur BFF Next.js ke REST API NestJS, siklus hidup cookie HttpOnly JWT, propagasi status HTTP 409 Conflict dan 401 Unauthorized, serta investigasi teknis penanganan eksepsi internal Next.js `NEXT_REDIRECT`.

* [09-viem-integration-dto-validation-and-contract-abi.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/09-viem-integration-dto-validation-and-contract-abi.md)
  * **Judul:** Desain dan spesifikasi teknis integrasi Viem pada NestJS, validasi DTO, dan standar ABI smart contract.
  * **Topik inti:** Jembatan Web2 ke Web3 via Viem, gerbang validasi DTO `class-validator`, konversi JSON ABI ke selektor calldata 4-byte, urgensi asersi tipe statis `as const`, dan penanganan topik event log `indexed`.

---

### 3. Modul smart contract dan infrastruktur blockchain

* [06-smart-contract-fundamentals-and-mint-flow.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/06-smart-contract-fundamentals-and-mint-flow.md)
  * **Judul:** Desain dan spesifikasi teknis fondasi smart contract Solidity dan alur minting tiket NFT.
  * **Topik inti:** Representasi objek tiket via `struct TicketInfo` dan `mapping`, pemisahan kepemilikan ERC-721 OpenZeppelin, optimasi gas storage slot packing (`uint96` + `bool` menghemat 22.100 gas), custom error EIP-838, dan alur eksekusi `mintTicket`.

* [07-foundry-deployment-mechanism-and-scripting.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/07-foundry-deployment-mechanism-and-scripting.md)
  * **Judul:** Desain dan spesifikasi teknis mekanisme deployment smart contract via Foundry dan analisis script broadcast.
  * **Topik inti:** Otomasi deployment Solidity script, semantik cheatcode `vm.startBroadcast`, transaksi creation bytecode `to: null`, formula deterministik alamat kontrak RLP `CREATE`, dan flag CLI `--broadcast`.

* [08-evm-storage-capacity-and-multi-event-architecture.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/08-evm-storage-capacity-and-multi-event-architecture.md)
  * **Judul:** Desain dan spesifikasi teknis arsitektur multi-event dan kapasitas storage Ethereum Virtual Machine.
  * **Topik inti:** Arsitektur pasangan master contract tiket dengan marketplace sekunder resmi, mekanisme pertahanan anti-calo (allowlist guard dan resale price-lock), bukti matematis kapasitas $2^{256}$ slot storage EVM, dan komparasi dengan MySQL.

---

### 4. Modul relayer dan integrasi pembayaran

* [10-tickets-service-relayer-deep-dive.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/10-tickets-service-relayer-deep-dive.md)
  * **Judul:** Desain dan spesifikasi teknis TicketsService relayer transaksi blockchain gasless.
  * **Topik inti:** Pengalaman pengguna gasless onboarding, pemisahan arsitektur dua klien Viem (`publicClient` read-only gratis vs `walletClient` mutasi state on-chain), pre-flight gas guard kepemilikan dan flag `used` pada `redeemTicket`, dan pelacakan indeks kursi sequential.

* [21-midtrans-payment-gateway-integration.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/21-midtrans-payment-gateway-integration.md)
  * **Judul:** Desain dan spesifikasi integrasi Midtrans Snap API.
  * **Topik inti:** Alur pembayaran mata uang Rupiah via Virtual Account dan QRIS, otentikasi Basic Auth RFC 7617, validasi harga server-side di MySQL, pengembalian Snap Token ke modal peramban, dan penanganan webhook status pelunasan.

* [22-eip712-structured-data-signatures.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/22-eip712-structured-data-signatures.md)
  * **Judul:** Desain dan spesifikasi teknis tanda tangan data terstruktur EIP-712 pada relayer smart contract.
  * **Topik inti:** Penutupan celah keamanan panggilan kontrak langsung (*direct contract call*), penurunan matematis Domain Separator dan StructHash, verifikasi tanda tangan kriptografis ECDSA on-chain, proteksi nonces anti-replay, dan matriks mitigasi 4 vektor serangan.

---

### 5. Modul transaksi kilat (flash sale) dan audit keamanan backend

* [23-flash-sale-architecture-and-backend-security-audit.md](file:///d:/STEVE/Project-TA-NFT-Marketplace/explanation/23-flash-sale-architecture-and-backend-security-audit.md)
  * **Judul:** Arsitektur flash sale (war tiket) passkey fast-pass dan audit keamanan backend skala besar.
  * **Topik inti:** Keputusan Opsi B (Passkey Fast-Pass) berbasis FIDO2 WebAuthn & UU PDP No. 27/2022, audit 5 pilar backend (kunci idempotensi, pessimistic locking ORM, state machine pemesanan, background job timeout reservasi, dan validasi input parameter), serta panduan implementasi teknis.

---

## Panduan penggunaan dokumen dalam naskah tugas akhir

Dokumen-dokumen di atas dirancang secara modular dan dapat langsung disitasi atau dialihbahasakan ke dalam naskah Tugas Akhir:

1. **Bab 2 (Landasan Teori):**
   * Rujuk Dokumen 01, 02, 03, dan 04 untuk pembahasan standar ERC-4337, kurva kriptografi P-256, opcodes EVM, dan protokol W3C WebAuthn.
   * Rujuk Dokumen 06, 08, dan 22 untuk teori ERC-721, struktur penyimpanan EVM, dan standar EIP-712.
2. **Bab 3 dan 4 (Perancangan dan Implementasi Sistem):**
   * Gunakan diagram blok arsitektur Mermaid (Bab 4 di masing-masing dokumen) sebagai dasar gambar diagram arsitektur sistem.
   * Gunakan diagram sekuensial (Bab 5 di masing-masing dokumen) untuk menjelaskan alur pertukaran pesan antar-komponen.
   * Gunakan tabel sumber fakta dan acuan kode untuk menjelaskan keterlacakan baris implementasi nyata pada repositori proyek.
3. **Bab 5 (Pengujian dan Evaluasi):**
   * Gunakan studi kasus data uji riil pada Dokumen 02 untuk membuktikan derivasi alamat deterministik.
   * Gunakan matriks analisis mitigasi ancaman keamanan pada seluruh dokumen untuk bab evaluasi keamanan sistem.
