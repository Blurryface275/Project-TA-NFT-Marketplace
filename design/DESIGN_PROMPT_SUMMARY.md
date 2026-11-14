# AI Prompt: nftix. Ticketing System

## 1. Identity & Style
- **Brand**: `nftix.` (lowercase, terracotta dot).
- **Archetype**: Warm Editorial Utility (Kinfolk, Gather, DICE).
- **Tone**: Tangible, human. Zero AI slop, zero crypto jargon.
- **Anti-AI-Slop**: NO neon gradients; NO glassmorphism blobs; NO thick outlines; NO generic 3-card grids; NO raw crypto terms ("ERC-721", "0x...", "Mint" -> use "Digital Pass", "Seat Ticket", "Resale Pass").

## 2. Visual Tokens
- **Canvas**: `#F7F5EE` (Warm Linen)
- **Surfaces**: `#FFFFFF` (White), `#F0EDE4` (Muted Stone)
- **Brand**: `#D94520` (Terracotta), Hover `#BF3B19`, Tint `#FBECE7`
- **Text**: `#171717` (Charcoal Espresso), Muted `#736E65` (Warm Slate)
- **Borders**: 1px hairline (`rgba(0,0,0,0.08)` / `border-stone-200`)
- **Radius**: `rounded-xl` (inputs/buttons), `rounded-2xl` (cards/hero)
- **Typography**: Plus Jakarta Sans / Inter; Tabular Mono for codes/timers.
- **Signature**: Physical ticket with perforated dashed line and edge notches.

## 3. 10 UX Heuristics
1. **Status**: 60s dynamic QR ring, live quota badges.
2. **Real World**: Perforated physical ticket, Rupiah format (`Rp 150.000`).
3. **Control**: Back breadcrumbs, modal close on Esc.
4. **Consistency**: Uniform hairline borders, terracotta CTAs.
5. **Error Prevention**: Turnstile check, quota locks (max 1-2 per NIK).
6. **Recognition**: Segmented search dock with explicit placeholders.
7. **Efficiency**: Quick category pills, camera QR scan + fast NIK entry.
8. **Minimalism**: Clean typography, generous whitespace.
9. **Error Recovery**: Clear human notices, no raw EVM codes.
10. **Help**: Contextual guides ("All set for the door", UU PDP privacy).

## 4. Pages & Features

### 1. Landing (`/`)
- **Nav**: `nftix.` logo, `Explore events`, `My tickets`, `Resale`, Auth CTAs.
- **Hero**: Headline (*"Less scrolling. More living."*) + Billboard (*"OUT OF OFFICE"*).
- **Search**: 3 docks (*What are you into?* / *Where* / *When*) + `Find events ↗`.
- **Pills**: `All events`, `Music`, `Festivals`, `Arts & culture`.
- **Cards**: 16:9 photo banner, date, venue, price, `Tickets ↗`.
- **3-Step**: 01 Find your thing, 02 Make it yours, 03 Just show up.
- **FAQ**: Dynamic QR, price-lock resale, NIK protection under UU PDP.
- **Organizer CTA & Minimalist Footer**.

### 2. Dashboard (`/dashboard`)
- **Header**: Date, *"Good to see you, [Name]"*, `Explore events ↗`.
- **3 Metrics**: Upcoming events, Saved events, Past experiences.
- **Main (8 cols)**: *"Your next good times"*. Split horizontal cards with `CONFIRMED` badge, poster, date, venue, `Lihat Tiket` CTA.
- **Sidebar (4 cols)**: *"Saved for later"* list + *"All set for the door"* QR guide.

### 3. Primary Buy & Detail (`/dashboard/buy`)
- **Catalog**: Category pills, 16:9 cards with `Select` action.
- **Detail**: Banner, venue/date, Tier selector (radio cards with remaining quota), Policy, Summary, Midtrans Snap popup, Passkey activation.
- **Flash Sale Chip**: `⚡ Flash Sale Terbuka (Penjualan Aktif)`.

### 4. My Tickets (`/dashboard/tickets`)
- Filter tabs: Active / Redeemed / All.
- Perforated ticket cards with dashed tear line and edge notches.
- 60s dynamic rolling QR barcode with circular countdown progress.
- `Resale Ticket` modal enforcing 100% face-value price ceiling.

### 5. Resale Market (`/dashboard/resale`)
- 100% Price-Lock Guarantee badge (zero scalper markup).
- Secondary listings grid, seller hash, instant checkout.

### 6. Gate Terminal (`/dashboard/verify`)
- Dual-scan: Camera QR viewfinder + 16-digit KTP NIK input.
- Real-time RAM `keccak256(NIK)` match against on-chain identity (UU PDP).
- Full-screen Green (Granted) / Red (Denied) status + audio beep.

### 7. Organizer Portal (`/dashboard/admin`)
- Event creation form with image upload, tier quotas, and pricing.
- Real-time sales and gate ingress check-in monitor.

## 5. Stack
Next.js 14+ (App Router), Tailwind CSS, Lucide React, Plus Jakarta Sans. No backend modifications.
