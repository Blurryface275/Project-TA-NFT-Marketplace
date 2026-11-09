import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ResaleCatalogClient, { ResaleListingItem } from "./ResaleCatalogClient";

export default async function ResaleMarketplacePage() {
  const session = await getSession();

  if (!session?.userId) {
    return redirect("/login");
  }

  let listings: ResaleListingItem[] = [];
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/resale/active`,
      { cache: "no-store" },
    );
    if (res.ok) {
      listings = await res.json();
    }
  } catch (error) {
    console.error("Gagal mengambil katalog resale:", error);
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Pasar Sekunder Resmi (Anti-Calo)
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Jual beli tiket antar-pengguna secara aman dengan harga terkunci sama persis
          dengan harga resmi perdana.
        </p>
      </div>

      <ResaleCatalogClient
        initialListings={listings}
        currentWallet={(session.walletAddress as string) || ""}
      />
    </div>
  );
}
