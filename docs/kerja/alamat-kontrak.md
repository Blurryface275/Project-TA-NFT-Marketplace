# Alamat Kontrak dan Infrastruktur

> **Berkas kerja — tidak masuk buku.** Diisi saat deploy (Fase D) dan hosting
> (Fase G). **Jangan menaruh kunci pribadi atau API key di sini** — itu
> tempatnya di `.env` (yang sudah di-gitignore).

## Sepolia Testnet

| Hal | Nilai | Tanggal |
|---|---|---|
| Alamat `TicketContract` | `[BELUM DEPLOY]` | — |
| Alamat `MarketplaceContract` | `[BELUM DEPLOY]` | — |
| Alamat `systemSigner` (dompet server) | `[BELUM]` | — |
| Transaksi `setMarketplace` | `[BELUM]` | — |
| Transaksi `setSystemSigner` | `[BELUM]` | — |
| Event seed (`eventId`, kategori) | `[BELUM]` | — |
| **Bukti sponsor gas** — hash transaksi tersponsori pertama (dari percobaan passkey atau dari backend, sesuai keputusan "siapa pengirim transaksi") | `[BELUM]` | — |
| Alamat smart account hasil percobaan passkey (bila ada) | `[BELUM]` | — |
| Verifikasi kode di Etherscan Sepolia | `[BELUM]` | — |

## Layanan luar

| Layanan | Keterangan | Status |
|---|---|---|
| ZeroDev | Project untuk Sepolia (id ada di `.env` / dasbor ZeroDev). Gas policy diaktifkan di dasbor 2 Sep | **Belum terbukti** — bukti = baris "bukti sponsor gas" di atas |
| Alchemy | `[BELUM DIBUAT]` | — |
| Midtrans sandbox | `[BELUM ADA JEJAK AKUN]` — buat sebelum backend | — |
| Pinata | `[BELUM ADA JEJAK AKUN]` — buat sebelum backend | — |
| Cloudflare Turnstile | `[BELUM]` (boleh dipotong, `TASKS.md` bagian "boleh dipotong") | — |
| Hosting publik | `[BELUM DIPUTUSKAN]` — batas 10 Sep | — |
