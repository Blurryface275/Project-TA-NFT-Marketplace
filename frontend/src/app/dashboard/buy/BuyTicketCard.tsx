"use client";

import { useState } from "react";
import Link from "next/link";
import { registerPasskey } from "@/lib/passkey";
import { buyTicketAction, activateWalletAction, BuyTicketState } from "./actions";
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
  events?: EventData[];
  userTickets?: UserTicket[];
  initialOwnedCount?: number;
  event?: EventData | null;
}

export default function BuyTicketCard({
  walletAddress,
  userEmail = "",
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
    remainingQuota > 0 ? Math.min(quantity, remainingQuota) : 1;
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

  // Fungsi saat pengguna memilih kartu event di katalog
  const handleSelectEventCard = (evt: EventData) => {
    setSelectedEventId(evt.id);
    if (evt.ticketCategories && evt.ticketCategories.length > 0) {
      setSelectedCategoryId(Number(evt.ticketCategories[0].id));
    }
    setQuantity(1);
    setResult(null);
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

  // Fungsi pembelian tiket ke backend relayer
  const handleBuyTicket = async () => {
    if (!activeWallet) {
      setActivationError("Silakan aktifkan dompet tiket Anda terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await buyTicketAction(
        EVENT_ID,
        selectedCategory.id,
        safeQuantity,
      );
      setResult(res);

      if (res.success) {
        const newlyMintedTickets: UserTicket[] = Array.from({
          length: safeQuantity,
        }).map((_, idx) => ({
          tokenId: 9900 + idx,
          eventId: EVENT_ID,
          categoryId: selectedCategory.id,
          originalPrice: pricePerTicket,
          used: false,
          owner: activeWallet,
        }));

        setOwnedTickets((prev) => [...prev, ...newlyMintedTickets]);
      }
    } catch (err) {
      setResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
        txHash: undefined,
        blockNumber: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // TAMPILAN 1: KATALOG EVENT MARKETPLACE (GRID KARTU)
  if (!selectedEventId || !currentEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pilih event resmi untuk melihat kategori dan membeli tiket NFT.
          </p>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {allEvents.length} Event Tersedia
          </span>
        </div>

        {/* Grid Kartu Event Marketplace */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.map((evt) => {
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
                className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Gambar Poster Event */}
                <div
                  className="relative h-48 bg-cover bg-center overflow-hidden"
                  style={{
                    backgroundImage: evt.imageIpfsCid
                      ? `linear-gradient(to top, rgba(15, 10, 25, 0.9), rgba(15, 10, 25, 0.2)), url(${evt.imageIpfsCid})`
                      : "linear-gradient(to top, rgba(49, 46, 129, 0.9), rgba(88, 28, 135, 0.4))",
                  }}
                >
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span>Official</span>
                  </div>

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10 capitalize">
                    {evt.category || "Konser"}
                  </div>

                  {/* Badge Status Kepemilikan Kuota Akun */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
                        isEventFull
                          ? "bg-red-500/80 text-white"
                          : ownedInThisEvent > 0
                            ? "bg-amber-500/80 text-white"
                            : "bg-emerald-500/80 text-white"
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

                {/* Deskripsi Event */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {evt.eventName}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {evt.organizersId === 1
                        ? "BEM Universitas Surabaya"
                        : "Event Organizer Resmi"}
                    </p>

                    <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{evt.venueLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Bawah Kartu: Harga dan Tombol Pilih */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Mulai dari
                      </span>
                      <span className="text-sm font-extrabold text-foreground">
                        Rp {minPrice.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold group-hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <span>Pilih Tiket</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // TAMPILAN 2: DETAIL PEMBELIAN TIKET (KARTU LENGKAP DENGAN TOMBOL KEMBALI)
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Tombol Navigasi Kembali ke Katalog Event */}
      <button
        type="button"
        onClick={() => {
          setSelectedEventId(null);
          setResult(null);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Event</span>
      </button>

      {/* Kartu Detail Event dan Form Pembelian */}
      <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden transition-all">
        {/* Header Banner Event */}
        <div
          className="relative p-6 sm:p-8 border-b border-border/50 bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: currentEvent?.imageIpfsCid
              ? `linear-gradient(to right, rgba(20, 10, 35, 0.95), rgba(30, 20, 50, 0.88), rgba(15, 10, 25, 0.78)), url(${currentEvent.imageIpfsCid})`
              : "linear-gradient(to right, rgba(88, 28, 135, 0.6), rgba(49, 46, 129, 0.8), rgba(10, 10, 15, 0.95))",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3 h-3" />
              Official Event
            </span>
            <span className="text-xs font-medium text-purple-200/90 capitalize bg-black/40 px-2.5 py-1 rounded-md border border-white/10">
              {currentEvent?.category || "Konser Musik"}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mt-3">
            {currentEvent?.eventName}
          </h2>
          <p className="text-sm text-purple-200 font-medium mt-1">
            {currentEvent?.organizersId === 1
              ? "BEM Universitas Surabaya"
              : "Event Organizer Resmi"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/10 text-sm">
            <div className="flex items-center gap-2.5 text-zinc-200 font-medium">
              <Calendar className="w-4 h-4 text-purple-300 shrink-0" />
              <span>{eventDateFormatted}</span>
            </div>
            <div className="flex items-center gap-2.5 text-zinc-200 font-medium">
              <MapPin className="w-4 h-4 text-purple-300 shrink-0" />
              <span>{currentEvent?.venueLocation}</span>
            </div>
          </div>
        </div>

        {/* Form Pilihan Kategori dan Pembelian */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Pilih Kategori Tiket
              </span>
              <span className="text-xs text-foreground/75 font-medium">
                {activeCategories.length} Kategori Tersedia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    disabled={isLoading || isQuotaFull}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground">
                          {cat.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-foreground/80 shrink-0">
                          {cat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Harga
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        Rp {cat.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estimasi Alokasi Nomor Kursi Sequential */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs">
            <Armchair className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  Alokasi Nomor Kursi:
                </span>
                <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/15">
                  {safeQuantity === 1
                    ? `${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 1}`
                    : `${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 1}, ${selectedCategory.rowPrefix}-0${ownedCountForCurrentEvent + 2}`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Nomor kursi ditentukan otomatis berurutan sesuai urutan
                konfirmasi blok di blockchain (*Sequential Auto-Assignment*).
              </p>
            </div>
          </div>

          {/* Ringkasan Harga & Batas Kuota Event */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <span className="text-xs text-foreground/75 font-medium block">
                Kategori Terpilih
              </span>
              <span className="text-base font-bold text-foreground">
                {selectedCategory.name}
              </span>
              <span className="text-xs text-muted-foreground block">
                Rp {pricePerTicket.toLocaleString("id-ID")} / tiket
              </span>
            </div>
            <div>
              <span className="text-xs text-foreground/75 font-medium block">
                Batas Maksimal Event Ini
              </span>
              <span className="text-base font-bold text-foreground">
                {ownedCountForCurrentEvent} / {MAX_PER_WALLET} Tiket
              </span>
              <span className="text-xs text-muted-foreground block">
                Anti-Scalping Rule
              </span>
            </div>
          </div>

          {/* Pilihan Jumlah Tiket */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-foreground block">
                Jumlah Tiket
              </span>
              <span className="text-xs text-foreground/75 font-medium">
                {isQuotaFull
                  ? `Batas maksimal ${MAX_PER_WALLET} tiket untuk event ini telah tercapai.`
                  : `Sisa kuota akun Anda: ${remainingQuota} tiket (Maks. ${MAX_PER_WALLET} tiket/akun)`}
              </span>
            </div>

            {!isQuotaFull ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={safeQuantity <= 1 || isLoading}
                    className="px-3 py-1.5 text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-base cursor-pointer"
                    title="Kurangi jumlah tiket"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-foreground min-w-[2.5rem] text-center font-mono">
                    {safeQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(remainingQuota, q + 1))
                    }
                    disabled={safeQuantity >= remainingQuota || isLoading}
                    className="px-3 py-1.5 text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-base cursor-pointer"
                    title="Tambah jumlah tiket"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-xs text-foreground/75 font-medium block">
                    Total Bayar
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground/80 border border-border">
                Kuota Penuh ({ownedCountForCurrentEvent}/{MAX_PER_WALLET} Tiket)
              </span>
            )}
          </div>

          {/* Alamat Dompet Pembeli */}
          <div className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground/80 font-medium">
              <Wallet className="h-4 w-4 text-primary shrink-0" />
              <span>Penerima NFT:</span>
            </div>
            <span
              className={`font-mono font-semibold truncate max-w-[240px] sm:max-w-none ${
                activeWallet ? "text-foreground" : "text-amber-400"
              }`}
              title={activeWallet || "Belum Aktif"}
            >
              {activeWallet ? activeWallet : "⚠️ Belum Aktif (Perlu Aktivasi)"}
            </span>
          </div>

          {/* Notifikasi Hasil Transaksi */}
          {result?.success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>
                  {result.message ||
                    "Tiket berhasil dicetak di jaringan Sepolia!"}
                </span>
              </div>
              <div className="text-xs space-y-1 font-mono text-muted-foreground pl-7">
                {result.blockNumber && (
                  <p>Block Terkonfirmasi: #{result.blockNumber}</p>
                )}
                {result.txHashes && result.txHashes.length > 1 ? (
                  <div className="space-y-1">
                    <p>Hash Transaksi ({result.txHashes.length} Tiket):</p>
                    {result.txHashes.map((h, idx) => (
                      <p key={h}>
                        Tiket #{idx + 1}:{" "}
                        <a
                          href={`https://sepolia.etherscan.io/tx/${h}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {h.slice(0, 16)}...{h.slice(-10)}
                        </a>
                      </p>
                    ))}
                  </div>
                ) : result.txHash ? (
                  <p>
                    Hash Transaksi:{" "}
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors hover:underline"
                    >
                      {result.txHash}
                    </a>
                  </p>
                ) : null}
                <Link
                  href="/dashboard/tickets"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Ticket className="h-3 w-3" />
                  Lihat Tiket Saya
                  <ArrowRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Pesan Gagal */}
          {result && !result.success && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2.5 text-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pembelian Gagal</p>
                <p className="text-xs text-red-300/90 mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* JIKA DOMPET BELUM AKTIF: Tampilkan Tombol Aktivasi Passkey */}
          {!activeWallet ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-purple-300">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>Aktivasi Dompet Tiket Diperlukan</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Untuk mengunci tiket resmi anti-calo di blockchain, akun Anda memerlukan Smart Account berbasis Passkey. Cukup 1x klik menggunakan PIN Windows, sidik jari, atau scan QR ponsel.
                </p>
                {activationError && (
                  <p className="text-red-400 font-medium">{activationError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleActivateWallet}
                disabled={isActivatingWallet}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition shadow-lg cursor-pointer"
              >
                {isActivatingWallet ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menghubungkan Sensor Biometrik / PIN...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5" />
                    <span>Aktifkan Dompet Tiket (1-Klik Passkey/PIN)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* JIKA DOMPET SUDAH AKTIF: Tampilkan Tombol Beli Tiket Biasa */
            <button
              type="button"
              onClick={handleBuyTicket}
              disabled={isLoading || isQuotaFull}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-primary/25 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Memproses Minting ({safeQuantity} Tiket)...</span>
                </>
              ) : isQuotaFull ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Batas Kuota {MAX_PER_WALLET} Tiket Telah Tercapai</span>
                </>
              ) : (
                <>
                  <Ticket className="h-5 w-5" />
                  <span>
                    Beli {safeQuantity} Tiket Sekarang (Rp{" "}
                    {totalPrice.toLocaleString("id-ID")})
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
