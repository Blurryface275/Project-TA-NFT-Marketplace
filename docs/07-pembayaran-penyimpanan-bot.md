# 07 — Pembayaran, Penyimpanan Gambar, dan Penyaring Bot

Tiga layanan luar yang dipakai, masing-masing dengan satu tugas jelas.

## Midtrans — kasir dengan uang mainan

Proyek ini memakai **Midtrans sandbox**: pembayaran pura-pura, tapi alurnya
sama persis dengan yang asli. Tidak ada uang sungguhan yang berpindah.

**Alurnya, dalam perumpamaan warung:**

1. Server membuat "nota tagihan" (Snap) dan menyerahkannya ke kamu.
2. Kamu bayar di kasir Midtrans.
3. Kasir mengirim **tanda terima resmi** langsung ke server (istilahnya
   *webhook*) — bukan lewat kamu.
4. Server **hanya percaya tanda terima ini**. Kalau peramban bilang "sudah
   bayar kok", server tidak peduli. Ini aturan keamanan terpenting di alur
   beli: tanpa ini, siapa pun bisa mengaku sudah bayar.
5. Kasir kadang mengirim tanda terima **dua kali** (kalau balasan pertama
   tidak sampai). Server harus mengenali nota yang sama dan **tidak mencetak
   tiket dua kali** — tiket yang terlanjur tercetak di blockchain tidak bisa
   ditarik, cuma bisa dibakar dengan transaksi tambahan.

**Yang tidak bisa diuji di sandbox:** pengembalian dana. Karena itu rancangan
jual ulang **mencegah** dua orang membayar tiket yang sama (kunci tawaran
untuk satu pembeli), supaya tidak pernah butuh refund.

**Untuk developer:** `midtrans-client` 1.4.x, `new midtransClient.Snap({
isProduction: false, ... })`. Webhook butuh alamat server yang bisa dijangkau
dari internet — jadi hosting harus diputuskan sebelum ini dibangun (🔶 batas
10 September). Akun Midtrans sandbox **belum dibuat**.

## Pinata / IPFS — gudang gambar dengan alamat berupa sidik jari

Gambar dan keterangan event (nama, tanggal, lokasi) tidak disimpan di
blockchain — kemahalan. Disimpan di **IPFS**, penyimpanan berkas tersebar,
lewat layanan **Pinata** yang menjaga berkasnya tidak hilang.

Kenapa IPFS, bukan folder biasa di server? Karena **alamat berkas di IPFS
(CID) adalah sidik jari isinya**. Kalau ada yang mengganti gambar tiket
diam-diam, alamatnya berubah dan tidak cocok lagi dengan yang dicatat di
blockchain. Ketahuan.

Urutan penting: keterangan **diunggah dulu**, alamatnya didapat, **baru** tiket
dicetak — supaya tidak pernah ada tiket yang menunjuk ke alamat kosong.

**Untuk developer:** paket `pinata` 2.5.x (bukan `@pinata/sdk` yang lama),
`pinata.upload.public.file(...)`, hasilnya berisi `cid`. Akun Pinata **belum
dibuat**.

## Cloudflare Turnstile — satpam di pintu situs

Satpam yang menilai "ini manusia atau robot?" tanpa menyuruhmu memilih
gambar lampu lalu lintas. Kalau lolos, kamu dapat "karcis" yang ikut dikirim
saat menekan tombol beli.

Aturannya:

- Karcis **diperiksa di server**, bukan di peramban.
- Berlaku **5 menit** dan **sekali pakai**.
- Satpam ini **tidak menggantikan stempel di smart contract**. Robot yang
  pintar bisa lewat "pintu belakang" — memanggil smart contract langsung
  tanpa membuka situs. Yang menjaga pintu belakang adalah stempel EIP-712
  (`05-smart-contract.md`). Dua penjaga untuk dua pintu.

Satpam ini juga **tidak menghentikan manusia** yang bekerja manual dengan
banyak perangkat — itu keterbatasan yang diakui (`10-keterbatasan.md`).

Kalau waktu habis, ini yang **terakhir** dipotong — dan kalau dipotong, wajib
ditulis jujur di keterbatasan, tidak diklaim di skripsi.

## Alchemy — jalur telepon ke blockchain

Server tidak bisa "nyambung" begitu saja ke blockchain; perlu penyedia jalur.
Rencananya **Alchemy**. Belum dipasang. Catatan: ZeroDev juga menyediakan
jalur sendiri (satu URL untuk bundler dan paymaster) yang sudah dipakai di
percobaan — peran keduanya dirapikan saat backend dibangun.
