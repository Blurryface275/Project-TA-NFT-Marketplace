"use server";

import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/session";

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
  authenticatorData?: string;
  clientDataJSON?: string;
  credentialId?: string;
  nonce?: number;
  nik?: string;
}): Promise<DualScanState> {
  try {
    const session = await getSession();

    const response = await backendFetch("/api/tickets/verify-dual-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        organizerUserId: session?.userId ? Number(session.userId) : undefined,
      }),
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
  } catch (error: unknown) {
    console.error("[VERIFY ACTION ERROR]:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Koneksi ke backend server gagal.",
    };
  }
}
