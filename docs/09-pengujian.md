# 09 — Pengujian

## Perumpamaan: uji rem, bukan cuma uji gas

Mobil yang "bisa jalan" belum tentu aman. Yang penting: **bisa berhenti**.
Sistem ini pun begitu — yang membuktikan nilainya bukan "tiket bisa dicetak",
melainkan "tiket palsu **tidak bisa** dicetak, harga calo **tidak bisa**
dipasang, tiket **tidak bisa** diselundupkan lewat pintu belakang". Skenario
"harus gagal" sama pentingnya dengan "harus berhasil".

## Dua jenis pengujian

| | Verifikasi | Validasi |
|---|---|---|
| Pertanyaannya | Apakah dibangun **dengan benar**? | Apakah **orang bisa memakainya**? |
| Caranya | Tes otomatis, uji keamanan, pengukuran | Orang sungguhan mencoba, lalu mengisi kuesioner |
| Kapan | Sepanjang pengerjaan; dikumpulkan Oktober | 19 September |

## Yang terkunci di metodologi skripsi (tidak boleh dipotong)

1. Uji fungsional **tiga alur utama**: daftar, beli, jual ulang.
2. Uji keamanan: percobaan **memindahkan tiket di luar loket resmi** — harus gagal.
3. Uji keamanan: percobaan **melanggar harga terkunci** — harus gagal.
4. **Bukti kepemilikan** NFT lewat blockchain.
5. **Biaya gas** tiap fungsi.
6. **Waktu konfirmasi** pencetakan tiket.
7. Pengujian **subjek nyata** dengan skenario pembelian.
8. **Kuesioner SUS** (kemudahan penggunaan).

## Tingkatan pengujian

**1. Tes per fungsi smart contract (Foundry) — wajib, sejak hari pertama.**
Tiap fungsi: satu tes jalur sukses + satu tes untuk setiap alasan penolakan.
Status: **baru dimulai** untuk `createEvent`, `addCategory`, `setSalesOpen`
(berkas `contracts/test/TicketContract.t.sol`, lokal). Perhatikan: fungsi
pemilik-saja menolak dengan pesan milik OpenZeppelin
(`OwnableUnauthorizedAccount`), bukan pesan kontrak sendiri; dan `block.timestamp`
di tes harus diatur dulu (`vm.warp`) supaya kasus "event sudah lewat"
benar-benar teruji.

**2. Tes per titik layanan server (API) — wajib, seiring kode.** Belum ada
(server belum dibuat).

**3. Uji fungsional per alur.** Tiga alur utama dijalankan ujung ke ujung di
Sepolia. 🔶 Cara mendokumentasikannya masih dibahas (14 September): otomatis
penuh, atau manual bertabel (langkah → hasil harapan → hasil nyata +
tangkapan layar + hash transaksi). Arah yang disarankan: manual bertabel,
diperkuat lampiran hasil tes otomatis tingkat 1–2.

**4. Uji keamanan di Sepolia, dengan bukti hash transaksi.** Transfer
langsung antar dompet → ditolak. Jual ulang dengan harga selain harga asli →
ditolak. Kepemilikan dibuktikan dengan kueri ke blockchain.

**5. Pengukuran.** Gas per fungsi (dari laporan Foundry dan transaksi nyata),
waktu dari "lunas" sampai tiket tercetak (catat sejak awal di server —
datanya gratis), dan angka-angka lain di `08-kualitas-yang-dijanjikan.md`.
Jumlah sampel disepakati dengan pembimbing.

**6. Kuesioner SUS, 19 September.** Responden mencoba skenario **pembelian**
di alamat produksi, lalu mengisi 10 pertanyaan standar SUS. Pakai adaptasi
Bahasa Indonesia yang sumbernya jelas — jangan menerjemahkan sendiri. Catatan
teknis: passkey terikat domain, jadi responden **mendaftar langsung di
domain produksi**; selama responden aktif, kode **tidak diubah** kecuali
rusak fatal.

## Cara menjalankan tes kontrak

Dari Git Bash (Foundry ada di `~/.foundry/bin`):

```
cd contracts
forge test          # semua tes
forge test -vvv     # dengan rincian saat gagal
forge snapshot      # catat gas per tes
```

## Ke mana hasilnya ditulis

Setelah ada hasilnya — bukan sebelumnya:

| Berkas (akan dibuat) | Isi |
|---|---|
| `30-rencana-pengujian.md` | Skenario per alur, daftar uji keamanan, rencana ukur, instrumen SUS — ditulis setelah metode dokumentasi diputuskan |
| `31-hasil-uji-fungsional.md` | Hasil per skenario |
| `32-hasil-uji-keamanan.md` | Bukti transaksi yang ditolak |
| `33-hasil-gas-dan-waktu.md` | Tabel pengukuran |
| `34-hasil-kuesioner-sus.md` | Skor per responden, rata-rata, tafsirnya |
