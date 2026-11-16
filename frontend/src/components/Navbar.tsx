import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ShoppingBag,
  Ticket,
  History,
  Repeat,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import NavbarWalletButton from "./NavbarWalletButton";
import NavbarMobileMenu from "./NavbarMobileMenu";

export default async function Navbar() {
  const session = await getSession();
  const isLoggedIn = !!session?.userId;
  const userEmail = (session?.email as string) || "";
  const userRole = (session?.role as string) || "CUSTOMER";
  const userName = (session?.name as string) || "User";
  const walletAddress = (session?.walletAddress as string) || "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.08] bg-[#FAF9F6]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Warm Coral Dot */}
        <div className="flex items-center gap-8">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-1 group transition whitespace-nowrap"
          >
            <span className="font-extrabold text-2xl tracking-tight text-[#171717]">
              nftix<span className="text-[#FF5A36]">.</span>
            </span>
          </Link>

          {/* SISI KIRI-TENGAH: MENU NAVIGASI */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {userRole === "ORGANIZER" ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Event Saya</span>
                </Link>
                <Link
                  href="/dashboard/admin/events/new"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#FF5A36] hover:bg-[#FFF5F2] font-semibold whitespace-nowrap transition"
                >
                  <CalendarPlus className="h-4 w-4 shrink-0" />
                  <span>Buat Event</span>
                </Link>
                <Link
                  href="/dashboard/verify"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Pindai Tiket (Gate)</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/buy"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Explore events</span>
                </Link>
                <Link
                  href="/dashboard/flash-sale"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#FF5A36] hover:bg-[#FFF5F2] font-semibold whitespace-nowrap transition"
                >
                  <Zap className="h-4 w-4 shrink-0 fill-current" />
                  <span>Flash Sale</span>
                </Link>
                <Link
                  href="/dashboard/tickets"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <Ticket className="h-4 w-4 shrink-0" />
                  <span>My tickets</span>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <History className="h-4 w-4 shrink-0" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/dashboard/resale"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#736E65] hover:text-[#171717] hover:bg-stone-200/50 whitespace-nowrap transition"
                >
                  <Repeat className="h-4 w-4 shrink-0" />
                  <span>Resale</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* SISI KANAN: PROFIL ATAU AUTH + MOBILE MENU */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isLoggedIn ? (
            <NavbarWalletButton
              initialWalletAddress={walletAddress}
              userEmail={userEmail}
              userName={userName}
              userRole={userRole}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#FF5A36] px-3 py-2 whitespace-nowrap transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E54823] text-white text-xs sm:text-sm font-semibold shadow-xs whitespace-nowrap transition cursor-pointer"
              >
                <span>Get started</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          )}
          <NavbarMobileMenu userRole={userRole} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </header>
  );
}
