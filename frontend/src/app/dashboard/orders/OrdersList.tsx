"use client";

import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { checkOrderStatusAction } from "../buy/actions";

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

  // Cek status manual jika order masih pending
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
      console.error("Gagal memeriksa status pesanan:", e);
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Berhasil (Paid)</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Pembayaran</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Gagal</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Filter Status */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        {["all", "paid", "pending", "failed"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Semua Pesanan" : f}
          </button>
        ))}
      </div>

      {/* Daftar Kartu Pesanan */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-muted-foreground/60" />
          <h3 className="font-semibold text-foreground text-sm">Belum Ada Transaksi</h3>
          <p className="text-xs text-muted-foreground">
            Pesanan tiket yang kamu buat akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4 hover:border-primary/40 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs text-muted-foreground block">
                    Order #{order.id}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("id-ID")} WIB
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Rincian Harga Tiket & Biaya Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Event & Kategori:</span>
                  <span className="font-bold text-foreground">
                    {order.ticketCategory?.event?.eventName || "Event Musik"}
                  </span>
                  <span className="text-primary block font-medium">
                    {order.ticketCategory?.name} ({order.amount}x)
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Rincian Biaya:</span>
                  <span className="text-foreground block">
                    Tiket: {formatRupiah(Number(order.totalPrice) - Number(order.adminFee))}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    Biaya Admin: {formatRupiah(order.adminFee)}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-muted-foreground block text-[11px]">Total Tagihan:</span>
                  <span className="text-base font-extrabold text-foreground">
                    {formatRupiah(order.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Tombol Cek Status untuk pesanan yang masih pending */}
              {order.status === "pending" && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRefreshStatus(order.id)}
                    disabled={checkingOrderId === order.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        checkingOrderId === order.id ? "animate-spin" : ""
                      }`}
                    />
                    <span>Cek Status Pembayaran</span>
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
