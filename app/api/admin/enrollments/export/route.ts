import {
  buildAdminEnrollmentFilterQuery,
  filterAdminEnrollments,
  getEnrollmentCategoryLabel,
  getEnrollmentStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  parseAdminEnrollmentFilters,
} from "@/lib/enrollment/admin-enrollment-filter";
import {
  createXlsx,
  type XlsxColumn,
  type XlsxCellValue,
} from "@/lib/excel/simple-xlsx";
import { enrollmentExportService } from "@/services/enrollment-export.service";
import { profileService } from "@/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const columns: XlsxColumn[] = [
  { header: "No", width: 7, kind: "integer" },
  { header: "Nama Peserta", width: 24 },
  { header: "Nomor WhatsApp", width: 20 },
  { header: "Asal Universitas Peserta", width: 28 },
  { header: "Universitas Course", width: 26 },
  { header: "Program", width: 30 },
  { header: "Course yang Diikuti", width: 32 },
  { header: "Tanggal Enrollment", width: 22 },
  { header: "Harga Awal", width: 17, kind: "currency" },
  { header: "Kode Voucher", width: 20 },
  { header: "Nama Promosi", width: 26 },
  { header: "Potongan Voucher", width: 19, kind: "currency" },
  { header: "Total Setelah Voucher", width: 21, kind: "currency" },
  { header: "Nominal Payment", width: 18, kind: "currency" },
  { header: "Metode Payment", width: 18 },
  { header: "Status Payment", width: 23 },
  { header: "Status Enrollment", width: 24 },
  { header: "Kategori Peserta", width: 18 },
  { header: "Tanggal Pembayaran", width: 22 },
  { header: "Tanggal Verifikasi", width: 22 },
];

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getFileDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getFilterParams(url: URL) {
  return {
    q: url.searchParams.get("q") ?? undefined,
    enrollmentStatus:
      url.searchParams.get("enrollmentStatus") ??
      undefined,
    paymentStatus:
      url.searchParams.get("paymentStatus") ??
      undefined,
  };
}

export async function GET(
  request: Request,
): Promise<Response> {
  try {
    const profile =
      await profileService.getCurrentProfile();

    if (!profile) {
      return Response.json(
        { message: "Silakan masuk terlebih dahulu." },
        { status: 401 },
      );
    }

    if (
      profile.role !== "admin" ||
      profile.status !== "active"
    ) {
      return Response.json(
        {
          message:
            "Hanya Admin aktif yang dapat mengunduh laporan enrollment.",
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const filters = parseAdminEnrollmentFilters(
      getFilterParams(url),
    );
    const enrollments =
      await enrollmentExportService.getEnrollments();
    const filteredEnrollments =
      filterAdminEnrollments(
        enrollments,
        filters,
      );

    const rows: XlsxCellValue[][] =
      filteredEnrollments.map(
        (enrollment, index) => {
          const profileData = enrollment.profiles;
          const course = enrollment.courses;
          const payment = enrollment.payments;
          const price = Number(
            enrollment.price_snapshot,
          );
          const discount = Number(
            enrollment.discount_amount,
          );
          const finalAmount = Math.max(
            price - discount,
            0,
          );

          return [
            index + 1,
            profileData?.full_name ?? "-",
            profileData?.phone ?? "-",
            profileData?.university_origin ?? "-",
            course?.organizations?.title ?? "-",
            course?.programs?.title ?? "-",
            course?.title ?? "-",
            formatDateTime(enrollment.enrolled_at),
            price,
            enrollment.promotion_code_snapshot ?? "-",
            enrollment.promotion_name_snapshot ?? "-",
            discount,
            finalAmount,
            payment ? Number(payment.amount) : null,
            getPaymentMethodLabel(
              payment?.payment_method ?? null,
            ),
            getPaymentStatusLabel(
              payment?.status ?? null,
            ),
            getEnrollmentStatusLabel(
              enrollment.status,
            ),
            getEnrollmentCategoryLabel(
              enrollment.category,
            ),
            formatDateTime(payment?.paid_at ?? null),
            formatDateTime(
              payment?.verified_at ?? null,
            ),
          ];
        },
      );

    const workbook = createXlsx({
      sheetName: "Enrollment Payment",
      columns,
      rows,
    });
    const body = Uint8Array.from(workbook);
    const fileName =
      `enrollment-payment-${getFileDate()}.xlsx`;
    const appliedFilters =
      buildAdminEnrollmentFilterQuery(filters)
        .toString();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${fileName}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control":
          "private, no-store, max-age=0",
        "X-Enrollment-Count": String(
          filteredEnrollments.length,
        ),
        "X-Enrollment-Filters":
          appliedFilters || "none",
      },
    });
  } catch (error) {
    console.error(
      "Gagal membuat Excel enrollment:",
      error,
    );

    const message =
      error instanceof Error &&
      (error.message
        .toLowerCase()
        .includes("fetch failed") ||
        error.message
          .toLowerCase()
          .includes("connect timeout"))
        ? "Koneksi ke server sedang tidak stabil. Silakan coba unduh kembali."
        : "Laporan Excel gagal dibuat.";

    return Response.json(
      { message },
      { status: 500 },
    );
  }
}
