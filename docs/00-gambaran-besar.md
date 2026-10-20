# 00. Gambaran Besar Proyek

## Latar Belakang Masalah

Pada ekosistem tiket konvensional, tiket digital berbentuk kode QR di basis data terpusat rentan digandakan, dan transaksi pemindahan tiket di luar platform resmi memicu maraknya praktik calo dengan mark-up harga yang tidak wajar. Penyelenggara acara kehilangan kontrol distribusi harga, sedangkan konsumen menanggung beban biaya sekunder yang tinggi.

Proyek ini mentransformasikan tiket menjadi aset digital unik (Non-Fungible Token / NFT ERC-721) yang dicatat pada buku besar terdesentralisasi (Ethereum Sepolia). Integritas sistem ditegakkan langsung oleh logika mesin smart contract melalui dua aturan mutlak:

1. Tiket hanya dapat berpindah kepemilikan melalui satu kontrak pasar sekunder resmi (Allowlist Marketplace).
2. Nilai transaksi pada pasar sekunder dikunci secara permanen setara dengan harga pembelian awal (`originalPrice`).

Aturan ini mengeliminasi insentif finansial bagi calo, karena aksi pemborongan tiket tidak lagi menghasilkan keuntungan spekulatif.

---

## Tiga Permasalahan Utama dan Pendekatan Solusi

| Masalah | Penyebab pada Sistem Konvensional | Solusi Sistem Tiket NFT |
|---|---|---|
| **Tiket Palsu dan Ganda** | Tiket hanya berupa string basis data terpusat yang rentan duplikasi atau kebocoran kredensial pihak internal. | Tiket diterbitkan sebagai NFT di blockchain dengan kuota tetap yang tidak dapat dimanipulasi oleh pengelola. |
| **Eksploitasi Calo (Scalping)** | Penyelenggara kehilangan kontrol atas pemindahan tiket ketika transaksi sekunder terjadi di media sosial atau pasar gelap. | Fungsi transfer memblokir transaksi P2P langsung dan hanya mengizinkan pemindahan via allowlist resmi dengan harga terkunci. |
| **Kompleksitas Pengalaman Pengguna (Web3 UX Friction)** | Sistem Web3 umum mewajibkan ekstensi dompet pihak ketiga, penyimpanan seed phrase manual, dan kepemilikan saldo kripto untuk gas fee. | Dompet dioperasikan via Account Abstraction (ERC-4337) dengan kunci biometrik Passkey (WebAuthn P-256) dan transaksi tersubsidi via Paymaster. |

---

## Data Analisis Empiris Kebutuhan Pengguna

Hasil survei awal terhadap 4 penyedia jasa titip/war tiket dan 30 responden pengguna menunjukkan urgensi pembaruan sistem:

| Indikator Persepsi Responden | Persentase |
|---|---|
| Kerap melihat tiket dijual kembali dengan harga jauh lebih mahal | 97% |
| Merasakan kuota tiket resmi habis dalam waktu yang tidak wajar | 93% |
| Menduga adanya penggunaan bot otomatis saat proses war tiket | 87% |
| Mengetahui korban penipuan tiket palsu | 83% |
| Terpaksa membeli dari calo karena ketiadaan akses tiket resmi | 63% |
| Merasa aman bertransaksi dengan calo | 50% |

Data menunjukkan bahwa 63% responden terpaksa menggunakan jasa perantara tidak resmi meskipun 50% di antaranya menyadari tingginya risiko keamanan transaksi. Sebanyak 100% responden mendukung sistem yang menjamin keaslian dan membatasi harga jual kembali, dan 97% bersedia mengadopsi teknologi baru selama antarmuka tidak membebani mereka dengan kerumitan teknis blockchain.

---

## Sasaran Teknis Sistem

1. **Verifikasi Keaslian Mandiri**: Pemegang tiket dapat membuktikan keabsahan hak milik secara langsung melalui penjelajah blok (block explorer) tanpa bergantung pada ketersediaan server internal.
2. **Peniadaan Margin Keuntungan Calo**: Smart contract marketplace menolak transaksi yang mencoba menetapkan harga jual di atas nilai pembelian awal.
3. **Aksesibilitas Konsumen Awam**: Alur pendaftaran, pembayaran rupiah, dan penyimpanan tiket berjalan layaknya aplikasi web e-commerce standar.

---

## Keputusan Arsitektur Fitur yang Dieliminasi

| Gagasan Awal | Alasan Rasional Penghapusan |
|---|---|
| Tiket Soulbound (Sama sekali tidak dapat dipindahtangankan) | Pembeli yang berhalangan hadir tetap memiliki hak sah untuk menjual kembali tiketnya. Kontrak mengunci batas harga, bukan melarang pemindahan hak milik yang sah. |
| Mekanisme Commit-Reveal & Flash Sale Dua Tahap | Dihilangkan karena eliminasi potensi keuntungan spekulatif telah menurunkan insentif kompetisi bot massal. |
| Pengundian Acak Terdesentralisasi (Chainlink VRF) | Penjualan berbasis kuota tertib dinilai telah memadai tanpa menambah latensi dan biaya komputasi oracle eksternal. |

---

## Status Pengembangan Komponen Sistem

- **Smart Contract (`contracts/src/TicketContract.sol`)**: Mengimplementasikan `createEvent`, `addCategory`, `setSalesOpen`, `setMarketplace`, `setSystemSigner`, `mintTicket` (dengan penegakan kuota dan penguncian `originalPrice`), `markUsed`, dan `getTicket`.
- **Backend API Server (`backend/`)**: Berjalan di atas NestJS dengan modul TypeORM MySQL (`users`, `customers`, `passkey-credentials`, `events`, `ticket-categories`), autentikasi JWT, dan integrasi stempel EIP-712.
- **Frontend Klien (`frontend/`)**: Dibangun dengan Next.js App Router, mencakup alur registrasi, login, manajemen password, dan visual design system berbasis token desain.
