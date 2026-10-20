# Antigravity Design System Specification

## 1. Design Philosophy & Mental Model
Desain antarmuka **Antigravity Tickets** mengadopsi model consumer-first modern yang terinspirasi oleh kesederhanaan dan kehangatan platform kelas dunia (seperti *tiket.com*):
- **Minimalis & Bersahabat**: Menghilangkan seluruh teks dekoratif berlebih, banner teknis yang mengintimidasi, dan istilah Web3 yang rumit bagi pengguna awam.
- **Humanist, Bukan "AI-Look"**:
  - ❌ **Dilarang**: Gradasi gelap ungu/indigo generik, efek neon glow berlebih, latar belakang dark-mode `#0B0F19` klise, atau border tebal kaku.
  - ✅ **Wajib**: Palet terang bersih (*luminous light mode*), sudut membulat lebar (*soft curves*), hairline border ultra-tipis, dan kontras warna yang nyaman di mata.

---

## 2. Color Palette & Design Tokens

### Core Colors
| Token Name | Hex / Value | Deskripsi / Penggunaan |
| :--- | :--- | :--- |
| `--canvas-bg` | `#FAF9F6` | Latar belakang halaman utama (warm luminous off-white) |
| `--card-bg` | `#FFFFFF` | Background kartu form utama |
| `--card-border` | `rgba(241, 245, 249, 0.6)` | Hairline border kartu (`border-slate-100/60`) |
| `--card-shadow` | `0 4px 30px rgba(0, 0, 0, 0.03)` | Bayangan ambien kartu yang sangat halus |
| `--brand-primary` | `#FF5A36` | Warna utama tombol aksi (CTA), link aktif, dan aksen |
| `--brand-hover` | `#F04824` | Status hover tombol utama |
| `--brand-active` | `#E03C18` | Status tap/klik tombol utama |
| `--brand-tint` | `rgba(255, 90, 54, 0.15)` | Selection highlight & focus ring halus |

### Neutral & Form Colors
| Token Name | Hex / Value | Deskripsi / Penggunaan |
| :--- | :--- | :--- |
| `--text-heading` | `#0F172A` | Judul kartu, teks tebal, dan input value |
| `--text-body` | `#334155` | Label form dan teks informasi umum |
| `--text-muted` | `#64748B` | Subtitle penjelas dan teks pengalih tab |
| `--input-bg` | `rgba(248, 250, 252, 0.7)` | Latar belakang input sebelum fokus (`bg-slate-50/70`) |
| `--input-border` | `rgba(226, 232, 240, 0.5)` | Border halus input (`border-slate-200/50`) |
| `--tab-track` | `rgba(241, 245, 249, 0.7)` | Wadah tab segmented switcher (`bg-slate-100/70`) |
| `--tab-active` | `#FFFFFF` | Indikator tab aktif dengan bayangan mikro |

### Feedback & Status
| Status | Background | Border | Teks |
| :--- | :--- | :--- | :--- |
| **Success** | `#ECFDF5` (`bg-emerald-50`) | `#A7F3D0` (`border-emerald-100`) | `#065F46` (`text-emerald-800`) |
| **Error** | `#FEF2F2` (`bg-rose-50`) | `#FECACA` (`border-rose-100`) | `#991B1B` (`text-rose-600`) |

---

## 3. Typography System

Menggunakan **Plus Jakarta Sans** sebagai tipografi utama yang dimuat melalui `next/font/google` dengan fallback modern sans-serif:

```css
font-family: var(--font-plus-jakarta), var(--font-geist-sans), Inter, system-ui, sans-serif;
```

### Type Scale & Hierarchy
- **Card Title (`h1`)**: `text-xl` (20px) hingga `text-2xl` (24px) | `font-bold` | `tracking-tight` | `#0F172A`
- **Subtitle / Caption**: `text-xs` (12px) | `font-normal` | `#64748B` | Margin top 4px
- **Form Labels**: `text-xs` (12px) | `font-medium` | `#334155`
- **Input Text**: `text-xs` (12px) | `font-normal` | `#0F172A`
- **Button CTA**: `text-xs` (12px) | `font-bold` | `text-white`
- **Footer Text / Links**: `text-xs` (12px) | `font-bold` untuk link (`#FF5A36`), `font-normal` untuk teks pembantu

---

## 4. Component Standards & Geometry

### A. Modal Card
- Lebar maksimum: `max-w-[400px]`
- Sudut lengkung: `rounded-3xl` (24px)
- Padding: `p-6 sm:p-8`
- Border: `border border-slate-100/60` (hairline transparan, bukan garis tebal)
- Penempatan: Terpusat secara horizontal dan vertikal di tengah layar (`min-h-screen flex items-center justify-center p-4`).

### B. Segmented Pill Tab
- Kontainer: `rounded-2xl` dengan `bg-slate-100/70 p-1 mb-6`
- Item Aktif: `rounded-xl bg-white text-slate-900 shadow-sm font-semibold`
- Item Inaktif: `rounded-xl text-slate-500 hover:text-slate-800 font-semibold`
- Navigasi: Menggunakan tautan rute native Next.js `<Link href="...">` untuk navigasi cepat dan ramah SEO.

### C. Input Field
- Sudut lengkung: `rounded-2xl` (16px)
- Tinggi minimum: `min-h-[44px]` (standar ergonomi sentuh Apple HIG & Google Material)
- Status default: `bg-slate-50/70 border border-slate-200/50`
- Status fokus: `bg-white border-[#FF5A36] ring-1 ring-[#FF5A36]` (1px hairline ring, dilarang memakai ring 4px yang tebal)

### D. Primary Action Button
- Sudut lengkung: `rounded-2xl` (16px)
- Tinggi: `min-h-[46px]`
- Background: `#FF5A36` dengan hover `#F04824`
- Border: `border-0` (tanpa border tambahan)
- Shadow: `shadow-sm shadow-[#FF5A36]/20`
- Micro-interaction: `active:scale-[0.98]` untuk memberikan respon taktil yang empuk

---

## 5. Accessibility & UX Architecture

1. **Routing Terpisah (Separation of Concerns)**:
   - `/login` terisolasi di [`frontend/src/app/login/`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/login/) dengan komponen [`LoginForm.tsx`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/login/LoginForm.tsx).
   - `/signup` terisolasi di [`frontend/src/app/signup/`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/signup/) dengan komponen [`SignUpForm.tsx`](file:///d:/STEVE/Project%20NFT%20Marketplace/frontend/src/app/signup/SignUpForm.tsx).
   - Setiap rute dapat memiliki Server Component Metadata terpisah untuk SEO yang optimal.
2. **WCAG 2.1 AA Compliance**:
   - Seluruh input memiliki atribut `aria-describedby` ke ID pesan error masing-masing.
   - Menggunakan `aria-invalid={true}` saat validasi form gagal.
   - Screen-reader announcement dengan `aria-live="polite"` dan teks pembantu `<span className="sr-only">`.
3. **Autofill & Keyboard Friendly**:
   - Menerapkan atribut `autoComplete="email"`, `autoComplete="current-password"`, `autoComplete="new-password"`, dan `autoComplete="one-time-code"`.
   - Menggunakan `inputMode="numeric"` pada verifikasi OTP agar papan tombol angka otomatis aktif di layar smartphone.
