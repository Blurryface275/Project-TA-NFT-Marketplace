"use server";

import { getSession } from "@/lib/session";

// Server Action untuk membuat transaksi Midtrans Snap saat membeli tiket resale
export async function buyResaleTicketAction(listingId: string) {
  const session = await getSession();

  if (!session?.walletAddress) {
    return {
      success: false,
      message: "Dompet belum aktif. Silahkan aktifkan dompet terlebih dahulu.",
    };
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const response = await fetch(`${backendUrl}/api/tickets/resale/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId,
        buyerWallet: session.walletAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Gagal membuat transaksi pembayaran resale.",
      };
    }

    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirectUrl,
      orderId: data.orderId,
      grossAmount: data.grossAmount,
    };
  } catch (error) {
    console.error("[BUY RESALE ACTION] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    return {
      success: false,
      message: `Gagal menghubungi server: ${errorMessage}`,
    };
  }
}

// Cek status pembayaran order resale untuk auto-polling & rekonsiliasi
export async function checkResaleOrderStatusAction(orderId: string) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  try {
    const response = await fetch(`${backendUrl}/api/tickets/order-status/${orderId}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return { success: false, status: "unknown" };
    return { success: true, ...(await response.json()) };
  } catch (err) {
    return { success: false, status: "unknown" };
  }
}

