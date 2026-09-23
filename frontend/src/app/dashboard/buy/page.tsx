import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import BuyTicketCard from "./BuyTicketCard";

export default async function BuyTicketPage() {
  // Ambil session langsung di server
  const session = await getSession();

  // Jika session tidak ditemukan atau dompet belum ada, arahkan ke login
  if (!session?.walletAddress) {
    redirect("/login");
  }

  // Ambil data tiket yang sudah dimiliki user dari backend relayer
  let ownedCount = 0;
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/my-tickets/${session.walletAddress}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const tickets = await res.json();
      if (Array.isArray(tickets)) {
        ownedCount = tickets.length;
      }
    }
  } catch (err) {
    console.error("Gagal mengambil data tiket user:", err);
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Heading Halaman */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Beli Tiket Event
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Dapatkan tiket resmi berbasis NFT dengan garansi anti-scalping.   
        </p>
      </div>

      {/* Kartu Pembelian Tiket Interaktif */}
      <BuyTicketCard
        walletAddress={session.walletAddress as string}
        initialOwnedCount={ownedCount}
      />
    </div>
  );
}
