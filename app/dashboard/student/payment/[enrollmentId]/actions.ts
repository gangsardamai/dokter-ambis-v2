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

export async function uploadPaymentProofAction(
  enrollmentId: string,
  formData: FormData,
): Promise<void> {
  const profile =
    await profileService
      .getCurrentProfile();

  const user =
    await authService
      .getCurrentUser();

  if (!profile || !user) {
    redirect("/login");
  }

  if (
    profile.role !== "student" ||
    profile.status !== "active"
  ) {
    redirect("/dashboard");
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
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Enrollment tidak ditemukan.",
      )}`,
    );
  }

  if (
    enrollment.status === "active"
  ) {
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
      await paymentProofService
        .uploadPaymentProof(
          user.id,
          enrollment.id,
          fileValue,
        );

    const totalPayment =
      Math.max(
        enrollment.price_snapshot -
          enrollment.discount_amount,
        0,
      );

    await paymentService
      .submitPaymentProof(
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