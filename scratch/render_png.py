import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# 1. Update SVG & HTML
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1480 1050" width="1480" height="1050" style="background:#ffffff; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <!-- Shadow Filter -->
    <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <filter id="tier-shadow" x="-2%" y="-2%" width="104%" height="106%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.04"/>
    </filter>

    <!-- Gradients -->
    <linearGradient id="header-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>

    <linearGradient id="client-banner" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>

    <linearGradient id="backend-banner" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>

    <linearGradient id="data-banner" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>

    <!-- Arrow Markers -->
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb"/>
    </marker>
    <marker id="arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5"/>
    </marker>
    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669"/>
    </marker>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706"/>
    </marker>
    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0891b2"/>
    </marker>
    <marker id="arrow-slate" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
    </marker>
  </defs>

  <!-- HEADER -->
  <rect x="40" y="24" width="1400" height="60" rx="8" fill="url(#header-grad)"/>
  <text x="70" y="52" fill="#ffffff" font-size="19" font-weight="700" letter-spacing="0.5">ARSITEKTUR SISTEM JUAL BELI TIKET EVENT BERBASIS NFT (HYBRID WEB2.5)</text>
  <text x="70" y="71" fill="#94a3b8" font-size="12" font-weight="500">Tugas Akhir: Benedictus Leonardo Edward Stephen Sugianto (160423176) — Universitas Surabaya</text>
  <rect x="1260" y="40" width="155" height="28" rx="14" fill="#334155"/>
  <text x="1337" y="58" fill="#38bdf8" font-size="11" font-weight="600" text-anchor="middle">Sepolia &amp; ERC-4337</text>

  <!-- ========================================== -->
  <!-- TIER 1: CLIENT TIER (FRONTEND - NEXT.JS) -->
  <!-- ========================================== -->
  <rect x="40" y="104" width="1400" height="210" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#tier-shadow)"/>
  <path d="M 40 114 Q 40 104 50 104 L 1430 104 Q 1440 104 1440 114 L 1440 138 L 40 138 Z" fill="url(#client-banner)"/>
  <text x="60" y="127" fill="#ffffff" font-size="13" font-weight="700" letter-spacing="0.5">TIER 1: PRESENTATION LAYER (CLIENT - NEXT.JS WEB APPLICATION)</text>

  <!-- User Card -->
  <g filter="url(#card-shadow)">
    <rect x="60" y="152" width="200" height="142" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
    <rect x="60" y="152" width="200" height="30" rx="8" fill="#eff6ff"/>
    <text x="160" y="172" fill="#1e40af" font-size="12" font-weight="700" text-anchor="middle">Pengguna (Aktor)</text>
    <circle cx="160" cy="205" r="16" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="160" y="210" fill="#1d4ed8" font-size="13" font-weight="700" text-anchor="middle">👤</text>
    <text x="160" y="240" fill="#1e293b" font-size="11" font-weight="600" text-anchor="middle">• Pembeli Tiket (Buyer)</text>
    <text x="160" y="258" fill="#1e293b" font-size="11" font-weight="600" text-anchor="middle">• Penyelenggara (Organizer)</text>
    <text x="160" y="276" fill="#64748b" font-size="10" text-anchor="middle">• Petugas Venue (Scanner)</text>
  </g>

  <!-- Next.js Pages & UI Modules -->
  <g filter="url(#card-shadow)">
    <rect x="280" y="152" width="370" height="142" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
    <rect x="280" y="152" width="370" height="30" rx="8" fill="#eff6ff"/>
    <text x="295" y="172" fill="#1e40af" font-size="12" font-weight="700">Next.js Web Client UI (App Router)</text>
    <rect x="580" y="158" width="60" height="18" rx="4" fill="#dbeafe"/>
    <text x="610" y="171" fill="#1d4ed8" font-size="9" font-weight="700" text-anchor="middle">React/TS</text>

    <text x="295" y="202" fill="#334155" font-size="11" font-weight="600">🏢 Katalog Event &amp; Pilihan Kategori Tiket</text>
    <text x="295" y="222" fill="#334155" font-size="11" font-weight="600">🎟️ Dashboard "Tiket Saya" (QR E-Ticket View)</text>
    <text x="295" y="242" fill="#334155" font-size="11" font-weight="600">🔄 Halaman Listing &amp; Beli Resale Resmi</text>
    <text x="295" y="262" fill="#334155" font-size="11" font-weight="600">🔐 Registrasi &amp; Autentikasi Pengguna</text>
    <text x="295" y="280" fill="#64748b" font-size="10">Koneksi Web3 via Viem / Wagmi Client SDK</text>
  </g>

  <!-- Security & WebAuthn / Turnstile Module -->
  <g filter="url(#card-shadow)">
    <rect x="670" y="152" width="360" height="142" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
    <rect x="670" y="152" width="360" height="30" rx="8" fill="#eff6ff"/>
    <text x="685" y="172" fill="#1e40af" font-size="12" font-weight="700">Client Security &amp; Auth Handlers</text>
    <rect x="965" y="158" width="55" height="18" rx="4" fill="#fee2e2"/>
    <text x="992" y="171" fill="#b91c1c" font-size="9" font-weight="700" text-anchor="middle">Security</text>

    <text x="685" y="202" fill="#0f172a" font-size="11" font-weight="600">🔑 Passkey (WebAuthn / FIDO2)</text>
    <text x="703" y="217" fill="#64748b" font-size="10">Biometrik Kurva P-256 (Secure Enclave / TPM)</text>
    <text x="685" y="237" fill="#0f172a" font-size="11" font-weight="600">🛡️ Cloudflare Turnstile Widget</text>
    <text x="703" y="252" fill="#64748b" font-size="10">Verifikasi Tantangan Anti-Bot pada Form Checkout</text>
    <text x="685" y="272" fill="#0f172a" font-size="11" font-weight="600">🗝️ BIP-39 Seed Phrase (Client-Side Recovery)</text>
    <text x="703" y="285" fill="#64748b" font-size="10">Pembangkitan backup signer kurva secp256k1</text>
  </g>

  <!-- Midtrans Snap Popup Module -->
  <g filter="url(#card-shadow)">
    <rect x="1050" y="152" width="370" height="142" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5"/>
    <rect x="1050" y="152" width="370" height="30" rx="8" fill="#eff6ff"/>
    <text x="1065" y="172" fill="#1e40af" font-size="12" font-weight="700">Payment &amp; Gateway Integrations</text>
    <rect x="1350" y="158" width="60" height="18" rx="4" fill="#fef3c7"/>
    <text x="1380" y="171" fill="#b45309" font-size="9" font-weight="700" text-anchor="middle">Sandbox</text>

    <text x="1065" y="202" fill="#0f172a" font-size="11" font-weight="600">💳 Midtrans Snap SDK (Popup Modal)</text>
    <text x="1083" y="217" fill="#64748b" font-size="10">Simulasi Pembayaran Fiat Rupiah (QRIS, VA)</text>
    <text x="1065" y="237" fill="#0f172a" font-size="11" font-weight="600">⚡ Gasless User Experience</text>
    <text x="1083" y="252" fill="#64748b" font-size="10">Biaya gas ditanggung sistem via ERC-4337 Paymaster</text>
    <text x="1065" y="272" fill="#0f172a" font-size="11" font-weight="600">📱 Venue QR Scanner Interface</text>
    <text x="1083" y="285" fill="#64748b" font-size="10">Antarmuka pemindaian tiket &amp; input KTP petugas</text>
  </g>

  <!-- ========================================== -->
  <!-- TIER 2: APPLICATION TIER (BACKEND - NESTJS) -->
  <!-- ========================================== -->
  <rect x="40" y="374" width="1400" height="250" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#tier-shadow)"/>
  <path d="M 40 384 Q 40 374 50 374 L 1430 374 Q 1440 374 1440 384 L 1440 408 L 40 408 Z" fill="url(#backend-banner)"/>
  <text x="60" y="397" fill="#ffffff" font-size="13" font-weight="700" letter-spacing="0.5">TIER 2: APPLICATION LAYER (BACKEND - NESTJS MODULAR REST API)</text>

  <!-- Controller & Gateway -->
  <g filter="url(#card-shadow)">
    <rect x="60" y="422" width="310" height="182" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
    <rect x="60" y="422" width="310" height="30" rx="8" fill="#eef2ff"/>
    <text x="75" y="442" fill="#3730a3" font-size="12" font-weight="700">REST API Controllers &amp; Gateway</text>
    <rect x="300" y="428" width="60" height="18" rx="4" fill="#e0e7ff"/>
    <text x="330" y="441" fill="#4338ca" font-size="9" font-weight="700" text-anchor="middle">Entrypoint</text>

    <text x="75" y="472" fill="#334155" font-size="11" font-weight="600">🌐 HTTP Endpoints (/api/v1/*)</text>
    <text x="93" y="488" fill="#64748b" font-size="10">AuthController, EventController, OrderController</text>
    <text x="75" y="510" fill="#334155" font-size="11" font-weight="600">📋 DTO &amp; Input Validation</text>
    <text x="93" y="526" fill="#64748b" font-size="10">Pemeriksaan payload dengan class-validator</text>
    <text x="75" y="548" fill="#334155" font-size="11" font-weight="600">🛡️ Auth Guard &amp; Role-Based Access</text>
    <text x="93" y="564" fill="#64748b" font-size="10">Verifikasi JWT &amp; hak akses (Admin/Organizer/Buyer)</text>
    <text x="75" y="586" fill="#64748b" font-size="10">Swagger / OpenAPI Dokumentasi</text>
  </g>

  <!-- Core Business Services -->
  <g filter="url(#card-shadow)">
    <rect x="390" y="422" width="330" height="182" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
    <rect x="390" y="422" width="330" height="30" rx="8" fill="#eef2ff"/>
    <text x="405" y="442" fill="#3730a3" font-size="12" font-weight="700">Core Logic Services</text>
    <rect x="650" y="428" width="60" height="18" rx="4" fill="#e0e7ff"/>
    <text x="680" y="441" fill="#4338ca" font-size="9" font-weight="700" text-anchor="middle">Services</text>

    <text x="405" y="472" fill="#334155" font-size="11" font-weight="600">🔐 Passkey &amp; Auth Service</text>
    <text x="423" y="488" fill="#64748b" font-size="10">Verifikasi WebAuthn, hitung smart account address</text>
    <text x="405" y="510" fill="#334155" font-size="11" font-weight="600">🆔 KYC &amp; NIK One-Way Hasher</text>
    <text x="423" y="526" fill="#64748b" font-size="10">Hash satu arah SHA-256/Keccak256 untuk on-chain</text>
    <text x="405" y="548" fill="#334155" font-size="11" font-weight="600">🤖 Turnstile Server Verifier</text>
    <text x="423" y="564" fill="#64748b" font-size="10">Validasi token Turnstile ke siteverify Cloudflare</text>
    <text x="405" y="586" fill="#334155" font-size="11" font-weight="600">🎟️ Event &amp; Category Stock Service</text>
  </g>

  <!-- Payment & Webhook Services -->
  <g filter="url(#card-shadow)">
    <rect x="740" y="422" width="330" height="182" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
    <rect x="740" y="422" width="330" height="30" rx="8" fill="#eef2ff"/>
    <text x="755" y="442" fill="#3730a3" font-size="12" font-weight="700">Payment &amp; EIP-712 Services</text>
    <rect x="1000" y="428" width="60" height="18" rx="4" fill="#e0e7ff"/>
    <text x="1030" y="441" fill="#4338ca" font-size="9" font-weight="700" text-anchor="middle">Payment</text>

    <text x="755" y="472" fill="#334155" font-size="11" font-weight="600">🔔 Midtrans Webhook Handler</text>
    <text x="773" y="488" fill="#64748b" font-size="10">Penanganan notifikasi status pembayaran settlement</text>
    <text x="755" y="510" fill="#334155" font-size="11" font-weight="600">🛡️ Idempotent Processing</text>
    <text x="773" y="526" fill="#64748b" font-size="10">Mencegah double-minting saat webhook terkirim ulang</text>
    <text x="755" y="548" fill="#334155" font-size="11" font-weight="600">✍️ EIP-712 Signature Generator</text>
    <text x="773" y="564" fill="#64748b" font-size="10">Menandatangani digest izin minting via systemSigner</text>
    <text x="755" y="586" fill="#334155" font-size="11" font-weight="600">💰 Resale Fee Settlement Logic</text>
  </g>

  <!-- Web3 Relay & IPFS Pinning Services -->
  <g filter="url(#card-shadow)">
    <rect x="1090" y="422" width="330" height="182" rx="8" fill="#ffffff" stroke="#c7d2fe" stroke-width="1.5"/>
    <rect x="1090" y="422" width="330" height="30" rx="8" fill="#eef2ff"/>
    <text x="1105" y="442" fill="#3730a3" font-size="12" font-weight="700">Relay, IPFS &amp; Data Access</text>
    <rect x="1350" y="428" width="60" height="18" rx="4" fill="#e0e7ff"/>
    <text x="1380" y="441" fill="#4338ca" font-size="9" font-weight="700" text-anchor="middle">Integration</text>

    <text x="1105" y="472" fill="#334155" font-size="11" font-weight="600">📦 Pinata IPFS Uploader Service</text>
    <text x="1123" y="488" fill="#64748b" font-size="10">Upload artwork tiket &amp; metadata deskriptif JSON</text>
    <text x="1105" y="510" fill="#334155" font-size="11" font-weight="600">⚡ ZeroDev SDK / ERC-4337 Relay</text>
    <text x="1123" y="526" fill="#64748b" font-size="10">Meneruskan UserOperation ke Paymaster &amp; Bundler</text>
    <text x="1105" y="548" fill="#334155" font-size="11" font-weight="600">🗄️ TypeORM Data Access Layer</text>
    <text x="1123" y="564" fill="#64748b" font-size="10">Manajemen entitas &amp; query ke MySQL Database</text>
    <text x="1105" y="586" fill="#334155" font-size="11" font-weight="600">🔄 Event Listener / Blockchain Poller</text>
  </g>

  <!-- ========================================== -->
  <!-- TIER 3: DATA & DECENTRALIZED LAYER -->
  <!-- ========================================== -->
  <rect x="40" y="680" width="1400" height="325" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#tier-shadow)"/>
  <path d="M 40 690 Q 40 680 50 680 L 1430 680 Q 1440 680 1440 690 L 1440 714 L 40 714 Z" fill="url(#data-banner)"/>
  <text x="60" y="703" fill="#ffffff" font-size="13" font-weight="700" letter-spacing="0.5">TIER 3: PERSISTENCE &amp; DECENTRALIZED INFRASTRUCTURE LAYER</text>

  <!-- Database MySQL (Off-Chain) -->
  <g filter="url(#card-shadow)">
    <rect x="60" y="728" width="370" height="258" rx="8" fill="#ffffff" stroke="#fcd34d" stroke-width="1.5"/>
    <rect x="60" y="728" width="370" height="30" rx="8" fill="#fef3c7"/>
    <text x="75" y="748" fill="#92400e" font-size="12" font-weight="700">1. MySQL Relational Database (Off-Chain)</text>
    <rect x="350" y="734" width="70" height="18" rx="4" fill="#fde68a"/>
    <text x="385" y="747" fill="#78350f" font-size="9" font-weight="700" text-anchor="middle">RDBMS</text>

    <text x="75" y="780" fill="#1e293b" font-size="11" font-weight="600">👥 users, organizers, admins</text>
    <text x="93" y="795" fill="#64748b" font-size="10">Profil, email, hash password, status akun</text>
    <text x="75" y="819" fill="#1e293b" font-size="11" font-weight="600">🪪 kyc_records &amp; passkey_credentials</text>
    <text x="93" y="834" fill="#64748b" font-size="10">Foto KTP fisik, status verifikasi, public key passkey</text>
    <text x="75" y="858" fill="#1e293b" font-size="11" font-weight="600">🎪 events &amp; ticket_categories</text>
    <text x="93" y="873" fill="#64748b" font-size="10">Deskripsi lengkap, kuota stok, tanggal/jam, venue</text>
    <text x="75" y="897" fill="#1e293b" font-size="11" font-weight="600">🧾 orders &amp; resale_listings</text>
    <text x="93" y="912" fill="#64748b" font-size="10">Invoice Midtrans, snap token, riwayat pembelian</text>
    <text x="75" y="936" fill="#1e293b" font-size="11" font-weight="600">🔔 notifications &amp; ticket_cache</text>
    <text x="93" y="951" fill="#64748b" font-size="10">Log notifikasi dan cache data tiket untuk performa</text>
    <text x="75" y="972" fill="#b45309" font-size="9.5" font-weight="600">• Koneksi via TypeORM Connection Pool</text>
  </g>

  <!-- Decentralized Storage (IPFS Pinata) -->
  <g filter="url(#card-shadow)">
    <rect x="450" y="728" width="330" height="258" rx="8" fill="#ffffff" stroke="#6ee7b7" stroke-width="1.5"/>
    <rect x="450" y="728" width="330" height="30" rx="8" fill="#ecfdf5"/>
    <text x="465" y="748" fill="#065f46" font-size="12" font-weight="700">2. IPFS via Pinata (Decentralized Storage)</text>
    <rect x="710" y="734" width="60" height="18" rx="4" fill="#a7f3d0"/>
    <text x="740" y="747" fill="#047857" font-size="9" font-weight="700" text-anchor="middle">IPFS</text>

    <text x="465" y="780" fill="#1e293b" font-size="11" font-weight="600">🖼️ Ticket Artwork / Image</text>
    <text x="483" y="796" fill="#64748b" font-size="10">Berkas gambar grafis tiket (PNG/JPG) di-pin permanen</text>
    <text x="465" y="822" fill="#1e293b" font-size="11" font-weight="600">📄 Ticket Metadata JSON</text>
    <text x="483" y="838" fill="#64748b" font-size="10">Nama event, venue, jadwal, deskripsi, atribut tiket</text>
    <text x="465" y="864" fill="#1e293b" font-size="11" font-weight="600">🔗 Standar tokenURI (ERC-721)</text>
    <text x="483" y="880" fill="#64748b" font-size="10">URI IPFS terdesentralisasi tidak bisa diubah pihak luar</text>
    <text x="465" y="906" fill="#1e293b" font-size="11" font-weight="600">🛡️ Pinata Pinning Guarantee</text>
    <text x="483" y="922" fill="#64748b" font-size="10">Menjamin file tetap tersedia di jaringan IPFS global</text>
    <text x="465" y="952" fill="#047857" font-size="11" font-weight="700">CID: ipfs://Qm... (Content Identifier)</text>
  </g>

  <!-- Sepolia Testnet Blockchain -->
  <g filter="url(#card-shadow)">
    <rect x="800" y="728" width="620" height="258" rx="8" fill="#ffffff" stroke="#67e8f9" stroke-width="1.5"/>
    <rect x="800" y="728" width="620" height="30" rx="8" fill="#ecfeff"/>
    <text x="815" y="748" fill="#0e7490" font-size="12" font-weight="700">3. Ethereum Sepolia Testnet (On-Chain Infrastructure)</text>
    <rect x="1330" y="734" width="80" height="18" rx="4" fill="#a5f3fc"/>
    <text x="1370" y="747" fill="#0891b2" font-size="9" font-weight="700" text-anchor="middle">Blockchain</text>

    <!-- Paymaster Sub-Box -->
    <rect x="815" y="768" width="590" height="44" rx="6" fill="#f0fdfa" stroke="#99f6e4" stroke-width="1"/>
    <text x="830" y="786" fill="#115e59" font-size="11" font-weight="700">⚡ ERC-4337 Account Abstraction (Paymaster &amp; Bundler Service)</text>
    <text x="830" y="802" fill="#0f766e" font-size="10">Mensponsori gas fee transaksi minting/resale secara penuh sehingga pengguna bebas gas (Gasless UX)</text>

    <!-- TicketContract.sol -->
    <rect x="815" y="822" width="285" height="152" rx="6" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="825" y="842" fill="#0369a1" font-size="11" font-weight="700">📜 TicketContract.sol (ERC-721)</text>
    <text x="825" y="862" fill="#334155" font-size="10" font-weight="600">• originalPrice Locked</text>
    <text x="835" y="876" fill="#64748b" font-size="9.5">Harga awal permanen di struct TicketInfo</text>
    <text x="825" y="894" fill="#334155" font-size="10" font-weight="600">• userIdentities (NIK Hash)</text>
    <text x="835" y="908" fill="#64748b" font-size="9.5">mapping(address => bytes32) hash NIK KTP</text>
    <text x="825" y="926" fill="#334155" font-size="10" font-weight="600">• Allowlist Transfer Hook</text>
    <text x="835" y="940" fill="#64748b" font-size="9.5">Blokir transfer P2P liar; hanya via marketplace</text>
    <text x="825" y="958" fill="#0284c7" font-size="10" font-weight="600">• markUsed() Venue Validation</text>

    <!-- MarketplaceContract.sol -->
    <rect x="1115" y="822" width="290" height="152" rx="6" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="1125" y="842" fill="#0369a1" font-size="11" font-weight="700">🏪 MarketplaceContract.sol</text>
    <text x="1125" y="862" fill="#334155" font-size="10" font-weight="600">• Resale Price-Lock (Anti-Scalping)</text>
    <text x="1135" y="876" fill="#64748b" font-size="9.5">Harga resale = TicketContract.originalPrice</text>
    <text x="1125" y="894" fill="#334155" font-size="10" font-weight="600">• Zero-Profit Secondary Market</text>
    <text x="1135" y="908" fill="#64748b" font-size="9.5">Mematikan insentif calo &amp; spekulan tiket</text>
    <text x="1125" y="926" fill="#334155" font-size="10" font-weight="600">• Sah via Jalur Allowlist</text>
    <text x="1135" y="940" fill="#64748b" font-size="9.5">Memindahkan NFT dari seller ke buyer baru</text>
    <text x="1125" y="958" fill="#0284c7" font-size="10" font-weight="600">• Admin Fee Distribution</text>
  </g>

  <!-- ========================================== -->
  <!-- CONNECTING LINES & INTERACTION BADGES -->
  <!-- ========================================== -->

  <!-- Line 1: User to Next.js -->
  <path d="M 260 220 L 280 220" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-blue)"/>

  <!-- Line 2: Next.js to NestJS (REST API) -->
  <path d="M 450 294 L 450 335 L 210 335 L 210 422" fill="none" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-blue)"/>
  <rect x="250" y="323" width="170" height="24" rx="12" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
  <text x="335" y="339" fill="#1d4ed8" font-size="10" font-weight="700" text-anchor="middle">HTTPS / REST API (JSON)</text>

  <!-- Line 3: Turnstile Client to Turnstile Verifier -->
  <path d="M 850 294 L 850 335 L 560 335 L 560 422" fill="none" stroke="#64748b" stroke-width="1.8" stroke-dasharray="4,4" marker-end="url(#arrow-slate)"/>
  <rect x="635" y="323" width="150" height="24" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <text x="710" y="339" fill="#475569" font-size="10" font-weight="600" text-anchor="middle">Turnstile Token (Anti-Bot)</text>

  <!-- Line 4: Midtrans Snap to Midtrans Webhook (Async) -->
  <path d="M 1220 294 L 1220 335 L 890 335 L 890 422" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-amber)"/>
  <rect x="980" y="323" width="180" height="24" rx="12" fill="#ffffff" stroke="#fcd34d" stroke-width="1"/>
  <text x="1070" y="339" fill="#b45309" font-size="10" font-weight="700" text-anchor="middle">Midtrans Webhook (HTTP POST)</text>

  <!-- Line 5: NestJS to MySQL -->
  <path d="M 215 604 L 215 645 L 225 645 L 225 728" fill="none" stroke="#d97706" stroke-width="2" marker-end="url(#arrow-amber)"/>
  <rect x="140" y="633" width="150" height="24" rx="12" fill="#ffffff" stroke="#fcd34d" stroke-width="1"/>
  <text x="215" y="649" fill="#b45309" font-size="10" font-weight="700" text-anchor="middle">TypeORM SQL Queries</text>

  <!-- Line 6: NestJS to Pinata IPFS -->
  <path d="M 1150 604 L 1150 645 L 615 645 L 615 728" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow-emerald)"/>
  <rect x="780" y="633" width="180" height="24" rx="12" fill="#ffffff" stroke="#6ee7b7" stroke-width="1"/>
  <text x="870" y="649" fill="#047857" font-size="10" font-weight="700" text-anchor="middle">Pinata IPFS Upload (Multipart)</text>

  <!-- Line 7: NestJS to ERC-4337 Paymaster / Sepolia -->
  <path d="M 1320 604 L 1320 645 L 1110 645 L 1110 768" fill="none" stroke="#0891b2" stroke-width="2" marker-end="url(#arrow-cyan)"/>
  <rect x="1140" y="633" width="170" height="24" rx="12" fill="#ffffff" stroke="#67e8f9" stroke-width="1"/>
  <text x="1225" y="649" fill="#0891b2" font-size="10" font-weight="700" text-anchor="middle">UserOp RPC (Relay Gasless)</text>

  <!-- Line 8: Internal Contract Call (Marketplace to TicketContract) -->
  <path d="M 1115 885 L 1100 885" fill="none" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow-cyan)"/>

</svg>
"""

with open("d:/STEVE/Project NFT Marketplace/design/arsitektur-sistem.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arsitektur Sistem NFT Ticketing</title>
    <style>
        body {{
            margin: 0;
            padding: 10px;
            background-color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }}
        #diagram-card {{
            background: #ffffff;
            width: 1480px;
            height: 1050px;
        }}
    </style>
</head>
<body>
    <div id="diagram-card">
        {svg_content}
    </div>
</body>
</html>
"""

with open("d:/STEVE/Project NFT Marketplace/design/arsitektur-sistem.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Updated SVG & HTML successfully.")

# 2. Render exact element screenshot using Selenium
options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1600,1200")
options.add_argument("--hide-scrollbars")

driver = webdriver.Chrome(options=options)
html_path = os.path.abspath("d:/STEVE/Project NFT Marketplace/design/arsitektur-sistem.html")
driver.get(f"file:///{html_path}")

diagram_elem = driver.find_element(By.ID, "diagram-card")
target_png = "d:/STEVE/Project NFT Marketplace/design/arsitektur-sistem.png"
diagram_elem.screenshot(target_png)
driver.quit()

print(f"Rendered perfect PNG: {target_png} ({os.path.getsize(target_png)} bytes)")
