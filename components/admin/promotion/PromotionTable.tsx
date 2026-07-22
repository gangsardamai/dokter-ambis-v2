import Link from "next/link";

import { EmptyState } from "@/components/admin";
import { deletePromotionAction } from "@/app/dashboard/admin/promotion/actions";

import PromotionStatusBadge from "./PromotionStatusBadge";

import type { Database } from "@/supabase/types/database.types";

type Promotion =
  Database["public"]["Tables"]["promotions"]["Row"];

type PromotionType =
  Database["public"]["Enums"]["promotion_type"];

interface PromotionTableProps {
  promotions: Promotion[];
}

function VoucherIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
      <path d="M13 5v14" />
      <path d="M8 12h.01" />
      <path d="M17 12h.01" />
    </svg>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTypeLabel(type: PromotionType) {
  const labels: Record<PromotionType, string> = {
    percentage: "Persentase",
    fixed_amount: "Nominal Tetap",
    special_price: "Harga Spesial",
    free: "Gratis",
  };

  return labels[type];
}

function formatPromotionValue(promotion: Promotion) {
  if (promotion.type === "percentage") {
    return `${promotion.value}%`;
  }

  if (promotion.type === "free") {
    return "Gratis";
  }

  if (promotion.type === "special_price") {
    return formatCurrency(
      promotion.special_price ?? promotion.value,
    );
  }

  return formatCurrency(promotion.value);
}

export default function PromotionTable({
  promotions,
}: PromotionTableProps) {
  if (promotions.length === 0) {
    return (
      <EmptyState
        title="Belum ada Promosi"
        description="Silakan tambahkan promosi baru."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {promotions.map((promotion) => (
        <article
          key={promotion.id}
          className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus-within:ring-2 focus-within:ring-blue-200"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
              <VoucherIcon />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                {promotion.name}
              </h2>
              <p className="mt-2 break-all rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1769cf]">
                {promotion.code ?? "Tanpa kode voucher"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Jenis
              </p>
              <p className="text-sm font-bold text-slate-700">
                {getTypeLabel(promotion.type)}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Nilai
              </p>
              <p className="text-sm font-extrabold text-[#061827]">
                {formatPromotionValue(promotion)}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Status
              </p>
              <PromotionStatusBadge status={promotion.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mulai</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(promotion.start_at)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Berakhir</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(promotion.end_at)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Kuota
              </p>
              <p className="text-sm font-bold text-slate-700">
                {promotion.quota ?? "Tanpa kuota"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/admin/promotion/${promotion.id}/edit`}
              className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Edit
            </Link>

            <form
              action={async () => {
                "use server";

                await deletePromotionAction(promotion.id);
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                Hapus
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
