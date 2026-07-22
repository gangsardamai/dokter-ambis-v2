import Link from "next/link";
import type { ReactNode } from "react";

import type { Database } from "@/supabase/types/database.types";

import { PageHeader } from "@/components/admin";
import { BulkApprovalButtons } from "@/components/admin/enrollment/BulkApprovalButtons";

import { enrollmentService } from "@/services";

type EnrollmentStatus =
  Database["public"]["Enums"]["enrollment_status"];

type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

interface EnrollmentPageProps {
  searchParams: Promise<SearchParams>;
}

const enrollmentStatuses: EnrollmentStatus[] = [
  "pending_payment",
  "pending_approval",
  "active",
  "expired",
  "cancelled",
];

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "approved",
  "rejected",
];

function getStringParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isEnrollmentStatus(
  value: string,
): value is EnrollmentStatus {
  return enrollmentStatuses.includes(
    value as EnrollmentStatus,
  );
}

function isPaymentStatus(
  value: string,
): value is PaymentStatus {
  return paymentStatuses.includes(
    value as PaymentStatus,
  );
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function getStatusLabel(
  status: EnrollmentStatus,
): string {
  const labels: Record<EnrollmentStatus, string> = {
    pending_payment: "Menunggu Pembayaran",
    pending_approval: "Menunggu Verifikasi",
    active: "Aktif",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };

  return labels[status];
}

function getStatusClassName(
  status: EnrollmentStatus,
): string {
  const classNames: Record<EnrollmentStatus, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    pending_approval: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return classNames[status];
}

function getCategoryLabel(
  category: EnrollmentCategory,
): string {
  const labels: Record<EnrollmentCategory, string> = {
    regular: "Reguler",
    separated: "Terpisah",
  };

  return labels[category];
}

function getPaymentStatusLabel(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return "Belum ada pembayaran";
  }

  const labels: Record<PaymentStatus, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[status];
}

function getPaymentStatusClassName(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return "bg-gray-100 text-gray-700";
  }

  const classNames: Record<PaymentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return classNames[status];
}

function StudentIcon() {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function StatusPill({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

export default async function EnrollmentPage({
  searchParams,
}: EnrollmentPageProps) {
  const params = await searchParams;

  const searchQuery = getStringParam(params.q)
    .trim()
    .toLowerCase();

  const enrollmentStatusParam = getStringParam(
    params.enrollmentStatus,
  );

  const paymentStatusParam = getStringParam(
    params.paymentStatus,
  );

  const selectedEnrollmentStatus = isEnrollmentStatus(
    enrollmentStatusParam,
  )
    ? enrollmentStatusParam
    : "all";

  const selectedPaymentStatus =
    isPaymentStatus(paymentStatusParam) ||
    paymentStatusParam === "none"
      ? paymentStatusParam
      : "all";

  const enrollments = await enrollmentService.getEnrollments();

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const profile = enrollment.profiles;
    const course = enrollment.courses;
    const organization = course?.organizations;
    const program = course?.programs;
    const payment = enrollment.payments;

    const searchableText = [
      profile?.full_name,
      profile?.phone,
      course?.title,
      course?.slug,
      organization?.title,
      program?.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      searchQuery.length === 0 ||
      searchableText.includes(searchQuery);

    const matchesEnrollmentStatus =
      selectedEnrollmentStatus === "all" ||
      enrollment.status === selectedEnrollmentStatus;

    const matchesPaymentStatus =
      selectedPaymentStatus === "all" ||
      (selectedPaymentStatus === "none" && !payment) ||
      (selectedPaymentStatus !== "none" &&
        payment?.status === selectedPaymentStatus);

    return (
      matchesSearch &&
      matchesEnrollmentStatus &&
      matchesPaymentStatus
    );
  });

  const hasActiveFilter =
    searchQuery.length > 0 ||
    selectedEnrollmentStatus !== "all" ||
    selectedPaymentStatus !== "all";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Enrollment"
        description="Kelola pendaftaran mahasiswa ke course."
        actions={<BulkApprovalButtons />}
      />

      <form
        method="GET"
        className="rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1769cf]">
            <FilterIcon />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
              Filter Enrollment
            </h2>
            <p className="text-sm text-slate-500">
              Cari berdasarkan mahasiswa, course, universitas, atau program.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label
              htmlFor="q"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Pencarian
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={getStringParam(params.q)}
              placeholder="Cari nama, nomor telepon, course, universitas..."
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="enrollmentStatus"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Status Enrollment
            </label>
            <select
              id="enrollmentStatus"
              name="enrollmentStatus"
              defaultValue={selectedEnrollmentStatus}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Semua status</option>
              <option value="pending_payment">Menunggu pembayaran</option>
              <option value="pending_approval">Menunggu verifikasi</option>
              <option value="active">Aktif</option>
              <option value="expired">Kedaluwarsa</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="paymentStatus"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Status Pembayaran
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              defaultValue={selectedPaymentStatus}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Semua pembayaran</option>
              <option value="none">Belum ada pembayaran</option>
              <option value="pending">Menunggu verifikasi</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
          >
            Terapkan
          </button>

          {hasActiveFilter && (
            <Link
              href="/dashboard/admin/enrollment"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
            >
              Reset
            </Link>
          )}

          <p className="text-sm text-slate-500 sm:ml-auto">
            Menampilkan <span className="font-bold text-[#061827]">{filteredEnrollments.length}</span> dari <span className="font-bold text-[#061827]">{enrollments.length}</span> enrollment
          </p>
        </div>
      </form>

      {filteredEnrollments.length === 0 ? (
        <div className="rounded-3xl border border-blue-100/80 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-[#061827]">
            Tidak ada enrollment yang ditemukan.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Coba ubah kata pencarian atau filter.
          </p>
          {hasActiveFilter && (
            <Link
              href="/dashboard/admin/enrollment"
              className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Hapus semua filter
            </Link>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {filteredEnrollments.map((enrollment) => {
            const profile = enrollment.profiles;
            const course = enrollment.courses;
            const organization = course?.organizations;
            const program = course?.programs;
            const payment = enrollment.payments;

            return (
              <article
                key={enrollment.id}
                className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus-within:ring-2 focus-within:ring-blue-200"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
                    <StudentIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                      {profile?.full_name ?? "Profil tidak ditemukan"}
                    </h2>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                      {profile?.phone ?? "Nomor WhatsApp belum tersedia"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {formatDate(enrollment.enrolled_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4 rounded-2xl bg-slate-50/80 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Course</p>
                    <p className="mt-1 break-words text-sm font-extrabold text-[#061827]">
                      {course?.title ?? "Course tidak ditemukan"}
                    </p>
                    {course?.slug && (
                      <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                        {course.slug}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Universitas</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700">{organization?.title ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Program</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700">{program?.title ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Harga Snapshot</p>
                      <p className="mt-1 text-sm font-extrabold text-[#061827]">{formatCurrency(enrollment.price_snapshot)}</p>
                      {enrollment.discount_amount > 0 && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          Diskon {formatCurrency(enrollment.discount_amount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Kategori</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{getCategoryLabel(enrollment.category)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusPill className={getPaymentStatusClassName(payment?.status ?? null)}>
                    Pembayaran: {getPaymentStatusLabel(payment?.status ?? null)}
                  </StatusPill>
                  <StatusPill className={getStatusClassName(enrollment.status)}>
                    Enrollment: {getStatusLabel(enrollment.status)}
                  </StatusPill>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/admin/enrollment/${enrollment.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
