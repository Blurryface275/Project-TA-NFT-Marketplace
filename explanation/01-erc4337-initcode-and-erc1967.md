# Penjelasan 01: Struktur initCode ERC-4337, Hubungan dengan ERC-1967, dan ZeroDev Kernel

Dokumen ini mendokumentasikan secara komprehensif pertanyaan, perdebatan, dan penjelasan teknis seputar arsitektur deployment akun ERC-4337, peran proxy ERC-1967, serta cara kerja Kernel Factory.

---

## 1. Pertanyaan Kunci & Perdebatan

1. **Kontrak apa saja yang terlibat saat pembuatan akun?**
2. **Apakah benar bahwa `initCode` = `enableData` + bytecode Kernel Account?**
3. **Mengapa di dokumen resmi ERC-4337 tidak ada penyebutan standar ERC-1967? Dari mana kewajiban/aturan pemanggilan ERC-1967 berasal?**
4. **Mengapa akun ERC-4337 dideploy menggunakan Proxy, bukan langsung deploy kontrak utuh (*monolithic*)?**

---

## 2. Bedah Konsep & Penjelasan Teknis

### A. Tiga Kontrak Utama dalam Ekosistem Kernel ERC-4337

Dalam arsitektur ZeroDev Kernel (versi 3.3 / ERC-4337 v0.7), terdapat 3 kontrak utama yang berinteraksi:

```
                  ┌────────────────────────────────────────────────┐
                  │              KernelFactory                     │
                  │ (Factory Kontrak yang dipanggil oleh initCode) │
                  └───────────────────────┬────────────────────────┘
                                          │
                        Mengeksekusi CREATE2 (0xF5)
                                          │
                                          ▼
                  ┌────────────────────────────────────────────────┐
                  │                 ERC-1967 Proxy                 │
                  │   (Alamat Smart Contract Account milik User)   │
                  │                                                │
                  │   Slot 0x3608... -> Kernel Implementation      │
                  └───────────────┬────────────────────────┬───────┘
                                  │                        │
                      DELEGATECALL│                        │DELEGATECALL
                                  ▼                        ▼
     ┌───────────────────────────────────────┐  ┌───────────────────────┐
     │          Kernel Implementation        │  │   PasskeyValidator    │
     │  (Logika akun inti, eksekusi tx, dll) │  │  (Validasi ECDSA P256) │
     └───────────────────────────────────────┘  └───────────────────────┘
```

1. **`KernelFactory`**: Kontrak pabrik yang tugasnya mendeploy Smart Account baru ke blockchain menggunakan opcode `CREATE2` (0xF5).
2. **`Kernel Implementation` (Logic Contract)**: Kontrak pintar yang memuat kode logika akun (fungsi eksekusi transaksi, validasi signature dasar, integrasi plugin). Kontrak ini hanya dideploy **satu kali saja di blockchain** oleh pengembang ZeroDev dan digunakan bersama oleh jutaan pengguna.
3. **`ERC-1967 Proxy`**: Kontrak ringan (*lightweight minimal proxy*) yang menjadi alamat wallet pengguna. Kontrak ini menyimpan state (saldo ETH/token, pemilik, konfigurasi plugin) dan meneruskan seluruh panggilan logika ke `Kernel Implementation` melalui `DELEGATECALL`.
4. **`PasskeyValidator`**: Kontrak plugin (*validator*) yang memverifikasi signature WebAuthn P-256 (secp256r1) dari sidik jari / Face ID pengguna.

---

### B. Mitos vs Fakta: Apa Sebenarnya Isi dari `initCode`?

* **Mitos yang keliru:**
  > *"initCode adalah gabungan dari enableData (kredensial passkey) + bytecode dari kontrak Kernel Account."*
* **Fakta Spesifikasi ERC-4337:**
  Berdasarkan spesifikasi resmi ERC-4337, `initCode` bukanlah bytecode kontrak. `initCode` adalah **instruksi pemanggilan fungsi ke kontrak Factory**.

Struktur byte dari `initCode` (ERC-4337 v0.6) atau `factory` + `factoryData` (ERC-4337 v0.7):

```
initCode = [ 20 Bytes Alamat Factory ] + [ Calldata Pemanggilan Fungsi Factory ]
```

Calldata pemanggilan fungsi Factory tersebut adalah pemanggilan method:
```solidity
KernelFactory.createAccount(
    address _implementation,   // Alamat Kernel Implementation logic contract
    bytes calldata _data,      // initializationData (berisi konfigurasi validator & enableData)
    uint256 _salt              // Salt acak / deterministik untuk CREATE2
)
```

Jadi:
1. Bytecode akun **TIDAK dikirim di dalam UserOperation**. Bytecode proxy sudah tertanam di dalam kode `KernelFactory`.
2. `enableData` (96 bytes kredensial passkey) berada di dalam parameter `_data` (*initializationData*), bukan langsung ditempelkan ke bytecode.

---

### C. Mengapa ERC-4337 Tidak Menyebut ERC-1967?

Ini adalah perdebatan penting:
* **ERC-4337 adalah Standar Protokol Transaksi (Interface Standard):**
  ERC-4337 hanya mengatur bagaimana UserOperation dipaketkan, divalidasi oleh `EntryPoint`, dan bagaimana akun pertama kali dibuat (`initCode` memanggil factory via `CREATE2`).
  ERC-4337 **sengaja tidak mendikte arsitektur internal smart contract account pengguna**. Pengembang bebas membuat akun monolitik, akun multi-sig Gnosis, atau akun modular.
* **ERC-1967 adalah Standar Penyimpanan Proxy (Proxy Storage Slots):**
  ERC-1967 mendefinisikan lokasi slot memori khusus di storage kontrak agar penunjukan alamat implementasi tidak bertabrakan dengan variabel state akun:
  * Slot Implementation:
    ```
    bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
    ```
* **Hubungannya:**
  ZeroDev Kernel memilih mengimplementasikan standar **ERC-1967 Proxy** di dalam `KernelFactory` karena:
  1. **Penghematan Biaya Gas (~95%):**
     Deploy kontrak logika monolitik berukuran besar memakan ~2.000.000 gas.
     Deploy ERC-1967 Proxy hanya memakan ~150.000 gas.
  2. **Upgradeability (UUPS):**
     Jika di masa depan ada pembaruan fitur Kernel (misal dari Kernel v3.3 ke v3.4), akun pengguna cukup mengubah alamat di slot implementasi tanpa mengubah alamat wallet dan tanpa memindahkan aset.

---

## 3. Sumber & Referensi Resmi

1. **Spesifikasi Resmi ERC-4337 (Ethereum Improvement Proposal):**
   * Link: https://eips.ethereum.org/EIPS/eip-4337
   * Bagian penting: *First-time Smart Contract Account creation*, penjelasan `initCode`, dan penggunaan opcode `CREATE2` (0xF5).
2. **Spesifikasi Resmi ERC-1967 (Standard Proxy Storage Slots):**
   * Link: https://eips.ethereum.org/EIPS/eip-1967
   * Bagian penting: Formula derivasi slot implementasi `keccak256("eip1967.proxy.implementation") - 1`.
3. **ZeroDev Kernel GitHub Repository:**
   * Repository: https://github.com/zerodev-app/kernel
   * File: `src/factory/KernelFactory.sol` (Implementasi fungsi `createAccount` dan pembuatan proxy ERC-1967).
4. **Dokumentasi Resmi ZeroDev Account Abstraction:**
   * Link: https://docs.zerodev.app/
