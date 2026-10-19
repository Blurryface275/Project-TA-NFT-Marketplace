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
} from "lucide-react";

interface NavbarWalletButtonProps {
  initialWalletAddress?: string;
  userEmail?: string;
  userName?: string;
}

// Menu profil dropdown sesuai desain mockup
export default function NavbarWalletButton({
  initialWalletAddress,
  userEmail,
  userName = "User",
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

  // Helper untuk salin alamat dompet
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper pemotong alamat dompet (misal: 0x811a...61Eb)
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Trigger pembuatan Smart Account Passkey
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
        setErrorMessage(res.message || "Gagal mengaktifkan dompet.");
        return;
      }

      setWalletAddress(passkey.walletAddress);
      router.refresh();
    } catch (err) {
      console.error("[Navbar] Gagal mengaktifkan wallet: ", err);
      setErrorMessage("Gagal membuat passkey. Coba lagi atau hubungi support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 relative" ref={menuRef}>
      {/* Tombol Buat Wallet (jika belum ada dompet terdaftar) */}
      {!walletAddress && (
        <button
          type="button"
          onClick={handleActivate}
          disabled={isLoading}
          title="Klik untuk membuat Smart Account dengan Passkey"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-sm transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Membuat...</span>
            </>
          ) : (
            <>
              <Wallet className="w-3.5 h-3.5" />
              <span>Buat Wallet</span>
            </>
          )}
        </button>
      )}

      {/* Popover notifikasi error pembuatan wallet */}
      {errorMessage && (
        <div className="absolute top-full right-12 mt-1.5 w-48 p-2 rounded-lg bg-red-950/90 border border-red-500/30 text-[10px] text-red-300 shadow-xl z-50 animate-in fade-in">
          {errorMessage}
        </div>
      )}

      {/* Avatar Profil Bulat Elegan */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Buka menu profil"
        className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition cursor-pointer focus:outline-none"
      >
        {(userName || "U").charAt(0).toUpperCase()}
      </button>

      {/* Dropdown Popover Card Sesuai Mockup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/60 bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
          {/* 1. Header: Avatar + Nama + Email */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center font-bold text-xs shrink-0">
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
                  ? "bg-card text-purple-600 dark:text-purple-400 shadow-sm font-semibold"
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
                  ? "bg-card text-purple-600 dark:text-purple-400 shadow-sm font-semibold"
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
                  ? "bg-card text-purple-600 dark:text-purple-400 shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Smart Account (Wallet Status Pill) */}
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50 mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-[11px] font-medium text-foreground truncate">
                {walletAddress ? formatAddress(walletAddress) : "Belum Ada Wallet"}
              </span>
            </div>

            {walletAddress ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Salin alamat dompet"
                  className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Lihat di Sepolia Etherscan"
                  className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={isLoading}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Buat
              </button>
            )}
          </div>

          {/* 4. Menu Links */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/tickets"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <Ticket className="w-4 h-4 text-muted-foreground" />
              <span>Tiket Saya</span>
            </Link>

            <Link
              href="/dashboard/buy"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground font-medium transition"
            >
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <span>Beli Tiket</span>
            </Link>

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
