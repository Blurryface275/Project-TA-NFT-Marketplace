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

export default function NavbarWalletButton({
  initialWalletAddress,
  userEmail,
  userName = "User",
  userRole = "CUSTOMER",
}: NavbarWalletButtonProps) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>(
    initialWalletAddress || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleActivate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const emailToUse = userEmail || "customer@example.com";
      const passkey = await registerPasskey(emailToUse);

      const res = await activateWalletAction({
        pubX: passkey.pubX,
        pubY: passkey.pubY,
        credentialId: passkey.credentialId,
        walletAddress: passkey.walletAddress,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to activate ticket wallet.");
        return;
      }

      setWalletAddress(passkey.walletAddress);
      router.refresh();
    } catch (err: unknown) {
      console.error("Passkey activation error:", err);
      const msg =
        err instanceof Error ? err.message : "Passkey registration was cancelled.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Open profile menu"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-stone-200/50 border border-black/[0.08] transition cursor-pointer focus:outline-none"
      >
        <div className="w-7 h-7 rounded-full bg-[#FBECE7] text-[#D94520] border border-[#D94520]/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          {(userName || "U").charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-[#171717] max-w-[130px] truncate hidden sm:inline-block">
          {userName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#736E65] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-[#FBECE7] text-[#D94520] border border-[#D94520]/20 flex items-center justify-center font-bold text-xs shrink-0">
              {(userName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="font-semibold text-sm text-[#171717] truncate leading-tight">
                {userName}
              </span>
              <span className="text-xs text-[#736E65] truncate leading-tight mt-0.5">
                {userEmail || "user@example.com"}
              </span>
            </div>
          </div>

          {/* Account status */}
          <div className="p-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.06] my-2">
            <div className="text-[11px] font-medium text-[#736E65] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-[#171717]">
                <Wallet className="w-3.5 h-3.5 text-[#D94520]" />
                <span>Ticket Passkey ID</span>
              </span>
              {walletAddress ? (
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-[#D94520] font-semibold bg-[#FBECE7] px-1.5 py-0.5 rounded">
                  Unactivated
                </span>
              )}
            </div>

            {walletAddress ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-medium text-[#171717] truncate">
                  {formatAddress(walletAddress)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy wallet address"
                    className="p-1 rounded hover:bg-stone-200 text-[#736E65] hover:text-[#171717] transition cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Inspect on Sepolia explorer"
                    className="p-1 rounded hover:bg-stone-200 text-[#736E65] hover:text-[#171717] transition"
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
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-[#D94520] hover:bg-[#BF3B19] disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Activate Biometrics</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/buy"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs text-[#171717] font-medium transition"
            >
              <ShoppingBag className="w-4 h-4 text-[#736E65]" />
              <span>Explore Events</span>
            </Link>

            <Link
              href="/dashboard/tickets"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs text-[#171717] font-medium transition"
            >
              <Ticket className="w-4 h-4 text-[#736E65]" />
              <span>My Tickets</span>
            </Link>

            <Link
              href="/dashboard/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs text-[#171717] font-medium transition"
            >
              <History className="w-4 h-4 text-[#736E65]" />
              <span>Orders</span>
            </Link>

            <Link
              href="/dashboard/resale"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs text-[#171717] font-medium transition"
            >
              <Repeat className="w-4 h-4 text-[#736E65]" />
              <span>Resale Exchange</span>
            </Link>

            {userRole === "ORGANIZER" && (
              <Link
                href="/dashboard/admin/events/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#FBECE7] text-xs text-[#D94520] font-medium transition"
              >
                <CalendarPlus className="w-4 h-4 text-[#D94520]" />
                <span>Create Event</span>
              </Link>
            )}

            <Link
              href="/dashboard/verify"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-xs text-[#171717] font-medium transition"
            >
              <CheckCircle2 className="w-4 h-4 text-[#736E65]" />
              <span>Gate Terminal</span>
            </Link>
          </div>

          <div className="h-px bg-black/[0.06] my-1.5" />

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-xs text-[#736E65] hover:text-rose-600 font-medium transition text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
