"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerPasskey } from "@/lib/passkey";
import { activateWalletAction } from "@/app/dashboard/buy/actions";
import { logout } from "@/app/login/actions";
import {
  Wallet,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Ticket,
  ShoppingBag,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  History,
  Repeat,
  CalendarPlus,
} from "lucide-react";

interface NavbarWalletButtonProps {
  initialWalletAddress?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

// Menu profil dropdown sesuai standar E-Commerce Utility Minimalist (NFTix)
export default function NavbarWalletButton({
  initialWalletAddress,
  userEmail,
  userName = "User",
  userRole = "CUSTOMER",
}: NavbarWalletButtonProps) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>(
    initialWalletAddress || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const menuRef = useRef<HTMLDivElement>(null);

  // Inisialisasi tema saat pertama kali render di browser
  useEffect(() => {
    const saved = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  // Fungsi pengganti tema (Light / Dark / System)
  const applyTheme = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Menutup dropdown jika user klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper untuk salin alamat akun tiket
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper pemotong alamat akun tiket (misal: 0x811a...61Eb)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Trigger pembuatan Akun Tiket Passkey (relocated to dropdown)
  const handleActivate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const emailToUse = userEmail || "";
      const passkey = await registerPasskey(emailToUse);

      const res = await activateWalletAction({
        pubX: passkey.pubX,
        pubY: passkey.pubY,
        credentialId: passkey.credentialId,
        walletAddress: passkey.walletAddress,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Gagal mengaktifkan akun tiket.");
        return;
      }

      setWalletAddress(passkey.walletAddress);
      router.refresh();
    } catch (err) {
      console.error("[Navbar] Gagal mengaktifkan akun tiket: ", err);
      setErrorMessage("Gagal membuat passkey. Coba lagi atau hubungi support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 relative" ref={menuRef}>
      {/* Popover notifikasi error pembuatan akun */}
      {errorMessage && (
        <div className="absolute top-full right-0 mt-1.5 w-60 p-2.5 rounded-xl bg-red-950/90 border border-red-500/30 text-[11px] text-red-200 shadow-xl z-50 animate-in fade-in">
          {errorMessage}
        </div>
      )}

      {/* Profil Trigger Button (Avatar Inisial Coral + Nama Pengguna) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Buka menu profil"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer focus:outline-none"
      >
        <div className="w-7 h-7 rounded-full bg-[#FFF5F2] text-[#FF5A36] dark:bg-coral-950/50 dark:text-coral-400 border border-coral-200/80 dark:border-coral-900/50 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          {(userName || "U").charAt(0).toUpperCase()}
        </div>
        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 max-w-[130px] truncate hidden sm:inline-block">
          {userName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/60 bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
          {/* 1. Header: Avatar + Nama + Email */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-[#FFF5F2] text-[#FF5A36] dark:bg-coral-950/50 dark:text-coral-400 border border-coral-200/80 dark:border-coral-900/50 flex items-center justify-center font-bold text-xs shrink-0">
              {(userName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="font-semibold text-sm text-foreground truncate leading-tight">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {userEmail || "user@example.com"}
              </span>
            </div>
          </div>

          {/* 2. Segmented Theme Switcher (Light / Dark / System) */}
          <div className="bg-muted/70 p-1 rounded-xl flex items-center justify-between my-2.5">
            <button
              type="button"
              onClick={() => applyTheme("light")}
              title="Tema Terang (Light)"
              className={`flex-1 py-1 flex items-center justify-center rounded-lg transition text-xs ${
                theme === "light"
                  ? "bg-card text-coral-500 shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyTheme("dark")}
              title="Tema Gelap (Dark)"
              className={`flex-1 py-1 flex items-center justify-center rounded-lg transition text-xs ${
                theme === "dark"
                  ? "bg-card text-coral-500 shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyTheme("system")}
              title="Tema Sistem (System)"
              className={`flex-1 py-1 flex items-center justify-center rounded-lg transition text-xs ${
                theme === "system"
                  ? "bg-card text-coral-500 shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* 3. ID Akun Tiket (Tanpa Jargon Blockchain) */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 mb-2">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-coral-500" />
                <span>ID Akun Tiket</span>
              </span>
              {walletAddress ? (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                  Belum Aktif
                </span>
              )}
            </div>

            {walletAddress ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                  {formatAddress(walletAddress)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Salin alamat akun tiket"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Cek Verifikasi di Penjelajah Jaringan"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-coral-500 hover:bg-coral-600 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat Akun...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Aktifkan Akun Tiket</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 4. Menu Links (Termasuk akses mobile lengkap) */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/buy"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <span>Beli Tiket</span>
            </Link>

            <Link
              href="/dashboard/tickets"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <Ticket className="w-4 h-4 text-muted-foreground" />
              <span>Tiket Saya</span>
            </Link>

            <Link
              href="/dashboard/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <History className="w-4 h-4 text-muted-foreground" />
              <span>Pesanan</span>
            </Link>

            <Link
              href="/dashboard/resale"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <Repeat className="w-4 h-4 text-muted-foreground" />
              <span>Pasar Resale</span>
            </Link>

            {userRole === "ORGANIZER" && (
              <Link
                href="/dashboard/admin/events/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/10 text-xs text-purple-600 dark:text-purple-400 font-medium transition"
              >
                <CalendarPlus className="w-4 h-4 text-purple-500" />
                <span>Buat Event</span>
              </Link>
            )}

            <Link
              href="/dashboard/verify"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              <span>Verifikasi Tiket</span>
            </Link>
          </div>

          {/* 5. Divider */}
          <div className="h-px bg-border/60 my-1.5" />

          {/* 6. Tombol Log Out */}
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-xs text-muted-foreground hover:text-red-500 font-medium transition text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
