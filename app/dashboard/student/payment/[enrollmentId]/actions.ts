"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  enrollmentService,
  paymentProofService,
  paymentService,
  profileService,
} from "@/services";
import { studentCheckoutService } from "@/services/student-checkout.service";

function isSupabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const details = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    cause?: unknown;
  };
  const cause =
    details.cause && typeof details.cause === "object"
      ? (details.cause as { code?: unknown; message?: unknown })
      : null;
  const combinedMessage = [details.message, cause?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    details.name === "AuthRetryableFetchError" ||
    details.code === "UND_ERR_CONNECT_TIMEOUT" ||
    cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    combinedMessage.includes("fetch failed") ||
    combinedMessage.includes("connect timeout")
  );
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (isSupabaseConnectionError(error)) {
    return "Koneksi ke server sedang tidak stabil. Data belum diubah. Silakan coba lagi setelah koneksi membaik.";
  }

  return error instanceof Error ? error.message : fallback;
}

function paymentPageUrl(
  enrollmentId: string,
  type: "error" | "success",
  message: string,
): string {
  return `/dashboard/student/payment/${enrollmentId}?${type}=${encodeURIComponent(
    message,
  )}`;
}

async function getOwnedEnrollment(enrollmentId: string) {
  let profile;

  try {
    profile = await profileService.getCurrentProfile();
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(error, "Gagal memeriksa sesi pengguna."),
      ),
    );
  }

  if (!profile) redirect("/login");
  if (profile.role !== "student" || profile.status !== "active") {
    redirect("/dashboard");
  }

  let enrollment;
  let payment;

  try {
    [enrollment, payment] = await Promise.all([
      enrollmentService.getEnrollmentById(enrollmentId),
      paymentService.getPaymentByEnrollment(enrollmentId),
    ]);
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(error, "Gagal memeriksa data enrollment."),
      ),
    );
  }

  if (!enrollment || enrollment.profile_id !== profile.id) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Enrollment tidak ditemukan.",
      )}`,
    );
  }

  return { profile, enrollment, payment };
}

function canSubmitPayment(
  enrollment: Awaited<ReturnType<typeof enrollmentService.getEnrollmentById>>,
  payment: Awaited<ReturnType<typeof paymentService.getPaymentByEnrollment>>,
): boolean {
  if (!enrollment) return false;
  if (payment?.status === "pending" || payment?.status === "approved") {
    return false;
  }

  if (enrollment.payment_timing === "deferred") {
    return enrollment.status === "active";
  }

  return enrollment.status === "pending_payment";
}

function revalidatePaymentPages(enrollmentId: string, courseId: string) {
  revalidatePath(`/dashboard/student/payment/${enrollmentId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/enrollment");
}

export async function applyPromotionCodeAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const { enrollment, payment } = await getOwnedEnrollment(enrollmentId);

  if (!canSubmitPayment(enrollment, payment)) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Kode promosi hanya dapat digunakan sebelum pembayaran dikirim.",
      ),
    );
  }

  const promotionCode = String(formData.get("promotionCode") ?? "").trim();
  let promotionName = "Promosi";

  try {
    const result = await studentCheckoutService.applyPromotionCode(
      enrollmentId,
      promotionCode,
      enrollment.payment_timing,
    );
    promotionName = result.promotion_name;
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(error, "Kode promosi gagal diterapkan."),
      ),
    );
  }

  revalidatePaymentPages(enrollmentId, enrollment.course_id);
  redirect(
    paymentPageUrl(
      enrollmentId,
      "success",
      `${promotionName} berhasil diterapkan.`,
    ),
  );
}

export async function submitZeroPaymentAction(
  enrollmentId: string,
): Promise<void> {
  const { enrollment, payment } = await getOwnedEnrollment(enrollmentId);

  if (!canSubmitPayment(enrollment, payment)) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Enrollment ini sudah dikirim atau tidak dapat diproses.",
      ),
    );
  }

  try {
    await studentCheckoutService.submitZeroPayment(
      enrollmentId,
      enrollment.payment_timing,
    );
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(error, "Pendaftaran gratis gagal dikirim."),
      ),
    );
  }

  revalidatePaymentPages(enrollmentId, enrollment.course_id);
  redirect(
    paymentPageUrl(
      enrollmentId,
      "success",
      enrollment.payment_timing === "deferred"
        ? "Pembayaran Rp0 berhasil dikirim. Akses course tetap aktif selama verifikasi."
        : "Pendaftaran berhasil dikirim dan sedang menunggu verifikasi Admin.",
    ),
  );
}

export async function uploadPaymentProofAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const { profile, enrollment, payment } = await getOwnedEnrollment(enrollmentId);

  if (!canSubmitPayment(enrollment, payment)) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        payment?.status === "pending"
          ? "Pembayaran sedang menunggu verifikasi Admin."
          : payment?.status === "approved"
            ? "Pembayaran sudah disetujui."
            : "Enrollment ini tidak dapat menerima pembayaran.",
      ),
    );
  }

  const totalPayment = Math.max(
    enrollment.price_snapshot - enrollment.discount_amount,
    0,
  );

  if (totalPayment === 0) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Total pembayaran Rp0. Gunakan tombol Kirim Pembayaran Rp0.",
      ),
    );
  }

  const fileValue = formData.get("paymentProof");
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Silakan pilih bukti pembayaran.",
      ),
    );
  }

  try {
    const paymentProofPath = await paymentProofService.uploadPaymentProof(
      profile.id,
      enrollment.id,
      fileValue,
    );

    await paymentService.submitPaymentProof(
      enrollment.id,
      totalPayment,
      paymentProofPath,
    );
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(error, "Gagal mengunggah bukti pembayaran."),
      ),
    );
  }

  revalidatePaymentPages(enrollmentId, enrollment.course_id);
  redirect(
    paymentPageUrl(
      enrollmentId,
      "success",
      enrollment.payment_timing === "deferred"
        ? "Bukti pembayaran berhasil dikirim. Course tetap dapat diakses selama verifikasi."
        : "Bukti pembayaran berhasil dikirim.",
    ),
  );
}
