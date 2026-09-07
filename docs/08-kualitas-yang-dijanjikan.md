# 08 — Kualitas yang Dijanjikan

Fitur menjawab "bisa apa". Dokumen ini menjawab "**seberapa bagus**" — cepat,
aman, gampang dipakai, tahan banting. Tiap janji disertai cara
membuktikannya, supaya tidak berhenti sebagai kalimat indah.

**Aturan keras:** angka yang belum diukur ditulis `[BUTUH DATA UJI]`, bukan
ditebak. Angka tebakan bisa diminta buktinya saat sidang, dan kalau tidak ada
buktinya, seluruh dokumen ikut tidak dipercaya.

Versi formal dengan kode `KNF-xx` (38 butir, dikelompokkan menurut standar
ISO/IEC 25010) ada di `bab-3-4/02-kebutuhan-non-fungsional.md`.

## Benar

| Janji | Cara membuktikannya |
|---|---|
| Tiket memenuhi standar NFT (ERC-721) sehingga terbaca alat mana pun | Uji kesesuaian antarmuka standar |
| Setiap fitur punya minimal satu skenario uji | Penelusuran fitur ke berkas uji |
| Data kepemilikan yang tampil **selalu sama** dengan blockchain; kalau beda, blockchain yang benar | Bandingkan salinan database dengan blockchain |

## Cepat dan hemat

Semua angka di sini menunggu pengukuran Oktober.

| Janji | Cara mengukurnya |
|---|---|
| Biaya gas tiap fungsi kontrak ≤ `[BUTUH DATA UJI]` | Laporan gas Foundry |
| Halaman katalog & detail tampil ≤ `[BUTUH DATA UJI]` detik | Waktu muat di peramban |
| Dari "lunas" sampai tiket ada di dompet ≤ `[BUTUH DATA UJI]` detik | Catat waktu di server dan blockchain — **pisahkan** waktu tunggu jaringan Sepolia (di luar kendali kita) dari waktu proses server |
| Sanggup `[BUTUH DATA UJI]` pembelian serentak | Uji beban |
| Gambar tiket ≤ `[BUTUH DATA UJI]` | Coba unggah berbagai ukuran |

Kenapa ini penting: tiga dari empat narasumber wawancara mengeluh sistem
tiket konvensional ambruk saat war tiket — bayar gagal, halaman error, tiket
hilang padahal sudah di depan antrean.

## Nyambung dengan dunia luar

| Janji | Cara membuktikannya |
|---|---|
| Tiket bisa dicek di penjelajah blockchain umum (Etherscan Sepolia) tanpa aplikasi kami | Cek langsung di Etherscan |
| Jalan di peramban HP maupun laptop | Coba di beberapa peramban dan ukuran layar |
| Memakai EntryPoint ERC-4337 v0.7 di alamat resminya, bukan buatan sendiri | Cek alamat yang dipakai |
| Keterangan tiket di IPFS memakai format yang lazim untuk NFT | Cek formatnya |

## Gampang dipakai

Ini bobotnya paling besar — jawaban langsung untuk masalah "orang awam tidak
bisa pakai blockchain".

| Janji | Cara membuktikannya |
|---|---|
| Daftar sampai punya dompet **tanpa pengetahuan blockchain apa pun** | Uji ke responden yang belum pernah pakai blockchain |
| Layar tidak menampilkan istilah teknis (gas, minting, private key, smart contract) tanpa penjelasan sehari-hari | Telaah seluruh teks antarmuka |
| Tidak perlu memasang apa pun, termasuk ekstensi peramban | Telusuri alur daftar sampai beli |
| Pesan kesalahan menyebut penyebab dan apa yang harus dilakukan, dalam Bahasa Indonesia | Data semua pesan kesalahan |
| Alur beli selesai dalam ≤ `[BUTUH DATA UJI]` langkah | Hitung pada alur akhir |
| Skor kemudahan penggunaan (kuesioner SUS) mencapai `[BUTUH DATA UJI]` | Kuesioner 19 September |

## Tahan banting

Sistem ini menyangkut uang dan blockchain sekaligus — gagal di tengah jalan
bisa berarti orang sudah bayar tapi tidak dapat tiket, dan transaksi
blockchain tidak bisa dibatalkan.

| Janji | Cara membuktikannya |
|---|---|
| Gagal di langkah mana pun **tidak** membuat pengguna kehilangan uang tanpa tiket | Uji dengan kegagalan disengaja di tiap langkah |
| Kalau cetak gagal setelah lunas, bisa diulang **tanpa bayar lagi** | Uji dengan kegagalan cetak disengaja |
| Tanda terima Midtrans yang datang dua kali tidak menghasilkan dua tiket | Kirim tanda terima berulang dengan sengaja |
| Kalau Midtrans / Pinata / jalur blockchain mati, pengguna diberi tahu jelas — bukan halaman kosong | Uji dengan layanan luar dimatikan |
| Ketersediaan selama masa uji `[BUTUH DATA UJI]` | Catat waktu sistem tidak bisa diakses |

## Aman

| Janji | Cara membuktikannya |
|---|---|
| Data KTP: 🔶 bentuknya tergantung skema yang dipilih 7 September. Versi "hanya sidik jari": data terbaca tidak boleh ada di mana pun — termasuk di catatan sistem (*log*) dan balasan ke peramban. Versi "terbaca + foto": wajib enkripsi saat disimpan, kontrol akses, dan aturan retensi | Telusuri seluruh jalur data KTP di kode |
| Kunci stempel milik server **tidak pernah** dikirim ke peramban | Periksa semua balasan server |
| Kuota, harga asli, dan jalur pindah tangan **tetap berlaku meski server dibobol** | Uji dengan anggapan kunci server sudah bocor |
| Stempel terikat ke satu kontrak di satu jaringan — tidak bisa dipakai ulang di tempat lain | Coba pakai ulang di kontrak/jaringan lain |
| Stempel sekali pakai dan punya batas waktu | Coba pakai ulang stempel yang sama |
| Transfer tiket di luar loket resmi ditolak, termasuk lewat panggilan langsung ke kontrak | Coba pindahkan tiket langsung antar dompet |
| Semua komunikasi lewat HTTPS | Periksa konfigurasi |
| Karcis satpam bot diperiksa di server, sekali pakai, kedaluwarsa | Coba kirim ulang karcis yang sama |
| Pencocokan identitas dibatasi jumlah percobaannya dan dicatat | Coba panggil berulang |

**Janji yang paling menentukan:** aturan inti tetap berdiri walau server
jatuh ke tangan penyerang. Itulah alasan ketiganya ditegakkan smart contract,
bukan server.

## Gampang dirawat

| Janji | Cara membuktikannya |
|---|---|
| Versi kompilator dan mesin virtual dikunci eksplisit di `foundry.toml` | ✅ sudah: Solidity 0.8.36, EVM prague |
| Cakupan tes smart contract `[BUTUH DATA UJI]` | Laporan cakupan Foundry |
| Aturan keamanan tidak pernah ditaruh di peramban | Telaah pembagian tanggung jawab |
| Tiap fungsi yang memeriksa tanda tangan menyebut siapa penandatangannya (server atau pengguna) | Telaah komentar fungsi |

## Sembilan angka yang harus diukur

Gas per fungsi · waktu muat halaman · waktu lunas-sampai-tiket · pembelian
serentak · ukuran gambar · jumlah langkah beli · skor SUS · ketersediaan ·
cakupan tes. Setelah terukur, tulis angkanya **beserta cara mengukurnya**.
Angka tanpa cara ukur sama rawannya dengan angka tebakan.
