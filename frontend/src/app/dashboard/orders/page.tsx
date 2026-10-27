import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import OrdersList, { OrderItem } from "./OrdersList";

export default async function OrdersPage() {
  const session = await getSession();

  // Proteksi halaman (wajib login)
  if (!session?.userId) {
    redirect("/login");
  }

  const walletAddress = (session?.walletAddress as string) || "";
  let initialOrders: OrderItem[] = [];

  // Ambil riwayat order dari endpoint backend yang baru kamu buat
  if (walletAddress) {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backendUrl}/api/tickets/my-orders/${walletAddress}`,
        { cache: "no-store" }, // Data selalu real-time
      );
      if (res.ok) {
        initialOrders = await res.json();
      }
    } catch (err) {
      console.error("[ORDERS PAGE] Gagal mengambil daftar pesanan:", err);
    }
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Riwayat Transaksi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar seluruh pesanan tiket Midtrans, status pembayaran, dan rincian biaya admin resmi.
        </p>
      </div>

      {/* Oper data ke komponen interaktif client */}
      <OrdersList initialOrders={initialOrders} walletAddress={walletAddress} />
    </div>
  );
}
