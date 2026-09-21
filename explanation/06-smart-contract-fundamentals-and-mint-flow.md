# Penjelasan 06: Fondasi Smart Contract Solidity & Alur Eksekusi Minting Tiket

Dokumen ini mendokumentasikan secara rinci arsitektur objek tiket di smart contract, fungsi kata kunci dasar Solidity (`error`, `revert`, `event`, `emit`, `external`, `public`, `view`, `pure`), teknik optimasi gas via *Struct Packing*, serta alur eksekusi baris demi baris saat pembelian tiket NFT.

---

## 1. Bentuk "Object" Tiket di Smart Contract

Smart Contract Solidity tidak memiliki sistem kelas (*class*) seperti bahasa berorientasi objek (OOP) murni. Untuk merepresentasikan sebuah objek tiket, sistem menggabungkan dua konsep utama: **`struct`** dan **`mapping`**.

### A. Cetak Biru Tiket (`struct TicketInfo`)
Didefinisikan di [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 43–48):
```solidity
struct TicketInfo {
    uint256 eventId;       // Pengenal event tempat tiket ini berlaku
    uint256 categoryId;    // Kategori tiket (VIP, CAT 1, Festival, dsb.)
    uint96 originalPrice;  // Harga resmi dari penyelenggara (dikunci permanen)
    bool used;             // Status penggunaan: false (belum dipakai), true (sudah dipakai)
}
```

### B. Lemari Penyimpanan Tiket (`mapping`)
Didefinisikan di [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 53):
```solidity
mapping(uint256 => TicketInfo) private _tickets;
```
* Pemetaan ini bertindak sebagai tabel *key-value*:
  * **Key**: `uint256 tokenId` (nomor urut tiket: 1, 2, 3, ...).
  * **Value**: Instansiasi objek data `TicketInfo`.
* **Pencatatan Kepemilikan (ERC-721):**
  Identitas dompet pemilik tiket tidak disimpan di dalam struct `TicketInfo`, melainkan dikelola oleh protokol standar ERC-721 OpenZeppelin melalui mapping internal:
  ```solidity
  _owners[tokenId] = address(ownerWallet);
  ```

---

## 2. Fungsi `error`, `revert`, `event`, dan `emit`

Empat kata kunci ini adalah pilar kontrol alur, penanganan kesalahan, dan pencatatan riwayat di EVM:

| Kata Kunci | Peran & Definisi | Karakteristik Gas & Mekanisme |
| :--- | :--- | :--- |
| **`error`** | Mendefinisikan tipe kesalahan khusus (*Custom Error*). | **Sangat Hemat Gas (EIP-838)**. Hanya memakan 4 byte hash selektor signature error, menggantikan string pesan panjang. |
| **`revert`** | Menghentikan eksekusi seketika dan membatalkan seluruh perubahan state. | Mengembalikan seluruh status penyimpanan database ke kondisi sebelum transaksi dipanggil dan mengembalikan sisa gas ke pengguna. |
| **`event`** | Mendefinisikan skema log/pengumuman yang dicatat ke history blockchain. | Menggunakan instruksi EVM `LOG0` - `LOG4`. Jauh lebih murah daripada menyimpan variabel ke storage permanen. |
| **`emit`** | Perintah untuk memancarkan log event tersebut secara nyata ke blockchain. | Memicu pencatatan data log yang dapat didengarkan secara real-time oleh frontend, The Graph, atau **Etherscan**. |

---

## 3. Kata Kunci Visibilitas & Mutabilitas Fungsi

### A. Visibilitas (*Visibility*): Siapa yang Berhak Memanggil?
1. **`external`**:
   * Fungsi **hanya dapat dipanggil dari luar kontrak** (oleh frontend pengguna, backend server, atau kontrak lain).
   * **Optimasi Gas:** Argumen fungsi `external` dibaca langsung dari `calldata` tanpa perlu disalin ke `memory`, sehingga menghemat gas secara signifikan. Digunakan pada `mintTicket` dan `markUsed`.
2. **`public`**:
   * Dapat dipanggil dari luar kontrak **maupun** dari dalam kontrak itu sendiri.
3. **`internal`**:
   * Hanya dapat dipanggil oleh kontrak itu sendiri dan kontrak anak yang mewarisinya (*inheritance*).
4. **`private`**:
   * Hanya dapat dipanggil oleh fungsi di dalam kontrak itu sendiri; kontrak turunan tidak memiliki hak akses.

### B. Mutabilitas State (*State Mutability*): Apakah Mengubah Blockchain?
1. **Fungsi Transaksi Biasa (State-changing)**:
   * Menulis atau mengubah data pada storage blockchain (misal: menambah saldo, mengubah kepemilikan).
   * **Memerlukan biaya Gas (Gas Fee)** saat dieksekusi di jaringan.
2. **`view`**:
   * Fungsi hanya **membaca data** dari storage tanpa mengubah apapun (contoh: `getTicket(tokenId)`).
   * **Gratis Gas** jika dipanggil secara read-only oleh pengguna melalui node RPC.
3. **`pure`**:
   * Fungsi **tidak membaca dan tidak menulis** ke storage blockchain. Murni komputasi matematika deterministik (misal menghitung formula konversi angka).
   * **Gratis Gas** saat dipanggil off-chain.

---

## 4. Alasan Variasi Tipe Data `uint` (Teknik *Struct / Storage Packing*)

Pertanyaan penting:
> *"Mesin EVM bekerja dalam basis kata 256-bit (32 bytes). Mengapa tidak menggunakan uint256 untuk semua variabel?"*

Jawabannya adalah teknik penghematan biaya gas fundamental bernama **Struct Packing (Penyusunan Slot Memori)**.

Di dalam blockchain Ethereum, storage dibagi menjadi slot-slot berukuran tepat **32 Bytes (256 bits)**. Operasi penulisan pertama kali ke storage baru (`SSTORE`) dikenakan biaya komputasi yang sangat mahal: **20.000 Gas**.

### Perbandingan Efisiensi Slot:

#### Skenario Tanpa Packing (Semua `uint256`):
```solidity
struct TicketInfoUnpacked {
    uint256 eventId;       // 32 bytes -> Slot 1 (20.000 Gas)
    uint256 categoryId;    // 32 bytes -> Slot 2 (20.000 Gas)
    uint256 originalPrice; // 32 bytes -> Slot 3 (20.000 Gas)
    uint256 used;          // 32 bytes -> Slot 4 (20.000 Gas)
}
// Total: 4 Slot Penyimpanan = 80.000 Gas per tiket!
```

#### Skenario Dengan Packing (Yang Diterapkan di `TicketContract.sol`):
```solidity
struct TicketInfo {
    uint256 eventId;       // 32 bytes -> Slot 1 (20.000 Gas)
    uint256 categoryId;    // 32 bytes -> Slot 2 (20.000 Gas)
    uint96 originalPrice;  // 12 bytes ┐ Digabung (PACKED)
    bool used;             //  1 byte  ┘ ke dalam Slot 3 yang sama! (20.000 Gas)
}
// Total: 3 Slot Penyimpanan = 60.000 Gas per tiket!
```

* **Penghematan Nyata:**
  Setiap kali seorang pembeli mencetak tiket, kontrak **menghemat 20.000 Gas** secara permanen.
* **Kapasitas Tipe Data:**
  * `uint96`: Mampu menampung angka desimal hingga 79 octillion ($7,9 \times 10^{28}$), lebih dari cukup untuk nominal mata uang fiat Rupiah maupun Wei.
  * `uint64`: Mampu menampung timestamp detik UNIX hingga tahun 584 miliar Masehi.
  * `uint32`: Mampu menampung kuota hingga 4,29 miliar tiket.

---

## 5. Simulasi Alur Eksekusi Baris Demi Baris Saat Pembelian Tiket (`mintTicket`)

Misalkan seorang pengguna (Andi) dengan Smart Account `0x811a...` membeli tiket untuk **Event ID 1** dengan **Kategori ID 1 (VIP)**.

Frontend / Backend memanggil fungsi pada [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 163–209):
```solidity
function mintTicket(address to, uint256 eventId, uint256 categoryId) external returns (uint256)
// Parameter riil pemanggilan: (to: 0x811a..., eventId: 1, categoryId: 1)
```

Berikut alur eksekusi internal di smart contract:

```
[Pemanggilan mintTicket]
         │
         ▼
[1. Pemeriksaan Guard Clauses]
  ├── to != address(0)
  ├── events[1].exists == true
  ├── events[1].salesOpen == true
  ├── categories[1][1].exists == true
  ├── cat.minted < cat.quota
  └── walletPurchases[1][to] < maxPerWallet
         │
         ▼
[2. Pembaruan State (Counter & Kuota)]
  ├── _nextTokenId++ (misal jadi #1)
  ├── cat.minted++
  └── walletPurchases[1][to]++
         │
         ▼
[3. Penguncian Harga Anti-Scalping]
  └── _tickets[1] = TicketInfo(eventId: 1, categoryId: 1, originalPrice: 150000, used: false)
         │
         ▼
[4. OpenZeppelin ERC-721 _safeMint]
  ├── _owners[1] = 0x811a...
  ├── _balances[0x811a...] += 1
  └── emit Transfer(address(0), 0x811a..., 1)
         │
         ▼
[5. Emisi Event & Return]
  ├── emit TicketMinted(tokenId: 1, eventId: 1, categoryId: 1, buyer: 0x811a..., price: 150000)
  └── return tokenId (1)
```

### Rincian Tahapan:

1. **Tahap Guard Clauses (Pencegahan Pelanggaran):**
   * Memastikan alamat penerima valid (`ForbiddenZero`).
   * Memastikan event terdaftar dan pintu penjualan dibuka oleh penyelenggara (`SalesClosed`).
   * Memastikan kuota belum habis (`QuotaExceeded`).
   * Memastikan pembeli belum melampaui batas maksimal per dompet (`MaxPerWalletExceeded`).
2. **Tahap Mutasi Status:**
   * Nomor ID token dinaikkan (`_nextTokenId++`).
   * Jumlah tiket terjual pada kategori tersebut bertambah.
   * Catatan jumlah kepemilikan dompet Andi bertambah 1.
3. **Tahap Kunci Harga Asli (Anti-Scalping Core):**
   * Harga kategori resmi diambil (`uint96 price = cat.price`).
   * Data tiket dimasukkan ke mapping `_tickets[1]` dengan `used = false` dan `originalPrice = price`. Data harga ini dikunci permanen on-chain sehingga tidak bisa di-markup pada pasar sekunder.
4. **Tahap Minting ERC-721 (`_safeMint`):**
   * Mengalokasikan kepemilikan token ID #1 ke dompet Smart Account Andi.
   * Memeriksa apakah penerima adalah smart contract yang mendukung penerimaan ERC-721 (`IERC721Receiver`).
5. **Tahap Emisi Log Event & Notifikasi:**
   * Memancarkan event `TicketMinted`. Log ini langsung ditangkap oleh Etherscan dan antarmuka web Next.js untuk mengarahkan pengguna ke halaman **"My Ticket"**.
