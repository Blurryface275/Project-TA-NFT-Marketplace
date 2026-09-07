# Dokumentasi Proyek — Peta Baca

Dokumen di folder ini ditulis supaya **siapa pun paham**: teman yang baru
masuk tim, product manager, sampai orang yang belum pernah dengar kata
"blockchain". Gaya bahasanya santai, pakai perumpamaan sehari-hari, dan
langsung ke inti.

Ditulis ulang **2 September 2026**. Ada empat folder:

| Folder | Isinya | Untuk siapa |
|---|---|---|
| `docs/` (berkas `00`–`11`) | Penjelasan santai dengan perumpamaan | Semua orang |
| `docs/bab-3-4/` | Bahan formal Bab 3–4 skripsi (baku, bertabel, pakai kode `KF`/`KNF`) — **jangan ditulis ulang jadi santai** | Penulisan skripsi |
| `docs/kerja/` | Jadwal, log keputusan, catatan konsultasi, alamat kontrak | Pengerjaan sehari-hari; tidak masuk skripsi |
| `docs/arsip/` | Rancangan awal Agustus yang sudah digantikan + `modules/` lama | Riwayat saja, bukan acuan |

## Baca yang mana?

| Kalau kamu… | Baca |
|---|---|
| Baru pertama dengar proyek ini | `00` → `01` → `11` (istilah) |
| Product manager / bukan orang teknis | `00`, `02`, `03`, `10` |
| Developer baru | `01`, `04`, `05`, `06`, `07`, `09` |
| Mau tahu apa yang **belum diputuskan** | `kerja/keputusan.md` |
| Mau tahu jadwal dan tugas | `TASKS.md` (di root), `kerja/panduan-pengerjaan.md` |

## Daftar dokumen

| Berkas | Isinya, satu kalimat |
|---|---|
| `00-gambaran-besar.md` | Masalah apa yang diselesaikan, dan caranya |
| `01-cara-kerja-sistem.md` | Bagian-bagian sistem dan cara mereka bicara satu sama lain |
| `02-fitur-sistem.md` | Semua yang bisa dilakukan, dikelompokkan per siapa yang memakai |
| `03-alur-pengguna.md` | Langkah demi langkah: daftar, beli, jual ulang |
| `04-dompet-dan-passkey.md` | Kenapa pengguna tidak perlu paham blockchain |
| `05-smart-contract.md` | Aturan yang dipaksa mesin, dan apa yang sudah/belum ada di kode |
| `06-database.md` | Lemari arsip di luar blockchain |
| `07-pembayaran-penyimpanan-bot.md` | Midtrans, Pinata/IPFS, Cloudflare Turnstile |
| `08-kualitas-yang-dijanjikan.md` | Janji mutu — cepat, aman, gampang dipakai |
| `09-pengujian.md` | Cara membuktikan semuanya benar-benar jalan |
| `10-keterbatasan.md` | Apa yang sistem ini **tidak** bisa, dan kenapa |
| `11-istilah.md` | Kamus, dijelaskan dengan perumpamaan |

## Tanda yang dipakai di semua dokumen

- 🔶 **Masih dibahas dengan dosen pembimbing** — jangan dibangun dulu. Daftar
  lengkapnya di `kerja/keputusan.md`.
- `[BUTUH DATA UJI]` — angkanya baru ada setelah diukur. Bukan lupa diisi.
- ✅ sudah ada di kode · 🚧 belum ada di kode.

## Aturan menulis di folder ini

1. Tanpa kode seperti "K10" atau "KF-01". Sebut **nama** fitur atau
   keputusannya.
2. Kalau istilah teknis tak terhindarkan, jelaskan sekali dengan perumpamaan,
   lalu pakai.
3. Jangan mengarang angka, jangan mengarang status. Kalau belum ada di kode,
   tulis belum.
4. Berkas kerja (jadwal, keputusan, catatan konsultasi) ada di `kerja/` dan
   **tidak masuk skripsi**.
5. Dokumen hasil implementasi (`20-*`) dan hasil pengujian (`30-*`) **baru
   ditulis setelah** modul/pengujiannya benar-benar ada — bukan sebelumnya.
