# 10 — Keterbatasan

Menulis kelemahan sendiri lebih baik daripada ditemukan penguji. Tidak ada
sistem keamanan yang menutup semua celah — yang membedakan adalah celahnya
diketahui atau tidak.

Tiap butir ditulis dengan pola: **apa batasnya → kenapa → seberapa besar →
apa yang meredamnya.** Kolom "sifat" membedakan tiga jenis:

- **Melekat** — tidak bisa dihilangkan pendekatan mana pun. Bukan kelemahan
  rancangan ini khususnya.
- **Pertukaran** — muncul karena satu hal dipilih dan hal lain dikorbankan.
- **Lingkup** — sengaja tidak dikerjakan di tugas akhir ini.

| # | Keterbatasan | Sifat |
|---|---|---|
| 1 | **Pengikatan KTP bisa ditembus lewat jasa titip.** Calo dan jastip sering sudah memegang data KTP pembeli *sebelum* penjualan dibuka, jadi bisa mendaftar memakai identitas orang lain. Peredam: satu KTP tetap cuma satu dompet, dan untung jual ulang tetap nol — memborong lewat identitas pinjaman tetap tidak menguntungkan | Melekat |
| 2 | **Pemeriksaan NIK ganda bergantung pada server.** Smart contract tidak bisa tahu dua dompet memakai KTP yang sama; kunci uniknya di database. Kalau server dibobol, pemeriksaan ini ikut jatuh — tapi kuota, harga asli, dan jalur pindah tangan **tetap** berdiri di blockchain | Pertukaran 🔶 bentuk persisnya ikut skema KYC |
| 3 | **Risiko kebocoran identitas.** 🔶 Kalau skema "hanya sidik jari" dipilih: bocornya database tidak membocorkan identitas siapa pun; yang tersisa adalah rahasia sistem (*pepper*) yang harus disimpan terpisah. Kalau skema "terbaca + foto" dipilih: data KTP dan foto ada di database — risiko bocor nyata, wajib enkripsi saat disimpan, kontrol akses ketat, dan aturan hapus | Pertukaran |
| 4 | **Kehilangan perangkat = kehilangan akses**, kecuali sudah menyiapkan perangkat kedua atau 12 kata darurat. Ini harga dari "kunci milik pengguna sendiri, bukan milik sistem". Jalur darurat juga bisa disalahgunakan kalau 12 katanya dicuri — diredam dengan pembatasan percobaan dan hanya untuk mendaftarkan perangkat baru, bukan tanda tangan langsung | Pertukaran |
| 5 | **Loket resmi bisa memindahkan tiket tanpa tanda tangan pemilik.** Disengaja — supaya jual ulang tidak menuntut pengguna paham blockchain — tapi artinya pengguna harus percaya pada kode `MarketplaceContract` (yang terbuka dan bisa dibaca semua orang), bukan cuma pada dirinya sendiri. Bedakan dengan "kendali dompet bergantung pada server" — itu tidak benar; kunci dompet tetap di pengguna | Pertukaran |
| 6 | **Satu program untuk semua event = satu titik lemah.** Kalau ada bug di `TicketContract`, semua event kena. Peredam: permukaan serangan yang satu ini bisa diuji menyeluruh, lebih terkendali daripada banyak kontrak yang masing-masing diuji seadanya | Pertukaran |
| 7 | **Satpam bot tidak menghentikan manusia.** Turnstile menghadang program otomatis di situs web, bukan orang yang bekerja manual dengan banyak HP. Untuk itu andalannya tetap: untung jual ulang nol + satu KTP satu dompet | Melekat |
| 8 | **Serangan Sybil (satu orang banyak akun) tidak ditangani menyeluruh.** Yang ada hanya pengikatan KTP dan batas tiket per dompet (🔶 batas ini masih dipertahankan?) | Lingkup |
| 9 | **Berjalan di jaringan latihan (Sepolia), bukan Ethereum sungguhan.** Biaya gas dan waktu konfirmasi di jaringan asli bisa berbeda | Lingkup |
| 10 | **Pembayaran hanya simulasi (sandbox).** Tidak ada uang nyata, dan pengembalian dana tidak bisa diuji — makanya rancangan mencegah situasi yang butuh refund | Lingkup |
| 11 | **Bergantung pada layanan pihak ketiga:** Midtrans, Pinata, ZeroDev, Alchemy, Cloudflare. Kalau salah satunya mati, alur ikut terhenti — sistem hanya menjanjikan pemberitahuan yang jelas, bukan jalan pintas | Pertukaran |
| 12 | **Biaya gas ditanggung sistem tanpa model pembiayaan.** Siapa yang membayar sponsor gas di dunia nyata belum dirancang. Untuk tugas akhir: kuota gratis ZeroDev di testnet. Kalau kuota habis setelah pembayaran diterima — 🔶 prosedurnya masih dibahas | Belum dirancang |
| 13 | **Verifikasi di lokasi acara bergantung pada kejujuran petugas.** Sistem menjawab "cocok / tidak cocok" (atau menampilkan foto, tergantung skema); keputusan meloloskan tetap di tangan manusia | Melekat |
| 14 | **Passkey terikat ke satu domain.** Akun yang dibuat di alamat uji coba tidak bisa dipakai di alamat produksi. Berdampak pada cara menguji dan cara responden mendaftar | Pertukaran |
| 15 | **Pencairan uang ke penjual belum dirancang** di rancangan database terbaru (rancangan lama punya tabel rekening dan pencairan). Alur jual ulang saat ini berhenti di "tiket berpindah" | Belum dirancang |
| 16 | **Beberapa hal belum diputuskan** — skema KYC, siapa pengirim transaksi, bentuk loket jual ulang, log audit, batas per dompet, formalitas verifikasi penyelenggara, hosting. Daftar lengkap dan targetnya di `kerja/keputusan.md` | Menunggu konsultasi |
| 17 | **Kinerja belum terukur.** Semua angka masih `[BUTUH DATA UJI]` sampai pengukuran Oktober | Menunggu pengujian |

Versi formal (14 butir, dengan uraian panjang) ada di
`bab-3-4/09-keterbatasan-sistem.md` — butir 4 di sana masih memakai rumusan
lama "pengguna tidak memegang kunci pribadi" yang perlu diganti dengan butir
4–5 di atas.
