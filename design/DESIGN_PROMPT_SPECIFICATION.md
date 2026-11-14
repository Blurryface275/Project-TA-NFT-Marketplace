# Master Design Specification & AI Prompt: Human-Crafted Event Ticketing Marketplace

> **Purpose:** This document is an all-in-one visual and architectural prompt specification to guide an AI coding agent (or frontend engineer) in designing and implementing the complete frontend for the **NFT-Based Event Ticketing & Anti-Scalping Marketplace**.
> **Language:** English.
> **Design Philosophy:** Human-Crafted Editorial Utility (Zero AI Slop, Zero Overstimulation, Zero Raw Crypto Jargon).
> **Reference Reference:** "gather. — Event marketplace" aesthetic (warm linen canvas, high-contrast typography, terracotta billboard cards, floating segmented search capsule, physical ticket metaphors).

---

## 1. Design Direction & Anti-AI-Slop Directives

### 1.1 Aesthetic Persona: "Warm Editorial Marketplace"
* **The Problem with AI-Generated UI:** Standard LLMs produce purple-indigo glowing gradients, floating blurred glassmorphism blobs, generic 3-card icon grids, Inter-only generic SaaS typography, and cliché hype copy ("Unleash the next generation of seamless decentralized ticketing...").
* **The Solution:** A warm, grounded, physical-world editorial aesthetic inspired by high-end cultural publications and premium event platforms (e.g., Kinfolk, Monocle, DICE, Gather).
* **The Tone:** Confident, human, tangible, welcoming. It feels like an authentic cultural marketplace, not an obscure Web3 experiment.

### 1.2 Anti-AI-Slop Rules (Strictly Enforced)
1. **NO Neon Gradients / Dark-Mode Cyberpunk:** No dark glowing purple, cyan, or neon blue meshes.
2. **NO Decorative Floating Blobs / Glassmorphism:** No arbitrary `backdrop-blur-md` floating circles behind text. Surfaces are solid, crisp, and opaque.
3. **NO Crypto / Blockchain Jargon Exposed to Attendees:**
   * ❌ *Never display:* "ERC-721", "Sepolia Testnet", "0x3F8a...9B", "Minting NFT", "Paymaster Gasless", "Account Abstraction".
   * ✅ *Always display:* "Digital Seat Ticket", "Verified Event Pass", "Instant Passkey Login", "Official Price-Locked Resale", "Zero Booking Fee".
4. **NO Pill-Shaped Generic Cards:** Cards have clean architectural corners (`rounded-xl` or `rounded-2xl`), subtle hairline warm borders (`1px solid rgba(0,0,0,0.07)`), and generous breathable padding.
5. **Human Microcopy Only:** Real-world phrasing. E.g., *"Less scrolling. More living."*, *"Nov 21 — 22 • Brooklyn, NY"*, *"Tickets locked at original face value. Zero scalping allowed."*

---

## 2. Design Tokens & Visual Architecture

### 2.1 Color Palette
```css
/* Core Canvas & Surfaces */
--color-canvas:         #F7F5EE;  /* Warm Linen / Ecru - Page background */
--color-surface-white:  #FFFFFF;  /* Crisp Milk White - Cards & search capsule */
--color-surface-subtle: #F0EDE4;  /* Muted warm sand - Inset containers & tabs */

/* Primary Brand Accents */
--color-primary:        #D94520;  /* Warm Terracotta / Burnt Orange - Primary CTA, active states */
--color-primary-hover:  #BF3B19;  /* Deep Terracotta - Button hover */
--color-primary-light:  #FBECE7;  /* Soft Terracotta Tint - Badges & tag backgrounds */

/* Typography & Contrast */
--color-text-main:      #171717;  /* Deep Charcoal Espresso - High contrast headlines */
--color-text-body:      #383531;  /* Neutral Warm Black - High readability body */
--color-text-muted:     #736E65;  /* Warm Slate Stone - Timestamps, subtitles, captions */
--color-text-subtle:    #A39E93;  /* Faint Ash - Placeholder text, metadata hints */

/* Hairline Borders & Dividers */
--color-border-hairline: rgba(0, 0, 0, 0.08); /* Crisp hairline border */
--color-border-subtle:   #E5E1D6;             /* Structural dividing lines */

/* Semantic Status */
--color-status-success:  #246E48;  /* Forest Herb Green - Verified gate access, active status */
--color-status-warning:  #B86B14;  /* Warm Amber - Low ticket quota warning */
--color-status-danger:   #B82C2C;  /* Muted Brick Red - Invalid ticket, expired gate scan */
```

### 2.2 Typography Hierarchy
* **Primary Sans:** `Plus Jakarta Sans` or `Inter` (neutral, modern grotesque, highly legible at small sizes).
* **Display / Headline:** `Plus Jakarta Sans` (Font weight 700 / 800, `letter-spacing: -0.03em`, tight leading).
* **Metadata & Technical Badges:** `JetBrains Mono` or clean tabular monospace (Font weight 500, uppercase, `letter-spacing: 0.05em`) strictly for Ticket IDs, Seat Codes, NIK Hashes, and 60-Second Dynamic Timers.

### 2.3 Physical Ticket Metaphor (Signatures of Craftsmanship)
* **Perforated Tear Line:** A dashed dividing line (`border-t-2 border-dashed border-[#E5E1D6]`) flanked by inward semi-circular cutouts (`w-6 h-6 rounded-full bg-[#F7F5EE]`) at both edges of the ticket card.
* **Segmented Search Capsule Dock:** A floating pill/box dock with internal vertical hairline dividers separating "What are you into?", "Where", and "When".

---

## 3. Comprehensive Page Breakdown & Feature Inventory

### Page 1: Landing & Discovery Portal (`/` & `/events`)

```
+--------------------------------------------------------------------------------------------------------+
|  [gather.]            Explore events    How it works    For organizers              Log in   [ Sign up ]|
+--------------------------------------------------------------------------------------------------------+
|                                                                                                        |
|  GOOD TIMES START HERE                                          +-----------------------------------+  |
|                                                                 | GATHER PRESENTS        LIVE / 2026|  |
|  Less scrolling.                                                |                                   |  |
|  More living.                                                   |  OUT OF                           |  |
|                                                                 |  OFFICE.                          |  |
|  Your next "you had to be there" starts here.                   |                                   |  |
|  Discover live concerts, sports, and festival passes.           |  A LITTLE LOUDER. A LOT MORE ALIVE|  |
|                                                                 |  -------------------------------- |  |
|  Go out. Find your people.                                      |  NOV 21 — 22      JAKARTA, ID ↗   |  |
|                                                                 +-----------------------------------+  |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  | WHAT ARE YOU INTO?               | WHERE              | WHEN              |     [ Find events ↗ ]|  |
|  | Artist, festival, or genre...    | Jakarta, ID ∨      | Any date ∨        |                      |  |
|  +--------------------------------------------------------------------------------------------------+  |
|                                                                                                        |
|  Follow your curiosity                                                                                 |
|  ( All events )  [ Music ]  [ Festivals ]  [ Arts & culture ]  [ Nightlife ]  [ Sports ]  [ Workshops ]|
|                                                                                                        |
|  +---------------------+   +---------------------+   +---------------------+   +---------------------+ |
|  | [16:9 Event Image]  |   | [16:9 Event Image]  |   | [16:9 Event Image]  |   | [16:9 Event Image]  | |
|  | DEC 14 • SENAYAN    |   | JAN 05 • ICE BSD    |   | FEB 12 • BALI       |   | MAR 01 • JOGJA      | |
|  | Soundwave Fest 2026 |   | Neon Horizon Live   |   | Sunset Jazz Session |   | Folk Melody Night   | |
|  | From Rp 450.000     |   | From Rp 750.000     |   | From Rp 350.000     |   | From Rp 200.000     | |
|  +---------------------+   +---------------------+   +---------------------+   +---------------------+ |
+--------------------------------------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **Header Navigation:**
   * Logo: Clean lowercase `gather.` with a solid terracotta dot.
   * Links: `Explore events`, `How it works`, `For organizers`.
   * Auth actions: Clean `Log in` text link + solid Terracotta `Sign up` button.
2. **Hero Editorial Split:**
   * **Left Column:** High-contrast serif or bold grotesque headline (*"Less scrolling. More living."*), small uppercase burnt-coral kicker (*"GOOD TIMES START HERE"*), and descriptive human copy.
   * **Right Column:** High-impact Terracotta Billboard (`#D94520`) with reverse white typography, showcasing the weekend's flagship concert with live date, venue, and starting price.
3. **Segmented Search Dock:**
   * Floating pure-white capsule with 3 integrated segments separated by vertical hairline dividers:
     * Segment 1: Search query ("Artist, event, or a little inspiration").
     * Segment 2: Location selector dropdown ("Jakarta, ID", "Surabaya, ID", "Bali, ID").
     * Segment 3: Date range dropdown ("This weekend", "Next 30 days", "Custom range").
     * CTA: High-contrast Terracotta button with arrow icon (`Find events ↗`).
4. **Curiosity Category Filter Bar:**
   * Horizontal filter pills with smooth snap scrolling.
   * Active pill: Inverted solid dark charcoal (`#171717`) with crisp white text.
   * Inactive pills: Clean white surface with hairline warm border (`#E5E1D6`).
5. **Event Card Grid:**
   * 16:9 real event photography banner with rounded top corners.
   * Date & location badge in clean uppercase metadata font.
   * Bold event title with line-clamp 1.
   * Clean Rupiah pricing format: `Rp 450.000` (no cryptocurrency units).
   * Badge indicator: "Official Face-Value Protected".

---

### Page 2: Event Details & Primary Ticket Purchase (`/events/[id]`)

```
+--------------------------------------------------------------------------------------------------------+
|  ← Back to all events                                                     Official Verified Event 🛡️   |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                                  [ WIDE HERO EVENT BANNER ]                                      |  |
|  +--------------------------------------------------------------------------------------------------+  |
|                                                                                                        |
|  [ LEFT: EVENT SPECIFICATIONS ]                             [ RIGHT: STICKY TICKET CHECKOUT DOCK ]    |
|                                                                                                        |
|  DECEMBER 14, 2026 • 18:00 WIB                              Select Ticket Tier                         |
|  Soundwave Festival 2026                                    ------------------------------------------ |
|  Gelora Bung Karno Stadium, Jakarta                         (o) VIP Access - Front Row   Rp 1.500.000  |
|                                                                 Remaining: 42 tickets left             |
|  About the Event                                            ( ) Festival General Adm.      Rp 750.000  |
|  [Human-written narrative about artists, stages,                Remaining: 180 tickets left            |
|  doors open schedule, venue policies]                       ( ) Tribune Seated             Rp 450.000  |
|                                                                 Remaining: Sold Out                    |
|  Artist Lineup                                                                                         |
|  [ Circular artist portraits with stage timings ]           Anti-Scalping & Security Guarantee         |
|                                                             • Max 2 tickets per identity (NIK).        |
|  Venue Map & Ingress Guide                                  • Resale locked strictly to purchase price.|
|  [ Interactive minimalist SVG seat map ]                    • Gasless checkout (no crypto fees).       |
|                                                                                                        |
|                                                             [ Cloudflare Turnstile Human Check ]       |
|                                                                                                        |
|                                                             [ Checkout with Midtrans (Rp 1.500.000) ]  |
+--------------------------------------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **Dynamic Tier Selector:**
   * Radio card style for ticket categories (VIP, Festival, Tribune).
   * Real-time remaining stock progress bar (e.g., green when plenty, amber when `< 50 left`).
   * Explicit quota lock: max 2 tickets per user wallet to prevent bulk bot hoarding.
2. **Anti-Bot Gate:**
   * Seamless Cloudflare Turnstile widget integrated before the purchase button.
3. **Midtrans Snap Modal Integration:**
   * One-click checkout opens the official Midtrans popup (GoPay, QRIS, Virtual Account, Credit Card).
   * In the background: ZeroDev Account Abstraction creates or links the user's Passkey Smart Account without asking the user for private keys or gas fees.
4. **Trust & Consumer Protection Card:**
   * Clear, comforting badges: *"Guaranteed Authentic"*, *"Strict Face-Value Resale Protection"*, *"Direct QR Venue Entry"*.

---

### Page 3: Secondary Resale Marketplace (`/resale`)

```
+--------------------------------------------------------------------------------------------------------+
|  OFFICIAL SECONDARY RESALE MARKET                                                                      |
|  100% Face Value. 0% Scalper Markup.                                                                   |
|                                                                                                        |
|  Tickets sold by fans who can no longer attend. Smart contracts enforce zero markups:                   |
|  every ticket is locked to its original purchase price. No scalpers, no counterfeit passes.            |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  | Search resale tickets...            | Event Category: All ∨  | Sort: Date Soonest ∨              |  |
|  +--------------------------------------------------------------------------------------------------+  |
|                                                                                                        |
|  +----------------------------------+  +----------------------------------+                            |
|  | Soundwave Festival 2026          |  | Neon Horizon Live                |                            |
|  | VIP Front Row • Gate 3           |  | Festival General Admission       |                            |
|  | Seller: Verified Fan (0x4a...31) |  | Seller: Verified Fan (0x91...2c) |                            |
|  |                                  |  |                                  |                            |
|  | Original Price:   Rp 1.500.000   |  | Original Price:   Rp 750.000     |                            |
|  | Resale Price:     Rp 1.500.000   |  | Resale Price:     Rp 750.000     |                            |
|  | [ PRICE-LOCKED GUARANTEE 🔒 ]    |  | [ PRICE-LOCKED GUARANTEE 🔒 ]    |                            |
|  |                                  |  |                                  |                            |
|  | [ Buy Resale Ticket ↗ ]          |  | [ Buy Resale Ticket ↗ ]          |                            |
|  +----------------------------------+  +----------------------------------+                            |
+--------------------------------------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **Zero-Markup Price Lock Visual Indicator:**
   * Prominent badge showing `Original Price == Resale Price`. The system rejects any price deviation.
2. **Verified Ownership Seal:**
   * Shows that the ticket is locked in escrow by `MarketplaceContract.sol` on Sepolia and ready for atomic transfer.
3. **Instant Buy Flow:**
   * Buyer pays via Midtrans in IDR; smart contract automatically transfers NFT ownership and registers new buyer identity on-chain.

---

### Page 4: Attendee Dashboard & E-Ticket Wallet (`/dashboard/tickets`)

```
+--------------------------------------------------------------------------------------------------------+
|  My Tickets (2 Active)           Transaction History           Security Settings                       |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |  SOUNDWAVE FESTIVAL 2026                           VIP ACCESS • TICKET #1042                     |  |
|  |  Gelora Bung Karno Stadium, Jakarta               Saturday, Dec 14, 2026 • Door: 17:00           |  |
|  |  Attendee: B. L. Edward Stephen                   NIK: 3578************                          |  |
|  |  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  |  |
|  |  ( ) [  DYNAMIC ENTRY QR CODE  ] ( )               SECURITY STATUS                                |  |
|  |      [  Refreshes in 42s       ]                   • Dynamic WebAuthn Rolling Nonce (Active)      |  |
|  |      [  Screenshot Immune      ]                   • Identity On-Chain Hash Verified              |  |
|  |                                                    • Single-Scan Ingress Only                     |  |
|  |                                                                                                   |  |
|  |  [ Show Fullscreen for Scanner ]         [ List on Official Resale ]         [ Download Receipt ] |  |
|  +--------------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **Physical E-Ticket Metaphor:**
   * Perforated cutouts on left and right borders with dashed separation line.
   * Event banner thumbnail on the upper section; dynamic QR code on the lower section.
2. **60-Second Dynamic Anti-Screenshot QR Code:**
   * Rotating cryptographic token signed via client WebAuthn passkey.
   * Circular SVG countdown progress ring counting down from 60 to 0 seconds.
   * Clear notice: *"Screenshots and printouts will be rejected at the venue gate."*
3. **Official Resale Button:**
   * Allows attendee to list the ticket with one click if they cannot attend. Price is automatically fixed to their original purchase price.

---

### Page 5: Venue Gate Scanner Terminal (`/dashboard/verify` or `/gate`)

```
+--------------------------------------------------------------------------------------------------------+
|  GATE TERMINAL #04 — GBK STADIUM                                          Staff: Security Officer Rudi |
|                                                                                                        |
|  STEP 1: SCAN DYNAMIC QR CODE                 STEP 2: VERIFY ATTENDEE KTP (ID CARD)                    |
|  +---------------------------------------+    +-----------------------------------------------------+  |
|  |                                       |    | Enter Attendee 16-Digit NIK:                        |  |
|  |   [ CAMERA VIEWFINDER ]               |    | [ 3578012345678901                ] [ Match ID ↵ ]  |  |
|  |   Point at attendee phone screen      |    |                                                     |  |
|  |                                       |    | Privacy Notice: NIK is hashed in RAM using keccak256|  |
|  +---------------------------------------+    | and immediately discarded. Never stored in DB.      |  |
|                                               +-----------------------------------------------------+  |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |  RESULT: VALID TICKET — ADMIT ONE (ACCESS GRANTED)                                       [PASS]  |  |
|  |  Token ID: #1042 | Category: VIP Front Row | Gate: 3 | Match: NIK Hash Matches Smart Contract     |  |
|  |                                                                                                  |  |
|  |  [ CONFIRM & REDEEM TICKET ON-CHAIN (markUsed) ]                     [ RESET SCANNER ]           |  |
|  +--------------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **High-Speed Dual-Scan Workflow:**
   * **Phase 1 (QR Ingress):** Browser camera (via `html5-qrcode`) decodes dynamic payload, validates rolling timestamp (< 60s window), and fetches ticket details from backend cache.
   * **Phase 2 (Identity Verification):** Rapid KTP 16-digit NIK scanner or manual numeric keypad input. System hashes `keccak256(nik)` in browser RAM and compares with the ticket's registered on-chain identity.
2. **Full-Screen Pass / Fail Feedback:**
   * **Green Screen (`#246E48`):** Valid ticket, correct NIK, access granted.
   * **Red Screen (`#B82C2C`):** Invalid QR, expired timestamp, ticket already redeemed, or NIK hash mismatch.
3. **One-Tap On-Chain Redemption (`markUsed`):**
   * Calls smart contract relayer to record token redemption permanently on Ethereum Sepolia.

---

### Page 6: Organizer Management Portal (`/dashboard/admin`)

#### Key Features & Visual Elements:
1. **Event Creation Wizard (`/dashboard/admin/events/new`):**
   * Step-by-step form: Event Name, Venue, Date & Door Time, High-Resolution Banner Image upload, Category quotas and Rupiah pricing.
   * Smart contract deployment trigger: creates event category on Sepolia Testnet.
2. **Real-Time Attendance & Gate Monitor:**
   * Live metrics: Total Tickets Sold, Total Revenue (IDR), Real-Time Gate Ingress Count (Scanned vs Remaining), Secondary Market Activity.

---

### Page 7: Authentication & Passkey Onboarding (`/login` & `/signup`)

```
+------------------------------------------------------------------------+
|                                [gather.]                               |
|                                                                        |
|                       Welcome to genuine ticketing.                    |
|             Log in or create your account using email or passkey.      |
|                                                                        |
|     +------------------------------------------------------------+     |
|     | Email address: [ name@example.com                        ] |     |
|     | Password:      [ ••••••••••••••••                        ] |     |
|     | 16-Digit NIK:  [ 3578012345678901                        ] |     |
|     | (Required for venue ticket matching under UU PDP No. 27)   |     |
|     |                                                            |     |
|     | [ Create Account & Register Biometric Passkey ]            |     |
|     +------------------------------------------------------------+     |
|                                                                        |
|     --- OR CONNECT DIRECTLY ---                                        |
|     [ 🔑 Sign in with Passkey (FaceID / Fingerprint) ]                 |
+------------------------------------------------------------------------+
```

#### Key Features & Visual Elements:
1. **Passwordless Biometric Priority:**
   * Primary option to authenticate with WebAuthn Passkeys (FaceID, TouchID, Windows Hello).
2. **Privacy-Preserving KYC Input:**
   * Clear contextual hint explaining why the 16-digit Indonesian NIK is needed.
   * Explicit reassurance: *"Your NIK is converted to an irreversible cryptographic hash before blockchain storage. Your raw identity number is never exposed."*

---

## 4. Implementation Prompt for AI Coding Agents

When passing this specification to Cursor, Claude, v0, or another AI code generator, use the following prompt header:

```markdown
You are an expert design-technologist building the frontend for an event ticketing marketplace.
Strictly adhere to the design specification in `design/DESIGN_PROMPT_SPECIFICATION.md`:

1. Aesthetics: Warm editorial style inspired by "Gather". Canvas is warm linen (#F7F5EE), cards are crisp white (#FFFFFF) with hairline warm borders, accents are warm terracotta (#D94520). Typography is Plus Jakarta Sans.
2. Anti-AI Slop: Strictly ban purple/neon gradients, glassmorphism blobs, generic 3-card icon grids, and robotic marketing copy. Do not expose raw Web3 jargon (use "Digital Pass", "Verified Ticket", "Price-Locked Resale").
3. Components: Implement the Segmented Search Capsule Dock, the Terracotta Billboard Card, the Perforated E-Ticket with rolling dynamic QR code, and the Venue Dual-Scan Gate Terminal.
4. Stack: Next.js 14+ (App Router), Tailwind CSS, Lucide React icons, Plus Jakarta Sans font.
```

