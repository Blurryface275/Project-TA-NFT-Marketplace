"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  Users,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  QrCode,
  MapPin,
  Search,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export interface TicketCategoryItem {
  id: string | number;
  name: string;
  price: number;
  quota: number;
}

export interface OrganizerEventItem {
  id: number;
  onChainEventId?: string;
  eventName: string;
  startDate: string;
  venueLocation: string;
  category: string;
  capacity: number;
  imageIpfsCid?: string | null;
  organizersId: number;
  ticketCategories?: TicketCategoryItem[];
  categories?: TicketCategoryItem[];
  totalQuota?: number;
  soldTickets?: number;
  usedTickets?: number;
  checkInRate?: number;
}

interface OrganizerDashboardClientProps {
  userName: string;
  organizerName: string;
  events: OrganizerEventItem[];
}

export default function OrganizerDashboardClient({
  userName,
  organizerName,
  events = [],
}: OrganizerDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const totalSold = events.reduce((sum, e) => sum + (e.soldTickets || 0), 0);
    const totalQuota = events.reduce((sum, e) => {
      const quota =
        e.totalQuota ||
        (e.ticketCategories && e.ticketCategories.length > 0
          ? e.ticketCategories.reduce((s, c) => s + Number(c.quota || 0), 0)
          : e.capacity || 0);
      return sum + quota;
    }, 0);
    const totalCheckedIn = events.reduce(
      (sum, e) => sum + (e.usedTickets || 0),
      0,
    );

    return {
      totalEvents,
      totalSold,
      totalQuota,
      totalCheckedIn,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.eventName.toLowerCase().includes(q) ||
        e.venueLocation.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const formatDate = (dateStr: string) => {
    try {
      return (
        new Date(dateStr).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Organizer Banner */}
      <div className="rounded-3xl bg-[#171717] text-white p-6 sm:p-8 border border-black/[0.08] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBECE7] text-[#D94520] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D94520]" />
              <span>Promoter & Host Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {organizerName}
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Welcome back, <span className="font-semibold text-white">{userName}</span>. Monitor ticket inventory, inspect live quota allocations, and operate the admission gate terminal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/admin/events/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>+ Create Event</span>
            </Link>
            <Link
              href="/dashboard/verify"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-xs sm:text-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-[#D94520]" />
              <span>Open Gate Terminal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#736E65] uppercase tracking-wider">
              Active Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0EDE4] text-[#171717] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-[#171717]">
              {formatNumber(metrics.totalEvents)}
            </p>
            <p className="text-[11px] text-[#736E65] mt-0.5">
              Live or scheduled events
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#736E65] uppercase tracking-wider">
              Tickets Issued
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FBECE7] text-[#D94520] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-[#171717]">
              {formatNumber(metrics.totalSold)}
            </p>
            <p className="text-[11px] text-[#736E65] mt-0.5">
              Verified attendee passes
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#736E65] uppercase tracking-wider">
              Total Quota Capacity
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0EDE4] text-[#171717] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-[#171717]">
              {formatNumber(metrics.totalQuota)}
            </p>
            <p className="text-[11px] text-[#736E65] mt-0.5">
              Cumulative tier allocations
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#736E65] uppercase tracking-wider">
              Gate Check-Ins
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-emerald-700">
              {formatNumber(metrics.totalCheckedIn)}
            </p>
            <p className="text-[11px] text-[#736E65] mt-0.5">
              Admitted through gate scanner
            </p>
          </div>
        </div>
      </div>

      {/* 3. Event List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#171717] tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D94520]" />
              <span>Your Events</span>
            </h2>
            <p className="text-xs text-[#736E65]">
              Track capacity, review tiers, and open gate terminals.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#736E65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs text-[#171717] placeholder:text-[#736E65]/60 focus:outline-none focus:border-[#D94520]"
            />
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 bg-white p-8 space-y-3">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#171717]">
              No Events Found
            </h3>
            <p className="text-xs text-[#736E65]">
              Get started by publishing your first event.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/admin/events/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Create New Event</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => {
              const categories = evt.ticketCategories || evt.categories || [];
              const totalQuota =
                evt.totalQuota ||
                (categories.length > 0
                  ? categories.reduce((s, c) => s + Number(c.quota || 0), 0)
                  : evt.capacity || 0);

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl border border-black/[0.08] shadow-xs hover:border-black/15 transition overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0EDE4] text-[#171717] uppercase tracking-wider">
                        {evt.category || "Event"}
                      </span>
                      <span className="font-mono text-xs text-[#736E65]">
                        Event #{evt.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#171717] line-clamp-1">
                      {evt.eventName}
                    </h3>

                    <div className="space-y-1 text-xs text-[#736E65]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                        <span>{formatDate(evt.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#736E65] shrink-0" />
                        <span className="truncate">{evt.venueLocation}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                      <span className="text-[#736E65]">Total Quota:</span>
                      <span className="font-extrabold text-[#171717]">
                        {totalQuota} Attendees
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F0EDE4] border-t border-black/[0.06] flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/buy?eventId=${evt.id}`}
                      className="px-3 py-1.5 rounded-lg border border-black/[0.08] bg-white hover:bg-stone-50 text-xs font-semibold text-[#171717] transition inline-flex items-center gap-1"
                    >
                      <span>Public Page</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/dashboard/verify?eventId=${evt.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Gate Scanner</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
