# Pembayaran dan Penyimpanan Data Tiket

## Modul ini untuk apa

Ini bagian di sisi server yang mengurus dua hal yang sebenarnya berbeda tapi berjalan berurutan dalam satu alur: pertama, memproses pembayaran tiket (lewat simulasi pembayaran, karena proyek ini belum memakai uang sungguhan), dan kedua, menyimpan keterangan-keterangan tiket seperti nama event, tanggal, dan gambarnya di suatu tempat penyimpanan berkas.

## Kenapa modul ini dibutuhkan

Ada dua masalah yang diselesaikan modul ini. Yang pertama: sebelum tiket dicetak, harus ada yang benar-benar memastikan orangnya sudah bayar — dan itu gak bisa dipercayakan ke sisi tampilan yang dilihat pengguna, karena tampilan bisa saja diakali supaya "mengaku" sudah bayar padahal belum. Makanya harus ada bagian di server yang menunggu pemberitahuan resmi dari layanan pembayaran sebelum mengizinkan tiket dicetak.

Yang kedua: keterangan tiket seperti gambar dan deskripsi event itu ukurannya lumayan besar, dan kalau dipaksa disimpan langsung di blockchain, biayanya bakal sangat mahal — padahal data semacam itu gak butuh jaminan "gak bisa diubah siapa pun" setingkat data kepemilikan tiket. Jadi lebih masuk akal disimpan di tempat penyimpanan berkas biasa (rencananya memakai layanan bernama Pinata, yang menyimpan berkas dengan cara khusus supaya alamatnya berubah kalau isinya diubah — jadi kalau ada yang coba mengganti gambar tiket diam-diam, ketahuan karena alamatnya jadi gak cocok lagi).

## Cara kerjanya

Belum ada kode yang ditulis untuk modul ini, jadi berikut rencana alurnya:

1. Setelah pengguna memilih tiket yang mau dibeli dan lolos pemeriksaan awal (kuota masih ada, dia belum melebihi batas beli, dan sudah lolos pemeriksaan bot), modul ini membuat sebuah transaksi pembayaran lewat layanan simulasi pembayaran.
2. Pengguna menyelesaikan pembayarannya di sisi tampilan.
3. Modul ini menunggu pemberitahuan resmi dari layanan pembayaran bahwa transaksinya sudah lunas — **ini titik yang paling penting**, karena pencetakan tiket cuma boleh dipicu dari pemberitahuan resmi ini, bukan dari klaim sisi tampilan yang bisa saja dipalsukan.
4. Setelah dipastikan lunas, modul ini mengunggah keterangan tiket (nama event, tanggal, gambar, dan sebagainya) ke tempat penyimpanan berkas, dan mendapatkan semacam alamat unik dari berkas yang baru diunggah itu.
5. Baru setelah itu, modul ini meminta bantuan modul penghubung blockchain untuk benar-benar mencetak tiketnya, sambil menyertakan alamat berkas tadi supaya tiketnya "menunjuk" ke keterangan yang benar.
6. Kalau ternyata pemberitahuan pembayaran yang sama diterima berkali-kali (ini memang bisa terjadi, layanan pembayaran biasanya mengirim ulang kalau belum yakin pemberitahuannya diterima), modul ini harus bisa mengenali bahwa pesanan itu sudah pernah diproses, supaya gak sampai mencetak tiket dua kali dari satu pembayaran.

## Nyambung ke modul mana saja

- **Penghubung blockchain (05)** — modul ini minta tolong ke sana untuk benar-benar mencetak tiket ke dompet pengguna.
- **Kontrak pintar tiket (02)** — tiket yang akhirnya tercetak lewat modul ini adanya di kontrak itu.
- **Skema database (01)** — modul ini menyimpan riwayat setiap pesanan dan status pembayarannya ke tabel pesanan.

## Status pengerjaan saat ini

**0 persen — belum ada kodenya.** Belum ada percobaan menyambungkan ke layanan pembayaran simulasi maupun ke tempat penyimpanan berkas. Semua yang dijelaskan di atas adalah rencana dari dokumen rancangan, belum diterjemahkan jadi kode yang berjalan.
