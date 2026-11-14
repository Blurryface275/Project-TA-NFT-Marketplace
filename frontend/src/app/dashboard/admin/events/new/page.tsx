import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CreateEventForm from "./CreateEventForm";

export default async function CreateEventPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  let organizersId = (session?.organizersId as number) || 1;
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backendUrl}/api/events/user/${session.userId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.organizer?.id) {
        organizersId = data.organizer.id;
      }
    }
  } catch (e) {
    console.error("Gagal ambil organizer id:", e);
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Heading Halaman yang konsisten dengan halaman Beli Tiket */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Buat Event Baru
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Daftarkan event baru ke database dan smart contract Sepolia dengan garansi anti-scalping.
        </p>
      </div>

      {/* Form Buat Event yang menggunakan struktur kartu dan ketebalan yang sama */}
      <CreateEventForm organizersId={organizersId} />
    </div>
  );
}
