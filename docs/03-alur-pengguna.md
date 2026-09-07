# 03 — Alur Pengguna

Tiga alur utama: **daftar**, **beli**, **jual ulang**. Dua alur pendukung:
penukaran tiket di lokasi acara, dan pembuatan event oleh penyelenggara.

Untuk kuesioner 19 September, yang harus jalan mulus hanya **daftar + beli**.
Jual ulang dan penukaran menyusul untuk uji fungsional Oktober.

Cara baca: tiap langkah ditandai siapa yang mengerjakan —
`[Kamu]` `[Web]` `[Server]` `[Blockchain]` `[Luar]` (Midtrans, Pinata,
ZeroDev, Cloudflare). Tanda ⚠ = langkah yang menentukan keamanan; kalau
urutannya dibalik, ada celah.

---

## Alur 1 — Daftar akun, dompet, dan identitas

Hasil akhir: kamu punya akun, dompet blockchain, dan identitas terdaftar —
siap beli tiket.

**Bagian A — akun (seperti situs biasa)**
```
1. [Kamu]   Isi email + kata sandi
2. [Server] Simpan akun (kata sandi disimpan dalam bentuk hash, bukan asli)
3. [Server] Kirim tautan verifikasi email  ← boleh dipotong kalau waktu habis
```

**Bagian B — dompet & backup seed phrase (sekali sentuh)**
```
4. [Kamu]   Klik "Buat dompet" → peramban minta sidik jari / wajah / PIN perangkat
5. [Kamu]   Perangkatmu membuat sepasang kunci passkey (P-256). Kunci RAHASIA tinggal di chip
            perangkat dan tidak pernah keluar — bahkan ke server.                  ⚠
6. [Web]    Kunci PUBLIK (dua angka: pubX, pubY) dikirim ke server
7. [Web]    Sistem membangkitkan seed phrase BIP-39 (12 kata) dan menampilkannya SEKALI ke kamu
            untuk dicatat dan disimpan sendiri.                                    ⚠
8. [Web]    Dari 12 kata itu, peramban menurunkan sepasang kunci (secp256k1). Hanya public key/
            address turunannya yang dikirim ke server untuk didaftarkan on-chain sebagai
            validator cadangan (backup validator). Seed phrase/private key TIDAK PERNAH dikirim. ⚠
9. [Server] Hitung alamat dompet dari kunci publik passkey (lewat ZeroDev CREATE2). Alamatnya
            sudah sah menerima tiket meski kontraknya belum dideploy di blockchain
10.[Server] Simpan alamat dompet + kunci publik passkey + daftarkan backup validator on-chain
```
Kenapa ini penting: Dari sudut pandangmu, dompet langsung siap pakai tanpa perlu membeli saldo kripto. Di baliknya, kamu memegang passkey di perangkat sebagai kunci utama dan 12 kata seed phrase mandiri sebagai kunci pemulihan cadangan.


**Bagian C — verifikasi identitas (KYC)**
```
9.  [Kamu]   Unggah foto KTP dan masukkan data diri
10. [Server] Simpan data KTP dan foto di database MySQL off-chain yang terlindungi
11. [Server] Hitung hash satu arah dari NIK pengguna (keccak256 / SHA-256)
12. [Server → Blockchain] Panggil registerIdentity(userWallet, nikHash) di TicketContract
13. [Blockchain] Catat nikHash ke mapping userIdentities — data KTP mentah tidak pernah masuk ke blockchain
```
Hasilnya: satu identitas NIK nyata hanya dapat terikat ke satu dompet smart account on-chain. Tanpa identitas terdaftar, transaksi minting tiket reguler akan otomatis di-revert oleh smart contract.

---

## Alur 2 — Beli tiket reguler

Hasil akhir: NFT tiket ada di dompet smart account-mu, tercatat dengan `originalPrice` permanen, metadata deskriptif tersimpan di IPFS Pinata, dan status pembelian terverifikasi.

```
 1. [Kamu]   Pilih event & kategori tiket reguler di katalog web
 2. [Web]    Satpam bot (Cloudflare Turnstile) menilai kamu manusia
 3. [Server] Cek ulang token Turnstile ke endpoint Cloudflare /siteverify (sekali pakai)   ⚠
 4. [Server] Cek: penjualan buka? kuota sisa? batas per dompet (maxPerWallet)? identitas terdaftar?
 5. [Server] Buat tagihan di Midtrans sandbox, popup Snap muncul di layar
 6. [Kamu]   Bayar simulasi fiat di Midtrans (biaya gas disubsidi sistem via Paymaster)
 7. [Luar]   Midtrans mengirim webhook notifikasi resmi pembayaran lunas ke server
 8. [Server] Verifikasi keabsahan webhook secara idempoten (cegah cetak ganda)              ⚠
 9. [Server] Unggah metadata deskriptif tiket (nama event, tanggal, venue, gambar) ke Pinata IPFS → dapat CID  ⚠
10. [Server] Buat stempel otorisasi EIP-712 dengan systemSigner backend                      ⚠
11. [Server → Blockchain] Eksekusi minting NFT via bundler/paymaster ERC-4337
12. [Blockchain] TicketContract verifikasi stempel, kuota, maxPerWallet, identitas → minting NFT,
             kunci originalPrice permanen, catat used = false
13. [Server] Tunggu konfirmasi blok Sepolia, simpan salinan ke database MySQL, catat waktu konfirmasi
14. [Web]    "Tiket Saya" menampilkan e-ticket beserta detail metadata IPFS
```

---

## Alur 3 — Jual ulang tiket (Resale)

Hasil akhir: Tiketmu berpindah kepemilikan ke pembeli baru melalui kontrak marketplace resmi dengan harga yang terkunci mutlak sama dengan harga pembelian awal (`originalPrice`).

```
 1. [Kamu]   Pilih tiket di antarmuka web → klik "Jual Tiket". TIDAK ADA input harga.     ⚠
 2. [Kontrak] MarketplaceContract otomatis mengunci harga = TicketContract.originalPrice.   ⚠
 3. [Kontrak] Listing resale tercatat aktif di smart contract marketplace.
 4. [Kamu 2] Pembeli lain membuka katalog resale, memilih tiket yang tersedia.
 5. [Kamu 2] Pembeli membayar harga tiket via gateway pembayaran Midtrans.
 6. [Server] Verifikasi status pembayaran lunas dari Midtrans.
 7. [Server → Kontrak] Panggil executeResale() pada MarketplaceContract.                   ⚠
 8. [Blockchain] TicketContract memverifikasi bahwa transfer dipanggil oleh marketplaceAddress resmi
             (jalur allowlist). NFT berpindah ke dompet pembeli baru.
             Transfer P2P langsung antar dompet di luar marketplace DITOLAK MUTLAK.        ⚠
 9. [Server] Teruskan dana penjualan ke saldo penjual dan kirim notifikasi transaksi berhasil ke kedua pihak.
```


Kalau ada yang mencoba memanggil kontrak langsung tanpa situs web — tetap
ditolak, karena aturan jalur dan harga ada di mesin aturan, bukan di layar.

---

## Alur 4 — Pemulihan Akun (Account Recovery — Lupa Password / Kehilangan Perangkat)

Hasil akhir: Perangkat baru berhasil didaftarkan sebagai validator utama smart account menggantikan perangkat lama yang hilang, dan akses akun pulih sepenuhnya.

```
 1. [Kamu]   Buka halaman "Pemulihan Akun" di perangkat baru (bukan login biasa).
 2. [Kamu]   Masukkan email akun dan ketik 12 kata seed phrase BIP-39 yang disimpan saat pendaftaran.
 3. [Web]    Peramban menurunkan kembali private key (secp256k1) secara lokal di memori klien.
             Seed phrase dan private key TIDAK PERNAH dikirim ke server.                      ⚠
 4. [Kamu]   Buat passkey baru untuk perangkat baru via WebAuthn (P-256).
 5. [Web]    Tandatangani pesan otorisasi penggantian validator menggunakan private key tadi.
 6. [Web]    Kirim HANYA signature dan public key passkey baru ke server (bukan seed phrase). ⚠
 7. [Server] Verifikasi signature via ECDSA.recover() -> peroleh address penanda tangan.
 8. [Server] Cocokkan address tersebut dengan backup validator yang terdaftar di smart account.
             Jika cocok, signature sah. Jika tidak cocok, proses langsung dibatalkan.         ⚠
 9. [Server] Kirim email verifikasi (2FA) ke alamat email akun terdaftar.                     ⚠
10. [Kamu]   Buka email dan klik tombol konfirmasi pemulihan akun.
11. [Server → Blockchain] Eksekusi pendaftaran passkey baru sebagai validator utama smart account.
12. [Web]    Akses akun dan tiket NFT berhasil dipulihkan di perangkat baru.
```

---

## Alur pendukung


**Penukaran di lokasi acara (Venue Check-In)**
```
1. [Pengunjung] Tunjukkan QR Code E-Ticket dari aplikasi web ke petugas pintu masuk
2. [Petugas]    Pindai KTP fisik pengunjung menggunakan pemindai/kamera untuk membaca NIK
3. [Server]     Hitung hash NIK pengunjung menggunakan algoritma hash satu arah
4. [Server]     Cocokkan hash NIK dengan data di database dan pemilik tiket on-chain (userIdentities)
5. [Server]     Jika NIK cocok dan tiket belum pernah dipakai:
                Lanjut panggil fungsi on-chain markUsed(tokenId) di TicketContract
                -> Tiket ditandai "used = true" (tiket tidak bisa dipakai dua kali)
6. [Petugas]    Pengunjung dipersilakan masuk lokasi acara. Jika data tidak cocok, akses ditolak.
```

**Pembuatan event oleh penyelenggara**
```
1. [Penyelenggara] Daftar akun → disetujui admin 🔶
2. [Penyelenggara] Isi event + kategori tiket (harga, kuota)
3. [Server → Blockchain] createEvent + addCategory (sudah ada di kontrak ✅)
4. [Server] Unggah gambar event ke IPFS, simpan CID
```

---

## Yang berubah dari rancangan lama

Rancangan awal Agustus menulis "daftar cukup email tanpa kata sandi, dompet
dibuat server". Itu **tidak berlaku lagi**: sekarang masuk pakai email + kata
sandi, dan dompet lahir dari passkey di perangkatmu — bukan dibuat server.
Rincian di `04-dompet-dan-passkey.md`.
