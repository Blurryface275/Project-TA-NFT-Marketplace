# 05 — Smart Contract

## Perumpamaan: mesin penjual otomatis

Smart contract itu mesin penjual otomatis yang aturannya **dicetak di dalam
mesin**. Tidak ada kasir yang bisa dibujuk. Sekali dipasang di blockchain,
semua orang bisa membaca aturannya — dan **semua orang bisa menekan
tombolnya**, termasuk orang yang tidak lewat situs web kami. Itu bukan cacat;
itu sifat blockchain. Makanya tombol-tombol penting butuh **stempel** dari
server (dijelaskan di bawah).

Ada dua mesin:

| Mesin | Perannya | Status |
|---|---|---|
| `TicketContract` | **Pabrik tiket.** Satu pabrik untuk semua event, dibedakan nomor event | ✅ setengah jadi |
| `MarketplaceContract` | **Satu-satunya loket jual ulang resmi** | 🚧 belum dibuat, bentuknya 🔶 masih dibahas |

## Aturan yang dipaksa mesin

| Aturan | Artinya | Di kode |
|---|---|---|
| Kuota per kategori | Terjual tidak bisa melebihi kuota — bahkan oleh pemilik sistem | ✅ tersimpan (`quota`, `minted`) · 🚧 belum dipaksa saat cetak |
| Harga asli permanen | `originalPrice` dicatat saat cetak, tidak bisa diubah | ✅ ada di struct · 🚧 belum diisi (cetak belum ada) |
| Pindah tangan hanya lewat loket resmi | Transfer langsung antar dompet ditolak; cetak dan bakar tetap boleh | 🚧 (penimpaan `_update`) |
| Harga jual ulang terkunci | Loket tidak punya parameter harga; harga = `originalPrice` | 🚧 (Marketplace) |
| Stempel server | Cetak butuh tanda tangan digital (EIP-712) dari alamat `systemSigner`, plus nomor sekali pakai dan batas waktu | 🚧 (`usedNonces` sudah ada) |
| Satu identitas per dompet | Dompet tanpa identitas terdaftar tidak bisa dapat tiket | 🔶 skema KYC belum putus (`userIdentities` sudah ada) |
| Batas tiket per dompet | `maxPerWallet` per event | ✅ tersimpan · 🔶 masih dipertahankan? |
| Tiket terpakai | Ditandai `used`, tidak bisa dipakai dua kali | 🚧 (boleh ditunda setelah kuesioner) |

## Apa yang benar-benar ada di `TicketContract.sol` (2 September 2026)

| Fungsi | Buat apa | Siapa boleh memanggil |
|---|---|---|
| `createEvent(eventId, organizer, eventTimestamp, maxPerWallet)` | Bikin event baru. Menolak: nomor 0, penyelenggara kosong, tanggal sudah lewat, batas 0, nomor sudah dipakai | Pemilik kontrak |
| `addCategory(eventId, categoryId, price, quota)` | Tambah kategori tiket ke event. Menolak: event tidak ada, angka 0, kategori sudah ada | Pemilik kontrak |
| `setSalesOpen(eventId, open)` | Buka/tutup penjualan | Penyelenggara event itu, atau pemilik kontrak |
| `setMarketplace(alamat)` | Daftarkan alamat loket resmi | Pemilik kontrak |
| `setSystemSigner(alamat)` | Daftarkan alamat pemberi stempel | Pemilik kontrak |

Plus: 7 pesan error khusus, struct `EventInfo` / `TicketCategory` /
`TicketInfo`, mapping `userIdentities` / `usedNonces` / `walletPurchases`.
Nama tokennya "NFTix" (simbol `NFTIX`).

**Belum ada:** `mintTicket` (cetak), `registerIdentity` (🔶), stempel
EIP-712, penimpaan `_update` (allowlist), `markUsed` (tandai terpakai), dan
seluruh `MarketplaceContract`.

**Tes:** baru dimulai — `contracts/test/TicketContract.t.sol` ada di komputer
lokal, belum di-commit. Sebelumnya nol tes.

## Catatan untuk yang menulis kode

- **OpenZeppelin 5:** pembatasan transfer lewat `_update`, bukan
  `_beforeTokenTransfer` (sudah dihapus). Di dalamnya, cetak (`from` = alamat
  nol) dan bakar (`to` = alamat nol) harus tetap lolos.
- **Stempel:** buat digest dengan `_hashTypedDataV4`, pulihkan penanda tangan
  dengan `ECDSA.recover` — cocok karena penanda tangannya server (dompet
  biasa). Kalau suatu saat dompet pengguna yang tanda tangan, pakai
  `SignatureChecker` (ERC-1271).
- **Mapping `events` dan `categories` bersifat `private`** → tes tidak bisa
  membaca isinya. Perlu fungsi baca (`getEvent`, `getCategory`).
- **Kompilator dikunci** di `foundry.toml`: Solidity 0.8.36, EVM prague. Ada
  dua `foundry.toml` (root dan `contracts/`) — jaga tetap identik.
- **Menjalankan:** `forge build` / `forge test` dari Git Bash (Foundry ada di
  `~/.foundry/bin`, tidak otomatis masuk PATH PowerShell).

Rincian versi pustaka dan jebakannya: `CLAUDE.md` Bagian 9.

## Cara mengujinya (ringkas)

Tiap fungsi: satu tes jalur sukses + **satu tes untuk setiap alasan
penolakan**. Skenario "harus gagal" sama pentingnya dengan "harus berhasil" —
inti proyek ini justru menolak kecurangan. Uji keamanan yang wajib
(terkunci di metodologi): transfer di luar loket **gagal**, jual ulang dengan
harga selain harga asli **gagal**. Rincian di `09-pengujian.md`.
