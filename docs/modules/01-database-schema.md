# Skema Database

## Modul ini untuk apa

Bayangin blockchain itu kayak brankas yang super aman tapi super mahal — tiap kali kamu masukin sesuatu ke sana, kamu harus bayar, dan sekali dimasukin, isinya kebaca semua orang selamanya. Nah, gak semua data proyek ini cocok ditaruh di brankas kayak gitu. Data akun pengguna, data event, riwayat siapa beli apa — itu semua butuh tempat yang lebih biasa, lebih murah, dan bisa diubah-ubah kapan saja. Tempat itu namanya database, dan modul ini menjelaskan bentuknya: tabel apa saja yang ada, isinya apa, dan kenapa data itu ditaruh di sana bukan di blockchain (atau sebaliknya).

## Kenapa modul ini dibutuhkan

Coba bayangkan kalau semua data — termasuk gambar tiket, nama event, sampai data KTP orang — dipaksa masuk ke blockchain semua. Selain mahal banget (karena tiap penyimpanan di blockchain itu bayar), ada masalah yang lebih serius: **apa pun yang masuk ke blockchain itu terbuka buat siapa saja dan gak bisa dihapus lagi**. Data KTP jelas gak boleh kayak gitu — begitu ketahuan format aslinya, siapa pun bisa lihat selamanya.

Di sisi lain, ada juga data yang justru *harus* di blockchain, meskipun mahal — misalnya siapa pemilik sah sebuah tiket, atau berapa harga aslinya. Kenapa? Karena data itu harus **gak bisa diakal-akalin oleh siapa pun**, termasuk oleh orang yang mengelola sistem ini sendiri. Kalau data kepemilikan tiket cuma disimpan di database biasa, orang yang punya akses ke database itu bisa diam-diam mengubah siapa pemilik tiketnya. Itu justru menghancurkan seluruh tujuan proyek ini.

Jadi modul ini pada dasarnya menjawab satu pertanyaan penting di awal: **data mana yang harus "gak bisa diubah siapa pun" (masuk blockchain), dan data mana yang "boleh diubah tapi harus dijaga rahasianya atau sekadar butuh dicari dengan cepat" (masuk database biasa)?**

## Cara kerjanya

Aturan pembagiannya sederhana: kalau datanya harus dijamin gak bisa dipalsukan dan itu inti dari keamanan sistem — misalnya siapa pemilik tiket, berapa kuota event, berapa harga aslinya — itu masuk blockchain. Kalau datanya besar (kayak gambar), berubah-ubah (kayak status pesanan), atau rahasia (kayak data KTP asli), itu masuk database biasa.

Berikut tabel-tabel yang direncanakan ada di database, dan alasan singkat kenapa isinya ditaruh di situ:

**Tabel akun pengguna.** Isinya surel, status verifikasi, dan alamat dompet blockchain milik orang itu. Ini data operasional biasa — gampang dicari, gampang diubah kalau perlu.

**Tabel identitas.** Ini yang paling menarik. Awalnya rencananya data KTP asli (nomor identitas, nama, tanggal lahir) disimpan di sini. Tapi belakangan diputuskan itu terlalu berisiko — kalau database ini sampai bocor, identitas semua orang ikut bocor. Jadi sekarang, **data KTP aslinya sama sekali gak disimpan di mana pun**, termasuk di database ini. Yang disimpan cuma "sidik jari digital"-nya — hasil perhitungan satu arah dari data KTP yang gak bisa dibalik lagi jadi data aslinya (istilah teknisnya *hash*). Jadi meskipun tabel ini bocor, gak ada satu pun nama atau nomor KTP asli yang kebaca.

**Tabel penyelenggara acara.** Data orang atau organisasi yang bikin event — mirip tabel pengguna, tapi khusus buat yang jualan tiket, bukan yang beli.

**Tabel event dan tabel kategori tiket.** Nama event, tanggal, lokasi, dan tiap kategori tiketnya (misalnya VIP, reguler) beserta harga dan kuotanya. Sebagian dari data ini sebenarnya juga tersimpan di blockchain (soalnya kuota dan harga itu penting dijaga), tapi salinannya ditaruh di sini juga supaya bisa dicari dan ditampilkan dengan cepat di halaman web — coba bayangin kalau tiap kali orang buka halaman katalog event, sistem harus nanya ke blockchain satu-satu, itu bakal lambat banget.

**Tabel tiket.** Salinan data tiket yang sudah dicetak — siapa pemiliknya, sudah dipakai atau belum, dan sebagainya. Sekali lagi ini cuma salinan buat mempercepat tampilan. Kalau ada beda antara yang tercatat di sini dan yang tercatat di blockchain, yang dianggap benar itu **selalu yang di blockchain**, bukan di sini.

**Tabel pesanan.** Riwayat setiap kali orang beli tiket atau bayar sesuatu — status pembayarannya lagi apa, sudah lunas atau belum, sudah jadi tiket atau belum.

**Tabel penawaran jual ulang.** Kalau seseorang mau jual tiketnya lagi, penawarannya dicatat di sini — termasuk status "lagi dikunci" buat pembeli tertentu selagi dia bayar, supaya dua orang gak bisa rebutan beli tiket yang sama secara bersamaan.

**Tabel rekening penjual dan tabel pencairan dana.** Ini buat ngurusin ke mana uang hasil jualan tiket bekas itu ditransfer — rekening bank tujuan, dan catatan tiap kali uangnya benar-benar dikirim.

**Tabel catatan izin.** Setiap kali sistem menerbitkan semacam "surat izin digital" buat melakukan sesuatu di blockchain (misalnya izin mencetak tiket), catatannya disimpan di sini supaya izin yang sama gak bisa dipakai dua kali.

**Tabel notifikasi dan tabel riwayat masuk.** Yang pertama buat nyimpen pemberitahuan ke pengguna (tiketnya sudah jadi, dsb), yang kedua buat nyatet kapan dan dari mana seseorang login — berguna kalau suatu saat perlu diperiksa ada aktivitas mencurigakan atau enggak.

## Nyambung ke modul mana saja

- **Modul kontrak tiket (02)** — data kepemilikan tiket dan harga aslinya sebenarnya "aslinya" disimpan di kontrak ini, database cuma nyalin biar cepat diakses.
- **Modul kontrak pasar jual-beli (03)** — status penawaran jual ulang juga begitu, aslinya di kontrak, salinannya di sini.
- **Modul pendaftaran dan dompet (04)** — modul itu yang nulis data baru ke tabel pengguna dan tabel identitas setiap kali ada orang daftar.
- **Modul pembayaran dan penyimpanan berkas tiket (06)** — yang nulis ke tabel pesanan, tabel pencairan dana, dan yang baca-tulis tabel tiket setiap kali ada transaksi.
- **Modul pengujian (09)** — nantinya butuh data contoh dari sini buat menjalankan skenario uji coba.

## Status pengerjaan saat ini

**Belum ada database yang benar-benar berjalan.** Yang ada sekarang baru rancangan di atas kertas — semacam cetak biru yang berisi daftar tabel dan kolomnya, belum diterjemahkan jadi database sungguhan yang bisa dipakai nyimpen data.

Rancangan ini sendiri statusnya masih **draf**, karena rencananya mau dikonsultasikan dulu ke dosen pembimbing sebelum benar-benar dibangun — supaya kalau ada yang perlu diubah, belum kepalang tanggung sudah dibangun beneran. Jadi kalau ditanya "database-nya sudah jalan belum", jawabannya jujur: belum, masih di tahap rancangan yang menunggu persetujuan.
