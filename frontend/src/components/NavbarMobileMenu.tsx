"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ShoppingBag,
  Ticket,
  History,
  Repeat,
  Zap,
} from "lucide-react";

interface NavbarMobileMenuProps {
  userRole: string;
  isLoggedIn: boolean;
}

export default function NavbarMobileMenu({
  userRole,
  isLoggedIn,
}: NavbarMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
        className="inline-flex items-center justify-center p-2 rounded-lg text-[#171717] hover:bg-black/[0.05] border border-black/[0.08] transition cursor-pointer"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Navigasi mobile"
          className="absolute left-0 right-0 top-16 z-50 border-b border-black/[0.08] bg-[#FAF9F6] px-4 py-3 shadow-lg"
        >
          <div className="flex flex-col gap-1 text-sm font-medium">
            {userRole === "ORGANIZER" ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <Calendar className="h-4 w-4 text-[#736E65]" />
                  <span>Event Saya</span>
                </Link>
                <Link
                  href="/dashboard/admin/events/new"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#FF5A36] hover:bg-[#FFF5F2] font-semibold whitespace-nowrap transition"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>Buat Event</span>
                </Link>
                <Link
                  href="/dashboard/verify"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#736E65]" />
                  <span>Pindai Tiket (Gate)</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/buy"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <ShoppingBag className="h-4 w-4 text-[#736E65]" />
                  <span>Explore events</span>
                </Link>
                <Link
                  href="/dashboard/flash-sale"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#FF5A36] hover:bg-[#FFF5F2] font-semibold whitespace-nowrap transition"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Flash Sale</span>
                </Link>
                <Link
                  href="/dashboard/tickets"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <Ticket className="h-4 w-4 text-[#736E65]" />
                  <span>My tickets</span>
                </Link>
                <Link
                  href="/dashboard/orders"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <History className="h-4 w-4 text-[#736E65]" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/dashboard/resale"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  <Repeat className="h-4 w-4 text-[#736E65]" />
                  <span>Resale</span>
                </Link>
              </>
            )}

            {!isLoggedIn && (
              <div className="pt-2 mt-1 border-t border-black/[0.06] flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex-1 text-center px-3 py-2 rounded-lg border border-black/[0.08] text-xs font-semibold text-[#171717] hover:bg-black/[0.04] whitespace-nowrap transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="flex-1 text-center px-3 py-2 rounded-lg bg-[#FF5A36] hover:bg-[#E54823] text-xs font-semibold text-white whitespace-nowrap transition"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
