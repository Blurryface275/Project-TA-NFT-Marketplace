import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { QrCode, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

export default async function VerifyPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Venue Gate Access Control
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Verifikasi Tiket Gerbang Masuk
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Panel pemindai gerbang staf venue dengan protokol verifikasi Dual-Scan (Dynamic QR & KTP Fisik).
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-card border border-border shadow-sm text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <QrCode className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Modul Scanner Gerbang Segera Hadir
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Halaman ini sedang dipersiapkan untuk mengintegrasikan kamera pemindai QR Code WebAuthn dan validasi KTP keccak256 secara on-chain ke Sepolia Testnet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-left text-xs text-muted-foreground">
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
            <QrCode className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Scan 1: Dynamic QR</p>
              <p>Mengecek WebAuthn signature dan countdown expiry 60 detik.</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Scan 2: NIK KTP Fisik</p>
              <p>Verifikasi hash identitas keccak256 tanpa simpan NIK mentah (UU PDP).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
