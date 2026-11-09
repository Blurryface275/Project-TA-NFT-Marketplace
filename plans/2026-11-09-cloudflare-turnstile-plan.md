# Rencana Teknis Mitigasi Bot Calo (Cloudflare Turnstile)

## 1. Landasan & Sumber Dokumentasi Resmi Cloudflare

1. **Client-side Rendering API:**
   * URL: `https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/`
   * Dokumen spesifikasi: Script loader `https://challenges.cloudflare.com/turnstile/v0/api.js` dan container HTML `cf-turnstile` dengan atribut `data-sitekey`, `data-callback`, `data-theme`.
2. **Server-side Validation (`/siteverify`):**
   * URL: `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`
   * Dokumen spesifikasi: Endpoint `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` dengan `Content-Type: application/x-www-form-urlencoded` mengirim field `secret` dan `response` (token CAPTCHA), mengembalikan JSON `{ success: boolean, "error-codes": string[], challenge_ts: string, hostname: string }`.
3. **Official Test Sitekeys & Dummy Secrets (Development Sandbox):**
   * URL: `https://developers.cloudflare.com/turnstile/troubleshooting/testing/`
   * Dummy Sitekey (Always Passes): `1x00000000000000000000AA`
   * Dummy Secret Key (Always Passes): `1x0000000000000000000000000000000AA`

---

## 2. Checklist Berkas & Perubahan (Untuk Ditulis Pengguna)

### A. Backend (NestJS)
1. **[CreateSnapDto](file:///d:/STEVE/Project-TA-NFT-Marketplace/backend/src/tickets/dto/create-snap.dto.ts):**
   * Tambahkan field opsional `turnstileToken?: string` dengan decorator `@IsString()` dan `@IsOptional()`.
2. **[TicketsService](file:///d:/STEVE/Project-TA-NFT-Marketplace/backend/src/tickets/tickets.service.ts):**
   * Pada method `createSnapTransaction`, sebelum proses pemesanan/kuota, tambahkan validasi HTTP POST ke `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
   * Jika token tidak valid atau kosong saat `TURNSTILE_SECRET_KEY` terkonfigurasi, tolak dengan `BadRequestException`.
3. **`backend/.env`:**
   * Tambahkan `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`.

### B. Frontend (Next.js)
1. **[actions.ts](file:///d:/STEVE/Project-TA-NFT-Marketplace/frontend/src/app/dashboard/buy/actions.ts):**
   * Tambahkan parameter `turnstileToken?: string` pada `createSnapPaymentAction` dan masukkan ke body JSON `POST /api/tickets/create-snap`.
2. **[BuyTicketCard.tsx](file:///d:/STEVE/Project-TA-NFT-Marketplace/frontend/src/app/dashboard/buy/BuyTicketCard.tsx):**
   * Muat `<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />`.
   * Simpan state `turnstileToken` melalui `window.onTurnstileSuccess`.
   * Tempatkan elemen `<div className="cf-turnstile" data-sitekey="..." data-callback="onTurnstileSuccess" />` di atas tombol beli.
   * Kunci tombol checkout (`disabled={!turnstileToken || isLoading}`) sampai pengguna lolos tantangan CAPTCHA Turnstile.
3. **`frontend/.env.local`:**
   * Tambahkan `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`.

