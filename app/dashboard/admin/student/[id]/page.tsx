import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { adminStudentService } from "@/services";
import type { Database } from "@/supabase/types/database.types";

type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
type EnrollmentCategory = Database["public"]["Enums"]["enrollment_category"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

interface AdminStudentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getWhatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }

  return `https://wa.me/${digits}`;
}

function getEnrollmentStatusLabel(status: EnrollmentStatus): string {
  const labels: Record<EnrollmentStatus, string> = {
    pending_payment: "Menunggu Pembayaran",
    pending_approval: "Menunggu Verifikasi",
    active: "Aktif",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };

  return labels[status];
}

function getEnrollmentStatusClassName(status: EnrollmentStatus): string {
  const classNames: Record<EnrollmentStatus, string> = {
    pending_payment: "bg-amber-100 text-amber-700",
    pending_approval: "bg-blue-100 text-blue-700",
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-100 text-red-700",
  };

  return classNames[status];
}

function getCategoryLabel(category: EnrollmentCategory): string {
  const labels: Record<EnrollmentCategory, string> = {
    regular: "Reguler",
    separated: "Terpisah",
  };

  return labels[category];
}

function getPaymentStatusLabel(status: PaymentStatus | null): string {
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

function getPaymentStatusClassName(status: PaymentStatus | null): string {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function WhatsappIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" />
      <path d="M9 8.5c.4 2.8 1.8 4.2 4.5 5" />
    </svg>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
      <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words text-sm font-bold text-slate-700">
        {value}
      </dd>
    </div>
  );
}

export default async function AdminStudentDetailPage({
  params,
}: AdminStudentDetailPageProps) {
  const { id } = await params;
  const detail = await adminStudentService.getDetail(id);

  if (!detail) {
    notFound();
  }

  const { student, enrollments } = detail;
  const whatsappHref = getWhatsappHref(student.phone);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Detail Mahasiswa"
        description="Profil mahasiswa dan status enrollment pada setiap course."
        actions={(
          <Link
            href="/dashboard/admin/student"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-bold text-[#1769cf] shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            ← Kembali ke Mahasiswa
          </Link>
        )}
      />

      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white sm:p-8">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              Profil Mahasiswa
            </p>
            <h1 className="mt-3 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {student.full_name}
            </h1>
            <p className="mt-2 break-words text-sm font-semibold text-blue-100 sm:text-base">
              {student.university_origin || "Asal universitas belum diisi"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <DetailField label="Nomor WhatsApp" value={student.phone} />
          <DetailField
            label="Status Akun"
            value={
              <span className="capitalize">
                {student.status === "active"
                  ? "Aktif"
                  : student.status === "inactive"
                    ? "Tidak Aktif"
                    : "Ditangguhkan"}
              </span>
            }
          />
          <DetailField
            label="Tanggal Bergabung"
            value={formatDate(student.created_at)}
          />
          <DetailField
            label="Jumlah Course"
            value={`${enrollments.length} enrollment`}
          />
        </div>

        {whatsappHref && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-auto"
            >
              <WhatsappIcon />
              Hubungi melalui WhatsApp
            </a>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">
              Riwayat Course
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#061827]">
              Enrollment Mahasiswa
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Semua status enrollment ditampilkan.
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-[#061827]">
              Mahasiswa belum pernah mendaftar course.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const course = enrollment.courses;
              const paymentStatus = enrollment.payments?.status ?? null;
              const finalPrice =
                enrollment.price_snapshot - enrollment.discount_amount;

              return (
                <article
                  key={enrollment.id}
                  className="rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getEnrollmentStatusClassName(enrollment.status)}`}
                        >
                          {getEnrollmentStatusLabel(enrollment.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {getCategoryLabel(enrollment.category)}
                        </span>
                      </div>

                      <h3 className="mt-4 break-words text-xl font-black tracking-[-0.03em] text-[#061827]">
                        {course?.title ?? "Course tidak tersedia"}
                      </h3>
                      <p className="mt-1 break-words text-sm font-bold text-blue-700">
                        {course?.organizations?.title ?? "Universitas tidak tersedia"}
                        {course?.organizations?.short_name
                          ? ` · ${course.organizations.short_name}`
                          : ""}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/admin/enrollment/${enrollment.id}`}
                      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black text-[#1769cf] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 lg:w-auto"
                    >
                      Buka Enrollment
                    </Link>
                  </div>

                  <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField
                      label="Tanggal Daftar"
                      value={formatDate(enrollment.enrolled_at)}
                    />
                    <DetailField
                      label="Tanggal Aktif"
                      value={formatDate(enrollment.activated_at)}
                    />
                    <DetailField
                      label="Nilai Enrollment"
                      value={formatCurrency(finalPrice)}
                    />
                    <DetailField
                      label="Status Pembayaran"
                      value={
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${getPaymentStatusClassName(paymentStatus)}`}
                        >
                          {getPaymentStatusLabel(paymentStatus)}
                        </span>
                      }
                    />
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
