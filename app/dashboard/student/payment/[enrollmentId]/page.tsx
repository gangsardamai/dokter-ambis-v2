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
  applyPromotionCodeAction,
  submitZeroPaymentAction,
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
  const { enrollmentId } = await params;
  const query = await searchParams;
  const errorMessage = getMessage(query.error);
  const successMessage = getMessage(query.success);
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const enrollment =
    await enrollmentService.getEnrollmentById(
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

  const totalPayment = Math.max(
    enrollment.price_snapshot -
      enrollment.discount_amount,
    0,
  );

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link
        href={`/dashboard/student/course/${course.id}`}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Kembali ke detail blok
      </Link>

      <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="border-b border-slate-100 pb-6">
          <p className="text-sm font-bold text-blue-600">
            Pendaftaran Blok
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Pembayaran
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Gunakan kode promosi bila tersedia, lalu selesaikan pembayaran sesuai total akhir.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-slate-500">
              Blok pembelajaran
            </p>

            <p className="mt-1 text-lg font-bold text-slate-950">
              {course.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Status pendaftaran
            </p>

            <span className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
              {getStatusLabel(enrollment.status)}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">
                Harga blok
              </span>

              <span className="font-bold text-slate-900">
                {formatRupiah(
                  enrollment.price_snapshot,
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">
                Potongan
              </span>

              <span className="font-bold text-emerald-700">
                -{formatRupiah(
                  enrollment.discount_amount,
                )}
              </span>
            </div>

            {enrollment.promotion_code_snapshot && (
              <div className="mt-3 flex items-start justify-between gap-4 border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">
                  Promosi diterapkan
                </span>

                <span className="text-right font-bold text-blue-700">
                  {enrollment.promotion_name_snapshot ?? "Promosi"}
                  <span className="block font-mono text-xs uppercase text-blue-500">
                    {enrollment.promotion_code_snapshot}
                  </span>
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <span className="font-black text-slate-950">
                Total pembayaran
              </span>

              <span className="text-xl font-black text-blue-600">
                {formatRupiah(totalPayment)}
              </span>
            </div>
          </div>

          {enrollment.status === "pending_payment" && (
            <form
              action={applyPromotionCodeAction.bind(
                null,
                enrollment.id,
              )}
              className="rounded-2xl border border-violet-200 bg-violet-50 p-5"
            >
              <h2 className="font-black text-violet-950">
                Punya kode promosi?
              </h2>

              <p className="mt-1 text-sm leading-6 text-violet-700">
                Masukkan kode sebelum mengirim bukti pembayaran. Kode tidak membedakan huruf besar dan kecil.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  name="promotionCode"
                  required
                  autoComplete="off"
                  placeholder="Masukkan kode promosi"
                  className="min-h-11 flex-1 rounded-xl border border-violet-200 bg-white px-4 py-2 font-mono text-sm uppercase outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />

                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  Terapkan Kode
                </button>
              </div>
            </form>
          )}

          {enrollment.status === "pending_payment" &&
            totalPayment > 0 && (
              <>
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Rekening Pembayaran
                  </p>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-500">
                        Bank
                      </span>
                      <span className="font-black text-blue-700">
                        BRI
                      </span>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-sm text-slate-500">
                        Nomor rekening
                      </p>
                      <p className="mt-1 break-all font-mono text-xl font-black tracking-wider text-slate-950 sm:text-2xl">
                        0021 0114 8799 501
                      </p>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-sm text-slate-500">
                        Atas nama
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        Gangsar Lintas Damai
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-blue-700">
                    Transfer tepat sebesar <strong>{formatRupiah(totalPayment)}</strong>, kemudian unggah bukti pembayaran di bawah ini.
                  </p>
                </div>

                <form
                  action={uploadPaymentProofAction.bind(
                    null,
                    enrollment.id,
                  )}
                  className="rounded-2xl border border-blue-200 bg-blue-50 p-5"
                >
                  <h2 className="font-black text-blue-950">
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
                    className="mt-4 block w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
                  />

                  <button
                    type="submit"
                    className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Kirim Bukti Pembayaran
                  </button>
                </form>
              </>
            )}

          {enrollment.status === "pending_payment" &&
            totalPayment === 0 && (
              <form
                action={submitZeroPaymentAction.bind(
                  null,
                  enrollment.id,
                )}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
              >
                <h2 className="font-black text-emerald-950">
                  Tidak perlu transfer
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-700">
                  Total pembayaran Anda Rp0. Kirim pendaftaran ini untuk diperiksa dan diaktifkan oleh Admin.
                </p>

                <button
                  type="submit"
                  className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  Kirim Pendaftaran Gratis
                </button>
              </form>
            )}

          {enrollment.status === "pending_approval" && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <h2 className="font-black text-yellow-950">
                Pendaftaran sedang diperiksa
              </h2>

              <p className="mt-2 text-sm leading-6 text-yellow-700">
                Data pembayaran atau promosi sudah diterima dan sedang menunggu pemeriksaan administrator.
              </p>
            </div>
          )}

          {enrollment.status === "active" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <h2 className="font-black text-green-950">
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
