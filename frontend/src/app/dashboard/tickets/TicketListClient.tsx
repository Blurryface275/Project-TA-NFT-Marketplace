"use client";

import { useState } from "react";
import TicketCard, { TicketData, EventData } from "./TicketCard";
import Link from "next/link";
import { Ticket, PlusCircle, CheckCircle2, Lock } from "lucide-react";

interface TicketListClientProps {
  tickets: TicketData[];
  events: EventData[];
}

export default function TicketListClient({
  tickets,
  events,
}: TicketListClientProps) {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "USED">("ALL");

  const activeTickets = tickets.filter((t) => !t.used);
  const usedTickets = tickets.filter((t) => t.used);

  const displayedTickets =
    filter === "ACTIVE"
      ? activeTickets
      : filter === "USED"
        ? usedTickets
        : tickets;

  return (
    <div className="space-y-6">
      {/* Loket.com Style Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === "ALL"
              ? "bg-coral-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Semua Tiket</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {tickets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === "ACTIVE"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tiket Aktif</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filter === "ACTIVE" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {activeTickets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("USED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === "USED"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sudah Terpakai</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filter === "USED" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {usedTickets.length}
          </span>
        </button>
      </div>

      {/* Grid Tiket atau Tampilan Kosong */}
      {displayedTickets.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-coral-50 border border-coral-200 flex items-center justify-center mx-auto text-coral-500 shadow-xs">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {filter === "ACTIVE"
                ? "Tidak Ada Tiket Aktif"
                : filter === "USED"
                  ? "Belum Ada Tiket yang Digunakan"
                  : "Belum Ada Tiket"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {filter === "ALL"
                ? "Anda belum memiliki tiket konser on-chain. Dapatkan tiket resmi pertama Anda sekarang!"
                : "Tidak ada tiket dalam kategori ini."}
            </p>
          </div>
          {filter === "ALL" && (
            <Link
              href="/dashboard/buy"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-500 text-white text-sm font-bold hover:bg-coral-600 transition shadow-[0_4px_16px_rgba(255,90,54,0.3)]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Beli Tiket Sekarang</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedTickets.map((t) => (
            <TicketCard key={t.tokenId} ticket={t} events={events} />
          ))}
        </div>
      )}
    </div>
  );
}
