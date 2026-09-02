# Panduan Pengerjaan (2 September – 17 November 2026)

> **Berkas kerja — tidak masuk buku.** Checklist per fase ada di `TASKS.md`
> (root); berkas ini mengatur **kapan**-nya. Kepadatan bertingkat: harian
> sampai 21 September, mingguan sampai 17 Oktober, per fase sesudahnya —
> rencana harian sepuluh minggu ke depan pasti meleset begitu hasil
> konsultasi dan kendala teknis masuk.
>
> **Asumsi kapasitas:** 4–5 jam per hari kerja (sambil magang), 6–8 jam di
> akhir pekan. Konsultasi pembimbing tiap Senin 09.00.
>
> **Aturan peran (CLAUDE.md Bagian 8):** semua kode ditulis Edward. Asisten
> menjelaskan pola, meninjau hasil, dan menunjuk kesalahan — akhiri tiap hari
> kerja kode dengan minta asisten meninjau apa yang ditulis hari itu.
>
> Perbarui berkas ini setiap Senin sesudah konsultasi.

---

## 1. Harian — 2 s.d. 21 September

Prinsip: **satu jalur tembus dulu** (alur pembelian), bukan lapisan demi
lapisan. Kuesioner 19 September hanya butuh skenario pembelian; jual ulang
dan penukaran tiket menyusul untuk uji fungsional Oktober.

| Hari | Kerjaan | Target terverifikasi |
|---|---|---|
| Rab 2/9 | Penataan repo (selesai): docs dipulihkan, .gitignore, TASKS.md, docs/kerja/, CLAUDE.md sinkron. Commit penataan | `git status` bersih |
| Kam 3/9 | Test Foundry untuk fungsi yang **sudah ada**: `createEvent`, `addCategory`, `setSalesOpen` — jalur sukses + tiap revert. Tidak terblokir keputusan apa pun | `forge test` hijau, ≥10 skenario |
| Jum 4/9 | Gerbang EIP-712: struct izin, domain, verifikasi penanda tangan, nonce, deadline (perhatikan CLAUDE.md 9.1 jebakan 2–3) | Test: tanda tangan salah / nonce ulang / kedaluwarsa → revert |
| Sab 5/9 | Penimpaan `_update` untuk allowlist (jebakan 1: mint & burn tetap lolos); kerangka `mintTicket` — bagian yang tergantung K3/K10 ditandai dulu | Test: transfer langsung antar dompet → revert |
| Min 6/9 | Baca ulang `docs/kerja/keputusan.md`, lengkapi pendapat sendiri per K, cetak ERD untuk dibawa | Bahan konsultasi siap |
| **Sen 7/9** | **Konsultasi 09.00: K1–K7 + K10.** Sore: catat hasil di keputusan.md + catatan-konsultasi.md, perbarui TASKS.md & CLAUDE.md, sesuaikan struct kontrak bila K3/K10 mengubahnya | Semua K target hari ini putus dan tercatat |
| Sel 8/9 | `mintTicket` + `registerIdentity` final sesuai keputusan + test lengkap | `forge test` hijau termasuk mint |
| Rab 9/9 | `MarketplaceContract` sesuai K2: price-lock + `executeResale` + test integrasi mint→tawar→beli + test keamanan. *Bila K2 belum putus: ambil opsi tersederhana (hanya executeResale on-chain), catat sebagai keputusan sementara* | Test integrasi hijau |
| Kam 10/9 | Skrip deploy + deploy Sepolia + seed event + **bukti sponsorship sesuai K7** (smart account + 1 UserOperation tersponsori, atau 1 transaksi EOA). Putuskan K11 hosting | Alamat kontrak + hash transaksi bukti tercatat di `alamat-kontrak.md` |
| Jum 11/9 | Scaffold NestJS + TypeORM + migrasi ERD; modul event/katalog | Migrasi jalan di DB kosong; endpoint katalog hidup |
| Sab 12/9 | Auth + registrasi passkey (pakai temuan `catatan-spike-passkey.md`) + endpoint KYC sesuai K10 | Test API daftar→masuk→passkey→KYC hijau |
| Min 13/9 | Midtrans Snap + webhook idempoten + pipeline mint + `ticket_cache`; catat lama konfirmasi sejak sekarang (data Bab 6 gratis) | Bayar uji → NFT tercetak di Sepolia |
| **Sen 14/9** | **Konsultasi: K8 + K9** + laporan kemajuan. Sore: scaffold Next.js + halaman daftar/masuk/katalog | K9 putus; katalog menampilkan data nyata |
| Sel 15/9 | Frontend: detail event, beli, redirect Snap, status pesanan, tiket saya | Alur beli lokal tembus ujung-ke-ujung |
| **Rab 16/9** | **GERBANG:** pasang semua ke hosting K11; uji dari jaringan luar | 1 pembelian sukses dari luar rumah |
| Kam 17/9 | Perbaikan; skenario responden tertulis + formulir SUS 10 butir (pakai adaptasi bahasa Indonesia yang bersumber jelas); uji pilot ≥2 orang | Pilot selesai + daftar perbaikan |
| Jum 18/9 | Perbaiki temuan pilot; **bekukan fitur malam ini** | Tidak ada perubahan kode setelah malam ini |
| **Sab 19/9** | **SEBAR KUESIONER.** Pantau, cadangkan jawaban, catat insiden, cek kuota Paymaster | Jumlah responden tercatat |
| Min 20/9 | Pantau responden; mulai kerangka draf Bab 5 | Kerangka bab ada |
| Sen 21/9 | Konsultasi: hasil awal kuesioner; perbarui TASKS.md + panduan ini | Notulen + rencana minggu berikutnya |

**Aturan bila meleset (periode ini):**
- Pekerjaan kontrak molor > 2 hari → potong `TASKS.md` §12 butir 4
  (penukaran tiket) dan 7 (multi-kategori).
- ZeroDev UserOperation macet ≥ 1 hari penuh → K7 jatuh ke pilihan EOA untuk
  kuesioner; catat jujur di keterbatasan.
- Gerbang 16/9 gagal → geser penyebaran ke 22–26 September (**mutlak paling
  lambat 26/9** supaya analisis kuesioner masuk go/no-go), sambil memotong
  §12 butir 1, 2, 6.
- Kuesioner mustahil ≤ 26/9 → **bukan keputusan sepihak** — bahas dengan
  pembimbing di konsultasi 21/9.

---

## 2. Mingguan — 22 September s.d. 17 Oktober

**Minggu 22–28 Sep.** Draf Bab 5 terkirim **26 Sep** (bahan:
`docs/10–12-implementasi-*.md` yang ditulis begitu modulnya jadi + tangkapan
layar + alamat kontrak); alur jual ulang tembus ujung-ke-ujung; analisis SUS
awal. *Terverifikasi sebelum lanjut:* draf Bab 5 di tangan pembimbing.
*Kalau meleset:* penulisan pindah ke akhir pekan; semua pekerjaan fitur di
luar `TASKS.md` §11 berhenti.

**Minggu 29 Sep–5 Okt.** Eksekusi verifikasi sesuai K9: uji fungsional tiga
alur, uji keamanan dengan bukti hash transaksi, ukur gas per fungsi + waktu
konfirmasi mint; isi semua `[BUTUH DATA UJI]`. *Terverifikasi:* tabel data
lengkap di `docs/21–23`. *Kalau meleset:* kerjakan §11 saja, buang pengukuran
tambahan apa pun.

**6–8 Okt — GO/NO-GO.** Kriteria GO (keempatnya wajib):
1. Responden terkumpul ≥ jumlah minimum yang disepakati pembimbing;
2. Tiga alur lulus uji fungsional;
3. Data gas + waktu konfirmasi lengkap;
4. Draf Bab 5 sudah direspons pembimbing.

NO-GO → §12 dipotong habis; lingkup Bab 6 dibatasi ke data yang benar-benar
ada; minta konsultasi luar jadwal.

**Minggu 6–12 Okt.** Revisi + **setor Bab 5 (10 Okt)**; mulai Bab 6 dari
data terkumpul.

**Minggu 13–17 Okt.** **Setor Bab 6 (17 Okt)**; draf Bab 7 (kesimpulan
menjawab rumusan masalah + saran).

---

## 3. Garis besar — 18 Oktober s.d. 17 November

**18–31 Okt — Rakit dan revisi.** Naskah lengkap satu berkas; konsistensi
silang antarbab (istilah, angka, rujukan — ingat larangan Aldweesh 2023);
revisi dari konsultasi 19/10 dan 26/10. *Terverifikasi:* naskah utuh.
Setelah 31/10: hanya perbaikan teks — kode tidak disentuh kecuali fatal
untuk demo.

**1–7 Nov — Administrasi.** Cek plagiarisme → perbaikan → ACC pembimbing →
ajukan sidang. *Terverifikasi:* bukti ACC + pendaftaran sidang.

**10 Nov — LSTA.** **11–16 Nov:** latihan presentasi + **rekam video demo
cadangan** (kalau Sepolia/hosting bermasalah saat sidang, demo tetap ada).
**17 Nov — sidang dimulai.**

*Kalau meleset di fase ini:* prioritas mutlak = naskah dan ACC; fitur atau
pengukuran apa pun yang belum ada dinyatakan apa adanya di keterbatasan,
tidak dikejar lagi.
