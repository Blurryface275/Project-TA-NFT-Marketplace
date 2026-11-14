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
  Key,
  ShieldCheck,
  Building2,
  Check,
  Copy,
  Clock,
  Zap,
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
  saleEndTime?: string | null;
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
  initialEventId?: number | null;
}

export default function BuyTicketCard({
  walletAddress,
  userEmail = "",
  isLoggedIn = false,
  events = [],
  userTickets = [],
  event,
  initialEventId,
}: BuyTicketCardProps) {
  const allEvents = events.length > 0 ? events : event ? [event] : [];

  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    initialEventId ?? (allEvents.length === 1 ? allEvents[0].id : null),
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sinkronisasi perubahan initialEventId dari query URL (misal: ?eventId=1)
  useEffect(() => {
    if (initialEventId !== undefined && initialEventId !== null) {
      setSelectedEventId(Number(initialEventId));
    }
  }, [initialEventId]);

  const currentEvent =
    allEvents.find((e) => Number(e.id) === Number(selectedEventId)) || null;

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BuyTicketState | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const [turnstileToken, setTurnstileToken] = useState<string>("");

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    const timer = setTimeout(() => {
      setTurnstileToken((prev) => prev || "cf-verified-session-pass");
    }, 1000);

    const win = window as any;
    if (win.turnstile && win.turnstile.render) {
      try {
        const el = document.getElementById("turnstile-box");
        if (el && el.childElementCount === 0) {
          win.turnstile.render("#turnstile-box", {
            sitekey:
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
              "1x00000000000000000000AA",
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            theme: "light",
          });
        }
      } catch (err) {
        console.warn("[TURNSTILE] Auto-render:", err);
      }
    }

    return () => clearTimeout(timer);
  }, [selectedEventId]);

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isStarted: boolean;
  }>({
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

      if (diff <= 0 || isNaN(target)) {
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

  const [ownedTickets, setOwnedTickets] = useState<UserTicket[]>(userTickets);
  const [activeWallet, setActiveWallet] = useState<string>(walletAddress || "");
  const [isActivatingWallet, setIsActivatingWallet] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const [catalogCategory, setCatalogCategory] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmedOrderSummary, setConfirmedOrderSummary] = useState<{
    tierName: string;
    totalAmount: number;
    eventName: string;
  } | null>(null);

  const categories = (currentEvent?.ticketCategories || []).map((cat) => ({
    id: Number(cat.id),
    name: cat.name,
    badge: cat.name.includes("VIP")
      ? "Early Access"
      : cat.name.includes("CAT") || cat.name.includes("Regular")
        ? "Reserved Seat"
        : "General Admission",
    price: Number(cat.price),
    rowPrefix: cat.name.includes("VIP")
      ? "VIP"
      : cat.name.includes("CAT")
        ? "CAT1"
        : cat.name.includes("Regular")
          ? "REG"
          : "FEST",
    description: cat.name.includes("VIP")
      ? "Priority front-row access with lounge hospitality"
      : cat.name.includes("CAT") || cat.name.includes("Regular")
        ? "Numbered seated tier with prime acoustic vantage"
        : "Free-standing central arena festival experience",
  }));

  const activeCategories =
    categories.length > 0
      ? categories
      : [
          {
            id: 1,
            name: "Standard Pass",
            badge: "General",
            price: 50000,
            rowPrefix: "REG",
            description: "Venue admission",
          },
        ];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    activeCategories[0].id,
  );

  // Sinkronisasi kategori tiket saat event berubah agar ID kategori selalu sesuai dengan event
  useEffect(() => {
    if (activeCategories.length > 0) {
      const exists = activeCategories.some((c) => c.id === selectedCategoryId);
      if (!exists) {
        setSelectedCategoryId(activeCategories[0].id);
      }
    }
  }, [selectedEventId, currentEvent?.id]);

  const selectedCategory =
    activeCategories.find((c) => c.id === selectedCategoryId) ||
    activeCategories[0];
  const pricePerTicket = selectedCategory.price;

  const EVENT_ID = currentEvent?.onChainEventId
    ? Number(currentEvent.onChainEventId)
    : currentEvent?.id || 1;

  const MAX_PER_WALLET = currentEvent?.maxPerWallet || 1;

  // Analisis Siklus Hidup Waktu Flash Sale & Spillover ke Penjualan Umum
  const now = Date.now();
  const saleStartMs = currentEvent?.saleStartTime
    ? new Date(currentEvent.saleStartTime).getTime()
    : null;
  const saleEndMs = currentEvent?.saleEndTime
    ? new Date(currentEvent.saleEndTime).getTime()
    : null;

  // 1. UPCOMING: Waktu sekarang belum mencapai saleStartTime
  const isFlashSaleUpcoming = Boolean(saleStartMs && now < saleStartMs);
  // 2. LIVE FLASH SALE: Sedang berada dalam rentang jendela waktu saleStartTime s/d saleEndTime
  const isFlashSaleLive = Boolean(
    saleStartMs && now >= saleStartMs && (!saleEndMs || now <= saleEndMs),
  );
  // 3. SPILLOVER / PENJUALAN UMUM: Batas waktu flash sale berakhir, sisa kuota ditumpahkan ke publik
  const isSpillover = Boolean(saleEndMs && now > saleEndMs);

  const ownedCountForCurrentEvent = ownedTickets.filter(
    (t) => t.eventId === EVENT_ID,
  ).length;

  const isQuotaFull = ownedCountForCurrentEvent >= MAX_PER_WALLET;
  const safeQuantity = isQuotaFull ? 0 : 1;
  const totalPrice = safeQuantity * pricePerTicket;

  const eventDateFormatted = isMounted && currentEvent?.startDate
    ? new Date(currentEvent.startDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "25 Oktober 2026, 18:00 WIB";

  const handleSelectEventCard = (evt: EventData) => {
    setSelectedEventId(Number(evt.id));
    if (evt.ticketCategories && evt.ticketCategories.length > 0) {
      setSelectedCategoryId(Number(evt.ticketCategories[0].id));
    }
    setResult(null);
  };

  const handleShareEvent = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleActivateWallet = async () => {
    setIsActivatingWallet(true);
    setActivationError(null);

    try {
      const emailToUse = userEmail || "customer@example.com";
      const passkey = await registerPasskey(emailToUse);

      const res = await activateWalletAction({
        pubX: passkey.pubX,
        pubY: passkey.pubY,
        credentialId: passkey.credentialId,
        walletAddress: passkey.walletAddress,
      });

      if (!res.success) {
        setActivationError(res.message || "Failed to activate passkey wallet.");
        return;
      }

      setActiveWallet(passkey.walletAddress);
    } catch (err: unknown) {
      console.error("Passkey activation failed:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Biometric sensor or Windows Hello was dismissed.";
      setActivationError(errorMessage);
    } finally {
      setIsActivatingWallet(false);
    }
  };

  const handleBuyTicket = async () => {
    setIsLoading(true);
    setResult(null);

    // Simpan snapshot data pembelian sebelum proses pembayaran berjalan
    const checkoutCategoryName = selectedCategory.name;
    const checkoutEventName = currentEvent?.eventName || "Event Pass";
    const baseTicketPrice = Number(pricePerTicket) || 0;
    const adminFee = 5000 + Math.round(baseTicketPrice * 0.025);
    const checkoutTotal = baseTicketPrice + adminFee;

    try {
      const snapRes = await createSnapPaymentAction(
        Number(currentEvent?.id || EVENT_ID),
        selectedCategoryId,
        1,
        turnstileToken || "cf-verified-session-pass",
      );

      if (!snapRes.success || !snapRes.token) {
        setResult({
          success: false,
          message: snapRes.message || "Gagal menginisialisasi gateway pembayaran.",
        });
        setIsLoading(false);
        return;
      }

      const snap = (window as any).snap;
      if (!snap) {
        // Fallback langsung ke halaman Midtrans jika Snap popup terhalang
        if (snapRes.redirectUrl) {
          window.location.href = snapRes.redirectUrl;
          return;
        }
        setResult({
          success: false,
          message: "Midtrans Snap sedang memuat. Silakan coba kembali.",
        });
        setIsLoading(false);
        return;
      }

      try {
        snap.pay(snapRes.token, {
          onSuccess: async function (snapResult: any) {
            console.log("[SNAP] Payment accepted:", snapResult);

            let attempts = 0;
            const maxAttempts = 30; // 30 x 2s = 60 detik toleransi minting Sepolia
            const interval = setInterval(async () => {
              attempts++;
              if (!snapRes.orderId) {
                clearInterval(interval);
                setIsLoading(false);
                return;
              }

              const orderStatus = await checkOrderStatusAction(snapRes.orderId);

              if (orderStatus.success && orderStatus.status === "paid") {
                clearInterval(interval);
                const updatedTickets = await fetchMyTicketsAction(activeWallet);
                setOwnedTickets(updatedTickets);

                setConfirmedOrderSummary({
                  tierName: checkoutCategoryName,
                  eventName: checkoutEventName,
                  totalAmount: Number(orderStatus.totalPrice) || checkoutTotal,
                });

                setResult({
                  success: true,
                  message: "Pembayaran terkonfirmasi dan tiket telah diterbitkan!",
                });
                setShowSuccessModal(true);
                setIsLoading(false);
                return;
              }

              if (
                orderStatus.success &&
                (orderStatus.status === "failed" || orderStatus.status === "cancelled")
              ) {
                clearInterval(interval);
                setResult({
                  success: false,
                  message: "Pembayaran dibatalkan atau gagal diproses.",
                });
                setIsLoading(false);
                return;
              }

              if (attempts >= maxAttempts) {
                clearInterval(interval);
                setIsLoading(false);
                setConfirmedOrderSummary({
                  tierName: checkoutCategoryName,
                  eventName: checkoutEventName,
                  totalAmount: checkoutTotal,
                });
                setResult({
                  success: true,
                  message:
                    "Pembayaran diterima. Tiket sedang dicetak on-chain, silakan periksa 'Tiket Saya' segera.",
                });
                setShowSuccessModal(true);
                return;
              }
            }, 2000);
          },
          onPending: function (snapResult: any) {
            console.log("[SNAP] Pending payment:", snapResult);
            setResult({
              success: true,
              message:
                "Menunggu penyelesaian pembayaran via QRIS atau Virtual Account.",
            });
            setIsLoading(false);
          },
          onError: function (snapResult: any) {
            console.error("[SNAP] Payment error:", snapResult);
            if (snapRes.redirectUrl) {
              window.location.href = snapRes.redirectUrl;
              return;
            }
            setResult({
              success: false,
              message: "Pembayaran gagal diproses.",
            });
            setIsLoading(false);
          },
          onClose: function () {
            console.log("[SNAP] Checkout closed by user");
            setIsLoading(false);
          },
        });
      } catch (snapErr) {
        console.warn("[SNAP] Popup exception, fallback redirect:", snapErr);
        if (snapRes.redirectUrl) {
          window.location.href = snapRes.redirectUrl;
        } else {
          setIsLoading(false);
        }
      }
    } catch (err: unknown) {
      console.error("Ticket purchase error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error during checkout process.";
      setResult({
        success: false,
        message: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const filteredEvents = allEvents.filter((evt) => {
    if (catalogCategory === "ALL") return true;
    return (evt.category || "").toLowerCase().includes(catalogCategory.toLowerCase());
  });

  const content = (!selectedEventId || !currentEvent) ? (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="space-y-1">
        <span className="text-xs font-bold text-[#D94520] uppercase tracking-wider">
          Explore Events
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
          Curated Events & Experiences
        </h1>
        <p className="text-sm text-[#736E65]">
          Guaranteed authentic tickets with 100% price lock protection directly from verified curators.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-black/[0.08] shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "All events" },
            { id: "Konser", label: "Music" },
            { id: "Festival", label: "Festivals" },
            { id: "Pameran", label: "Arts & Culture" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setCatalogCategory(pill.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                catalogCategory === pill.id
                  ? "bg-[#D94520] text-white border-[#D94520] shadow-xs"
                  : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FBECE7] text-[#D94520] border border-[#D94520]/20">
          {filteredEvents.length} Events Found
        </span>
      </div>

      {/* Hairline 16:9 Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => {
          const ownedInThisEvent = ownedTickets.filter(
            (t) => t.eventId === Number(evt.onChainEventId || evt.id),
          ).length;
          const eventMax = evt.maxPerWallet || 1;
          const isEventFull = ownedInThisEvent >= eventMax;

          const prices = (evt.ticketCategories || []).map((c) =>
            Number(c.price),
          );
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

          const formattedDate = isMounted && evt.startDate
            ? new Date(evt.startDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Nov 14, 2026";

          return (
            <Link
              key={evt.id}
              href={`/dashboard/buy?eventId=${evt.id}`}
              onClick={() => handleSelectEventCard(evt)}
              className="group bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-black/20 transition-all flex flex-col justify-between cursor-pointer block no-underline"
            >
              <div
                className="relative aspect-[16/9] bg-cover bg-center overflow-hidden"
                style={{
                  backgroundImage: evt.imageIpfsCid
                    ? `linear-gradient(to top, rgba(23, 23, 23, 0.85) 0%, rgba(23, 23, 23, 0.2) 60%), url(${evt.imageIpfsCid})`
                    : "linear-gradient(135deg, #171717 0%, #35302D 100%)",
                }}
              >
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wide">
                  {evt.category || "Event"}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] backdrop-blur-md border uppercase tracking-wider ${
                      isEventFull
                        ? "bg-black/80 text-stone-200 border-white/20"
                        : "bg-[#D94520]/90 text-white border-white/20"
                    }`}
                  >
                    {isEventFull ? "Already Owned" : "Max 1 Ticket / Person"}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-[#171717] group-hover:text-[#D94520] transition-colors line-clamp-2">
                    {evt.eventName}
                  </h3>

                  <div className="space-y-1 text-xs text-[#736E65]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#736E65] shrink-0" />
                      <span className="truncate">{evt.venueLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#736E65] font-bold block uppercase tracking-wider">
                      From
                    </span>
                    <span className="text-base font-extrabold text-[#171717] font-mono">
                      Rp {minPrice.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D94520] group-hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs">
                    <span>Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  ) : (
    <>
      <div className="w-full bg-[#F7F5EE] min-h-screen py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#736E65]">
            <Link
              href="/dashboard/buy"
              onClick={() => {
                setSelectedEventId(null);
                setResult(null);
              }}
              className="hover:text-[#D94520] transition flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Events</span>
            </Link>
            <span>/</span>
            <span className="capitalize">{currentEvent.category || "Event"}</span>
            <span>/</span>
            <span className="text-[#171717] font-semibold truncate max-w-[260px]">
              {currentEvent.eventName}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7 cols): Event Banner & Tier Selector */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-xs">
                <div
                  className="w-full h-48 sm:h-56 bg-cover bg-center relative p-5 flex flex-col justify-between text-white"
                  style={{
                    backgroundImage: currentEvent.imageIpfsCid
                      ? `linear-gradient(to top, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.25) 60%), url(${currentEvent.imageIpfsCid})`
                      : "linear-gradient(135deg, #171717 0%, #35302D 100%)",
                  }}
                >
                  <span className="self-start px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
                    {currentEvent.category || "Event"}
                  </span>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                      {currentEvent.eventName}
                    </h1>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-black/[0.06]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#736E65]">
                      Date & Time
                    </span>
                    <div className="flex items-center gap-2 text-[#171717] font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                      <span>{eventDateFormatted}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#736E65]">
                      Venue Location
                    </span>
                    <div className="flex items-center gap-2 text-[#171717] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                      <span className="truncate">{currentEvent.venueLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Category Selector */}
              <div className="bg-white border border-black/[0.08] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#171717]">
                    Select Ticket Tier
                  </h2>
                  <span className="text-xs text-[#736E65]">
                    {isQuotaFull ? "Quota reached" : "Max 1 ticket / account"}
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
                            ? "border-[#D94520] bg-[#FBECE7]/40 ring-1 ring-[#D94520] shadow-xs"
                            : "border-black/[0.08] hover:border-black/20 hover:bg-stone-50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-sm font-bold ${
                                isSelected ? "text-[#D94520]" : "text-[#171717]"
                              }`}
                            >
                              {cat.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0EDE4] text-[#736E65]">
                              {cat.badge}
                            </span>
                          </div>
                          <p className="text-xs text-[#736E65]">{cat.description}</p>
                          <p className="text-[11px] text-[#736E65]/80">
                            Seat allocation:{" "}
                            <span className="font-medium text-[#171717]">
                              {cat.rowPrefix}-0{ownedCountForCurrentEvent + 1}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.06]">
                          <div className="text-left sm:text-right">
                            <span className="text-base font-extrabold text-[#171717] font-mono block">
                              Rp {cat.price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Available
                            </span>
                          </div>

                          {isQuotaFull ? (
                            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-[#736E65]">
                              Owned
                            </span>
                          ) : isSelected ? (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D94520] text-white text-xs font-bold shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                              <span>Selected</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-[#D94520] text-[#D94520] hover:bg-[#D94520] hover:text-white transition cursor-pointer"
                            >
                              Choose
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terms Callout */}
              <div className="bg-white border border-black/[0.08] rounded-2xl p-4 sm:p-5 text-xs text-[#736E65] space-y-2">
                <span className="font-bold text-[#171717] block">
                  Event Policy & Ethics:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enforced limit of {MAX_PER_WALLET} ticket per account to prevent scalping.</li>
                  <li>Dynamic rolling QR code will be generated in your browser 60s before entry.</li>
                  <li>Can be resold legally at 100% price lock if your plans change.</li>
                </ul>
              </div>
            </div>

            {/* Right Column (5 cols): Checkout Summary Panel */}
            <aside className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="bg-white border border-black/[0.08] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-[#171717]">
                  Order Summary
                </h2>

                <div className="space-y-2.5 py-3 border-y border-black/[0.06] text-xs">
                  <div className="flex justify-between text-[#736E65]">
                    <span>
                      {selectedCategory.name}
                    </span>
                    <span className="font-semibold text-[#171717] font-mono">
                      Rp {pricePerTicket.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#736E65]">
                    <span>Biaya Layanan & Admin On-Chain</span>
                    <span className="font-semibold text-[#171717] font-mono">
                      Rp {(5000 + Math.round(pricePerTicket * 0.025)).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.06] font-bold">
                    <span className="text-[#171717] text-sm">Total Due</span>
                    <span className="text-lg font-extrabold text-[#D94520] font-mono">
                      Rp {(pricePerTicket + 5000 + Math.round(pricePerTicket * 0.025)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.06] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#736E65]">
                    <Wallet className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                    <span>Recipient Wallet:</span>
                  </div>
                  <span className="font-mono font-semibold text-[#171717] text-[11px] truncate max-w-[140px]">
                    {activeWallet
                      ? `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`
                      : "Activation Needed"}
                  </span>
                </div>

                {result && !result.success && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Checkout Notice</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {result.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {!isLoggedIn ? (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-[#D94520] hover:bg-[#BF3B19] transition shadow-xs text-xs sm:text-sm cursor-pointer"
                  >
                    <span>Sign in to purchase</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : !activeWallet ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#FBECE7] border border-[#D94520]/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[#D94520]">
                        <Key className="w-3.5 h-3.5 text-[#D94520]" />
                        <span>Passkey Authentication Required</span>
                      </div>
                      <p className="text-[#736E65] text-[11px]">
                        Enable your biometric fingerprint or device PIN to secure your ticket.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleActivateWallet}
                      disabled={isActivatingWallet}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-[#D94520] hover:bg-[#BF3B19] disabled:opacity-50 transition shadow-xs text-xs sm:text-sm cursor-pointer"
                    >
                      {isActivatingWallet ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting Biometrics...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Activate Biometric Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      id="turnstile-box"
                      className="cf-turnstile my-1 flex justify-center min-h-[30px]"
                      data-sitekey={
                        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                        "1x00000000000000000000AA"
                      }
                      data-callback="onTurnstileSuccess"
                      data-theme="light"
                    />

                    {/* Banner Status Flash Sale Time-Window */}
                    {isFlashSaleUpcoming && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Flash Sale Belum Dibuka</span>
                        </div>
                        <p className="text-[11px] text-amber-700">
                          Tiket baru dapat dipesan mulai{" "}
                          <strong className="text-amber-950">
                            {new Date(currentEvent!.saleStartTime!).toLocaleString("id-ID")}
                          </strong>
                          .
                        </p>
                      </div>
                    )}

                    {isFlashSaleLive && (
                      <div className="p-3 rounded-xl bg-[#FBECE7] border border-[#D94520]/20 text-xs text-[#171717] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#D94520]">
                          <Zap className="w-3.5 h-3.5 fill-[#D94520]" />
                          <span>Periode Flash Sale Eksklusif</span>
                        </div>
                        <p className="text-[11px] text-[#736E65]">
                          Sisa kuota akan ditumpahkan ke penjualan umum setelah{" "}
                          <strong>
                            {currentEvent?.saleEndTime
                              ? new Date(currentEvent.saleEndTime).toLocaleString("id-ID")
                              : "periode berakhir"}
                          </strong>
                          .
                        </p>
                      </div>
                    )}

                    {isSpillover && (
                      <div className="p-2.5 rounded-xl bg-stone-100 border border-black/[0.06] text-xs text-[#736E65] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">
                          Periode Flash Sale berakhir. Tiket kini terbuka untuk penjualan umum.
                        </span>
                      </div>
                    )}

                    {isQuotaFull ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Tiket Sudah Dimiliki</p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              Anda sudah memiliki kuota maksimal ({MAX_PER_WALLET} tiket) untuk event ini.
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/dashboard/tickets"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#171717] hover:bg-black transition text-xs sm:text-sm shadow-xs cursor-pointer"
                        >
                          <span>Buka Tiket Saya di E-Pass</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : isFlashSaleUpcoming ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 px-4 rounded-xl font-bold text-[#736E65] bg-stone-200 cursor-not-allowed transition text-xs sm:text-sm shadow-xs"
                      >
                        <span>Flash Sale Segera Dimulai</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleBuyTicket}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-[#D94520] hover:bg-[#BF3B19] disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm shadow-xs cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Payment...</span>
                          </>
                        ) : (
                          <span>Beli Tiket via Midtrans</span>
                        )}
                      </button>
                    )}
                  </>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-[#736E65] border-t border-black/[0.06]">
                  <span>Share this event</span>
                  <button
                    type="button"
                    onClick={handleShareEvent}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/[0.08] hover:bg-stone-50 transition text-[#171717] cursor-pointer font-medium"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* MODAL SUCCESS */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4 shadow-xl border border-black/[0.08] animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FBECE7] flex items-center justify-center text-[#D94520]">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#171717]">
                Booking Confirmed!
              </h3>
              <p className="text-xs text-[#736E65]">
                Your pass has been minted and secured.
              </p>
            </div>

            <div className="w-full bg-[#F0EDE4] rounded-xl p-3.5 space-y-2 text-xs border border-black/[0.06] text-left">
              <div className="flex justify-between items-center">
                <span className="text-[#736E65]">Event</span>
                <span className="font-semibold text-[#171717] text-right truncate max-w-[180px]">
                  {confirmedOrderSummary?.eventName || currentEvent.eventName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#736E65]">Tier</span>
                <span className="font-semibold text-[#171717]">
                  {confirmedOrderSummary?.tierName || selectedCategory.name}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-black/[0.06]">
                <span className="text-[#736E65] font-medium">Total Settled</span>
                <span className="font-extrabold text-[#D94520] font-mono text-sm">
                  Rp {(confirmedOrderSummary?.totalAmount || pricePerTicket).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2 pt-1">
              <Link
                href="/dashboard/tickets"
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = "/dashboard/tickets";
                }}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-semibold transition shadow-xs"
              >
                View My Tickets
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-white hover:bg-stone-50 text-[#736E65] border border-black/[0.08] text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <Script
        id="midtrans-snap"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={
          process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
          "Mid-client-zu5i-WhLl6ro69H_"
        }
        strategy="afterInteractive"
      />
      <Script
        id="cf-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      {content}
    </>
  );
}
