"use server";

import { backendFetch, getBackendUrl } from "@/lib/backend";
import { getSession } from "@/lib/session";

export type CategoryTxResult = {
  categoryId: string;
  name: string;
  txHash: string;
  blockNumber: string;
};

export type CreateEventResult = {
  success: boolean;
  message?: string;
  warning?: string;
  event?: Record<string, unknown>;
  categories?: Record<string, unknown>[];
  blockchain?: {
    onChainEventId?: number;
    contractAddress?: string;
    createEventTx?: string | null;
    createBlockNumber?: string | null;
    categoriesTx?: CategoryTxResult[];
  };
};

export async function createEventAction(formData: FormData): Promise<CreateEventResult> {
  const session = await getSession();
  if (!session?.userId) {
    return {
      success: false,
      message: "Sesi tidak ditemukan atau telah kedaluwarsa. Silakan login kembali.",
    };
  }

  try {
    const backendUrl = getBackendUrl();
    console.log(`📡 [Admin Action] Mengirim formulir pendaftaran event ke ${backendUrl}/api/events`);

    const response = await backendFetch("/api/events", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Gagal mendaftarkan event ke sistem.";
      return {
        success: false,
        message: errorMessage,
      };
    }

    return {
      success: true,
      message: data.message || "Event berhasil didaftarkan ke Database & Sepolia Testnet!",
      warning: data.warning,
      event: data.event,
      categories: data.categories,
      blockchain: data.blockchain,
    };
  } catch (error: unknown) {
    console.error("❌ [Admin Action] Terjadi kesalahan koneksi:", error);
    return {
      success: false,
      message: `Gagal menghubungi server backend: ${error instanceof Error ? error.message : "Kesalahan jaringan"}`,
    };
  }
}
