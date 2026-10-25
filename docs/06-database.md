# 06. Arsitektur basis data relasional

Dokumen ini menjelaskan struktur basis data relasional MySQL yang digunakan backend NestJS untuk mengelola data akun, kredensial, katalog acara, sesi flash sale, transaksi pesanan, notifikasi, dan cache pembacaan tiket off-chain sesuai batasan ruang lingkup tugas akhir.

---

## Diagram hubungan antar entitas

Struktur tabel memisahkan autentikasi akun dari profil pelanggan, kredensial passkey, verifikasi identitas, katalog tiket, modul flash sale, riwayat transaksi, dan sistem notifikasi.

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "memiliki profil"
    USERS ||--o| ORGANIZERS : "memiliki profil"
    USERS ||--o| ADMINS : "memiliki profil"
    USERS ||--o{ PASSKEY_CREDENTIALS : "mendaftarkan"
    USERS ||--o| KYC_RECORDS : "memverifikasi"
    USERS ||--o{ LOGIN_HISTORY : "mencatat sesi"
    USERS ||--o{ NOTIFICATIONS : "menerima"

    ORGANIZERS ||--o{ EVENTS : "menyelenggarakan"
    EVENTS ||--o{ TICKET_CATEGORIES : "memiliki"
    EVENTS ||--o{ FLASH_SALES : "menjadwalkan"
    
    FLASH_SALES ||--o{ FLASH_SALE_PHASES : "terdiri dari"
    FLASH_SALES ||--o{ FLASH_SALE_REMINDERS : "didaftarkan oleh"
    USERS ||--o{ FLASH_SALE_REMINDERS : "meminta pengingat"

    CUSTOMERS ||--o{ ORDERS : "melakukan"
    ORDERS ||--o{ TICKET_CACHE : "menghasilkan"
    TICKET_CATEGORIES ||--o{ ORDERS : "dipesan pada"

    CUSTOMERS ||--o{ RESALE_LISTINGS : "menjual"
    RESALE_LISTINGS ||--o| CUSTOMERS : "dibeli oleh"
    CUSTOMERS ||--o{ SELLER_BANK_ACCOUNTS : "mendaftarkan rekening"

    USERS {
        int id PK
        string email UK
        string password_hash
        string display_name
        string role
        datetime created_at
    }

    CUSTOMERS {
        int id PK
        int user_id FK
        string wallet_address UK
        datetime created_at
    }

    PASSKEY_CREDENTIALS {
        int id PK
        int user_id FK
        string credential_id UK
        string pub_x
        string pub_y
        int counter
        datetime created_at
    }

    KYC_RECORDS {
        int id PK
        int user_id FK
        string full_name
        string id_number_hash UK
        string status
        datetime verified_at
    }

    LOGIN_HISTORY {
        int id PK
        int user_id FK
        string ip_address_hash
        string user_agent
        datetime login_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string notification_type
        boolean is_read
        datetime created_at
    }

    EVENTS {
        int id PK
        int organizer_id FK
        int onchain_event_id UK
        string title
        datetime event_date
        string location
        string ipfs_metadata_cid
        string banner_image_url
        string status
    }

    TICKET_CATEGORIES {
        int id PK
        int event_id FK
        int onchain_category_id
        string category_name
        decimal price
        int quota
        int sold_count
    }

    FLASH_SALES {
        int id PK
        int event_id FK
        datetime start_time
        datetime end_time
        string status
        datetime created_at
    }

    FLASH_SALE_PHASES {
        int id PK
        int flash_sale_id FK
        string phase_name
        datetime start_time
        datetime end_time
        int max_quota
    }

    FLASH_SALE_REMINDERS {
        int id PK
        int user_id FK
        int flash_sale_id FK
        boolean is_sent
        datetime created_at
    }

    ORDERS {
        int id PK
        int customer_id FK
        int category_id FK
        string midtrans_order_id UK
        string midtrans_transaction_id
        decimal gross_amount
        string status
        datetime expires_at
        datetime paid_at
    }

    TICKET_CACHE {
        int id PK
        int onchain_token_id UK
        int order_id FK
        string current_owner_wallet
        decimal original_price
        boolean is_used
        datetime last_synced_at
    }

    RESALE_LISTINGS {
        int id PK
        int onchain_token_id FK
        int seller_customer_id FK
        int buyer_customer_id FK
        decimal locked_price
        string status
        datetime created_at
        datetime sold_at
    }

    SELLER_BANK_ACCOUNTS {
        int id PK
        int customer_id FK
        string bank_name
        string account_number
        string account_holder_name
        datetime created_at
    }
```

---

## Deskripsi entitas basis data

| Nama tabel | Peran dan fungsi entitas | Kunci utama dan relasi |
|---|---|---|
| `users` | Menyimpan identitas akun dasar untuk autentikasi sistem web (email dan hash kata sandi). | PK: `id`, Unique: `email`. |
| `customers` | Menyimpan atribut spesifik pembeli tiket dan tautan alamat smart account ERC-4337. | PK: `id`, FK: `user_id` menuju `users.id`. |
| `passkey_credentials` | Menyimpan kunci publik P-256 (`pub_x`, `pub_y`) dan kredensial WebAuthn untuk autentikasi biometrik. | PK: `id`, FK: `user_id` menuju `users.id`. |
| `kyc_records` | Menyimpan bukti verifikasi identitas fisik. Hanya menyimpan hash satu arah (`id_number_hash`) untuk mematuhi regulasi privasi. | PK: `id`, FK: `user_id` menuju `users.id`, Unique: `id_number_hash`. |
| `login_history` | Mencatat riwayat sesi masuk pengguna untuk keperluan audit keamanan dan mitigasi anomali akses. | PK: `id`, FK: `user_id` menuju `users.id`. |
| `notifications` | Menyimpan pesan notifikasi transaksi pengguna, meliputi status pembayaran, pencetakan tiket, hasil war tiket, dan penjualan resale. | PK: `id`, FK: `user_id` menuju `users.id`. |
| `events` | Menyimpan katalog acara off-chain dan referensi `onchain_event_id` pada smart contract. | PK: `id`, Unique: `onchain_event_id`. |
| `ticket_categories` | Menyimpan konfigurasi tier tiket, batas kuota, dan harga dasar. | PK: `id`, FK: `event_id` menuju `events.id`. |
| `flash_sales` | Mengelola sesi penjualan cepat kuota terbatas beserta waktu mulai dan berakhir. | PK: `id`, FK: `event_id` menuju `events.id`. |
| `flash_sale_phases` | Mengatur tahapan periode flash sale (tahap verifikasi pra-sesi dan tahap eksekusi pembelian kilat). | PK: `id`, FK: `flash_sale_id` menuju `flash_sales.id`. |
| `flash_sale_reminders` | Mencatat permintaan pengingat jadwal flash sale dari pengguna sebelum penjualan dibuka. | PK: `id`, FK: `user_id` menuju `users.id`, FK: `flash_sale_id` menuju `flash_sales.id`. |
| `orders` | Mencatat transaksi pembelian fiat, token Midtrans Snap, batas waktu pembayaran (`expires_at`), dan status pelunasan. | PK: `id`, Unique: `midtrans_order_id`. |
| `ticket_cache` | Salinan lokal kepemilikan dan status tiket on-chain untuk mempercepat kueri baca antarmuka web. | PK: `id`, Unique: `onchain_token_id`. |
| `resale_listings` | Mengelola data penawaran tiket pasar sekunder dengan harga terkunci setara harga beli awal. | PK: `id`, FK: `seller_customer_id`, FK: `buyer_customer_id`. |
| `seller_bank_accounts` | Menyimpan data rekening bank penjual untuk penyaluran dana hasil penjualan tiket sekunder. | PK: `id`, FK: `customer_id` menuju `customers.id`. |

---

## Batasan sinkronisasi data

Tabel `ticket_cache` berfungsi sebagai proyeksi baca (*read projection*). Validasi hak milik dan kelayakan penukaran tiket di lokasi acara selalu divalidasi langsung ke smart contract Sepolia secara on-chain (`TicketContract.ownerOf` dan `TicketContract.getTicket`), guna menjamin ketahanan terhadap inkonsistensi data lokal.
