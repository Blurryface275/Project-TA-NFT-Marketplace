"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Sparkles,
  Ticket,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Armchair,
} from "lucide-react";
import { createEventAction, CreateEventResult } from "./actions";

interface CategoryInput {
  name: string;
  price: number;
  quota: number;
}

export default function CreateEventForm() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [eventName, setEventName] = useState("");
  const [category, setCategory] = useState("konser musik");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [venueLocation, setVenueLocation] = useState("");
  const [capacity, setCapacity] = useState<number>(300);
  const [maxPerWallet, setMaxPerWallet] = useState<number>(2);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Categories Builder State
  const [categories, setCategories] = useState<CategoryInput[]>([
    { name: "VIP (Early Access)", price: 150000, quota: 50 },
    { name: "CAT 1 (TRIBUN)", price: 100000, quota: 100 },
    { name: "FESTIVAL", price: 75000, quota: 150 },
  ]);

  // Submission Result & Client Validation Error
  const [submitResult, setSubmitResult] = useState<CreateEventResult | null>(
    null,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  // Format tanggal preview sesuai WIB (identik dengan BuyTicketCard)
  const eventDateFormatted = useMemo(() => {
    try {
      return (
        new Date(startDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    } catch {
      return "Waktu pelaksanaan event";
    }
  }, [startDate]);

  // Hitung total alokasi kuota kategori
  const totalAllocatedQuota = useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.quota) || 0), 0);
  }, [categories]);

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setClientError(
        "Format gambar tidak didukung! Gunakan format JPG, PNG, atau WEBP.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setClientError("Ukuran file terlalu besar! Maksimal 5 MB.");
      return;
    }

    setClientError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setClientError(
        "Format gambar tidak didukung! Gunakan format JPG, PNG, atau WEBP.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setClientError("Ukuran file melebihi 5 MB.");
      return;
    }

    setClientError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Helper Kategori
  const addCategoryRow = () => {
    setCategories((prev) => [
      ...prev,
      { name: `Kategori #${prev.length + 1}`, price: 100000, quota: 50 },
    ]);
  };

  const removeCategoryRow = (index: number) => {
    if (categories.length <= 1) {
      setClientError("Minimal harus ada 1 kategori tiket!");
      return;
    }
    setCategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateCategory = (
    index: number,
    field: keyof CategoryInput,
    value: string | number,
  ) => {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setSubmitResult(null);

    if (!eventName.trim()) {
      setClientError("Nama event wajib diisi!");
      return;
    }
    if (!venueLocation.trim()) {
      setClientError("Lokasi venue wajib diisi!");
      return;
    }
    if (new Date(startDate).getTime() <= Date.now()) {
      setClientError("Waktu pelaksanaan event harus berada di masa depan!");
      return;
    }
    if (
      categories.some((c) => !c.name.trim() || c.price <= 0 || c.quota <= 0)
    ) {
      setClientError(
        "Setiap kategori tiket wajib memiliki nama, harga > 0, dan kuota > 0!",
      );
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("eventName", eventName.trim());
      formData.append("category", category);
      formData.append("startDate", new Date(startDate).toISOString());
      formData.append("venueLocation", venueLocation.trim());
      formData.append("capacity", String(capacity));
      formData.append("maxPerWallet", String(maxPerWallet));
      formData.append("organizersId", "1");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      formData.append("ticketCategories", JSON.stringify(categories));

      try {
        const result = await createEventAction(formData);

        if (!result.success) {
          setClientError(result.message || "Gagal membuat event.");
          return;
        }

        setSubmitResult(result);
      } catch (err: any) {
        setClientError(
          err?.message || "Terjadi kendala saat mendaftarkan event.",
        );
      }
    });
  };

  const resetForm = () => {
    setEventName("");
    setVenueLocation("");
    setImageFile(null);
    setImagePreview(null);
    setSubmitResult(null);
    setClientError(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Tombol Navigasi Kembali ke Katalog Event (Sesuai BuyTicketCard) */}
      <Link
        href="/dashboard/buy"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Event</span>
      </Link>

      {/* Alert Error Klien jika ada */}
      {clientError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Periksa Input Formulir:</span>
            <span>{clientError}</span>
          </div>
        </div>
      )}

      {/* Notifikasi Hasil Sukses Pendaftaran On-Chain */}
      {submitResult?.success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>
              {submitResult.message ||
                "Event berhasil didaftarkan ke Database dan Blockchain Sepolia!"}
            </span>
          </div>

          <div className="text-xs space-y-1 font-mono text-muted-foreground pl-7">
            {submitResult.blockchain?.createBlockNumber && (
              <p>
                Block Terkonfirmasi: #
                {submitResult.blockchain.createBlockNumber}
              </p>
            )}
            {submitResult.blockchain?.createEventTx && (
              <p className="truncate">
                Hash Transaksi (`createEvent`):{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${submitResult.blockchain.createEventTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {submitResult.blockchain.createEventTx}
                </a>
              </p>
            )}
          </div>

          <div className="pt-2 pl-7 flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/buy"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Lihat di Halaman Beli Tiket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Event Lainnya</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid 2-Kolom: Form Input (Kiri) & Live Ticket Card Preview (Kanan) */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (7 Kolom): Input Form Detail Event */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card 1: Informasi Master Event */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-4">
              <span className="text-sm font-semibold text-foreground block">
                Detail Informasi Event
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Nama Event
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: UBAYA Music Fest 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Kategori Event
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                  >
                    <option value="konser musik">Konser Musik</option>
                    <option value="festival musik">Festival Musik</option>
                    <option value="seminar">Seminar</option>
                    <option value="olahraga">Pertandingan Olahraga</option>
                    <option value="stand up comedy">Stand Up Comedy</option>
                    <option value="pameran berbayar">Pameran Berbayar</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Waktu & Tanggal Pelaksanaan
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/80">
                  Lokasi Venue
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Lapangan Parkir Kampus II Tenggilis UBAYA"
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Kapasitas Total Penonton
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    Maksimal Tiket / Dompet (Anti-Scalp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={maxPerWallet}
                    onChange={(e) => setMaxPerWallet(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Background Tiket & Poster Event */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Background Tiket & Poster Event
                </span>
                <span className="text-xs text-foreground/75 font-medium">
                  Rasio 16:9 disarankan (JPG/PNG/WEBP)
                </span>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/60 transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  imagePreview ? "border-primary/50" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">
                      {imageFile
                        ? imageFile.name
                        : "Klik atau seret file gambar ke sini"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {imageFile
                        ? `${(imageFile.size / 1024).toFixed(0)} KB • Gambar otomatis tampil di preview tiket`
                        : "Maksimal 5 MB • Akan menjadi latar belakang kartu E-Ticket NFT"}
                    </p>
                  </div>
                </div>

                {imagePreview && (
                  <span className="text-xs font-semibold text-primary px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                    Ganti Gambar
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Kategori Tiket & Kuota On-Chain */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Kategori Tiket & Kuota On-Chain
                </span>
                <button
                  type="button"
                  onClick={addCategoryRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Nama Kategori
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VIP, Festival, dsb."
                        value={cat.name}
                        onChange={(e) =>
                          updateCategory(index, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        required
                        value={cat.price}
                        onChange={(e) =>
                          updateCategory(index, "price", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Kuota Tiket
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cat.quota}
                        onChange={(e) =>
                          updateCategory(index, "quota", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {categories.length > 1 && (
                      <div className="sm:self-end">
                        <button
                          type="button"
                          onClick={() => removeCategoryRow(index)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Hapus kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Ringkasan Kuota */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Total Alokasi Kuota:{" "}
                  <strong className="text-foreground">
                    {totalAllocatedQuota}
                  </strong>{" "}
                  / {capacity} kursi
                </span>
                {totalAllocatedQuota > capacity ? (
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Melebihi Kapasitas
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kuota Terpenuhi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (5 Kolom): Live Ticket Card Preview & Submit */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Live Ticket Background Preview
              </span>
              <span className="text-xs text-foreground/75 font-medium">
                Simulasi Kartu Pembeli
              </span>
            </div>

            {/* Kartu Preview Tiket (Struktur, Border, dan Font Weight Sama Persis dengan BuyTicketCard) */}
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden transition-all">
              {/* Header Banner Event Preview - Tampil Apa Adanya Tanpa Layer Ungu */}
              <div
                className="relative p-6 border-b border-border/50 bg-cover bg-center overflow-hidden transition-all duration-300"
                style={{
                  backgroundImage: imagePreview
                    ? `linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0) 100%), url(${imagePreview})`
                    : "linear-gradient(135deg, #27272a 0%, #18181b 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-sm text-white border border-white/20">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Official Event
                  </span>
                  <span className="text-xs font-medium text-white/90 capitalize bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/20">
                    {category || "Konser Musik"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mt-3 drop-shadow-md">
                  {eventName || "Nama Event Baru"}
                </h3>
                <p className="text-sm text-zinc-300 font-medium mt-1 drop-shadow-sm">
                  BEM Universitas Surabaya • Penyelenggara Resmi
                </p>

                <div className="grid grid-cols-1 gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
                  <div className="flex items-center gap-2 text-zinc-200 font-medium drop-shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span>{eventDateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-200 font-medium truncate drop-shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span className="truncate">
                      {venueLocation || "Lokasi venue konser"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Ringkasan Tiket Preview — Menampilkan Seluruh Kategori Tiket */}
              <div className="p-5 space-y-4 bg-card">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/75 font-medium">
                      Daftar Kategori Tiket (Preview)
                    </span>
                    <span className="text-xs text-foreground/75 font-medium">
                      {categories.length} Kategori Tersedia
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {categories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {cat.name || `Kategori #${idx + 1}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-foreground/80">
                            {cat.quota || 0} Kuota
                          </span>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          Rp {(Number(cat.price) || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimasi Nomor Kursi Sequential */}

                {/* <Armchair className="w-4 h-4 text-primary shrink-0 mt-0.5" /> */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Alokasi Kursi:
                    </span>
                    <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/15 text-[11px]">
                      VIP-01
                    </span>
                  </div>
                  {/* <p className="text-[11px] text-muted-foreground">
                      Sequential Auto-Assignment di smart contract.
                    </p> */}
                </div>
              </div>
            </div>

            {/* Tombol Terbitkan Event */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan ke Blockchain & Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Daftarkan Event & Terbitkan ke Blockchain</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
