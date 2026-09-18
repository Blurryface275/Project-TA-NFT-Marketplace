# Penjelasan 02: Kriptografi Passkey (WebAuthn) & Perhitungan Alamat Smart Account (Data Riil)

Dokumen ini menjelaskan struktur 96 bytes data kredensial passkey (`enableData`), algoritma kurva eliptik P-256 (secp256r1), serta langkah-langkah matematis derivasi alamat Smart Contract Account counterfactual menggunakan data uji riil.

---

## 1. Konsep Dasar Kriptografi Passkey

Tidak seperti private key Ethereum biasa yang menggunakan kurva **secp256k1**, Passkey/WebAuthn menggunakan standar kurva **secp256r1 (NIST P-256)** yang didukung secara native oleh chip keamanan perangkat keras di dunia (Apple Secure Enclave, Android Keystore, Windows Hello TPM, dan YubiKey).

Sepasang kunci WebAuthn terdiri dari:
1. **Private Key**: Tersimpan secara terisolasi di dalam chip hardware, tidak pernah bisa diekstraksi keluar.
2. **Public Key**: Titik pada kurva eliptik yang dinyatakan dalam koordinat Kartesius:
   * **`pubX`**: Koordinat sumbu X (angka integer 256-bit / 32 bytes).
   * **`pubY`**: Koordinat sumbu Y (angka integer 256-bit / 32 bytes).
3. **Authenticator ID / Credential ID**: Identifier acak yang menunjuk ke lokasi penyimpanan kunci di chip hardware.

---

## 2. Struktur 96 Bytes `enableData`

Smart Contract `PasskeyValidator` di blockchain Ethereum membutuhkan 96 bytes data untuk menginisialisasi pemilik akun:

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│       pubKey.pubX       │       pubKey.pubY       │   authenticatorIdHash   │
│        (32 Bytes)       │        (32 Bytes)       │        (32 Bytes)       │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
Total: 32 + 32 + 32 = 96 Bytes (192 karakter Hexadecimal)
```

### Letak Kode Pemrosesan di Library:
Di dalam file `frontend/node_modules/@zerodev/webauthn-key/toWebAuthnKey.ts`:
```ts
// 1. authenticatorId (Base64URL) diubah ke byte lalu di-hash dengan keccak256
const authenticatorIdHash = keccak256(
    uint8ArrayToHexString(b64ToBytes(authenticatorId))
);

// 2. Ketiga komponen digabung menjadi satu string Hex 96 bytes:
export const encodeWebAuthnPubKey = (pubKey: WebAuthnKey) => {
    return concatHex([
        toHex(pubKey.pubX, { size: 32 }),
        toHex(pubKey.pubY, { size: 32 }),
        pad(pubKey.authenticatorIdHash, { size: 32 })
    ]);
};
```

---

## 3. Studi Kasus Perhitungan Riil (Data Pengujian Akun Andi)

Berikut adalah data riil yang dihasilkan dari pendaftaran akun Andi melalui Windows Hello:

### Langkah 1: Data Mentah dari Browser
* **Email**: `andi@gmail.com`
* **Credential ID (Base64URL)**:
  `ftAgGUM6AiPiezXqYZRdiaV3exgtAYtkC6Ado98ke7A`
* **Koordinat pubX (Desimal)**:
  `17202315053155700871337482835269222479261778142721832047805908906935293299702`
* **Koordinat pubY (Desimal)**:
  `10915904975765796246328639556277636181467438466635848270513904677708575007329`

---

### Langkah 2: Konversi ke Format Hexadecimal 32 Bytes

1. **Konversi `pubX` ke Hex (32 Bytes / 64 karakter Hex):**
   ```
   26047944581761d3621db35790c6fff12aa6d1e80fbfb9d499492bff6857cbf6
   ```

2. **Konversi `pubY` ke Hex (32 Bytes / 64 karakter Hex):**
   ```
   1820a94ffdbd20e9795cbb5cb31957135d7c5bf56fe73a056556856d397ed261
   ```

3. **Perhitungan `authenticatorIdHash`:**
   * Decode Base64URL string `ftAgGUM6AiPiezXqYZRdiaV3exgtAYtkC6Ado98ke7A` menjadi 32 bytes data biner.
   * Lakukan hashing `keccak256` pada byte tersebut:
   ```
   keccak256(bytes) = 7ed0201943ba0223e27b45ea61945d8985777b182d018b640ba01da3df247bb0
   ```

---

### Langkah 3: Penggabungan Menjadi 96 Bytes `enableData`

Menggabungkan ketiga bagian secara berurutan:
```
enableData = 0x
26047944581761d3621db35790c6fff12aa6d1e80fbfb9d499492bff6857cbf6 + 
1820a94ffdbd20e9795cbb5cb31957135d7c5bf56fe73a056556856d397ed261 + 
7ed0201943ba0223e27b45ea61945d8985777b182d018b640ba01da3df247bb0
```

Hasil akhir (192 karakter hex string):
```
0x26047944581761d3621db35790c6fff12aa6d1e80fbfb9d499492bff6857cbf61820a94ffdbd20e9795cbb5cb31957135d7c5bf56fe73a056556856d397ed2617ed0201943ba0223e27b45ea61945d8985777b182d018b640ba01da3df247bb0
```

---

### Langkah 4: Penurunan Alamat Wallet Counterfactual (ERC-4337)

Data 96 bytes di atas dipasangkan ke kontrak:
* **Alamat PasskeyValidator di Sepolia Testnet:**
  `0x7ab16Ff354AcB328452F1D445b3Ddee9a91e9e69` (versi V0_0_3_PATCHED)
* **Kernel Version**: `KERNEL_V3_3`
* **EntryPoint Address**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032` (v0.7)

Melalui fungsi `createKernelAccount(publicClient, ...)` di `@zerodev/sdk`, dilakukan kalkulasi deterministik opcode `CREATE2` tanpa perlu mengirim gas/transaksi on-chain (*counterfactual address*):

Hasil Alamat Wallet Smart Account Andi:
```
0x811aed8154d90B9454AFbe246f167106eF4361Eb
```

Alamat ini unik milik Andi, siap menerima transfer dana atau NFT tiket, dan baru akan benar-benar ter-deploy ke blockchain pada saat transaksi pertama kali dikirimkan (*lazy deployment*).

---

## 4. Sumber & Referensi Resmi

1. **W3C Web Authentication (WebAuthn Level 3):**
   * Link: https://www.w3.org/TR/webauthn-3/
   * Bagian penting: Struktur `PublicKeyCredential`, format data autentikasi, kurva ES256 (COSE Algorithm Identifier -7).
2. **FIDO Alliance FIDO2 Specification:**
   * Link: https://fidoalliance.org/specifications/
3. **NIST Special Publication 800-186 (Recommendation for Discrete Logarithm-Based Cryptography: Elliptic Curve Domain Parameters):**
   * Spesifikasi kurva P-256 / secp256r1.
4. **ZeroDev Passkey Validator Plugin Documentation:**
   * Link: https://docs.zerodev.app/sdk/plugins/passkey
