"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  authService,
  enrollmentService,
  paymentProofService,
  paymentService,
  profileService,
} from "@/services";
import {
  studentCheckoutService,
} from "@/services/student-checkout.service";

async function getOwnedPendingEnrollment(
  enrollmentId: string,
) {
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.role !== "student" ||
    profile.status !== "active"
  ) {
    redirect("/dashboard");
  }

  const enrollment =
    await enrollmentService.getEnrollmentById(
      enrollmentId,
    );

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
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Kode promosi hanya dapat digunakan sebelum bukti pembayaran dikirim.",
      )}`,
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
    const message =
      error instanceof Error
        ? error.message
        : "Kode promosi gagal diterapkan.";

    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  redirect(
    `/dashboard/student/payment/${enrollmentId}?success=${encodeURIComponent(
      `${promotionName} berhasil diterapkan.`,
    )}`,
  );
}

export async function submitZeroPaymentAction(
  enrollmentId: string,
): Promise<void> {
  const { enrollment } =
    await getOwnedPendingEnrollment(enrollmentId);

  if (enrollment.status !== "pending_payment") {
    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Enrollment ini sudah dikirim atau tidak dapat diproses.",
      )}`,
    );
  }

  try {
    await studentCheckoutService.submitZeroPayment(
      enrollmentId,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Pendaftaran gratis gagal dikirim.";

    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  redirect(
    `/dashboard/student/payment/${enrollmentId}?success=${encodeURIComponent(
      "Pendaftaran berhasil dikirim dan sedang menunggu verifikasi Admin.",
    )}`,
  );
}

export async function uploadPaymentProofAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const { enrollment } =
    await getOwnedPendingEnrollment(enrollmentId);

  const user =
    await authService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (enrollment.status === "active") {
    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Enrollment ini sudah aktif.",
      )}`,
    );
  }

  if (
    enrollment.status === "cancelled" ||
    enrollment.status === "expired"
  ) {
    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Enrollment sudah tidak dapat diproses.",
      )}`,
    );
  }

  const totalPayment = Math.max(
    enrollment.price_snapshot -
      enrollment.discount_amount,
    0,
  );

  if (totalPayment === 0) {
    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Total pembayaran Rp0. Gunakan tombol Kirim Pendaftaran Gratis.",
      )}`,
    );
  }

  const fileValue =
    formData.get("paymentProof");

  if (
    !(fileValue instanceof File) ||
    fileValue.size === 0
  ) {
    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        "Silakan pilih bukti pembayaran.",
      )}`,
    );
  }

  try {
    const paymentProofPath =
      await paymentProofService.uploadPaymentProof(
        user.id,
        enrollment.id,
        fileValue,
      );

    await paymentService.submitPaymentProof(
      enrollment.id,
      totalPayment,
      paymentProofPath,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengunggah bukti pembayaran.";

    redirect(
      `/dashboard/student/payment/${enrollmentId}?error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  revalidatePath(
    `/dashboard/student/payment/${enrollmentId}`,
  );
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  redirect(
    `/dashboard/student/payment/${enrollmentId}?success=${encodeURIComponent(
      "Bukti pembayaran berhasil dikirim.",
    )}`,
  );
}
