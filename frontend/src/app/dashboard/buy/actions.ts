"use server"; // fungsinya untuk memberi tahu next.js bahwa file ini akan berjalan di server

import { getSession, updateSessionWallet } from "@/lib/session";

export type SetupWalletInput = {
  pubX: string;
  pubY: string;
  credentialId: string;
  walletAddress: string;
};

export type ActivateWalletState = {
  success: boolean;
  message: string;
  walletAddress?: string;
};

export async function activateWalletAction(
  input: SetupWalletInput,
): Promise<ActivateWalletState> {
  const session = await getSession();

  if (!session?.userId) {
    return {
      success: false,
      message: "Sesi tidak ditemukan. Silakan login kembali.",
    };
  }

  try {
    console.log(
      `[ACTIVATE WALLET] User ${session.userId} mengaktifkan dompet: ${input.walletAddress}`,
    );

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/auth/setup-wallet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(session.userId),
          pubX: input.pubX,
          pubY: input.pubY,
          credentialId: input.credentialId,
          walletAddress: input.walletAddress,
        }),
      },
    );

    const resData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: resData.message || "Gagal mengaktifkan dompet tiket.",
      };
    }

    // Perbarui session cookie JWT dengan walletAddress baru
    await updateSessionWallet(input.walletAddress);

    return {
      success: true,
      message: resData.message || "Dompet tiket berhasil diaktifkan!",
      walletAddress: input.walletAddress,
    };
  } catch (error) {
    console.error("[ACTIVATE WALLET] Error aktivasi:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    return {
      success: false,
      message: `Gagal menghubungkan dompet ke server: ${errorMessage}`,
    };
  }
}

export type BuyTicketState = {
  success?: boolean;
  message?: string;
  txHash?: string;
  txHashes?: string[];
  blockNumber?: number;
};

export async function createSnapPaymentAction(
  eventId: number,
  categoryId: number,
  quantity: number,
  turnstileToken?: string,
): Promise<{
  success: boolean;
  token?: string;
  redirectUrl?: string;
  orderId?: string;
  grossAmount?: number;
  message?: string;
}> {
  const session = await getSession();

  if (!session?.walletAddress) {
    return {
      success: false,
      message: "Dompet belum aktif. Silahkan buat dompet terlebih dahulu.",
    };
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const response = await fetch(`${backendUrl}/api/tickets/create-snap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: Number(eventId),
        categoryId: Number(categoryId),
        quantity: Number(quantity),
        walletAddress: session.walletAddress,
        turnstileToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Gagal membuat sesi pembayaran Midtrans.",
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
    console.error("[CREATE SNAP ACTION] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    return {
      success: false,
      message: `Gagal menghubungi server payment. Error: ${errorMessage}`,
    };
  }
}

// Cek status order di backend (polling tiap 2 detik) untuk update status
export async function checkOrderStatusAction(orderId: string) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const response = await fetch(
      `${backendUrl}/api/tickets/order-status/${orderId}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return {
        success: false,
        status: "unknown",
        message: "Gagal mengecek status order",
      };
    }
    const data = await response.json();
    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error("[POLL ORDER] Gagal cek status:", error);
    return {
      success: false,
      status: "error",
    };
  }
}

// Mengambil seluruh tiket on-chain nyata milik akun user dari backend
export async function fetchMyTicketsAction(walletAddress: string) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  try {
    const res = await fetch(
      `${backendUrl}/api/tickets/my-tickets/${walletAddress}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    console.error("[FETCH TICKETS ACTION] Gagal mengambil tiket user:", err);
    return [];
  }
}
