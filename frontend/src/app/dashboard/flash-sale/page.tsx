import { backendFetch } from "@/lib/backend";
import { getSession } from "@/lib/session";
import FlashSaleClient, { FlashSaleEvent } from "./FlashSaleClient";

export default async function FlashSalePage() {
  const session = await getSession();
  const walletAddress = (session?.walletAddress as string) || "";
  const isLoggedIn = Boolean(session?.userId);

  let events: FlashSaleEvent[] = [];
  try {
    const res = await backendFetch("/api/events", {
      cache: "no-store",
    });
    if (res.ok) {
      events = await res.json();
    }
  } catch (err) {
    console.error("[FLASH SALE] Gagal mengambil data events:", err);
  }

  return (
    <div className="w-full">
      <FlashSaleClient
        events={events}
        isLoggedIn={isLoggedIn}
        walletAddress={walletAddress}
      />
    </div>
  );
}
