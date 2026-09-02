# Pengujian

## Modul ini untuk apa

Ini bukan satu bagian kode yang berdiri sendiri, tapi kumpulan skenario percobaan yang dipakai buat membuktikan apakah bagian-bagian sistem lain benar-benar bekerja sesuai yang direncanakan — termasuk membuktikan bahwa hal-hal yang seharusnya *ditolak* memang benar-benar ditolak, bukan cuma membuktikan yang berhasil-berhasil saja.

## Kenapa modul ini dibutuhkan

Menulis kode yang kelihatannya jalan itu gampang. Yang susah adalah memastikan kode itu gak punya celah yang bisa dimanfaatkan orang buat mengakali sistem. Misalnya, kalaupun fungsi mencetak tiket sudah "berhasil" dipanggil dan menghasilkan tiket, itu belum tentu berarti amannya — pertanyaan yang lebih penting adalah: kalau ada yang mencoba mencetak tiket melebihi kuota, apakah benar-benar ditolak? Kalau ada yang mencoba memindahkan tiket langsung dari dompet ke dompet tanpa lewat pasar resmi, apakah benar-benar dicegah?

Justru skenario-skenario "yang seharusnya gagal" ini yang paling penting buat proyek ini, karena inti dari seluruh sistem adalah soal mencegah kecurangan. Kalau cuma diuji yang berhasil-berhasil saja, celah keamanannya bisa aja gak ketahuan sampai ada orang beneran yang mengeksploitasinya nanti.

## Cara kerjanya

Belum ada satu pun skenario pengujian yang benar-benar ditulis jadi kode. Berikut rencana kategorinya, berdasarkan yang sudah dipikirkan di dokumen rancangan:

1. **Uji fungsi berjalan dengan benar.** Yang paling dasar — memastikan hal-hal yang memang seharusnya berhasil itu benar-benar berhasil. Misalnya: acara bisa dibuat, kategori tiket bisa ditambahkan, tiket bisa dicetak dengan harga yang tercatat benar.

2. **Uji penolakan — dan ini yang paling penting.** Mencoba dengan sengaja melakukan hal-hal yang seharusnya gagal, terus memastikan memang benar-benar ditolak. Contohnya: mencoba mencetak tiket melebihi kuota yang tersisa, mencoba mendaftar pakai identitas yang sudah pernah dipakai orang lain, mencoba memakai ulang "surat izin digital" yang sama dua kali, atau mencoba memindahkan tiket langsung antar dompet tanpa lewat pasar resmi.

3. **Uji kasus yang gampang kelewat.** Ini kategori khusus buat menangkap kesalahan yang sering gak kepikiran di awal. Contohnya: setelah dipasang pembatasan supaya tiket cuma bisa dipindah lewat pasar resmi, apakah proses **mencetak** tiket baru jadi ikut ketolak juga secara gak sengaja? (soalnya secara teknis, mencetak tiket baru itu juga semacam "memindahkan" kepemilikan dari kosong ke pemilik pertama, jadi kalau pembatasannya ditulis kurang teliti, bisa ikut kena semua).

4. **Pengukuran biaya.** Menghitung berapa biaya yang dibutuhkan buat menjalankan tiap fungsi di smart contract, supaya ada gambaran nyata soal biaya operasional sistem ini kalau dipakai sungguhan.

## Nyambung ke modul mana saja

Modul ini pada dasarnya nyambung ke **semua modul yang berupa kode** — kontrak tiket (02), kontrak pasar jual-beli (03), pendaftaran dan dompet (04), penghubung blockchain (05), pembayaran dan penyimpanan berkas (06), tampilan pengguna (07), dan pencegahan bot (08). Setiap kali salah satu dari modul-modul itu selesai ditulis, bagian ini yang bertugas membuktikan modul tersebut benar-benar bekerja seperti yang direncanakan.

## Status pengerjaan saat ini

**0 persen.** Folder yang seharusnya berisi berkas-berkas pengujian untuk smart contract sudah disiapkan, tapi masih kosong sama sekali — belum ada satu skenario pun yang ditulis jadi kode uji coba, baik untuk kontrak tiket maupun kontrak pasar jual-beli. Ini masuk akal karena modul-modul yang mau diuji sendiri masih di tahap sangat awal — belum banyak yang bisa diuji karena belum banyak yang sudah ditulis logikanya.
