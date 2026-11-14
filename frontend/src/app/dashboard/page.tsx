import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import OrganizerDashboardClient from "./OrganizerDashboardClient";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const role = (session?.role as string) || "CUSTOMER";
  const userName = (session?.name as string) || "Pengguna";
  const userEmail = (session?.email as string) || "";
  const walletAddress = (session?.walletAddress as string) || "";

  // 1. TAMPILAN KHUSUS ORGANIZER (PORTAL PROMOTOR)
  if (role === "ORGANIZER") {
    let organizerEvents = [];
    let organizationName =
      (session?.organizationName as string) || "Penyelenggara Event";

    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backendUrl}/api/events/user/${session.userId}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.organizer?.organizationName) {
          organizationName = data.organizer.organizationName;
        }
        if (Array.isArray(data.events)) {
          organizerEvents = data.events;
        }
      }
    } catch (err) {
      console.error("[ORGANIZER DASHBOARD] Gagal mengambil events organizer:", err);
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <OrganizerDashboardClient
          userName={userName}
          organizerName={organizationName}
          events={organizerEvents}
        />
      </div>
    );
  }

  // 2. TAMPILAN STANDAR CUSTOMER (PEMBELI TIKET)
  let userTickets = [];
  let totalTickets = 0;
  if (walletAddress) {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backendUrl}/api/tickets/my-tickets/${walletAddress}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const tickets = await res.json();
        if (Array.isArray(tickets)) {
          userTickets = tickets;
          totalTickets = tickets.length;
        }
      }
    } catch (err) {
      console.error("[DASHBOARD] Gagal mengambil tiket:", err);
    }
  }

  let totalOrders = 0;
  if (walletAddress) {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const res = await fetch(
        `${backendUrl}/api/tickets/my-orders/${walletAddress}`,
        { cache: "no-store" }
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

  let events = [];
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backendUrl}/api/events`, {
      cache: "no-store",
    });
    if (res.ok) {
      events = await res.json();
    }
  } catch (err) {
    console.error("[DASHBOARD] Gagal mengambil events:", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <DashboardClient
        userName={userName}
        userEmail={userEmail}
        walletAddress={walletAddress}
        totalTickets={totalTickets}
        totalOrders={totalOrders}
        events={events}
        userTickets={userTickets}
      />
    </div>
  );
}
