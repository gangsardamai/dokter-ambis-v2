import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EnrollmentActionButtons,
} from "@/components/admin/enrollment/EnrollmentActionButtons"; 
import {
  enrollmentService,
  paymentProofService,
} from "@/services";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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
  value: string | null,
): string {

  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));

}

export default async function EnrollmentDetailPage({
  params,
}: PageProps) {

  const { id } = await params;

  const enrollment =
    await enrollmentService.getEnrollmentDetail(id);

  if (!enrollment) {
    notFound();
  }

    const payment =
    enrollment.payments ?? null;

  let paymentProofUrl:
    | string
    | null = null;

  let paymentProofError:
    | string
    | null = null;

  if (payment?.payment_proof_path) {
    try {
      paymentProofUrl =
        await paymentProofService
          .getPaymentProofSignedUrl(
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
    payment?.payment_proof_path
      ?.toLowerCase()
      .endsWith(".pdf") ?? false;

  const finalPrice =
    enrollment.price_snapshot -
    enrollment.discount_amount;

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Detail Enrollment
          </h1>

          <p className="mt-2 text-gray-500">
            Informasi mahasiswa, course, dan pembayaran.
          </p>

        </div>

        <Link
          href="/dashboard/admin/enrollment"
          className="text-sm text-blue-600 hover:underline"
        >
          Kembali
        </Link>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="rounded-lg border bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold">
            Mahasiswa
          </h2>

          <dl className="space-y-3 text-sm">

            <div>
              <dt className="text-gray-500">
                Nama
              </dt>
              <dd className="font-medium">
                {enrollment.profiles?.full_name ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Nomor telepon
              </dt>
              <dd className="font-medium">
                {enrollment.profiles?.phone ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Role
              </dt>
              <dd className="font-medium capitalize">
                {enrollment.profiles?.role ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Status akun
              </dt>
              <dd className="font-medium capitalize">
                {enrollment.profiles?.status ?? "-"}
              </dd>
            </div>

          </dl>

        </section>

        <section className="rounded-lg border bg-white p-6 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold">
            Course
          </h2>

          <dl className="space-y-3 text-sm">

            <div>
              <dt className="text-gray-500">
                Program
              </dt>
              <dd className="font-medium">
                {enrollment.courses?.programs?.title ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Organization
              </dt>
              <dd className="font-medium">
                {enrollment.courses?.organizations?.title ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Course
              </dt>
              <dd className="font-medium">
                {enrollment.courses?.title ?? "-"}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">
                Harga course saat ini
              </dt>
              <dd className="font-medium">
                {formatCurrency(
                  enrollment.courses?.price ?? 0,
                )}
              </dd>
            </div>

          </dl>

        </section>

      </div>

      <section className="rounded-lg border bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold">
          Enrollment
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <div>
            <p className="text-sm text-gray-500">
              Harga snapshot
            </p>
            <p className="font-medium">
              {formatCurrency(
                enrollment.price_snapshot,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Diskon
            </p>
            <p className="font-medium">
              {formatCurrency(
                enrollment.discount_amount,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total pembayaran
            </p>
            <p className="font-medium">
              {formatCurrency(finalPrice)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Kategori
            </p>
            <p className="font-medium capitalize">
              {enrollment.category}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>
            <p className="font-medium">
              {enrollment.status}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Tanggal daftar
            </p>
            <p className="font-medium">
              {formatDate(
                enrollment.enrolled_at,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Tanggal aktif
            </p>
            <p className="font-medium">
              {formatDate(
                enrollment.activated_at,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Kedaluwarsa
            </p>
            <p className="font-medium">
              {formatDate(
                enrollment.expired_at,
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Promo
            </p>
            <p className="font-medium">
              {enrollment.promotion_name_snapshot ?? "-"}
            </p>
          </div>

        </div>

      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold">
          Payment
        </h2>

        {!payment ? (

          <p className="text-sm text-gray-500">
            Belum ada pembayaran untuk enrollment ini.
          </p>

        ) : (

          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <p className="text-sm text-gray-500">
                Nominal
              </p>
              <p className="font-medium">
                {formatCurrency(payment.amount)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Metode
              </p>
              <p className="font-medium">
                {payment.payment_method}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>
              <p className="font-medium">
                {payment.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Dibayar
              </p>
              <p className="font-medium">
                {formatDate(payment.paid_at)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Diverifikasi
              </p>
              <p className="font-medium">
                {formatDate(
                  payment.verified_at,
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Catatan
              </p>
              <p className="font-medium">
                {payment.notes ?? "-"}
              </p>
            </div>
            {payment.payment_proof_path && (
              <div className="md:col-span-3">
                <p className="mb-3 text-sm text-gray-500">
                  Bukti pembayaran
                </p>

                {paymentProofError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {paymentProofError}
                  </div>
                )}

                {paymentProofUrl && (
                  <div className="space-y-4">
                    {paymentProofIsPdf ? (
                      <iframe
                        src={paymentProofUrl}
                        title="Bukti pembayaran"
                        className="h-[600px] w-full rounded-lg border bg-gray-50"
                      />
                    ) : (
                      <div className="rounded-lg border bg-gray-50 p-4">
                        {/* Bukti pembayaran berasal dari URL dinamis Supabase. */}
{/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentProofUrl}
                          alt="Bukti pembayaran peserta"
                          className="mx-auto max-h-[600px] w-auto rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <a
                      href={paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Buka Bukti di Tab Baru
                    </a>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Lihat path file
                  </summary>

                  <p className="mt-2 break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    {payment.payment_proof_path}
                  </p>
                </details>
              </div>
            )}
          </div>

        )}

      </section>
<EnrollmentActionButtons
  enrollmentId={enrollment.id}
  enrollmentStatus={enrollment.status}
  enrollmentCategory={enrollment.category}
  paymentId={payment?.id ?? null}
  paymentStatus={payment?.status ?? null}
/>
    </div>

  );

}