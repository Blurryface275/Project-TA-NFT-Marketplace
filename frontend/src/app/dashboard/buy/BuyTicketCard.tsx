"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { registerPasskey } from "@/lib/passkey";
import {
  activateWalletAction,
  BuyTicketState,
  createSnapPaymentAction,
  checkOrderStatusAction,
  fetchMyTicketsAction,
} from "./actions";
import {
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Armchair,
  Key,
  ShieldCheck,
  Receipt,
  Building2,
  Info,
  Clock,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Shield,
  Tag,
  Share2,
  Copy,
  Check,
} from "lucide-react";

export interface TicketCategoryData {
  id: string;
  name: string;
  price: string | number;
  quota: number;
  eventsId: number;
}

export interface EventData {
  id: number;
  onChainEventId: string;
  eventName: string;
  startDate: string;
  venueLocation: string;
  category: string;
  capacity: number;
  maxPerWallet?: number;
  saleStartTime?: string | null;
  imageIpfsCid: string | null;
  organizersId?: number;
  ticketCategories: TicketCategoryData[];
}

export interface UserTicket {
  tokenId: number;
  eventId: number;
  categoryId: number;
  originalPrice: number;
  used: boolean;
  owner: string;
}

interface BuyTicketCardProps {
  walletAddress: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  events?: EventData[];
  userTickets?: UserTicket[];
  initialOwnedCount?: number;
  event?: EventData | null;
}

export default function BuyTicketCard({
  // ini akan jadi default value untuk BuyTicketCardProps
  walletAddress,
  userEmail = "",
  isLoggedIn = false,
  events = [],
  userTickets = [],
  event,
}: BuyTicketCardProps) {
  // Satukan daftar event dari database
  const allEvents = events.length > 0 ? events : event ? [event] : [];

  // State pemilihan event: jika null maka menampilkan katalog kartu marketplace
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Cari data event yang sedang aktif dipilih
  const currentEvent = allEvents.find((e) => e.id === selectedEventId) || null;

  // State untuk melacak status transaksi dan loading saat minting
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BuyTicketState | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // State Cloudflare Turnstile token untuk mitigasi bot calo
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // Callback global saat Turnstile berhasil memvalidasi pengunjung manusia
  // Sumber: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
  }, []);

  // State Flash Sale Time Gate & Countdown
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isStarted: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: true,
  });

  useEffect(() => {
    if (!currentEvent?.saleStartTime) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isStarted: true });
      return;
    }

    const checkTime = () => {
      const now = new Date().getTime();
      const target = new Date(currentEvent.saleStartTime!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isStarted: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isStarted: false });
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [currentEvent?.saleStartTime]);

  // Simpan data tiket kepemilikan user dalam state lokal
  const [ownedTickets, setOwnedTickets] = useState<UserTicket[]>(userTickets);

  // State manajemen dompet berbasis Passkey (Progressive Onboarding)
  const [activeWallet, setActiveWallet] = useState<string>(walletAddress || "");
  const [isActivatingWallet, setIsActivatingWallet] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  // Tab Loket.com pada detail event: deskripsi, tiket, terms
  const [activeTab, setActiveTab] = useState<"deskripsi" | "tiket" | "terms">(
    "deskripsi",
  );
  // Filter kategori di katalog marketplace Loket.com
  const [catalogCategory, setCatalogCategory] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  // Konversi kategori dari DB MySQL milik event yang aktif ke format kartu pilihan
  const categories = (currentEvent?.ticketCategories || []).map((cat) => ({
    id: Number(cat.id),
    name: cat.name,
    badge: cat.name.includes("VIP")
      ? "Early Access"
      : cat.name.includes("CAT") || cat.name.includes("Regular")
        ? "Duduk Nyaman"
        : "Paling Seru",
    price: Number(cat.price),
    rowPrefix: cat.name.includes("VIP")
      ? "VIP"
      : cat.name.includes("CAT")
        ? "CAT1"
        : cat.name.includes("Regular")
          ? "REG"
          : "FEST",
    description: cat.name.includes("VIP")
      ? "Akses lebih awal dengan kursi baris terdepan"
      : cat.name.includes("CAT") || cat.name.includes("Regular")
        ? "Kursi bernomor di tribun utama dengan pemandangan luas"
        : "Area berdiri bebas di tengah arena konser",
  }));

  const activeCategories =
    categories.length > 0
      ? categories
      : [
          {
            id: 1,
            name: "Tiket Reguler",
            badge: "General",
            price: 50000,
            rowPrefix: "REG",
            description: "Akses masuk resmi event",
          },
        ];

  // State kategori tiket yang dipilih dalam event aktif
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    activeCategories[0].id,
  );

  const selectedCategory =
    activeCategories.find((c) => c.id === selectedCategoryId) ||
    activeCategories[0];
  const pricePerTicket = selectedCategory.price;

  // On-chain event ID
  const EVENT_ID = currentEvent?.onChainEventId
    ? Number(currentEvent.onChainEventId)
    : currentEvent?.id || 1;

  // Batas kuota anti-scalping dinamis per event dari database
  const MAX_PER_WALLET = currentEvent?.maxPerWallet || 2;

  // Hitung jumlah tiket yang sudah dimiliki user khusus untuk event aktif
  const ownedCountForCurrentEvent = ownedTickets.filter(
    (t) => t.eventId === EVENT_ID,
  ).length;

  const remainingQuota = Math.max(
    0,
    MAX_PER_WALLET - ownedCountForCurrentEvent,
  );
  const isQuotaFull = remainingQuota === 0;

  // State jumlah tiket yang ingin dibeli
  const [quantity, setQuantity] = useState(1);
  const safeQuantity =
    remainingQuota > 0 ? Math.min(quantity, remainingQuota) : 0;
  const totalPrice = safeQuantity * pricePerTicket;

  // Format tanggal event sesuai zona WIB
  const eventDateFormatted = currentEvent?.startDate
    ? new Date(currentEvent.startDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "25 Oktober 2026, 18:00 WIB";

  // Cari harga tiket termurah untuk currentEvent
  const currentEventPrices = (currentEvent?.ticketCategories || []).map((c) =>
    Number(c.price),
  );
  const currentMinPrice =
    currentEventPrices.length > 0 ? Math.min(...currentEventPrices) : 0;

  // Fungsi saat pengguna memilih kartu event di katalog
  const handleSelectEventCard = (evt: EventData) => {
    setSelectedEventId(evt.id);
    setActiveTab("deskripsi");
    if (evt.ticketCategories && evt.ticketCategories.length > 0) {
      setSelectedCategoryId(Number(evt.ticketCategories[0].id));
    }
    setQuantity(1);
    setResult(null);
  };

  // Fungsi salin URL link event ke clipboard
  const handleShareEvent = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Fungsi memicu Passkey dan mengaktifkan dompet di backend (Progressive Onboarding)
  const handleActivateWallet = async () => {
    setIsActivatingWallet(true);
    setActivationError(null);

    try {
      // 1. Picu WebAuthn di browser (PIN Windows / Biometrik / QR HP)
      const emailToUse = userEmail || "customer@example.com";
      const passkey = await registerPasskey(emailToUse);

      // 2. Simpan kredensial ke database via Server Action
      const res = await activateWalletAction({
        pubX: passkey.pubX,
        pubY: passkey.pubY,
        credentialId: passkey.credentialId,
        walletAddress: passkey.walletAddress,
      });

      if (!res.success) {
        setActivationError(res.message || "Gagal mengaktifkan dompet tiket.");
        return;
      }

      // 3. Simpan alamat dompet ke state lokal -> Tombol otomatis berubah jadi 'Beli Tiket'
      setActiveWallet(passkey.walletAddress);
    } catch (err: unknown) {
      console.error("Gagal aktivasi passkey:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal membuka sensor biometrik atau PIN Windows.";
      setActivationError(errorMessage);
    } finally {
      setIsActivatingWallet(false);
    }
  };

  const handleBuyTicket = async () => {
    setIsLoading(true);
    setResult(null);

    try{
      // Minta Snap Token dari backend via Server Action (sertakan token verifikasi Turnstile)
      const snapRes = await createSnapPaymentAction(
        EVENT_ID,
        selectedCategoryId,
        safeQuantity,
        turnstileToken,
      );

      if (!snapRes.success || !snapRes.token){
        setResult({
          success: false,
          message: snapRes.message || "Gagal membuat sesi pembayaran Midtrans.",
        });
        setIsLoading(false);
        return;
      }

      // buka popup model kasir Midtrans Snap
      const snap = (window as any).snap;
      if (!snap){
        setResult({
          success: false,
          message: "Midtrans Snap gagal dimuat. silahkan refresh halaman.",
        });
        setIsLoading(false);
        return;
      }

      snap.pay(snapRes.token,{
        onSuccess: async function (snapResult: any){
          console.log("[SNAP] Pembayaran berhasil diterima Midtrans:", snapResult);

          // Polling status order tiap 2 deitk untuk menunggu backend webhook & realyer minting
          let attempts = 0;
          const maxAttempts = 15; // maks. 30 detik karena konfirmasi blok di EVM itu 12-15 detik jadi kalau lebih dari 15detik maka besar kemungkinan ada error dan enunggu lebihda ri 30 deitk tidak worth it
          const interval = setInterval(async () => {
            attempts++;
            if(!snapRes.orderId){
              clearInterval(interval);
              setIsLoading(false);
              return;
            }

            const orderStatus = await checkOrderStatusAction(snapRes.orderId);

            // Sukses: Transaksi Lunas & tiket resmi diterbitkan
            if (orderStatus.success && orderStatus.status === "paid"){
              clearInterval(interval);

              // update data tiket yang sudah di beli
              const updatedTickets = await fetchMyTicketsAction(activeWallet);
              setOwnedTickets(updatedTickets);

              setResult({
                success: true,
                message: "Pembayaran berhasil dan tiket resmi telah diterbitkan!",
              });
              setShowSuccessModal(true);
              setIsLoading(false);
              return;
            }

            // Gagal: tiket batal dibeli
            if (orderStatus.success && (orderStatus.status === "failed" || orderStatus.status === "cancelled")){
              clearInterval(interval);
              setResult({
                success: false,
                message: "Pembayaran dibatalkan atau gagal diproses.",
              });
              setIsLoading(false);
              return;
            }

            // Batas waktu habis (Timeout > 30 detik)
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsLoading(false);
              setResult({
                success: true,
                message: "Pembayaran telah diterima Midtrans. Tiket resmi sedang diproses, silakan periksa berkala di menu Tiket Saya.",
              });
              setShowSuccessModal(true);
              return;
            }
          }, 2000);
        },
        onPending: function (snapResult: any) {
          console.log("[SNAP] Menunggu pembayaran (Pending):", snapResult);
          setResult({
            success: true,
            message: "Menunggu pembayaran via Virtual Account / QRIS. Silakan selesaikan pembayaran sebelum batas waktu.",
          });
          setIsLoading(false);
        },
        onError: function (snapResult: any) {
          console.error("[SNAP] Pembayaran gagal:", snapResult);
          setResult({
            success: false,
            message: "Pembayaran gagal diproses oleh gateway Midtrans.",
          });
          setIsLoading(false);
        },
        onClose: function () {
          console.log("[SNAP] Modal kasir ditutup oleh pengguna");
          setIsLoading(false);
        },
      });
    } catch (err: unknown) {
      console.error("Gagal melakukan pembelian tiket:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat checkout.";
      setResult({
        success: false,
        message: errorMessage,
      });
      setIsLoading(false);
    }
  };

  // Filter event di katalog
  const filteredEvents = allEvents.filter((evt) => {
    if (catalogCategory === "ALL") return true;
    return (evt.category || "").toLowerCase().includes(catalogCategory.toLowerCase());
  });

  // TAMPILAN 1: KATALOG EVENT MARKETPLACE (LOKET.COM STYLE)
  if (!selectedEventId || !currentEvent) {
    return (
      <>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
          {/* Header Katalog Loket.com */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Jelajahi Event & Konser
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Beli tiket resmi bergaransi 100% asli langsung dari penyelenggara acara terpercaya.
            </p>
          </div>

          {/* Loket.com Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: "Semua Event" },
                { id: "Konser", label: "Konser Musik" },
                { id: "Festival", label: "Festival" },
                { id: "Pameran", label: "Pameran & Seni" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCatalogCategory(pill.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    catalogCategory === pill.id
                      ? "bg-coral-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
              {filteredEvents.length} Event Ditemukan
            </span>
          </div>

          {/* Grid Kartu Event Marketplace (Loket.com Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              // Hitung tiket yang sudah dimiliki akun ini khusus untuk event ini
              const ownedInThisEvent = ownedTickets.filter(
                (t) => t.eventId === Number(evt.onChainEventId || evt.id),
              ).length;
              const eventMax = evt.maxPerWallet || 2;
              const isEventFull = ownedInThisEvent >= eventMax;

              // Cari harga tiket termurah untuk label "Mulai dari"
              const prices = (evt.ticketCategories || []).map((c) =>
                Number(c.price),
              );
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

              const formattedDate = evt.startDate
                ? new Date(evt.startDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "25 Okt 2026";

              return (
                <div
                  key={evt.id}
                  onClick={() => handleSelectEventCard(evt)}
                  className="group bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-coral-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  {/* Gambar Poster Event 16:9 */}
                  <div
                    className="relative aspect-video bg-cover bg-center overflow-hidden"
                    style={{
                      backgroundImage: evt.imageIpfsCid
                        ? `linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.25) 50%, rgba(15, 23, 42, 0.05) 100%), url(${evt.imageIpfsCid})`
                        : "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    }}
                  >
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-coral-600 border border-white/60 shadow-xs">
                      <Sparkles className="w-3 h-3 text-coral-500" />
                      <span>Official</span>
                    </div>

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/10 capitalize">
                      {evt.category || "Konser"}
                    </div>

                    {/* Badge Status Kuota Akun */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] backdrop-blur-md border ${
                          isEventFull
                            ? "bg-rose-500/90 text-white border-rose-400/40"
                            : ownedInThisEvent > 0
                              ? "bg-amber-500/90 text-white border-amber-400/40"
                              : "bg-teal-600/90 text-white border-teal-400/40"
                        }`}
                      >
                        {isEventFull
                          ? `Kuota Penuh (${ownedInThisEvent}/${eventMax})`
                          : ownedInThisEvent > 0
                            ? `Dimiliki: ${ownedInThisEvent}/${eventMax} Tiket`
                            : `Sisa Kuota: ${eventMax} Tiket`}
                      </span>
                    </div>
                  </div>

                  {/* Deskripsi Event (Loket Card Style) */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-coral-600 transition-colors line-clamp-2 leading-snug">
                        {evt.eventName}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {evt.organizersId === 1
                            ? "BEM Universitas Surabaya"
                            : "Event Organizer Resmi"}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                          <span className="font-medium">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="truncate">{evt.venueLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Kartu: Harga & Tombol Beli */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Mulai dari
                        </span>
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          Rp {minPrice.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coral-500 text-white text-xs font-bold group-hover:bg-coral-600 transition-all shadow-xs"
                      >
                        <span>Beli Tiket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // TAMPILAN 2: DETAIL PEMBELIAN TIKET (LOKET.COM 2-COLUMN SPLIT LAYOUT)
  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="w-full bg-[#F8F9FA] min-h-screen py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => {
                setSelectedEventId(null);
                setResult(null);
              }}
              className="hover:text-coral-500 transition flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Semua Event</span>
            </button>
            <span>/</span>
            <span className="text-slate-400 capitalize">
              {currentEvent.category || "Konser"}
            </span>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[260px]">
              {currentEvent.eventName}
            </span>
          </div>

          {/* 2-Column Balanced Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* KOLOM KIRI (7 KOLOM): INFORMASI EVENT & PILIHAN KATEGORI TIKET */}
            <div className="lg:col-span-7 space-y-6">
              {/* Event Banner & Info Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div
                  className="w-full h-48 sm:h-56 bg-cover bg-center relative p-5 flex flex-col justify-between text-white"
                  style={{
                    backgroundImage: currentEvent.imageIpfsCid
                      ? `linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%), url(${currentEvent.imageIpfsCid})`
                      : "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
                  }}
                >
                  <span className="self-start px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/70 backdrop-blur-md text-white border border-white/20 capitalize">
                    {currentEvent.category || "Konser Resmi"}
                  </span>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                      {currentEvent.eventName}
                    </h1>
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="w-full border-t border-dashed border-slate-200" />

                {/* Event Metadata Strip */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Jadwal Acara
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                      <span>{eventDateFormatted}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Lokasi Venue
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                      <span className="truncate">{currentEvent.venueLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Category Selector */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                    Pilih Kategori Tiket
                  </h2>
                  <span className="text-xs text-slate-500">
                    {isQuotaFull
                      ? "Batas kuota tercapai"
                      : `Maks. ${MAX_PER_WALLET} tiket/akun`}
                  </span>
                </div>

                <div className="space-y-3">
                  {activeCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "border-coral-500 bg-coral-50/20 ring-1 ring-coral-500 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-sm font-bold ${
                                isSelected ? "text-coral-600" : "text-slate-900"
                              }`}
                            >
                              {cat.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {cat.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{cat.description}</p>
                          <p className="text-[11px] text-slate-400">
                            Alokasi Kursi:{" "}
                            <span className="font-medium text-slate-600">
                              {cat.rowPrefix}-0{ownedCountForCurrentEvent + 1}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="text-base font-extrabold text-slate-900 font-mono block">
                              Rp {cat.price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                              Tersedia
                            </span>
                          </div>

                          {isSelected && !isQuotaFull ? (
                            <div
                              className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity((q) => Math.max(1, q - 1))
                                }
                                disabled={safeQuantity <= 1 || isLoading}
                                className="w-7 h-7 flex items-center justify-center font-bold text-coral-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-bold text-xs text-slate-900 font-mono">
                                {safeQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity((q) =>
                                    Math.min(remainingQuota, q + 1)
                                  )
                                }
                                disabled={
                                  safeQuantity >= remainingQuota || isLoading
                                }
                                className="w-7 h-7 flex items-center justify-center font-bold text-coral-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-coral-500 text-coral-600 hover:bg-coral-500 hover:text-white transition cursor-pointer"
                            >
                              Pilih
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Syarat Pembelian Ringkas */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 block">
                  Ketentuan Tiket:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Batas maksimal {MAX_PER_WALLET} tiket per akun pembeli.</li>
                  <li>
                    Tiket digital langsung diterbitkan ke akun resmi Anda setelah
                    pembayaran terkonfirmasi.
                  </li>
                  <li>
                    Tunjukkan QR Code tiket pada menu &quot;Tiket Saya&quot; saat
                    memasuki lokasi acara.
                  </li>
                </ul>
              </div>
            </div>

            {/* KOLOM KANAN (5 KOLOM): SLIM CHECKOUT PANEL */}
            <aside className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Rincian Pembayaran
                </h2>

                {/* Flash Sale Chip */}
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-[#92400E] font-semibold">
                  <span>⚡ Flash Sale Terbuka</span>
                  <span className="font-mono font-bold">
                    {timeLeft.isStarted
                      ? "00:14:32"
                      : `${String(timeLeft.hours).padStart(2, "0")}:${String(
                          timeLeft.minutes
                        ).padStart(2, "0")}:${String(timeLeft.seconds).padStart(
                          2,
                          "0"
                        )}`}
                  </span>
                </div>

                {/* Bill Breakdown Table */}
                <div className="space-y-2.5 py-3 border-y border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {selectedCategory.name} ({safeQuantity} Tiket)
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Layanan & Pembayaran</span>
                    <span className="font-semibold text-teal-600">
                      Rp 0 (Gratis)
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold">
                    <span className="text-slate-900 text-sm">Total Tagihan</span>
                    <span className="text-lg font-extrabold text-coral-500 font-mono">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Penerima Tiket */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Wallet className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                    <span>Akun Penerima:</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 text-[11px] truncate max-w-[140px]">
                    {activeWallet
                      ? `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`
                      : "Perlu Aktivasi"}
                  </span>
                </div>

                {/* Error Alert */}
                {result && !result.success && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Pembayaran Gagal</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {result.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkout Action Button */}
                {!isLoggedIn ? (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 transition shadow-xs text-xs sm:text-sm cursor-pointer"
                  >
                    <span>Masuk untuk Membeli</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : !activeWallet ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-coral-50 border border-coral-200 text-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-coral-700">
                        <Key className="w-3.5 h-3.5 text-coral-600" />
                        <span>Aktivasi Passkey Diperlukan</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Gunakan sensor biometrik atau PIN perangkat untuk
                        mengamankan tiket Anda.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleActivateWallet}
                      disabled={isActivatingWallet}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 disabled:opacity-50 transition shadow-xs text-xs sm:text-sm cursor-pointer"
                    >
                      {isActivatingWallet ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menghubungkan Sensor...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Aktifkan Dompet (Passkey)</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="cf-turnstile my-1 flex justify-center"
                      data-sitekey={
                        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                        "1x00000000000000000000AA"
                      }
                      data-callback="onTurnstileSuccess"
                      data-theme="light"
                    />

                    <button
                      type="button"
                      onClick={handleBuyTicket}
                      disabled={
                        isLoading ||
                        isQuotaFull ||
                        !timeLeft.isStarted ||
                        !turnstileToken
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm shadow-xs cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses Pembayaran...</span>
                        </>
                      ) : !timeLeft.isStarted ? (
                        <span>Menunggu Waktu Flash Sale...</span>
                      ) : isQuotaFull ? (
                        <span>Batas Kuota Tercapai</span>
                      ) : !turnstileToken ? (
                        <span>Menunggu Verifikasi Manusia...</span>
                      ) : (
                        <span>Beli Tiket Sekarang</span>
                      )}
                    </button>
                  </>
                )}

                {/* Share Event Link */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Bagikan event ini</span>
                  <button
                    type="button"
                    onClick={handleShareEvent}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-700 cursor-pointer font-medium"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? "Tersalin!" : "Salin Link"}</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* MODAL PEMBAYARAN SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Ikon Centang Eye-Catching Coral Tunggal */}
            <div className="w-12 h-12 rounded-full bg-coral-50 flex items-center justify-center text-coral-500">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Judul & Pesan Ringkas */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Pembayaran Berhasil!
              </h3>
              <p className="text-xs text-slate-500">
                Tiket resmi pesananmu telah diterbitkan.
              </p>
            </div>

            {/* Struk 3 Baris Esensial */}
            <div className="w-full bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Acara</span>
                <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                  {currentEvent.eventName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kategori</span>
                <span className="font-semibold text-slate-900">
                  {selectedCategory.name} ({safeQuantity} Tiket)
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">Total Bayar</span>
                <span className="font-extrabold text-coral-500 font-mono text-sm">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="w-full space-y-2 pt-1">
              <Link
                href="/dashboard/tickets"
                onClick={() => setShowSuccessModal(false)}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-coral-500 hover:bg-coral-600 active:scale-[0.99] text-white text-xs font-semibold text-center transition shadow-xs"
              >
                Lihat Tiket Saya
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-600 border border-slate-200 text-xs font-medium text-center transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
