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
  CalendarPlus,
  LogIn,
  UserPlus,
  History,
} from "lucide-react";
import NavbarWalletButton from "./NavbarWalletButton";

export default async function Navbar() {
  // Ambil data session user langsung di server
  const session = await getSession();
  const isLoggedIn = !!session?.userId; // true jika udh login, false jika blm login
  const userEmail = (session?.email as string) || "";
  const userRole = (session?.role as string) || "CUSTOMER";

  // Helper untuk memotong alamat dompet (misal: 0x811a...61Eb)
  const formatAddress = (addr?: string) => {
    if (!addr) return "Belum Aktif";
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
            href={isLoggedIn ? "/dashboard" : "/"}
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

          {userRole === "ORGANIZER" && (
            <Link
              href="/dashboard/admin/events/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition font-semibold"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Buat Event</span>
            </Link>
          )}

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
          {isLoggedIn ? (
            /* Komponen Profil & Wallet ala Polymarket (Tombol Buat Wallet + Avatar Dropdown) */
            <NavbarWalletButton
              initialWalletAddress={walletAddress}
              userEmail={userEmail}
              userName={userName}
            />
          ) : (
            /* Tampilan jika belum login (Tamu / Guest) */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-semibold transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Daftar Akun</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
