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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Berhasil (Paid)</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Pembayaran</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Gagal</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Filter Status */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
        {["all", "paid", "pending", "failed"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer capitalize ${
              filter === f
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {f === "all" ? "Semua Pesanan" : f}
          </button>
        ))}
      </div>

      {/* Daftar Kartu Pesanan */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <Receipt className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Transaksi</h3>
          <p className="text-xs text-slate-500">
            Pesanan tiket resmi yang Anda buat akan tercatat otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-coral-500/30 transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-slate-800 block">
                    Order #{order.id}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(order.createdAt).toLocaleString("id-ID")} WIB
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Rincian Harga Tiket & Biaya Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Event & Kategori:</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {order.ticketCategory?.event?.eventName || "Event Musik"}
                  </span>
                  <span className="text-coral-600 block font-bold mt-0.5">
                    {order.ticketCategory?.name} ({order.amount}x Tiket)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Rincian Biaya:</span>
                  <span className="text-slate-700 block mt-0.5 font-medium">
                    Tiket: {formatRupiah(Number(order.totalPrice) - Number(order.adminFee))}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    Biaya Platform: {formatRupiah(order.adminFee)}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">Total Pembayaran:</span>
                  <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {formatRupiah(order.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Tombol Cek Status untuk pesanan yang masih pending */}
              {order.status === "pending" && (
                <div className="pt-2 flex justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleRefreshStatus(order.id)}
                    disabled={checkingOrderId === order.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-xs cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-coral-500 ${
                        checkingOrderId === order.id ? "animate-spin" : ""
                      }`}
                    />
                    <span>Sinkronkan Status Pembayaran</span>
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
