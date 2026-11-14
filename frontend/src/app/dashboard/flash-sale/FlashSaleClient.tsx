"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
} from "lucide-react";

export interface TicketCategoryItem {
  id: string | number;
  name: string;
  price: string | number;
  quota: number;
}

export interface FlashSaleEvent {
  id: number;
  onChainEventId?: string;
  eventName: string;
  startDate: string;
  venueLocation: string;
  category: string;
  capacity: number;
  maxPerWallet?: number;
  saleStartTime?: string | null;
  saleEndTime?: string | null;
  imageIpfsCid: string | null;
  ticketCategories?: TicketCategoryItem[];
}

interface FlashSaleClientProps {
  events: FlashSaleEvent[];
  isLoggedIn: boolean;
  walletAddress: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

function calculateTimeRemaining(targetIso?: string | null, eventDateIso?: string): TimeRemaining {
  if (!targetIso) {
    // Jika belum ada jadwal spesifik, default ke 1 jam lagi untuk simulasi aktif / upcoming
    return { hours: 0, minutes: 0, seconds: 0, isLive: true };
  }

  const now = new Date().getTime();
  const target = new Date(targetIso).getTime();
  const diff = target - now;

  if (diff <= 0 || isNaN(target)) {
    return { hours: 0, minutes: 0, seconds: 0, isLive: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isLive: false };
}

export default function FlashSaleClient({
  events = [],
  isLoggedIn,
  walletAddress,
}: FlashSaleClientProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "LIVE" | "UPCOMING">("ALL");
  const [remindedEvents, setRemindedEvents] = useState<Record<number, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Normalisasi data event dengan jadwal flash sale
  // Untuk event yang belum memiliki saleStartTime di database, berikan jadwal drop terdekat
  const flashSaleItems = events.map((evt, idx) => {
    // Simulasi jadwal terukur: event pertama Live, event kedua & ketiga upcoming
    let scheduleIso = evt.saleStartTime;
    if (!scheduleIso) {
      if (idx === 0) {
        // Event 1: Sedang Berlangsung (Live)
        scheduleIso = new Date(Date.now() - 3600000).toISOString();
      } else if (idx === 1) {
        // Event 2: Buka 2 jam lagi
        scheduleIso = new Date(Date.now() + 2 * 3600000 + 15 * 60000).toISOString();
      } else {
        // Event lainnya: Buka besok jam 19:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(19, 0, 0, 0);
        scheduleIso = tomorrow.toISOString();
      }
    }

    const remaining = calculateTimeRemaining(scheduleIso, evt.startDate);
    const prices = (evt.ticketCategories || []).map((c) => Number(c.price));
    const startPrice = prices.length > 0 ? Math.min(...prices) : 100000;

    // Perhitungan status jendela waktu Flash Sale
    const nowMs = nowTimestamp;
    const startMs = scheduleIso ? new Date(scheduleIso).getTime() : 0;
    const endMs = evt.saleEndTime ? new Date(evt.saleEndTime).getTime() : null;

    const isUpcoming = Boolean(startMs && nowMs < startMs);
    const isLive = Boolean(startMs && nowMs >= startMs && (!endMs || nowMs <= endMs));
    const isSpillover = Boolean(endMs && nowMs > endMs);

    return {
      ...evt,
      scheduledTimeIso: scheduleIso,
      remaining,
      ticketPrice: startPrice,
      isUpcoming,
      isLive,
      isSpillover,
    };
  });

  const filteredItems = flashSaleItems.filter((item) => {
    if (activeTab === "LIVE") return item.isLive;
    if (activeTab === "UPCOMING") return item.isUpcoming;
    return true;
  });

  const handleToggleReminder = (eventId: number) => {
    setRemindedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. Hero Header Editorial (Gaya Linen & Terracotta) */}
      <div className="bg-[#171717] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-black/[0.08] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D94520]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D94520] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Time-Gated Ticket Drop</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Jadwal Flash Sale Tiket
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Periode singkat pembukaan penjualan tiket event. Tiket hanya dapat dibeli selama jendela waktu flash sale aktif.
            Setelah periode berakhir, sisa tiket otomatis dialihkan ke marketplace umum.
          </p>
        </div>
      </div>

      {/* 2. Filter Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeTab === "ALL"
                ? "bg-[#D94520] text-white border-[#D94520] shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <span>Semua Sesi ({flashSaleItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("LIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === "LIVE"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sedang Berlangsung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              activeTab === "UPCOMING"
                ? "bg-[#171717] text-white border-[#171717] shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Akan Datang</span>
          </button>
        </div>

        <div className="text-xs text-[#736E65]">
          Pembaruan waktu otomatis tiap detik
        </div>
      </div>

      {/* 3. Flash Sale Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredItems.map((item) => {
          const isLive = item.remaining.isLive;
          const isReminded = remindedEvents[item.id];
          const formattedSchedule = isMounted
            ? new Date(item.scheduledTimeIso).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) + " WIB"
            : "Jadwal Flash Sale";

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-xs hover:border-black/20 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* 16:9 Banner Poster with Badges */}
                <div
                  className="relative aspect-[16/9] bg-cover bg-center overflow-hidden"
                  style={{
                    backgroundImage: item.imageIpfsCid
                      ? `linear-gradient(to top, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.2) 60%), url(${item.imageIpfsCid})`
                      : "linear-gradient(135deg, #171717 0%, #35302D 100%)",
                  }}
                >
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-xs text-white bg-black/60 border-white/20">
                    <Clock className="w-3 h-3 text-[#D94520]" />
                    <span>Periode Terbatas</span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {item.isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        PENJUALAN DIBUKA
                      </span>
                    ) : item.isSpillover ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-600 text-white shadow-xs">
                        PASAR UMUM
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                        BELUM DIBUKA
                      </span>
                    )}
                  </div>

                  {/* Countdown Timer Floating Bar */}
                  <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/75 backdrop-blur-md text-white border border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-300 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-[#D94520]" />
                      <span>{item.isLive ? "Sesi Aktif" : item.isSpillover ? "Status" : "Dibuka Dalam:"}</span>
                    </span>

                    <span className="font-mono font-bold text-xs text-[#FBECE7]">
                      {item.isLive ? (
                        <span className="text-emerald-400 font-sans">Bisa Dipesan Sekarang</span>
                      ) : item.isSpillover ? (
                        <span className="text-stone-300 font-sans">Ditumpahkan ke Pasar Umum</span>
                      ) : (
                        `${String(item.remaining.hours).padStart(2, "0")}j : ${String(
                          item.remaining.minutes
                        ).padStart(2, "0")}m : ${String(item.remaining.seconds).padStart(
                          2,
                          "0"
                        )}d`
                      )}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-[#171717] line-clamp-1">
                      {item.eventName}
                    </h3>

                    <div className="space-y-1 text-xs text-[#736E65]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                        <span>Mulai Penjualan: {formattedSchedule}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#736E65] shrink-0" />
                        <span className="truncate">{item.venueLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Tag (Bukan Diskon - Menampilkan Harga Asli Tiket & Info Window) */}
                  <div className="p-3 rounded-xl bg-[#F0EDE4] border border-black/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#736E65] block font-medium">
                        Harga Tiket
                      </span>
                      <span className="text-base font-extrabold text-[#D94520] font-mono block">
                        {formatRupiah(item.ticketPrice)}
                      </span>
                    </div>

                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-[#171717] border border-black/[0.08]">
                      {item.isLive ? "Sesi Terbatas" : item.isSpillover ? "Pasar Umum" : "Time Drop"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0">
                {item.isLive || item.isSpillover ? (
                  <Link
                    href={`/dashboard/buy?eventId=${item.id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#D94520] hover:bg-[#BF3B19] transition shadow-xs text-xs sm:text-sm cursor-pointer"
                  >
                    <span>{item.isLive ? "Beli Tiket Flash Sale Sekarang" : "Beli Tiket (Pasar Umum)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 text-[#736E65] text-xs font-semibold cursor-not-allowed text-center border border-black/[0.06]"
                    >
                      Menunggu Jadwal Buka
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleReminder(item.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isReminded
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-black/[0.08] hover:bg-stone-50 text-[#171717]"
                      }`}
                      title="Ingatkan Saya saat Flash Sale Dibuka"
                    >
                      {isReminded ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Bell className="w-4 h-4 text-[#736E65]" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
