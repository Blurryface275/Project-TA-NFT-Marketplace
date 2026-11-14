import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import ResaleDetailClient from "./ResaleDetailClient";

interface ResaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResaleDetailPage({ params }: ResaleDetailPageProps) {
  const session = await getSession();

  if (!session?.userId) {
    return redirect("/login");
  }

  const { id } = await params;

  let listing = null;
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/tickets/resale/detail/${id}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      listing = await res.json();
    }
  } catch (error) {
    console.error("Gagal mengambil detail tiket resale:", error);
  }

  if (!listing) {
    notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <ResaleDetailClient
        listing={listing}
        currentWallet={(session.walletAddress as string) || ""}
      />
    </div>
  );
}

