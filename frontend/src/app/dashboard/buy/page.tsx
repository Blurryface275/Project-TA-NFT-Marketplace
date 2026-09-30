import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import BuyTicketCard, { EventData, UserTicket } from "./BuyTicketCard";

export default async function BuyTicketPage() {
  // Ambil session langsung di server
  const session = await getSession();

  // Jika session tidak ditemukan atau userId belum ada, arahkan ke login
  if (!session?.userId) {
    redirect("/login");
  }

  // Ambil data dompet dan email dari session yang sudah divalidasi
  const walletAddress = (session.walletAddress as string) || "";
  const userEmail = (session.email as string) || "";

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
    <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Heading Halaman */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Beli Tiket Event
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Dapatkan tiket resmi berbasis NFT dengan garansi anti-scalping.
        </p>
      </div>

      {/* Kartu Pembelian Tiket Interaktif Multi-Event */}
      <BuyTicketCard
        walletAddress={walletAddress}
        userEmail={userEmail}
        events={events}
        userTickets={userTickets}
      />
    </div>
  );
}
