import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  PendingFormControls,
  PendingSubmitButton,
} from "@/components/forms/PendingForm";
import {
  courseService,
  enrollmentService,
  paymentAccountService,
  paymentService,
  profileService,
} from "@/services";
import {
  applyPromotionCodeAction,
  submitZeroPaymentAction,
  uploadPaymentProofAction,
} from "./actions";

interface StudentPaymentPageProps {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMessage(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: "Menunggu Pembayaran",
    pending_approval: "Menunggu Persetujuan Admin",
    active: "Aktif",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };
  return labels[status] ?? status;
}

function getPaymentStatusLabel(status: string | null): string {
  if (!status) return "Belum Ada Pembayaran";
  const labels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Sudah Dibayar",
    rejected: "Pembayaran Ditolak",
  };
  return labels[status] ?? status;
}

export default async function StudentPaymentPage({
  params,
  searchParams,
}: StudentPaymentPageProps) {
  const { enrollmentId } = await params;
  const query = await searchParams;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const [enrollment, payment] = await Promise.all([
    enrollmentService.getEnrollmentById(enrollmentId),
    paymentService.getPaymentByEnrollment(enrollmentId),
  ]);

  if (!enrollment || enrollment.profile_id !== profile.id) notFound();

  const course = await courseService.getCourseById(enrollment.course_id);
  if (!course) notFound();

  const totalPayment = Math.max(
    enrollment.price_snapshot - enrollment.discount_amount,
    0,
  );
  const paymentLocked =
    payment?.status === "pending" || payment?.status === "approved";
  const canSubmitPayment =
    !paymentLocked &&
    (enrollment.payment_timing === "deferred"
      ? enrollment.status === "active"
      : enrollment.status === "pending_payment");
  const paymentAccount =
    canSubmitPayment && totalPayment > 0
      ? await paymentAccountService.getAccountForCourse(course.id)
      : null;

  if (canSubmitPayment && totalPayment > 0 && !paymentAccount) {
    throw new Error("Rekening pembayaran course belum tersedia.");
  }

  const isDeferred = enrollment.payment_timing === "deferred";
  const backHref =
    enrollment.status === "active"
      ? `/dashboard/student/my-course/${course.id}`
      : `/dashboard/student/course/${course.id}`;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href={backHref}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← {enrollment.status === "active" ? "Kembali ke course" : "Kembali ke detail blok"}
      </Link>

      <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="border-b border-slate-100 pb-6">
          <p className="text-sm font-bold text-blue-600">Pembayaran Course</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {course.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isDeferred
              ? "Course tetap dapat diakses selama proses pembayaran di akhir dan verifikasi Admin."
              : "Gunakan kode promosi bila tersedia, lalu selesaikan pembayaran sesuai total akhir."}
          </p>
        </div>

        {getMessage(query.error) && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {getMessage(query.error)}
          </div>
        )}
        {getMessage(query.success) && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {getMessage(query.success)}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              Kategori Pembayaran
            </p>
            <p className="mt-2 font-black text-blue-950">
              {isDeferred ? "Bayar di Akhir" : "Bayar di Awal"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Status Pembayaran
            </p>
            <p className="mt-2 font-black text-slate-950">
              {getPaymentStatusLabel(payment?.status ?? null)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-500">Status enrollment</p>
          <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
            {getStatusLabel(enrollment.status)}
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Harga blok</span>
            <span className="font-bold text-slate-900">
              {formatRupiah(enrollment.price_snapshot)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Potongan</span>
            <span className="font-bold text-emerald-700">
              -{formatRupiah(enrollment.discount_amount)}
            </span>
          </div>
          {enrollment.promotion_code_snapshot && (
            <div className="mt-3 flex items-start justify-between gap-4 border-t border-slate-200 pt-3 text-sm">
              <span className="text-slate-500">Promosi diterapkan</span>
              <span className="text-right font-bold text-blue-700">
                {enrollment.promotion_name_snapshot ?? "Promosi"}
                <span className="block font-mono text-xs uppercase text-blue-500">
                  {enrollment.promotion_code_snapshot}
                </span>
              </span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <span className="font-black text-slate-950">Total pembayaran</span>
            <span className="text-xl font-black text-blue-600">
              {formatRupiah(totalPayment)}
            </span>
          </div>
        </div>

        {payment?.status === "rejected" && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-black text-red-950">Pembayaran ditolak</h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              {payment.notes || "Silakan periksa bukti pembayaran dan kirim ulang."}
            </p>
          </div>
        )}

        {canSubmitPayment && (
          <form
            action={applyPromotionCodeAction.bind(null, enrollment.id)}
            className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5"
          >
            <PendingFormControls pendingMessage="Kode promosi sedang diperiksa. Mohon tunggu.">
              <h2 className="font-black text-violet-950">Punya kode promosi?</h2>
              <p className="mt-1 text-sm leading-6 text-violet-700">
                Masukkan kode sebelum mengirim bukti pembayaran.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  name="promotionCode"
                  required
                  autoComplete="off"
                  placeholder="Masukkan kode promosi"
                  className="min-h-11 flex-1 rounded-xl border border-violet-200 bg-white px-4 py-2 font-mono text-sm uppercase outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <PendingSubmitButton
                  pendingLabel="Memeriksa voucher..."
                  className="min-h-11 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-80"
                >
                  Terapkan Kode
                </PendingSubmitButton>
              </div>
            </PendingFormControls>
          </form>
        )}

        {canSubmitPayment && totalPayment > 0 && paymentAccount && (
          <>
            <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Rekening Pembayaran · {paymentAccount.label}
              </p>
              <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">{paymentAccount.bank_name}</p>
                <p className="mt-2 break-all font-mono text-xl font-black tracking-wider text-slate-950 sm:text-2xl">
                  {paymentAccount.account_number.replace(/(.{4})/g, "$1 ").trim()}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  a.n. {paymentAccount.account_holder_name}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-blue-700">
                Transfer tepat sebesar <strong>{formatRupiah(totalPayment)}</strong>.
              </p>
            </div>

            <form
              action={uploadPaymentProofAction.bind(null, enrollment.id)}
              className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5"
            >
              <PendingFormControls pendingMessage="Bukti pembayaran sedang diunggah dan dikirim. Mohon tunggu.">
                <h2 className="font-black text-blue-950">Upload bukti pembayaran</h2>
                <p className="mt-2 text-sm leading-6 text-blue-700">
                  Format JPG, PNG, WEBP, atau PDF. Ukuran maksimal 5 MB.
                </p>
                <input
                  type="file"
                  name="paymentProof"
                  required
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  className="mt-4 block w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                />
                <PendingSubmitButton
                  pendingLabel="Mengirim bukti..."
                  className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700 disabled:opacity-80"
                >
                  Kirim Bukti Pembayaran
                </PendingSubmitButton>
              </PendingFormControls>
            </form>
          </>
        )}

        {canSubmitPayment && totalPayment === 0 && (
          <form
            action={submitZeroPaymentAction.bind(null, enrollment.id)}
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <PendingFormControls pendingMessage="Pembayaran Rp0 sedang dikirim. Mohon tunggu.">
              <h2 className="font-black text-emerald-950">Tidak perlu transfer</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-700">
                Total pembayaran Anda Rp0. Kirim data ini untuk diperiksa Admin.
              </p>
              <PendingSubmitButton
                pendingLabel="Mengirim pembayaran..."
                className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-80"
              >
                Kirim Pembayaran Rp0
              </PendingSubmitButton>
            </PendingFormControls>
          </form>
        )}

        {payment?.status === "pending" && (
          <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="font-black text-yellow-950">Pembayaran sedang diperiksa</h2>
            <p className="mt-2 text-sm leading-6 text-yellow-700">
              Bukti pembayaran sudah diterima dan menunggu verifikasi Admin.
              {isDeferred && " Akses course tetap aktif."}
            </p>
          </div>
        )}

        {payment?.status === "approved" && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
            <h2 className="font-black text-green-950">Pembayaran disetujui</h2>
            <p className="mt-2 text-sm leading-6 text-green-700">
              Pembayaran telah diverifikasi oleh Admin.
            </p>
          </div>
        )}

        {!payment && enrollment.status === "pending_approval" && (
          <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="font-black text-yellow-950">Pendaftaran sedang diperiksa</h2>
            <p className="mt-2 text-sm leading-6 text-yellow-700">
              Silakan tunggu persetujuan Admin sebelum melanjutkan.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
