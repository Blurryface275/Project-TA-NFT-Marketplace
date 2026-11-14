"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  QrCode,
  Ticket,
  Clock,
  Sparkles,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export interface TicketCategoryItem {
  id?: string | number;
  name?: string;
  price?: number | string;
  quota?: number;
}

export interface EventItem {
  id: string | number;
  onChainEventId?: string | number;
  name?: string;
  eventName?: string;
  date?: string;
  startDate?: string;
  venue?: string;
  venueLocation?: string;
  category?: string;
  imageIpfsCid?: string;
  price?: number;
  priceIdr?: number;
  availableTickets?: number;
  ticketCategories?: TicketCategoryItem[];
}

export interface UserTicketItem {
  tokenId: number;
  eventId: number;
  categoryId: number;
  originalPrice: number;
  used: boolean;
  owner: string;
}

interface DashboardClientProps {
  userName: string;
  userEmail: string;
  walletAddress: string;
  totalTickets: number;
  totalOrders: number;
  events: EventItem[];
  userTickets?: UserTicketItem[];
}

export default function DashboardClient({
  userName,
  totalTickets,
  totalOrders,
  events = [],
  userTickets = [],
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const todayDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatRupiah = (val?: number) => {
    if (!val) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Saved spotlight events for the sidebar
  const savedSpotlights = [
    {
      id: "save-1",
      month: "NOV",
      day: "22",
      title: "Sunset Jazz & Natural Wine",
      venue: "La Brisa, Bali",
      price: "Rp 320.000",
    },
    {
      id: "save-2",
      month: "DEC",
      day: "04",
      title: "Indie Pop: Feast & Hindia",
      venue: "Tennis Indoor Senayan",
      price: "Rp 450.000",
    },
    {
      id: "save-3",
      month: "DEC",
      day: "19",
      title: "MACAN Contemporary Biennial",
      venue: "Museum MACAN, Jakarta",
      price: "Rp 150.000",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Date Greeting Header (PDF Page 2 Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span
            suppressHydrationWarning
            className="text-xs font-semibold text-[#736E65] tracking-wide uppercase"
          >
            {todayDateFormatted}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
            Good to see you, {userName}.
          </h1>
          <p className="text-sm text-[#736E65]">
            A few good plans to look forward to.
          </p>
        </div>

        <Link
          href="/dashboard/buy"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs sm:text-sm font-bold shadow-xs transition shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <span>Explore events</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Your next good times (col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
            <h2 className="text-xl font-bold tracking-tight text-[#171717]">
              Your next good times
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F0EDE4] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "upcoming"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#736E65] hover:text-[#171717]"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "past"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#736E65] hover:text-[#171717]"
                }`}
              >
                Past events
              </button>
            </div>
          </div>

          {/* Ticket Cards List */}
          {activeTab === "upcoming" ? (
            <div className="space-y-4">
              {userTickets.length > 0 ? (
                userTickets.map((t) => {
                  const matchedEvt = events.find(
                    (e) =>
                      Number(e.id) === Number(t.eventId) ||
                      Number(e.onChainEventId) === Number(t.eventId),
                  );
                  const title = matchedEvt?.eventName || "Curated Event Pass";
                  const dateStr = matchedEvt?.startDate
                    ? new Date(matchedEvt.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " WIB"
                    : "Confirmed Event Schedule";
                  const venue = matchedEvt?.venueLocation || "Official Venue";
                  const poster =
                    matchedEvt?.imageIpfsCid ||
                    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80";

                  return (
                    <div
                      key={t.tokenId}
                      className="rounded-2xl bg-white border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/15 transition-all flex flex-col sm:flex-row"
                    >
                      {/* Poster / Thumbnail Left */}
                      <div className="sm:w-56 h-48 sm:h-auto relative overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={poster}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                          {matchedEvt?.category || "Pass"}
                        </span>
                      </div>

                      {/* Right Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              CONFIRMED
                            </span>
                            <span className="text-[11px] font-mono text-[#736E65]">
                              #TKT-{t.tokenId}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-[#171717] mt-2">
                            {title}
                          </h3>

                          <div className="mt-2 space-y-1 text-xs text-[#736E65]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#D94520]" />
                              <span>{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#736E65]" />
                              <span>{venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket className="w-3.5 h-3.5 text-[#736E65]" />
                              <span>
                                Pass #{t.tokenId} • Rp{" "}
                                {Number(t.originalPrice).toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                          <Link
                            href="/dashboard/tickets"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#D94520] hover:text-[#BF3B19] transition"
                          >
                            <span>Lihat Tiket (QR Masuk)</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href="/dashboard/orders"
                            className="px-3 py-1.5 rounded-lg border border-black/[0.08] hover:bg-stone-50 text-xs font-semibold text-[#171717] transition"
                          >
                            Riwayat Pesanan
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between gap-3">
                    <span>
                      Belum ada tiket yang dipesan. Pilih event di bawah untuk membeli tiket resmi:
                    </span>
                    <Link
                      href="/dashboard/buy"
                      className="px-3 py-1 rounded-lg bg-[#D94520] text-white font-bold shrink-0 hover:bg-[#BF3B19] transition"
                    >
                      Katalog Lengkap
                    </Link>
                  </div>

                  {events.slice(0, 2).map((evt) => {
                    const prices = (evt.ticketCategories || []).map((c) =>
                      Number(c.price),
                    );
                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                    const dateStr = evt.startDate
                      ? new Date(evt.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Jadwal Resmi";

                    return (
                      <div
                        key={evt.id}
                        className="rounded-2xl bg-white border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/15 transition-all flex flex-col sm:flex-row"
                      >
                        <div className="sm:w-56 h-48 sm:h-auto relative overflow-hidden bg-stone-100 shrink-0">
                          <img
                            src={
                              evt.imageIpfsCid ||
                              "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80"
                            }
                            alt={evt.eventName || "Event"}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                            {evt.category || "Event"}
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              TIKET TERSEDIA
                            </span>

                            <h3 className="text-lg font-bold text-[#171717] mt-2">
                              {evt.eventName}
                            </h3>

                            <div className="mt-2 space-y-1 text-xs text-[#736E65]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#D94520]" />
                                <span>{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#736E65]" />
                                <span>{evt.venueLocation}</span>
                              </div>
                              <div className="flex items-center gap-2 font-mono font-bold text-[#171717]">
                                <Ticket className="w-3.5 h-3.5 text-[#736E65]" />
                                <span>Mulai {formatRupiah(minPrice)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                            <Link
                              href={`/dashboard/buy?eventId=${evt.id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D94520] text-white hover:bg-[#BF3B19] text-xs font-bold transition shadow-xs"
                            >
                              <span>Pilih Kategori & Beli</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center rounded-2xl bg-white border border-dashed border-stone-200 p-8 space-y-2">
                  <Ticket className="w-8 h-8 text-stone-300 mx-auto" />
                  <h3 className="text-sm font-bold text-[#171717]">
                    Belum Ada Tiket Aktif
                  </h3>
                  <p className="text-xs text-[#736E65]">
                    Tiket yang Anda beli akan muncul di sini lengkap dengan barcode dinamis untuk pintu masuk.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-white border border-dashed border-stone-200 p-8 space-y-2">
              <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#171717]">
                Belum Ada Riwayat Tiket Selesai
              </h3>
              <p className="text-xs text-[#736E65]">
                Tiket yang sudah dipindai di pintu gerbang akan tersimpan di sini.
              </p>
            </div>
          )}

          {/* Browse More Events Link */}
          <div className="pt-2 text-center sm:text-left">
            <Link
              href="/dashboard/buy"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#D94520] hover:underline"
            >
              <span>Explore more events in Jakarta & Bali</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Saved for later + Door QR Helper (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* "Saved for later" Card */}
          <div className="rounded-2xl bg-white border border-black/[0.08] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#171717]">
                Saved for later
              </h3>
              <span className="text-[11px] font-bold text-[#736E65]">
                3 saved
              </span>
            </div>

            <div className="divide-y divide-black/[0.06]">
              {(events.length > 0
                ? events.slice(0, 3).map((evt) => {
                    const d = evt.startDate ? new Date(evt.startDate) : new Date();
                    const month = d
                      .toLocaleDateString("en-US", { month: "short" })
                      .toUpperCase();
                    const day = String(d.getDate()).padStart(2, "0");
                    const prices = (evt.ticketCategories || []).map((c) =>
                      Number(c.price),
                    );
                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                    return {
                      id: evt.id,
                      month,
                      day,
                      title: evt.eventName || "Curated Event",
                      venue: evt.venueLocation || "Jakarta",
                      price: formatRupiah(minPrice),
                    };
                  })
                : savedSpotlights
              ).map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3 group">
                  {/* Date badge */}
                  <div className="w-12 h-12 rounded-xl bg-[#F0EDE4] flex flex-col items-center justify-center shrink-0 text-[#171717]">
                    <span className="text-[10px] font-bold text-[#D94520]">
                      {item.month}
                    </span>
                    <span className="text-sm font-extrabold leading-none">
                      {item.day}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#171717] truncate group-hover:text-[#D94520] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#736E65] truncate">
                      {item.venue}
                    </p>
                    <span className="text-[11px] font-extrabold text-[#171717]">
                      {item.price}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/buy?eventId=${item.id}`}
                    className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-stone-50 text-[#736E65] hover:text-[#171717] transition cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* "All set for the door" Helper Box (Page 2 PDF style) */}
          <div className="rounded-2xl bg-[#F0EDE4] border border-black/[0.08] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#D94520]">
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Door Entry Guide
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#171717]">
              All set for the door.
            </h3>

            <p className="text-xs text-[#736E65] leading-relaxed">
              Have your dynamic QR code ready before reaching the entrance. Barcodes roll every 60 seconds to prevent ticket duplication. Static screenshots are not accepted by gate marshals.
            </p>

            <div className="pt-1">
              <Link
                href="/dashboard/tickets"
                className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold shadow-xs transition"
              >
                <span>Open dynamic barcode</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
