# 11 — Istilah

Kamus untuk seluruh dokumen. Tiap istilah dijelaskan dengan perumpamaan dulu,
baru artinya. Versi formal: `bab-3-4/08-daftar-istilah.md`.

## Dasar blockchain

- **Blockchain** — buku catatan yang salinannya ada di ribuan komputer.
  Sekali tercatat, tidak bisa dihapus atau diubah diam-diam — untuk
  mengubahnya harus membujuk ribuan komputer sekaligus.
- **Ethereum** — blockchain yang bisa menjalankan program.
- **Sepolia** — "lapangan latihan" Ethereum. Uangnya mainan, cara kerjanya
  sama. Proyek ini jalan di sini.
- **Smart contract** — program yang hidup di dalam blockchain. Aturannya
  otomatis, tidak bisa dilanggar siapa pun, termasuk pembuatnya. Seperti
  mesin penjual otomatis.
- **Alamat dompet** — nomor rekening di blockchain. Terbuka, siapa pun bisa
  lihat isinya.
- **On-chain / off-chain** — di dalam blockchain (permanen, publik, mahal) /
  di luar blockchain (database biasa).
- **Gas** — "bensin" tiap transaksi. Di proyek ini dibayar sponsor, bukan
  pengguna.
- **RPC** — jalur "telepon" langsung ke blockchain. Siapa pun bisa memakainya
  tanpa lewat situs web kami.
- **Testnet** — jaringan latihan. Lawannya *mainnet*, jaringan sungguhan.
- **Nonce** — nomor sekali pakai. Dipakai supaya stempel yang sama tidak bisa
  dipakai dua kali.
- **Mint (mencetak)** — membuat NFT baru.

## Dompet dan tanda tangan

- **Dompet biasa (EOA)** — dompet yang dikendalikan satu kunci rahasia
  milik manusia.
- **Smart account** — dompet berupa program. Aturan siapa yang boleh
  memakainya bisa diatur. Dompet pengguna di sini jenis ini.
- **ERC-4337 (Account Abstraction)** — standar yang membuat orang bisa punya
  dompet blockchain tanpa mengurus kunci rahasia dan koin sendiri.
- **EntryPoint** — pintu masuk resmi ERC-4337 di blockchain. Dipakai versi
  0.7 di alamat resminya.
- **Bundler** — kurir yang mengantar transaksi smart account ke blockchain.
- **Paymaster** — sponsor yang membayar gas. Di sini: ZeroDev.
- **UserOperation** — "surat perintah" dari smart account; diantar bundler,
  dibayari paymaster.
- **Passkey** — kunci yang lahir dan tinggal di chip perangkatmu, dibuka
  dengan sidik jari/wajah/PIN. Menggantikan kata sandi dan 12 kata rahasia.
- **WebAuthn** — aturan resmi (W3C) cara peramban memakai passkey.
- **TPM / Secure Enclave** — chip pengaman di Windows / Apple. Kunci di
  dalamnya bisa dipakai, tidak bisa disalin keluar.
- **Kunci publik / kunci rahasia** — gembok dan anak kuncinya. Gembok boleh
  dibagikan; anak kunci tidak pernah keluar.
- **P-256** — jenis kunci passkey. Beda dari jenis kunci Ethereum
  (secp256k1), jadi memverifikasinya di blockchain butuh cara khusus.
- **CREATE2** — cara menghitung alamat dompet secara pasti dari gembok,
  sebelum dompetnya dibangun.
- **Kernel** — "rumah" smart account buatan ZeroDev.
- **BIP-39** — 12 kata cadangan. Di sini hanya untuk darurat.
- **Tanda tangan digital** — bukti matematis bahwa pemegang kunci rahasia
  menyetujui sesuatu. Tidak bisa dipalsukan, tidak bisa disangkal.
- **EIP-712** — format tanda tangan digital yang isinya bisa dibaca manusia.
  Dipakai untuk "stempel" server.
- **ECDSA** — rumus matematika di balik tanda tangan Ethereum.
- **ERC-1271** — cara smart account membuktikan tanda tangannya sah (beda
  dari dompet biasa).

## Data dan penyimpanan

- **Hash (keccak256)** — sidik jari digital. Dari data bisa dibuat sidik
  jari, dari sidik jari **tidak bisa** kembali ke data. Bukan enkripsi.
- **Salt** — bumbu acak yang ditambahkan sebelum di-hash, supaya tidak bisa
  ditebak dengan mencoba satu per satu. Berbeda tiap orang.
- **Pepper** — bumbu rahasia yang sama untuk semua orang, disimpan di luar
  database.
- **IPFS** — penyimpanan berkas tersebar; alamat berkas = sidik jari isinya.
- **Pinata** — layanan yang menjaga berkas IPFS tidak hilang.
- **CID** — alamat berkas di IPFS.
- **MySQL** — database biasa, lemari arsip kantor.
- **ERD** — gambar rancangan tabel database dan hubungannya.

## Pembayaran dan layanan luar

- **Midtrans (sandbox)** — kasir pembayaran, versi latihan dengan uang
  mainan.
- **Snap** — halaman bayar Midtrans.
- **Webhook** — tanda terima resmi yang dikirim kasir langsung ke server.
- **Idempoten** — kalau perintah yang sama datang dua kali, hasilnya tetap
  satu. Penting untuk webhook.
- **Cloudflare Turnstile** — satpam yang membedakan manusia dari robot di
  situs web.
- **Alchemy** — penyedia jalur RPC ke blockchain.
- **ZeroDev** — penyedia dompet ERC-4337, passkey server, bundler, dan
  paymaster.

## Istilah proyek ini

- **NFT** — token digital yang cuma ada satu. Di sini satu NFT = satu tiket.
- **ERC-721** — standar resmi NFT.
- **`eventId`** — nomor pembeda event di dalam satu smart contract.
- **`originalPrice`** — harga beli awal, dicatat permanen, patokan harga
  jual ulang.
- **Allowlist** — daftar pihak yang diizinkan. Isinya cuma satu: loket
  resmi.
- **Loket resmi (`MarketplaceContract`)** — satu-satunya tempat tiket boleh
  pindah tangan.
- **Pabrik tiket (`TicketContract`)** — program yang mencetak dan mengatur
  tiket.
- **Pasar sekunder** — jual ulang tiket ke orang lain.
- **Calo / scalping** — memborong tiket untuk dijual lagi lebih mahal.
- **Jastip** — jasa titip; orang yang dititipi sering sudah memegang KTP
  penitip.
- **KYC** — pendaftaran identitas (di sini: data KTP). **NIK** — nomor induk
  di KTP.
- **Stempel** — sebutan santai untuk tanda tangan EIP-712 dari server yang
  mengizinkan smart contract bekerja.
- **Kuota** — jumlah maksimal tiket per kategori.
- **Model B** — satu smart contract untuk banyak event.

## Alat pengembangan

- **Solidity** — bahasa smart contract. **Foundry / forge** — alat
  membangun dan menguji smart contract. **OpenZeppelin** — pustaka
  smart contract standar yang sudah teruji.
- **NestJS** — kerangka server. **TypeORM** — penghubung server ke database.
  **Next.js** — kerangka situs web. **viem / wagmi** — pustaka bicara ke
  blockchain dari JavaScript.
- **Spike** — kode percobaan sekali pakai untuk membuktikan sesuatu jalan;
  tidak dirawat, tidak masuk repo.

## Pengujian

- **Verifikasi** — apakah dibangun dengan benar. **Validasi** — apakah
  orang bisa memakainya.
- **SUS** — kuesioner 10 pertanyaan standar untuk mengukur kemudahan
  penggunaan; hasilnya skor 0–100.
- **Revert** — smart contract menolak dan membatalkan transaksi.
- **`[BUTUH DATA UJI]`** — angka yang belum diukur. Bukan lupa.
