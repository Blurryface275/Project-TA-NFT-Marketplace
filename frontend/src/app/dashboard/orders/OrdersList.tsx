"use client";

import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { checkOrderStatusAction } from "../buy/actions";
import Link from "next/link";

export interface OrderItem {
  id: string;
  amount: number;
  totalPrice: number | string;
  adminFee: number | string;
  status: "pending" | "paid" | "failed" | "cancelled";
  createdAt: string;
  midtransTransactionId: string | null;
  ticketCategory: {
    id: string;
    name: string;
    price: number | string;
    event?: {
      id: number;
      eventName: string;
      location?: string;
    };
  };
}

interface OrdersListProps {
  initialOrders: OrderItem[];
  walletAddress: string;
}

export default function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleRefreshStatus = async (orderId: string) => {
    setCheckingOrderId(orderId);
    try {
      const res = await checkOrderStatusAction(orderId);
      if (res.success && res.status) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: res.status,
                  midtransTransactionId:
                    res.midtransTransactionId || o.midtransTransactionId,
                }
              : o,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to check order status:", e);
    } finally {
      setCheckingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settled (Paid)</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FEF3C7]">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Settlement</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-[#736E65] border border-stone-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Unsuccessful</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Filter Capsule Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.08] pb-4">
        {[
          { key: "all", label: "All Receipts" },
          { key: "paid", label: "Paid" },
          { key: "pending", label: "Pending" },
          { key: "failed", label: "Failed" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filter === f.key
                ? "bg-[#D94520] text-white border-[#D94520] shadow-xs"
                : "bg-white text-[#736E65] border-black/[0.08] hover:border-black/20 hover:text-[#171717]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Receipts List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-stone-300" />
          <h3 className="font-bold text-[#171717] text-sm">No Orders Yet</h3>
          <p className="text-xs text-[#736E65]">
            When you purchase passes via Midtrans, receipt logs will appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/buy"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D94520] hover:bg-[#BF3B19] text-white text-xs font-bold transition"
            >
              <span>Explore Events</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 rounded-2xl bg-white border border-black/[0.08] shadow-xs hover:border-black/15 transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3.5">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-[#171717] block">
                    Receipt #{order.id}
                  </span>
                  <span className="text-[11px] text-[#736E65]">
                    {new Date(order.createdAt).toLocaleString("id-ID")} WIB
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#736E65] block text-[10px] font-bold uppercase tracking-wider">
                    Event & Tier:
                  </span>
                  <span className="font-extrabold text-[#171717] text-sm mt-0.5 block">
                    {order.ticketCategory?.event?.eventName || "Curated Event"}
                  </span>
                  <span className="text-[#D94520] block font-bold mt-0.5">
                    {order.ticketCategory?.name} ({order.amount}x Pass)
                  </span>
                </div>

                <div>
                  <span className="text-[#736E65] block text-[10px] font-bold uppercase tracking-wider">
                    Breakdown:
                  </span>
                  <span className="text-[#171717] block mt-0.5 font-medium">
                    Face Value: {formatRupiah(Number(order.totalPrice) - Number(order.adminFee))}
                  </span>
                  <span className="text-[#736E65] block text-[11px]">
                    Platform Fee: {formatRupiah(order.adminFee)}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[#736E65] block text-[10px] font-bold uppercase tracking-wider">
                    Total Amount:
                  </span>
                  <span className="text-lg font-extrabold text-[#171717] font-mono mt-0.5 block">
                    {formatRupiah(order.totalPrice)}
                  </span>
                </div>
              </div>

              {order.status === "pending" && (
                <div className="pt-2 flex justify-end border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleRefreshStatus(order.id)}
                    disabled={checkingOrderId === order.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-stone-50 text-xs font-bold text-[#171717] transition shadow-xs cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#D94520] ${
                        checkingOrderId === order.id ? "animate-spin" : ""
                      }`}
                    />
                    <span>Sync Settlement Status</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
