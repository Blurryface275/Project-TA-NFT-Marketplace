"use client";

import { useState } from "react";
import Link from "next/link";
import { buyTicketAction, BuyTicketState } from "./actions";
import {
  Calendar,
  MapPin,
  Ticket,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ArrowRight,
  Armchair,
} from "lucide-react";
import { NumberField } from "@base-ui/react";

export interface TIcketCategoryOption {
  id: number;
  name: string;
  badge: string;
  price: number;
  rowPrefix: string;
  description: string;
}

export const EVENT_CATEGORIES: TIcketCategoryOption[] = [
  {
    id: 1,
    name: "Presale",
    badge: "Early Access",
    price: 250_000,
    rowPrefix: "A-F",
    description: "Akses lebih awal untuk presale dengan pilihan kursi terbatas",
  },
  {
    id: 2,
    name: "CAT 1 (TRIBUN)",
    badge: "Duduk Nyaman",
    price: 100_000,
    rowPrefix: "CAT1-B",
    description:
      "Kursi bernomor di tribun utama dengan pemandangan panggung luas",
  },
  {
    id: 3,
    name: "FESTIVAL",
    badge: "Paling Seru",
    price: 75_000,
    rowPrefix: "FEST-C",
    description: "Area berdiri bebas di tengah arena konser",
  },
];
interface BuyTicketCardProps {
  walletAddress: string;
  initialOwnedCount?: number;
}

export default function BuyTicketCard({
  walletAddress,
  initialOwnedCount = 0,
}: BuyTicketCardProps) {
  // State untuk melacak status transaksi dan loading
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BuyTicketState | null>(null);

  // Status kepemilikan dan batas kuota anti-scalping (maksimal 2 tiket per akun)
  const MAX_PER_WALLET = 2;
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1); // angka 1 merujuk ke tiket kategori first presale
  const selectedCategory =
    EVENT_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
    EVENT_CATEGORIES[0];
  const pricePerTicket = selectedCategory.price;
  const [ownedCount, setOwnedCount] = useState(initialOwnedCount);

  const remainingQuota = Math.max(0, MAX_PER_WALLET - ownedCount);
  const isQuotaFull = remainingQuota === 0;

  // State jumlah tiket yang ingin dibeli (1 atau 2)
  const [quantity, setQuantity] = useState(remainingQuota > 0 ? 1 : 1);
  const totalPrice = quantity * pricePerTicket;

  // Event ID dan Kategori ID yang sudah diinitialize di smart contract
  const EVENT_ID = 1; // masih hardocde karena belum terintegrasi langsung dengan API relayer (Admin Backend)

  // function yang akan dipanggil ketika user menekan tombol buy
  const handleBuyTicket = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Panggil Server Action yang berkomunikasi dengan Backend Relayer
      const res = await buyTicketAction(EVENT_ID, selectedCategoryId, quantity);
      setResult(res);

      // Jika berhasil, perbarui jumlah tiket yang dimiliki secara reaktif di antarmuka
      if (res.success) {
        setOwnedCount((prev) => {
          const nextCount = prev + quantity;
          return nextCount;
        });
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

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-lg overflow-hidden transition-all">
      {/* Header Banner Event */}
      <div className="relative bg-gradient-to-r from-purple-900/60 via-indigo-950/80 to-background p-6 sm:p-8 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3 h-3" />
            Official Event
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white mt-3">
          UBAYA Music Fest 2026
        </h2>
        <p className="text-sm text-purple-200 font-medium mt-1">
          Konser Musik UBAYA
        </p>

        {/* Informasi Jadwal & Lokasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/40 text-sm">
          <div className="flex items-center gap-2.5 text-zinc-200 font-medium">
            <Calendar className="w-4 h-4 text-purple-300 shrink-0" />
            <span>15 November 2026, 18:00</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-200 font-medium">
            <MapPin className="w-4 h-4 text-purple-300 shrink-0" />
            <span>Stadion Gelora 10 November</span>
          </div>
        </div>
      </div>

      {/* Card Detail & Pembelian */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* 1. KARTU PILIHAN KATEGORI TIKET */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Pilih Kategori Tiket
            </span>
            <span className="text-xs text-foreground/75 font-medium">
              3 Kategori Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EVENT_CATEGORIES.map((cat) => {
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
                    <span className="text-xs text-muted-foreground">Harga</span>
                    <span className="text-sm font-bold text-foreground">
                      Rp {cat.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ESTIMASI ALOKASI NOMOR KURSI (SEQUENTIAL AUTO-ASSIGNMENT) */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs">
          <Armchair className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                Alokasi Nomor Kursi:
              </span>
              <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/15">
                {quantity === 1
                  ? `${selectedCategory.rowPrefix}-0${ownedCount + 1}`
                  : `${selectedCategory.rowPrefix}-0${ownedCount + 1}, ${selectedCategory.rowPrefix}-0${ownedCount + 2}`}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Nomor kursi ditentukan otomatis berurutan sesuai urutan konfirmasi
              blok di blockchain (*Sequential Auto-Assignment*).
            </p>
          </div>
        </div>

        {/* 3. RINGKASAN HARGA & BATAS KUOTA */}
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
              Batas Maksimal Akun
            </span>
            <span className="text-base font-bold text-foreground">
              {ownedCount} / {MAX_PER_WALLET} Tiket
            </span>
            <span className="text-xs text-muted-foreground block">
              Anti-Scalping Rule
            </span>
          </div>
        </div>

        {/* Pilihan Jumlah Tiket (Maksimal 2 Tiket per Akun) */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-foreground block">
              Jumlah Tiket
            </span>
            <span className="text-xs text-foreground/75 font-medium">
              {isQuotaFull
                ? "Batas maksimal 2 tiket per akun telah tercapai."
                : `Sisa kuota akun Anda: ${remainingQuota} tiket (Maks. 2 tiket/akun)`}
            </span>
          </div>

          {!isQuotaFull ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isLoading}
                  className="px-3 py-1.5 text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition font-bold text-base cursor-pointer"
                  title="Kurangi jumlah tiket"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-foreground min-w-[2.5rem] text-center font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(remainingQuota, q + 1))
                  }
                  disabled={quantity >= remainingQuota || isLoading}
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
              Kuota Penuh (2/2 Tiket)
            </span>
          )}
        </div>

        {/* Alamat Penerima (Smart Account Pembeli) */}
        <div className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground/80 font-medium">
            <Wallet className="h-4 w-4 text-primary shrink-0" />
            <span>Penerima NFT:</span>
          </div>
          <span
            className="font-mono text-foreground font-semibold truncate max-w-[240px] sm:max-w-none"
            title={walletAddress}
          >
            {walletAddress}
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

        {/* Pesan Error */}
        {result && !result.success && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2.5 text-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pembelian Gagal</p>
              <p className="text-xs text-red-300/90 mt-0.5">{result.message}</p>
            </div>
          </div>
        )}

        {/* Tombol Beli Tiket */}
        <button
          type="button"
          onClick={handleBuyTicket}
          disabled={isLoading || isQuotaFull}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-primary/25 transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Memproses Minting ({quantity} Tiket)...</span>
            </>
          ) : isQuotaFull ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>Batas Kuota 2 Tiket Telah Tercapai</span>
            </>
          ) : (
            <>
              <Ticket className="h-5 w-5" />
              <span>
                Beli {quantity} Tiket Sekarang (Rp{" "}
                {totalPrice.toLocaleString("id-ID")})
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
