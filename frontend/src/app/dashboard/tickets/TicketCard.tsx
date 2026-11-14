"use client";

import { useState, useEffect } from "react";
import {
  redeemTicketAction,
  RedeemTicketState,
  listTicketForResaleAction,
  cancelResaleListingAction,
  ResaleActionState,
  checkTicketStatusAction,
} from "./actions";
import {
  Ticket,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Timer,
  RefreshCw,
  Repeat,
  X,
  ShieldCheck,
} from "lucide-react";

export interface TicketData {
  tokenId: number;
  eventId: number;
  categoryId: number;
  originalPrice: number;
  used: boolean;
  owner: string;
  seatIndex?: number;
  isListed?: boolean;
}

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

export function getCategoryMeta(categoryId: number, tokenId: number) {
  switch (categoryId) {
    case 1:
      return {
        name: "VIP Pass",
        badgeColor: "text-[#D94520]",
        seatNumber: `VIP-A${String(tokenId).padStart(2, "0")}`,
        area: "Front Stage Area",
      };
    case 2:
      return {
        name: "Reserved Seated",
        badgeColor: "text-[#171717]",
        seatNumber: `CAT1-B${String(tokenId).padStart(2, "0")}`,
        area: "Main Grandstand",
      };
    case 3:
      return {
        name: "Festival General",
        badgeColor: "text-[#736E65]",
        seatNumber: `FEST-C${String(tokenId).padStart(2, "0")}`,
        area: "Central Standing",
      };
    default:
      return {
        name: `Tier #${categoryId}`,
        badgeColor: "text-[#736E65]",
        seatNumber: `SEAT-${String(tokenId).padStart(2, "0")}`,
        area: "General Admission",
      };
  }
}

interface TicketCardProps {
  ticket: TicketData;
  events?: EventData[];
}

function getCSPRNGNonce(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0];
  }
  return Math.floor(Math.random() * 1000000);
}

export default function TicketCard({ ticket, events = [] }: TicketCardProps) {
  const currentEvent = events.find(
    (e) => Number(e.onChainEventId || e.id) === ticket.eventId,
  );

  const matchedCategory = (currentEvent?.ticketCategories || []).find(
    (c) => Number(c.id) === ticket.categoryId,
  );

  const fallbackMeta = getCategoryMeta(ticket.categoryId, ticket.tokenId);
  const categoryName = matchedCategory?.name || fallbackMeta.name;

  const seatPrefix = categoryName.includes("VIP")
    ? "VIP"
    : categoryName.includes("CAT")
      ? "CAT1"
      : categoryName.includes("Regular")
        ? "REG"
        : "FEST";

  const seatIndex = ticket.seatIndex || ticket.tokenId;
  const seatNumber = `${seatPrefix}-${String(seatIndex).padStart(2, "0")}`;

  const dateObj = currentEvent?.startDate
    ? new Date(currentEvent.startDate)
    : new Date("2026-11-28T19:00:00");
  const eventDateOnly = dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const eventTimeOnly =
    dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";

  const [isUsed, setIsUsed] = useState(ticket.used);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [nonce, setNonce] = useState<number>(() => getCSPRNGNonce());
  const [signedAt, setSignedAt] = useState<string>("");
  const [result, setResult] = useState<RedeemTicketState | null>(null);

  useEffect(() => {
    if (!showQR || isUsed || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [showQR, isUsed, timeLeft]);

  useEffect(() => {
    if (isUsed) return;

    const pollInterval = showQR ? 2000 : 5000;
    const poller = setInterval(async () => {
      try {
        const status = await checkTicketStatusAction(ticket.tokenId);
        if (status.used) {
          setIsUsed(true);
          setShowQR(false);
          clearInterval(poller);
        }
      } catch {}
    }, pollInterval);

    return () => clearInterval(poller);
  }, [isUsed, showQR, ticket.tokenId]);

  const handleToggleQR = async () => {
    if (showQR) {
      setShowQR(false);
      return;
    }
    if (isUsed) return;

    setIsSigning(true);

    try {
      const currentNonce = getCSPRNGNonce();
      const currentTime = new Date().toISOString();
      const challengeStr = `NFTIX-AUTH:Token#${ticket.tokenId}:Owner#${ticket.owner}:Nonce#${currentNonce}:Time#${currentTime}`;

      let generatedSignature = "";

      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          const challengeBuffer = new TextEncoder().encode(challengeStr);

          const assertion = (await navigator.credentials.get({
            publicKey: {
              challenge: challengeBuffer,
              timeout: 60000,
              userVerification: "preferred",
            },
          })) as PublicKeyCredential | null;

          if (assertion && assertion.response) {
            const resp = assertion.response as AuthenticatorAssertionResponse;
            const sigBytes = new Uint8Array(resp.signature);
            generatedSignature =
              "0x" +
              Array.from(sigBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
          } else {
            const randomBytes = crypto.getRandomValues(new Uint8Array(32));
            generatedSignature =
              "0x" +
              Array.from(randomBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
          }
        } catch (authErr) {
          console.warn("[WEBAUTHN] Dialog dibatalkan atau dilewati, menggunakan fallback crypto hash:", authErr);
          const randomBytes = crypto.getRandomValues(new Uint8Array(32));
          generatedSignature =
            "0x" +
            Array.from(randomBytes)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
        }
      } else {
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        generatedSignature =
          "0x" +
          Array.from(randomBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
      }

      setSignature(generatedSignature);
      setTimeLeft(60);
      setNonce(currentNonce);
      setSignedAt(currentTime);
      setShowQR(true);
    } catch (error) {
      console.error("Failed to enable dynamic QR:", error);
      setShowQR(false);
      alert(
        "Could not generate dynamic ticket QR. Please ensure browser supports WebAuthn.",
      );
    } finally {
      setIsSigning(false);
    }
  };

  const qrPayload = {
    tokenId: ticket.tokenId,
    walletAddress: ticket.owner,
    signedAt: signedAt,
    signature: signature,
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=1&data=${encodeURIComponent(
    JSON.stringify(qrPayload),
  )}`;

  const handleRedeem = async () => {
    if (isUsed) return;

    const confirmRedeem = confirm(
      `Redeem Ticket #${ticket.tokenId} at venue gate?`,
    );

    if (!confirmRedeem) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await redeemTicketAction(ticket.tokenId);
      setResult(res);
      if (res.success) {
        setIsUsed(true);
      }
    } catch (err) {
      setResult({
        success: false,
        message:
          err instanceof Error ? err.message : "System verification error.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [isListingResale, setIsListingResale] = useState(false);
  const [isListedOnResale, setIsListedOnResale] = useState(Boolean(ticket.isListed));

  useEffect(() => {
    if (ticket.isListed !== undefined) {
      setIsListedOnResale(Boolean(ticket.isListed));
    }
  }, [ticket.isListed]);
  const [resaleResult, setResaleResult] = useState<ResaleActionState | null>(null);
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [resaleFormError, setResaleFormError] = useState("");

  const handleListForResale = () => {
    if (isUsed || isListedOnResale) return;
    setResaleFormError("");
    setShowResaleModal(true);
  };

  const handleConfirmResaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setResaleFormError("You must accept the price-lock resale terms.");
      return;
    }
    if (!accountNumber.trim() || !accountHolder.trim()) {
      setResaleFormError("Bank account details are required for payout.");
      return;
    }

    setIsListingResale(true);
    setResaleResult(null);
    setResaleFormError("");

    try {
      const res = await listTicketForResaleAction(ticket.tokenId);
      setResaleResult(res);
      if (res.success) {
        setIsListedOnResale(true);
        setShowResaleModal(false);
      } else {
        setResaleFormError(res.message || "Failed to list ticket on resale.");
      }
    } catch (err: any) {
      setResaleFormError(err?.message || "Error listing ticket.");
    } finally {
      setIsListingResale(false);
    }
  };

  const handleCancelResale = async () => {
    const confirmCancel = confirm(
      `Cancel resale listing for Ticket #${ticket.tokenId}?`,
    );
    if (!confirmCancel) return;

    setIsListingResale(true);
    setResaleResult(null);

    try {
      const res = await cancelResaleListingAction(ticket.tokenId);
      setResaleResult(res);
      if (res.success) {
        setIsListedOnResale(false);
      }
    } finally {
      setIsListingResale(false);
    }
  };

  return (
    <div className="relative w-full">
      <article
        className={`relative bg-white rounded-2xl border border-black/[0.08] overflow-hidden flex flex-col shadow-xs hover:border-black/15 transition-all ${
          isUsed ? "opacity-70 bg-stone-50" : ""
        }`}
      >
        {/* 1. Ticket Header with Terracotta/Espresso Warmth */}
        <div className="w-full p-5 bg-[#171717] text-white flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-xs border border-white/10">
              {categoryName}
            </span>
            {isListedOnResale ? (
              <span className="bg-[#FBECE7] text-[#D94520] border border-[#D94520]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Sedang Dijual
              </span>
            ) : isUsed && (
              <span className="bg-stone-800 text-stone-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Redeemed at Door
              </span>
            )}
          </div>

          <div className="pt-3">
            <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1">
              {currentEvent?.eventName || "Joyland Festival 2026"}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Admission Pass • Non-Transferable Outside Resale
            </p>
          </div>
        </div>

        {/* 2. Perforated Notch Divider Line */}
        <div className="relative flex items-center justify-between px-0 bg-white">
          <div className="w-3 h-6 rounded-r-full bg-[#F7F5EE] border-y border-r border-black/[0.08] -ml-px" />
          <div className="flex-1 border-t border-dashed border-stone-200 mx-2" />
          <div className="w-3 h-6 rounded-l-full bg-[#F7F5EE] border-y border-l border-black/[0.08] -mr-px" />
        </div>

        {/* 3. Ticket Body */}
        <div className="p-5 flex flex-col gap-4 bg-white">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-[#736E65] uppercase tracking-wider block">
                Date & Time
              </span>
              <div
                suppressHydrationWarning
                className="text-xs font-semibold text-[#171717] mt-0.5"
              >
                {eventDateOnly}
              </div>
              <div suppressHydrationWarning className="text-[11px] text-[#736E65]">
                {eventTimeOnly}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#736E65] uppercase tracking-wider block">
                Venue
              </span>
              <div
                className="text-xs font-semibold text-[#171717] mt-0.5 truncate"
                title={currentEvent?.venueLocation || "Gelora Bung Karno"}
              >
                {currentEvent?.venueLocation || "Gelora Bung Karno, Jakarta"}
              </div>
              <div className="text-[11px] text-[#736E65]">
                {currentEvent?.category || "Concert"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-black/[0.06]">
            <div>
              <span className="text-[10px] font-bold text-[#736E65] uppercase tracking-wider block">
                Pass Reference
              </span>
              <span className="font-mono text-xs font-bold text-[#171717] mt-0.5 inline-block">
                #TKT-{ticket.tokenId} • {seatNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-[#736E65] uppercase tracking-wider block">
                Original Price
              </span>
              <span className="font-mono text-sm font-extrabold text-[#171717]">
                Rp {Number(ticket.originalPrice).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Dynamic 60-second QR Code Box */}
          {showQR && (
            <div className="p-4 rounded-2xl bg-[#F0EDE4] border border-black/[0.08] flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in">
              <div className="p-3 bg-white rounded-xl border border-black/[0.08] shadow-xs">
                {timeLeft > 0 ? (
                  <img
                    src={qrImageUrl}
                    alt={`Dynamic QR Ticket #${ticket.tokenId}`}
                    className="w-56 h-56 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center bg-stone-50 text-[#736E65] rounded-lg p-4 space-y-2">
                    <AlertCircle className="w-8 h-8 text-[#D94520]" />
                    <span className="text-xs font-bold text-[#171717]">
                      QR Expired
                    </span>
                    <p className="text-[11px] text-[#736E65]">
                      60-second rolling window expired
                    </p>
                  </div>
                )}
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#736E65] font-medium">
                    <Timer className="w-3.5 h-3.5 text-[#D94520]" />
                    <span>Dynamic Validity:</span>
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeft <= 10 ? "text-rose-600" : "text-[#D94520]"
                    }`}
                  >
                    {timeLeft > 0 ? `${timeLeft}s remaining` : "Expired"}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 10 ? "bg-rose-500" : "bg-[#D94520]"
                    }`}
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>

                {timeLeft === 0 && (
                  <button
                    type="button"
                    onClick={handleToggleQR}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D94520] text-white hover:bg-[#BF3B19] text-xs font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh Barcode</span>
                  </button>
                )}
              </div>

              {/* Gate Marshal Simulation */}
              <div className="pt-2 border-t border-black/[0.06] w-full">
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isLoading || isUsed}
                  className="text-[11px] text-[#736E65] hover:text-[#171717] underline decoration-dotted transition-colors cursor-pointer"
                >
                  {isLoading ? "Verifying Gate Entry..." : "Marshal simulation: Scan & Check-In"}
                </button>
              </div>
            </div>
          )}

          {result?.success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}

          {resaleResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                resaleResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {resaleResult.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {isListedOnResale ? (
              <button
                type="button"
                onClick={handleCancelResale}
                disabled={isListingResale}
                className="w-full bg-[#FBECE7] hover:bg-[#FBECE7]/80 text-[#D94520] border border-[#D94520]/30 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isListingResale ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D94520]" />
                    <span>Membatalkan Resale...</span>
                  </>
                ) : (
                  <span>Batalkan Resale</span>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleQR}
                  disabled={isSigning || isUsed}
                  className="flex-[2] bg-[#D94520] hover:bg-[#BF3B19] text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Passkey...</span>
                    </>
                  ) : showQR ? (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Hide Entry QR</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Show Dynamic Barcode</span>
                    </>
                  )}
                </button>

                {!isUsed && (
                  <button
                    type="button"
                    onClick={handleListForResale}
                    disabled={isListingResale}
                    className="flex-1 bg-white hover:bg-stone-50 text-[#171717] border border-black/[0.08] font-semibold text-xs py-2.5 px-3 rounded-xl text-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Resale Ticket
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </article>

      {/* Resale Modal */}
      {showResaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-black/[0.08] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#F0EDE4]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FBECE7] text-[#D94520] flex items-center justify-center font-bold">
                  <Repeat className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#171717]">
                  Resale Listing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResaleModal(false)}
                className="text-[#736E65] hover:text-[#171717] p-1 rounded-lg hover:bg-stone-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResaleSubmit} className="p-6 space-y-4 text-left">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-black/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#D94520] uppercase tracking-wider">
                    Ticket #{ticket.tokenId} · {categoryName}
                  </span>
                  <span className="text-xs font-semibold text-[#736E65]">
                    {seatNumber}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#171717] line-clamp-1">
                  {currentEvent?.eventName || "Curated Event"}
                </h4>
              </div>

              {/* Breakdown Harga & Uang yang Diterima */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-black/[0.08] space-y-2 text-xs">
                <div className="flex items-center justify-between font-medium text-[#736E65]">
                  <span>Harga Jual Tiket:</span>
                  <span className="font-semibold text-[#171717]">
                    Rp {Number(ticket.originalPrice).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium text-[#736E65]">
                  <span>Biaya Layanan & Admin:</span>
                  <span className="font-semibold text-rose-600">
                    - Rp {(5000 + Math.round(Number(ticket.originalPrice) * 0.025)).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                  <span className="font-bold text-[#171717]">Uang yang Diterima:</span>
                  <span className="font-extrabold text-[#D94520] text-sm">
                    Rp {Math.max(0, Number(ticket.originalPrice) - (5000 + Math.round(Number(ticket.originalPrice) * 0.025))).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Bank payout info */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-[#171717] block">
                  Payout Bank Account
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[10px] text-[#736E65] font-medium block mb-1">
                      Bank / E-Wallet
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#D94520]"
                    >
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="GoPay">GoPay</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#736E65] font-medium block mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs text-[#171717] focus:outline-none focus:border-[#D94520]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#736E65] font-medium block mb-1">
                    Account Beneficiary Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name matching bank account"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs text-[#171717] focus:outline-none focus:border-[#D94520]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 text-xs text-[#736E65] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#D94520] focus:ring-[#D94520]"
                  />
                  <span>
                    I agree that this ticket will be atomically transferred to the buyer once payment settles via Midtrans.
                  </span>
                </label>
              </div>

              {resaleFormError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {resaleFormError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowResaleModal(false)}
                  disabled={isListingResale}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-black/[0.08] text-[#736E65] text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isListingResale}
                  className="flex-[2] py-2.5 px-4 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isListingResale ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Listing Ticket...</span>
                    </>
                  ) : (
                    <span>List at Face Value</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
