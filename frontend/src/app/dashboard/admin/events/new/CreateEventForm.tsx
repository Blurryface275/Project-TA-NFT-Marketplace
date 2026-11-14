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
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  Clock,
} from "lucide-react";
import { createEventAction, CreateEventResult } from "./actions";

interface CategoryInput {
  name: string;
  price: number;
  quota: number;
}

export default function CreateEventForm({
  organizersId = 1,
}: {
  organizersId?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [maxPerWallet, setMaxPerWallet] = useState<number>(1);

  // Pengaturan Jadwal Flash Sale Time-Window oleh Penjual
  const [hasFlashSale, setHasFlashSale] = useState(false);
  const [flashSaleStartTime, setFlashSaleStartTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(20, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [flashSaleEndTime, setFlashSaleEndTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(20 + 12, 0, 0, 0); // Default durasi eksklusif 12 jam
    return d.toISOString().slice(0, 16);
  });

  const handleFlashSaleStartTimeChange = (val: string) => {
    setFlashSaleStartTime(val);
    if (val) {
      try {
        const start = new Date(val);
        const end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
        setFlashSaleEndTime(end.toISOString().slice(0, 16));
      } catch {}
    }
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryInput[]>([
    { name: "VIP Pass", price: 150000, quota: 50 },
    { name: "Reserved Seat", price: 100000, quota: 100 },
    { name: "General Admission", price: 75000, quota: 150 },
  ]);

  const [submitResult, setSubmitResult] = useState<CreateEventResult | null>(
    null,
  );
  const [clientError, setClientError] = useState<string | null>(null);

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
      return "Event Schedule";
    }
  }, [startDate]);

  const totalAllocatedQuota = useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.quota) || 0), 0);
  }, [categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setClientError(
        "Unsupported image format! Please use JPG, PNG, or WEBP.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setClientError("File size exceeds 5 MB limit.");
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
      setClientError("Unsupported image format! Please use JPG, PNG, or WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setClientError("File size exceeds 5 MB limit.");
      return;
    }

    setClientError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addCategoryRow = () => {
    setCategories((prev) => [
      ...prev,
      { name: `Tier #${prev.length + 1}`, price: 50000, quota: 50 },
    ]);
  };

  const removeCategoryRow = (index: number) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCategory = (
    index: number,
    field: keyof CategoryInput,
    value: string | number,
  ) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setSubmitResult(null);

    if (!eventName.trim()) {
      setClientError("Event name is required.");
      return;
    }

    if (!venueLocation.trim()) {
      setClientError("Venue location is required.");
      return;
    }

    if (totalAllocatedQuota > capacity) {
      setClientError(
        `Total allocated quota (${totalAllocatedQuota}) exceeds overall capacity (${capacity}).`,
      );
      return;
    }

    for (const cat of categories) {
      if (!cat.name.trim()) {
        setClientError("All category tier names must be filled.");
        return;
      }
      if (Number(cat.price) <= 0) {
        setClientError("Category price must be greater than Rp 0.");
        return;
      }
      if (Number(cat.quota) <= 0) {
        setClientError("Category quota must be at least 1 ticket.");
        return;
      }
    }

    if (hasFlashSale) {
      if (!flashSaleStartTime) {
        setClientError("Waktu mulai flash sale wajib ditentukan.");
        return;
      }
      if (!flashSaleEndTime) {
        setClientError("Waktu berakhir flash sale wajib ditentukan.");
        return;
      }
      if (new Date(flashSaleEndTime).getTime() <= new Date(flashSaleStartTime).getTime()) {
        setClientError("Waktu berakhir flash sale harus lebih lama dari waktu mulai flash sale.");
        return;
      }
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("eventName", eventName.trim());
      formData.append("category", category);
      formData.append("startDate", startDate);
      formData.append("venueLocation", venueLocation.trim());
      formData.append("capacity", String(capacity));
      formData.append("maxPerWallet", String(maxPerWallet));
      formData.append("organizersId", String(organizersId));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      formData.append("ticketCategories", JSON.stringify(categories));
      if (hasFlashSale) {
        formData.append("saleStartTime", flashSaleStartTime);
        formData.append("saleEndTime", flashSaleEndTime);
      }

      try {
        const result = await createEventAction(formData);

        if (!result.success) {
          setClientError(result.message || "Failed to create event.");
          return;
        }

        setSubmitResult(result);
      } catch (err: any) {
        setClientError(
          err?.message || "Encountered an issue creating the event.",
        );
      }
    });
  };

  const resetForm = () => {
    setEventName("");
    setVenueLocation("");
    setHasFlashSale(false);
    setImageFile(null);
    setImagePreview(null);
    setSubmitResult(null);
    setClientError(null);
  };

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#736E65] hover:text-[#171717] hover:border-black/20 transition cursor-pointer shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Organizer Console</span>
      </Link>

      {clientError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold block">Please verify your inputs:</span>
            <span>{clientError}</span>
          </div>
        </div>
      )}

      {submitResult?.success && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>
              {submitResult.message || "Event created and published successfully!"}
            </span>
          </div>

          <div className="text-xs space-y-1 font-mono text-[#736E65] pl-7">
            {submitResult.blockchain?.createBlockNumber && (
              <p>Confirmed Block: #{submitResult.blockchain.createBlockNumber}</p>
            )}
            {submitResult.blockchain?.createEventTx && (
              <p className="truncate">
                Tx Hash:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${submitResult.blockchain.createEventTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D94520] hover:underline"
                >
                  {submitResult.blockchain.createEventTx}
                </a>
              </p>
            )}
          </div>

          <div className="pt-2 pl-7 flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/buy"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D94520] text-white hover:bg-[#BF3B19] text-xs font-semibold transition"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>View in Public Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/[0.08] bg-white hover:bg-stone-50 text-xs font-semibold text-[#171717] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Another Event</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input Form */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-black/[0.08] rounded-2xl shadow-xs p-6 space-y-4">
              <span className="text-sm font-bold text-[#171717] block">
                Event Details
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#171717]">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joyland Festival 2026: Jakarta Autumn"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium placeholder:text-[#736E65]/60 focus:outline-none focus:border-[#D94520]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#171717]">
                    Kategori Event
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520] capitalize"
                  >
                    <option value="konser musik">Konser Musik</option>
                    <option value="festival musik">Festival Musik</option>
                    <option value="seminar">Seminar & Konferensi</option>
                    <option value="olahraga">Pertandingan Olahraga</option>
                    <option value="stand up comedy">Stand Up Comedy</option>
                    <option value="pameran berbayar">Pameran & Exhibition</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#171717]">
                    Date & Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#171717]">
                  Venue Location & City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GBK Baseball Stadium, Jakarta Pusat"
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium placeholder:text-[#736E65]/60 focus:outline-none focus:border-[#D94520]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#171717]">
                    Total Venue Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#171717]">
                    Max Passes / Account (Anti-Scalp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={maxPerWallet}
                    onChange={(e) => setMaxPerWallet(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520]"
                  />
                </div>
              </div>
            </div>

            {/* Pengaturan Jadwal Flash Sale oleh Penjual */}
            <div className="bg-white border border-black/[0.08] rounded-2xl shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#D94520] fill-[#D94520]" />
                    <span className="text-sm font-bold text-[#171717]">
                      Program Jadwal Flash Sale
                    </span>
                  </div>
                  <p className="text-xs text-[#736E65]">
                    Tentukan kapan tiket dibuka khusus dengan hitung mundur otomatis di Halaman Flash Sale
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFlashSale}
                    onChange={(e) => setHasFlashSale(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D94520]"></div>
                </label>
              </div>

              {hasFlashSale && (
                <div className="pt-3 border-t border-black/[0.06] space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#171717] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D94520]" />
                        <span>Waktu Buka Flash Sale</span>
                      </label>
                      <input
                        type="datetime-local"
                        required={hasFlashSale}
                        value={flashSaleStartTime}
                        onChange={(e) => handleFlashSaleStartTimeChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#171717] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D94520]" />
                        <span>Waktu Berakhir Flash Sale</span>
                      </label>
                      <input
                        type="datetime-local"
                        required={hasFlashSale}
                        value={flashSaleEndTime}
                        onChange={(e) => setFlashSaleEndTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0EDE4] border border-black/[0.08] text-[#171717] text-xs font-medium focus:outline-none focus:border-[#D94520]"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBECE7] border border-[#D94520]/20 text-xs text-[#736E65] flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#D94520] shrink-0 mt-0.5 fill-[#D94520]" />
                    <p className="text-[11px] leading-relaxed">
                      Tiket akan dijual secara eksklusif di tab <strong className="text-[#171717]">Flash Sale</strong> sampai batas waktu selesai. Setelah waktu tersebut berakhir, sisa kuota yang belum terjual otomatis dialihkan (ditumpahkan) ke katalog umum / marketplace biasa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Poster Upload */}
            <div className="bg-white border border-black/[0.08] rounded-2xl shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#171717]">
                  Cover Poster & Banner
                </span>
                <span className="text-xs text-[#736E65]">
                  16:9 ratio recommended (JPG/PNG/WEBP)
                </span>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-xl border border-dashed border-stone-300 bg-[#F0EDE4]/60 hover:bg-[#F0EDE4] transition cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  imagePreview ? "border-[#D94520]" : ""
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
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center text-[#D94520] shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#171717]">
                      {imageFile ? imageFile.name : "Click or drag poster file here"}
                    </p>
                    <p className="text-[11px] text-[#736E65]">
                      {imageFile
                        ? `${(imageFile.size / 1024).toFixed(0)} KB • Live banner preview updated`
                        : "Max 5 MB • Featured as event card cover"}
                    </p>
                  </div>
                </div>

                {imagePreview && (
                  <span className="text-xs font-semibold text-[#D94520] px-3 py-1 rounded-lg bg-[#FBECE7] border border-[#D94520]/20 shrink-0">
                    Change Image
                  </span>
                )}
              </div>
            </div>

            {/* Ticket Categories */}
            <div className="bg-white border border-black/[0.08] rounded-2xl shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#171717]">
                  Ticket Tiers & Quota
                </span>
                <button
                  type="button"
                  onClick={addCategoryRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-black/[0.08] bg-white text-xs font-semibold text-[#171717] hover:bg-stone-50 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D94520]" />
                  <span>Add Tier</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F0EDE4] flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#736E65] uppercase tracking-wider mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VIP Pass, Festival, etc."
                        value={cat.name}
                        onChange={(e) =>
                          updateCategory(index, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[#171717] text-xs font-semibold focus:outline-none focus:border-[#D94520]"
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[10px] font-bold text-[#736E65] uppercase tracking-wider mb-1">
                        Price (Rp)
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
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[#171717] text-xs font-mono font-semibold focus:outline-none focus:border-[#D94520]"
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="block text-[10px] font-bold text-[#736E65] uppercase tracking-wider mb-1">
                        Quota
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cat.quota}
                        onChange={(e) =>
                          updateCategory(index, "quota", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[#171717] text-xs font-semibold focus:outline-none focus:border-[#D94520]"
                      />
                    </div>

                    {categories.length > 1 && (
                      <div className="sm:self-end">
                        <button
                          type="button"
                          onClick={() => removeCategoryRow(index)}
                          className="p-2 rounded-lg text-[#736E65] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] flex items-center justify-between text-xs">
                <span className="text-[#736E65]">
                  Total Allocated:{" "}
                  <strong className="text-[#171717] font-bold">
                    {totalAllocatedQuota}
                  </strong>{" "}
                  / {capacity} passes
                </span>
                {totalAllocatedQuota > capacity ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Exceeds Capacity
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Capacity Matched
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#171717]">
                Live Showcase Preview
              </span>
              <span className="text-xs text-[#736E65]">
                Attendee Perspective
              </span>
            </div>

            <div className="bg-white border border-black/[0.08] rounded-2xl shadow-xs overflow-hidden transition-all">
              <div
                className="relative p-6 border-b border-black/[0.06] bg-cover bg-center overflow-hidden transition-all duration-300"
                style={{
                  backgroundImage: imagePreview
                    ? `linear-gradient(to top, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.3) 50%, rgba(0, 0, 0, 0) 100%), url(${imagePreview})`
                    : "linear-gradient(135deg, #171717 0%, #35302D 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-wrap items-center justify-end gap-2 mb-2.5">
                  {hasFlashSale && (
                    <span className="text-xs font-bold text-white bg-[#D94520] px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1 shadow-xs">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Flash Sale Eksklusif</span>
                    </span>
                  )}
                  <span className="text-xs font-medium text-white/90 capitalize bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/20">
                    {category}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mt-3">
                  {eventName || "Curated Event Title"}
                </h3>
                <p className="text-xs text-stone-300 font-medium mt-1">
                  Verified Host Organization
                </p>

                <div className="grid grid-cols-1 gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
                  <div className="flex items-center gap-2 text-stone-200 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#D94520] shrink-0" />
                    <span>{eventDateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-200 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span className="truncate">
                      {venueLocation || "Venue location, City"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#736E65]">
                    <span className="font-semibold text-[#171717]">
                      Ticket Tiers
                    </span>
                    <span>{categories.length} Tiers Available</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {categories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-black/[0.06] bg-[#F0EDE4] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#171717]">
                            {cat.name || `Tier #${idx + 1}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white text-[#736E65]">
                            {cat.quota || 0} passes
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-[#171717] font-mono">
                          Rp {(Number(cat.price) || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D94520] text-white font-semibold hover:bg-[#BF3B19] transition shadow-xs cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Event...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Publish Event to Marketplace</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
