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
} from "lucide-react";

interface BuyTicketCardProps {
  walletAddress: string;
}

export default function BuyTicketCard({ walletAddress }: BuyTicketCardProps) {
  // State untuk melacak status transaksi dan loading
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BuyTicketState | null>(null);

  // Event ID dan Kategori ID yang sudah diinitialize di smart contract
  const EVENT_ID = 1; // masih hardocde karena belum terintegrasi langsung dengan API relayer (Admin Backend)
  const CATEGORY_ID = 1;

  // function yang akan dipanggil ketika user menekan tombol buy
  const handleBuyTicket = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Panggil Server Action yang berkomunikasi dengan Backend Relayer
      const res = await buyTicketAction(EVENT_ID, CATEGORY_ID);
      setResult(res);
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            VIP PASS
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white mt-3">
          UBAYA Music Fest 2026
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Konser Musik UBAYA</p>

        {/* Informasi Jadwal & Lokasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/40 text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>15 November 2026, 18:00</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>Stadion Gelora 10 November</span>
          </div>
        </div>
      </div>

      {/* Card Detail & Pembelian */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Detail Harga & Kuota */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
          <div>
            <span className="text-xs text-muted-foreground block">
              Harga Tiket
            </span>
            <span className="text-lg font-bold text-foreground">
              Rp 150.000
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">
              Gas Fee (Jaringan)
            </span>
            <span className="text-lg font-bold text-emerald-500 flex items-center gap-1">
              Rp 0{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Gasless)
              </span>
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground block">
              Maksimal per Dompet
            </span>
            <span className="text-lg font-bold text-foreground">4 Tiket</span>
          </div>
        </div>

        {/* Alamat Penerima (Smart Account Pembeli) */}
        <div className="p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary shrink-0" />
            <span>Penerima NFT:</span>
          </div>
          <span
            className="font-mono text-foreground font-medium truncate max-w-[240px] sm:max-w-none"
            title={walletAddress}
          >
            {walletAddress}
          </span>
        </div>

        {/* Fitur Keamanan Anti-Scalping */}
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Tiket ini dicetak langsung ke blockchain Ethereum (Sepolia). Tiket
            dilindungi oleh aturan anti-tengkulak, menjamin keaslian dan
            mencegah pemalsuan kode QR.
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
              {result.txHash && (
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
              )}
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
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-primary/25 transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Ticket className="h-5 w-5" />
              <span>
                {result?.success ? "Beli Tiket Lagi" : "Beli Tiket Sekarang"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
