import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TicketListClient from "./TicketListClient";
import { TicketData, EventData } from "./TicketCard";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function MyTicketsPage() {
  // ambil session pengguna langsung di server
  const session = await getSession();

  if (!session?.userId) {
    return redirect("/login"); // jika belum login sama sekali, redirect ke login
  }

  // ambil data tiket milik pengguna dari backend jika dompet sudah aktif
  const walletAddress = session.walletAddress;

  // ambil seluruh tiket milik alamat dompet pengguna dari Backend NestJS
  let tickets: TicketData[] = [];
  if (walletAddress) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/api/tickets/my-tickets/${walletAddress}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        tickets = await res.json();
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
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
  } catch (error) {
    console.error("Gagal mengambil daftar event:", error);
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header Halaman (Loket.com Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Tiket Saya
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Kelola e-voucher konser resmi yang tersimpan di Smart Account blockchain Anda.
          </p>
        </div>
        <Link
          href="/dashboard/buy"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral-500 text-white text-sm font-bold hover:bg-coral-600 transition shadow-[0_4px_14px_rgba(255,90,54,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Beli Tiket Baru</span>
        </Link>
      </div>

      {/* Komponen Client dengan Tab Filter Loket.com */}
      <TicketListClient tickets={tickets} events={events} />
    </div>
  );
}
