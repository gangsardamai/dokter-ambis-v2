import Link from "next/link";
import type { ReactNode } from "react";

import type { Database } from "@/supabase/types/database.extended.types";
import { PageHeader } from "@/components/admin";
import { BulkApprovalButtons } from "@/components/admin/enrollment/BulkApprovalButtons";
import { enrollmentListRepository } from "@/repositories/enrollment-list.repository";
import { courseService, programService } from "@/services";

type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type PaymentTiming = Database["public"]["Enums"]["payment_timing"];
type SearchParams = Record<string, string | string[] | undefined>;
type EnrollmentSort = "date_desc" | "date_asc" | "name_asc" | "name_desc";

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
const paymentStatuses: PaymentStatus[] = ["pending", "approved", "rejected"];
const paymentTimings: PaymentTiming[] = ["upfront", "deferred"];
const enrollmentSorts: EnrollmentSort[] = [
  "date_desc",
  "date_asc",
  "name_asc",
  "name_desc",
];

function getStringParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function getPageParam(value: string | string[] | undefined): number {
  const page = Number.parseInt(getStringParam(value), 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildPageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item);
      }
    } else if (value) {
      query.set(key, value);
    }
  }

  if (page > 1) query.set("page", String(page));

  const queryString = query.toString();
  return `/dashboard/admin/enrollment${queryString ? `?${queryString}` : ""}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`;
}

function getStatusLabel(status: EnrollmentStatus): string {
  const labels: Record<EnrollmentStatus, string> = {
    pending_payment: "Menunggu Pembayaran",
    pending_approval: "Menunggu Persetujuan",
    active: "Aktif",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };
  return labels[status];
}

function getStatusClassName(status: EnrollmentStatus): string {
  const classes: Record<EnrollmentStatus, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    pending_approval: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return classes[status];
}

function getPaymentStatusLabel(status: PaymentStatus | null): string {
  if (!status) return "Belum Ada Pembayaran";
  const labels: Record<PaymentStatus, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return labels[status];
}

function getPaymentStatusClassName(status: PaymentStatus | null): string {
  if (!status) return "bg-gray-100 text-gray-700";
  const classes: Record<PaymentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return classes[status];
}

function getPaymentTimingLabel(timing: PaymentTiming): string {
  return timing === "deferred" ? "Bayar di Akhir" : "Bayar di Awal";
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

  const searchQuery = getStringParam(params.q).trim();
  const enrollmentStatusValue = getStringParam(params.enrollmentStatus);
  const paymentStatusValue = getStringParam(params.paymentStatus);
  const paymentTimingValue = getStringParam(params.paymentTiming);
  const selectedCourseId = getStringParam(params.courseId);
  const selectedProgramId = getStringParam(params.programId);
  const sortValue = getStringParam(params.sort);
  const selectedSort = enrollmentSorts.includes(sortValue as EnrollmentSort)
    ? (sortValue as EnrollmentSort)
    : "date_desc";
  const selectedPage = getPageParam(params.page);

  const selectedEnrollmentStatus = enrollmentStatuses.includes(
    enrollmentStatusValue as EnrollmentStatus,
  )
    ? (enrollmentStatusValue as EnrollmentStatus)
    : "all";
  const selectedPaymentStatus =
    paymentStatuses.includes(paymentStatusValue as PaymentStatus) ||
    paymentStatusValue === "none"
      ? paymentStatusValue
      : "all";
  const selectedPaymentTiming = paymentTimings.includes(
    paymentTimingValue as PaymentTiming,
  )
    ? (paymentTimingValue as PaymentTiming)
    : "all";

  const [enrollmentResult, courses, programs] = await Promise.all([
    enrollmentListRepository.getList({
      q: searchQuery || undefined,
      enrollmentStatus:
        selectedEnrollmentStatus === "all"
          ? undefined
          : selectedEnrollmentStatus,
      paymentStatus:
        selectedPaymentStatus === "all"
          ? undefined
          : (selectedPaymentStatus as PaymentStatus | "none"),
      paymentTiming:
        selectedPaymentTiming === "all" ? undefined : selectedPaymentTiming,
      courseId: selectedCourseId || undefined,
      programId: selectedProgramId || undefined,
      sort: selectedSort,
      page: selectedPage,
    }),
    courseService.getCourses(),
    programService.getPrograms(),
  ]);

  const enrollments = enrollmentResult.data;
  const totalEnrollments = enrollmentResult.total;
  const currentPage = enrollmentResult.page;
  const perPage = enrollmentResult.perPage;
  const totalPages = Math.max(1, Math.ceil(totalEnrollments / perPage));
  const firstShown = totalEnrollments === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const lastShown = Math.min(currentPage * perPage, totalEnrollments);

  const courseOptions = courses
    .map((course) => [course.id, course.title] as const)
    .sort((a, b) => a[1].localeCompare(b[1], "id"));
  const programOptions = programs
    .map((program) => [program.id, program.title] as const)
    .sort((a, b) => a[1].localeCompare(b[1], "id"));

  const hasActiveFilter =
    Boolean(searchQuery) ||
    selectedEnrollmentStatus !== "all" ||
    selectedPaymentStatus !== "all" ||
    selectedPaymentTiming !== "all" ||
    Boolean(selectedCourseId) ||
    Boolean(selectedProgramId) ||
    selectedSort !== "date_desc";

  const selectClass =
    "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Enrollment"
        description="Kelola pendaftaran mahasiswa, kategori pembayaran, dan verifikasi payment."
        actions={<BulkApprovalButtons />}
      />

      <form
        method="GET"
        className="rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5">
          <h2 className="text-lg font-extrabold text-[#061827]">Filter Enrollment</h2>
          <p className="text-sm text-slate-500">
            Filter berdasarkan pembayaran, course, program, nama, dan tanggal.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-bold text-slate-700">Pencarian</span>
            <input
              name="q"
              type="search"
              defaultValue={getStringParam(params.q)}
              placeholder="Nama, WhatsApp, course, universitas..."
              className={selectClass}
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Status Enrollment</span>
            <select
              name="enrollmentStatus"
              defaultValue={selectedEnrollmentStatus}
              className={selectClass}
            >
              <option value="all">Semua status</option>
              <option value="pending_payment">Menunggu pembayaran</option>
              <option value="pending_approval">Menunggu persetujuan</option>
              <option value="active">Aktif</option>
              <option value="expired">Kedaluwarsa</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Status Pembayaran</span>
            <select
              name="paymentStatus"
              defaultValue={selectedPaymentStatus}
              className={selectClass}
            >
              <option value="all">Semua pembayaran</option>
              <option value="none">Belum ada pembayaran</option>
              <option value="pending">Menunggu verifikasi</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Kategori Pembayaran</span>
            <select
              name="paymentTiming"
              defaultValue={selectedPaymentTiming}
              className={selectClass}
            >
              <option value="all">Semua kategori</option>
              <option value="upfront">Bayar di Awal</option>
              <option value="deferred">Bayar di Akhir</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Course</span>
            <select name="courseId" defaultValue={selectedCourseId} className={selectClass}>
              <option value="">Semua course</option>
              {courseOptions.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Program</span>
            <select name="programId" defaultValue={selectedProgramId} className={selectClass}>
              <option value="">Semua program</option>
              {programOptions.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-bold text-slate-700">Urutkan</span>
            <select name="sort" defaultValue={selectedSort} className={selectClass}>
              <option value="date_desc">Tanggal terbaru</option>
              <option value="date_asc">Tanggal terlama</option>
              <option value="name_asc">Nama A–Z</option>
              <option value="name_desc">Nama Z–A</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white"
          >
            Terapkan
          </button>
          {hasActiveFilter && (
            <Link
              href="/dashboard/admin/enrollment"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700"
            >
              Reset
            </Link>
          )}
          <p className="text-sm text-slate-500 sm:ml-auto">
            Menampilkan <strong>{firstShown}–{lastShown}</strong> dari{" "}
            <strong>{totalEnrollments}</strong> enrollment
          </p>
        </div>
      </form>

      {enrollments.length === 0 ? (
        <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-950">Tidak ada enrollment yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {enrollments.map((enrollment) => {
            const profile = enrollment.profiles;
            const course = enrollment.courses;
            const payment = enrollment.payments;

            return (
              <article
                key={enrollment.id}
                className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-extrabold text-slate-950">
                      {profile?.full_name ?? "Profil tidak ditemukan"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {profile?.phone ?? "Nomor WhatsApp belum tersedia"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {formatDate(enrollment.enrolled_at)}
                    </p>
                  </div>
                  <StatusPill className="bg-violet-100 text-violet-700">
                    {getPaymentTimingLabel(enrollment.payment_timing)}
                  </StatusPill>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Course</p>
                  <p className="mt-1 font-extrabold text-slate-950">
                    {course?.title ?? "Course tidak ditemukan"}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Universitas</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {course?.organizations?.title ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Program</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {course?.programs?.title ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Harga Snapshot</p>
                      <p className="mt-1 text-sm font-black text-blue-700">
                        {formatCurrency(enrollment.price_snapshot)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Kategori Enrollment</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {enrollment.category === "separated" ? "Terpisah" : "Reguler"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill className={getPaymentStatusClassName(payment?.status ?? null)}>
                    Pembayaran: {getPaymentStatusLabel(payment?.status ?? null)}
                  </StatusPill>
                  <StatusPill className={getStatusClassName(enrollment.status)}>
                    Enrollment: {getStatusLabel(enrollment.status)}
                  </StatusPill>
                </div>

                <Link
                  href={`/dashboard/admin/enrollment/${enrollment.id}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Lihat Detail
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination enrollment"
          className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row"
        >
          <p className="text-sm font-semibold text-slate-600">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildPageHref(params, currentPage - 1)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Sebelumnya
              </Link>
            ) : (
              <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-300">
                Sebelumnya
              </span>
            )}

            {currentPage < totalPages ? (
              <Link
                href={buildPageHref(params, currentPage + 1)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-2 text-sm font-bold text-white"
              >
                Berikutnya
              </Link>
            ) : (
              <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-300">
                Berikutnya
              </span>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
