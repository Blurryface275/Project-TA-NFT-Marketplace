# tasks.md — Urutan Pembuatan Folder `docs/`

> **Sebelum mulai:** baca `CLAUDE.md` sampai habis, terutama Bagian 3
> (daftar isi proposal yang sudah kedaluwarsa) dan Bagian 10 (larangan).
> Banyak isi proposal PDF sudah tidak berlaku; menyalinnya mentah-mentah akan
> menghasilkan dokumen yang saling bertentangan.

---

## A. Tujuan Akhir

Menghasilkan satu folder `docs/` berisi kebutuhan sistem dari awal sampai
akhir, yang:

1. Sesuai dengan arsitektur final, bukan versi lama di proposal.
2. Bisa dipakai sebagai acuan tunggal saat menulis kode.
3. Bisa diangkat langsung menjadi bahan Bab 3 dan Bab 4 buku tugas akhir.

---

## B. Hasil Akhir yang Diharapkan

```
docs/
├── 00-ringkasan-sistem.md
├── 01-kebutuhan-fungsional.md
├── 02-kebutuhan-non-fungsional.md
├── 03-arsitektur-sistem.md
├── 04-rancangan-database-erd.md      ← statusnya DRAF sampai pembimbing setuju
├── 05-spesifikasi-smart-contract.md
├── 06-spesifikasi-api.md
├── 07-alur-pengguna.md
├── 08-daftar-istilah.md
└── 09-keterbatasan-sistem.md
```

**⚠️ Penting: nomor berkas ≠ urutan pengerjaan.**
Nomor di depan nama berkas hanya mengatur urutan **membaca**. Urutan
**mengerjakannya** berbeda, dan dijelaskan di Bagian D.

---

## C. Peta Ketergantungan — Kenapa Urutannya Begitu

Beberapa dokumen tidak bisa ditulis sebelum dokumen lain selesai:

| Dokumen ini… | …baru bisa ditulis setelah | Alasannya |
|---|---|---|
| Kebutuhan fungsional (01) | Arsitektur (03) | Daftar fitur harus cocok dengan rancangan yang sudah final, bukan sebaliknya |
| Alur pengguna (07) | Kebutuhan fungsional (01) | Alur adalah rangkaian dari fitur-fitur yang sudah didaftar |
| Spesifikasi API (06) | Rancangan database (04) **disetujui** | Titik-titik layanan API mengambil dan menyimpan data dari tabel; kalau tabelnya masih bisa berubah, API-nya ikut berubah |
| Semua dokumen | Daftar istilah (08) | Supaya penyebutan istilah seragam di seluruh berkas |

**Akibat langsung dari peta ini:** rancangan database sedang tertahan menunggu
konsultasi pembimbing, jadi **spesifikasi API adalah dokumen terakhir yang
boleh difinalkan.** Jangan memaksakan urutan nomor berkas.

---

## D. Urutan Pengerjaan

### LANGKAH 1 — Daftar Istilah (`08-daftar-istilah.md`)

**Kenapa duluan:** semua dokumen lain akan memakai istilah ini. Kalau
disamakan sejak awal, tidak perlu perbaikan menyeluruh di akhir.

**Isi yang harus ada:**
- Semua istilah dari Bagian 2 `CLAUDE.md`, disalin dan boleh diperluas
- Istilah khusus proyek: `eventId`, `originalPrice`, allowlist, Paymaster,
  hash KTP, pasar sekunder, jastip
- Setiap istilah dijelaskan untuk pembaca yang **belum tentu paham
  blockchain** — penguji sidang belum tentu ahli blockchain

**Tanda selesai:** setiap singkatan yang muncul di dokumen lain sudah ada
kepanjangan dan penjelasannya di sini.

---

### LANGKAH 2 — Ringkasan Sistem (`00-ringkasan-sistem.md`)

**Kenapa di sini:** ini pondasi yang mengikat semua dokumen lain, dan
bahannya sudah tersedia.

**Isi yang harus ada:**
- Masalah yang diselesaikan (pemalsuan tiket dan manipulasi harga di pasar
  sekunder) — ambil dari latar belakang proposal, **bagian ini masih valid**
- Tujuan sistem
- Manfaat bagi penyelenggara acara dan bagi konsumen
- Batasan lingkup: kategori event yang dicakup, memakai jaringan uji coba
  Sepolia, pembayaran hanya simulasi
- Ringkasan satu paragraf tentang bagaimana sistem menyelesaikan masalah itu

**Tanda selesai:** orang yang belum pernah dengar proyek ini bisa paham
sistemnya untuk apa hanya dengan membaca berkas ini.

---

### LANGKAH 3 — Arsitektur Sistem (`03-arsitektur-sistem.md`)

**Kenapa sebelum daftar kebutuhan:** arsitektur sudah final dan disetujui
pembimbing. Daftar fitur harus menyesuaikan arsitektur, bukan kebalikannya.

**Isi yang harus ada:**
- Gambaran tiga bagian besar: tampilan web (Next.js), server (NestJS), dan
  dua smart contract di blockchain
- Alur data antar bagian: dari pengguna → server → blockchain → kembali
- Uraian setiap keputusan arsitektur dari Bagian 4 `CLAUDE.md`, **beserta
  alasan kenapa dipilih**, bukan hanya "apa"-nya:
  - Kenapa satu kontrak untuk banyak event (Model B), bukan satu kontrak per
    event
  - Kenapa hash, bukan enkripsi, untuk data KTP
  - Kenapa allowlist, bukan Soulbound Token
  - Kenapa penyaring bot dan tanda tangan digital keduanya diperlukan
- Pemisahan data: apa yang disimpan di dalam blockchain, apa yang di IPFS,
  apa yang di MySQL — beserta alasan pembagiannya

**Tanda selesai:** setiap pilihan arsitektur punya penjelasan "kenapa", bukan
sekadar daftar teknologi.

---

### LANGKAH 4 — Kebutuhan Fungsional (`01-kebutuhan-fungsional.md`)

**Kenapa di sini:** sudah ada draf 27 kebutuhan fungsional yang tersebar di 8
modul. Tugasnya **merapikan dan memeriksa**, bukan membuat dari nol.

**Isi yang harus ada:**
- Konsolidasi draf 27 kebutuhan fungsional yang sudah ada
- Setiap kebutuhan diberi kode agar mudah dirujuk, misalnya `KF-01`
- Dikelompokkan per modul
- Perlu ada modul untuk sisi **penyelenggara acara** (membuat event, mengatur
  kuota) — ini sempat kurang jelas di ruang lingkup proposal

**Pemeriksaan wajib sebelum dianggap selesai:**
- [ ] Tidak ada satu pun kebutuhan yang menyebut flash sale atau
      commit-reveal
- [ ] Tidak ada yang menyebut tiket "tidak bisa dipindahkan sama sekali" —
      yang benar adalah hanya bisa lewat marketplace resmi
- [ ] Sudah ada kebutuhan untuk pendaftaran identitas (KYC)

---

### LANGKAH 5 — Kebutuhan Non-Fungsional (`02-kebutuhan-non-fungsional.md`)

**Isi yang harus ada:**
- Konsolidasi draf 15 kebutuhan non-fungsional dalam 7 kategori standar
  ISO/IEC 25010 (standar internasional tentang mutu perangkat lunak)
- Setiap kebutuhan diberi kode, misalnya `KNF-01`

**Aturan keras:** target angka kinerja — kecepatan tanggap, biaya gas, waktu
konfirmasi transaksi — **belum boleh diisi** karena belum ada pengujian
sungguhan. Tulis `[BUTUH DATA UJI]` di tempat angkanya. Mengarang angka di
sini berisiko besar saat sidang, karena penguji bisa meminta bukti
pengukurannya.

---

### LANGKAH 6 — Alur Pengguna (`07-alur-pengguna.md`)

**Kenapa setelah kebutuhan fungsional:** alur adalah rangkaian dari
fitur-fitur yang sudah didaftar di langkah 4.

**Isi yang harus ada — tiga alur utama, bukan empat:**

1. **Pendaftaran akun dan identitas**
   Daftar pakai email → verifikasi email → sistem membuatkan dompet otomatis
   → pengguna mengisi data KTP → data di-*hash* dan disimpan di blockchain,
   data aslinya di MySQL

2. **Pembelian tiket biasa**
   Pilih event dan tiket → lolos penyaring bot → bayar lewat Midtrans →
   pembayaran diverifikasi → tiket NFT dicetak ke dompet pengguna →
   keterangan tiket disimpan di IPFS

3. **Penjualan kembali tiket**
   Pilih tiket yang mau dijual → harga otomatis dikunci sama dengan harga beli
   awal → tiket ditawarkan hanya di marketplace resmi → begitu terjual,
   kepemilikan berpindah lewat `MarketplaceContract`

**Catatan:** proposal menyebut empat alur karena masih memasukkan flash sale.
Sekarang tinggal tiga.

---

### LANGKAH 7 — Spesifikasi Smart Contract (`05-spesifikasi-smart-contract.md`)

**Isi yang harus ada — bedakan dengan jelas mana yang sudah jadi dan mana
yang belum:**

**`TicketContract.sol`**

| Bagian | Status | Keterangan |
|---|---|---|
| `createEvent()` | Sudah ada | Membuat event baru |
| Struktur `EventInfo` | Sudah ada | Menyimpan keterangan event |
| Pemeriksaan `eventId` | Sudah ada | Memastikan event yang dituju ada |
| Pemaksaan kuota | Sudah ada | Mencegah tiket terjual melebihi kuota |
| `mintTicket()` | Sudah ada | Mencetak tiket NFT |
| Pemeriksaan hash KTP | `[BELUM DIIMPLEMENTASI]` | Rumus: `keccak256(data KTP + salt)` |
| Pemeriksaan tanda tangan EIP-712 | `[BELUM DIIMPLEMENTASI]` | Lapisan kontrol akses |

**`MarketplaceContract.sol`** — seluruhnya `[BELUM DIIMPLEMENTASI]`

| Bagian | Keterangan |
|---|---|
| Pembatasan allowlist | Hanya kontrak ini yang boleh memindahkan tiket |
| Penguncian harga jual ulang | Harga dikunci sama dengan `originalPrice` |

**Wajib ditulis:** penjelasan bahwa smart contract bersifat terbuka dan bisa
dipanggil siapa saja lewat RPC. Ini bukan cacat, tapi sifat bawaan blockchain,
dan itulah alasan lapisan tanda tangan digital diperlukan.

---

### LANGKAH 8 — Rancangan Database (`04-rancangan-database-erd.md`)

**⚠️ SEDANG TERTAHAN.** Pembimbing meminta rancangan ini dikonsultasikan
lebih dulu sebelum dikerjakan. Perkiraan slot konsultasi sekitar 14 Agustus
2026.

**Yang boleh dikerjakan sekarang:** menyusun **draf** untuk dibawa
konsultasi. Draf yang rapi membuat sesi konsultasi jauh lebih efektif
daripada datang dengan tangan kosong.

**Baris pertama berkas ini wajib bertuliskan:**
```
STATUS: DRAF — MENUNGGU PERSETUJUAN PEMBIMBING
```

**Isi yang harus ada:**
- Tabel-tabel yang menyimpan data di luar blockchain, berdasarkan poin 10
  ruang lingkup proposal: pengguna, event, kategori tiket, salinan data tiket,
  riwayat pesanan, penawaran jual ulang, notifikasi, riwayat masuk
- **Tambahan yang belum ada di proposal:** tabel penyimpanan data KTP asli
  beserta *salt*-nya
- Untuk setiap tabel: nama kolom, jenis data, kunci utama, dan hubungan antar
  tabel

**Yang wajib DIHAPUS dari daftar tabel di proposal:**
- Tabel flash sale
- Tabel data commit fase flash sale
- Kolom `commitHash`
- Kolom pengingat flash sale

Semua itu sudah tidak relevan karena commit-reveal dihapus.

**Setelah konsultasi:** ubah baris status menjadi
`STATUS: DISETUJUI [tanggal]`, dan catat di bagian bawah berkas apa saja
perubahan yang diminta pembimbing. Catatan ini berguna saat menulis Bab 4.

---

### LANGKAH 9 — Spesifikasi API (`06-spesifikasi-api.md`)

**⚠️ Jangan difinalkan sebelum Langkah 8 disetujui.** Titik-titik layanan API
mengambil data dari tabel; kalau tabelnya masih berubah, pekerjaan ini
terbuang.

**Yang boleh dikerjakan sementara:** daftar kasar titik layanan yang
dibutuhkan tiap alur, tanpa merinci bentuk datanya.

**Isi yang harus ada (setelah database disetujui):**
- Titik layanan untuk pendaftaran dan verifikasi identitas
- Titik layanan untuk daftar event dan pembelian tiket
- Titik layanan untuk penerimaan hasil pembayaran dari Midtrans
- Titik layanan untuk penawaran dan pembelian tiket jual ulang
- Untuk setiap titik layanan: cara pemanggilan, data yang dikirim, data yang
  dikembalikan, dan pesan kesalahan yang mungkin muncul

---

### LANGKAH 10 — Keterbatasan Sistem (`09-keterbatasan-sistem.md`)

**Isi yang harus ada:**
- Keterbatasan pengikatan identitas KTP: calo dan jastip sering sudah
  memegang data KTP pembeli sebelum perebutan tiket, sehingga pengikatan
  identitas bisa ditembus dalam kondisi itu
- Keterbatasan karena memakai jaringan uji coba, bukan jaringan sungguhan
- Keterbatasan karena pembayaran hanya simulasi
- Keterbatasan lain yang ditemukan selama pemrograman — tambahkan seiring
  jalan

**Kenapa ini penting:** menuliskan keterbatasan sendiri lebih baik daripada
ditemukan penguji saat sidang. Menunjukkan bahwa perancang sadar batas
sistemnya justru menambah kredibilitas.

---

### LANGKAH 11 — Pemeriksaan Konsistensi Menyeluruh

Dikerjakan paling akhir, setelah semua berkas ada.

**Daftar periksa:**
- [ ] Tidak ada berkas yang menyebut Soulbound Token sebagai bagian aktif
      sistem
- [ ] Tidak ada berkas yang menyebut commit-reveal atau flash sale sebagai
      bagian aktif sistem
- [ ] Tidak ada berkas yang menyebut Chainlink VRF sebagai bagian aktif
      sistem
- [ ] Jumlah alur utama konsisten: **tiga**, bukan empat
- [ ] Semua penyebutan KYC konsisten: hash satu arah, bukan enkripsi
- [ ] Semua penyebutan tanda tangan digital dibingkai sebagai "lapisan
      kontrol akses berstandar industri", bukan sebagai tambalan kelemahan
- [ ] Semua angka kinerja yang belum diukur masih bertanda `[BUTUH DATA UJI]`
- [ ] Kalau ada rujukan ke Aldweesh (2023), sudah diganti Feulner dkk. (2022)
- [ ] Setiap singkatan teknis punya kepanjangan di daftar istilah
- [ ] Berkas rancangan database masih bertanda DRAF kalau pembimbing belum
      menyetujui

---

## E. Aturan Penulisan yang Berlaku untuk Semua Dokumen

1. **Bahasa Indonesia**, karena akan diangkat menjadi isi buku tugas akhir.
2. **Setiap singkatan ditulis kepanjangannya** saat pertama kali muncul.
3. **Setiap keputusan disertai alasan.** Pola yang dipakai: apa yang dipilih →
   kenapa dipilih → apa akibatnya. Jangan hanya mendaftar teknologi.
4. **Bedakan dengan tegas** antara yang sudah jadi, yang sedang dikerjakan,
   dan yang masih rencana. Gunakan penanda `[BELUM DIIMPLEMENTASI]`.
5. **Jangan mengarang angka.** Gunakan `[BUTUH DATA UJI]`.
6. **Jangan mengarang sumber rujukan.**

---

## F. Catatan Status

**6 Agustus 2026**
- Rancangan database masih tertahan menunggu konsultasi pembimbing, perkiraan
  sekitar 14 Agustus. Langkah 8 dan 9 ikut tertahan.
- Langkah 1 sampai 7 **tidak bergantung pada database**, jadi bisa dikerjakan
  penuh sekarang tanpa menunggu siapa pun.
- Batas penambahan fitur baru 10 Agustus 2026 berlaku untuk **kode**, bukan
  untuk dokumen. Penulisan folder `docs/` tetap boleh berjalan selama masa
  magang.
