import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Tag,
  Sparkles,
  ExternalLink,
  Zap,
  Clock,
} from "lucide-react";

interface TicketCategory {
  id: string | number;
  name: string;
  price: number;
  quota: number;
}

interface EventDetail {
  id: number;
  onChainEventId?: string;
  eventName: string;
  startDate: string;
  venueLocation: string;
  category: string;
  capacity: number;
  maxPerWallet?: number;
  ticketCategories?: TicketCategory[];
  categories?: TicketCategory[];
  totalQuota?: number;
  soldTickets?: number;
  usedTickets?: number;
  checkInRate?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  let event: EventDetail | null = null;

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      event = await res.json();
    }
  } catch (err) {
    console.error("[ORGANIZER EVENT DETAIL] Gagal mengambil detail event:", err);
  }

  if (!event) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Event tidak ditemukan</h2>
        <p className="text-sm text-slate-500">
          Data event dengan ID #{id} tidak tersedia atau telah dihapus.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-coral-500 text-white text-xs font-semibold hover:bg-coral-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    );
  }

  const categories = event.ticketCategories || event.categories || [];
  const totalQuota =
    event.totalQuota ||
    (categories.length > 0
      ? categories.reduce((sum, c) => sum + Number(c.quota || 0), 0)
      : event.capacity || 0);
  const soldTickets = event.soldTickets || 0;
  const usedTickets = event.usedTickets || 0;
  const soldPercent =
    totalQuota > 0 ? Math.min(100, Math.round((soldTickets / totalQuota) * 100)) : 0;
  const checkInPercent =
    soldTickets > 0 ? Math.min(100, Math.round((usedTickets / soldTickets) * 100)) : 0;

  const formatNumber = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const formatRupiah = (p: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(p);

  const formattedDate = () => {
    try {
      return (
        new Date(event.startDate).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    } catch {
      return event.startDate;
    }
  };

  const organizerName =
    (session?.organizationName as string) || "Penyelenggara Resmi";

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* 1. Tombol Kembali & Header Event */}
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-coral-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Promotor</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-coral-50 dark:bg-coral-950/40 text-coral-600 dark:text-coral-400 border border-coral-100 dark:border-coral-800/50">
                {event.category || "Konser Musik"}
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                On-Chain ID #{event.onChainEventId || event.id}
              </span>
            </div>

            <span className="text-xs text-slate-400">
              Penyelenggara: <strong className="text-slate-700 dark:text-slate-200">{organizerName}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {event.eventName}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-coral-500" />
              <span>{formattedDate()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-coral-500" />
              <span>{event.venueLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Kartu Analitik Penjualan & Gate Check-In */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kuota Penjualan Tiket */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-coral-50 text-coral-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Progres Penjualan Tiket
              </h3>
            </div>
            <span className="text-xs font-bold text-coral-600">
              {soldPercent}% Terisi
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Tiket Terjual:</span>
              <span className="font-bold text-base text-slate-900 dark:text-white">
                {formatNumber(soldTickets)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / {formatNumber(totalQuota)} kuota
                </span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-coral-500 rounded-full transition-all duration-300"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Sisa kuota tersedia: {formatNumber(Math.max(0, totalQuota - soldTickets))} tiket.
            </p>
          </div>
        </div>

        {/* Kehadiran di Gerbang Masuk Venue (Check-In) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Kehadiran Gate (Check-In)
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {checkInPercent}% Hadir
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-500">Pengunjung Lolos Masuk:</span>
              <span className="font-bold text-base text-emerald-600">
                {formatNumber(usedTickets)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / {formatNumber(soldTickets)} pemegang tiket
                </span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${checkInPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Belum check-in: {formatNumber(Math.max(0, soldTickets - usedTickets))} penonton di luar gerbang.
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 Status Jadwal Flash Sale yang Diatur Penyelenggara */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FBECE7] text-[#D94520] flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-[#171717] text-sm">
                Status Jadwal Flash Sale Event
              </h3>
              <p className="text-xs text-[#736E65]">
                Dikelola langsung oleh pihak penyelenggara untuk sesi drop eksklusif
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tersinkronisasi</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#F0EDE4]/60 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-[#736E65] block font-medium">Waktu Pembukaan Flash Sale:</span>
            <div className="flex items-center gap-1.5 font-bold text-[#171717]">
              <Clock className="w-3.5 h-3.5 text-[#D94520]" />
              <span>
                {event.startDate
                  ? new Date(event.startDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) + " WIB (Drop Khusus)"
                  : "Dibuka otomatis saat sesi flash sale publik dimulai"}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/flash-sale"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D94520] text-white hover:bg-[#BF3B19] font-bold text-xs transition shadow-xs self-start sm:self-auto"
          >
            <span>Lihat Halaman Flash Sale</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Rincian per Kategori Tiket */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-coral-500" />
            <span>Alokasi Kategori Tiket</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {categories.length} Kategori Terdaftar
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {categories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              className="py-3 flex items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </span>
                <p className="text-slate-400">
                  Harga Resmi:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatRupiah(Number(cat.price))}
                  </strong>
                </p>
              </div>

              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumber(Number(cat.quota))} Kuota
                </span>
                <p className="text-[11px] text-slate-400">Alokasi on-chain</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Big Call to Action: Buka Pintu Masuk / Scanner QR Gate */}
      <div className="rounded-3xl bg-gradient-to-r from-coral-500 via-coral-600 to-rose-600 text-white p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gate Scanner Dual-Scan Siap Beroperasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Operasikan Gerbang Masuk Event Ini
          </h2>
          <p className="text-coral-50 text-xs sm:text-sm leading-relaxed">
            Pindai Dynamic QR Code dari smartphone penonton dan validasi NIK KTP fisik secara on-chain untuk mencegah pemalsuan tiket dan calo.
          </p>
        </div>

        <Link
          href={`/dashboard/verify?eventId=${event.onChainEventId || event.id}`}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-coral-600 font-extrabold text-sm transition-all shadow-md shrink-0 active:scale-[0.99]"
        >
          <QrCode className="w-5 h-5 text-coral-600" />
          <span>Buka Pintu Masuk / Scanner Gate</span>
        </Link>
      </div>
    </div>
  );
}
