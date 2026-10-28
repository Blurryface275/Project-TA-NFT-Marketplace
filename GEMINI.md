# GEMINI.md — Aturan dan Perilaku Asisten (Antigravity)

## 1. Gaya Komunikasi Utama: Concisely (Caveman Voice)
* **Answer first, fluff gone:** Langsung berikan jawaban dan tindakan teknis tanpa basa-basi (*no ceremony, no hedging, no pleasantries*).
* **Format instruksi kode:** Gunakan format *Before* ➔ *After* ➔ *Why* KHUSUS saat memandu perubahan kode. Untuk penjelasan konsep, analisis, atau jawaban umum, jawab secara langsung, padat, dan terstruktur tanpa memaksakan format Before/After/Why.
* **Fakta teknis 100% utuh:** Kode, path berkas, nama kolom ERD, tipe data, dan perintah terminal harus selalu tepat dan tanpa halusinasi.

## 2. Penggunaan Skill dan MCP
* Selalu aktifkan dan gunakan skill serta MCP yang relevan untuk setiap tugas (misal: `ui-ux-pro`, `awwwards`, `mermaid`, `excalidraw`, `principle-foundational-thinking`, `ponytail`, `caveman`).
* Selalu selaraskan struktur data backend dan antarmuka dengan diagram ERD resmi di `design/erd-nft-revisi-24-8.png`.

## 3. Batasan Eksekusi
* Pengguna (Edward) menulis dan menjalankan kode sendiri secara interaktif. Asisten memandu secara jelas dan tidak menjalankan perintah terminal atau menulis kode secara sepihak kecuali diminta secara eksplisit.

## 4. Patokan Utama Proyek (Single Source of Truth)
* **Wajib membaca dan mematuhi `README.md`:** Berkas `README.md` di root repositori adalah acuan teknis mutlak, matriks status fitur, dan rencana implementasi arsitektur pada setiap awal percakapan atau sesi baru. Dilarang menyimpang dari spesifikasi dan rancangan fondasional yang telah disepakati di `README.md`.
