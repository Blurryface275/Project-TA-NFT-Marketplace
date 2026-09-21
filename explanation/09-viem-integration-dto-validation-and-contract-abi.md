# Penjelasan 09: Integrasi Viem di NestJS, Validasi DTO, dan Standar ABI Smart Contract

Dokumen ini mendokumentasikan secara rinci arsitektur penjembatan antara HTTP API (NestJS) dan jaringan blockchain Ethereum (Viem), peran validasi DTO (*Data Transfer Object*), konsep ABI (*Application Binary Interface*), aturan pemetaan event dan parameter `indexed`, serta alasan teknis di balik penulisan `as const` pada pustaka Viem.

---

## 1. Arsitektur Relayer: Menghubungkan Web2 (NestJS) ke Web3 (Sepolia)

Dalam sistem ticketing berbasis Account Abstraction ini, penonton konser adalah pengguna umum yang **tidak memiliki saldo Sepolia ETH** di dompetnya. 

Oleh karena itu, backend NestJS bertindak sebagai **Relayer & Transactor**:

```
┌──────────────────────────┐             ┌──────────────────────────┐
│    Frontend (Next.js)    │             │     Backend (NestJS)     │
│                          │  HTTP POST  │                          │
│  User klik "Beli Tiket"  ├────────────>│  1. Validasi DTO         │
│  (Kirim alamat wallet)   │  /mint      │  2. Viem WalletClient    │
└──────────────────────────┘             │  3. Sign & Kirim ke RPC  │
                                         └────────────┬─────────────┘
                                                      │
                                           eth_sendRawTransaction
                                                      │
                                                      ▼
                                         ┌──────────────────────────┐
                                         │  TicketContract.sol      │
                                         │  (Jaringan Sepolia)      │
                                         │                          │
                                         │  _safeMint(buyerWallet)  │
                                         └──────────────────────────┘
```

---

## 2. Kode DTO (Data Transfer Object) & Bedah Fungsinya

DTO bertindak sebagai pintu gerbang (*gatekeeper*) yang memvalidasi data JSON dari frontend sebelum diteruskan ke fungsi blockchain.

### A. Kode: `backend/src/tickets/dto/mint-ticket.dto.ts`
```ts
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class MintTicketDto {
    @IsNotEmpty()
    @IsString()
    walletAddress: string;

    @IsNotEmpty()
    @IsNumber()
    eventId: number;

    @IsNotEmpty()
    @IsNumber()
    categoryId: number;
}
```

#### Penjelasan Baris Kode:
* **`@IsNotEmpty()`**: Mencegah request dengan nilai kosong, null, atau undefined.
* **`@IsString() walletAddress`**: Memastikan alamat wallet yang dikirim berformat teks (misal `0x811a...`).
* **`@IsNumber() eventId` & `categoryId`**: Memastikan parameter ID event dan kategori adalah integer yang valid, bukan string sembarangan atau objek.

### B. Kode: `backend/src/tickets/dto/redeem-ticket.dto.ts`
```ts
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RedeemTicketDto {
  @IsNotEmpty()
  @IsNumber()
  tokenId: number;
}
```

#### Mengapa DTO Sangat Penting di Aplikasi Web3?
1. **Pencegahan Transaksi Sia-Sia (*Gas Waste Prevention*):**
   Setiap transaksi on-chain ke blockchain memotong biaya Gas asli (Sepolia ETH). Jika pengguna mengirim data yang salah (misal: `walletAddress` kosong atau `eventId` bukan angka), memanggil smart contract akan menyebabkan transaksi gagal (*revert*), namun gas fee tetap hangus terpotong.
2. **Keamanan Lapisan Pertama:**
   DTO menghadang data kotor di tingkat HTTP server sebelum kode menyentuh node RPC blockchain.

---

## 3. Kode ABI Smart Contract (`ticket-abi.ts`) & Bedah Strukturnya

Smart contract yang telah dideploy ke Sepolia hanya berupa **Bytecode Heksadesimal Mesin** (seperti `0x608060405234...`). Mesin JavaScript di Node.js / NestJS tidak tahu nama fungsi apa saja yang ada di dalamnya atau urutan argumennya.

**ABI (Application Binary Interface)** adalah kamus/antarmuka berformat JSON yang mendeskripsikan spesifikasi fungsi kontrak kepada runtime JavaScript.

### Kode Lengkap: `backend/src/tickets/ticket-abi.ts`
```ts
export const TICKET_CONTRACT_ABI = [
  {
    // Fungsi Pencetakan Tiket NFT
    type: 'function',
    name: 'mintTicket',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'categoryId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }], // Mengembalikan nomor tokenId baru
    stateMutability: 'nonpayable', // Fungsi transaksi biasa (tidak menerima kiriman ETH)
  },
  {
    // Fungsi Redeem / Pakai Tiket di Lokasi Acara
    type: 'function',
    name: 'markUsed',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    // Fungsi Pembaca Data Tiket untuk Dashboard
    type: 'function',
    name: 'getTicket',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple', // Tipe tuple merepresentasikan struct TicketInfo
        components: [
          { name: 'eventId', type: 'uint256' },
          { name: 'categoryId', type: 'uint256' },
          { name: 'originalPrice', type: 'uint96' },
          { name: 'used', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view', // Read-only, gratis gas
  },
  {
    // Standar ERC-721: Mengecek Pemilik Tiket
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    // Log Event Pencetakan Tiket On-Chain
    type: 'event',
    name: 'TicketMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'eventId', type: 'uint256', indexed: true },
      { name: 'categoryId', type: 'uint256', indexed: false },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'price', type: 'uint96', indexed: false },
    ],
  },
] as const;
```

---

## 4. Aturan Pemetaan Event & Parameter `indexed`

Perhatikan pemetaan pada event `TicketMinted`:

### Di Solidity (`TicketContract.sol` baris 65):
```solidity
event TicketMinted(
    uint256 indexed tokenId, 
    uint256 indexed eventId, 
    uint256 categoryId,        // NON-INDEXED (Data Payload)
    address indexed buyer, 
    uint96 price              // NON-INDEXED (Data Payload)
);
```

### Aturan Sinkronisasi ke ABI:
* Di mesin EVM, event maksimal hanya memiliki **3 parameter `indexed`** (Topic 1, Topic 2, dan Topic 3).
* Parameter `indexed: true` disimpan dalam header log (*Topics*), sehingga bisa difilter secara instan oleh RPC (misal: *"Cari semua tiket milik buyer 0x811a..."*).
* Parameter `indexed: false` disimpan di badan data log (*Data Payload*).
* **PENTING:** Atribut `indexed` di ABI wajib **sama persis** dengan di Solidity agar pustaka Viem tidak salah membaca letak byte saat mendekode log dari Sepolia.

---

## 5. Mengapa Viem Mewajibkan Penulisan `as const`?

Di akhir array ABI, ditambahkan kata kunci TypeScript:
```ts
] as const; // <-- TypeScript Const Assertion
```

### Penjelasan Teknis Mesin ABIType di Viem:
* **Tanpa `as const`:**
  TypeScript menganggap variabel tersebut sebagai array objek biasa (`Array<{ type: string, name: string }>`). Tipe nama fungsi menjadi string umum (`string`), sehingga editor tidak bisa memeriksa apakah nama fungsi benar atau salah.
* **Dengan `as const`:**
  TypeScript mengunci seluruh nilai di dalam array sebagai **tipe literal readonly (*literal types*)**.
* **Manfaat Nyata bagi Developer:**
  Saat memanggil fungsi kontrak di NestJS:
  ```ts
  client.writeContract({
    abi: TICKET_CONTRACT_ABI,
    functionName: 'mintTicket', // <-- Autocomplete nama fungsi muncul otomatis!
    args: [buyerWallet, 1n, 1n] // <-- TypeScript memvalidasi tipe argumen secara ketat!
  });
  ```
  1. Editor otomatis memberikan rekomendasi (*autocomplete*).
  2. Jika kamu memasukkan argumen yang salah tipe atau kurang, TypeScript langsung memunculkan garis merah error sebelum program dijalankan (*compile-time safety*).

---

## 6. Dua Klien Utama Viem di Backend Service

Di dalam `tickets.service.ts`, Viem membagi tugas menjadi 2 klien:

1. **`PublicClient` (Hanya Membaca - Read Only):**
   * Digunakan untuk memanggil fungsi `view` (seperti `getTicket(tokenId)` atau `ownerOf(tokenId)`).
   * Digunakan untuk menunggu bukti transaksi selesai (*Wait for Transaction Receipt*).
   * **Gratis Gas** (tidak membutuhkan private key).
2. **`WalletClient` (Menulis ke Blockchain - State Changing):**
   * Dihubungkan dengan `privateKeyToAccount(ADMIN_PRIVATE_KEY)`.
   * Digunakan untuk menandatangani dan mengirim transaksi yang mengubah state (seperti `mintTicket` dan `markUsed`).
   * **Membutuhkan Gas Fee** dari saldo Sepolia ETH dompet admin relayer.
