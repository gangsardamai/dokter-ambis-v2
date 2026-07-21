import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

import {
  uploadPaymentProofAction,
} from "./actions";

interface StudentPaymentPageProps {
  params: Promise<{
    enrollmentId: string;
  }>;

  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
}

function formatRupiah(
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

function getMessage(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getStatusLabel(
  status: string,
): string {
  switch (status) {
    case "pending_payment":
      return "Menunggu Pembayaran";

    case "pending_approval":
      return "Menunggu Persetujuan Admin";

    case "active":
      return "Aktif";

    case "expired":
      return "Kedaluwarsa";

    case "cancelled":
      return "Dibatalkan";

    default:
      return status;
  }
}

export default async function StudentPaymentPage({
  params,
  searchParams,
}: StudentPaymentPageProps) {
  const { enrollmentId } =
    await params;

  const query =
    await searchParams;

  const errorMessage =
    getMessage(query.error);

  const successMessage =
    getMessage(query.success);

  const profile =
    await profileService
      .getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const enrollment =
    await enrollmentService
      .getEnrollmentById(
        enrollmentId,
      );

  if (
    !enrollment ||
    enrollment.profile_id !== profile.id
  ) {
    notFound();
  }

  const course =
    await courseService.getCourseById(
      enrollment.course_id,
    );

  if (!course) {
    notFound();
  }

  const totalPayment =
    Math.max(
      enrollment.price_snapshot -
        enrollment.discount_amount,
      0,
    );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link
        href={`/dashboard/student/course/${course.id}`}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Kembali ke detail blok
      </Link>

      <div className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="border-b pb-6">
          <p className="text-sm font-medium text-blue-600">
            Pendaftaran Blok
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Pembayaran
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Selesaikan pembayaran untuk melanjutkan proses pendaftaran.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500">
              Blok pembelajaran
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-900">
              {course.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status pendaftaran
            </p>

            <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              {getStatusLabel(
                enrollment.status,
              )}
            </span>
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Harga blok
              </span>

              <span className="font-medium text-gray-900">
                {formatRupiah(
                  enrollment.price_snapshot,
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Potongan
              </span>

              <span className="font-medium text-gray-900">
                {formatRupiah(
                  enrollment.discount_amount,
                )}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-semibold text-gray-900">
                Total pembayaran
              </span>

              <span className="text-xl font-bold text-blue-600">
                {formatRupiah(
                  totalPayment,
                )}
              </span>
            </div>
          </div>

          {enrollment.status ===
            "pending_payment" && (
            <form
              action={uploadPaymentProofAction.bind(
                null,
                enrollment.id,
              )}
              className="rounded-xl border border-blue-200 bg-blue-50 p-5"
            >
              <h2 className="font-semibold text-blue-900">
                Upload bukti pembayaran
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                Format JPG, PNG, WEBP, atau PDF. Ukuran maksimal 5 MB.
              </p>

              <input
                type="file"
                name="paymentProof"
                required
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                className="mt-4 block w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
              />

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Kirim Bukti Pembayaran
              </button>
            </form>
          )}

          {enrollment.status ===
            "pending_approval" && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <h2 className="font-semibold text-yellow-900">
                Pembayaran sedang diperiksa
              </h2>

              <p className="mt-2 text-sm leading-6 text-yellow-700">
                Bukti pembayaran sudah diterima dan sedang menunggu pemeriksaan administrator.
              </p>
            </div>
          )}

          {enrollment.status ===
            "active" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <h2 className="font-semibold text-green-900">
                Pendaftaran telah aktif
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-700">
                Pembayaran telah disetujui. Anda sudah memiliki akses ke blok ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}