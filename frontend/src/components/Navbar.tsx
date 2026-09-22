import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getSession } from "@/lib/session";
import {
  Ticket,
  LayoutDashboard,
  ShoppingBag,
  CheckCircle2,
  Repeat,
  LogOut,
  Wallet,
} from "lucide-react";

export default async function Navbar() {
  // Ambil data session user langsung di server
  const session = await getSession();

  // Helper untuk memotong alamat dompet (misal: 0x811a...61Eb)
  const formatAddress = (addr?: string) => {
    if (!addr) return "0x00...0000";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const userName = (session?.name as string) || "User";
  const walletAddress = (session?.walletAddress as string) || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-6 sm:px-8 relative">
        {/* SISI KIRI: BRAND LOGO */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition"
          >
            <Ticket className="h-5 w-5" />
            <span>NFT Ticket</span>
          </Link>
        </div>

        {/* SISI TENGAH: MENU NAVIGASI */}
        <nav className="hidden md:flex items-center gap-12 text-sm font-medium absolute left-1/2 -translate-x-1/2">
          <Link
            href="/dashboard/buy"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Buy Ticket</span>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <Ticket className="h-4 w-4" />
            <span>My Ticket</span>
          </Link>

          {/* Menu Resale (Disabled / Coming Soon) */}
          <div className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground/50 cursor-not-allowed select-none">
            <Repeat className="h-4 w-4" />
            <span>Resale Ticket</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
              Soon
            </span>
          </div>

          <Link
            href="/dashboard/verify"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Verify Ticket</span>
          </Link>
        </nav>

        {/* 3. SISI KANAN: PROFIL & SIGN OUT (RATA KANAN) */}
        <div className="flex items-center gap-3">
          {/* Pill Badge Identitas User & Alamat Smart Account */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm text-xs">
            <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-foreground leading-none">
                {userName}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                <Wallet className="h-3 w-3" />
                {formatAddress(walletAddress)}
              </span>
            </div>
          </div>

          {/* Tombol Logout (Server Action) */}
          <form action={logout}>
            <button
              type="submit"
              title="Keluar dari akun"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 text-muted-foreground text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
