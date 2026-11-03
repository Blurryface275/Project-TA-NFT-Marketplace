"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  ShoppingBag,
  History,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
  QrCode,
  Flame,
} from "lucide-react";

interface EventItem {
  id: string | number;
  name?: string;
  eventName?: string;
  date?: string;
  startDate?: string;
  venue?: string;
  venueLocation?: string;
  price?: number;
  priceIdr?: number;
  availableTickets?: number;
}

interface DashboardClientProps {
  userName: string;
  userEmail: string;
  walletAddress: string;
  totalTickets: number;
  totalOrders: number;
  events: EventItem[];
}

export default function DashboardClient({
  userName,
  userEmail,
  walletAddress,
  totalTickets,
  totalOrders,
  events,
}: DashboardClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatRupiah = (val?: number) => {
    if (!val) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortAddress = (addr: string) => {
    if (!addr) return "Belum Ada Dompet";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      {/* 1. Status Bar Smart Account & Peringatan Error Prevention (Heuristic 1 & 5) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Sepolia Testnet · ERC-4337
            </span>
            <span className="text-xs text-slate-400 font-medium">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Gasless Paymaster Aktif
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Halo, <span className="text-coral-500">{userName}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola tiket konser NFT resmi dan transaksi on-chain Anda dalam satu tempat.
          </p>
        </div>

        {/* Smart Account Status Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Smart Account
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                {formatShortAddress(walletAddress)}
              </span>
            </div>
          </div>

          {walletAddress ? (
            <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2 sm:pt-0 sm:pl-3">
              <button
                type="button"
                onClick={handleCopy}
                title="Salin alamat dompet"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-700 hover:text-coral-500 hover:border-coral-200 text-xs font-medium shadow-2xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-teal-600 font-semibold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Lihat di Etherscan"
                className="p-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-700 hover:text-coral-500 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <span className="text-[11px] text-coral-600 font-semibold px-2">
              Klik profil kanan atas untuk aktifkan
            </span>
          )}
        </div>
      </div>

      {/* 2. Grid Metrik Utama (Diadaptasi dari 21st MCP Stat Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tiket Saya */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-coral-200 hover:shadow-[0_8px_30px_rgba(255,90,54,0.06)] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tiket Dimiliki</span>
            <div className="w-9 h-9 rounded-2xl bg-coral-50 text-coral-500 border border-coral-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalTickets}
              </span>
              <span className="text-xs text-slate-400 font-medium">lembar</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tiket on-chain aktif di dompet
            </p>
          </div>
        </div>

        {/* Card 2: Total Transaksi Selesai */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-teal-200 hover:shadow-[0_8px_30px_rgba(13,148,136,0.06)] transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Transaksi</span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalOrders}
              </span>
              <span className="text-xs text-slate-400 font-medium">pesanan</span>
            </div>
            <p className="text-[11px] text-teal-600 font-medium mt-1">
              Terverifikasi Midtrans Fiat
            </p>
          </div>
        </div>

        {/* Card 3: Event Tersedia */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Event Aktif</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {events.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">acara</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Siap dipesan langsung
            </p>
          </div>
        </div>

        {/* Card 4: Status Anti-Scalping */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-coral-200 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Proteksi Calo</span>
            <div className="w-9 h-9 rounded-2xl bg-coral-50 text-coral-500 border border-coral-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-coral-600">
                100% On-Chain
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dynamic QR EIP-712 Aktif
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Bar (Heuristic 7 - Flexibility and Efficiency of Use) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Aksi Cepat
          </h2>
          <span className="text-xs text-slate-400">Pilih menu navigasi instan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/dashboard/buy"
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white shadow-sm shadow-coral-500/20 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight flex items-center gap-1">
                <span>Beli Tiket</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[11px] text-coral-100 block truncate mt-0.5">
                Katalog konser resmi
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight flex items-center gap-1">
                <span>Tiket Saya</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[11px] text-teal-100 block truncate mt-0.5">
                Lihat barcode & status
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard/orders"
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight flex items-center gap-1 text-slate-900">
                <span>Riwayat Order</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                Bukti bayar Midtrans
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard/verify"
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight flex items-center gap-1 text-slate-900">
                <span>Verifikasi</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                Scan QR pintu masuk
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Katalog Event Terkini (Heuristic 6 & 8 - Recognition over Recall & Minimalist) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Event Mendatang Pilihan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dapatkan tiket resmi dengan kuota terlindungi smart contract.
            </p>
          </div>
          <Link
            href="/dashboard/buy"
            className="inline-flex items-center gap-1 text-xs font-bold text-coral-500 hover:text-coral-600 transition"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-3">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">
              Belum ada event yang aktif saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 3).map((evt) => {
              const eventTitle = evt.name || evt.eventName || "Event Konser";
              const eventDate = evt.date || (evt.startDate ? new Date(evt.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Segera");
              const eventVenue = evt.venue || evt.venueLocation || "Jakarta";
              const eventPrice = evt.priceIdr || evt.price || 0;

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-coral-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-coral-50 text-coral-600">
                      <Flame className="w-3 h-3 text-coral-500" />
                      <span>Resmi On-Chain</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {eventTitle}
                    </h3>
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{eventDate}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] truncate">
                        📍 {eventVenue}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Mulai dari</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatRupiah(eventPrice)}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/buy`}
                      className="px-3.5 py-1.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold transition shadow-xs"
                    >
                      Beli Tiket
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Kartu Edukasi & Bantuan (Heuristic 10 - Help and Documentation) */}
      <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-7 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Bagaimana Tiket NFT Melindungimu dari Calo?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-coral-50 text-coral-500 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">Dynamic EIP-712 QR</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              QR Code berganti setiap beberapa detik. Screenshot calo otomatis tidak valid saat discan di pintu masuk.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">Smart Account ERC-4337</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tiket tersimpan aman di smart wallet dengan passkey biometrik. Tanpa perlu simpan seed phrase rumit.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">Batas Harga Jual Kembali</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Smart contract membatasi harga resale maksimal 100% dari harga asli, membasmi spekulasi calo secara permanen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
