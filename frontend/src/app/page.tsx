"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  QrCode,
  Sparkles,
  ChevronDown,
  Ticket,
  ArrowRight,
  Music,
  Compass,
  Smile,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface EventCardItem {
  id: string | number;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  price: string;
  image: string;
  badge?: string;
}

const FEATURED_EVENTS: EventCardItem[] = [
  {
    id: 1,
    title: "UBAYA Music Fest 2026",
    category: "Festivals",
    date: "DEC 25, 2026",
    time: "18:00 WIB",
    venue: "Kampus II Tenggilis UBAYA",
    city: "Surabaya",
    price: "Rp 75.000",
    image:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
    badge: "Official Campus Fest",
  },
  {
    id: 2,
    title: "Rock in Indonesia 2026",
    category: "Music",
    date: "DEC 10, 2026",
    time: "19:00 WIB",
    venue: "Gelora Bung Karno",
    city: "Jakarta",
    price: "Rp 120.000",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    badge: "Stadium Live",
  },
  {
    id: 3,
    title: "Art & Tech Expo 2026",
    category: "Arts & culture",
    date: "DEC 15, 2026",
    time: "10:00 WIB",
    venue: "Museum Nasional",
    city: "Jakarta",
    price: "Rp 50.000",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "UBAYA Symphony Gala 2026",
    category: "Music",
    date: "NOV 20, 2026",
    time: "19:00 WIB",
    venue: "Grand City Hall",
    city: "Surabaya",
    price: "Rp 80.000",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    badge: "Orchestra Special",
  },
  {
    id: 5,
    title: "Konser Teletubbies 2026",
    category: "Music",
    date: "DEC 30, 2026",
    time: "18:00 WIB",
    venue: "Alun-alun Surabaya",
    city: "Surabaya",
    price: "Rp 75.000",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  },
];

const CATEGORIES = [
  "All events",
  "Music",
  "Festivals",
  "Arts & culture",
  "Workshops",
  "Food & drink",
  "Nightlife",
];

const FAQS = [
  {
    q: "How does the dynamic QR ticket work?",
    a: "Your ticket barcode regenerates securely every 60 seconds directly inside your browser. Because the cryptographic signature is continuously refreshed, static screenshots and forwarded images are instantly rejected by the venue gate scanner.",
  },
  {
    q: "Can I resell my ticket if I can no longer attend?",
    a: "Yes! You can list your ticket on our Resale marketplace with a single click. Our smart contract guarantees a 100% price ceiling—meaning nobody can ever markup the ticket for unfair profit.",
  },
  {
    q: "Do I need a cryptocurrency wallet or crypto tokens?",
    a: "No crypto required. You pay in Indonesian Rupiah (IDR) using QRIS, GoPay, or Bank Virtual Accounts via Midtrans. Your secure WebAuthn smart wallet is created automatically using your device's fingerprint or Face ID.",
  },
  {
    q: "How is my personal identity (NIK) protected?",
    a: "We comply strictly with Indonesia's Personal Data Protection Law (UU No. 27/2022). Your 16-digit NIK is never stored in plaintext on public ledgers; it is hashed cryptographically for 1-to-1 venue gate verification only.",
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All events");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredEvents = FEATURED_EVENTS.filter((evt) => {
    const matchCategory =
      selectedCategory === "All events" || evt.category === selectedCategory;
    const matchSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#171717] selection:bg-[#D94520] selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.08] bg-[#F7F5EE]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1 group transition">
              <span className="font-extrabold text-2xl tracking-tight text-[#171717]">
                nftix<span className="text-[#D94520]">.</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/dashboard/buy"
                className="px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 transition"
              >
                Explore events
              </Link>
              <Link
                href="/dashboard/tickets"
                className="px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 transition"
              >
                My tickets
              </Link>
              <Link
                href="/dashboard/orders"
                className="px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 transition"
              >
                Orders
              </Link>
              <Link
                href="/dashboard/resale"
                className="px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 transition"
              >
                Resale
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#D94520] px-3 py-2 transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <span>Get started</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-16 sm:space-y-24">
        {/* 2. Hero Section: Split with Terracotta Billboard Poster */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Espresso Headlines & Segmented Capsule Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBECE7] border border-[#D94520]/20 text-[#D94520] text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D94520]" />
              <span>Authentic Events • Fair Price</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#171717] leading-[1.08]">
                Less scrolling. <br />
                <span className="text-[#D94520]">More living.</span>
              </h1>
              <p className="text-[#736E65] text-base sm:text-lg max-w-xl leading-relaxed pt-2">
                Curated events, intimate concerts, and cultural moments. No inflated resale, no bots, just honest tickets for real people.
              </p>
            </div>

            {/* Segmented Search Capsule Dock */}
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-black/[0.08] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3">
              <div className="flex-1 px-3 py-2">
                <span className="block text-[11px] font-bold text-[#736E65] uppercase tracking-wider">
                  What are you into?
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Concerts, art, workshops..."
                  className="w-full bg-transparent text-sm font-semibold text-[#171717] placeholder:text-[#736E65]/60 focus:outline-none"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-black/[0.08]" />

              <div className="flex-1 px-3 py-2">
                <span className="block text-[11px] font-bold text-[#736E65] uppercase tracking-wider">
                  Where
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#171717]">
                  <MapPin className="w-3.5 h-3.5 text-[#D94520]" />
                  <span>Jakarta, Bandung, Bali</span>
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-black/[0.08]" />

              <div className="flex-1 px-3 py-2">
                <span className="block text-[11px] font-bold text-[#736E65] uppercase tracking-wider">
                  When
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#171717]">
                  <Calendar className="w-3.5 h-3.5 text-[#D94520]" />
                  <span>This weekend</span>
                </div>
              </div>

              <Link
                href="/dashboard/buy"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-sm font-semibold shadow-xs transition shrink-0 cursor-pointer"
              >
                <span>Find events</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Terracotta Billboard "OUT OF OFFICE" (Matching Page 1 PDF) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden bg-[#D94520] text-white p-6 sm:p-8 aspect-[4/5] flex flex-col justify-between shadow-xl">
              {/* Subtle architectural noise / overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                  Featured Showcase
                </span>
                <span className="text-xs font-mono font-bold tracking-widest text-white/90">
                  VOL. 08 • 2026
                </span>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-white/80">
                    A creative conference for makers
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none">
                    OUT OF <br /> OFFICE
                  </h2>
                </div>

                <div className="pt-4 border-t border-white/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/90 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      NOV 14–16, 2026
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      GBK Senayan, Jakarta
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-[10px] text-white/70 block uppercase font-medium">
                        Standard Pass
                      </span>
                      <span className="text-lg font-extrabold text-white">
                        Rp 450.000
                      </span>
                    </div>

                    <Link
                      href="/dashboard/buy?eventId=1"
                      className="px-4 py-2 rounded-xl bg-white text-[#D94520] hover:bg-stone-100 text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Reserve Spot ↗
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Category Filter Pills ("Follow your curiosity.") */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">
                Follow your curiosity.
              </h2>
              <p className="text-xs sm:text-sm text-[#736E65]">
                Browse curated happenings by vibe and category
              </p>
            </div>
            <Link
              href="/dashboard/buy"
              className="text-xs font-bold text-[#D94520] hover:underline inline-flex items-center gap-1"
            >
              <span>View full catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    active
                      ? "bg-[#D94520] text-white border-[#D94520] shadow-xs"
                      : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. "Worth going out for." Event Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              Worth going out for.
            </h2>
            <span className="text-xs text-[#736E65]">
              Showing {filteredEvents.length} curated events
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="group rounded-2xl bg-white border border-black/[0.08] overflow-hidden hover:shadow-md hover:border-black/15 transition-all flex flex-col justify-between"
              >
                {/* 16:9 Image Poster */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {evt.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#171717] border border-black/10 shadow-xs">
                      {evt.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-black/60 backdrop-blur-md text-white">
                    {evt.category}
                  </span>
                </div>

                {/* Event Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D94520]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#171717] group-hover:text-[#D94520] transition-colors line-clamp-1">
                      {evt.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#736E65]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{evt.venue}, {evt.city}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#736E65] block">
                        Price
                      </span>
                      <span className="text-sm font-extrabold text-[#171717]">
                        {evt.price}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/buy?eventId=${evt.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F0EDE4] hover:bg-[#D94520] hover:text-white text-[#171717] text-xs font-bold transition shadow-2xs"
                    >
                      Tickets ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Value Steps: "A good time, in three steps." */}
        <section className="py-12 border-t border-black/[0.08] space-y-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#D94520] uppercase tracking-wider">
              How nftix works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              A good time, in three steps.
            </h2>
            <p className="text-sm text-[#736E65]">
              Designed from the ground up to eliminate bots, scalpers, and door anxiety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-black/[0.08] space-y-3">
              <span className="text-3xl font-mono font-black text-[#D94520]">
                01
              </span>
              <h3 className="text-lg font-bold text-[#171717]">
                Find your thing.
              </h3>
              <p className="text-xs sm:text-sm text-[#736E65] leading-relaxed">
                Curated cultural events and music showcases, not corporate noise. Filter by vibe, city, or date.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-black/[0.08] space-y-3">
              <span className="text-3xl font-mono font-black text-[#D94520]">
                02
              </span>
              <h3 className="text-lg font-bold text-[#171717]">
                Make it yours.
              </h3>
              <p className="text-xs sm:text-sm text-[#736E65] leading-relaxed">
                Checkout in seconds with Indonesian Rupiah (QRIS, VA) and register your device passkey. Zero crypto tokens or gas fees.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-black/[0.08] space-y-3">
              <span className="text-3xl font-mono font-black text-[#D94520]">
                03
              </span>
              <h3 className="text-lg font-bold text-[#171717]">
                Just show up.
              </h3>
              <p className="text-xs sm:text-sm text-[#736E65] leading-relaxed">
                Dynamic QR barcode refreshes every 60 seconds at the door. Screenshots are automatically rejected, keeping scalpers out.
              </p>
            </div>
          </div>
        </section>

        {/* 6. FAQ Accordion ("A few things to know.") */}
        <section className="py-12 border-t border-black/[0.08] space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#D94520] uppercase tracking-wider">
              Transparency First
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              A few things to know.
            </h2>
            <p className="text-sm text-[#736E65]">
              Everything you need to know about purchasing, authenticating, and reselling.
            </p>
          </div>

          <div className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span className="font-bold text-base sm:text-lg text-[#171717] group-hover:text-[#D94520] transition-colors">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#736E65] transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#D94520]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs sm:text-sm text-[#736E65] leading-relaxed mt-3 pr-8">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Organizer CTA Banner ("Bring people together.") */}
        <section className="rounded-3xl bg-[#D94520] text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
              For Promoters & Curators
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Bring people together.
            </h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Publish your events, protect your community from ticket bots, and track gate check-ins with our dual-scan verification terminal.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl bg-white text-[#D94520] hover:bg-stone-100 font-bold text-xs sm:text-sm transition shadow-sm"
              >
                Host an Event on nftix
              </Link>
              <Link
                href="/dashboard/verify"
                className="px-6 py-3 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs sm:text-sm transition border border-white/20"
              >
                Gate Terminal Preview
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Minimalist Footer */}
      <footer className="border-t border-black/[0.08] bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#736E65]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-[#171717]">
              nftix<span className="text-[#D94520]">.</span>
            </span>
            <span>© 2026 nftix. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/dashboard/buy" className="hover:text-[#171717] transition">
              Explore
            </Link>
            <Link href="/dashboard/tickets" className="hover:text-[#171717] transition">
              My tickets
            </Link>
            <Link href="/dashboard/resale" className="hover:text-[#171717] transition">
              Fair Resale
            </Link>
            <span className="text-stone-300">|</span>
            <span>UU PDP No. 27/2022 Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
