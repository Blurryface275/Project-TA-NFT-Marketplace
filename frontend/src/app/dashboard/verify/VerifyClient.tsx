"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { verifyDualScanAction, DualScanState } from "./actions";
import {
  QrCode,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Keyboard,
  RefreshCw,
  Loader2,
  ExternalLink,
  Calendar,
  Ticket,
  Lock,
} from "lucide-react";

interface ScannedTicketData {
  tokenId: number;
  eventName?: string;
  categoryName?: string;
  walletAddress: string;
  owner?: string;
  signedAt: string;
  expiresInSeconds?: number;
  signature: string;
  nonce?: number;
}

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");

  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  const [scannedData, setScannedData] = useState<ScannedTicketData | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [nikInput, setNikInput] = useState<string>("");

  const [manualTokenId, setManualTokenId] = useState<string>("");
  const [manualNik, setManualNik] = useState<string>("");

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<DualScanState | null>(null);

  const nikInputElemRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const isVerifyingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const nikInputRef = useRef<string>("");

  useEffect(() => {
    nikInputRef.current = nikInput;
  }, [nikInput]);

  const playBeep = (isSuccess: boolean) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + (isSuccess ? 0.2 : 0.4),
      );
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.4));
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;

    if (activeTab !== "camera" || !cameraActive) {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current
              .stop()
              .then(() => {
                html5QrCodeRef.current?.clear();
                html5QrCodeRef.current = null;
              })
              .catch(() => {});
          } else {
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
          }
        } catch {}
      }
      return;
    }

    const startScanner = async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        let qrCodeScanner = html5QrCodeRef.current;
        if (!qrCodeScanner) {
          qrCodeScanner = new Html5Qrcode("qr-reader-container");
          html5QrCodeRef.current = qrCodeScanner;
        }

        const scanConfig = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const onScanCallback = async (decodedText: string) => {
          if (isVerifyingRef.current || isPausedRef.current) return;

          try {
            const parsed = JSON.parse(decodedText) as ScannedTicketData;
            if (parsed.tokenId && (parsed.walletAddress || parsed.owner)) {
              isPausedRef.current = true;

              try {
                if (html5QrCodeRef.current?.isScanning) {
                  html5QrCodeRef.current.pause();
                }
              } catch {}

              const completeData: ScannedTicketData = {
                ...parsed,
                walletAddress: parsed.walletAddress || parsed.owner || "",
              };
              setScannedData(completeData);
              setVerifyResult(null);

              // Beri nada beep bahwa QR berhasil terbaca
              playBeep(true);

              // Auto-focus ke input NIK KTP untuk operator tanpa mematikan input textbox
              setTimeout(() => {
                nikInputElemRef.current?.focus();
              }, 150);
            }
          } catch {}
        };

        const videoConstraint = {
          facingMode: { exact: "environment" },
        };

        try {
          await qrCodeScanner.start(
            videoConstraint,
            scanConfig,
            onScanCallback,
            () => {},
          );
        } catch {
          try {
            await qrCodeScanner.start(
              { facingMode: "environment" },
              scanConfig,
              onScanCallback,
              () => {},
            );
          } catch {
            await qrCodeScanner.start(
              { facingMode: "user" },
              scanConfig,
              onScanCallback,
              () => {},
            );
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setCameraError(
          err?.message ||
            "Camera permission denied or camera device unavailable. Please use 'Manual Ticket Lookup'.",
        );
        setCameraActive(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current
              .stop()
              .then(() => {
                html5QrCodeRef.current?.clear();
              })
              .catch(() => {});
          } else {
            html5QrCodeRef.current.clear();
          }
        } catch {}
      }
    };
  }, [cameraActive, activeTab]);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsVerifying(true);
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
        setCameraActive(false);
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("qr-reader-container");
        html5QrCodeRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, false);
      const parsed = JSON.parse(decodedText) as ScannedTicketData;

      if (parsed.tokenId && (parsed.walletAddress || parsed.owner)) {
        setScannedData({
          ...parsed,
          walletAddress: parsed.walletAddress || parsed.owner || "",
        });
        setVerifyResult(null);
      } else {
        alert("Invalid ticket QR barcode payload.");
      }
    } catch {
      alert("Could not decode QR image. Please ensure the snapshot is clear.");
    } finally {
      setIsVerifying(false);
      e.target.value = "";
    }
  };

  const handleProcessDualScanCamera = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannedData) {
      alert("Scan ticket QR barcode first!");
      return;
    }

    if (!nikInput || nikInput.trim().length !== 16) {
      alert("Enter 16-digit NIK from physical KTP!");
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    const res = await verifyDualScanAction({
      tokenId: Number(scannedData.tokenId),
      walletAddress: scannedData.walletAddress,
      signedAt: scannedData.signedAt,
      signature: scannedData.signature,
      nik: nikInput.trim(),
    });

    playBeep(res.success);
    setVerifyResult(res);
    setIsVerifying(false);
  };

  const handleProcessDualScanManual = async (e: React.FormEvent) => {
    e.preventDefault();

    const tokenIdNum = Number(manualTokenId);
    if (!manualTokenId || isNaN(tokenIdNum) || tokenIdNum <= 0) {
      alert("Masukkan ID Tiket yang valid!");
      return;
    }

    if (!manualNik || manualNik.trim().length !== 16) {
      alert("Verifikasi KTP Wajib: Masukkan 16 digit NIK fisik pengunjung!");
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    const res = await verifyDualScanAction({
      tokenId: tokenIdNum,
      walletAddress: "",
      signedAt: new Date().toISOString(),
      signature: "0xmanual",
      nik: manualNik.trim(),
    });

    playBeep(res.success);
    setVerifyResult(res);
    setIsVerifying(false);
  };

  const handleReset = () => {
    setScannedData(null);
    setNikInput("");
    setManualTokenId("");
    setManualNik("");
    setVerifyResult(null);
    isVerifyingRef.current = false;
    if (activeTab === "camera") {
      try {
        if (isPausedRef.current && html5QrCodeRef.current) {
          html5QrCodeRef.current.resume();
          isPausedRef.current = false;
        } else if (!cameraActive) {
          setCameraActive(true);
        }
      } catch {
        setCameraActive(true);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Gate Access Control */}
      <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FBECE7] border border-[#D94520]/20 text-[#D94520] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Venue Gate Access Terminal
            </span>
            {eventIdParam && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0EDE4] text-[#171717] text-xs font-medium">
                <Calendar className="w-3 h-3 text-[#D94520]" />
                Event #{eventIdParam}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
            Dual-Scan Admission Verification
          </h1>
          <p className="text-xs text-[#736E65]">
            Dynamic rolling QR barcode validation paired with attendee KTP NIK hash check.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="w-full sm:w-auto grid grid-cols-2 bg-[#F0EDE4] p-1 rounded-xl gap-1 select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab("camera");
              setVerifyResult(null);
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "camera"
                ? "bg-white text-[#171717] shadow-xs"
                : "text-[#736E65] hover:text-[#171717]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(() => {});
              }
              setCameraActive(false);
              setVerifyResult(null);
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "manual"
                ? "bg-white text-[#171717] shadow-xs"
                : "text-[#736E65] hover:text-[#171717]"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Lookup</span>
          </button>
        </div>
      </div>

      {/* 2. Verification Area */}
      {activeTab === "camera" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Viewfinder */}
          <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#D94520] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-[#171717]">
                  Scan Dynamic Barcode
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#D94520] hover:bg-[#BF3B19] text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileScan}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setCameraActive((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    cameraActive
                      ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                      : "bg-[#F0EDE4] text-[#171717] hover:bg-stone-200"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{cameraActive ? "Turn Off" : "Start Camera"}</span>
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="underline font-bold text-amber-900"
                  >
                    Switch to Manual Input ➔
                  </button>
                </div>
              </div>
            )}

            <div className={cameraActive ? "space-y-3" : "hidden"}>
              <div
                id="qr-reader-container"
                className="w-full overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-50"
              />
              <p className="text-[11px] text-center text-[#736E65]">
                Align attendee dynamic rolling barcode inside scanning reticle.
              </p>
            </div>

            {!cameraActive && !scannedData ? (
              <div className="py-12 border border-dashed border-stone-200 rounded-xl bg-[#F0EDE4]/40 flex flex-col items-center justify-center gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center text-[#736E65]">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#171717]">
                    Camera scanner idle
                  </p>
                  <p className="text-[11px] text-[#736E65] mt-0.5">
                    Click &apos;Start Camera&apos; to begin continuous scanning.
                  </p>
                </div>
              </div>
            ) : null}

            {scannedData && (
              <div className="bg-[#F0EDE4] rounded-xl p-4 border border-black/[0.06] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#D94520] uppercase tracking-wider">
                      {scannedData.categoryName || "Scanned Pass"}
                    </span>
                    <h3 className="text-sm font-bold text-[#171717]">
                      {scannedData.eventName || `Pass #${scannedData.tokenId}`}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-black/[0.08] text-[#171717]">
                    #{scannedData.tokenId}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#736E65] pt-2 border-t border-black/[0.06]">
                  <div className="flex justify-between">
                    <span>Wallet Address:</span>
                    <span className="font-mono font-medium truncate max-w-[170px] text-[#171717]">
                      {scannedData.walletAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Generated Timestamp:</span>
                    <span className="text-[#171717]">
                      {new Date(scannedData.signedAt).toLocaleTimeString("id-ID")} WIB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="w-full text-center text-xs font-semibold text-[#D94520] hover:underline py-1"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}
          </div>

          {/* Right KTP NIK Input & Execution */}
          <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#D94520] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-[#171717]">
                  Verifikasi KTP Fisik (Wajib Dual-Scan)
                </h2>
              </div>
              {scannedData ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  QR Terbaca
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" />
                  Menunggu Scan QR
                </span>
              )}
            </div>

            <form onSubmit={handleProcessDualScanCamera} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="nik"
                  className="text-xs font-semibold text-[#171717] flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#D94520]" />
                    <span>NIK KTP Fisik Pengunjung (16 Digit)</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#D94520]">Wajib</span>
                </label>
                <input
                  ref={nikInputElemRef}
                  id="nik"
                  type="text"
                  maxLength={16}
                  value={nikInput}
                  onChange={(e) => setNikInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ketik 16 digit NIK dari KTP fisik (contoh: 3578012345670001)"
                  className="w-full bg-[#F0EDE4] border border-black/[0.08] rounded-xl px-4 py-3 text-xs font-mono font-medium text-[#171717] placeholder:text-[#736E65]/60 outline-none focus:border-[#D94520] transition"
                  disabled={isVerifying}
                />
                <p className="text-[11px] text-[#736E65]">
                  UU PDP No. 27/2022: NIK dicocokkan via Keccak256 hash dengan identitas pemilik tiket.
                </p>
              </div>

              <button
                type="submit"
                disabled={!scannedData || nikInput.length !== 16 || isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi tiket & identitas masuk...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifikasi Masuk Venue (Admit Attendee)</span>
                  </>
                )}
              </button>
            </form>

            {/* High-contrast feedback card */}
            {verifyResult && (
              <div
                className={`p-5 rounded-2xl border text-xs space-y-2 ${
                  verifyResult.success
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-rose-50 border-rose-300 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {verifyResult.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>ACCESS GRANTED — PASS VALID</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>ACCESS DENIED — INVALID ENTRY</span>
                    </>
                  )}
                </div>

                <p className="font-semibold text-xs leading-relaxed">
                  {verifyResult.message}
                </p>

                {verifyResult.success && verifyResult.txHash && (
                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-800">
                      On-Chain Redemption:
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${verifyResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline flex items-center gap-1 font-bold"
                    >
                      <span>View Receipt</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full mt-3 py-2.5 bg-white border border-black/[0.08] rounded-xl text-[#171717] font-bold text-xs text-center hover:bg-stone-50 transition"
                >
                  Scan Next Attendee
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Mode */
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-black/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1 border-b border-black/[0.06] pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F0EDE4] text-[#171717] text-xs font-semibold">
              <Keyboard className="w-3.5 h-3.5 text-[#D94520]" />
              <span>Manual Gate Check</span>
            </div>
            <h2 className="text-lg font-bold text-[#171717]">
              Lookup Pass by Ticket ID & NIK
            </h2>
            <p className="text-xs text-[#736E65]">
              Use this fallback if an attendee&apos;s device battery is depleted or the screen is unreadable.
            </p>
          </div>

          <form onSubmit={handleProcessDualScanManual} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="manual-token"
                className="text-xs font-semibold text-[#171717] flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5 text-[#D94520]" />
                <span>Ticket ID</span>
              </label>
              <input
                id="manual-token"
                type="number"
                min="1"
                value={manualTokenId}
                onChange={(e) => setManualTokenId(e.target.value)}
                placeholder="e.g. 1 or 5"
                className="w-full bg-[#F0EDE4] border border-black/[0.08] rounded-xl px-4 py-3 text-sm font-mono font-bold text-[#171717] placeholder:text-[#736E65]/60 outline-none focus:border-[#D94520] transition"
                disabled={isVerifying}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="manual-nik"
                className="text-xs font-semibold text-[#171717] flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#D94520]" />
                  <span>NIK KTP Fisik Pengunjung (16 Digit)</span>
                </div>
                <span className="text-[10px] font-bold text-[#D94520]">Wajib</span>
              </label>
              <input
                id="manual-nik"
                type="text"
                maxLength={16}
                value={manualNik}
                onChange={(e) => setManualNik(e.target.value.replace(/\D/g, ""))}
                placeholder="Ketik 16 digit NIK dari KTP fisik (contoh: 3578012345670001)"
                className="w-full bg-[#F0EDE4] border border-black/[0.08] rounded-xl px-4 py-3 text-xs font-mono font-medium text-[#171717] placeholder:text-[#736E65]/60 outline-none focus:border-[#D94520] transition"
                disabled={isVerifying}
              />
            </div>

            <button
              type="submit"
              disabled={!manualTokenId || manualNik.length !== 16 || isVerifying}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Ticket Status...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Ticket & Admit Attendee</span>
                </>
              )}
            </button>
          </form>

          {verifyResult && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-2 ${
                verifyResult.success
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {verifyResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>ACCESS GRANTED — PASS VALID</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>ACCESS DENIED — INVALID ENTRY</span>
                  </>
                )}
              </div>

              <p className="font-semibold text-xs leading-relaxed">
                {verifyResult.message}
              </p>

              {verifyResult.success && verifyResult.txHash && (
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800">Blockchain Record:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${verifyResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline flex items-center gap-1 font-bold"
                  >
                    <span>View Receipt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full mt-3 py-2.5 bg-white border border-black/[0.08] rounded-xl text-[#171717] font-bold text-xs text-center hover:bg-stone-50 transition"
              >
                Lookup Next Attendee
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
