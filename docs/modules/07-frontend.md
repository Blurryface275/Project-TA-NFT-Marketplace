# Tampilan yang Dipakai Pengguna

## Modul ini untuk apa

Ini adalah halaman-halaman web yang benar-benar dilihat dan disentuh langsung sama pengguna — mulai dari halaman daftar akun, sampai halaman melihat tiket yang sudah dibeli. Kalau modul-modul lain kerjanya di balik layar, modul inilah wajah dari seluruh sistem.

## Kenapa modul ini dibutuhkan

Semua kerumitan teknis yang ada di balik layar — blockchain, dompet otomatis, verifikasi pembayaran — itu semua gak ada gunanya kalau pengguna gak punya cara mudah buat berinteraksi dengannya. Modul ini yang membungkus semua kerumitan itu jadi tombol-tombol dan formulir yang bisa dipakai orang biasa tanpa perlu tahu apa yang terjadi di baliknya.

Ada satu hal penting yang perlu dipahami soal modul ini: **halaman web ini gak boleh dipercaya untuk menyimpan atau menegakkan aturan keamanan apa pun**. Karena apa pun yang berjalan di sisi tampilan bisa dilihat dan diakali oleh orang yang cukup paham caranya — jadi semua pemeriksaan yang benar-benar penting (memastikan pembayaran lunas, memastikan harga gak diakalin, dan sebagainya) harus dilakukan di tempat lain yang gak bisa dilihat atau diubah dari luar, yaitu di sisi server dan di dalam smart contract-nya sendiri. Tampilan ini tugasnya cuma jadi jembatan yang nyaman, bukan penjaga gerbang.

## Cara kerjanya

Belum ada kode yang ditulis untuk modul ini. Berikut rencana halaman-halaman yang akan dibuat, berurutan sesuai perjalanan seorang pengguna:

1. **Halaman pendaftaran.** Tempat orang memasukkan alamat surelnya, lalu diarahkan buat konfirmasi lewat surel yang dikirim.
2. **Halaman pengisian data identitas.** Setelah akun aktif, orang mengisi data KTP-nya di sini untuk didaftarkan sekali saja.
3. **Halaman katalog event.** Menampilkan daftar acara yang bisa dibeli tiketnya, lengkap dengan kategori tiket dan sisa kuotanya.
4. **Halaman pembelian dan pembayaran.** Di sinilah nanti muncul teka-teki penyaring bot sebelum orang bisa lanjut, lalu diarahkan ke proses pembayaran.
5. **Halaman "tiket saya".** Tempat orang melihat tiket-tiket yang sudah dia miliki, sekaligus bisa jadi bukti kepemilikan yang bisa diperiksa siapa saja.
6. **Halaman jual ulang tiket.** Tempat orang menawarkan tiketnya untuk dijual lagi — dan sesuai rancangan, di halaman ini gak akan ada kolom buat mengetik harga sendiri, karena harganya otomatis mengikuti harga beli pertama.

## Nyambung ke modul mana saja

- **Pendaftaran dan dompet (04)** — halaman pendaftaran dan pengisian identitas terhubung langsung ke modul ini di sisi server.
- **Pembayaran dan penyimpanan berkas tiket (06)** — halaman pembelian dan pembayaran memicu proses yang ditangani modul itu.
- **Pencegahan bot (08)** — teka-teki penyaring bot yang muncul di halaman pembelian berasal dari modul itu.

## Status pengerjaan saat ini

**0 persen — belum ada kodenya sama sekali.** Belum ada proyek tampilan yang dibuat di folder ini (kerangka dasarnya pun belum di-*install*). Semua halaman di atas baru sebatas rencana berdasarkan alur pengguna yang sudah dirancang.
