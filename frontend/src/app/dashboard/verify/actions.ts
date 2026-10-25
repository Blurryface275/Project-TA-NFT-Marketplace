"use server";

import { getSession } from "@/lib/session";

// TIpe data payload yang dikirim dari hasil scan kamera QR
export interface VerifyTicketPayload {
  tokenId: number;
  walletAddress: string;
  signedAt: string;
}

export async function verifyTicketAction(payload: VerifyTicketPayload) {
  // Cek sesi login (hanya staff venue yg boleh verifikasi)
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  try {
    const now = Date.now();
    const qrTime = new Date(payload.signedAt).getTime();
    const diffSeconds = (now - qrTime) / 1000;

    //  Jika selisih waktu lebihd ari 60 detik mana tolak tiket, serta cegah waktu masa depan (clock manipulation)
    if (diffSeconds > 60 || diffSeconds < -5) {
      return {
        success: false,
        message: "QR Code expired (max 60 seconds)",
      };
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const response = await fetch(`${backendUrl}/api/tickets/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenId: payload.tokenId,
        walletAddress: payload.walletAddress,
      }),
    });

    const resData = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Verification failed",
      };
    }

    return {
      success: true,
      message: "Ticket redeemed successfully!",
      txHash: resData.txHash,
    };
  } catch (error) {
    console.error("Verify action error:", error);

    // return error to UI
    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong";

    return {
      success: false,
      message: errorMessage,
    };
  }
}
