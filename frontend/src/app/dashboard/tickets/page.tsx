import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TicketCard, { TicketData } from "./TicketCard";
import Link from "next/link";
import { Ticket, PlusCircle } from "lucide-react";

export default async function MyTicketsPage() {
  // ambil session pengguna lagnsugn di server
  const session = await getSession();

  if (!session?.walletAddress) {
    return redirect("/login"); // kalau tidak ada walletAddress di session berarti dia tidak login, maka akan di redirect ke login
  }

  // ambil data tiket milik pengguna dari backend
  const walletAddress = session.walletAddress;

  // ambil seluruh tiket milik alamat dompet pengguna dari Backend NestJS
  let tickets: TicketData[] = [];
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/my-tickets/${walletAddress}`,
    );
    if (res.ok) {
      tickets = await res.json();
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Tiket Saya
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar tiket konser NFT yang tersimpan di smart account blockchain
            Anda.
          </p>
        </div>
        <Link
          href="/dashboard/buy"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Beli Tiket Baru</span>
        </Link>
      </div>
      {/* Grid Tiket atau Tampilan Kosong */}
      {tickets.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Belum Ada Tiket
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Anda belum memiliki tiket konser on-chain. Dapatkan tiket resmi
              pertama Anda sekarang!
            </p>
          </div>
          <Link
            href="/dashboard/buy"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Beli Tiket Sekarang</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t) => (
            <TicketCard key={t.tokenId} ticket={t} /> // t adalah object tiketnya, setiaptiket kan punya id unik
          ))}
        </div>
      )}
    </div>
  );
}
