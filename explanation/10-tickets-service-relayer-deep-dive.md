# Penjelasan 10: Bedah Lengkap TicketsService (Mekanisme Relayer Transaksi Blockchain Tanpa Gas Bagi Pengguna)

Dokumen ini menjelaskan cara kerja file `backend/src/tickets/tickets.service.ts` menggunakan bahasa yang sederhana, analogi dunia nyata, serta diagram alur interaksi antara NestJS, Viem, dan Smart Contract di Sepolia.

---

## 1. Analogi Dunia Nyata: Siapa Sebenarnya `TicketsService`?

Bayangkan kamu datang ke sebuah konser megah:
* **Penonton (Asep)**: Pengguna awam yang hanya punya Email dan Sidik Jari (Passkey). Asep sama sekali **tidak punya koin crypto (ETH)** dan tidak mengerti cara kerja MetaMask.
* **Smart Contract (`TicketContract.sol`)**: Mesin cetak tiket otomatis yang berdiri di atas panggung blockchain Sepolia. Mesin ini hanya mau mencetak jika ada orang yang membayar biaya bensin (*Gas Fee*).
* **`TicketsService`**: **Petugas Loket / Kurir Resmi Penyelenggara**.
  * Petugas loket ini membawa kartu pembayaran resmi milik panitia (`ADMIN_PRIVATE_KEY`).
  * Ketika Asep menekan tombol *"Beli Tiket"* di web, Asep berkata ke Petugas: *"Tolong cetakkan tiket atas nama alamat dompet saya (0x811a...)"*.
  * Petugas loket inilah yang mendatangi mesin blockchain, membayar biaya cetak (Gas Fee) menggunakan saldo panitia, dan memasukkan tiket NFT nomor #1 langsung ke saku dompet Asep.

👉 **Hasilnya:** Asep mendapatkan tiket NFT resmi di blockchain tanpa perlu membeli koin crypto sepeser pun! Ini yang disebut konsep **Gasless User Experience**.

---

## 2. Diagram Alur Transaksi: Dari Klik Web Sampai Masuk Blok Sepolia

```
[Browser Pengguna]
       │
       │ 1. HTTP POST /api/tickets/mint { walletAddress: "0x811a...", eventId: 1, categoryId: 1 }
       ▼
[NestJS Controller]
       │
       │ 2. Data diperiksa kelengkapannya oleh DTO
       ▼
[TicketsService] ─── Menggunakan "Dua Tangan":
       │
       ├─── TANGAN KANAN: WalletClient (Pemegang Kunci Admin)
       │    └── Menandatangani transaksi: mintTicket("0x811a...", 1, 1)
       │    └── Mengirim ke Internet via Alchemy RPC
       │
       ▼
[Jaringan Blockchain Sepolia]
       │
       │ 3. Validator menambang transaksi ke dalam Blok (misal Blok #11745720)
       ▼
[TicketsService]
       │
       └─── TANGAN KIRI: PublicClient (Mata Pengawas)
            └── waitForTransactionReceipt: Menunggu konfirmasi bahwa transaksi SUDAH SAH
            └── Mengambil bukti Block Number dan Transaction Hash
       │
       ▼
[Respon ke Pengguna di Web]:
{
  "success": true,
  "message": "Tiket berhasil dicetak pada jaringan Sepolia Testnet",
  "txHash": "0x139bdcc...",
  "blockNumber": 11745720
}
```

---

## 3. Bedah Anatomi Kode `tickets.service.ts`

### A. Konstruktor: Mempersiapkan Peralatan Kerja
```ts
constructor(private configService: ConfigService) {
  const RPC_URL = this.configService.get<string>('SEPOLIA_RPC_URL')!;
  const privateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY') as `0x${string}`;
  this.contractAddress = this.configService.get<string>('TICKET_CONTRACT_ADDRESS') as `0x${string}`;

  // 1. Membuat akun penandatangan dari private key panitia
  this.account = privateKeyToAccount(privateKey);

  // 2. PublicClient: Mata pengawas (Read-Only)
  this.publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  // 3. WalletClient: Tangan eksekutor (State-Changing)
  this.walletClient = createWalletClient({
    account: this.account,
    chain: sepolia,
    transport: http(RPC_URL),
  });
}
```
* **`privateKeyToAccount`**: Mengubah private key heksadesimal menjadi identitas akun yang bisa menandatangani transaksi secara sah di memori server.
* **`publicClient`**: Saluran untuk membaca data dan menunggu konfirmasi.
* **`walletClient`**: Saluran untuk mengirim data baru ke blockchain.

---

### B. Fungsi `mintTicket`: Memerintahkan Kontrak Mencetak NFT
```ts
const hash = await this.walletClient.writeContract({
  address: this.contractAddress,
  abi: TICKET_CONTRACT_ABI,
  functionName: 'mintTicket',
  args: [
    dto.walletAddress as `0x${string}`,
    BigInt(dto.eventId),
    BigInt(dto.categoryId),
  ],
});
```

#### Pertanyaan Sering Muncul: Kenapa Pakai `BigInt()`?
* Di JavaScript biasa, tipe data `Number` hanya aman menampung angka hingga `9.007.199.254.740.991` (sekitar 9 kuadriliun).
* Sedangkan di Solidity, angka `uint256` bisa mencapai 78 digit.
* Agar tidak terjadi *overflow* atau salah hitung, Viem mewajibkan kita membungkus angka dengan **`BigInt(...)`** sebelum dikirim ke smart contract.

```ts
const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
```
* Baris ini menahan kode (*pause*) selama beberapa detik sampai validator Sepolia resmi memasukkan transaksi tersebut ke dalam blok.
* Objek `receipt` membuktikan bahwa transaksi **sudah 100% final dan tidak bisa dibatalkan lagi**.

---

### C. Fungsi `redeemTicket`: Menukar Tiket di Pintu Masuk
```ts
const hash = await this.walletClient.writeContract({
  address: this.contractAddress,
  abi: TICKET_CONTRACT_ABI,
  functionName: 'markUsed',
  args: [BigInt(tokenId)],
});
```
* Memanggil fungsi `markUsed` di smart contract.
* Smart contract akan memeriksa:
  1. Apakah tiket dengan ID tersebut ada?
  2. Apakah `used == false`?
* Jika valid, kontrak mengubah `used = true`.
* **Jika Tiket Di-Redeem Ulang:**
  Smart contract di Sepolia otomatis melempar error **`REVERT: TicketAlreadyUsed`**.
  Blok `catch (error: any)` menangkap penolakan tersebut dan langsung mengembalikan pesan error ke frontend:
  ```ts
  throw new BadRequestException('Tiket sudah pernah digunakan atau tidak valid!');
  ```

---

### D. Fungsi `getTicket`: Memeriksa Keaslian Tiket (Gratis Gas)
```ts
const ticket = await this.publicClient.readContract({
  address: this.contractAddress,
  abi: TICKET_CONTRACT_ABI,
  functionName: 'getTicket',
  args: [BigInt(tokenId)],
});
```
* Fungsi ini menggunakan **`readContract`** (bukan `writeContract`).
* Karena sifatnya hanya **membaca data (*view*)**, pemanggilan ini **100% GRATIS GAS** dan responnya instan dalam hitungan milidetik.
* Data yang didapat: `eventId`, `categoryId`, `originalPrice` (harga asli terkunci), dan status `used`.

---

## 4. Kamus Istilah Kunci untuk Sidang Tugas Akhir

1. **Relayer**:
   Pihak perantara (dalam hal ini server backend NestJS) yang membayarkan biaya gas blockchain untuk mempermudah pengguna awam.
2. **Transaction Hash (`txHash`)**:
   "Nomor Resi Pengiriman" unik berawalan `0x...` yang diberikan saat transaksi baru saja diserahkan ke jaringan.
3. **Transaction Receipt**:
   "Surat Tanda Terima Sah" yang baru keluar setelah transaksi selesai ditambang dan dimasukkan ke dalam blok blockchain.
4. **Gasless Onboarding**:
   Pengalaman pengguna di mana mereka menikmati seluruh manfaat keamanan teknologi Web3 tanpa perlu tahu apa itu gas fee atau membeli mata uang kripto.
