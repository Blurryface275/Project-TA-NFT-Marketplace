# Pendaftaran Pengguna dan Dompet Otomatis

## Modul ini untuk apa

Ini bagian di sisi server yang bertugas nerima pendaftaran orang baru — cukup pakai alamat surel, gak pakai kata sandi ribet — dan di baliknya diam-diam bikinin "dompet" blockchain buat orang itu secara otomatis, tanpa orangnya perlu tahu-menahu soal kunci rahasia atau istilah teknis blockchain lainnya.

## Kenapa modul ini dibutuhkan

Biasanya, buat bisa pakai sesuatu yang berbasis blockchain, orang harus pasang semacam ekstensi khusus di peramban, terus diminta menyimpan sendiri sederet kata rahasia yang kalau hilang, ya hilang beneran gak bisa dibalikin lagi. Ini jadi penghalang besar buat orang awam yang gak paham dan gak peduli soal itu semua — mereka cuma mau beli tiket konser, bukan belajar teknologi baru.

Dari hasil riset yang dilakukan sebelum proyek ini dibangun, ditemukan bahwa justru inilah salah satu alasan utama kenapa sistem tiket berbasis blockchain susah diterima orang banyak — bukan karena teknologinya kurang aman, tapi karena ribetnya cara makainya. Jadi modul ini penting banget karena tanpanya, seluruh sistem yang sudah dibangun bakal percuma kalau ternyata orang-orang gak sanggup atau gak mau makainya.

## Cara kerjanya

Karena belum ada satu baris kode pun untuk bagian ini, berikut rencana alurnya berdasarkan rancangan yang sudah disepakati:

1. Orang mengisi alamat surelnya di halaman pendaftaran.
2. Sistem mengirim semacam tautan konfirmasi ke surel itu, buat memastikan surelnya beneran punya dia dan bisa diakses.
3. Setelah tautan itu dibuka dan dikonfirmasi, akunnya diaktifkan.
4. Di titik ini, sistem otomatis membuatkan dompet blockchain buat orang itu di belakang layar, pakai semacam alat bantu khusus (rencananya memakai layanan bernama ZeroDev) yang mengurus semua detail teknisnya. Orangnya sama sekali gak perlu tahu apa-apa soal proses ini — dari sudut pandang dia, dia cuma daftar pakai surel seperti biasa.
5. Kalau orang itu mau melanjutkan ke pendaftaran identitas (mengisi data KTP), datanya diproses, lalu dibuatkan semacam "sidik jari digital" dari data itu yang nantinya dicatat ke blockchain — sementara data KTP aslinya sendiri gak disimpan di mana pun setelah proses ini selesai.

Satu hal yang perlu digarisbawahi: bagian ini gak akan pernah meminta orang menyimpan kata rahasia atau kunci apa pun. Kalau di suatu titik nanti muncul permintaan semacam itu, artinya ada yang salah dari rancangan awalnya.

## Nyambung ke modul mana saja

- **Skema database (01)** — modul ini yang menulis data baru ke tabel pengguna dan tabel identitas setiap kali ada pendaftaran.
- **Penghubung blockchain (05)** — modul ini gak bisa langsung "bicara" ke blockchain sendirian; dia perlu minta bantuan modul penghubung buat benar-benar membuat dompet dan mencatat sidik jari digital identitas ke blockchain.

## Status pengerjaan saat ini

**0 persen — belum dimulai sama sekali.** Belum ada proyek server yang dibuat di folder ini (bahkan kerangka dasarnya pun belum di-*install*), jadi belum ada satu baris kode untuk pendaftaran maupun pembuatan dompet otomatis. Yang ada baru rancangan alurnya di dokumen desain.
