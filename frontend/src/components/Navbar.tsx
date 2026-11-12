import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  Ticket,
  ShoppingBag,
  CheckCircle2,
  Repeat,
  CalendarPlus,
  LogIn,
  UserPlus,
  History,
} from "lucide-react";
import NavbarWalletButton from "./NavbarWalletButton";

export default async function Navbar() {
  // Ambil data session user langsung di server
  const session = await getSession();
  const isLoggedIn = !!session?.userId; // true jika sudah login, false jika belum login
  const userEmail = (session?.email as string) || "";
  const userRole = (session?.role as string) || "CUSTOMER";
  const userName = (session?.name as string) || "User";
  const walletAddress = (session?.walletAddress as string) || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        {/* SISI KIRI: BRAND LOGO */}
        <div className="flex items-center">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 tracking-tight hover:opacity-95 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-coral-50 border border-coral-100 flex items-center justify-center text-coral-500 shadow-xs group-hover:bg-coral-500 group-hover:text-white transition-all">
              <Ticket className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-[19px] tracking-tight text-slate-900 dark:text-white">
              NFT<span className="text-coral-500">ix</span>
            </span>
          </Link>
        </div>

        {/* SISI TENGAH: MENU NAVIGASI INDONESIA E-COMMERCE */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-medium absolute left-1/2 -translate-x-1/2">
          <Link
            href="/dashboard/buy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-coral-500 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Beli Tiket</span>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-coral-500 transition"
          >
            <Ticket className="h-4 w-4" />
            <span>Tiket Saya</span>
          </Link>

          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-coral-500 transition"
          >
            <History className="h-4 w-4" />
            <span>Pesanan</span>
          </Link>

          {/* Menu Pasar Sekunder Resmi (Pasar Resale) */}
          <Link
            href="/dashboard/resale"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-coral-500 transition"
          >
            <Repeat className="h-4 w-4" />
            <span>Pasar Resale</span>
          </Link>

          {userRole === "ORGANIZER" && (
            <Link
              href="/dashboard/admin/events/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold transition"
            >
              <CalendarPlus className="h-4 w-4" />
              <span>Buat Event</span>
            </Link>
          )}

          <Link
            href="/dashboard/verify"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-coral-500 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Verifikasi Tiket</span>
          </Link>
        </nav>

        {/* 3. SISI KANAN: PROFIL & SIGN OUT (RATA KANAN) */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <NavbarWalletButton
              initialWalletAddress={walletAddress}
              userEmail={userEmail}
              userName={userName}
              userRole={userRole}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-coral-500 text-white hover:bg-coral-600 text-xs font-semibold shadow-xs transition"
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
