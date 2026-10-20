# 03. Alur Pengguna dan Sequence Diagram

Dokumen ini mendefinisikan alur interaksi pengguna dengan sistem melalui lima proses operasional: pendaftaran akun dan dompet, pembelian tiket primer, penjualan kembali tiket resmi, pemulihan akun, dan validasi tiket di lokasi acara.

---

## 1. Alur Pendaftaran Akun, Pembuatan Dompet, dan KYC

Pengguna membuat akun web standar, membangkitkan pasangan kunci passkey melalui antarmuka WebAuthn perangkat, dan meregistrasikan identitas KTP. Kunci privat passkey tetap tersimpan aman di Secure Enclave / TPM perangkat dan tidak pernah dikirim ke jaringan.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant Web as Frontend Next.js
    participant Server as Backend NestJS
    participant DB as Database MySQL
    participant Chain as Blockchain Sepolia

    Note over User,Web: Tahap A: Pendaftaran Akun Standar
    User->>Web: Masukkan email dan kata sandi
    Web->>Server: POST /auth/register (email, password)
    Server->>DB: Simpan akun baru (kata sandi ter-hash bcrypt)
    Server-->>Web: Konfirmasi akun terbuat

    Note over User,Web: Tahap B: Pembuatan Dompet Passkey (ERC-4337)
    User->>Web: Klik "Buat Dompet"
    Web->>User: Minta otentikasi biometrik WebAuthn
    User->>Web: Sentuhan sidik jari / Face ID
    Note right of Web: Perangkat membuat kunci P-256 (Kunci privat aman di chip)
    Web->>Server: POST /wallet/register-passkey (pubX, pubY, credentialId)
    Server->>Server: Hitung alamat Smart Account via ZeroDev CREATE2
    Server->>DB: Simpan relasi customer, passkey credential, dan alamat dompet
    Server-->>Web: Dompet siap menerima tiket (Gasless Setup)

    Note over User,Chain: Tahap C: Verifikasi Identitas (KYC)
    User->>Web: Unggah foto KTP dan nomor NIK
    Web->>Server: POST /kyc/submit (data KTP, foto)
    Server->>DB: Simpan data KTP di penyimpanan terproteksi off-chain
    Server->>Server: Hitung hash satu arah: keccak256(NIK)
    Server->>Chain: Eksekusi registerIdentity(walletAddress, nikHash)
    Chain-->>Server: Event IdentityRegistered tersimpan on-chain
    Server-->>Web: Status KYC aktif dan terverifikasi
```

---

## 2. Alur Pembelian Tiket Primer (War Tiket dan Minting NFT)

Proses pembelian tiket memverifikasi status manusia pengguna via Cloudflare Turnstile, memproses pembayaran rupiah melalui Midtrans Snap, menerbitkan metadata ke IPFS, menandatangani stempel EIP-712, dan mengeksekusi pencetakan NFT tiket on-chain secara tersponsori.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant Web as Frontend Next.js
    participant Turnstile as Cloudflare Turnstile
    participant Server as Backend NestJS
    participant Midtrans as Gateway Midtrans
    participant IPFS as Pinata IPFS
    participant Chain as TicketContract (Sepolia)

    User->>Web: Pilih event dan kategori tiket
    Web->>Turnstile: Minta evaluasi bot token
    Turnstile-->>Web: Token verifikasi manusia lolos
    Web->>Server: POST /orders/create (eventId, categoryId, turnstileToken)
    Server->>Turnstile: POST /siteverify (token sekali pakai)
    Turnstile-->>Server: Token valid (Score > ambang batas aman)
    Server->>Server: Verifikasi batas kuota, maxPerWallet, dan status KYC
    Server->>Midtrans: Request Snap Token transaksi
    Midtrans-->>Server: Snap Token & Payment URL
    Server-->>Web: Tampilkan Snap Modal Midtrans
    User->>Midtrans: Selesaikan pembayaran fiat (simulasi)
    Midtrans->>Server: Webhook HTTP: Pembayaran Lunas (Settlement)
    Server->>Server: Verifikasi signature Midtrans secara idempoten
    Server->>IPFS: Unggah berkas metadata tiket JSON -> Dapatkan CID
    Server->>Server: Buat stempel otorisasi EIP-712 dengan systemSigner
    Server->>Chain: Eksekusi mintTicket(userWallet, eventId, categoryId, signature)
    Note over Chain: Validasi stempel, kuota, maxPerWallet, kunci originalPrice
    Chain-->>Server: Event TicketMinted(tokenId, price, buyer)
    Server->>Server: Update status order = SUCCESS dan perbarui ticket_cache
    Server-->>Web: Notifikasi tiket berhasil diterbitkan
    Web-->>User: Tampilkan E-Ticket di tab "Tiket Saya"
```

---

## 3. Alur Penjualan Kembali Tiket Resmi (Resale Anti-Calo)

Tiket yang dijual kembali hanya dapat ditawarkan melalui `MarketplaceContract` resmi. Parameter harga dikunci otomatis setara dengan nilai pembelian awal (`originalPrice`), sehingga spekulasi margin keuntungan calo dieliminasi sepenuhnya oleh kode smart contract.

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Penjual (Pemilik Tiket)
    actor Buyer as Pembeli Kedua
    participant Web as Frontend Next.js
    participant Server as Backend NestJS
    participant Midtrans as Gateway Midtrans
    participant Market as MarketplaceContract
    participant Ticket as TicketContract

    Note over Seller,Market: Penawaran Tiket (Listing)
    Seller->>Web: Klik "Jual Tiket" (Tanpa kolom input harga)
    Web->>Server: POST /resale/list (tokenId)
    Server->>Market: Eksekusi listTicket(tokenId)
    Market->>Ticket: Query originalPrice untuk tokenId tersebut
    Note over Market: Kunci harga jual kembali = originalPrice
    Market-->>Server: Listing aktif on-chain
    Server-->>Web: Tiket masuk katalog pasar sekunder

    Note over Buyer,Ticket: Pembelian Tiket Resale
    Buyer->>Web: Pilih tiket resale di katalog
    Web->>Server: POST /resale/buy (listingId)
    Server->>Midtrans: Buat tagihan sesuai harga originalPrice resmi
    Midtrans-->>Web: Tampilkan popup pembayaran
    Buyer->>Midtrans: Bayar tagihan via Midtrans
    Midtrans->>Server: Webhook HTTP: Pembayaran Lunas
    Server->>Market: Eksekusi executeResale(listingId, buyerWallet)
    Market->>Ticket: Transfer hak milik NFT dari Penjual ke Pembeli
    Note over Ticket: Verifikasi pemanggil adalah Marketplace resmi (Allowlist)
    Ticket-->>Market: Transfer NFT sukses
    Market-->>Server: Event ResaleCompleted
    Server->>Server: Alokasikan saldo ke dompet penjual & kirim notifikasi
    Server-->>Web: Tiket berpindah ke tab "Tiket Saya" Pembeli Baru
```

---

## 4. Alur Validasi Tiket di Lokasi Acara (Venue Check-In)

Pemeriksaan tiket fisik di gerbang masuk dilakukan secara real-time dengan membandingkan data hash NIK pengunjung terhadap catatan on-chain dan memvalidasi bahwa tiket belum pernah digunakan sebelumnya.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Pengunjung
    actor Officer as Petugas Pintu Masuk
    participant Scanner as Aplikasi Gate Scanner
    participant Server as Backend NestJS
    participant Chain as TicketContract (Sepolia)

    Visitor->>Officer: Tunjukkan QR Code E-Ticket dari aplikasi
    Visitor->>Officer: Tunjukkan fisik KTP untuk verifikasi NIK
    Officer->>Scanner: Pindai QR Code tiket dan baca NIK
    Scanner->>Server: POST /venue/check-in (tokenId, nikInput)
    Server->>Server: Hitung hash: keccak256(nikInput)
    Server->>Chain: Query getTicket(tokenId) & userIdentities(tokenOwner)
    Note over Chain: Cek tokenId valid dan status used == false
    alt Jika NIK Tidak Cocok atau Tiket Sudah Pernah Terpakai
        Chain-->>Server: Data tidak sesuai / TicketAlreadyUsed
        Server-->>Scanner: Peringatan: Akses Ditolak (Tiket Tidak Sah)
        Scanner-->>Officer: Indikator Merah: Jangan izinkan masuk
    else Jika Identitas Cocok dan Tiket Valid
        Server->>Chain: Eksekusi markUsed(tokenId)
        Chain-->>Server: Event TicketUsed(tokenId, scannerAddress, timestamp)
        Server->>Server: Update status cache lokal used = true
        Server-->>Scanner: Konfirmasi: Akses Diterima (Tiket Sah)
        Scanner-->>Officer: Indikator Hijau: Pengunjung diizinkan masuk
    end
```

---

## 5. Alur Pemulihan Akun (Account Recovery)

Jika perangkat pengguna hilang atau rusak, akses smart account dipulihkan menggunakan 12 kata frasa pemulihan cadangan (BIP-39). Frasa tersebut diproses secara lokal di peramban untuk menandatangani otorisasi rotasi kunci passkey tanpa pernah membocorkan kunci privat ke server.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Perangkat Baru)
    participant Web as Frontend Next.js
    participant Server as Backend NestJS
    participant Mail as Layanan Email (2FA)
    participant Chain as User Smart Account

    User->>Web: Buka halaman "Pemulihan Akun"
    User->>Web: Masukkan email terdaftar dan ketik 12 kata pemulihan
    Note over Web: Turunkan private key cadangan (secp256k1) di memori lokal klien
    User->>Web: Buat passkey baru pada perangkat baru via biometrik
    Web->>Web: Tanda tangani pesan rotasi validator dengan private key cadangan
    Web->>Server: POST /auth/recover (email, passkeyPubX, passkeyPubY, signature)
    Note over Server: Verifikasi signature via ECDSA.recover() cocok dengan backup validator
    Server->>Mail: Kirim email tautan konfirmasi pemulihan 2FA
    User->>Mail: Buka email dan klik tautan verifikasi
    Mail->>Server: Callback otorisasi email terkonfirmasi
    Server->>Chain: Daftarkan passkey baru sebagai validator utama smart account
    Chain-->>Server: Konfirmasi validator berhasil diperbarui
    Server-->>Web: Sesi akun dan kepemilikan dompet pulih sepenuhnya di perangkat baru
```
