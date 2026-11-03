import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const walletAddress = (session?.walletAddress as string) || "";
  const userName = (session?.name as string) || "Pengguna";
  const userEmail = (session?.email as string) || "";

  // 1. Fetch data tiket milik user
  let totalTickets = 0;
  if (walletAddress) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/api/tickets/my-tickets/${walletAddress}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const tickets = await res.json();
        if (Array.isArray(tickets)) {
          totalTickets = tickets.length;
        }
      }
    } catch (err) {
      console.error("[DASHBOARD] Gagal mengambil tiket:", err);
    }
  }

  // 2. Fetch data pesanan / order
  let totalOrders = 0;
  if (walletAddress) {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backendUrl}/api/tickets/my-orders/${walletAddress}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const orders = await res.json();
        if (Array.isArray(orders)) {
          totalOrders = orders.length;
        }
      }
    } catch (err) {
      console.error("[DASHBOARD] Gagal mengambil orders:", err);
    }
  }

  // 3. Fetch daftar event aktif
  let events = [];
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/events`, {
      cache: "no-store",
    });
    if (res.ok) {
      events = await res.json();
    }
  } catch (err) {
    console.error("[DASHBOARD] Gagal mengambil events:", err);
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <DashboardClient
        userName={userName}
        userEmail={userEmail}
        walletAddress={walletAddress}
        totalTickets={totalTickets}
        totalOrders={totalOrders}
        events={events}
      />
    </div>
  );
}
