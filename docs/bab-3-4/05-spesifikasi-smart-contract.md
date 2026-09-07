# 05 — Spesifikasi Smart Contract

Berkas ini menjelaskan **apa yang harus dilakukan kedua smart contract, aturan
apa yang wajib ditegakkannya, dan jebakan apa yang harus dihindari saat
menulisnya.**

Berkas ini memuat **tanda tangan fungsi**, bukan isi fungsinya. Isi setiap
fungsi ditulis sendiri oleh penulis tugas akhir, karena setiap baris kode harus
bisa dipertanggungjawabkan di depan penguji.

---

## 1. Status Pelaksanaan

**Per 2 September 2026: sebagian `TicketContract.sol` sudah ditulis; sisanya
dan seluruh `MarketplaceContract.sol` masih `[BELUM DIIMPLEMENTASI]`.**

Keadaan folder `contracts/` saat ini:

| Bagian | Status |
|---|---|
| `TicketContract.sol` — struct, mapping (`userIdentities`, `usedNonces`, `walletPurchases`), custom error | Sudah ada |
| `createEvent()`, `addCategory()` — validasi lengkap + emit | Sudah ada, **belum diuji** |
| `setSalesOpen()`, `setMarketplace()`, `setSystemSigner()` | Sudah ada, **belum diuji** |
| `mintTicket()`, `registerIdentity()`, gerbang EIP-712, penimpaan `_update` (allowlist), penukaran tiket | `[BELUM DIIMPLEMENTASI]` |
| `MarketplaceContract.sol` | `[BELUM DIIMPLEMENTASI]` — bentuknya menunggu keputusan K2 |
| `contracts/test/` | **Kosong** — menulis test adalah pekerjaan pertama berikutnya |

> **Catatan penyelarasan 2 September 2026:** status di atas dicocokkan
> langsung dengan isi repositori. Urutan pengerjaan: `TASKS.md` Fase B–C.
> Keputusan yang menahan sebagian pekerjaan (K2, K3, K10):
> `docs/kerja/keputusan.md`.

---

## 2. Prinsip Dasar: Smart Contract Bersifat Terbuka

**Bagian ini wajib dipahami sebelum membaca sisanya, dan wajib bisa dijelaskan
saat sidang.**

Smart contract yang sudah dipasang di blockchain **dapat dipanggil siapa saja**
lewat RPC (*Remote Procedure Call*), tanpa pernah membuka situs web sistem ini.
Cukup dengan mengetahui alamat kontraknya — dan alamat itu memang terbuka untuk
umum.

**Akibat langsungnya:**

| Pemeriksaan yang ada di situs web | Nasibnya bila kontrak dipanggil langsung |
|---|---|
| Penyaring bot Cloudflare Turnstile | **Terlewati sepenuhnya** |
| Pemeriksaan status pembayaran Midtrans | **Terlewati sepenuhnya** |
| Pemeriksaan status pendaftaran identitas | **Terlewati sepenuhnya** |
| Pembatasan harga pada halaman penawaran | **Terlewati sepenuhnya** |

**Ini bukan cacat rancangan.** Keterbukaan adalah **sifat bawaan blockchain**,
dan justru sifat itulah yang membuat sistem ini bekerja: karena siapa pun bisa
membaca isi kontrak, siapa pun juga bisa **memverifikasi sendiri** bahwa sebuah
tiket asli dan bahwa kuota tidak dilampaui — tanpa perlu mempercayai pengelola
sistem. Menutup keterbukaan itu berarti membuang manfaat utama blockchain.

**Karena itu setiap aturan yang tidak boleh dilanggar harus ditegakkan di dalam
smart contract itu sendiri**, bukan di situs web. Ada dua bentuk penegakan:

1. **Aturan yang berlaku mutlak** — kuota, penguncian harga, pembatasan jalur
   perpindahan. Ditulis langsung sebagai syarat di dalam fungsi.
2. **Aturan yang bergantung pada keadaan di luar blockchain** — misalnya
   "pembayaran sudah lunas", yang tidak bisa diketahui blockchain. Untuk ini
   dipakai **gerbang tanda tangan digital**: kontrak menuntut tanda tangan sah
   dari sistem sebagai bukti bahwa pemeriksaan di luar blockchain sudah
   dilakukan.

**Cara membingkainya saat sidang:** gerbang tanda tangan digital adalah
**lapisan kontrol akses berstandar industri**, setara dengan pemeriksaan izin di
sistem mana pun. Bukan tambalan atas kelemahan.

---

## 3. Siapa yang Menandatangani — Baca Sebelum Menulis Kode Apa Pun

Ini **jebakan paling berbahaya** dalam proyek ini, karena kesalahannya tidak
menghasilkan pesan kesalahan yang menunjuk penyebabnya. Yang terjadi hanyalah
tanda tangan yang sebenarnya sah selalu ditolak, dan penyebabnya sulit ditemukan.

### 3.1 Duduk perkaranya

Karena sistem ini memakai ERC-4337, **dompet pengguna adalah *smart account*,
bukan EOA.** *Smart account* tidak punya kunci pribadi, sehingga cara
membuktikan tanda tangannya berbeda — lewat ERC-1271, bukan lewat pemulihan
alamat penandatangan biasa.

| Penandatangan | Jenis dompetnya | Cara memeriksa yang benar |
|---|---|---|
| **Sistem** — kunci milik server | EOA | Pemulihan alamat penandatangan biasa (`ECDSA.recover`) |
| **Pengguna** | *Smart account* ERC-4337 | Harus lewat ERC-1271 (`SignatureChecker`) |

### 3.2 Keputusan untuk sistem ini

> **Dalam seluruh rancangan ini, penandatangan selalu SISTEM, tidak pernah
> pengguna.**

Alasannya: pengguna sistem ini **tidak memegang kunci pribadinya sendiri**
(KF-04), jadi ia memang tidak bisa menandatangani apa pun secara mandiri.
Seluruh transaksi dikirim server atas nama pengguna, dengan biaya gas ditanggung
*Paymaster*.

**Akibat praktisnya:** seluruh pemeriksaan tanda tangan di kedua kontrak memakai
**pemulihan alamat penandatangan biasa** — yang di OpenZeppelin 5.x tersedia
lewat `ECDSA.recover`. `SignatureChecker` **tidak diperlukan** selama tidak ada
fungsi yang menuntut tanda tangan pengguna.

**Kapan ini berubah:** kalau nanti ditambahkan fungsi yang menuntut persetujuan
langsung dari pengguna — misalnya pengguna menyetujui penjualan tiketnya dengan
tanda tangannya sendiri — fungsi itu **wajib** memakai `SignatureChecker`.
Karena itu KNF-36 menuntut setiap fungsi mencantumkan siapa penandatangan yang
diharapkan pada keterangannya.

### 3.3 Jebakan versi pustaka

Di OpenZeppelin versi 4, fungsi bantu `toEthSignedMessageHash` berada di pustaka
`ECDSA`. **Di versi 5 fungsi itu sudah pindah ke `MessageHashUtils`.** Tutorial
yang ditulis sebelum versi 5 tidak akan berhasil dikompilasi.

Pola yang benar untuk EIP-712 di OpenZeppelin 5.x:

1. Warisi kontrak `EIP712`, tetapkan nama dan versi *domain*-nya.
2. Susun *struct hash* dari data yang ditandatangani.
3. Ubah menjadi *digest* dengan `_hashTypedDataV4(structHash)`.
4. Pulihkan alamat penandatangan dengan `ECDSA.recover(digest, signature)`.
5. Bandingkan hasilnya dengan alamat penandatangan sistem yang tersimpan.

Dengan pola ini, `MessageHashUtils` **tidak dipakai sama sekali** — karena
`_hashTypedDataV4` sudah menangani pembungkusan *digest* sesuai EIP-712.

**Beda `recover` dan `tryRecover`:** `recover` membatalkan transaksi bila tanda
tangannya tidak sah; `tryRecover` mengembalikan kode kesalahan tanpa
membatalkan. Untuk gerbang izin seperti di sistem ini, `recover` lebih tepat —
tanda tangan tidak sah memang harus menggagalkan transaksi.

### 3.4 Perlindungan terhadap pemakaian ulang tanda tangan

Tanda tangan adalah data yang **terlihat semua orang** begitu transaksinya
tercatat. Tanpa perlindungan, siapa pun bisa menyalinnya dan memakainya lagi.

Empat lapisan perlindungan yang wajib ada (KNF-28, KNF-29):

| Perlindungan | Menghadang | Cara memperolehnya |
|---|---|---|
| Alamat kontrak dalam *domain* EIP-712 | Tanda tangan dipakai di kontrak lain | Otomatis dari `EIP712` |
| Nomor jaringan dalam *domain* EIP-712 | Tanda tangan dipakai di jaringan lain | Otomatis dari `EIP712` |
| **Nomor urut sekali pakai (*nonce*)** | Tanda tangan yang sama dipakai dua kali | **Harus ditulis sendiri** |
| **Batas waktu berlaku (*deadline*)** | Tanda tangan lama dipakai jauh di kemudian hari | **Harus ditulis sendiri** |

**Dua yang terakhir tidak datang dengan sendirinya.** Mewarisi `EIP712` saja
hanya memberi dua perlindungan pertama. Tanpa *nonce*, satu tanda tangan izin
pencetakan bisa dipakai berulang-ulang untuk mencetak banyak tiket dari satu
pembayaran.

---

## 4. `TicketContract`

### 4.1 Peran dan warisan

Kontrak ini adalah **satu-satunya penerbit tiket** dan **pemegang catatan
kepemilikan**. Ia juga yang menegakkan pembatasan jalur perpindahan.

Kontrak ini mewarisi:

| Warisan | Untuk apa |
|---|---|
| `ERC721` | Standar NFT — kepemilikan dan perpindahan |
| `EIP712` | *Domain* penandatanganan, mengikat tanda tangan ke kontrak dan jaringan ini |
| Pengaturan hak akses | Membedakan pemilik kontrak, penyelenggara, dan sistem |

### 4.2 Struktur data

**Model B — satu kontrak untuk banyak event.** Pembedanya `eventId`. Setiap
event punya satu atau lebih kategori tiket dengan harga dan kuotanya sendiri
(KF-16).

```solidity
struct EventInfo {
    bool    exists;           // penanda event benar-benar ada
    address organizer;        // penyelenggara acara
    uint64  eventTimestamp;   // waktu pelaksanaan
    uint32  maxPerWallet;     // batas beli per dompet untuk event ini
    bool    salesOpen;        // penjualan sedang dibuka atau tidak
}

struct TicketCategory {
    bool   exists;
    uint96 price;             // menjadi originalPrice setiap tiket kategori ini
    uint32 quota;
    uint32 minted;            // sudah tercetak berapa
}

struct TicketInfo {
    uint256 eventId;
    uint256 categoryId;
    uint96  originalPrice;    // disalin saat pencetakan, tidak pernah berubah
    bool    used;
}
```

**Pemetaan yang dibutuhkan:**

| Pemetaan | Isi | Untuk kebutuhan |
|---|---|---|
| `eventId → EventInfo` | Keterangan event | KF-14, KF-15 |
| `eventId → categoryId → TicketCategory` | Harga dan kuota per kategori | KF-16, KF-17 |
| `tokenId → TicketInfo` | Keterangan tiap tiket | KF-18, KF-49 |
| `eventId → dompet → jumlah` | Berapa tiket sudah dibeli dompet ini | KF-19, KF-28 |
| `dompet → bytes32` | Sidik jari digital data KTP | KF-09 |
| `nonce → bool` | Nomor tanda tangan yang sudah terpakai | KNF-29 |

**Kenapa `maxPerWallet` disimpan di tingkat event, bukan kategori:** kalau batas
beli dihitung per kategori, satu orang bisa membeli sejumlah batas di setiap
kategori sekaligus. Batas per event menutup celah itu.

**Kenapa `originalPrice` disalin ke `TicketInfo` dan tidak dibaca ulang dari
kategorinya:** kalau harga dibaca dari kategori setiap kali dibutuhkan,
mengubah harga kategori akan ikut mengubah patokan penguncian harga tiket yang
**sudah terjual**. Menyalinnya saat pencetakan membuat patokan itu terkunci
pada saat pembelian dan tidak bisa digeser di kemudian hari.

### 4.3 Tanda tangan fungsi

Isi setiap fungsi ditulis sendiri. Yang tercantum di sini hanya bentuk
panggilannya.

**Pengaturan awal**

```solidity
function setMarketplace(address marketplace) external;
function setSystemSigner(address signer) external;
```

**Manajemen event — dipanggil penyelenggara atau sistem**

```solidity
function createEvent(
    uint256 eventId,
    address organizer,
    uint64  eventTimestamp,
    uint32  maxPerWallet
) external;

function addCategory(
    uint256 eventId,
    uint256 categoryId,
    uint96  price,
    uint32  quota
) external;

function setSalesOpen(uint256 eventId, bool open) external;
```

**Pendaftaran identitas — penandatangan: SISTEM**

```solidity
function registerIdentity(
    address user,
    bytes32 identityHash,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;
```

**Pencetakan tiket — penandatangan: SISTEM**

```solidity
function mintTicket(
    address to,
    uint256 eventId,
    uint256 categoryId,
    string calldata tokenUri,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external returns (uint256 tokenId);
```

**Penandaan tiket terpakai — penandatangan: SISTEM**

```solidity
function markUsed(
    uint256 tokenId,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;
```

**Fungsi baca — dipakai server dan `MarketplaceContract`**

```solidity
function originalPriceOf(uint256 tokenId) external view returns (uint96);
function isUsed(uint256 tokenId) external view returns (bool);
function eventIdOf(uint256 tokenId) external view returns (uint256);
function remainingQuota(uint256 eventId, uint256 categoryId) external view returns (uint32);
function purchaseCountOf(uint256 eventId, address buyer) external view returns (uint32);
function identityHashOf(address user) external view returns (bytes32);
```

**Fungsi yang ditimpa dari `ERC721`**

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address);

function isApprovedForAll(address owner, address operator)
    public view override returns (bool);
```

### 4.4 Aturan yang wajib ditegakkan setiap fungsi

**`createEvent`**

- `eventId` belum pernah dipakai — kalau sudah ada, batalkan.
- `eventTimestamp` berada di masa depan.
- Hanya pihak berwenang yang boleh memanggil.

**`addCategory`**

- `eventId` **harus ada** — periksa penanda `exists`.
- `categoryId` belum pernah dipakai untuk event tersebut.
- `quota` lebih dari nol.
- Hanya penyelenggara event itu atau pemilik kontrak yang boleh memanggil.

**`registerIdentity`**

- Tanda tangan sah dan berasal dari alamat penandatangan sistem.
- `nonce` belum pernah terpakai, `deadline` belum lewat.
- Alamat tersebut belum pernah mendaftarkan identitas.
- `identityHash` bukan nilai kosong.

> **Penting — pemeriksaan NIK ganda TIDAK BISA dilakukan di dalam kontrak.**
>
> KF-11 menuntut sistem menolak pendaftaran bila Nomor Induk Kependudukan yang
> sama sudah terikat pada dompet lain. **Kontrak tidak bisa melakukannya.**
>
> Alasannya ada pada rancangan *salt* itu sendiri. Karena *salt* dibangkitkan
> **acak dan berbeda untuk setiap pengguna** (KNF-25), dua orang yang
> mendaftarkan NIK yang sama akan menghasilkan **dua hash yang sama sekali
> berbeda**. Kontrak hanya melihat hash, sehingga tidak punya cara mengetahui
> bahwa keduanya berasal dari NIK yang sama.
>
> **Ini bukan kelalaian, melainkan pertukaran yang disadari.** *Salt* per
> pengguna diperlukan untuk mencegah penebakan isi NIK dengan mencoba semua
> kemungkinan. Menghapusnya — atau menggantinya dengan satu *salt* bersama
> untuk semua pengguna — memang membuat pemeriksaan NIK ganda bisa dilakukan
> di dalam kontrak, tapi sekaligus **mengembalikan kerentanan terhadap
> penebakan menyeluruh**, dan menciptakan satu rahasia bersama yang kalau
> bocor akan membuka seluruh data sekaligus.
>
> **Akibatnya:** pemeriksaan NIK ganda dilakukan **di server**, lewat kunci unik
> pada kolom `nik_indeks` di MySQL — sebuah sidik jari NIK yang sengaja dibuat
> **tetap** (tidak ber-*salt*, melainkan ber-*pepper*) supaya NIK yang sama
> selalu menghasilkan nilai yang sama. Rinciannya di
> [`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 5.1.
>
> Peran kontrak di sini terbatas pada dua hal: mengikat satu identitas pada satu
> dompet, dan membuktikan bahwa identitas itu belum diubah sejak didaftarkan.
> **Kontrak tidak pernah menyimpan data KTP dalam bentuk apa pun selain hash
> ber-*salt*.**
>
> **Konsekuensi keamanannya, dan ini harus ditulis apa adanya:** berbeda dari
> kuota, `originalPrice`, dan pembatasan jalur perpindahan yang tetap berdiri
> meskipun server dikuasai penyerang (KNF-27), **pemeriksaan NIK ganda ikut
> jatuh bila server dikuasai.** Ini perlu dicatat di
> [`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md).

**`mintTicket`** — fungsi dengan aturan terbanyak

- Tanda tangan sah dan berasal dari alamat penandatangan sistem.
- `nonce` belum terpakai, `deadline` belum lewat.
- `eventId` ada, dan penjualannya sedang dibuka.
- `categoryId` ada di dalam event tersebut.
- **Kuota kategori belum habis** — `minted` masih di bawah `quota`.
- **Batas beli per dompet untuk event ini belum terlampaui.**
- **Penerima sudah mendaftarkan identitas** — `identityHashOf` tidak kosong.
- Setelah berhasil: naikkan `minted`, naikkan jumlah pembelian dompet, **salin
  harga kategori ke `originalPrice` tiket**, tandai `nonce` terpakai.

**`markUsed`**

- Tanda tangan sah, `nonce` belum terpakai, `deadline` belum lewat.
- Tiket ada dan **belum pernah ditandai terpakai**.

**`_update`** — dibahas terpisah di Bagian 4.5 karena paling rawan.

### 4.5 `_update` — Fungsi Paling Rawan di Seluruh Sistem

Di sinilah pembatasan allowlist ditegakkan (KF-44, KF-45, KNF-30).

**Kenapa harus di `_update` dan bukan di tempat lain:** `_update` adalah titik
yang dilewati **semua** perubahan kepemilikan tanpa kecuali — pencetakan,
pembakaran, dan perpindahan biasa. Kalau pembatasan ditaruh di lapisan yang
lebih luar, penyerang tinggal memanggil fungsi lain yang tidak melewatinya.

**Jebakan versi pustaka:** OpenZeppelin versi 5 **menghapus**
`_beforeTokenTransfer` dan `_afterTokenTransfer`, menggantinya dengan satu
fungsi `_update`. Seluruh tutorial yang ditulis sebelum versi 5 memakai fungsi
yang sudah tidak ada, dan **tidak akan berhasil dikompilasi.**

**Cara kerjanya:**

`super._update(...)` mengembalikan **pemilik sebelumnya**, yaitu `from`. Nilai
itulah yang dipakai untuk membedakan ketiga kasus:

| Kasus | Cirinya | Harus |
|---|---|---|
| Pencetakan tiket baru | `from` kosong | **Diizinkan** |
| Pembakaran tiket | `to` kosong | **Diizinkan** |
| Perpindahan antar pengguna | Keduanya terisi | **Hanya bila pemanggilnya `MarketplaceContract`** |

**Jebakan yang paling sering terjadi — dan paling melumpuhkan:**

> **Lupa mengecualikan kasus pencetakan.**

Pencetakan tiket secara teknis juga merupakan perubahan kepemilikan — dari
ketiadaan ke pemilik pertama. Kalau pembatasannya ditulis tanpa memisahkan kasus
ini, **`mintTicket` ikut terblokir dan sistem tidak bisa menerbitkan tiket sama
sekali.** Gejalanya membingungkan karena yang gagal adalah fungsi yang sama
sekali tidak berhubungan dengan penjualan kembali.

**Jebakan kedua — urutan pemanggilan.** Nilai `from` baru diketahui **setelah**
`super._update(...)` dipanggil. Menulis pemeriksaan sebelum pemanggilan itu
berarti memeriksa nilai yang belum ada isinya.

**Jebakan ketiga — yang diperiksa adalah pemanggilnya, bukan `to`.** Pembatasan
menyangkut **siapa yang menjalankan perpindahan**, bukan siapa yang menerima
tiket. Memeriksa `to == marketplace` adalah kesalahan yang berbeda sama sekali
akibatnya: tiket jadi hanya bisa dikirim **ke** *marketplace*, bukan **lewat**
*marketplace*.

### 4.6 `isApprovedForAll` — Kenapa Perlu Ditimpa

Ini pertimbangan yang mudah terlewat sampai penjualan pertama gagal.

**Masalahnya:** untuk memindahkan tiket, `MarketplaceContract` memanggil fungsi
perpindahan di `TicketContract`. Tapi standar ERC-721 menuntut pemanggilnya
adalah pemilik tiket atau pihak yang sudah diberi izin oleh pemilik. *Marketplace*
bukan keduanya.

**Dua cara menyelesaikannya:**

| Cara | Akibatnya |
|---|---|
| Penjual memberi izin ke *marketplace* lebih dulu | Butuh **satu transaksi blockchain tambahan** setiap kali menawarkan tiket — tambahan biaya gas yang ditanggung sistem, dan tambahan langkah yang bisa gagal |
| **Timpa `isApprovedForAll` agar `MarketplaceContract` selalu dianggap berizin** | Tidak ada transaksi tambahan sama sekali |

Cara kedua lebih tepat untuk sistem ini, karena *marketplace* memang satu-satunya
pihak yang berhak memindahkan tiket — jadi izin itu bersifat tetap, bukan sesuatu
yang perlu diberikan berulang.

**Yang perlu diperhatikan:** penimpaan ini **tidak melemahkan** pembatasan
allowlist. Pembatasan di `_update` memeriksa **siapa pemanggilnya**. Kalau
seorang pengguna memberi izin kepada pihak ketiga lalu pihak ketiga itu mencoba
memindahkan tiket, pemanggilnya bukan `MarketplaceContract`, sehingga tetap
ditolak.

### 4.7 Kejadian (*event*) yang perlu dipancarkan

Kejadian dibutuhkan agar server dapat mengikuti perubahan di blockchain tanpa
harus membaca ulang seluruh isinya.

| Kejadian | Dipancarkan saat | Dipakai untuk |
|---|---|---|
| `EventCreated` | Event baru dibuat | Memperbarui salinan MySQL |
| `CategoryAdded` | Kategori tiket ditambahkan | Memperbarui salinan MySQL |
| `IdentityRegistered` | Identitas terdaftar | Mengubah status "menunggu" jadi "terdaftar" (Alur 1 langkah 15) |
| `TicketMinted` | Tiket tercetak | Memicu notifikasi KF-53 |
| `TicketUsed` | Tiket ditandai terpakai | Mencatat penukaran di lokasi acara |

---

## 5. `MarketplaceContract`

### 5.1 Peran

Kontrak ini adalah **satu-satunya pintu perpindahan kepemilikan tiket antar
pengguna**, dan tempat **penguncian harga jual ulang** ditegakkan.

Kontrak ini mewarisi `EIP712` untuk gerbang tanda tangan, dan menyimpan alamat
`TicketContract` yang dilayaninya.

### 5.2 Struktur data

```solidity
struct Listing {
    address seller;
    uint96  price;      // selalu sama dengan originalPrice tiket
    bool    active;
}
```

Pemetaan: `tokenId → Listing`.

**Kenapa `price` tetap disimpan padahal selalu sama dengan `originalPrice`:**
supaya nilai yang berlaku pada penawaran itu tercatat sebagai bagian dari
penawaran, dan bisa diperiksa ulang saat penjualan dijalankan. Nilainya tetap
**wajib diambil dari `TicketContract`**, bukan dari masukan pemanggil.

### 5.3 Tanda tangan fungsi

**Penawaran — penandatangan: SISTEM**

```solidity
function listTicket(
    uint256 tokenId,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;

function cancelListing(
    uint256 tokenId,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;
```

**Penjualan — penandatangan: SISTEM**

```solidity
function executeSale(
    uint256 tokenId,
    address buyer,
    uint256 nonce,
    uint256 deadline,
    bytes calldata signature
) external;
```

**Fungsi baca**

```solidity
function listingOf(uint256 tokenId) external view returns (Listing memory);
function isListed(uint256 tokenId) external view returns (bool);
```

### 5.4 Aturan yang wajib ditegakkan

**`listTicket`**

- Tanda tangan sah, `nonce` belum terpakai, `deadline` belum lewat.
- Tiket **belum pernah ditandai terpakai** — baca `isUsed` dari `TicketContract`.
- Event tiket tersebut **belum lewat waktunya**.
- Tiket belum sedang ditawarkan.
- **Harga diambil dari `originalPriceOf(tokenId)` milik `TicketContract`** —
  tidak pernah dari parameter fungsi.
- Simpan pemilik saat ini sebagai `seller`.

**Perhatikan: fungsi `listTicket` tidak punya parameter harga sama sekali.** Ini
disengaja. Kalau harga menjadi parameter, ada jalan bagi pemanggil untuk
mengisinya — sekalipun nilainya kemudian diperiksa. Menghilangkan parameternya
membuat penyimpangan harga **tidak mungkin dinyatakan**, bukan sekadar ditolak.
Ini pelaksanaan langsung KF-40 dan KF-41.

**`cancelListing`**

- Tanda tangan sah, `nonce` belum terpakai, `deadline` belum lewat.
- Penawaran sedang aktif.
- Pemilik tiket masih orang yang sama dengan `seller` yang tercatat.

**`executeSale`**

- Tanda tangan sah, `nonce` belum terpakai, `deadline` belum lewat.
- Penawaran sedang aktif.
- **Pembeli sudah mendaftarkan identitas** — baca `identityHashOf` dari
  `TicketContract` (KF-46).
- Pembeli bukan penjual itu sendiri.
- **Tandai penawaran tidak aktif LEBIH DULU, baru jalankan perpindahan.**
- Jalankan perpindahan lewat `TicketContract`.

**Kenapa urutan pada butir terakhir penting:** menandai penawaran tidak aktif
sebelum perpindahan dijalankan mencegah penawaran yang sama diproses dua kali
bila fungsi ini sempat terpanggil ulang di tengah jalan. Ini pola pengamanan
yang berlaku umum: **ubah dulu keadaan di dalam kontrak, baru panggil kontrak
lain.**

### 5.5 Kejadian yang perlu dipancarkan

| Kejadian | Dipancarkan saat | Dipakai untuk |
|---|---|---|
| `TicketListed` | Tiket ditawarkan | Menampilkan di daftar jual ulang |
| `ListingCancelled` | Penawaran dibatalkan | Menghapus dari daftar |
| `TicketSold` | Tiket terjual | Memicu notifikasi KF-54 |

### 5.6 Yang Sengaja TIDAK Ditangani Kontrak Ini

**`MarketplaceContract` tidak memegang dan tidak memindahkan uang.**

Pembayaran berjalan lewat Midtrans di luar blockchain, dan `executeSale` hanya
dipanggil **setelah** server memastikan pembayaran lunas. Kontrak ini hanya
mengurus perpindahan kepemilikan.

**Cara uang sampai ke penjual sudah diputuskan pada 7 Agustus 2026:**
diteruskan ke **rekening bank penjual lewat Midtrans**, dijalankan server
setelah `executeSale` berhasil (KF-59). Rinciannya di
[`07-alur-pengguna.md`](07-alur-pengguna.md) Bagian 5.5 dan
[`04-rancangan-database-erd.md`](04-rancangan-database-erd.md) Bagian 13.

**Yang perlu disadari dari pemisahan ini:** karena uang tidak melewati
blockchain, **penerusan dana tidak terlindungi smart contract.** Berbeda dari
kuota, harga, dan jalur perpindahan yang tetap berdiri meskipun server dikuasai,
pencairan dana sepenuhnya bergantung pada server. Dicatat di
[`09-keterbatasan-sistem.md`](09-keterbatasan-sistem.md) Bagian 9.

**Penguncian penawaran juga tidak ditangani kontrak ini.** Pencegahan dua
pembeli mengejar satu tiket (KF-56) dilakukan di server lewat penguncian baris
database, bukan di blockchain. Kontrak tetap menjadi penjaga terakhir — kalau
dua perpindahan sempat terjadi, yang kedua ditolak karena tiket sudah bukan
milik penjual — tapi penolakan itu terjadi **setelah** uang terlanjur dibayar,
yang justru ingin dihindari.

---

## 6. Hubungan Antar Kedua Kontrak

```
MarketplaceContract                    TicketContract
        │                                     │
        │── baca originalPriceOf ────────────►│
        │── baca isUsed ─────────────────────►│
        │── baca identityHashOf ─────────────►│
        │── baca pemilik tiket ──────────────►│
        │                                     │
        │── jalankan perpindahan ────────────►│
        │                                     │
        │                              _update memeriksa:
        │                              "apakah pemanggilnya
        │◄──────────────────────────── MarketplaceContract?"
```

**Hubungannya searah.** `MarketplaceContract` mengenal `TicketContract`, tapi
`TicketContract` hanya menyimpan **alamat** *marketplace* untuk keperluan
pemeriksaan — tidak pernah memanggil fungsinya.

**Kenapa dibuat searah:** dua kontrak yang saling memanggil sulit ditelusuri
alurnya dan membuka peluang pemanggilan berputar. Arah tunggal membuat setiap
alur bisa dibaca dari satu ujung ke ujung lain.

**Urutan pemasangan yang wajib diikuti:**

1. Pasang `TicketContract` lebih dulu.
2. Pasang `MarketplaceContract` dengan alamat `TicketContract` sebagai
   masukannya.
3. Panggil `setMarketplace` di `TicketContract` dengan alamat *marketplace*.
4. Panggil `setSystemSigner` dengan alamat penandatangan sistem.

**Langkah 3 mudah terlupa**, dan gejalanya menyesatkan: pencetakan tiket
berjalan normal, tapi **setiap penjualan kembali gagal** karena `_update`
membandingkan pemanggil dengan alamat kosong.

---

## 7. Pengaturan Kompilasi

Berkas `contracts/foundry.toml` saat ini **belum memenuhi KNF-33**. Isinya baru
memuat pengaturan direktori bawaan.

**Yang wajib ditambahkan:**

| Pengaturan | Kenapa wajib eksplisit |
|---|---|
| Versi kompilator Solidity | Kalau tidak ditulis, versi yang dipakai mengikuti yang terpasang di mesin — sehingga hasil kompilasi bisa berbeda antar waktu dan antar mesin |
| Versi mesin virtual Ethereum | **Nilai bawaannya sudah beberapa kali berubah.** Kalau tidak ditulis, hasil kompilasi bisa berubah tanpa ada perubahan kode sama sekali, dan penyebabnya sangat sulit dilacak |

Versi yang dipakai proyek ini tercatat di `CLAUDE.md` Bagian 9.2. **Periksa ke
dokumentasi resmi sebelum menuliskannya**, jangan menyalin dari ingatan.

---

## 8. Rencana Pengujian

Setiap butir merujuk kode kebutuhan agar KNF-02 terpenuhi.

### 8.1 Pengujian fungsi berjalan benar

| Yang diuji | Kebutuhan |
|---|---|
| Event dan kategori dapat dibuat, `eventId` unik | KF-14, KF-15, KF-16 |
| Identitas dapat didaftarkan dan terbaca | KF-09 |
| Tiket dapat dicetak, `originalPrice` tercatat benar | KF-33, KF-18 |
| Tiket dapat ditawarkan dengan harga sama dengan `originalPrice` | KF-39, KF-40 |
| Tiket berpindah kepemilikan lewat `MarketplaceContract` | KF-43, KF-44 |
| Tiket dapat ditandai terpakai | KF-49 |

### 8.2 Pengujian penolakan — yang wajib gagal

**Bagian ini lebih penting daripada 8.1.** Fungsi yang berjalan benar mudah
diuji; yang menentukan keamanan adalah **apakah yang seharusnya ditolak
benar-benar ditolak.**

| Percobaan | Harus gagal karena | Kebutuhan |
|---|---|---|
| Mencetak tiket melebihi kuota | Kuota dipaksakan kontrak | KF-27, KF-17 |
| Mencetak melebihi batas beli per dompet | Batas dipaksakan kontrak | KF-28 |
| Mencetak untuk dompet yang belum daftar identitas | Pemeriksaan identitas | KF-12 |
| Mencetak tanpa tanda tangan sistem | Gerbang tanda tangan | KF-32 |
| **Memakai ulang tanda tangan yang sama** | *Nonce* sekali pakai | KNF-29 |
| **Memakai tanda tangan yang sudah kedaluwarsa** | Batas waktu berlaku | KNF-29 |
| Memakai `eventId` yang tidak ada | Pemeriksaan `exists` | Arsitektur 4.2 |
| **Memindahkan tiket langsung antar dompet** | Pembatasan allowlist di `_update` | KF-45, KNF-30 |
| **Memindahkan tiket lewat pihak ketiga yang diberi izin pemilik** | Yang diperiksa pemanggilnya | KF-45 |
| Menawarkan tiket yang sudah terpakai | Pemeriksaan `isUsed` | KF-47 |
| Menandai tiket terpakai dua kali | Pemeriksaan `used` | KF-50 |
| Membeli tiket jual ulang tanpa daftar identitas | Pemeriksaan identitas | KF-46 |

### 8.3 Pengujian yang mudah terlupa

| Percobaan | Kenapa perlu diuji |
|---|---|
| **Mencetak tiket** setelah pembatasan `_update` ditulis | Memastikan pencetakan **tidak ikut terblokir** — jebakan paling umum |
| **Membakar tiket** | Memastikan pembakaran juga tidak ikut terblokir |
| Menjalankan penjualan kembali sebelum `setMarketplace` dipanggil | Memastikan gejalanya terlihat jelas, bukan gagal membingungkan |
| Membeli tiket setelah harga kategori diubah | Memastikan `originalPrice` tiket lama **tidak ikut berubah** |
| Dua penawaran berurutan atas tiket yang sama | Memastikan penawaran kedua ditolak |

### 8.4 Pengukuran

| Yang diukur | Status |
|---|---|
| Biaya gas per fungsi | `[BUTUH DATA UJI]` — KNF-04 |
| Cakupan pengujian | `[BUTUH DATA UJI]` — KNF-34 |

---

## 9. Urutan Pengerjaan yang Disarankan

Disusun agar setiap tahap bisa diuji sebelum lanjut, dan agar bagian tersulit
tidak menumpuk di akhir.

| Tahap | Yang dikerjakan | Kenapa urutannya begini |
|---|---|---|
| 1 | Kerangka `TicketContract`: warisan `ERC721`, struktur data, `createEvent`, `addCategory` | Pondasi. Belum ada bagian rawan |
| 2 | `mintTicket` **tanpa** gerbang tanda tangan, dengan pemeriksaan kuota dan batas beli | Menguji logika kuota terpisah dari logika tanda tangan — kalau digabung, sulit tahu mana yang salah saat gagal |
| 3 | `EIP712`, *nonce*, *deadline*, lalu pasang gerbang tanda tangan pada `mintTicket` | Bagian tersulit, dikerjakan saat pondasinya sudah terbukti jalan |
| 4 | `registerIdentity` dan pemeriksaan identitas di `mintTicket` | Memakai ulang pola tanda tangan dari tahap 3 |
| 5 | `markUsed` | Pola yang sama, fungsi paling sederhana |
| 6 | Timpa `_update` untuk pembatasan allowlist | **Segera uji ulang pencetakan dan pembakaran** setelah tahap ini |
| 7 | Timpa `isApprovedForAll` | Tanpa ini penjualan kembali butuh transaksi tambahan |
| 8 | `MarketplaceContract`: `listTicket` dan `cancelListing` | Bagian yang belum melibatkan perpindahan |
| 9 | `executeSale` | Bagian terakhir, karena bergantung pada semua di atasnya |

**Tahap 2 dan 3 sengaja dipisah.** Menulis pemeriksaan kuota dan pemeriksaan
tanda tangan sekaligus membuat kegagalan sulit ditelusuri — tidak jelas apakah
yang salah logika kuotanya atau bentuk tanda tangannya.

**Tahap 6 adalah tahap yang wajib diikuti pengujian ulang menyeluruh**, karena
`_update` menyentuh semua perubahan kepemilikan, termasuk pencetakan yang
sebelumnya sudah berjalan benar.
