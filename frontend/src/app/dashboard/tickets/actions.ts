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

export type ResaleActionState = {
  success: boolean;
  message: string;
  txHash?: string;
  lockedPrice?: number;
};

// Server Action untuk mengecek status tiket terkini secara real-time dari MySQL/Blockchain
export async function checkTicketStatusAction(
  tokenId: number,
): Promise<{ used: boolean }> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backendUrl}/api/tickets/status/${tokenId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return { used: Boolean(data.used) };
    }
  } catch (error) {
    console.error("[CHECK TICKET STATUS ERROR]:", error);
  }
  return { used: false };
}

// Server Action untuk daftarin tiket ke Pasar Sekunder (harga dikunci = originalPrice nya)
export async function listTicketForResaleAction(
  tokenId: number,
): Promise<ResaleActionState>{
  // ambil session pengguna yg lagi login
  const session = await getSession();
  if(!session?.walletAddress){
    return{
      success: false,
      message: "Alamat dompet tidak ditemukan. Silahkan aktifkan dompet terlebih dahulu.",
    };
  }

  try{
    console.log(`[RESALE LIST ACTION] User ${session.userId} mendaftarkan jual Token ID #${tokenId}`,);

    const response = await fetch(`${process.env.BACKEND_URL}/api/tickets/resale/list`,
      {
        method: "POST",
        headers:{
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: Number(tokenId),
          sellerWallet: session.walletAddress,
        }),
      },  
    );

    const resData = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Gagal mendaftarkan tiket ke pasar sekunder",
      };
    }
    return {
      success: true,
      message: "Tiket berhasil terdaftar di Pasar Sekunder Resmi!",
      txHash: resData.txHash,
      lockedPrice: Number(resData.lockedPrice),
    };
  } catch (error) {
    console.error("[RESALE LIST ACTION] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    return {
      success: false,
      message: `Gagal mendaftarkan resale: ${errorMessage}`,
    };
  }
}
// Server Action untuk membatalkan penjualan tiket di Pasar Sekunder
export async function cancelResaleListingAction(
  tokenId: number,
): Promise<ResaleActionState> {
  const session = await getSession();
  if (!session?.walletAddress) {
    return {
      success: false,
      message: "Alamat dompet tidak ditemukan.",
    };
  }
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/resale/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: Number(tokenId),
          sellerWallet: session.walletAddress,
        }),
      },
    );
    const resData = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Gagal membatalkan listing resale",
      };
    }
    return {
      success: true,
      message: "Penjualan tiket berhasil dibatalkan!",
      txHash: resData.txHash,
    };
  } catch (error) {
    console.error("[RESALE CANCEL ACTION] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    return {
      success: false,
      message: `Gagal membatalkan listing: ${errorMessage}`,
    };
  }
}
