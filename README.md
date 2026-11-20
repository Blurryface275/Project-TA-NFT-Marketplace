# Sistem Jual Beli Tiket Event Berbasis Non-Fungible Token (NFT)

> **Tugas Akhir — Teknik Informatika, Network & Cyber Security, Universitas Surabaya (2026)**
> **Penulis:** Benedictus Leonardo Edward Stephen Sugianto (NRP 160423176)
> **Dosen Pembimbing:** Maya Hilda Lestari Louk & Dr. Daniel Soesanto

Aplikasi web jual beli tiket event. Setiap tiket adalah satu NFT ERC-721 di Ethereum Sepolia Testnet. Sistem ini mencegah **pemalsuan tiket** dan **manipulasi harga di pasar sekunder (calo)**.

Prinsip utama:

1. **1 NFT = 1 tiket.** Kepemilikan tercatat on-chain (`ownerOf`), tidak bisa dipalsukan.
2. **Resale Price-Lock.** Harga jual kembali dikunci sama persis dengan `originalPrice`.
3. **Allowlist-Restricted Transfer.** NFT hanya bisa berpindah lewat `MarketplaceContract` resmi (override `_update`).
4. **Gasless (ERC-4337).** Pengguna memakai smart account berbasis passkey; gas disubsidi sistem dari biaya admin.
5. **Identitas KTP.** Hanya hash NIK (`keccak256`) yang disimpan on-chain di `userIdentities`; NIK mentah tidak disimpan.
6. **Pembayaran fiat simulasi.** Midtrans Sandbox Snap, tanpa uang nyata.

Spesifikasi lengkap: `dokumen/` (Proposal & Laporan TA) dan [docs/](docs/README.md).

---

## Arsitektur

```
Frontend (Next.js, :3000)  --HTTPS/REST-->  Backend (NestJS, :3001)
  passkey WebAuthn, Turnstile,                Auth & OTP email, KYC hash NIK,
  Midtrans Snap, e-ticket QR,                 webhook Midtrans, relayer EIP-712,
  katalog resale, scanner venue               Turnstile siteverify, upload Pinata
                                                 |            |            |
                                               MySQL     Sepolia RPC    IPFS (Pinata)
                                                         TicketContract
                                                         MarketplaceContract
```

| Folder | Isi |
|---|---|
| [contracts/](contracts/) | Foundry project: `TicketContract.sol`, `MarketplaceContract.sol`, unit test, `Deploy.s.sol` |
| [backend/](backend/) | NestJS 11 + TypeORM (MySQL). Modul `auth`, `customers`, `users`, `events`, `tickets` |
| [frontend/](frontend/) | Next.js 16 App Router + ZeroDev SDK + viem |
| [docs/](docs/) | Dokumentasi arsitektur, alur, istilah (Bahasa Indonesia) |
| `dokumen/` | Proposal & Laporan TA (patokan resmi) |
| [design/](design/) | ERD dan aset desain |

---

## Status Fitur

✅ selesai · 🚧 sebagian · ❌ belum

| Fitur | Status | Lokasi utama |
|---|:---:|---|
| Registrasi email + password, OTP email | ✅ | `backend/src/auth/` |
| Smart account passkey (ZeroDev, CREATE2) | ✅ | `frontend/src/lib/`, `POST /api/auth/setup-wallet` |
| KYC: hash NIK + `registerIdentity` on-chain | ✅ | `TicketContract.sol`, `auth.service.ts` |
| Buat event & kategori (on-chain + DB) | ✅ | `/dashboard/admin/events/new`, `events.service.ts` |
| Gambar tiket & metadata ke IPFS Pinata | ✅ | `events.service.ts` |
| Pembelian reguler: Turnstile → Midtrans → mint EIP-712 | ✅ | `/dashboard/buy`, `tickets.service.ts` |
| `maxPerWallet` | 🚧 | Ditegakkan on-chain; belum dicek di backend sebelum Snap dibuat |
| Cache tiket (`ticket_cache`) | ✅ | `tickets/entities/ticket-cache.entity.ts` |
| E-ticket & QR dinamis | ✅ | `/dashboard/tickets` |
| Pasar sekunder (list, cancel, beli via Midtrans) | ✅ | `MarketplaceContract.sol`, `/dashboard/resale` |
| Verifikasi venue (QR + NIK → `markUsed`) | ✅ | `/dashboard/verify`, `POST /api/tickets/verify-dual-scan` |
| Pemulihan akun (seed phrase BIP-39 + 2FA email) | ❌ | Belum ada kode |

---

## Prasyarat

- Node.js >= 20
- MySQL (port 3306)
- Foundry (`forge`, `cast`, `anvil`)
- Akun: Alchemy (Sepolia RPC), ZeroDev, Midtrans Sandbox, Mailtrap/SMTP, Cloudflare Turnstile, Pinata
- Wallet admin Sepolia berisi ETH testnet (deployer, relayer, `systemSigner`)

---

## Konfigurasi Environment

Berkas `.env` tidak di-commit. Buat sendiri dengan variabel berikut.

### `backend/.env`

| Variabel | Keterangan |
|---|---|
| `PORT` | Port API (default `3001`) |
| `FRONTEND_ORIGINS` | Origin CORS, dipisah koma (default `http://localhost:3000`) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Koneksi MySQL |
| `SEPOLIA_RPC_URL` | RPC Alchemy Sepolia |
| `ADMIN_PRIVATE_KEY`, `ADMIN_WALLET_ADDRESS` | Wallet relayer / `systemSigner` |
| `TICKET_CONTRACT_ADDRESS`, `MARKETPLACE_CONTRACT_ADDRESS` | Alamat kontrak hasil deploy |
| `JWT_SECRET` | Rahasia token sesi |
| `INTERNAL_API_KEY` | Kunci bersama frontend ↔ backend (`InternalApiGuard`); harus sama dengan frontend |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION` | Midtrans (`false` untuk sandbox) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | SMTP untuk OTP |
| `TURNSTILE_SECRET_KEY` | Secret Cloudflare Turnstile |
| `PINATA_JWT`, `PINATA_GATEWAY` | Upload & gateway IPFS |
| `ORGANIZER_SEED_PASSWORD` | Opsional, password akun organizer hasil seed |

### `frontend/.env.local`

| Variabel | Keterangan |
|---|---|
| `BACKEND_URL` | URL backend, mis. `http://localhost:3001` |
| `INTERNAL_API_KEY` | Sama dengan backend |
| `SESSION_SECRET` | Kunci enkripsi cookie sesi |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | RPC Sepolia |
| `NEXT_PUBLIC_ZERODEV_RPC` | Bundler/Paymaster ZeroDev |
| `NEXT_PUBLIC_PASSKEY_SERVER_URL` | Passkey server ZeroDev |
| `NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS` | Alamat `TicketContract` |
| `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` | Alamat wallet admin |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key Midtrans Sandbox |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site key Turnstile |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Gateway untuk menampilkan gambar IPFS |

### `contracts/.env`

`SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY` (untuk `forge script` dan verifikasi).

> ⚠️ Jangan pernah commit private key. Gunakan wallet khusus testnet.

---

## Menjalankan Secara Lokal

```bash
# 1. Smart contract: build & test
cd contracts
forge build
forge test

# 2. Backend
cd ../backend
npm install
npm run db:seed          # isi data awal (db:fresh untuk reset)
npm run start:dev        # http://localhost:3001

# 3. Frontend (terminal lain)
cd frontend
npm install
npm run dev              # http://localhost:3000
npm run dev:https        # HTTPS lokal, berguna untuk uji passkey dari HP
```

### Skrip backend lain

| Skrip | Fungsi |
|---|---|
| `npm run deploy:contract` | Deploy `TicketContract` + `MarketplaceContract` ke Sepolia, set `systemSigner`, hubungkan marketplace |
| `npm run db:sync-onchain` | Daftarkan ulang event & kategori dari DB ke kontrak baru |
| `npm run db:sync-identities` | Hanya sinkronkan hash NIK ke `userIdentities` |
| `npm test` / `npm run test:e2e` | Unit test Jest / e2e |
| `npm run lint` | oxlint |

---

## Deploy Ulang Kontrak

Setelah kontrak berubah, alamat lama tidak berlaku. Urutan:

1. `cd contracts && forge test` — pastikan semua test lulus.
2. `cd backend && npm run deploy:contract` — catat alamat yang dicetak.
3. Perbarui `TICKET_CONTRACT_ADDRESS` dan `MARKETPLACE_CONTRACT_ADDRESS` di `backend/.env`.
4. Perbarui `NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS` di `frontend/.env.local`.
5. `npm run db:sync-onchain` — daftarkan ulang event & kategori.
6. Restart backend dan frontend.

---

## Pengujian

| Lapisan | Perintah | Cakupan |
|---|---|---|
| Smart contract | `cd contracts && forge test` (`--gas-report` untuk ukur gas) | `TicketContract.t.sol`, `MarketplaceContract.t.sol`: mint EIP-712, allowlist transfer, price-lock, `markUsed`, identitas |
| Backend | `cd backend && npm test` | Service & controller (Jest) |
| Frontend | `cd frontend && npm test` | Auth & panggilan backend (`node --test`) |

---

## Jaringan

- **Ethereum Sepolia Testnet**, Chain ID `11155111`
- Alamat kontrak aktif ada di `backend/.env` dan dicatat di [docs/kerja/alamat-kontrak.md](docs/kerja/alamat-kontrak.md). Cek di [sepolia.etherscan.io](https://sepolia.etherscan.io).
