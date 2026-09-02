# Penghubung ke Smart Contract

## Modul ini untuk apa

Ini bagian di sisi server yang tugasnya jadi "jembatan komunikasi" antara sistem dan smart contract yang sudah dipasang di blockchain. Semua bagian lain dari sistem yang butuh baca data dari blockchain atau mengirim sesuatu ke sana, lewat sini caranya — gak ada bagian lain yang "bicara" langsung ke blockchain sendiri-sendiri.

## Kenapa modul ini dibutuhkan

Di proyek ini, pengguna biasa gak pernah berhubungan langsung dengan blockchain. Semua transaksi — mencetak tiket, mencatat identitas, dan sebagainya — dikirim oleh server atas nama pengguna, bukan dikirim langsung dari peramban orang itu. Ada tiga alasan kenapa begini: pengguna gak punya "uang digital" buat bayar biaya transaksi (jadi sistem yang nanggung), kunci rahasia milik sistem gak boleh sampai bocor ke sisi pengguna, dan verifikasi pembayaran harus dipastikan dulu oleh server sebelum tiket benar-benar dicetak.

Karena semua itu, server butuh satu bagian khusus yang mengurus detail teknis "cara bicara" ke blockchain — mulai dari memilih jalur komunikasi yang tepat, sampai mengurus dompet-dompet otomatis milik para pengguna. Modul inilah yang mengurus semua itu, supaya bagian-bagian lain sistem cukup "minta tolong" tanpa perlu tahu detail teknisnya.

## Cara kerjanya

Belum ada kode yang ditulis untuk bagian ini, jadi berikut gambaran rencananya:

1. Server butuh jalur komunikasi resmi ke jaringan blockchain (rencananya memakai layanan bernama Alchemy sebagai penyedia jalur itu), karena server gak bisa asal "nyambung" begitu saja ke jaringan blockchain tanpa lewat penyedia semacam ini.
2. Server juga punya kunci rahasianya sendiri yang dipakai buat menandatangani dan mengirim transaksi atas nama sistem — misalnya saat mengirim "surat izin digital" yang dibutuhkan smart contract sebelum mau mencetak tiket.
3. Untuk dompet-dompet otomatis milik pengguna (yang dibuat di modul pendaftaran), modul ini yang benar-benar menjalankan pembuatannya lewat alat bantu khusus tadi (ZeroDev), dan yang mengurus supaya biaya transaksi pengguna ditanggung sistem, bukan orangnya.
4. Modul ini menyediakan semacam "layanan siap pakai" ke bagian lain sistem — misalnya modul pembayaran bisa "minta tolong" ke sini untuk mencetak tiket, tanpa perlu tahu detail teknis bagaimana caranya sampai ke blockchain.

## Nyambung ke modul mana saja

- **Kontrak pintar tiket (02) dan kontrak pintar pasar jual-beli (03)** — modul ini yang benar-benar memanggil fungsi-fungsi di kedua kontrak itu dari sisi server.
- **Pendaftaran dan dompet (04)** — minta bantuan modul ini untuk benar-benar membuat dompet dan mencatat identitas ke blockchain.
- **Pembayaran dan penyimpanan berkas tiket (06)** — minta bantuan modul ini untuk mencetak tiket setelah pembayaran dipastikan lunas.

## Status pengerjaan saat ini

**0 persen — belum dicoba sama sekali.** Belum ada percobaan menyambungkan sistem ke jalur komunikasi blockchain, belum ada percobaan membuat dompet otomatis, dan belum ada kode apa pun untuk bagian ini. Ini juga wajar mengingat kedua smart contract yang mau dihubungkan (modul 02 dan 03) sendiri belum selesai — belum ada yang bisa benar-benar dihubungi.
