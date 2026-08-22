import type { Database } from "@/supabase/types/database.types";
import type {
  EnrollmentDetail,
  PaymentTiming,
} from "@/repositories/enrollment.repository";

export type EnrollmentStatus =
  Database["public"]["Enums"]["enrollment_status"];

export type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

export type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

export type PaymentMethod =
  Database["public"]["Enums"]["payment_method"];

export type EnrollmentSort =
  | "date_desc"
  | "date_asc"
  | "name_asc"
  | "name_desc";

export type EnrollmentFilterParams = Record<
  string,
  string | string[] | undefined
>;

export interface AdminEnrollmentFilters {
  searchQuery: string;
  enrollmentStatus: EnrollmentStatus | "all";
  paymentStatus: PaymentStatus | "none" | "all";
  paymentTiming: PaymentTiming | "all";
  courseId: string;
  programId: string;
  sort: EnrollmentSort;
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

const paymentTimings: PaymentTiming[] = [
  "upfront",
  "deferred",
];

const enrollmentSorts: EnrollmentSort[] = [
  "date_desc",
  "date_asc",
  "name_asc",
  "name_desc",
];

export function getStringParam(
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

function isPaymentTiming(
  value: string,
): value is PaymentTiming {
  return paymentTimings.includes(
    value as PaymentTiming,
  );
}

function isEnrollmentSort(
  value: string,
): value is EnrollmentSort {
  return enrollmentSorts.includes(
    value as EnrollmentSort,
  );
}

export function parseAdminEnrollmentFilters(
  params: EnrollmentFilterParams,
): AdminEnrollmentFilters {
  const enrollmentStatusParam = getStringParam(
    params.enrollmentStatus,
  );
  const paymentStatusParam = getStringParam(
    params.paymentStatus,
  );
  const paymentTimingParam = getStringParam(
    params.paymentTiming,
  );
  const sortParam = getStringParam(params.sort);

  return {
    searchQuery: getStringParam(params.q)
      .trim()
      .toLowerCase(),
    enrollmentStatus: isEnrollmentStatus(
      enrollmentStatusParam,
    )
      ? enrollmentStatusParam
      : "all",
    paymentStatus:
      isPaymentStatus(paymentStatusParam) ||
      paymentStatusParam === "none"
        ? paymentStatusParam
        : "all",
    paymentTiming: isPaymentTiming(paymentTimingParam)
      ? paymentTimingParam
      : "all",
    courseId: getStringParam(params.courseId),
    programId: getStringParam(params.programId),
    sort: isEnrollmentSort(sortParam)
      ? sortParam
      : "date_desc",
  };
}

export function filterAdminEnrollments<
  T extends EnrollmentDetail,
>(
  enrollments: T[],
  filters: AdminEnrollmentFilters,
): T[] {
  const filtered = enrollments.filter((enrollment) => {
    const profile = enrollment.profiles as
      | (NonNullable<EnrollmentDetail["profiles"]> & {
          university_origin?: string | null;
        })
      | null;
    const course = enrollment.courses;
    const organization = course?.organizations;
    const program = course?.programs;
    const payment = enrollment.payments;

    const searchableText = [
      profile?.full_name,
      profile?.phone,
      profile?.university_origin,
      course?.title,
      course?.slug,
      organization?.title,
      program?.title,
      enrollment.promotion_code_snapshot,
      enrollment.promotion_name_snapshot,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      filters.searchQuery.length === 0 ||
      searchableText.includes(filters.searchQuery);

    const matchesEnrollmentStatus =
      filters.enrollmentStatus === "all" ||
      enrollment.status === filters.enrollmentStatus;

    const matchesPaymentStatus =
      filters.paymentStatus === "all" ||
      (filters.paymentStatus === "none" && !payment) ||
      (filters.paymentStatus !== "none" &&
        payment?.status === filters.paymentStatus);

    const matchesPaymentTiming =
      filters.paymentTiming === "all" ||
      enrollment.payment_timing === filters.paymentTiming;

    const matchesCourse =
      !filters.courseId || course?.id === filters.courseId;

    const matchesProgram =
      !filters.programId || program?.id === filters.programId;

    return (
      matchesSearch &&
      matchesEnrollmentStatus &&
      matchesPaymentStatus &&
      matchesPaymentTiming &&
      matchesCourse &&
      matchesProgram
    );
  });

  return filtered.sort((a, b) => {
    if (
      filters.sort === "name_asc" ||
      filters.sort === "name_desc"
    ) {
      const result = (a.profiles?.full_name ?? "").localeCompare(
        b.profiles?.full_name ?? "",
        "id",
      );

      return filters.sort === "name_desc" ? -result : result;
    }

    const result =
      new Date(b.enrolled_at).getTime() -
      new Date(a.enrolled_at).getTime();

    return filters.sort === "date_asc" ? -result : result;
  });
}

export function buildAdminEnrollmentFilterQuery(
  filters: AdminEnrollmentFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchQuery) {
    params.set("q", filters.searchQuery);
  }

  if (filters.enrollmentStatus !== "all") {
    params.set(
      "enrollmentStatus",
      filters.enrollmentStatus,
    );
  }

  if (filters.paymentStatus !== "all") {
    params.set(
      "paymentStatus",
      filters.paymentStatus,
    );
  }

  if (filters.paymentTiming !== "all") {
    params.set(
      "paymentTiming",
      filters.paymentTiming,
    );
  }

  if (filters.courseId) {
    params.set("courseId", filters.courseId);
  }

  if (filters.programId) {
    params.set("programId", filters.programId);
  }

  if (filters.sort !== "date_desc") {
    params.set("sort", filters.sort);
  }

  return params;
}

export function getEnrollmentStatusLabel(
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

export function getEnrollmentCategoryLabel(
  category: EnrollmentCategory,
): string {
  const labels: Record<EnrollmentCategory, string> = {
    regular: "Reguler",
    separated: "Terpisah",
  };

  return labels[category];
}

export function getPaymentTimingLabel(
  timing: PaymentTiming,
): string {
  return timing === "deferred"
    ? "Bayar di Akhir"
    : "Bayar di Awal";
}

export function getPaymentStatusLabel(
  status: PaymentStatus | null,
): string {
  if (!status) {
    return "Belum Ada Pembayaran";
  }

  const labels: Record<PaymentStatus, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[status];
}

export function getPaymentMethodLabel(
  method: PaymentMethod | null,
): string {
  if (!method) {
    return "-";
  }

  const labels: Record<PaymentMethod, string> = {
    bank_transfer: "Transfer Bank",
    qris: "QRIS",
    free: "Gratis",
  };

  return labels[method];
}
