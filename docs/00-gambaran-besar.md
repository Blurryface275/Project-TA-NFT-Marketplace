# 00 — Gambaran Besar

## Ceritanya begini

Bayangkan tiket konser itu selembar kertas. Kertas bisa difotokopi — jadi ada
tiket palsu. Kertas juga bisa dijual ke siapa saja — jadi ada calo yang
memborong lalu menjualnya tiga kali lipat. Penyelenggara tidak dapat apa-apa
dari selisih itu, penonton yang benar-benar mau nonton yang bayar mahal.

Proyek ini mengganti "kertas" itu dengan **sertifikat digital yang cuma ada
satu di dunia** (namanya NFT), dicatat di **buku besar publik yang tidak bisa
dihapus atau diubah diam-diam** (namanya blockchain). Lalu ditambah dua aturan
yang dipaksa oleh mesin, bukan oleh peraturan tertulis:

1. Tiket **hanya bisa dijual ulang lewat satu loket resmi**.
2. Di loket itu, **harga jual ulang dikunci sama dengan harga beli awal**.

Calo boleh saja memborong — tapi tidak bisa untung. Kalau tidak untung, ya
tidak ada alasan memborong.

## Tiga masalah yang diselesaikan

| Masalah | Kenapa terjadi di sistem tiket biasa | Cara sistem ini menjawab |
|---|---|---|
| **Tiket palsu** | Tiket cuma kode di database milik satu perusahaan; yang punya akses bisa "mencetak" tiket siluman | Tiket = NFT di blockchain; menerbitkan tiket baru hanya bisa lewat program yang kuotanya sudah dipatok |
| **Harga dimainkan calo** | Begitu tiket pindah tangan di luar platform, penyelenggara kehilangan kendali | Tiket hanya bisa pindah lewat loket resmi, dan di sana harganya terkunci |
| **Orang awam tidak bisa pakai blockchain** | Sistem blockchain lain menyuruh pengguna pasang dompet kripto, simpan 12 kata rahasia, dan punya koin buat bayar "bensin" transaksi | Dompet dibuat otomatis dari sidik jari/wajah (passkey), biaya transaksi ditanggung sistem — rasanya seperti belanja di situs biasa |

Masalah ketiga bukan tempelan. Sistem yang aman tapi tidak bisa dipakai orang
biasa tidak menyelesaikan apa-apa — orang akan balik ke calo.

## Bukti dari lapangan

Angka-angka ini dari tahap analisis proyek: wawancara **4 orang** pelaku "war
tiket" yang sekaligus penyedia jasa titip, dan kuesioner **30 responden**
pengguna umum.

| Yang dirasakan responden | |
|---|---|
| Sering lihat tiket dijual lagi dengan harga jauh lebih mahal | 97% |
| Merasa tiket resmi habis dalam waktu tidak wajar | 93% |
| Curiga ada bot / pembelian massal saat war tiket | 87% |
| Pernah dengar orang tertipu tiket palsu | 83% |
| Terpaksa beli dari calo karena tiket resmi habis | 63% |
| Merasa aman beli dari calo | 50% |

Baris terakhir yang paling menjelaskan: **63% terpaksa ke calo, tapi cuma 50%
merasa aman.** Orang tahu itu berisiko, tetap dilakukan karena tidak ada jalan
lain.

Soal solusinya: **100%** tertarik pada sistem yang menjamin keaslian dan
mengunci harga jual ulang; **97%** tidak keberatan memakai teknologi yang tidak
mereka pahami — asal tidak dipaksa mempelajarinya; **93%** bersedia menunjukkan
KTP saat penukaran tiket.

Konteks industrinya: satu platform saja (Loket) memfasilitasi lebih dari 25.000
acara sejak 2022 sampai Juli 2025 (JawaPos, 2025). Platform NFT resmi FIFA
(FIFA Collect) sudah mencatat kepemilikan tiket di blockchain, tapi masih
menyuruh pengguna pasang dompet luar seperti MetaMask. Penelitian terdahulu
menyimpulkan hambatan utama adopsi tiket NFT adalah rendahnya pemahaman
masyarakat terhadap blockchain (Saputro & Lathifah, 2025).

## Tiga sasaran yang bisa dicek satu-satu

1. **Keaslian tiket bisa dibuktikan sendiri oleh pemiliknya** — tanpa harus
   percaya pada server siapa pun.
2. **Untung dari jual ulang tiket dihilangkan** — memborong jadi tidak masuk
   akal.
3. **Orang yang tidak paham blockchain tetap bisa pakai** — kalau syaratnya
   harus paham dulu, tidak akan terpakai.

## Yang sengaja TIDAK dibuat

Beberapa ide dari proposal awal dibuang setelah dibahas dengan dosen. Ditulis
di sini supaya ketiadaannya terbaca sebagai keputusan, bukan lupa.

| Ide lama | Kenapa dibuang |
|---|---|
| Tiket yang sama sekali tidak bisa dipindahkan (*soulbound token*) | Orang yang batal nonton tetap perlu bisa menjual tiketnya secara sah. Yang dikunci harganya, bukan kemampuannya pindah tangan |
| Pembelian dua tahap (*commit-reveal*) dan *flash sale* | Keduanya untuk mengatasi rebutan cepat. Karena untung calo sudah dimatikan, tidak ada lagi alasan berebut |
| Pengundian acak (Chainlink VRF) | Persaingan dinilai sudah cukup sehat tanpa undian |

## Untuk siapa manfaatnya

**Penyelenggara acara:** tidak lagi kehilangan jejak tiket begitu berpindah
tangan; reputasi tidak rusak oleh tiket palsu; harga jual ulang tidak bisa
dimainkan.

**Penonton:** yakin tiketnya asli tanpa percaya siapa pun; kalau batal, bisa
jual lagi dengan harga wajar; tidak perlu belajar blockchain.

## Keadaan sekarang (2 September 2026)

- Program di blockchain (`TicketContract`) **sudah setengah jadi** — bagian
  membuat event dan kategori tiket sudah ada, bagian mencetak tiket dan
  aturan jual ulang belum. Belum ada satu pun tes otomatis (sedang dimulai).
- Situs web dan server **belum dibuat**.
- Dompet passkey **sudah dicoba** di kode percobaan; hasil transaksi
  tersponsori pertama belum tercatat.
- Beberapa hal penting **masih dibahas dengan dosen** (🔶), terutama cara
  menyimpan data KTP — lihat `kerja/keputusan.md`.
- Tenggat terdekat: **19 September** aplikasi harus bisa dipakai orang lain
  untuk kuesioner. Sidang **17 November**.
