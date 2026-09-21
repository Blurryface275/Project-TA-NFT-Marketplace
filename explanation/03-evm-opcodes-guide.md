# Penjelasan 03: Panduan Lengkap EVM Opcodes (Operation Codes)

Dokumen ini disusun untuk menjawab topik to-do list: **"Apa itu Opcode EVM?"** dan menjelaskan relevansinya terhadap ekosistem ERC-4337 Account Abstraction serta Smart Contract.

---

## 1. Apa itu Opcode EVM?

**EVM (Ethereum Virtual Machine)** adalah mesin virtual terdesentralisasi yang mengeksekusi kode smart contract di seluruh node jaringan Ethereum.

EVM adalah sebuah **Mesin Berbasis Stack (*Stack-based Machine*)** dengan ukuran kata 256-bit (32 bytes). Komputer/node Ethereum tidak memahami bahasa tingkat tinggi seperti Solidity secara langsung. Kode Solidity harus di-compile terlebih dahulu menjadi **Bytecode**.

Di dalam bytecode tersebut, setiap instruksi dasar berukuran **1 byte (8 bit)** yang memiliki nilai heksadesimal antara `0x00` hingga `0xFF`. Instruksi 1 byte inilah yang disebut **Opcode (Operation Code)**.

Contoh sederhana:
* `0x01` adalah opcode untuk `ADD` (menjumlahkan 2 angka di atas stack).
* `0x60` adalah opcode untuk `PUSH1` (memasukkan 1 byte data ke dalam stack).
* `0x55` adalah opcode untuk `SSTORE` (menyimpan data ke storage permanen blockchain).

Setiap kali sebuah opcode dieksekusi, node Ethereum memotong sejumlah **Gas** sebagai biaya komputasi.

---

## 2. Model Memori EVM

Ketika EVM mengeksekusi opcodes, terdapat 4 area penyimpanan data:
1. **Stack**: Struktur LIFO (Last In First Out) dengan kedalaman maksimal 1024 elemen, masing-masing 256-bit. Sangat murah gas.
2. **Memory**: Ruang memori sementara (*volatile*) yang bertahan hanya selama transaksi berlangsung. Biaya gas meningkat kuadratis seiring ukurannya bertambah.
3. **Storage**: Penyimpanan persisten (*non-volatile*) di mana variabel state kontrak disimpan di hard disk node. Sangat mahal gas.
4. **Calldata**: Ruang memori read-only yang berisi argumen data yang dikirimkan saat memanggil fungsi kontrak.

---

## 3. Opcodes Kunci dalam ERC-4337 Account Abstraction

Dalam Tugas Akhir tentang Account Abstraction ini, terdapat beberapa opcode krusial yang menjadi tulang punggung sistem:

### A. Opcode `CREATE2` (`0xF5`)
* **Fungsi:** Membuat smart contract baru di blockchain dengan alamat yang **deterministik (pasti)** sebelum kontrak tersebut dideploy secara fisik.
* **Perbedaan dengan `CREATE` (`0xF0`):**
  * `CREATE`: Alamat dihitung dari `hash(sender, nonce)`. Jika urutan transaksi berubah, alamat wallet berubah.
  * `CREATE2`: Alamat dihitung dari formula:
    ```
    address = keccak256( 0xff ++ factoryAddress ++ salt ++ keccak256(initCode) )[12:]
    ```
* **Relevansi ERC-4337:**
  Memungkinkan user (seperti Andi) mendapatkan alamat walletnya secara instan di frontend tanpa perlu membayar gas deploy saat pertama kali registrasi (*counterfactual address*). Akun baru benar-benar dideploy oleh `KernelFactory` via `CREATE2` ketika transaksi pertama dilakukan.

---

### B. Opcode `DELEGATECALL` (`0xF4`)
* **Fungsi:** Memanggil kode dari kontrak lain, namun **dieksekusi dalam konteks penyimpanan (storage) kontrak pemanggil**.
* **Cara Kerja:**
  Jika Akun A melakukan `DELEGATECALL` ke Kontrak B:
  * Logika kode yang berjalan adalah kode milik Kontrak B.
  * Namun jika kode tersebut mengubah variabel, yang berubah adalah **Storage milik Akun A**.
  * `msg.sender` dan `msg.value` tetap dipertahankan seperti pemanggil asli Akun A.
* **Relevansi ERC-4337 & ZeroDev Kernel:**
  1. **ERC-1967 Proxy:** Wallet user (Proxy) melakukan `DELEGATECALL` ke `Kernel Implementation`.
  2. **Modular Plugins:** Kernel Account user meminjam logika verifikasi tanda tangan dari `PasskeyValidator` menggunakan `DELEGATECALL`.

---

### C. Opcode `STATICCALL` (`0xFA`)
* **Fungsi:** Mirip seperti `CALL`, tetapi bersifat **Read-Only**.
* **Keamanan:** Jika kontrak target mencoba melakukan perubahan state (seperti menjalankan `SSTORE`, `CREATE`, atau mentransfer ETH), EVM akan langsung membatalkan eksekusi (*revert*).
* **Relevansi ERC-4337:**
  Bundler ERC-4337 menggunakan simulasi `STATICCALL` untuk memeriksa validitas `UserOperation` di fase simulasi lokal agar terhindar dari spam transaksi palsu tanpa mengeluarkan biaya gas di jaringan asli.

---

### D. Opcode `SSTORE` (`0x55`) & `SLOAD` (`0x54`)
* **Fungsi:** Menulis (`SSTORE`) dan membaca (`SLOAD`) ke slot storage 256-bit di blockchain.
* **Relevansi ERC-1967:**
  Standar ERC-1967 menggunakan `SLOAD` dan `SSTORE` pada slot khusus:
  `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
  untuk membaca alamat logika implementasi kontrak tanpa menimpa variabel milik user.

---

## 4. Tabel Ringkasan Opcode Penting

| Opcode | Hex | Gas Minimum | Deskripsi Singkat | Peran di TA |
| :--- | :--- | :--- | :--- | :--- |
| **STOP** | `0x00` | 0 | Menghentikan eksekusi secara normal | Akhir eksekusi kontrak |
| **ADD** | `0x01` | 3 | Penjumlahan stack | Operasi matematika umum |
| **KECCAK256** | `0x20` | 30 + gas data | Menghitung hash Keccak-256 | Menghitung hash ID passkey & alamat CREATE2 |
| **SLOAD** | `0x54` | 100 - 2100 | Membaca dari storage permanen | Membaca data proxy & konfigurasi validator |
| **SSTORE** | `0x55` | 100 - 22100 | Menulis ke storage permanen | Menyimpan status tiket NFT & plugin akun |
| **CALL** | `0xF1` | 100 - 2600 | Memanggil akun/kontrak lain | Eksekusi transfer tiket NFT atau pembayaran |
| **DELEGATECALL** | `0xF4` | 100 - 2600 | Menjalankan kode pihak ketiga di storage sendiri | Proxy ERC-1967 & Plugin Passkey Validator |
| **CREATE2** | `0xF5` | 32000 | Deploy kontrak dengan alamat deterministik | Pembuatan akun baru oleh KernelFactory |
| **STATICCALL** | `0xFA` | 100 - 2600 | Panggilan aman tanpa modifikasi state | Simulasi validasi UserOp oleh Bundler |
| **REVERT** | `0xFD` | 0 + gas data | Membatalkan eksekusi dan mengembalikan sisa gas | Menolak transaksi jika passkey tidak sah |

---

## 5. Pemetaan Implementasi Opcode Nyata pada Repositori Skripsi

Setiap instruksi opcode di atas diimplementasikan secara nyata pada baris kode proyek ini:

| Opcode | Contoh Baris Kode Nyata | File Sumber & Nomor Baris | Keterangan Eksekusi |
| :--- | :--- | :--- | :--- |
| **`CREATE` (`0xF0`)** | `TicketContract ticket = new TicketContract();` | [`contracts/script/Deploy.s.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/script/Deploy.s.sol) (Baris 17) | Foundry men-deploy bytecode kontrak ke Sepolia via transaksi `to: null`. |
| **`CREATE2` (`0xF5`)** | `KernelFactory.createAccount(...)` | `ZeroDev KernelFactory.sol` | Menghitung alamat dompet Smart Account pengguna secara deterministik (*counterfactual*). |
| **`SSTORE` (`0x55`)** | `_tickets[tokenId] = TicketInfo(...)`<br>`_tickets[tokenId].used = true;` | [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 195–200 & 225) | Menulis data struct tiket NFT baru dan mengubah status check-in ke penyimpanan permanen blockchain. |
| **`SLOAD` (`0x54`)** | `if (_tickets[tokenId].used)` | [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 216) | Membaca status penggunaan tiket dari storage node sebelum mengizinkan penukaran. |
| **`STATICCALL` (`0xFA`)** | `this.publicClient.readContract({ ... })` | [`backend/src/tickets/tickets.service.ts`](file:///d:/STEVE/Project%20NFT%20Marketplace/backend/src/tickets/tickets.service.ts) (Baris 128 & 136) | Panggilan membaca `getTicket` dan `ownerOf` tanpa bayar gas (read-only). |
| **`REVERT` (`0xFD`)** | `revert TicketAlreadyUsed(tokenId);` | [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 217) | Membatalkan eksekusi secara instan jika tiket sudah pernah dipakai masuk. |

---

## 6. Sumber & Referensi Resmi

1. **Ethereum Yellow Paper (Gavin Wood):**
   * Link: https://ethereum.github.io/yellowpaper/paper.pdf
   * Bagian: *Appendix H: Virtual Machine Specification* (Daftar matematis seluruh opcode EVM).
2. **EVM Codes (Interactive EVM Reference):**
   * Link: https://www.evm.codes/
   * Referensi interaktif untuk mengecek biaya gas, input/output stack, dan contoh eksekusi seluruh opcode.
3. **Dokumentasi Resmi Solidity - Inline Assembly & Yul:**
   * Link: https://docs.soliditylang.org/en/latest/assembly.html
