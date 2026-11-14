import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs font-semibold text-slate-400">
            Memuat pemindai gerbang masuk...
          </div>
        }
      >
        <VerifyClient />
      </Suspense>
    </div>
  );
}
