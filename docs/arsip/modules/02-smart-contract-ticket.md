# Kontrak Pintar Tiket

## Modul ini untuk apa

Ini adalah program yang berjalan langsung di atas blockchain (istilahnya *smart contract*, atau kontrak pintar — sebutan buat program yang aturannya berjalan otomatis dan gak bisa dilanggar siapa pun, bahkan oleh yang bikin programnya sendiri) yang tugasnya jadi "pabrik" resmi buat menerbitkan tiket dalam bentuk token digital unik (istilahnya NFT, singkatan dari *non-fungible token* — token yang tiap satuannya beda-beda dan gak bisa saling ditukar begitu saja, beda dari uang digital biasa yang semua satuannya sama). Setiap tiket yang diterbitkan lewat sini otomatis tercatat siapa pemiliknya, dan catatan itu bisa dicek siapa saja tanpa perlu percaya omongan pihak mana pun.

## Kenapa modul ini dibutuhkan

Masalah utama yang mau diselesaikan proyek ini adalah tiket palsu dan calo yang jual tiket kemahalan. Untuk tiket palsu, solusinya adalah memastikan penerbitan tiket cuma bisa lewat satu jalur resmi ini, dengan jumlah yang dibatasi ketat sesuai kuota — jadi gak ada yang bisa "mencetak" tiket siluman di luar sistem.

Kalau dulu tiket cuma berupa kode di database biasa, orang yang punya akses ke database itu bisa diam-diam nambahin tiket ekstra. Dengan cara ini, penerbitan tiket dipindahkan ke tempat yang aturannya gak bisa diakalin siapa pun — bahkan oleh yang mengelola sistem ini sekalipun. Itu sebabnya modul ini penting banget, karena di sinilah letak jaminan keaslian tiket yang sesungguhnya.

## Cara kerjanya

Yang sudah benar-benar ditulis sekarang baru kerangka dasarnya — mari dijelaskan bagian per bagian apa yang sudah ada.

**Fondasi jenis token.** Kontrak ini "mewarisi" aturan baku token unik (istilah kodenya ERC-721) yang sudah disediakan pustaka luar bernama OpenZeppelin, jadi gak perlu bikin dari nol aturan dasar soal siapa punya token apa. Selain itu ada juga aturan kepemilikan (siapa yang berhak mengelola kontrak ini secara keseluruhan) yang juga dari pustaka yang sama.

**Bentuk data buat tiap event dan kategori tiket.** Ada dua "bentuk isian" yang sudah didefinisikan: satu buat menyimpan info sebuah event (siapa penyelenggaranya, kapan waktunya, berapa batas maksimal tiket yang boleh dibeli satu dompet, dan apakah penjualannya lagi dibuka), satu lagi buat menyimpan info tiap kategori tiket di dalam event itu (harganya berapa, kuotanya berapa, sudah tercetak berapa). Ini semacam menyiapkan kolom-kolom kosong sebelum datanya benar-benar dimasukkan.

**Buku catatan yang bisa dicari lewat nomor.** Ada dua "buku catatan" (istilah kodenya *mapping*) yang nantinya menyimpan data event dan kategori tiket itu, masing-masing bisa dicari pakai nomor identitasnya. Karena satu kontrak ini dipakai buat banyak event sekaligus (bukan bikin kontrak baru tiap ada event baru), setiap event punya nomor pembeda sendiri, dan setiap kategori tiket di dalam event itu juga punya nomor sendiri.

**Catatan riwayat.** Ada dua jenis "pengumuman" yang akan dipancarkan ke luar kontrak (istilah kodenya *event*, jangan disamakan dengan "event" yang berarti acara — ini istilah teknis blockchain buat catatan log) setiap kali sebuah acara baru dibuat atau kategori tiket baru ditambahkan. Gunanya supaya bagian lain dari sistem — nanti modul penghubung blockchain — bisa "mendengarkan" kapan sesuatu terjadi tanpa harus terus-menerus mengecek isi kontrak.

**Fungsi bikin acara baru dan tambah kategori tiket.** Sudah ada dua fungsi yang bentuknya sudah jadi — namanya, siapa yang boleh manggil (cuma pemilik kontrak), dan data apa saja yang perlu dikirim. Tapi **isinya masih kosong** — belum ada pemeriksaan apa pun di dalamnya, dan belum benar-benar menyimpan data ke buku catatan yang sudah disiapkan tadi. Jadi kalau fungsi ini dipanggil sekarang, secara teknis dia berhasil dijalankan tapi **gak melakukan apa-apa** — datanya gak beneran tersimpan.

Yang direncanakan tapi belum ditulis sama sekali kodenya:

- **Fungsi mencetak tiket.** Ini yang bakal jadi inti dari pabrik tiket — menerbitkan satu tiket baru ke dompet seseorang, dengan syarat kuotanya belum habis dan ada semacam "surat izin digital" dari sistem yang membuktikan orang itu memang sudah bayar.
- **Pendaftaran identitas.** Fungsi buat mencatat "sidik jari digital" data KTP seseorang, biar satu identitas cuma bisa dipakai satu kali daftar.
- **Penandaan tiket sudah dipakai.** Buat dipanggil pas petugas di lokasi acara memverifikasi tiket seseorang, supaya tiket yang sama gak bisa dipakai masuk dua kali.
- **Pembatasan siapa yang boleh memindahkan tiket.** Ini bagian penting banget — nantinya tiket cuma boleh berpindah tangan lewat kontrak pasar jual-beli resmi (modul 03), gak boleh dipindah sembarangan langsung dari dompet ke dompet. Bagian ini yang jadi kunci supaya calo gak bisa jual-beli tiket di luar sistem resmi.

## Nyambung ke modul mana saja

- **Skema database (01)** — data dari kontrak ini disalin ke database supaya bisa ditampilkan dan dicari dengan cepat.
- **Kontrak pasar jual-beli (03)** — nantinya kontrak itu perlu baca data dari sini (harga asli tiket, status sudah dipakai atau belum), dan kontrak ini yang menentukan apakah kontrak pasar jual-beli diizinkan memindahkan sebuah tiket.
- **Penghubung blockchain (05)** — modul itu yang nanti benar-benar "menekan tombol" manggil fungsi-fungsi di kontrak ini dari sisi server.
- **Pengujian (09)** — setiap fungsi di sini perlu diuji, termasuk memastikan hal-hal yang seharusnya ditolak memang benar-benar ditolak.

## Status pengerjaan saat ini

Masih di tahap sangat awal — kalau dikira-kira dari seluruh fungsi yang direncanakan ada di kontrak ini, baru sekitar **10 persen**, dan itu pun baru "kerangkanya", belum "isinya". Yang sudah beres: bentuk data buat event dan kategori tiket, buku catatan buat menyimpannya, catatan riwayat, dan kerangka dua fungsi (bikin acara, tambah kategori) yang formatnya sudah benar tapi badannya masih kosong.

Yang belum sama sekali: pemeriksaan apa pun di dalam kedua fungsi yang sudah ada, fungsi mencetak tiket, fungsi pendaftaran identitas, fungsi penandaan tiket terpakai, dan yang paling penting — pembatasan siapa yang boleh memindahkan tiket, yang jadi inti pencegahan calo. Belum ada satu pun pengujian yang ditulis untuk kontrak ini.
