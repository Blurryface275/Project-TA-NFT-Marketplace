"use client";

import { useState } from "react";
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
      // Minta Snap Token dari backend via Server Action
      const snapRes = await createSnapPaymentAction(
        EVENT_ID,
        selectedCategoryId,
        safeQuantity,
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

            // Sukses: Transaksi Lunas & tiket otomatis tercetak di jaringan blockchain
            if (orderStatus.success && orderStatus.status === "paid"){
              clearInterval(interval);

              // update data tiket yang sudah di beli
              const updatedTickets = await fetchMyTicketsAction(activeWallet);
              setOwnedTickets(updatedTickets);

              setResult({
                success: true,
                message: "Pembayaran berhasil dan tiket NFT telah resmi diterbitkan di Sepolia!",
              });
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
                message: "Pembayaran telah diterima Midtrans. Tiket sedang diproses oleh blockchain relayer, silakan periksa berkala di menu Tiket Saya.",
              });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
          {/* Header Katalog Loket.com */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Jelajahi Event & Konser
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Beli tiket resmi berbasis Smart Account NFT blockchain yang dijamin 100% bebas calo.
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
      <div className="w-full bg-[#f8fafc] min-h-screen">
        {/* LOKET.COM HERO BANNER (Clean Dark Navy #0b1b36) */}
        <div className="w-full bg-[#0b1b36] text-white py-10 sm:py-12 lg:py-14 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigasi Breadcrumb Loket */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedEventId(null);
                  setResult(null);
                }}
                className="hover:text-white transition flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Semua Event</span>
              </button>
              <span>/</span>
              <span className="text-slate-400">
                {currentEvent.category || "Konser & Musik"}
              </span>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[280px]">
                {currentEvent.eventName}
              </span>
            </div>

            {/* Grid Hero Loket: Kiri Judul & Meta (8 Kolom), Kanan Spacer (4 Kolom) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                  {currentEvent.eventName}
                </h1>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{currentEvent.venueLocation}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{eventDateFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Spacer kanan untuk desktop (area floating card) */}
              <div className="hidden lg:block lg:col-span-4" />
            </div>
          </div>
        </div>

        {/* LOKET.COM 2-COLUMN BODY CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* SISI KIRI (8 KOLOM): TABS & KONTEN */}
            <div className="lg:col-span-8 space-y-6">
              {/* Tab Navigation Loket.com exact */}
              <div className="flex items-center gap-8 border-b border-slate-200 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("deskripsi")}
                  className={`pb-3 font-bold transition cursor-pointer relative ${
                    activeTab === "deskripsi"
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-[1px]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Deskripsi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tiket")}
                  className={`pb-3 font-bold transition cursor-pointer relative flex items-center gap-1.5 ${
                    activeTab === "tiket"
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-[1px]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>Tiket</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                    {activeCategories.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("terms")}
                  className={`pb-3 font-bold transition cursor-pointer relative ${
                    activeTab === "terms"
                      ? "text-blue-600 border-b-2 border-blue-600 -mb-[1px]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Syarat dan Ketentuan
                </button>
              </div>

              {/* TAB 1: DESKRIPSI (Struktur paragraf lengkap sesuai Loket.com) */}
              {activeTab === "deskripsi" && (
                <div className="space-y-5 text-sm text-slate-700 leading-relaxed bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p>
                    Workshop ini diadakan pada hari/tanggal : <strong>{eventDateFormatted}</strong>.{" "}
                    <strong>{currentEvent.eventName}</strong> hadir sebagai ruang belajar praktis bagi Anda yang ingin membangun fondasi mengajar yang kuat, mulai dari langkah paling dasar hingga siap tampil di depan kelas dengan lebih tenang.
                  </p>
                  <p>
                    Dalam workshop ini, peserta akan mempelajari teknik dasar memegang dan membunyikan angklung, mengenal nada serta notasi angka, dan memahami cara kerja angklung sebagai alat musik yang dimainkan bersama-sama. Peserta juga akan dibekali cara memperkenalkan lagu sederhana kepada murid, mengatur kelompok, memberi aba-aba yang jelas, serta menjaga ritme permainan agar tetap kompak.
                  </p>
                  <p>
                    Selain keterampilan teknis, Anda akan mendapatkan tips menyusun materi latihan bertahap, mengelola kelas, dan menumbuhkan semangat belajar murid sejak pertemuan pertama. Pendekatan ini membantu guru pemula menghindari kebingungan umum saat mulai mengajar, sehingga proses latihan terasa lebih terarah dan menyenangkan.
                  </p>
                  <p>
                    Seluruh sesi disampaikan dengan metode praktik langsung sehingga mudah diikuti, bahkan bagi Anda yang belum memiliki pengalaman mengajar sebelumnya. Setiap peserta akan didampingi agar dapat mencoba, bertanya, dan berdiskusi secara terbuka bersama sesama calon pengajar dari berbagai daerah.
                  </p>
                  <p>
                    Angklung adalah warisan budaya yang diakui UNESCO dan layak terus hidup melalui tangan para pengajar yang bersemangat. Bergabunglah bersama kami untuk menambah bekal, memperluas jejaring, dan memperoleh keyakinan baru dalam mengajar. Jadilah bagian dari generasi pengajar yang melestarikan angklung dengan penuh kreativitas, kesabaran, dan kebanggaan. Daftarkan diri Anda sekarang dan mulailah langkah pertama Anda bersama komunitas yang saling mendukung.
                  </p>
                </div>
              )}

              {/* TAB 2: TIKET (Loket.com Standard Ticket Container) */}
              {activeTab === "tiket" && (
                <div className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between pb-1">
                    <h2 className="text-xl font-bold text-slate-900">Tiket</h2>
                    <span className="text-xs text-slate-500">
                      {isQuotaFull
                        ? "Batas kuota event tercapai"
                        : `Maksimal ${MAX_PER_WALLET} tiket per akun`}
                    </span>
                  </div>

                  {/* Loket.com Accordion Ticket Box */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {/* Group Header Bar */}
                    <div className="bg-[#f0f4f8] px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                          TIKET MASUK RESMI
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activeCategories.length} kategori tiket • Harga mulai dari Rp {currentMinPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>

                    {/* Ticket Rows */}
                    <div className="divide-y divide-slate-100">
                      {activeCategories.map((cat) => {
                        const isSelected = selectedCategoryId === cat.id;

                        return (
                          <div
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                              isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                            }`}
                          >
                            {/* Kolom 1: Harga Kiri */}
                            <div className="sm:w-32 shrink-0">
                              <span className="text-base font-bold text-slate-900 block">
                                Rp {cat.price.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Kolom 2: Nama & Batas Waktu */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold ${isSelected ? "text-blue-600" : "text-slate-900"}`}>
                                {cat.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Penjualan berakhir {eventDateFormatted} • 22.00 WIB
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Nomor Kursi: <span className="text-slate-600 font-medium">{cat.rowPrefix}-0{ownedCountForCurrentEvent + 1}</span>
                              </p>
                            </div>

                            {/* Kolom 3: Status Available & Stepper / Pilih */}
                            <div className="sm:w-40 shrink-0 flex items-center sm:justify-end gap-3">
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                                Available
                              </span>

                              {isSelected && !isQuotaFull ? (
                                <div
                                  className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={safeQuantity <= 1 || isLoading}
                                    className="w-7 h-7 flex items-center justify-center font-bold text-blue-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                                  >
                                    -
                                  </button>
                                  <span className="w-7 text-center font-semibold text-xs text-slate-900">
                                    {safeQuantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(remainingQuota, q + 1))}
                                    disabled={safeQuantity >= remainingQuota || isLoading}
                                    className="w-7 h-7 flex items-center justify-center font-bold text-blue-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategoryId(cat.id)}
                                  className="px-4 py-1.5 rounded text-xs font-semibold border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition cursor-pointer"
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

                  <p className="text-xs text-slate-400 pt-1">
                    * Pembelian tiket dibatasi maksimal {MAX_PER_WALLET} tiket per akun.
                  </p>
                </div>
              )}

              {/* TAB 3: SYARAT & KETENTUAN (Legal T&C Loket.com) */}
              {activeTab === "terms" && (
                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
                  <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                    Syarat & Ketentuan Acara
                  </h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Pembelian dibatasi maksimal <strong>{MAX_PER_WALLET} tiket</strong> per akun.
                    </li>
                    <li>
                      Tiket yang telah dibeli akan otomatis diterbitkan ke akun resmi pembeli.
                    </li>
                    <li>
                      Alokasi nomor kursi bersifat urut dan otomatis saat konfirmasi transaksi.
                    </li>
                    <li>
                      Saat memasuki pintu gerbang acara, pengunjung wajib menunjukkan QR Code tiket yang valid.
                    </li>
                    <li>
                      Penyelenggara berhak menolak tiket yang diperoleh di luar kanal penjualan resmi.
                    </li>
                  </ol>
                </div>
              )}

              {/* Rekomendasi Event Serupa Loket.com */}
              {allEvents.filter((e) => e.id !== currentEvent.id).length > 0 && (
                <div className="pt-6 space-y-4 border-t border-slate-200">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Event Lainnya Untuk Kamu
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allEvents
                      .filter((e) => e.id !== currentEvent.id)
                      .slice(0, 2)
                      .map((otherEvt) => (
                        <div
                          key={otherEvt.id}
                          onClick={() => handleSelectEventCard(otherEvt)}
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition cursor-pointer flex items-center gap-3 group"
                        >
                          <div
                            className="w-20 h-14 rounded-lg bg-cover bg-center shrink-0 border border-slate-100"
                            style={{
                              backgroundImage: otherEvt.imageIpfsCid
                                ? `url(${otherEvt.imageIpfsCid})`
                                : "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                            }}
                          />
                          <div className="overflow-hidden space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                              {otherEvt.eventName}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {otherEvt.venueLocation}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* SISI KANAN (4 KOLOM): FLOATING RIGHT CARD OVERLAPPING HERO BANNER */}
            <div className="lg:col-span-4 lg:-mt-44 relative z-20 space-y-4">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {/* 1. Poster Event (16:9 Aspect Video) */}
                <div
                  className="w-full aspect-video bg-cover bg-center relative overflow-hidden"
                  style={{
                    backgroundImage: currentEvent.imageIpfsCid
                      ? `url(${currentEvent.imageIpfsCid})`
                      : "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                  }}
                />

                {/* 2. Loket.com Price Bar & Beli Tiket Action */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Harga mulai dari
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                      {currentMinPrice === 0
                        ? "Gratis"
                        : `Rp ${currentMinPrice.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("tiket")}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Beli Tiket
                  </button>
                </div>

                {/* 3. Detail Event Body */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {currentEvent.eventName}
                  </h2>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{currentEvent.venueLocation}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{eventDateFormatted}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {currentEvent.category || "Konser & Musik"}
                      </span>
                    </div>
                  </div>

                  {/* 4. Organizer Box */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-xs overflow-hidden">
                      <span className="text-[11px] text-slate-400 block">
                        Diselenggarakan oleh
                      </span>
                      <strong className="text-slate-800 font-semibold truncate block">
                        {currentEvent.organizersId === 1
                          ? "BEM Universitas Surabaya"
                          : "Saung Angklung Udjo"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 5. Checkout Area (Aktif saat tab tiket dibuka) */}
                {activeTab === "tiket" && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {selectedCategory.name} (x{safeQuantity})
                        </span>
                        <span className="font-bold text-slate-900">
                          Rp {totalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Alokasi Kursi:</span>
                        <span className="font-semibold text-slate-800">
                          {safeQuantity === 1
                            ? `${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 1}`
                            : `${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 1}, ${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 2}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Biaya Layanan:</span>
                        <span className="font-medium text-emerald-600">
                          Rp 0
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Total Pembayaran
                        </span>
                        <span className="text-base font-bold text-blue-600">
                          Rp {totalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Penerima Tiket */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Wallet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Akun Penerima:</span>
                      </div>
                      <span
                        className="font-medium text-slate-800 truncate max-w-[140px] text-xs"
                        title={activeWallet || "Perlu Aktivasi"}
                      >
                        {activeWallet ? `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}` : "Belum Aktif"}
                      </span>
                    </div>

                    {/* Notifikasi Transaksi Sukses */}
                    {result?.success && (
                      <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-teal-800">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>{result.message || "Tiket Berhasil Dicetak!"}</span>
                        </div>
                        {result.txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block font-mono text-[11px] font-bold"
                          >
                            Cek Etherscan Sepolia
                          </a>
                        )}
                        <div className="pt-1 flex gap-2">
                          <Link
                            href="/dashboard/tickets"
                            className="flex-1 text-center py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
                          >
                            Lihat Tiket
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Notifikasi Transaksi Gagal */}
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

                    {/* Tombol Aksi Utama Checkout */}
                    {!isLoggedIn ? (
                      <Link
                        href="/login"
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm text-sm"
                      >
                        <span>Masuk untuk Membeli</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : !activeWallet ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-slate-800 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                            <Key className="w-3.5 h-3.5 text-blue-600" />
                            <span>Aktivasi Passkey Diperlukan</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-snug">
                            Gunakan sensor biometrik atau PIN perangkat untuk mengamankan tiket Anda.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleActivateWallet}
                          disabled={isActivatingWallet}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm text-sm cursor-pointer"
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
                      <button
                        type="button"
                        onClick={handleBuyTicket}
                        disabled={isLoading || isQuotaFull}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition cursor-pointer text-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memproses Pembayaran...</span>
                          </>
                        ) : isQuotaFull ? (
                          <span>Batas Kuota Tercapai</span>
                        ) : (
                          <span>Beli Tiket Sekarang</span>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Tombol Bagikan Event (Loket.com Style) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Bagikan Event
                </span>
                <button
                  type="button"
                  onClick={handleShareEvent}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition shadow-2xs cursor-pointer relative"
                  title="Salin Link Event"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedLink && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] whitespace-nowrap shadow-sm">
                      Tersalin!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
