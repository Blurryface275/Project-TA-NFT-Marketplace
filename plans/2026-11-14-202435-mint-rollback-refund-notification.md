# Try-Catch Rollback, Auto-Refund Midtrans & Notifikasi Transaksi Gagal

- Created: 2026-11-14 20:24:35 WIB
- Status: Approved
- Source request: Tambahkan try-catch rollback, pengembalian dana otomatis Midtrans, dan notifikasi "Transaksi Gagal" jika pencetakan/transfer NFT gagal pasca-pembayaran.

## Outcome

Pembeli tiket (Primary Market maupun Resale) tidak lagi menerima status sukses palsu atau kehilangan dana ketika transaksi on-chain (`mintTicket` atau `executeResale`) gagal setelah pembayaran Midtrans berstatus `settlement`/`capture`. Sistem melakukan retry singkat, lalu jika tetap gagal akan me-rollback status di database, memicu refund via Midtrans Native Refund API (`/v2/{order_id}/refund`), dan mengirimkan notifikasi **"Transaksi Gagal"** di UI serta email via `MailService`.

## Acceptance conditions

- Jika `mintTicket` gagal setelah retry 2x pada `processPaidOrder`, status `Order` di database berubah dari `paid` menjadi `refunded` (jika refund Midtrans sukses) atau `failed` (jika metode bayar memerlukan refund manual, misal Virtual Account di sandbox).
- Jika `executeResale` gagal setelah retry 2x pada `handleResaleWebhook`, `ResaleListing` dikembalikan ke `ACTIVE` (`lockedUntil = null`, `buyerWallet = null`), refund Midtrans dipicu, dan `getOrderStatus` untuk `RESALE-...` mengembalikan status `failed` / `refunded` agar frontend menampilkan pesan **"Transaksi Gagal"**.
- Endpoint `getOrderStatus` mengembalikan `status` akurat (`refunded` / `failed`) beserta pesan kegagalan sehingga `BuyTicketCard.tsx`, `ResaleDetailClient.tsx`, dan `OrdersList.tsx` menampilkan badge serta banner **"Transaksi Gagal — Dana Dikembalikan"** (atau info pengembalian manual jika VA).
- `MailService` mengirim email notifikasi **"Transaksi Gagal"** ke alamat email pembeli (non-blocking agar kegagalan SMTP tidak membatalkan rollback DB).
- Build `backend` (`npm run build`) dan `frontend` (`npm run build`) lulus tanpa error.

## Context and evidence

- `backend/src/tickets/tickets.service.ts`: `processPaidOrder` mengunci `OrderStatus.PENDING -> PAID` secara atomik lalu memanggil `mintTicket`, namun blok `catch` belum me-rollback `order.status` maupun memanggil Midtrans refund. `handleResaleWebhook` memanggil `executeResale`, namun blok `catch` belum membuka lock `ResaleListing` maupun memicu refund.
- `backend/src/tickets/entities/order.entity.ts`: `OrderStatus` saat ini berisi `pending | paid | failed | cancelled`; `backend/src/app.module.ts` mengaktifkan `synchronize: true`.
- `backend/src/auth/auth.service.ts`: Sudah menggunakan `MailService` (Nodemailer/Mailtrap) untuk pengiriman email.
- `frontend/src/app/dashboard/buy/BuyTicketCard.tsx`, `frontend/src/app/dashboard/resale/[id]/ResaleDetailClient.tsx`, dan `frontend/src/app/dashboard/orders/OrdersList.tsx`: Polling dan riwayat order belum menangani status `refunded` maupun pesan kegagalan minting pasca-bayar.

## Chosen approach

1. **Retry Singkat + Try-Catch Rollback:** Bungkus eksekusi on-chain (`mintTicket` dan `executeResale`) dengan helper retry 2x (jeda 2 detik) untuk gangguan RPC sementara. Jika tetap gagal, blok `catch` melakukan rollback database secara eksplisit.
2. **Midtrans Native Refund API (`POST /v2/{order_id}/refund`):** Dipanggil dari blok `catch` dengan `refund_key` deterministik (`REFUND-${orderId}`) dan `amount` sesuai total tagihan. Jika Midtrans menolak auto-refund (misal payment_type `bank_transfer` VA), tangkap error secara aman, set status ke `failed`, dan sertakan keterangan pengembalian dana manual di notifikasi.
3. **Resale Polling Visibility:** Simpan hasil kegagalan `RESALE-...` secara ringkas di `ResaleListing` atau cache status sementara agar polling `getOrderStatus` dari `ResaleDetailClient.tsx` tetap menemukan `orderId` tersebut dan menampilkan **"Transaksi Gagal"** alih-alih error `Order resale tidak ditemukan`.

## Scope

- In:
  - Penambahan `OrderStatus.REFUNDED = 'refunded'` di `order.entity.ts`.
  - Helper `executeWithRetry` + `refundMidtransTransaction` di `tickets.service.ts` untuk `processPaidOrder` dan `handleResaleWebhook`.
  - Integrasi `MailModule` ke `TicketsModule` dan method `sendTransactionFailedEmail` di `MailService`.
  - Penanganan status `refunded` dan notifikasi **"Transaksi Gagal"** di `BuyTicketCard.tsx`, `ResaleDetailClient.tsx`, dan `OrdersList.tsx`.
- Out:
  - Integrasi Midtrans Iris (payout rekening baru) tidak diperlukan.
  - Perbaikan konfigurasi Jest `TS5011` repositori (dikerjakan terpisah jika diperlukan).

## Implementation steps

1. **Entity & Mail Service (`backend/src/tickets/entities/order.entity.ts`, `backend/src/mail/`, `backend/src/tickets/tickets.module.ts`):**
   - Tambah `REFUNDED = 'refunded'` pada enum `OrderStatus`.
   - Tambah `sendTransactionFailedEmail(email, name, orderId, amount, refunded)` di `MailService` dan import `MailModule` ke `TicketsModule`.
2. **Backend Rollback & Refund (`backend/src/tickets/tickets.service.ts`):**
   - Tambah helper `executeWithRetry(fn, maxRetries = 2, delayMs = 2000)` dan `refundMidtransTransaction(orderId, amount, reason)`.
   - Perbarui `processPaidOrder`: jalankan `mintTicket` via `executeWithRetry`. Pada blok `catch`, panggil `refundMidtransTransaction`, update `order.status` ke `OrderStatus.REFUNDED` (atau `OrderStatus.FAILED`), lalu panggil `sendTransactionFailedEmail` dalam `try-catch` terpisah.
   - Perbarui `handleResaleWebhook`: jalankan `executeResale` via `executeWithRetry`. Pada blok `catch`, rollback `listing` ke `ResaleStatus.ACTIVE`, panggil `refundMidtransTransaction`, catat status gagal untuk polling `getOrderStatus`, dan kirim `sendTransactionFailedEmail`.
3. **Frontend Notification & Status (`BuyTicketCard.tsx`, `ResaleDetailClient.tsx`, `OrdersList.tsx`):**
   - Tangani `status === 'refunded' || status === 'failed'` di `BuyTicketCard.tsx` dan `ResaleDetailClient.tsx` dengan pesan **"Transaksi Gagal — Dana Anda sedang/telah dikembalikan."**
   - Tambah badge status `Refunded` / `Transaksi Gagal` di `OrdersList.tsx`.

## Verification

- `cd backend; npm run build` lulus tanpa error.
- `cd frontend; npm run build` lulus tanpa error.
- Simulasi manual: paksa `mintTicket` melempar error (misal RPC URL salah sementara), lakukan pembayaran Midtrans Sandbox (GoPay/QRIS untuk auto-refund penuh), pastikan DB ter-rollback ke `refunded`, API `/v2/{order_id}/refund` terpanggil, email "Transaksi Gagal" masuk di Mailtrap, dan UI menampilkan notifikasi **"Transaksi Gagal"**.

## Risks and accepted assumptions

- **Risiko VA Sandbox:** Midtrans Native Refund API pada metode `bank_transfer` (VA) dapat mengembalikan error non-200 karena keterbatasan metode VA. Mitigasi: blok `catch` refund tetap menandai order `failed` dan memberi tahu user agar tidak crash.
- **Asumsi:** `synchronize: true` di `AppModule` akan otomatis memperbarui enum kolom `status` pada tabel `orders` MySQL saat backend dijalankan.

## Execution protocol

1. Start a fresh chat and provide this plan.
2. Invoke `$implement` and treat this plan as the execution contract.
3. When the host supports delegation, give implementation to at least one implementer subagent; use additional implementers only for non-overlapping work with explicit ownership.
4. Use a separate reviewer subagent that did not implement the same work to compare the completed work and verification evidence against this plan.
5. Have the parent agent resolve review findings, compare the final diff and evidence with every acceptance condition, run the final checks, and invoke `$explain-this` for the user-facing walkthrough.
6. If subagents are unavailable, perform clearly separated implementation, review, and parent-verification passes and state that limitation.

## Handoff prompt

Implementasikan rencana pada `plans/2026-11-14-202435-mint-rollback-refund-notification.md` menggunakan `$implement` dan verifikasi seluruh acceptance conditions untuk rollback try-catch, refund Midtrans, email MailService, serta notifikasi UI "Transaksi Gagal".

