"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Lock,
} from "lucide-react";
import { buyResaleTicketAction, checkResaleOrderStatusAction } from "../actions";
import { ResaleListingItem } from "../ResaleCatalogClient";

interface ResaleDetailClientProps {
  listing: ResaleListingItem;
  currentWallet: string;
}

export default function ResaleDetailClient({
  listing,
  currentWallet,
}: ResaleDetailClientProps) {
  const router = useRouter();
  const [isBuying, setIsBuying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const eventTitle =
    listing.ticketCache?.event?.eventName || "Curated Event";
  const venue =
    listing.ticketCache?.event?.venueLocation || "Venue Location";
  const eventDate = listing.ticketCache?.event?.startDate
    ? new Date(listing.ticketCache.event.startDate).toLocaleDateString(
        "id-ID",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      )
    : "To be announced";

  const isOwnTicket =
    currentWallet &&
    listing.sellerWallet.toLowerCase() === currentWallet.toLowerCase();

  const handleBuy = async () => {
    setIsBuying(true);
    setStatusMsg(null);

    try {
      const result = await buyResaleTicketAction(listing.id);

      if (!result.success || !result.token) {
        setStatusMsg({
          type: "error",
          text: result.message || "Failed to initialize payment gateway.",
        });
        setIsBuying(false);
        return;
      }

      if (typeof window === "undefined" || !window.snap) {
        setStatusMsg({
          type: "error",
          text: "Midtrans gateway is preparing. Please click again.",
        });
        setIsBuying(false);
        return;
      }

      window.snap.pay(result.token, {
        onSuccess: function (snapRes: any) {
          setStatusMsg({
            type: "success",
            text: "Pembayaran diterima. Memindahkan kepemilikan NFT tiket di blockchain Sepolia...",
          });

          // Polling status resale sampai executeResale selesai dieksekusi on-chain & database disinkronkan
          let attempts = 0;
          const maxAttempts = 30;
          const interval = setInterval(async () => {
            attempts++;
            if (!result.orderId) {
              clearInterval(interval);
              setIsBuying(false);
              router.push("/dashboard/tickets");
              return;
            }

            const pollRes = await checkResaleOrderStatusAction(result.orderId);
            if (pollRes.success && (pollRes.status === "paid" || pollRes.status === "sold")) {
              clearInterval(interval);
              setStatusMsg({
                type: "success",
                text: `Sukses! Tiket #${listing.ticketCacheTokenId} resmi dipindahkan ke dompet Anda.`,
              });
              setIsBuying(false);
              setTimeout(() => {
                router.push("/dashboard/tickets");
              }, 1500);
              return;
            }

            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsBuying(false);
              router.push("/dashboard/tickets");
            }
          }, 2000);
        },
        onPending: function () {
          setStatusMsg({
            type: "success",
            text: "Awaiting settlement via QRIS or Virtual Account.",
          });
          setIsBuying(false);
        },
        onError: function () {
          setStatusMsg({
            type: "error",
            text: "Payment was cancelled or failed to process.",
          });
          setIsBuying(false);
        },
        onClose: function () {
          setIsBuying(false);
        },
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "System transaction error.",
      });
      setIsBuying(false);
    }
  };

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/resale"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#736E65] hover:text-[#D94520] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Resale Catalog</span>
          </Link>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 bg-[#171717] text-white space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-white/10 text-white border border-white/15">
                Pass #{listing.ticketCacheTokenId}
              </span>
              <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-[#FBECE7] text-[#D94520]">
                100% Price Ceiling
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {eventTitle}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-stone-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D94520]" />
                <span>{eventDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{venue}</span>
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#171717]">
                  Pass Information
                </h2>
                <div className="p-4 rounded-xl bg-[#F0EDE4] border border-black/[0.06] space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#736E65]">Pass ID:</span>
                    <span className="font-mono font-bold text-[#171717]">
                      #{listing.ticketCacheTokenId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#736E65]">Verification Status:</span>
                    <span className="font-semibold text-emerald-700">
                      Active & Unredeemed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#736E65]">Listed By:</span>
                    <span className="font-semibold text-[#171717]">
                      {isOwnTicket ? "Yourself" : "Verified Ticket Holder"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-black/[0.08] space-y-2 text-xs text-[#736E65]">
                <div className="flex items-center gap-2 font-bold text-[#171717]">
                  <ShieldCheck className="w-4 h-4 text-[#D94520]" />
                  <span>Fair Exchange Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  The secondary buyer automatically receives a newly refreshed dynamic QR ticket. The original owner&apos;s ticket is burned atomically upon payment settlement.
                </p>
              </div>
            </div>

            {/* Right: Checkout summary */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#F0EDE4] border border-black/[0.06] space-y-4">
              <h2 className="text-sm font-bold text-[#171717]">
                Payment Breakdown
              </h2>

              <div className="space-y-2 text-xs border-y border-black/[0.06] py-3">
                <div className="flex justify-between text-[#736E65]">
                  <span>Face Value Price</span>
                  <span className="font-mono font-semibold text-[#171717]">
                    Rp {Number(listing.lockedPrice).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[#736E65]">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-emerald-700">Rp 0 (Free)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.06]">
                  <span className="font-bold text-[#171717]">Total Due</span>
                  <span className="text-xl font-extrabold text-[#D94520] font-mono">
                    Rp {Number(listing.lockedPrice).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {isOwnTicket ? (
                <div className="p-3 rounded-xl bg-white border border-black/[0.08] text-center text-xs font-semibold text-[#736E65]">
                  This is your own active resale listing.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={isBuying}
                  className="w-full py-3 px-4 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Midtrans...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Instant Checkout via Midtrans</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
