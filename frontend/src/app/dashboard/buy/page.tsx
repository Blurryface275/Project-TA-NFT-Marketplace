import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import BuyTicketCard, { EventData, UserTicket } from "./BuyTicketCard";

export default async function BuyTicketPage() {
  // Ambil session jika ada (bisa null jg misalnya user blm login)
  const session = await getSession();

  // Ambil data dompet dan email dari session yang sudah divalidasi
  const walletAddress = (session?.walletAddress as string) || ""; // string kosong kalau belum login
  const userEmail = (session?.email as string) || ""; // string kosong kalau belum login
  const isLoggedIn = Boolean(session?.userId); // true jika udh login, false jika blm login

  // Ambil data seluruh tiket yang sudah dimiliki user dari backend relayer
  let userTickets: UserTicket[] = [];
  if (walletAddress) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/api/tickets/my-tickets/${walletAddress}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const tickets = await res.json();
        if (Array.isArray(tickets)) {
          userTickets = tickets;
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data tiket user:", err);
    }
  }

  // Ambil data seluruh event secara dinamis dari database MySQL via API backend
  let events: EventData[] = [];
  try {
    const eventsRes = await fetch(`${process.env.BACKEND_URL}/api/events`, {
      cache: "no-store",
    });
    if (eventsRes.ok) {
      events = await eventsRes.json();
    }
  } catch (err) {
    console.error("Gagal mengambil daftar event:", err);
  }

  return (
    <div className="w-full">
      {/* Kartu Pembelian Tiket Interaktif Multi-Event (Loket.com Design) */}
      <BuyTicketCard
        walletAddress={walletAddress}
        userEmail={userEmail}
        isLoggedIn={isLoggedIn}
        events={events}
        userTickets={userTickets}
      />
    </div>
  );
}
