# Pencegahan Bot

## Modul ini untuk apa

Ini bagian yang tugasnya membedakan mana pengunjung yang beneran manusia dan mana yang sebenarnya program otomatis (istilah umumnya bot) yang dijalankan buat mendaftar atau membeli tiket secara massal dalam waktu singkat.

## Kenapa modul ini dibutuhkan

Salah satu cara calo mendapatkan banyak tiket dengan cepat adalah memakai program otomatis yang bisa mengisi formulir dan menekan tombol beli jauh lebih cepat daripada manusia biasa, bahkan bisa dijalankan berkali-kali sekaligus. Kalau ini dibiarkan, orang-orang yang beneran mau nonton acaranya bisa kalah cepat dari program semacam ini.

Perlu digarisbawahi juga: modul ini **cuma menghadang program otomatis yang beroperasi lewat halaman web**. Dia gak bisa mencegah seseorang yang bekerja manual dengan banyak perangkat sekaligus (misalnya minta bantuan beberapa orang buat ikut membeli bersamaan), dan juga gak bisa mencegah seseorang yang mencoba memanggil smart contract secara langsung tanpa lewat halaman web sama sekali. Untuk yang terakhir ini, penjagaannya ada di tempat lain (di dalam smart contract-nya sendiri, lewat mekanisme surat izin digital yang sudah dijelaskan di modul 02 dan 03) — karena penyaring bot ini dan penjagaan di smart contract itu menghadang dua jalur masuk yang berbeda, bukan saling menggantikan satu sama lain.

## Cara kerjanya

Belum ada kode yang ditulis untuk modul ini. Rencananya begini:

1. Di halaman pembelian, dimunculkan semacam teka-teki kecil dari layanan luar (rencananya memakai layanan bernama Cloudflare Turnstile) yang secara diam-diam menilai apakah yang mengaksesnya kelihatan seperti manusia beneran atau program otomatis, tanpa perlu pengguna melakukan apa pun yang ribet.
2. Kalau lolos, pengunjung diberikan semacam "bukti lulus" yang dikirim bersama permintaan pembeliannya.
3. Ini bagian pentingnya: **bukti lulus itu gak boleh cuma dipercaya begitu saja dari sisi tampilan**. Server harus memeriksa ulang bukti itu ke layanan penyedianya, karena kalau cuma dipercaya dari sisi tampilan, orang yang cukup paham caranya bisa memalsukan "sudah lolos" padahal belum pernah benar-benar diperiksa.
4. Bukti lulus ini juga cuma boleh dipakai sekali dan cepat kedaluwarsa, supaya gak bisa disimpan lalu dipakai berulang-ulang buat banyak percobaan pembelian.

## Nyambung ke modul mana saja

- **Tampilan pengguna (07)** — di sinilah teka-teki penyaring bot itu ditampilkan ke pengunjung.
- **Pembayaran dan penyimpanan berkas tiket (06)** — server di modul itu yang akan memeriksa ulang bukti lulusnya sebelum melanjutkan proses pembelian.

## Status pengerjaan saat ini

**0 persen — belum ada kodenya.** Belum ada percobaan menyambungkan ke layanan penyaring bot ini sama sekali. Yang sudah ada baru pemahaman soal batasan-batasannya (bahwa ini cuma efektif buat program otomatis lewat halaman web, gak buat kerja manual atau pemanggilan langsung ke smart contract) yang sudah dituliskan di dokumen rancangan.
