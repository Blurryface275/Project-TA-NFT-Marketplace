"use server";

export interface DualScanState {
  success: boolean;
  message: string;
  tokenId?: number;
  walletAddress?: string;
  txHash?: string;
  blockNumber?: number;
}

export async function verifyDualScanAction(payload: {
  tokenId: number;
  walletAddress?: string;
  signedAt?: string;
  signature?: string;
  nik?: string;
}): Promise<DualScanState> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    const response = await fetch(`${backendUrl}/api/tickets/verify-dual-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Verifikasi Dual-Scan di gerbang gagal.",
      };
    }

    return {
      success: true,
      message: data.message || "Tiket valid & verifikasi KTP berhasil! Pengunjung dipersilakan masuk.",
      tokenId: data.tokenId,
      walletAddress: data.walletAddress,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
    };
  } catch (error: any) {
    console.error("[VERIFY ACTION ERROR]:", error);
    return {
      success: false,
      message: error?.message || "Koneksi ke backend server gagal.",
    };
  }
}
