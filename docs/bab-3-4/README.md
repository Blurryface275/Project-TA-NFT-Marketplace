# Bahan Bab 3–4 (format formal skripsi)

Folder ini berisi dokumen **formal** yang menjadi bahan mentah Bab 3
(analisis) dan Bab 4 (perancangan) buku tugas akhir. Gaya bahasanya baku,
bertabel, dan memakai kode kebutuhan (`KF-xx`, `KNF-xx`) untuk penelusuran —
**sengaja dipertahankan** karena skripsi membutuhkannya.

Penjelasan versi santai untuk orang awam ada di folder induk (`docs/00` –
`docs/11`). Keduanya menjelaskan sistem yang sama; kalau ada perbedaan isi,
yang menang adalah keputusan terbaru di `CLAUDE.md` dan `docs/kerja/keputusan.md`.

| Berkas | Bab tujuan | Catatan status (2 September 2026) |
|---|---|---|
| `00-ringkasan-sistem.md` | Bab 1 & 3 | Bagian dompet masih menulis "cukup surel tanpa kata sandi" — perlu disesuaikan ke model email + kata sandi + passkey |
| `01-kebutuhan-fungsional.md` | Bab 3 | Modul akun (KF-01–06) dan identitas (KF-07–12) menunggu keputusan skema KYC dan model autentikasi |
| `02-kebutuhan-non-fungsional.md` | Bab 3 | Bagian privasi data KTP menunggu keputusan skema KYC |
| `05-spesifikasi-smart-contract.md` | Bab 4 | Bagian status sudah disinkronkan; paragraf "pengguna tidak memegang kunci pribadi" perlu dikoreksi (passkey = kunci milik pengguna) |
| `08-daftar-istilah.md` | Lampiran | Belum memuat istilah passkey, WebAuthn, P-256, CREATE2, TPM/Secure Enclave, BIP-39 |
| `09-keterbatasan-sistem.md` | Bab 4 & 7 | Butir 4 perlu ditulis ulang (kehilangan perangkat, bukan "tidak memegang kunci"); butir 2–3 menunggu skema KYC |

Empat berkas seri ini (`03` arsitektur, `04` ERD, `06` API, `07` alur) sudah
dipindahkan ke `docs/arsip/` karena mengikuti rancangan awal Agustus yang
berbeda dari ERD final 25 Agustus. Penggantinya ditulis setelah keputusan
skema KYC putus.

**Aturan:** jangan menulis ulang berkas di sini menjadi gaya santai. Revisi
isi dilakukan sekali, setelah konsultasi 7 September, mengikuti keputusan yang
diambil.
