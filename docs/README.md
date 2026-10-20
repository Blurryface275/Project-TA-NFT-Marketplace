# Dokumentasi Arsitektur Proyek dan Panduan Navigasi

Folder ini memuat dokumentasi arsitektur, spesifikasi teknis, alur sistem, dan kamus istilah untuk proyek Marketplace Tiket NFT berbasis Ethereum Sepolia dan Account Abstraction ERC-4337.

---

## Struktur Folder Dokumentasi

| Folder | Cakupan Konten | Target Pembaca |
|---|---|---|
| `docs/` (`00` s.d. `11`) | Spesifikasi teknis inti dan diagram alur sistem | Developer, Technical Reviewer, Penguji Sistem |
| `docs/working-module/` | Panduan kerja modular implementasi backend, contracts, dan frontend | Pengembang fitur aktif |
| `docs/bab-3-4/` | Naskah formal analisis kebutuhan dan perancangan skripsi (KF/KNF) | Penulisan laporan akademik |
| `docs/kerja/` | Log keputusan arsitektur, catatan konsultasi, dan alamat kontrak deployment | Anggota tim pengembang |
| `docs/arsip/` | Riwayat rancangan awal yang telah diperbarui | Arsip historis |

---

## Indeks Berkas Spesifikasi Teknis

| Dokumen | Deskripsi Ruang Lingkup | Diagram Tersemat |
|---|---|---|
| [00-gambaran-besar.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/00-gambaran-besar.md) | Analisis masalah, data empiris, solusi, dan sasaran sistem | Matriks Kebutuhan |
| [01-cara-kerja-sistem.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/01-cara-kerja-sistem.md) | Pembagian tanggung jawab lapisan web, server, blockchain, dan gateway | **Mermaid System Architecture** |
| [02-fitur-sistem.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/02-fitur-sistem.md) | Matriks fitur pengguna, penyelenggara acara, dan administrator | Tabel Matriks Fitur |
| [03-alur-pengguna.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/03-alur-pengguna.md) | Alur registrasi, pembelian, penjualan kembali, dan verifikasi gerbang | **5x Mermaid Sequence Diagrams** |
| [04-dompet-dan-passkey.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/04-dompet-dan-passkey.md) | Arsitektur ERC-4337, integrasi passkey WebAuthn, dan recovery | **Mermaid Dual-Auth & Kernel Lifecycle** |
| [05-smart-contract.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/05-smart-contract.md) | Spesifikasi fungsi Solidity, penegakan kuota, dan anti-scalping | **Mermaid State Machine & Class Diagram** |
| [06-database.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/06-database.md) | Rancangan skema basis data relasional MySQL | **Mermaid Entity-Relationship Diagram (ERD)** |
| [07-pembayaran-penyimpanan-bot.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/07-pembayaran-penyimpanan-bot.md) | Integrasi gateway Midtrans, IPFS Pinata, dan Cloudflare Turnstile | Integrasi Layanan Pihak Ketiga |
| [08-kualitas-yang-dijanjikan.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/08-kualitas-yang-dijanjikan.md) | Metrik kualitas sistem: performa, keamanan, dan keandalan | Metrik Non-Fungsional |
| [09-pengujian.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/09-pengujian.md) | Strategi pengujian unit Foundry, integrasi Jest, dan audit keamanan | Rencana Pengujian |
| [10-keterbatasan.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/10-keterbatasan.md) | Batasan teknis, asumsi dependensi, dan batasan operasional | Analisis Batasan Sistem |
| [11-istilah.md](file:///d:/STEVE/Project%20NFT%20Marketplace/docs/11-istilah.md) | Glosarium istilah teknis Web3, kriptografi, dan infrastruktur | Glosarium Terminologi |

---

## Konvensi Simbol Status

- `✅` : Fitur telah diimplementasikan dalam basis kode aktif.
- `🚧` : Fitur dalam proses implementasi atau pengujian lanjutan.
- `🔶` : Kebijakan atau skema masih dalam tahap konfirmasi keputusan.
