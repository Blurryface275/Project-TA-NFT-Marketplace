# Penjelasan 08: Arsitektur Multi-Event dalam 1 Kontrak & Kapasitas Penyimpanan Storage EVM

Dokumen ini mendokumentasikan secara ilmiah arsitektur relasi 1 Kontrak Marketplace berpasangan dengan 1 Kontrak Tiket, kapasitas penyimpanan data tiket di Ethereum Virtual Machine (EVM), serta perbandingannya dengan database relasional tradisional (MySQL).

---

## 1. Arsitektur Multi-Event: 1 Kontrak Master untuk Ribuan Event

Dalam sistem **NFTix**, timbul pertanyaan:
> *"Apakah 1 Marketplace Contract hanya akan melayani 1 alamat Contract Ticket yang sama? Apakah setiap event baru membutuhkan smart contract baru?"*

### Jawabannya:
**Satu `TicketContract` master menampung seluruh event, dan satu `MarketplaceContract` resmi bertindak sebagai pasar sekunder eksklusifnya.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              TicketContract Master (0x4A6e...F9b3)                      │
│                                                                         │
│  ├── Event #1: Konser Musik UBAYA (Organizer A)                         │
│  │    ├── Kategori #1: VIP (Rp 150.000, Kuota: 100)                     │
│  │    └── Kategori #2: Festival (Rp 75.000, Kuota: 500)                 │
│  ├── Event #2: Seminar AI & Cybersecurity (Organizer B)                 │
│  └── Event #N: Festival Jazz Surabaya (Organizer C)                     │
│                                                                         │
│  [Allowlist Guard]: Hanya MarketplaceContract yang boleh mentransfer    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                        Saling Terikat & Mengunci
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             MarketplaceContract Resmi (Pasar Sekunder)                  │
│                                                                         │
│  1. Membaca originalPrice langsung dari TicketContract (Anti-Markup)    │
│  2. Menerima hak transfer resmi dari allowlist TicketContract           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Keunggulan Arsitektur Ini untuk Tugas Akhir:
1. **Keamanan Tertutup Anti-Calo (*Tightly Coupled Allowlist*):**
   * Di dalam [`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) (Baris 50 & 147–153), alamat marketplace didaftarkan secara resmi via `setMarketplace(address _marketplace)`.
   * Fungsi transfer ERC-721 dibatasi agar hanya kontrak marketplace resmi yang berhak mengeksekusi pemindahan kepemilikan.
   * Akibatnya, tiket NFT ini **mustahil diperjualbelikan di platform pihak ketiga (seperti OpenSea atau Rarible)**. Calo tidak bisa memindahkan atau melelang tiket di luar kendali sistem.
2. **Kunci Harga Mutlak (*Resale Price-Lock*):**
   * Saat tiket dicetak, harga asli disimpan permanen pada `struct TicketInfo` ([`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) Baris 46 & 198: `originalPrice = price`).
   * Saat tiket dijual kembali di pasar sekunder, `MarketplaceContract` membaca langsung parameter `originalPrice` via fungsi `getTicket(tokenId)` (Baris 230–233). Calo sama sekali tidak memiliki kolom input untuk menaikkan harga tiket.
3. **Efisiensi Deployment:**
   * Penyelenggara acara (EO) baru tidak perlu mengeluarkan biaya gas besar (~0.05 ETH) untuk mendeploy smart contract baru setiap kali membuat konser. Cukup memanggil fungsi `createEvent` ([`contracts/src/TicketContract.sol`](file:///d:/STEVE/Project%20NFT%20Marketplace/contracts/src/TicketContract.sol) Baris 74–107) pada kontrak master yang sudah ada (~0.00005 ETH).

---

## 2. Kapasitas Penyimpanan Storage EVM: Berapa Batas Maksimalnya?

Timbul pertanyaan mengenai limitasi:
> *"Berapa jumlah maksimal event dan tiket yang bisa disimpan di dalam smart contract? Apakah tidak ada batasnya karena menggunakan database EVM?"*

Secara teknis: **Kapasitas ruang indeks EVM praktis TIDAK TERBATAS (*virtually infinite*)**.

### A. Kapasitas Ruang Indeks 256-Bit
Di dalam kontrak, pemetaan event dan tiket menggunakan tipe integer `uint256`:
```solidity
mapping(uint256 => EventInfo) private events;
mapping(uint256 => TicketInfo) private _tickets;
```

Batas angka maksimal dari `uint256` adalah:
```
2^256 - 1 = 115.792.089.237.316.195.423.570.985.008.687.907.853.269.984.665.640.564.039.457.584.007.913.129.639.935
(Sekitar 1,15 x 10^77)
```
Sebagai perbandingan ilmiah:
* Jumlah butir pasir di seluruh pantai dan gurun bumi diperkirakan: `7,5 x 10^18`.
* Jumlah total atom di seluruh alam semesta yang dapat diamati: `10^80`.

Artinya, ruang angka untuk membuat `eventId` dan `tokenId` tiket **tidak akan pernah habis** dalam sejarah komputasi.

---

### B. Cara Kerja Penempatan Slot di EVM
Berbeda dengan database relasional yang membutuhkan ukuran tabel kaku, EVM menggunakan **Sparse Storage Key-Value**:
* Setiap slot storage berukuran 32 bytes.
* Lokasi penyimpanan `events[eventId]` ditentukan oleh rumus hash Keccak-256:
  ```
  lokasiSlot = keccak256( abi.encode(eventId, posisiVariabel) )
  ```
* Terdapat `2^256` kemungkinan lokasi slot di memori blockchain Ethereum. Probabilitas dua event menempati slot yang sama karena tabrakan hash (*hash collision*) adalah 1 banding `2^256` (mustahil secara matematis).

---

### C. Batasan Nyata di Dunia Nyata (*Real-World Constraints*)

Meskipun kapasitas teoritisnya tidak terbatas, sistem blockchain memiliki batasan fisik dunia nyata:

1. **Batasan Ekonomi (*Gas Fee*):**
   * Menulis data baru ke slot storage kosong (`SSTORE`) membutuhkan biaya komputasi **20.000 Gas**.
   * Siapa pun boleh menyimpan jutaan tiket, asalkan pihak pemanggil (penyelenggara atau pembeli) membayar biaya gas tersebut ke penambang/validator jaringan.
2. **Batasan Tipe Data Struct di Kode Kita:**
   Untuk menghemat gas melalui teknik *struct packing*, beberapa variabel menggunakan tipe data berukuran lebih kecil dengan batasan wajar:
   * **`uint32 quota`**: Mampu menampung hingga `2^32 - 1 = 4.294.967.295` (4,29 Miliar tiket per kategori).
   * **`uint96 price`**: Mampu menampung harga hingga `2^96 - 1 ≈ 7,9 x 10^28` (Ratusan triliun kali lipat total uang beredar di dunia).
   * **`uint64 eventTimestamp`**: Mampu menampung detik UNIX hingga tahun 584 miliar Masehi.

---

## 3. Tabel Perbandingan: Database Tradisional vs Storage Smart Contract EVM

| Parameter | Database Tradisional (MySQL / PostgreSQL) | Database Blockchain EVM (Smart Contract) |
| :--- | :--- | :--- |
| **Kapasitas** | Dibatasi oleh kapasitas fisik hard disk server (misal 500 GB / 1 TB). Jika disk penuh, database *crash*. | **Praktis Tidak Terbatas** (`2^256` slot alamat penyimpanan terdistribusi). |
| **Lokasi Fisik** | Terpusat di 1 server lokal / cloud (AWS, Google Cloud). | Terdistribusi dan tersalin di ribuan node validator di seluruh dunia. |
| **Titik Lemah (*SPOF*)** | Rentan *Single Point of Failure* (jika server mati, tiket tidak bisa diakses). | **Nol Down-time**; sistem tetap hidup selama jaringan Ethereum beroperasi. |
| **Integritas Data** | Admin database atau peretas dengan akses root bisa mengubah data tiket atau harga secara sepihak. | **Kekal (*Immutable*)**; harga asli dan kepemilikan terkunci permanen secara kriptografis. |
| **Biaya Skalabilitas** | Membutuhkan sewa server bulanan yang semakin mahal saat data membesar. | Bayar per aksi transaksi (*pay-per-execution via Gas*); data tersimpan permanen selamanya. |
