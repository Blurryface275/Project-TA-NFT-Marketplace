# Penjelasan 07: Mekanisme Deployment Smart Contract via Foundry & Analisis Script Deploy

Dokumen ini mendokumentasikan secara rinci mekanisme teknis di balik proses deployment smart contract ke jaringan blockchain (Sepolia Testnet), cara kerja cheatcode Foundry (`startBroadcast`), arti kata kunci `new` di level EVM, serta asal-usul parameter data yang diinisialisasi dalam script deployment.

---

## 1. Mekanisme Bagaimana Kode Bisa Ter-deploy ke Blockchain

Proses deployment kontrak pintar ke blockchain Ethereum bukanlah sekadar "mengunggah file", melainkan sebuah transaksi pembentukan kontrak (*contract creation transaction*). 

Di dalam file `contracts/script/Deploy.s.sol`, terdapat 3 elemen yang bekerja bersama:

```
[vm.startBroadcast] ──> [new TicketContract()] ──> [vm.stopBroadcast] ──> [--broadcast CLI]
  (Mulai Merekam &        (Opcode CREATE &           (Selesai Merekam)        (Kirim Transaksi
   Tandatangani Tx)       Transaksi to: null)                                  ke Node RPC Sepolia)
```

---

### A. Peran `vm.startBroadcast(deployerPrivateKey)`
Secara default, Foundry mengeksekusi kode Solidity hanya di memori komputer lokal (*sandbox EVM*). Kode tersebut tidak dikirim ke internet.
* Fungsi `vm.startBroadcast` menginstruksikan mesin Foundry:
  *"Mulai dari titik ini, rekam setiap transaksi yang terjadi, dan **tanda tangani (*sign*) secara kriptografis menggunakan `deployerPrivateKey`** agar sah dikirim ke jaringan publik."*

---

### B. Inti Deployment: Kata Kunci `new TicketContract()`
Baris kode inilah yang melahirkan kontrak baru di blockchain ([`contracts/script/Deploy.s.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/script/Deploy.s.sol) Baris 17):
```solidity
TicketContract ticket = new TicketContract();
```

Di balik layar mesin EVM (Ethereum Virtual Machine), baris tersebut mengeksekusi alur berikut:
1. **Penyusunan Creation Bytecode:** Kompiler Solc mengambil bytecode inisialisasi kontrak beserta constructor-nya.
2. **Transaksi Tanpa Alamat Tujuan (`to: null`):**
   Di protokol Ethereum, transaksi biasa selalu memiliki alamat penerima (`to: 0xAddress`). Namun, khusus untuk pembuatan kontrak baru, field **`to` dibiarkan kosong / bernilai `null`**.
3. **Eksekusi Opcode `CREATE`:**
   Node validator mendeteksi transaksi dengan `to: null` dan mengeksekusi opcode `CREATE`.
4. **Perhitungan Alamat Kontrak Baru:**
   Alamat kontrak baru dihitung secara deterministik menggunakan fungsi hash RLP:
   ```
   contractAddress = keccak256( rlp.encode([deployerAddress, nonce]) )[12:]
   ```
   Artinya, alamat kontrak ditentukan oleh **alamat dompet deployer** dan **nomor urut transaksi (*nonce*)** dompet tersebut.
5. Alamat kontrak baru yang dihasilkan disimpan ke variabel `ticket` (`address(ticket)`).

---

### C. Peran Flag `--broadcast` di CLI Terminal
Script Solidity di atas hanya bertugas memaketkan dan menandatangani transaksi. Pengiriman fisik ke internet dilakukan oleh perintah terminal:

```powershell
forge script script/Deploy.s.sol:DeployScript --rpc-url <RPC_URL> --broadcast
```

* **Tanpa `--broadcast` (Dry-run):** Foundry hanya menyimulasikan di laptop apakah proses deploy berhasil atau gagal, mencatat perkiraan konsumsi gas, tanpa memotong saldo ETH.
* **Dengan `--broadcast`:** Foundry mengambil transaksi yang sudah ditandatangani, lalu mengirimkannya ke mempool validator Sepolia melalui protokol RPC Ethereum standar:
  ```json
  eth_sendRawTransaction("0x02f8...")
  ```

---

## 2. Asal-Usul & Referensi Nilai Parameter di `Deploy.s.sol`

Semua data yang diisi dalam script deployment berasal dari aturan yang telah dirancang pada kontrak `TicketContract.sol` dan file pengujian `TicketContract.t.sol`:

### A. Data Pengirim (Deployer)
* **`vm.envUint("PRIVATE_KEY")`**: Membaca nilai dari file `contracts/.env`.
* **`deployerAddress = vm.addr(deployerPrivateKey)`**: Menghitung alamat publik dari private key tersebut via kurva secp256k1 (menghasilkan `0x8C2CF82F2856...`).

### B. Parameter Inisialisasi Event (`createEvent`)
Diambil dari [`contracts/script/Deploy.s.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/script/Deploy.s.sol) (Baris 20–25) yang memanggil [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 74–107):
```solidity
uint256 eventId = 1;
uint64 eventTimestamp = uint64(block.timestamp + 30 days);
uint32 maxPerWallet = 4;
ticket.createEvent(eventId, deployerAddress, eventTimestamp, maxPerWallet);
```
1. **`eventId = 1`**: ID unik event perdana (karena `TicketContract.sol` melarang ID nol: `if(eventId == 0) revert ForbiddenZero()`).
2. **`organizer = deployerAddress`**: Menetapkan dompet deployer sebagai pihak penyelenggara (*organizer*) agar memiliki hak akses membuka atau menutup penjualan tiket (`setSalesOpen`).
3. **`eventTimestamp = block.timestamp + 30 days`**:
   Di `TicketContract.sol` (Baris 84–86) terdapat guard clause:
   ```solidity
   if (eventTimestamp <= block.timestamp) revert EventAlreadyPassed();
   ```
   Tanggal konser **wajib berada di masa depan**. Nilai diatur 30 hari ke depan agar status event valid dan aktif.
4. **`maxPerWallet = 4`**:
   Diambil dari konstanta unit test di [`contracts/test/TicketContract.t.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/test/TicketContract.t.sol) Baris 21:
   ```solidity
   uint32 public constant MAX_PER_WALLET = 4;
   ```
   Batas maksimal 4 tiket per dompet untuk mencegah aksi borong calo.

### C. Parameter Inisialisasi Kategori Tiket (`addCategory`)
Diambil dari [`contracts/script/Deploy.s.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/script/Deploy.s.sol) (Baris 27–32) yang memanggil [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 109–134):
```solidity
uint256 categoryId = 1;
uint96 price = 150_000;
uint32 quota = 100;
ticket.addCategory(eventId, categoryId, price, quota);
```
1. **`categoryId = 1`**: ID kategori pertama untuk Event #1 (misal kategori VIP).
2. **`price = 150_000` (Rp 150.000)**:
   Diambil dari nilai uji di `contracts/test/TicketContract.t.sol` baris 19:
   ```solidity
   uint96 public constant PRICE = 150_000;
   ```
   Nominal harga resmi tiket dari penyelenggara yang akan dikunci permanen on-chain (*originalPrice*).
3. **`quota = 100`**:
   Jumlah kuota tiket yang disediakan. Jika penjualan mencapai 100 tiket, kontrak otomatis menolak pembelian baru dengan `QuotaExceeded()`.

---

## 3. Catatan Troubleshooting Eksekusi di Windows PowerShell

1. **Path Binary Foundry di Windows:**
   Jika perintah pendek `forge` belum terdaftar di Environment Variable `PATH`, gunakan path absolut:
   `C:\Users\<Username>\.foundry\bin\forge.exe`.
2. **Sub-command `script`:**
   Format pemanggilan script Foundry wajib menyertakan kata `script`:
   ```powershell
   forge script script/Deploy.s.sol:DeployScript --rpc-url <RPC_URL> --broadcast
   ```
