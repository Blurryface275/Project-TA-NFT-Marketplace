"use client";

import { useState } from "react";
import Script from "next/script";
import { buyResaleTicketAction } from "./actions";
import {
  Repeat,
  Ticket,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

export interface ResaleListingItem {
  id: string;
  sellerWallet: string;
  lockedPrice: string | number;
  status: string;
  listedAt: string;
  ticketCacheTokenId: number;
  ticketCache?: {
    tokenId: number;
    originalPrice: string | number;
    eventsId: number;
    event?: {
      id: number;
      eventName: string;
      startDate: string;
      venueLocation: string;
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
      const snapRes = await buyResaleTicketAction(listing.id);
      if (!snapRes.success || !snapRes.token) {
        setStatusMsg({
          type: "error",
          text: snapRes.message || "Gagal membuka pembayaran Midtrans.",
        });
        setLoadingId(null);
        return;
      }

      const snap = (window as any).snap;
      if (!snap) {
        setStatusMsg({
          type: "error",
          text: "Midtrans Snap belum siap. Silakan refresh halaman.",
        });
        setLoadingId(null);
        return;
      }

      // Buka popup pembayaran Midtrans Snap
      snap.pay(snapRes.token, {
        onSuccess: function () {
          // Hapus tiket yang sudah dibeli dari daftar katalog aktif
          setListings((prev) => prev.filter((item) => item.id !== listing.id));
          setStatusMsg({
            type: "success",
            text: `Pembayaran berhasil! Tiket #${listing.ticketCacheTokenId} sedang dipindahkan ke Smart Account Anda oleh MarketplaceContract.`,
          });
          setLoadingId(null);
        },
        onPending: function () {
          setStatusMsg({
            type: "success",
            text: "Menunggu penyelesaian pembayaran QRIS / Virtual Account.",
          });
          setLoadingId(null);
        },
        onError: function () {
          setStatusMsg({
            type: "error",
            text: "Pembayaran gagal diproses oleh Midtrans.",
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
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
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
        {/* Banner Informasi Anti-Scalping */}
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3 text-xs text-teal-900">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              100% Jaminan Harga Asli (Zero-Markup Price Lock)
            </p>
            <p className="text-teal-700 leading-relaxed">
              Seluruh tiket di pasar sekunder ini dikunci oleh{" "}
              <span className="font-mono font-semibold">MarketplaceContract.sol</span>{" "}
              agar sama persis dengan harga cetak perdana (
              <span className="font-mono">price == originalPrice</span>). Calo tidak
              dapat menaikkan harga 1 rupiah pun.
            </p>
          </div>
        </div>

        {/* Pesan Notifikasi */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
              statusMsg.type === "success"
                ? "bg-teal-50 border-teal-200 text-teal-900"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        {/* Daftar Katalog Tiket Resale */}
        {listings.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <Repeat className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Belum Ada Tiket yang Dijual Kembali
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Saat ini belum ada pemilik tiket yang mendaftarkan tiketnya di pasar
              sekunder resmi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const eventTitle =
                item.ticketCache?.event?.eventName || "UBAYA Music Fest 2026";
              const venue =
                item.ticketCache?.event?.venueLocation ||
                "Stadion Gelora 10 November";
              const eventDate = item.ticketCache?.event?.startDate
                ? new Date(
                    item.ticketCache.event.startDate,
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Segera";

              const isOwnTicket =
                currentWallet &&
                item.sellerWallet.toLowerCase() === currentWallet.toLowerCase();

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="p-5 bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-coral-500/20 text-coral-300 border border-coral-500/30 font-mono font-bold">
                        <Ticket className="w-3 h-3" />
                        TOKEN #{item.ticketCacheTokenId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[11px]">
                        <Lock className="w-3 h-3" />
                        Harga Terkunci
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight line-clamp-1">
                      {eventTitle}
                    </h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-coral-500 shrink-0" />
                        <span>{eventDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{venue}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Penjual:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {item.sellerWallet.slice(0, 6)}...
                        {item.sellerWallet.slice(-4)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Harga Resmi (No Markup)
                        </span>
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          Rp {Number(item.lockedPrice).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyResale(item)}
                        disabled={loadingId === item.id || Boolean(isOwnTicket)}
                        className="px-4 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {loadingId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : isOwnTicket ? (
                          <span>Tiket Anda</span>
                        ) : (
                          <span>Beli Tiket Resale</span>
                        )}
                      </button>
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

