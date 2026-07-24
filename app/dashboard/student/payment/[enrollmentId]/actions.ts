"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  enrollmentService,
  paymentProofService,
  paymentService,
  profileService,
} from "@/services";
import {
  studentCheckoutService,
} from "@/services/student-checkout.service";

function isSupabaseConnectionError(
  error: unknown,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const details = error as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    cause?: unknown;
  };
  const cause =
    details.cause && typeof details.cause === "object"
      ? details.cause as {
          code?: unknown;
          message?: unknown;
        }
      : null;
  const errorName =
    typeof details.name === "string"
      ? details.name
      : "";
  const errorCode =
    typeof details.code === "string"
      ? details.code
      : "";
  const causeCode =
    typeof cause?.code === "string"
      ? cause.code
      : "";
  const combinedMessage = [
    details.message,
    cause?.message,
  ]
    .filter((value): value is string =>
      typeof value === "string",
    )
    .join(" ")
    .toLowerCase();

  return (
    errorName === "AuthRetryableFetchError" ||
    errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
    causeCode === "UND_ERR_CONNECT_TIMEOUT" ||
    combinedMessage.includes("fetch failed") ||
    combinedMessage.includes("connect timeout")
  );
}

function getActionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isSupabaseConnectionError(error)) {
    return "Koneksi ke server sedang tidak stabil. Data belum diubah. Silakan coba lagi setelah koneksi membaik.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
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

async function getOwnedPendingEnrollment(
  enrollmentId: string,
) {
  let profile;

  try {
    profile = await profileService.getCurrentProfile();
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(
          error,
          "Gagal memeriksa sesi pengguna.",
        ),
      ),
    );
  }

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.role !== "student" ||
    profile.status !== "active"
  ) {
    redirect("/dashboard");
  }

  let enrollment;

  try {
    enrollment = await enrollmentService.getEnrollmentById(
      enrollmentId,
    );
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(
          error,
          "Gagal memeriksa data enrollment.",
        ),
      ),
    );
  }

  if (
    !enrollment ||
    enrollment.profile_id !== profile.id
  ) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Enrollment tidak ditemukan.",
      )}`,
    );
  }

  return {
    profile,
    enrollment,
  };
}

export async function applyPromotionCodeAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const { enrollment } =
    await getOwnedPendingEnrollment(enrollmentId);

  if (enrollment.status !== "pending_payment") {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Kode promosi hanya dapat digunakan sebelum bukti pembayaran dikirim.",
      ),
    );
  }

  const promotionCode = String(
    formData.get("promotionCode") ?? "",
  ).trim();

  let promotionName = "Promosi";

  try {
    const result =
      await studentCheckoutService.applyPromotionCode(
        enrollmentId,
        promotionCode,
      );

    promotionName = result.promotion_name;
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(
          error,
          "Kode promosi gagal diterapkan.",
        ),
      ),
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

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
  const { enrollment } =
    await getOwnedPendingEnrollment(enrollmentId);

  if (enrollment.status !== "pending_payment") {
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
    );
  } catch (error) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        getActionErrorMessage(
          error,
          "Pendaftaran gratis gagal dikirim.",
        ),
      ),
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  redirect(
    paymentPageUrl(
      enrollmentId,
      "success",
      "Pendaftaran berhasil dikirim dan sedang menunggu verifikasi Admin.",
    ),
  );
}

export async function uploadPaymentProofAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const { profile, enrollment } =
    await getOwnedPendingEnrollment(enrollmentId);

  if (enrollment.status === "active") {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Enrollment ini sudah aktif.",
      ),
    );
  }

  if (
    enrollment.status === "cancelled" ||
    enrollment.status === "expired"
  ) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Enrollment sudah tidak dapat diproses.",
      ),
    );
  }

  const totalPayment = Math.max(
    enrollment.price_snapshot -
      enrollment.discount_amount,
    0,
  );

  if (totalPayment === 0) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Total pembayaran Rp0. Gunakan tombol Kirim Pendaftaran Gratis.",
      ),
    );
  }

  const fileValue =
    formData.get("paymentProof");

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    redirect(
      paymentPageUrl(
        enrollmentId,
        "error",
        "Silakan pilih bukti pembayaran.",
      ),
    );
  }

  try {
    const paymentProofPath =
      await paymentProofService.uploadPaymentProof(
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
        getActionErrorMessage(
          error,
          "Gagal mengunggah bukti pembayaran.",
        ),
      ),
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  redirect(
    paymentPageUrl(
      enrollmentId,
      "success",
      "Bukti pembayaran berhasil dikirim.",
    ),
  );
}
