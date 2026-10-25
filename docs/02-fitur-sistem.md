# 02. Fitur sistem

Daftar seluruh kapabilitas sistem, dikelompokkan berdasarkan peran aktor pengguna.
Keterangan status: ✅ sudah ada di kode, 🚧 dalam pengerjaan, 🔶 tahap perancangan atau penyesuaian regulasi.

## Pembeli tiket

| Fitur | Penjelasan ringkas | Status |
|---|---|---|
| Daftar akun | Pendaftaran menggunakan email dan kata sandi | 🚧 |
| Buat dompet via passkey | Pembuatan smart account blockchain otomatis berbasis biometrik WebAuthn tanpa frasa pemulihan manual | 🚧 (dalam tahap integrasi) |
| Daftarkan identitas KTP | Pendaftaran NIK tunggal dengan enkripsi hash satu arah (keccak256) untuk mencegah duplikasi akun | 🔶 (diselaraskan dengan UU PDP) |
| Lihat katalog event | Daftar event aktif yang dapat disaring berdasarkan kategori acara | 🚧 |
| Lihat detail event | Informasi nama, tanggal, lokasi, kategori, harga, dan sisa kuota dari metadata IPFS | 🚧 |
| Beli tiket reguler | Melewati verifikasi bot Turnstile, pembayaran Midtrans sandbox, dan pencetakan tiket NFT otomatis ke dompet | 🚧 |
| Flash sale (war tiket) | Pembelian tiket kuota terbatas berkecepatan tinggi dengan antrean bot Turnstile, countdown waktu buka, dan autentikasi passkey cepat | 🚧 |
| Pengingat flash sale | Pendaftaran notifikasi pengingat jadwal pembukaan penjualan tiket sebelum sesi dimulai | 🚧 |
| Lihat tiket saya | Menampilkan daftar tiket aktif, rincian metadata, dan kode QR dinamis | 🚧 |
| Buktikan kepemilikan mandiri | Verifikasi nomor token dan alamat smart contract langsung pada penjelajah blok Sepolia | 🚧 |
| Jual ulang tiket (resale) | Penawaran tiket kembali lewat marketplace resmi dengan harga terkunci otomatis setara harga beli awal | 🚧 |
| Batalkan penawaran resale | Pembatalan penawaran listing selama tiket belum dibeli oleh pengguna lain | 🚧 |
| Beli tiket jual ulang | Pembayaran tiket resale tepat sebesar harga awal melalui Midtrans dengan perpindahan kepemilikan on-chain | 🚧 |
| Notifikasi transaksi | Pemberitahuan status pembayaran, pencetakan tiket ke dompet, penjualan tiket resale, dan status alokasi flash sale | 🚧 |
| Rekening pencairan dana | Pendaftaran nomor rekening bank penjual untuk penerimaan dana hasil transaksi penjualan kembali | 🚧 |
| Pulihkan dompet | Penambahan perangkat autentikator baru atau pemulihan akses dompet akun | 🚧 |

## Penyelenggara acara

| Fitur | Penjelasan ringkas | Status |
|---|---|---|
| Akun penyelenggara | Akun terpisah dari pembeli tiket untuk mengelola acara | 🔶 |
| Buat event | Pengisian data nama, tanggal, lokasi, kategori, dan kapasitas kuota acara | ✅ di kontrak (`createEvent`), 🚧 di web |
| Kategori tiket | Konfigurasi kuota dan harga untuk masing-masing tier tiket | ✅ di kontrak (`addCategory`), 🚧 di web |
| Kuota mutlak di blockchain | Penegakan kuota maksimal secara on-chain agar pencetakan tiket tidak dapat melampaui kapasitas | ✅ di kontrak, 🚧 penegakan saat minting |
| Batas tiket per dompet | Pembatasan kuota maksimal pembelian tiket per alamat dompet per event | ✅ di kontrak (`maxPerWallet`), 🚧 di web |
| Pengaturan jadwal penjualan | Sakelar pembukaan dan penutupan masa penjualan tiket per event | ✅ (`setSalesOpen`) |
| Rekapitulasi penjualan | Dasbor statistik tiket terjual, sisa kuota, dan status tiket yang sedang ditawarkan di pasar sekunder | 🚧 |

## Petugas di lokasi acara

| Fitur | Penjelasan ringkas | Status |
|---|---|---|
| Cek keaslian dan pemilik tiket | Pemeriksaan status kepemilikan tiket secara langsung dari smart contract Sepolia | 🚧 |
| Tandai tiket terpakai | Pencatatan status tiket digunakan pada blockchain (`markUsed`) agar tiket tidak dapat dipakai ulang | ✅ di kontrak, 🚧 di web scanner |
| Validasi identitas pemegang tiket | Verifikasi kecocokan NIK fisik dengan hash identitas terdaftar tanpa mengekspos data pribadi mentah | 🚧 |

## Admin sistem

| Fitur | Penjelasan ringkas | Status |
|---|---|---|
| Verifikasi penyelenggara | Persetujuan atau penolakan pengajuan akun penyelenggara acara | 🚧 |
| Pengawasan integritas transaksi | Pemantauan anomali lalu lintas transaksi, rekonsiliasi pembayaran, dan eksekusi relayer | 🚧 |

## Pemrosesan otomatis sistem

| Fitur | Alasan teknis dan keamanan | Status |
|---|---|---|
| Pencetakan tiket setelah pelunasan resmi | Pencetakan tiket hanya dieksekusi setelah backend menerima webhook status settlement dari Midtrans | 🚧 |
| Idempotensi pembayaran | Backend menolak proses ganda atas nomor pesanan yang sama guna mencegah pencetakan tiket berlebih | 🚧 |
| Unggah metadata ke IPFS sebelum pencetakan | Menghindari keberadaan token NFT yang menunjuk ke alamat penyimpanan kosong | 🚧 |
| Otorisasi pencetakan via EIP-712 | Smart contract memverifikasi tanda tangan kriptografis sistem relayer sebelum mencetak tiket | 🚧 |
| Subsidi biaya gas transaksi | Sistem menanggung gas transaksi blockchain melalui mekanisme Paymaster dan relayer backend | 🚧 |
| Pelepasan kunci reservasi otomatis | Background worker melepas kunci kuota tiket jika pembayaran Midtrans tidak diselesaikan dalam 15 menit | 🚧 |
| Sinkronisasi cache basis data | Proyeksi data lokal di MySQL diperbarui berdasarkan status transaksi on-chain untuk efisiensi kueri baca | 🚧 |
