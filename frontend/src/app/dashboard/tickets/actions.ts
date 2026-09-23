"use server";

import { getSession } from "@/lib/session";

export type RedeemTicketState = {
  success?: boolean;
  message?: string;
  txHash?: string;
  blockNumber?: number;
};

// Server Action untuk mengeksekusi update markUsed on-chain di Speolia via Relayer
export async function redeemTicketAction(
  tokenId: number,
): Promise<RedeemTicketState> {
  // ambil data session pengguna yg lagi login skrg
  const session = await getSession();

  if (!session?.walletAddress) {
    return {
      success: false,
      message:
        "Alamat dompet tidak ditemukan. Silahkan login atau signup terlebih dulu",
    };
  }

  try {
    console.log(
      `[REDEEM ACTION] User ${session.userId} redeem untuk Token ID #${tokenId}`,
    );

    // Panggil API Backend Relayer
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: Number(tokenId),
          walletAddress: session.walletAddress, // kirim juga wallet address user
        }),
      },
    );

    // Parsing data JSON dari response backend
    const resData = await response.json();

    // jika backend mengembalikan pesan error (non-200), kembalikan ke frontend
    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Gagal redeem tiket on-chain",
      };
    }

    // jika sukses, kembalikan data hasil tx hash ke frontend
    return {
      success: true,
      message: resData.message,
      txHash: resData.txHash,
      blockNumber: resData.blockNumber,
    };
  } catch (error) {
    console.error(`[REDEEM ACTION] Error saat redeem tiket:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";

    return {
      success: false,
      message: `Gagal redeem tiket: ${errorMessage}`,
    };
  }
}
