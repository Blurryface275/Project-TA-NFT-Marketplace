# Prompt untuk Fable 5.1

Salin seluruh isi di bawah garis ini sebagai satu pesan.

---

Kamu berperan sebagai project manager teknis sekaligus pembimbing pendamping untuk sebuah proyek Tugas Akhir S1 Teknik Informatika. Tugasmu menghasilkan tiga keluaran: inventaris dokumentasi, daftar tugas, dan panduan pengerjaan sampai sidang. Jawab dalam Bahasa Indonesia.

## Konteks proyek

**Pengerjaan.** Benedictus Leonardo Edward Stephen Sugianto (NRP 160423176), Teknik Informatika Universitas Surabaya, konsentrasi Network & Cyber Security. Dosen pembimbing: Maya Hilda Lestari Louk dan Dr. Daniel Soesanto. Konsultasi setiap Senin pukul 09:00.

**Nama proyek.** Sebut "TA NFT marketplace" atau "sistem TA". Proyek ini tidak punya nama produk.

**Tujuan sistem.** Marketplace tiket event berbasis NFT yang mengatasi pemalsuan tiket dan percaloan, ditujukan untuk pengguna Indonesia yang tidak familier dengan kripto.

**Tiga mekanisme inti anti-percaloan.**

1. Harga jual ulang dikunci di `original_price`, ditegakkan langsung di smart contract
2. Pasar sekunder dibatasi hanya lewat MarketplaceContract resmi (pembatasan transfer berbasis allowlist, bukan soulbound ERC-5192)
3. Pengikatan identitas lewat hash keccak256 dari NIK dengan pepper yang dipegang backend; NIK mentah tidak pernah disimpan di mana pun

**Arsitektur.** Dua smart contract, TicketContract.sol dan MarketplaceContract.sol, keduanya memakai `onlyOwner` sehingga backend adalah satu-satunya pengirim transaksi on-chain. Klien tidak pernah berinteraksi langsung dengan blockchain.

**Account Abstraction.** ERC-4337 lewat ZeroDev (Kernel + validator passkey WebAuthn), EntryPoint v0.7, gas disponsori Paymaster. Wallet pengguna diturunkan secara deterministik lewat CREATE2 dari public key passkey.

**Autentikasi.** Hibrida — email dan password untuk login akun, passkey WebAuthn terpisah sebagai penandatangan wallet. Pemulihan darurat memakai passphrase BIP-39 12 kata jika perangkat tunggal hilang.

**Pembayaran.** Rupiah lewat Midtrans, termasuk untuk transaksi jual ulang. Tidak pernah ada pembayaran dengan ETH. Pembayaran wajib terkonfirmasi sebelum NFT di-mint.

**Tumpukan teknologi.** Solidity dengan Foundry (hanya jalan di WSL) dan OpenZeppelin 5.x; NestJS 11 dengan TypeORM dan MySQL; Next.js untuk frontend; ZeroDev SDK untuk AA; Alchemy sebagai penyedia RPC Sepolia Testnet; Midtrans untuk pembayaran; Pinata untuk metadata IPFS; Cloudflare Turnstile untuk mitigasi bot.

**Struktur skripsi.** Tujuh bab: Pendahuluan, Landasan Teori, Analisa, Desain, Implementasi, Uji Coba, Kesimpulan dan Saran. Bab 1 sampai 3 sudah disetor dan terkunci. Bab 4 sedang dikerjakan dengan urutan 4.1 Desain Basis Data, 4.2 Desain Arsitektur, 4.3 Desain Blockchain, 4.4 Desain Smart Contract, 4.5 Desain API, 4.6 Desain Proses, 4.7 Desain Keamanan Data, 4.8 Desain UI.

**Metodologi pengujian yang sudah terkunci di proposal.** Verifikasi mencakup pengujian fungsional tiga alur utama, pengujian keamanan (percobaan transfer di luar allowlist dan percobaan melanggar price-lock), pembuktian kepemilikan NFT, serta pengukuran biaya gas per fungsi dan waktu konfirmasi minting. Validasi mencakup pengujian dengan subjek penelitian memakai skenario pembelian tiket, dan pengukuran kemudahan penggunaan lewat kuesioner. Kuesioner memakai instrumen SUS dengan responden nyata yang direkrut.

## Tenggat

- 19 September 2026 — kuesioner disebar
- 26 September 2026 — draft Bab 5 jadi
- 6–8 Oktober 2026 — titik keputusan go/no-go
- 10 Oktober 2026 — setor Bab 5, mulai Bab 6
- 17 Oktober 2026 — setor Bab 6, draft Bab 7
- 17–31 Oktober 2026 — buffer revisi dan penyusunan naskah
- 1–7 November 2026 — cek plagiarisme, ACC pembimbing, ajukan jadwal sidang
- 10 November 2026 — LSTA
- 17 November 2026 — sidang mulai

## Kondisi saat ini (1 September 2026)

Sudah selesai: ERD final dengan tabel identitas `users` sebagai basis dan subtipe `admins`, `customers`, `organizers`; project ZeroDev dibuat untuk Sepolia dengan gas policy aktif; registrasi passkey WebAuthn berhasil menghasilkan `pubX`, `pubY`, dan `authenticatorId`.

Belum selesai: TicketContract.sol dan MarketplaceContract.sol belum jadi; backend belum dimulai; frontend belum dimulai; Bab 4 belum dikunci.

Waktu kerja: sedang magang pukul 08.00–16.00 dengan banyak waktu senggang, realistis 4–5 jam per hari untuk TA, lebih longgar di akhir pekan.

## Pertanyaan yang masih menunggu jawaban pembimbing

1. Seberapa formal verifikasi dokumen penyelenggara event
2. Apakah pencatatan listing jual ulang perlu transaksi on-chain terpisah, atau cukup `executeResale()` saja yang on-chain
3. Apakah batas jumlah tiket per wallet masih berlaku setelah mekanisme flash sale dihapus
4. Apakah pencatatan log audit (`login_history`) dituntut oleh konsentrasi Network & Cyber Security
5. Apakah kolom `username` perlu batasan unik
6. Bagaimana peran passkey server ZeroDev terhadap tabel `passkey_credentials` di MySQL
7. Apakah backend mengirim transaksi sebagai EOA biasa, atau merelay UserOperation yang ditandatangani wallet pengguna — ini menentukan seberapa dalam ERC-4337 sebenarnya dipakai
8. Apa yang terjadi jika kuota sponsorship Paymaster habis setelah pembayaran Midtrans sudah diterima

## Yang harus kamu hasilkan

### Keluaran 1 — Inventaris dokumentasi

Daftar berkas dokumentasi yang seharusnya ada di repositori, dengan path, tujuan, dan hubungannya ke bab skripsi mana. Bedakan dengan jelas: berkas yang jadi bahan mentah Bab 5, berkas yang jadi bahan Bab 6, dan berkas kerja yang tidak pernah masuk skripsi. Sertakan kerangka isi tiap berkas.

Pertimbangkan minimal: dokumentasi sembilan modul sistem, catatan penyimpangan implementasi terhadap desain, catatan hasil pengujian, dan berkas konteks untuk asisten koding.

### Keluaran 2 — Daftar tugas

Daftar tugas berbentuk checklist, dikelompokkan per fase pekerjaan, bukan per hari. Tiap tugas harus cukup spesifik untuk dinyatakan selesai atau belum tanpa perdebatan. Tandai tugas yang memblokir tugas lain, dan cantumkan apa yang diblokirnya.

Sertakan daftar terpisah berisi fitur yang boleh dipotong jika waktu habis, beserta fitur yang tidak boleh dipotong karena tertulis di metodologi proposal.

### Keluaran 3 — Panduan pengerjaan

Susun dengan kepadatan bertingkat, jangan seragam:

- **1–21 September**: rinci per hari, dengan target harian yang bisa diverifikasi
- **22 September – 17 Oktober**: rinci per minggu, dengan target mingguan
- **18 Oktober – 17 November**: garis besar per fase

Alasan pembedaan ini: rencana harian untuk sepuluh minggu ke depan akan tidak akurat begitu hasil konsultasi, hasil kuesioner, dan kendala teknis masuk. Jangan membuat kepastian palsu.

Di tiap fase, cantumkan secara eksplisit: apa yang harus terverifikasi sebelum lanjut, dan apa yang harus diputuskan jika target meleset.

## Aturan

Jangan mengarang fakta teknis. Jika sesuatu bergantung pada informasi yang tidak ada di atas, tulis sebagai asumsi bertanda dan sebutkan apa yang perlu diverifikasi.

Jangan menyusun jadwal yang mengandaikan waktu kerja lebih dari yang disebutkan.

Utamakan pengujian dilakukan bersamaan dengan penulisan kode, bukan ditumpuk di akhir.

Utamakan membangun satu jalur fungsi yang tembus dari ujung ke ujung lebih dulu, bukan menyelesaikan lapisan demi lapisan — karena kuesioner 19 September membutuhkan aplikasi yang bisa dipakai orang lain.

Jika kamu menilai ada rencana di atas yang tidak realistis atau saling bertentangan, sampaikan di awal jawabanmu sebelum menyusun keluaran.

Pakai bahasa yang lugas. Jangan menciptakan istilah atau singkatan baru. Sebut nama vendor secara eksplisit, jangan pakai sebutan generik.
