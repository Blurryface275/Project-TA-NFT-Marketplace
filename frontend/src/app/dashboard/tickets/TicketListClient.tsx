"use client";

import { useState } from "react";
import TicketCard, { TicketData, EventData } from "./TicketCard";
import Link from "next/link";
import { Ticket, PlusCircle, CheckCircle2, Lock, ArrowUpRight } from "lucide-react";

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
      {/* Editorial Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              filter === "ALL"
                ? "bg-[#D94520] text-white border-[#D94520] shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>All Passes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === "ALL" ? "bg-white/20 text-white" : "bg-stone-100 text-[#736E65]"
              }`}
            >
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              filter === "ACTIVE"
                ? "bg-[#171717] text-white border-[#171717] shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Ready</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === "ACTIVE" ? "bg-white/20 text-white" : "bg-stone-100 text-[#736E65]"
              }`}
            >
              {activeTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("USED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              filter === "USED"
                ? "bg-stone-800 text-white border-stone-800 shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Past / Checked In</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === "USED" ? "bg-white/20 text-white" : "bg-stone-100 text-[#736E65]"
              }`}
            >
              {usedTickets.length}
            </span>
          </button>
        </div>

        <Link
          href="/dashboard/buy"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#D94520] hover:underline"
        >
          <span>Find more events</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid or Empty State */}
      {displayedTickets.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-white p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FBECE7] border border-[#D94520]/20 flex items-center justify-center mx-auto text-[#D94520] shadow-xs">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#171717]">
              {filter === "ACTIVE"
                ? "No active tickets right now"
                : filter === "USED"
                  ? "No past redeemed tickets"
                  : "No tickets found in your collection"}
            </h3>
            <p className="text-xs text-[#736E65] max-w-sm mx-auto">
              {filter === "ALL"
                ? "Explore upcoming concerts and cultural events to book your passes."
                : "Your passes will update dynamically once checked in at venue gates."}
            </p>
          </div>
          {filter === "ALL" && (
            <div className="pt-2">
              <Link
                href="/dashboard/buy"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold shadow-xs transition"
              >
                <span>Browse Events</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {displayedTickets.map((ticket) => (
            <TicketCard key={ticket.tokenId} ticket={ticket} events={events} />
          ))}
        </div>
      )}
    </div>
  );
}
