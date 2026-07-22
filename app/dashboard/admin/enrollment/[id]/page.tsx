import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { EnrollmentActionButtons } from "@/components/admin/enrollment/EnrollmentActionButtons";
import {
  enrollmentService,
  paymentProofService,
} from "@/services";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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

function CardIcon({
  type,
}: {
  type: "student" | "course";
}) {
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
      {type === "student" ? (
        <>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </>
      ) : (
        <>
          <path d="M12 3 4 7l8 4 8-4-8-4Z" />
          <path d="m4 11 8 4 8-4" />
          <path d="m4 15 8 4 8-4" />
        </>
      )}
    </svg>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "red" | "yellow" | "blue" | "gray";
}) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${colors[tone]}`}>
      {children}
    </span>
  );
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        {icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
            {icon}
          </div>
        )}
        <h2 className="break-words text-xl font-extrabold tracking-[-0.04em] text-[#061827]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-700">
        {children}
      </dd>
    </div>
  );
}

function getEnrollmentTone(status: string) {
  if (status === "active") return "green";
  if (status === "cancelled") return "red";
  if (status === "pending_approval") return "blue";
  if (status === "pending_payment") return "yellow";
  return "gray";
}

function getPaymentTone(status: string) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "yellow";
}

export default async function EnrollmentDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const enrollment = await enrollmentService.getEnrollmentDetail(id);

  if (!enrollment) {
    notFound();
  }

  const payment = enrollment.payments ?? null;

  let paymentProofUrl: string | null = null;
  let paymentProofError: string | null = null;

  if (payment?.payment_proof_path) {
    try {
      paymentProofUrl = await paymentProofService.getPaymentProofSignedUrl(
        payment.payment_proof_path,
      );
    } catch (error) {
      paymentProofError =
        error instanceof Error
          ? error.message
          : "Bukti pembayaran tidak dapat dibuka.";
    }
  }

  const paymentProofIsPdf =
    payment?.payment_proof_path?.toLowerCase().endsWith(".pdf") ?? false;

  const finalPrice = enrollment.price_snapshot - enrollment.discount_amount;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Detail Enrollment"
        description="Informasi mahasiswa, course, dan pembayaran."
        actions={(
          <Link
            href="/dashboard/admin/enrollment"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-bold text-[#1769cf] shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali
          </Link>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard
          title="Mahasiswa"
          icon={<CardIcon type="student" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama">
              {enrollment.profiles?.full_name ?? "-"}
            </Field>
            <Field label="Nomor telepon">
              {enrollment.profiles?.phone ?? "-"}
            </Field>
            <Field label="Role">
              <span className="capitalize">{enrollment.profiles?.role ?? "-"}</span>
            </Field>
            <Field label="Status akun">
              <span className="capitalize">{enrollment.profiles?.status ?? "-"}</span>
            </Field>
          </dl>
        </DetailCard>

        <DetailCard
          title="Course"
          icon={<CardIcon type="course" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Program">
              {enrollment.courses?.programs?.title ?? "-"}
            </Field>
            <Field label="Universitas">
              {enrollment.courses?.organizations?.title ?? "-"}
            </Field>
            <Field label="Course">
              {enrollment.courses?.title ?? "-"}
            </Field>
            <Field label="Slug">
              <span className="break-all">{enrollment.courses?.slug ?? "-"}</span>
            </Field>
            <Field label="Harga course saat ini">
              {formatCurrency(enrollment.courses?.price ?? 0)}
            </Field>
          </dl>
        </DetailCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard title="Enrollment">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Harga snapshot">{formatCurrency(enrollment.price_snapshot)}</Field>
            <Field label="Diskon">{formatCurrency(enrollment.discount_amount)}</Field>
            <Field label="Total pembayaran">{formatCurrency(finalPrice)}</Field>
            <Field label="Kategori"><span className="capitalize">{enrollment.category}</span></Field>
            <Field label="Status">
              <StatusBadge tone={getEnrollmentTone(enrollment.status)}>
                {enrollment.status}
              </StatusBadge>
            </Field>
            <Field label="Tanggal daftar">{formatDate(enrollment.enrolled_at)}</Field>
            <Field label="Tanggal aktif">{formatDate(enrollment.activated_at)}</Field>
            <Field label="Kedaluwarsa">{formatDate(enrollment.expired_at)}</Field>
            <Field label="Promo">{enrollment.promotion_name_snapshot ?? "-"}</Field>
          </dl>
        </DetailCard>

        <DetailCard title="Pembayaran">
          {!payment ? (
            <p className="break-words text-sm font-semibold text-slate-500">
              Belum ada pembayaran untuk enrollment ini.
            </p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nominal">{formatCurrency(payment.amount)}</Field>
              <Field label="Metode"><span className="break-words">{payment.payment_method}</span></Field>
              <Field label="Status">
                <StatusBadge tone={getPaymentTone(payment.status)}>
                  {payment.status}
                </StatusBadge>
              </Field>
              <Field label="Dibayar">{formatDate(payment.paid_at)}</Field>
              <Field label="Diverifikasi">{formatDate(payment.verified_at)}</Field>
              <Field label="Catatan">{payment.notes ?? "-"}</Field>
            </dl>
          )}
        </DetailCard>
      </div>

      {payment?.payment_proof_path && (
        <DetailCard title="Bukti Pembayaran">
          {paymentProofError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {paymentProofError}
            </div>
          )}

          {paymentProofUrl && (
            <div className="min-w-0 space-y-4">
              {paymentProofIsPdf ? (
                <iframe
                  src={paymentProofUrl}
                  title="Bukti pembayaran"
                  className="h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-50 sm:h-[560px] lg:h-[680px]"
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  {/* Bukti pembayaran berasal dari URL dinamis Supabase. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentProofUrl}
                    alt="Bukti pembayaran peserta"
                    className="mx-auto h-auto max-h-[600px] max-w-full rounded-xl object-contain"
                  />
                </div>
              )}

              <a
                href={paymentProofUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
              >
                Buka Bukti di Tab Baru
              </a>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-500">
              Lihat path file
            </summary>
            <p className="mt-2 break-all rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              {payment.payment_proof_path}
            </p>
          </details>
        </DetailCard>
      )}

      <EnrollmentActionButtons
        enrollmentId={enrollment.id}
        enrollmentStatus={enrollment.status}
        enrollmentCategory={enrollment.category}
        paymentId={payment?.id ?? null}
        paymentStatus={payment?.status ?? null}
      />
    </main>
  );
}
