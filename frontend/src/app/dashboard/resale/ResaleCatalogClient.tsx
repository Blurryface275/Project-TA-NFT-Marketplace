"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  MapPin,
  ShieldCheck,
  Repeat,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";
import { buyResaleTicketAction } from "./actions";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export interface ResaleListingItem {
  id: string;
  sellerWallet: string;
  lockedPrice: string | number;
  status: string;
  listedAt: string;
  ticketCacheTokenId: number;
  ticketCache?: {
    tokenId: number;
    eventId: number;
    ownerWallet: string;
    originalPrice: string | number;
    used: number;
    event?: {
      id: number;
      eventName: string;
      startDate: string;
      venueLocation: string;
      imageIpfsCid?: string;
    };
  };
}

interface ResaleCatalogClientProps {
  initialListings: ResaleListingItem[];
  currentWallet: string;
}

export default function ResaleCatalogClient({
  initialListings,
  currentWallet,
}: ResaleCatalogClientProps) {
  const [listings, setListings] = useState<ResaleListingItem[]>(initialListings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleBuyResale = async (listing: ResaleListingItem) => {
    setLoadingId(listing.id);
    setStatusMsg(null);

    try {
      const result = await buyResaleTicketAction(listing.id);

      if (!result.success || !result.token) {
        setStatusMsg({
          type: "error",
          text: result.message || "Failed to initialize Midtrans payment gateway.",
        });
        setLoadingId(null);
        return;
      }

      if (typeof window === "undefined" || !window.snap) {
        setStatusMsg({
          type: "error",
          text: "Payment gateway is loading. Please try again in a moment.",
        });
        setLoadingId(null);
        return;
      }

      window.snap.pay(result.token, {
        onSuccess: function () {
          setStatusMsg({
            type: "success",
            text: `Payment verified! Ticket #${listing.ticketCacheTokenId} has been transferred to your wallet.`,
          });
          setListings((prev) => prev.filter((item) => item.id !== listing.id));
          setLoadingId(null);
        },
        onPending: function () {
          setStatusMsg({
            type: "success",
            text: "Awaiting settlement via QRIS or Virtual Account.",
          });
          setLoadingId(null);
        },
        onError: function () {
          setStatusMsg({
            type: "error",
            text: "Payment failed to settle.",
          });
          setLoadingId(null);
        },
        onClose: function () {
          setLoadingId(null);
        },
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "System transaction error.",
      });
      setLoadingId(null);
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
        {/* Anti-Scalping Price-Lock Guarantee Box */}
        <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FBECE7] text-[#D94520] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-[#171717]">
                Price-Lock Guarantee™ (Anti-Scalping Rule)
              </h3>
              <p className="text-xs text-[#736E65] leading-relaxed">
                Tickets listed on this secondary exchange are locked at exact face value. Markups are contractually blocked.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F0EDE4] text-[#171717] border border-black/[0.06] shrink-0">
            100% Price Ceiling
          </span>
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

        {listings.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-white p-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto text-[#736E65]">
              <Repeat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">
              No Resale Tickets Currently Listed
            </h3>
            <p className="text-xs text-[#736E65] max-w-md mx-auto">
              Attendees can list their verified passes here if they cannot attend. Check back periodically or browse the primary catalog.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/buy"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition"
              >
                <span>Browse Primary Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const eventTitle =
                item.ticketCache?.event?.eventName || "Curated Event";
              const venue =
                item.ticketCache?.event?.venueLocation || "Venue Location";
              const eventDate = item.ticketCache?.event?.startDate
                ? new Date(item.ticketCache.event.startDate).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )
                : "Upcoming";

              const isOwnTicket =
                currentWallet &&
                item.sellerWallet.toLowerCase() === currentWallet.toLowerCase();

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-black/[0.08] hover:border-black/20 hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-4 bg-[#171717] text-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[11px] font-bold backdrop-blur-xs">
                        <Ticket className="w-3 h-3 text-[#D94520]" />
                        Pass #{item.ticketCacheTokenId}
                      </span>
                      <span className="text-[11px] text-[#D94520] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Price Locked</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-[#D94520] transition-colors">
                      {eventTitle}
                    </h3>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs text-[#736E65]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                        <span>{eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#736E65] shrink-0" />
                        <span className="truncate">{venue}</span>
                      </div>
                      <div className="pt-2 text-[11px] font-mono text-[#736E65] border-t border-black/[0.06]">
                        Seller: {item.sellerWallet.slice(0, 6)}...{item.sellerWallet.slice(-4)}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#736E65] font-bold block uppercase tracking-wider">
                          Locked Face Value
                        </span>
                        <span className="text-base font-extrabold text-[#171717] font-mono">
                          Rp {Number(item.lockedPrice).toLocaleString("id-ID")}
                        </span>
                      </div>

                      {isOwnTicket ? (
                        <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-[#736E65] text-xs font-bold">
                          Your Listing
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuyResale(item)}
                          disabled={loadingId === item.id}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {loadingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5" />
                          )}
                          <span>Buy Pass</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
