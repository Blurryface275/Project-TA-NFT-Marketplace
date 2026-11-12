"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyDualScanAction, DualScanState } from "./actions";
import {
  QrCode,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  RefreshCw,
  Loader2,
  ExternalLink,
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
  const [scannedData, setScannedData] = useState<ScannedTicketData | null>(null);
  const [nikInput, setNikInput] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<DualScanState | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Inisialisasi scanner kamera html5-qrcode
  useEffect(() => {
    if (!cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader-container",
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText: string) => {
        try {
          const parsed = JSON.parse(decodedText) as ScannedTicketData;
          if (parsed.tokenId && (parsed.walletAddress || parsed.owner)) {
            setScannedData({
              ...parsed,
              walletAddress: parsed.walletAddress || parsed.owner || "",
            });
            setVerifyResult(null);
            setCameraActive(false); // Otomatis matikan kamera setelah QR berhasil terbaca
            scanner.clear().catch(console.error);
          } else {
            alert("QR Code tidak memiliki format tiket NFTix yang valid.");
          }
        } catch {
          alert("Gagal membaca data QR Code. Pastikan ini QR Code tiket resmi.");
        }
      },
      () => {
        // Abaikan error frame pencarian biasa
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [cameraActive]);

  const handleProcessDualScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannedData) {
      alert("Pindai QR Code tiket terlebih dahulu!");
      return;
    }

    if (!nikInput || nikInput.trim().length !== 16) {
      alert("Masukkan 16 digit NIK sesuai fisik KTP pengunjung!");
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

    setVerifyResult(res);
    setIsVerifying(false);
  };

  const handleReset = () => {
    setScannedData(null);
    setNikInput("");
    setVerifyResult(null);
    setCameraActive(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Informasi Staf Gerbang */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coral-50 border border-coral-100 text-coral-600 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Venue Gate Access Control
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pemindai Tiket Dual-Scan
          </h1>
          <p className="text-xs text-slate-500">
            Validasi ganda: Dynamic QR Code WebAuthn + KTP Fisik keccak256 (UU PDP No. 27/2022).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCameraActive((prev) => !prev)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            cameraActive
              ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{cameraActive ? "Matikan Kamera" : "Nyalakan Kamera Scanner"}</span>
        </button>
      </div>

      {/* 2. Grid Dua Kolom: Scanner Kamera (Kiri) & Form Verifikasi KTP (Kanan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Kolom 1: Area Kamera / Data Tiket Terbaca */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-coral-500 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Pindai Dynamic QR Tiket
              </h2>
            </div>
            {scannedData && (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                QR Terbaca
              </span>
            )}
          </div>

          {/* Area Kamera Scanner */}
          {cameraActive ? (
            <div className="space-y-3">
              <div
                id="qr-reader-container"
                className="w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50"
              />
              <p className="text-[11px] text-center text-slate-400">
                Arahkan kamera ke layar HP pengunjung yang menampilkan QR Tiket.
              </p>
            </div>
          ) : !scannedData ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Kamera Scanner Belum Aktif
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol "Nyalakan Kamera Scanner" di atas untuk mulai memindai.
                </p>
              </div>
            </div>
          ) : null}

          {/* Kartu Ringkasan Tiket yang Berhasil Terbaca */}
          {scannedData && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-coral-600 uppercase tracking-wider">
                    {scannedData.categoryName || "Kategori Tiket"}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {scannedData.eventName || `Tiket #${scannedData.tokenId}`}
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-800">
                  #{scannedData.tokenId}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dompet Pemilik:</span>
                  <span className="font-mono font-medium truncate max-w-[170px]">
                    {scannedData.walletAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Generate QR:</span>
                  <span>{new Date(scannedData.signedAt).toLocaleTimeString("id-ID")} WIB</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCameraActive(true)}
                className="w-full text-center text-xs font-semibold text-coral-600 hover:text-coral-700 py-1"
              >
                Pindai Ulang Tiket Lain
              </button>
            </div>
          )}
        </div>

        {/* Kolom 2: Form Input NIK KTP & Eksekusi Dual-Scan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-coral-500 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Validasi NIK KTP Fisik
            </h2>
          </div>

          <form onSubmit={handleProcessDualScan} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nik" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Nomor Induk Kependudukan (NIK 16 Digit)</span>
              </label>
              <input
                id="nik"
                type="text"
                maxLength={16}
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 3578012345670001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-coral-500 transition"
                disabled={!scannedData || isVerifying}
              />
              <p className="text-[11px] text-slate-400">
                Kepatuhan UU PDP: NIK di-hash keccak256 sesaat di RAM dan tidak pernah disimpan ke disk.
              </p>
            </div>

            <button
              type="submit"
              disabled={!scannedData || nikInput.length !== 16 || isVerifying}
              className="w-full py-2.5 px-4 rounded-xl bg-coral-500 hover:bg-coral-600 active:scale-[0.99] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memvalidasi Dual-Scan On-Chain...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi & Masukkan Pengunjung</span>
                </>
              )}
            </button>
          </form>

          {/* Hasil Status Verifikasi (Lolos / Ditolak) */}
          {verifyResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                verifyResult.success
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                  : "bg-rose-50/80 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {verifyResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AKSES DIBERIKAN (ACCESS GRANTED)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>AKSES DITOLAK (ACCESS DENIED)</span>
                  </>
                )}
              </div>

              <p className="font-medium">{verifyResult.message}</p>

              {verifyResult.success && verifyResult.txHash && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700">Tx Hash On-Chain:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${verifyResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-800 underline flex items-center gap-1"
                  >
                    <span>{verifyResult.txHash.slice(0, 10)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full mt-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs text-center hover:bg-slate-50 transition"
              >
                Scan Pengunjung Berikutnya
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

