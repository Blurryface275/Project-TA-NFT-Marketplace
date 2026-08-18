# Kontrak Pintar Pasar Jual-Beli Tiket Bekas

## Modul ini untuk apa

Kalau modul sebelumnya adalah "pabrik" yang menerbitkan tiket baru, modul ini rencananya jadi "pasar resmi" satu-satunya tempat orang boleh jual-beli tiket bekas. Bedanya sama pasar loak biasa: di sini harga jualnya gak boleh dinaikkan sama sekali dari harga beli awal, dan gak ada jalur lain buat jual-beli tiket selain lewat sini.

## Kenapa modul ini dibutuhkan

Ini sebenarnya jantung dari seluruh usaha memberantas calo di proyek ini. Tiket boleh saja dijual lagi — misalnya orang yang gak jadi datang ke acaranya — tapi yang gak boleh adalah menjualnya dengan harga jauh lebih mahal dari harga resminya. Kalau cuma dilarang lewat aturan tertulis biasa (semacam syarat dan ketentuan), itu gampang dilanggar karena gak ada yang benar-benar menegakkannya.

Makanya pendekatannya dibikin dua lapis yang saling melengkapi. Pertama, tiket **cuma boleh berpindah tangan lewat kontrak ini** — bukan dikirim sembarangan langsung dari satu dompet ke dompet lain. Kedua, di kontrak ini sendiri, **harga jualnya dipatok otomatis sama persis dengan harga beli pertama kali**, jadi penjual sama sekali gak dikasih kesempatan mengetik angka harga sendiri. Gabungan dua hal ini yang bikin usaha menimbun-lalu-menjual-mahal jadi gak ada untungnya — kalau gak ada untung, ya gak ada juga alasan buat calo melakukannya.

## Cara kerjanya

Karena belum ada satu baris kode pun yang ditulis untuk kontrak ini, bagian ini menjelaskan **rencananya**, bukan sesuatu yang sudah berjalan.

**Soal pembatasan siapa yang boleh memindahkan tiket.** Rencananya, kontrak tiket (modul 02) akan diatur supaya cuma mengizinkan kontrak pasar jual-beli ini yang boleh menjalankan perpindahan kepemilikan antar pengguna. Kalau ada yang coba memindahkan tiket langsung dari dompet ke dompet tanpa lewat sini, kontrak tiketnya sendiri yang akan menolak. Jadi penjagaannya bukan di sini, tapi hasil kerja sama dengan kontrak tiket.

**Soal penguncian harga jual ulang.** Ini bagian yang benar-benar terjadi di kontrak ini. Rencananya, saat seseorang mau menawarkan tiketnya untuk dijual lagi, sistem gak akan menyediakan kolom isian harga sama sekali di sisi tampilan — harganya otomatis diambil dari catatan harga beli pertama kali yang tersimpan permanen di kontrak tiket. Bahkan seandainya ada yang coba memanggil kontrak ini langsung dari luar (tanpa lewat halaman web sistem, misalnya lewat cara teknis lainnya) dan mencoba memasukkan angka harga sendiri, kontraknya sendiri yang akan menolak kalau angkanya beda dari harga aslinya. Jadi ada dua penjagaan: satu di tampilan (gak dikasih kolom isian sama sekali), satu lagi di dalam kontrak (ditolak kalau angkanya gak cocok).

**Soal verifikasi tanda tangan digital.** Ini bagian yang sering disalahpahami, jadi perlu dijelaskan pelan-pelan. Kontrak yang sudah terpasang di blockchain itu sifatnya terbuka — siapa saja bisa memanggilnya langsung tanpa lewat halaman web sistem sama sekali, asal tahu caranya secara teknis. Ini bukan kelemahan, memang begitu sifat dasarnya blockchain. Tapi ini berarti pemeriksaan-pemeriksaan yang biasanya dilakukan di halaman web (misalnya memastikan orangnya bukan program otomatis, atau memastikan pembayarannya sudah beres) bisa saja dilewati kalau seseorang memanggil kontraknya langsung.

Makanya, buat fungsi-fungsi yang penting, kontrak ini rencananya akan menuntut semacam "surat izin digital" (istilah teknisnya tanda tangan digital) yang cuma bisa dibuat oleh sistem sendiri sebagai bukti bahwa pemeriksaan-pemeriksaan tadi memang sudah dilakukan di baliknya. Tanpa surat izin ini, kontraknya akan menolak permintaan itu, meskipun dipanggil langsung dari luar. Ini bukan tambalan buat menutupi kelemahan — ini memang cara standar yang dipakai industri buat menjaga fungsi penting tetap aman meskipun kontraknya sendiri terbuka untuk siapa saja.

**Soal siapa yang menandatangani.** Karena pengguna di sistem ini punya dompet yang dibuatkan dan dioperasikan otomatis oleh sistem (bukan dompet yang mereka pegang sendiri kuncinya), yang bakal menandatangani surat izin digital itu selalu pihak sistem sendiri, bukan pengguna secara langsung.

## Nyambung ke modul mana saja

- **Kontrak pintar tiket (02)** — kontrak ini bergantung penuh sama kontrak tiket: baca harga aslinya dari sana, baca status sudah dipakai atau belum dari sana, dan minta izin untuk memindahkan kepemilikan lewat sana.
- **Skema database (01)** — status penawaran jual-beli yang tercatat di kontrak ini disalin ke tabel penawaran jual ulang, supaya bisa ditampilkan dengan cepat di halaman web.
- **Pembayaran dan penyimpanan berkas tiket (06)** — modul itu yang nanti mengurus pembayaran dari pembeli tiket bekas, dan mengurus pengiriman uangnya ke penjual setelah tiketnya benar-benar berpindah tangan.
- **Pengujian (09)** — perlu diuji khusus buat memastikan harga memang gak bisa diakalin dan tiket memang gak bisa dipindah di luar jalur ini.

## Status pengerjaan saat ini

**0 persen — belum ada satu baris kode pun.** Berkasnya sendiri bahkan belum dibuat di dalam folder proyek. Semua yang dijelaskan di atas murni rencana yang sudah dipikirkan matang-matang dan tertulis di dokumen rancangan, tapi belum diterjemahkan jadi kode sungguhan sama sekali. Ini logis karena kontrak ini bergantung pada kontrak tiket yang juga belum selesai — masuk akal untuk menyelesaikan fondasinya (modul 02) dulu sebelum lanjut ke sini.
