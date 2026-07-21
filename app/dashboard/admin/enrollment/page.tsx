import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

import {
  BulkApprovalButtons,
} from "@/components/admin/enrollment/BulkApprovalButtons";

import {
  enrollmentService,
} from "@/services";

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
  const labels: Record<
    EnrollmentStatus,
    string
  > = {
    pending_payment:
      "Menunggu Pembayaran",

    pending_approval:
      "Menunggu Verifikasi",

    active:
      "Aktif",

    expired:
      "Kedaluwarsa",

    cancelled:
      "Dibatalkan",
  };

  return labels[status];
}

function getStatusClassName(
  status: EnrollmentStatus,
): string {
  const classNames: Record<
    EnrollmentStatus,
    string
  > = {
    pending_payment:
      "bg-yellow-100 text-yellow-700",

    pending_approval:
      "bg-blue-100 text-blue-700",

    active:
      "bg-green-100 text-green-700",

    expired:
      "bg-gray-100 text-gray-700",

    cancelled:
      "bg-red-100 text-red-700",
  };

  return classNames[status];
}

function getCategoryLabel(
  category: EnrollmentCategory,
): string {
  const labels: Record<
    EnrollmentCategory,
    string
  > = {
    regular:
      "Reguler",

    separated:
      "Terpisah",
  };

  return labels[category];
}

function getPaymentStatusLabel(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return "Belum ada payment";
  }

  const labels: Record<
    PaymentStatus,
    string
  > = {
    pending:
      "Menunggu Verifikasi",

    approved:
      "Disetujui",

    rejected:
      "Ditolak",
  };

  return labels[status];
}

function getPaymentStatusClassName(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return "bg-gray-100 text-gray-700";
  }

  const classNames: Record<
    PaymentStatus,
    string
  > = {
    pending:
      "bg-yellow-100 text-yellow-700",

    approved:
      "bg-green-100 text-green-700",

    rejected:
      "bg-red-100 text-red-700",
  };

  return classNames[status];
}

export default async function EnrollmentPage({
  searchParams,
}: EnrollmentPageProps) {
  const params = await searchParams;

  const searchQuery =
    getStringParam(params.q)
      .trim()
      .toLowerCase();

  const enrollmentStatusParam =
    getStringParam(
      params.enrollmentStatus,
    );

  const paymentStatusParam =
    getStringParam(
      params.paymentStatus,
    );

  const selectedEnrollmentStatus =
    isEnrollmentStatus(
      enrollmentStatusParam,
    )
      ? enrollmentStatusParam
      : "all";

  const selectedPaymentStatus =
    isPaymentStatus(
      paymentStatusParam,
    ) ||
    paymentStatusParam === "none"
      ? paymentStatusParam
      : "all";

  const enrollments =
    await enrollmentService.getEnrollments();

  const filteredEnrollments =
    enrollments.filter(
      (enrollment) => {
        const profile =
          enrollment.profiles;

        const course =
          enrollment.courses;

        const organization =
          course?.organizations;

        const program =
          course?.programs;

        const payment =
          enrollment.payments;

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
          searchableText.includes(
            searchQuery,
          );

        const matchesEnrollmentStatus =
          selectedEnrollmentStatus ===
            "all" ||
          enrollment.status ===
            selectedEnrollmentStatus;

        const matchesPaymentStatus =
          selectedPaymentStatus ===
            "all" ||
          (
            selectedPaymentStatus ===
              "none" &&
            !payment
          ) ||
          (
            selectedPaymentStatus !==
              "none" &&
            payment?.status ===
              selectedPaymentStatus
          );

        return (
          matchesSearch &&
          matchesEnrollmentStatus &&
          matchesPaymentStatus
        );
      },
    );

  const hasActiveFilter =
    searchQuery.length > 0 ||
    selectedEnrollmentStatus !== "all" ||
    selectedPaymentStatus !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Enrollment
          </h1>

          <p className="mt-2 text-gray-500">
            Kelola pendaftaran mahasiswa ke course.
          </p>
        </div>

        <BulkApprovalButtons />
      </div>

      <form
        method="GET"
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label
              htmlFor="q"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Pencarian
            </label>

            <input
              id="q"
              name="q"
              type="search"
              defaultValue={getStringParam(
                params.q,
              )}
              placeholder="Cari nama, nomor telepon, course, universitas..."
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                px-3
                py-2
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          <div>
            <label
              htmlFor="enrollmentStatus"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status Enrollment
            </label>

            <select
              id="enrollmentStatus"
              name="enrollmentStatus"
              defaultValue={
                selectedEnrollmentStatus
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                px-3
                py-2
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">
                Semua status
              </option>

              <option value="pending_payment">
                Menunggu pembayaran
              </option>

              <option value="pending_approval">
                Menunggu verifikasi
              </option>

              <option value="active">
                Aktif
              </option>

              <option value="expired">
                Kedaluwarsa
              </option>

              <option value="cancelled">
                Dibatalkan
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="paymentStatus"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status Payment
            </label>

            <select
              id="paymentStatus"
              name="paymentStatus"
              defaultValue={
                selectedPaymentStatus
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                px-3
                py-2
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">
                Semua payment
              </option>

              <option value="none">
                Belum ada payment
              </option>

              <option value="pending">
                Menunggu verifikasi
              </option>

              <option value="approved">
                Disetujui
              </option>

              <option value="rejected">
                Ditolak
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="
              rounded-lg
              bg-blue-600
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-blue-700
            "
          >
            Terapkan
          </button>

          {hasActiveFilter && (
            <Link
              href="/dashboard/admin/enrollment"
              className="
                rounded-lg
                border
                border-gray-300
                px-4
                py-2
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
              "
            >
              Reset
            </Link>
          )}

          <p className="text-sm text-gray-500">
            Menampilkan{" "}
            <span className="font-medium text-gray-900">
              {filteredEnrollments.length}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-gray-900">
              {enrollments.length}
            </span>{" "}
            enrollment
          </p>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-gray-700">
              Tidak ada enrollment yang ditemukan.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Coba ubah kata pencarian atau filter.
            </p>

            {hasActiveFilter && (
              <Link
                href="/dashboard/admin/enrollment"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Hapus semua filter
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Tanggal
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Mahasiswa
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Course
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Universitas
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Program
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Harga
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Kategori
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Payment
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Enrollment
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredEnrollments.map(
                  (enrollment) => {
                    const profile =
                      enrollment.profiles;

                    const course =
                      enrollment.courses;

                    const organization =
                      course?.organizations;

                    const program =
                      course?.programs;

                    const payment =
                      enrollment.payments;

                    return (
                      <tr
                        key={enrollment.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(
                            enrollment.enrolled_at,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="min-w-44">
                            <p className="font-medium text-gray-900">
                              {profile?.full_name ??
                                "Profil tidak ditemukan"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {profile?.phone ??
                                "Nomor telepon belum tersedia"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="min-w-44">
                            <p className="font-medium text-gray-900">
                              {course?.title ??
                                "Course tidak ditemukan"}
                            </p>

                            {course?.slug && (
                              <p className="mt-1 text-xs text-gray-500">
                                {course.slug}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="block min-w-40">
                            {organization?.title ??
                              "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="block min-w-40">
                            {program?.title ??
                              "-"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {formatCurrency(
                            enrollment.price_snapshot,
                          )}

                          {enrollment.discount_amount >
                            0 && (
                            <p className="mt-1 text-xs font-normal text-green-600">
                              Diskon{" "}
                              {formatCurrency(
                                enrollment.discount_amount,
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {getCategoryLabel(
                            enrollment.category,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`
                              inline-flex
                              whitespace-nowrap
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-medium
                              ${getPaymentStatusClassName(
                                payment?.status ??
                                  null,
                              )}
                            `}
                          >
                            {getPaymentStatusLabel(
                              payment?.status ??
                                null,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`
                              inline-flex
                              whitespace-nowrap
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-medium
                              ${getStatusClassName(
                                enrollment.status,
                              )}
                            `}
                          >
                            {getStatusLabel(
                              enrollment.status,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={
                              `/dashboard/admin/enrollment/${enrollment.id}`
                            }
                            className="
                              font-medium
                              text-blue-600
                              hover:underline
                            "
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}