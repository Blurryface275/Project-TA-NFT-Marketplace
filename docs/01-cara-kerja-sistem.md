# 01 — Cara Kerja Sistem

## Perumpamaan: bioskop

Bayangkan bioskop.

- **Loket dan layar** yang kamu lihat = **situs web** (dibuat dengan Next.js).
- **Petugas di balik loket** yang mengecek pembayaranmu, memegang stempel
  resmi, dan mencatat ke buku = **server** (dibuat dengan NestJS).
- **Buku besar di dinding aula yang bisa dibaca semua orang dan tidak bisa
  dihapus** = **blockchain** (Sepolia, jaringan latihan Ethereum). Di dalam
  buku itu ada **mesin aturan** yang tidak bisa disogok siapa pun = **smart
  contract**.

Tiga lapisan ini punya tugas tegas, dan yang penting: **aturan yang tidak
boleh dilanggar ditaruh di mesin aturan, bukan di petugas.** Kalau petugasnya
dibujuk (server dibobol), kuota tiket, harga asli, dan jalur jual ulang tetap
tidak bisa diakali.

```
Kamu ──► Situs web (Next.js) ──► Server (NestJS) ──► Blockchain Sepolia
                                     │                 ├─ TicketContract (pabrik tiket)
                                     │                 └─ MarketplaceContract (loket jual ulang) 🚧
                                     ├─ Midtrans (kasir, uang mainan)
                                     ├─ Pinata / IPFS (gudang gambar)
                                     ├─ ZeroDev (pabrik dompet + sponsor biaya transaksi)
                                     ├─ Alchemy (jalur telepon ke blockchain)
                                     └─ Cloudflare Turnstile (satpam pintu web)
```

Gambar aslinya: `design/desain-arsitektur.png`, `design/desain-api.png`,
`design/desain-blockchain-2.png`.

## Siapa mengerjakan apa

| Bagian | Tugasnya | Yang TIDAK boleh dilakukannya |
|---|---|---|
| **Situs web** | Menampilkan, menerima klik dan isian, mengarahkan ke kasir | Menyimpan rahasia apa pun; memutuskan sesuatu yang menyangkut keamanan — apa pun yang jalan di peramban bisa diakali |
| **Server** | Mengecek pembayaran ke Midtrans, membuat "stempel izin" untuk mencetak tiket, bicara ke blockchain, mengurus akun dan database | Mengubah kuota atau harga asli tiket (itu dipatok di blockchain) |
| **Smart contract** | Mencetak tiket, memaksa kuota, mengunci harga asli, menolak pindah tangan di luar loket resmi, mengecek stempel | Tahu apa pun tentang rupiah, email, atau KTP — dia hanya tahu alamat dompet dan angka |

## Layanan luar yang dipakai

| Layanan | Perannya, dalam bahasa sehari-hari |
|---|---|
| **Midtrans (sandbox)** | Kasir dengan uang mainan. Pembayaran pura-pura, tapi alurnya sama persis dengan yang asli — termasuk "tanda terima" resmi yang dikirim ke server |
| **Pinata (IPFS)** | Gudang gambar dan keterangan event. Alamat berkasnya adalah sidik jari isinya — kalau isinya diganti diam-diam, alamatnya berubah dan ketahuan |
| **ZeroDev** | Pabrik dompet otomatis, sekaligus **sponsor** yang membayari "bensin" (gas) setiap transaksi supaya pengguna tidak perlu punya koin |
| **Alchemy** | Jalur telepon dari server ke blockchain. Belum dipasang |
| **Cloudflare Turnstile** | Satpam di pintu situs web yang membedakan manusia dari robot. Boleh dipotong kalau waktu habis |

## Data disimpan di mana?

Aturan sederhananya: **kalau harus tidak bisa diakali siapa pun → blockchain.
Kalau besar, sering berubah, atau rahasia → database biasa.**

| Tempat | Isinya | Sifatnya |
|---|---|---|
| **Blockchain** | Siapa pemilik tiket, kuota event, harga asli tiket, status "sudah dipakai", sidik jari identitas pemilik | Permanen, terbuka untuk umum, mahal |
| **Database MySQL** | Akun, pesanan, penawaran jual ulang, notifikasi, **salinan** data tiket untuk tampilan cepat, data KTP (🔶 bentuknya masih dibahas) | Bisa diubah, murah, rahasia |
| **IPFS (Pinata)** | Gambar dan keterangan event: nama, tanggal, lokasi | Alamat = sidik jari isi |

**Blockchain adalah sumber kebenaran. Database hanya salinan.** Kalau
keduanya beda, yang benar blockchain — dan setiap keputusan soal kepemilikan,
harga, atau kuota wajib membaca blockchain, bukan salinannya.

## Lima aturan inti

1. **Satu program untuk semua event.** Bukan satu smart contract per konser.
   Tiap event dibedakan dengan nomor (`eventId`). Lebih murah, lebih gampang
   diuji.
2. **Tiket cuma bisa pindah lewat loket resmi.** Program tiket menolak
   pemindahan yang tidak dijalankan `MarketplaceContract`. Ini yang disebut
   *allowlist* — daftar pihak yang diizinkan, isinya cuma satu.
3. **Harga jual ulang terkunci = harga beli awal.** Dicatat permanen saat
   tiket dicetak (`originalPrice`). Tidak ada kolom "isi harga" di mana pun.
4. **Stempel digital dari server.** Fungsi penting di smart contract hanya mau
   jalan kalau disertai tanda tangan digital sah dari server (standar
   EIP-712). Kenapa perlu? Karena smart contract itu **terbuka** — siapa pun
   bisa memanggilnya langsung tanpa lewat situs web. Itu sifat blockchain,
   bukan cacat. Stempel ini lapisan kontrol akses standar industri.
5. **Dompet dari passkey.** Pengguna tidak pegang 12 kata rahasia. Kunci
   rahasia lahir dan tinggal di chip perangkatnya. Rinciannya di `04`.

## Dua hal yang sering tertukar

- **Satpam bot (Turnstile) vs stempel smart contract.** Satpam menjaga pintu
  situs web. Tapi orang bisa lewat "pintu belakang" — memanggil smart
  contract langsung. Karena itu stempelnya tetap perlu. Dua lapisan, tidak
  saling menggantikan.
- **Kata sandi vs passkey.** Kata sandi untuk masuk ke situs. Passkey untuk
  menandatangani transaksi blockchain. Dua kunci berbeda untuk dua pintu
  berbeda.

## Keputusan Resmi dari Dokumen Tugas Akhir

Sesuai naskah Bab 1 Proposal TA (20 Agustus 2026) dan Laporan TA:
- **Skema data KTP & KYC:** Data identitas fisik dan foto KTP disimpan secara terlindungi di database MySQL off-chain, sedangkan yang disimpan secara on-chain pada smart contract **hanya hash satu arah dari NIK (`bytes32`)** pada pemetaan `userIdentities`.
- **Pengiriman transaksi & Gas:** Transaksi menggunakan abstraksi akun ERC-4337 di mana biaya gas disubsidi oleh sistem melalui mekanisme Paymaster, yang dananya dialokasikan dari biaya administrasi tiket yang dibayarkan pembeli via Midtrans.
- **Pencatatan jual ulang:** Status listing dan kuota pasar sekunder dicatat on-chain pada smart contract marketplace, dan perpindahan tiket NFT wajib melalui izin allowlist resmi dengan harga yang terkunci mutlak sama dengan harga beli awal (`originalPrice`).

