"use client";

import { useState, useEffect } from "react";
import {
  redeemTicketAction,
  RedeemTicketState,
  listTicketForResaleAction,
  cancelResaleListingAction,
  ResaleActionState,
} from "./actions";
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
  Armchair,
  Repeat,
} from "lucide-react";

export interface TicketData {
  tokenId: number;
  eventId: number;
  categoryId: number;
  originalPrice: number;
  used: boolean;
  owner: string;
  seatIndex?: number;
}

export interface TicketCategoryData {
  id: string;
  name: string;
  price: string | number;
  quota: number;
  eventsId: number;
}

export interface EventData {
  id: number;
  onChainEventId: string;
  eventName: string;
  startDate: string;
  venueLocation: string;
  category: string;
  capacity: number;
  maxPerWallet?: number;
  imageIpfsCid: string | null;
  organizersId?: number;
  ticketCategories: TicketCategoryData[];
}

// Helper pemetaan nama kategori dan nomor kursi berdsarkan categoryId & tokenId
export function getCategoryMeta(categoryId: number, tokenId: number){
  switch (categoryId){
    case 1:
      return{
        name: "VIP PASS",
        badgeColor: "text-amber-400",
        seatNumber: `VIP-A${String(tokenId).padStart(2, "0")}`,
        area: "Festival Area (Depan Panggung)"
      };
     case 2:
      return {
        name: "CAT 1 (TRIBUN)",
        badgeColor: "text-indigo-400",
        seatNumber: `CAT1-B${String(tokenId).padStart(2, "0")}`,
        area: "Tribun Utama (Baris B)",
      };
    case 3:
      return {
        name: "FESTIVAL",
        badgeColor: "text-emerald-400",
        seatNumber: `FEST-C${String(tokenId).padStart(2, "0")}`,
        area: "Festival Area (Tengah)",
      };
    default:
      return {
        name: `Kategori #${categoryId}`,
        badgeColor: "text-purple-400",
        seatNumber: `SEAT-${String(tokenId).padStart(2, "0")}`,
        area: "General Admission",
      };
  }
}

interface TicketCardProps {
  // properti apa aja yg dikirim dari halaman utama
  ticket: TicketData; // menerima data tiket
  events?: EventData[];
}

// Helper generator Nonce berbasis CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
// Mengambil entropy fisik langsung dari OS / Hardware via Web Crypto API (crypto.getRandomValues)
function getCSPRNGNonce(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(1); // menyiapkan wadah memorinya untuk integer 32 bit
    crypto.getRandomValues(buffer); // isi memori dengan entropi dari hardware / OS
    return buffer[0]; // Integer acak 32-bit (0 s/d 4.294.967.295) tahan prediksi serangan
  }
  return Math.floor(Math.random() * 1000000);
}

export default function TicketCard({ ticket, events = [] }: TicketCardProps) {
  // Cari data event yang sesuai dengan eventId tiket dari blockchain
  const currentEvent = events.find(
    (e) => Number(e.onChainEventId || e.id) === ticket.eventId,
  );

  // Cari data kategori tiket yang sesuai dari event
  const matchedCategory = (currentEvent?.ticketCategories || []).find(
    (c) => Number(c.id) === ticket.categoryId,
  );

  // Tentukan nama kategori secara dinamis
  const fallbackMeta = getCategoryMeta(ticket.categoryId, ticket.tokenId);
  const categoryName = matchedCategory?.name || fallbackMeta.name;

  // Tentukan prefiks kursi secara dinamis
  const seatPrefix = categoryName.includes("VIP")
    ? "VIP"
    : categoryName.includes("CAT")
      ? "CAT1"
      : categoryName.includes("Regular")
        ? "REG"
        : "FEST";

  // Gunakan seatIndex (urutan kursi per event & kategori) jika tersedia, fallback ke tokenId
  const seatIndex = ticket.seatIndex || ticket.tokenId;
  const seatNumber = `${seatPrefix}-${String(seatIndex).padStart(2, "0")}`;
  const badgeColor = categoryName.includes("VIP")
    ? "text-amber-400"
    : categoryName.includes("CAT")
      ? "text-indigo-400"
      : categoryName.includes("Regular")
        ? "text-cyan-400"
        : "text-emerald-400";

  // Format tanggal event sesuai zona WIB
  const dateObj = currentEvent?.startDate
    ? new Date(currentEvent.startDate)
    : new Date("2026-11-28T19:00:00");
  const eventDateOnly = dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const eventTimeOnly =
    dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";

  const contractAddress =
    process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS ||
    "0x08F9F8e90570A08851ca60419ae656FEF227c8a4";

  const [isUsed, setIsUsed] = useState(ticket.used);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60); // waktu dihitung sbeannyak 60 detik
  const [nonce, setNonce] = useState<number>(() => getCSPRNGNonce());
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
      // generate payload data QR dengan Nonce CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
      const currentNonce = getCSPRNGNonce();
      const currentTime = new Date().toISOString();
      const challengeStr = `NFTIX-AUTH:Token#${ticket.tokenId}:Owner#${ticket.owner}:Nonce#${currentNonce}:Time#${currentTime}`; // ini challenge gabungan dari berbagai properti ticket

      let generatedSignature = "";

      // panggil WebAuthn API browser
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          // fungsi challengeBuffer di sini adalah untuk mengubah data dari String → ArrayBuffer
          // ArrayBuffer adalah format representasi biner mentah yang wajib diterima oleh WebAuthn API
          const challengeBuffer = new TextEncoder().encode(challengeStr);
          console.log("[WEBAUTHN] 1. Challenge String:", challengeStr);
          console.log(
            "[WEBAUTHN] 2. Challenge Buffer (Uint8Array mentah):",
            challengeBuffer,
          );

          // assertion ini akan menerima tandatangan dari WebAuthnAPI
          const assertion = (await navigator.credentials.get({
            publicKey: {
              challenge: challengeBuffer,
              timeout: 60000, // 60 detik, jika lebih dari itu maka dianggap gagal
              userVerification: "preferred", // mengizinkan user memakai PIN / FaceID / Fingerprint
            },
          })) as PublicKeyCredential | null;

          if (assertion && assertion.response) {
            // assertion.response berisi data autentikasi dari browser
            // dalam file lib.dom.d.ts (Line 4033), object AuthenticatorAssertionResponse memiliki 4 properti resmi:
            // 1. authenticatorData (ArrayBuffer)
            // 2. signature (ArrayBuffer)
            // 3. userHandle (ArrayBuffer | null)
            // 4. clientDataJSON (ArrayBuffer, diwarisi dari parent AuthenticatorResponse)
            // namun dalam implementasi kali ini kita hanya mengambil property resp.signature dari object tersebut
            const resp = assertion.response as AuthenticatorAssertionResponse;

            // mengubah signature format menjadi hexadecimal string
            // kenapa diubah jadi hexadecimal? karena format binary raw tidak bisa dibaca/ditransmisikan via JSON QR
            const sigBytes = new Uint8Array(resp.signature);

            // Log nilai mentah agar bisa diinspeksi langsung di DevTools browser console
            console.log(
              "[WEBAUTHN] 3. Objek Raw resp.signature (ArrayBuffer):",
              resp.signature,
            );
            console.log(
              "[WEBAUTHN] 4. sigBytes (Uint8Array mentah):",
              sigBytes,
            );
            console.log(
              "[WEBAUTHN] 5. sigBytes (Array angka desimal byte):",
              Array.from(sigBytes),
            );

            // =========================================================================================
            // PEMBUKTIAN LANGSUNG: Ekstraksi Nilai Kriptografis r dan s dari Pembungkus ASN.1 DER
            // =========================================================================================
            try {
              let offset = 2; // Lewati Tag 0x30 (SEQUENCE) dan panjang total
              if (sigBytes[0] === 0x30 && sigBytes[offset] === 0x02) {
                offset++; // Lewati tag 0x02 (INTEGER untuk r)
                const rLen = sigBytes[offset++];
                let rBytes = sigBytes.slice(offset, offset + rLen);
                offset += rLen;

                if (sigBytes[offset] === 0x02) {
                  offset++; // Lewati tag 0x02 (INTEGER untuk s)
                  const sLen = sigBytes[offset++];
                  let sBytes = sigBytes.slice(offset, offset + sLen);

                  // Hapus leading 0x00 padding jika ada (standar DER untuk angka bernilai >= 0x80)
                  if (rBytes.length === 33 && rBytes[0] === 0x00)
                    rBytes = rBytes.slice(1);
                  if (sBytes.length === 33 && sBytes[0] === 0x00)
                    sBytes = sBytes.slice(1);

                  const rHex =
                    "0x" +
                    Array.from(rBytes)
                      .map((b) => b.toString(16).padStart(2, "0"))
                      .join("");
                  const sHex =
                    "0x" +
                    Array.from(sBytes)
                      .map((b) => b.toString(16).padStart(2, "0"))
                      .join("");

                  console.log(
                    "%c======================================================\n" +
                      "🔐 BUKTI KRIPTOGRAFI PASSKEY (ECDSA NIST P-256)\n" +
                      "======================================================\n" +
                      `• Nilai r (Hex 32-Byte)   : ${rHex}\n` +
                      `• Nilai s (Hex 32-Byte)   : ${sHex}\n` +
                      `• Nilai r (Desimal BigInt): ${BigInt(rHex).toString()}\n` +
                      `• Nilai s (Desimal BigInt): ${BigInt(sHex).toString()}\n` +
                      "• Format Biner Asal       : ASN.1 DER Sequence (Tag 0x30, Tag Integer 0x02)\n" +
                      "======================================================",
                    "color: #10b981; font-weight: bold; font-size: 11px;",
                  );
                }
              }
            } catch (parseErr) {
              console.error("[WEBAUTHN] Gagal membedah ASN.1 DER:", parseErr);
            }

            // Expected signature output:
            // 0x691d643298b6642b561d27021e49b87f650125d4e18f2aa1ac94a7051d4c161b7a8f71a2355f832b5de15362b5f1eb50a7e5059045d7599864a222b7e944e41b
            generatedSignature =
              "0x" +
              Array.from(sigBytes)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            console.log(
              "[WEBAUTHN] 6. generatedSignature (Heksadesimal untuk QR Code):",
              generatedSignature,
            );
          }
        } catch (authErr) {
          console.warn(
            "[WEBAUTHN] WebAuthn dialog di-cancel atau authenticator tidak tersedia, menggunakan fallback:",
            authErr,
          );
          // Fallback crypto hash jika dialog di-cancel atau di browser dev tanpa authenticator
          const randomBytes = crypto.getRandomValues(new Uint8Array(32)); // ini akan hasilin 32 random bytes (raw binary data)
          console.log(
            "[WEBAUTHN FALLBACK] randomBytes (Uint8Array mentah):",
            randomBytes,
          );
          generatedSignature =
            "0x" +
            Array.from(randomBytes)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          console.log(
            "[WEBAUTHN FALLBACK] generatedSignature (Hex fallback):",
            generatedSignature,
          );
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
  // Catatan: expiresInSeconds bernilai 60 (durasi total), BUKAN timeLeft agar gambar QR stabil dan tidak berubah-ubah tiap detik
  const qrPayload = {
    tokenId: ticket.tokenId,
    eventId: ticket.eventId,
    eventName: currentEvent?.eventName || "UBAYA Music Fest 2026",
    categoryId: ticket.categoryId,
    categoryName: categoryName,
    seatNumber: seatNumber,
    owner: ticket.owner,
    used: isUsed,
    walletAddress: ticket.owner,
    nonce: nonce,
    signedAt: signedAt,
    expiresInSeconds: 60,
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

  // State khusus untuk fitur Pasar Sekunder (Resale)
  const [isListingResale, setIsListingResale] = useState(false);
  const [isListedOnResale, setIsListedOnResale] = useState(false);
  const [resaleResult, setResaleResult] = useState<ResaleActionState | null>(null);

  // Handler saat user klik tombol "Jual Tiket Resmi"
  const handleListForResale = async () => {
    if (isUsed || isListedOnResale) return;

    // Konfirmasi bahwa harga jual dikunci otomatis = originalPrice (Zero-Profit Resale)
    const confirmSell = confirm(
      `Jual Tiket #${ticket.tokenId} di Pasar Sekunder Resmi?\n\n` +
        `Sesuai aturan Anti-Calo Smart Contract, harga jual dikunci otomatis sebesar Rp ${Number(ticket.originalPrice).toLocaleString("id-ID")} (sama persis dengan harga beli awal).`,
    );
    if (!confirmSell) return;

    setIsListingResale(true);
    setResaleResult(null);

    try {
      const res = await listTicketForResaleAction(ticket.tokenId);
      setResaleResult(res);
      if (res.success) {
        setIsListedOnResale(true);
      }
    } finally {
      setIsListingResale(false);
    }
  };

  // Handler saat user ingin membatalkan tiket yang sedang dijual
  const handleCancelResale = async () => {
    const confirmCancel = confirm(
      `Batalkan penjualan Tiket #${ticket.tokenId} dari Pasar Sekunder?`,
    );
    if (!confirmCancel) return;

    setIsListingResale(true);
    setResaleResult(null);

    try {
      const res = await cancelResaleListingAction(ticket.tokenId);
      setResaleResult(res);
      if (res.success) {
        setIsListedOnResale(false);
      }
    } finally {
      setIsListingResale(false);
    }
  };

  const ticketStubMaskStyle: React.CSSProperties = {
    mask: "radial-gradient(circle 12px at left 150px, transparent 12px, #fff 13px), radial-gradient(circle 12px at right 150px, transparent 12px, #fff 13px)",
    maskComposite: "intersect",
    WebkitMask:
      "radial-gradient(circle 12px at 0px 150px, transparent 12px, #fff 13px), radial-gradient(circle 12px at 100% 150px, transparent 12px, #fff 13px)",
    WebkitMaskComposite: "destination-in",
  };

  return (
    <div
      className="relative w-full transition-all duration-200"
      style={{ filter: "drop-shadow(0 4px 12px rgba(15, 23, 42, 0.05))" }}
    >
      <article
        className={`relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col ${
          isUsed ? "opacity-75" : ""
        }`}
        style={ticketStubMaskStyle}
      >
        {/* 1. Banner Stub Atas (Tepat 150px sejajar dengan cutout) */}
        <div
          className={`w-full h-[150px] p-5 flex flex-col justify-between text-white ${
            isUsed
              ? "bg-gradient-to-r from-slate-900 to-slate-800"
              : "bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="self-start bg-slate-900/70 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-white">
              {categoryName}
            </span>
            {isUsed && (
              <span className="bg-slate-800/90 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Sudah Digunakan
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight text-white line-clamp-2">
            {currentEvent?.eventName || "UBAYA Music Fest 2026"}
          </h3>
        </div>

        {/* 2. Garis Sobekan Perforasi */}
        <div className="w-full h-0 border-t-[1.5px] border-dashed border-slate-300" />

        {/* 3. Badan Tiket (Stub Body) */}
        <div className="p-5 flex flex-col gap-4 bg-white">
          {/* Info Grid: Jadwal Acara & Lokasi Venue */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Jadwal Acara
              </div>
              <div className="text-[13px] font-semibold text-slate-900 mt-0.5">
                {eventDateOnly}
              </div>
              <div className="text-xs text-slate-500">{eventTimeOnly}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Lokasi Venue
              </div>
              <div
                className="text-[13px] font-semibold text-slate-900 mt-0.5 truncate"
                title={currentEvent?.venueLocation || "Gelora Bung Karno"}
              >
                {currentEvent?.venueLocation || "Gelora Bung Karno"}
              </div>
              <div className="text-xs text-slate-500">
                {currentEvent?.category || "Surabaya"}
              </div>
            </div>
          </div>

          {/* Nomor Tiket */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nomor Tiket
            </div>
            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md inline-block mt-1">
              #TKT-{ticket.tokenId} • {seatNumber}
            </span>
          </div>

          {/* Harga Beli Resmi */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3">
            <span className="text-xs text-slate-600 font-medium">Harga Beli Resmi</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
              Rp {Number(ticket.originalPrice).toLocaleString("id-ID")}
            </span>
          </div>

          {/* Bagian QR Code (Dinamis saat dibuka) */}
          {showQR && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                {timeLeft > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrImageUrl}
                    alt={`QR Code Tiket #${ticket.tokenId}`}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-40 h-40 flex flex-col items-center justify-center bg-slate-100 text-slate-500 rounded-lg p-2 space-y-1">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">QR Kedaluwarsa</span>
                    <p className="text-[10px] text-slate-500">Masa berlaku 60 detik telah habis</p>
                  </div>
                )}
              </div>

              {/* Timer Countdown Bar */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Timer className="w-3.5 h-3.5 text-coral-500" />
                    <span>Masa Berlaku QR:</span>
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      timeLeft <= 10 ? "text-rose-600" : "text-teal-700"
                    }`}
                  >
                    {timeLeft > 0 ? `${timeLeft} Detik` : "Kedaluwarsa"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 10 ? "bg-rose-500" : "bg-coral-500"
                    }`}
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>
                {timeLeft === 0 && (
                  <button
                    type="button"
                    onClick={handleToggleQR}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral-500 text-white hover:bg-coral-600 text-xs font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Perbarui QR</span>
                  </button>
                )}
              </div>

              {/* Simulasi Gate Redeem untuk Penguji/Dosen Penguji */}
              <div className="pt-2 border-t border-slate-200/60 w-full">
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isLoading || isUsed}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline decoration-dotted transition-colors cursor-pointer"
                >
                  {isLoading ? "Memproses Redeem Gate..." : "Simulasi Petugas: Scan & Redeem Gate"}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Alert Status Transaksi */}
          {result?.success && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}
          {resaleResult && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                resaleResult.success
                  ? "bg-teal-50 border-teal-200 text-teal-900"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {resaleResult.message}
            </div>
          )}

          {/* Tombol Aksi: Tampilkan QR Code & Jual Kembali */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleToggleQR}
              disabled={isSigning || isUsed}
              className="flex-[2] bg-coral-500 hover:bg-coral-600 text-white font-semibold text-xs sm:text-sm py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Meminta Passkey...</span>
                </>
              ) : showQR ? (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Tutup QR Code Tiket</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Tampilkan QR Code Tiket</span>
                </>
              )}
            </button>

            {!isUsed && (
              <button
                type="button"
                onClick={isListedOnResale ? handleCancelResale : handleListForResale}
                disabled={isListingResale}
                className={`flex-1 font-semibold text-xs sm:text-sm py-2.5 px-3 rounded-lg text-center transition-colors cursor-pointer disabled:opacity-50 border ${
                  isListedOnResale
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {isListingResale ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-500" />
                ) : isListedOnResale ? (
                  "Batal Resale"
                ) : (
                  "Jual Kembali"
                )}
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
