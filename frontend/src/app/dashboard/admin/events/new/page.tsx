import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CreateEventForm from "./CreateEventForm";

export default async function CreateEventPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
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
      <CreateEventForm />
    </div>
  );
}
