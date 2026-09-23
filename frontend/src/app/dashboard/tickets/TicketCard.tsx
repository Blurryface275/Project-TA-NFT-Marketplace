"use client";

import { useState, useEffect } from "react";
import { redeemTicketAction, RedeemTicketState } from "./actions";
import {
  Ticket,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
  Lock,
  Timer,
  RefreshCw,
  KeyRound,
} from "lucide-react";

export interface TicketData {
  tokenId: number;
  eventId: number;
  categoryId: number;
  originalPrice: number;
  used: boolean;
  owner: string;
}

interface TicketCardProps {
  // properti apa aja yg dikirim dari halaman utama
  ticket: TicketData; // menerima data tiket
}

export default function TicketCard({ ticket }: TicketCardProps) {
  // ini kita pakai TIcketCardProps sbg tipe data yg masuk ke komponen

  const [isUsed, setIsUsed] = useState(ticket.used);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60); // waktu dihitung sbeannyak 60 detik
  const [nonce, setNonce] = useState<number>(() =>
    Math.floor(Math.random() * 1000000),
  );
  const [signedAt, setSignedAt] = useState<string>("");
  const [result, setResult] = useState<RedeemTicketState | null>(null);

  // timer hitung mundur 60 deitk saat QR sednag dibuka
  useEffect(() => {
    if (!showQR || isUsed || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000); // jika timer <= 1 maka diset ke 0, namun jika tidak maka dikurangi terus

    return () => clearInterval(interval); // ini penting untuk menghentikan interval saat komponen di-unmount agar tidak terjadi memory leak
  }, [showQR, isUsed, timeLeft]); // hanya jalankan effect ketika showQR atau isUsed berubah

  // Handler saat user klik "Lihat QR gate" -> akan muncul prompt passkey (Face ID/PIN/Windows Hello/Biometric)
  // Handler saat user klik "Lihat QR gate" -> akan muncul prompt passkey (Face ID/PIN/Windows Hello/Biometric)
  const handleToggleQR = async () => {
    // Jika QR sedang terbuka, klik tombol ini buat tutup
    if (showQR) {
      setShowQR(false);
      return;
    }
    // Jika tiket sudah terpakai, jangan izinkan buka QR lagi
    if (isUsed) return;

    setIsSigning(true);

    try {
      // generate payload data QR
      const currentNonce = Math.floor(Math.random() * 1000000);
      const currentTime = new Date().toISOString();
      const challengeStr = `NFTIX-AUTH:Token#${ticket.tokenId}:Owner#${ticket.owner}:Nonce#${currentNonce}:Time#${currentTime}`; // ini challenge gabungan dari berbagai properti ticket

      let generatedSignature = "";

      // panggil WebAuthn API browser
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          // fungsi challengeBuffer di sini adalah untuk mengubah data dari String → ArrayBuffer
          // ArrayBuffer adalah format representasi biner mentah yang wajib diterima oleh WebAuthn API
          const challengeBuffer = new TextEncoder().encode(challengeStr);
          const assertion = (await navigator.credentials.get({
            publicKey: {
              challenge: challengeBuffer,
              timeout: 60000, // 60 detik, jika lebih dari itu maka dianggap gagal
              userVerification: "preferred", // mengizinkan user memakai PIN / FaceID / Fingerprint
            },
          })) as PublicKeyCredential | null;

          if (assertion && assertion.response) {
            const resp = assertion.response as AuthenticatorAssertionResponse;
            // mengubah signature format menjadi hexadecimal string
            // kenapa diubah jadi hexadecimal? karena format binary raw tidak bisa dibaca/ditransmisikan via JSON QR
            const sigBytes = new Uint8Array(resp.signature);
            // Expected signature output:
            // 0x691d643298b6642b561d27021e49b87f650125d4e18f2aa1ac94a7051d4c161b7a8f71a2355f832b5de15362b5f1eb50a7e5059045d7599864a222b7e944e41b
            generatedSignature =
              "0x" +
              Array.from(sigBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
          }
        } catch {
          // Fallback crypto hash jika dialog di-cancel atau di browser dev tanpa authenticator
          const randomBytes = crypto.getRandomValues(new Uint8Array(32)); // ini akan hasilin 32 random bytes (raw binary data)
          generatedSignature =
            "0x" +
            Array.from(randomBytes)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
        }
      } else {
        // akan dijalankan jika user memakai browser tanpa WebAuthn API, contohnya: old browser
        const randomBytes = new Uint8Array(32);
        crypto.getRandomValues(randomBytes);
        generatedSignature =
          "0x" +
          Array.from(randomBytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
      }

      // setelah mendapatkan signature maka simpan signature & reset masa berlaku ke 60 detik penuh
      setSignature(generatedSignature);
      setTimeLeft(60); // reset timer jadi 60 detik lagi
      setNonce(currentNonce);
      setSignedAt(currentTime);
      setShowQR(true); // tampilkan QR code setelah signature siap
    } catch (error) {
      console.error("Gagal mengaktifkan fitur QRGate:", error);
      setShowQR(false); // jika gagal maka tidak tampilkan QR code
      alert(
        "Gagal membuka fitur QR Gate. Pastikan browser mendukung WebAuthn API dan kamu telah login dengan akun yang valid.",
      );
    } finally {
      setIsSigning(false); // selesai proses sign, matikan loader
    }
  };

  // Payload data untuk QR Code gerbang masuk (Gate Verification oleh petugas)
  const qrPayload = {
    tokenId: ticket.tokenId,
    eventId: ticket.eventId,
    categoryId: ticket.categoryId,
    owner: ticket.owner,
    used: isUsed,
    walletAddress: ticket.owner,
    nonce: nonce,
    signedAt: signedAt,
    expiresInSeconds: timeLeft,
    signature: signature,
  };

  // generate URL QR Code dinamis dari payload sebelumnya
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    JSON.stringify(qrPayload),
  )}`;

  // function untuk memanggil api/redeem
  const handleRedeem = async () => {
    if (isUsed) return;

    const confirmRedeem = confirm(
      `Apakah anda yakin ingin me-redeem Tiket ${ticket.tokenId}?`,
    );

    if (!confirmRedeem) return; // return ini menghentikan function handleRedeem agar tidak melanjutkan ke proses berikutnya

    // Set status loading menjadi true agar muncul icon loader
    setIsLoading(true);
    setResult(null);

    try {
      // Panggil Server Avtion yang berkomunikasi dengan Backend Relayer
      // acitons.ts nanti akan mengirimkan hasil ke variabel result berupa object
      const result = await redeemTicketAction(ticket.tokenId); // parameter pertama token id
      setResult(result);

      // ubah status tiket menjadi sudah terpakai
      if (result.success) {
        setIsUsed(true);
      }
    } catch (err) {
      setResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    } finally {
      //finally ini akan selalu dieksekusi
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isUsed
          ? "bg-card/60 border-border/40 opacity-80"
          : "bg-card border-border hover:border-primary/50 hover:shadow-primary/10"
      }`}
    >
      {/* Header Tiket: Banner Gradasi */}
      <div
        className={`p-5 border-b ${
          isUsed
            ? "bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900 border-border/40"
            : "bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-background border-border/60"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Badge Token ID */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/20 text-white border border-primary/30">
            <Ticket className="w-3 h-3" />
            TOKEN #{ticket.tokenId}
          </span>
          {/* Status Badge */}
          {isUsed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
              <Lock className="w-3 h-3" />
              SUDAH DIGUNAKAN
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-500/15 text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-900"></span>
              AKTIF
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight mt-2">
          UBAYA Music Fest 2026
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          VIP PASS • Festival Area
        </p>
      </div>
      {/* Info Waktu & Lokasi */}
      <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>15 November 2026, 18:00 WIB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>Stadion Gelora 10 November</span>
        </div>
      </div>
      {/* Badan Tiket */}
      <div className="p-5 space-y-4">
        {/* Info Harga Asli & Kategori */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">
              Harga Asli (On-Chain)
            </span>
            <span className="text-sm font-bold text-foreground">
              Rp {Number(ticket.originalPrice).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">
              Kategori
            </span>
            <span className="text-sm font-bold text-amber-400">VIP Ticket</span>
          </div>
        </div>
        {/* Alamat Dompet Pemilik */}
        <div className="p-2.5 rounded-lg bg-background border border-border/60 text-[11px] flex items-center justify-between">
          <span className="text-muted-foreground">Pemilik:</span>
          <span
            className="font-mono text-foreground font-medium truncate max-w-[200px]"
            title={ticket.owner}
          >
            {ticket.owner}
          </span>
        </div>
        {/* QR Code Section (Bisa di-toggle muncul/tutup) */}
        {showQR && (
          <div className="p-5 rounded-2x flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
            <div className="relative p-3shadow-inner">
              {timeLeft > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageUrl}
                  alt={`QR Code Tiket #${ticket.tokenId}`}
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center bg-zinc-100 text-zinc-500 rounded-lg p-3 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-800">
                    QR Kedaluwarsa
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Masa berlaku 1 menit telah habis
                  </p>
                </div>
              )}
            </div>
            {/* Indikator Status & Countdown Timer */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span>Masa Berlaku:</span>
                </span>
                <span
                  className={`font-mono font-bold ${
                    timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-black"
                  }`}
                >
                  {timeLeft > 0 ? `${timeLeft} Detik` : "Kedaluwarsa"}
                </span>
              </div>
              {/* Progress Bar Menyusut dari 60s ke 0s */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    timeLeft <= 10 ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
              {/* Tombol Perbarui jika Expired */}
              {timeLeft === 0 && (
                <button
                  type="button"
                  onClick={handleToggleQR}
                  className="mt-2 inline-flex text-black items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-semibold transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Verifikasi Ulang Passkey</span>
                </button>
              )}
            </div>
          </div>
        )}
        {/* Notifikasi Hasil Transaksi Redeem */}
        {result?.success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{result.message}</span>
            </div>
            {result.txHash && (
              <p className="font-mono text-[11px] text-muted-foreground break-all pl-5">
                Tx:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  {result.txHash.slice(0, 20)}...
                </a>
              </p>
            )}
          </div>
        )}
        {/* Notifikasi Error */}
        {result && !result.success && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Redeem Gagal</p>
              <p className="text-muted-foreground mt-0.5">{result.message}</p>
            </div>
          </div>
        )}
        {/* Tombol Aksi */}
        <div className="flex items-center gap-2 pt-1">
          {/* Tombol Tampilkan QR dengan Passkey */}
          <button
            type="button"
            onClick={handleToggleQR}
            disabled={isSigning || isUsed}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer disabled:opacity-50"
          >
            {isSigning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Meminta Passkey...</span>
              </>
            ) : showQR ? (
              <>
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>Tutup QR</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-primary" />
                <span>Lihat QR Gate (Passkey)</span>
              </>
            )}
          </button>

          {/* Tombol Redeem On-Chain */}
          <button
            type="button"
            onClick={handleRedeem}
            disabled={isUsed || isLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isUsed
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isUsed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tiket Hangus</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Redeem Tiket</span>
              </>
            )}
          </button>
        </div>
        {/* Link ke Smart Contract Sepolia Etherscan */}
        <div className="pt-2 text-center border-t border-border/30">
          <a
            href={`https://sepolia.etherscan.io/token/0x4A6e85fACA6df9eb2dB5BA832B4B48790D60F9b3?a=${ticket.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <span>Verifikasi NFT di Sepolia Etherscan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
