"use server";

import { revalidatePath } from "next/cache";

import type { Database } from "@/supabase/types/database.types";

import {
  enrollmentService,
  paymentService,
  profileService,
} from "@/services";

type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

async function getAdminProfileId(): Promise<string> {
  const profile =
    await profileService
      .getCurrentProfile();

  if (!profile) {
    throw new Error(
      "Profile admin tidak ditemukan.",
    );
  }

  if (
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    throw new Error(
      "Anda tidak memiliki izin sebagai admin.",
    );
  }

  return profile.id;
}
function revalidateEnrollment(
  enrollmentId?: string,
) {
  revalidatePath(
    "/dashboard/admin/enrollment",
  );

  if (enrollmentId) {
    revalidatePath(
      `/dashboard/admin/enrollment/${enrollmentId}`,
    );
  }
}

/* ========================================
   BULK ACTIONS
======================================== */

export async function approveAllEnrollmentsAction() {
  try {
    const enrollments =
      await enrollmentService
        .approveAllPendingEnrollments();

    revalidateEnrollment();

    return {
      success: true,
      message:
        enrollments.length > 0
          ? `${enrollments.length} enrollment berhasil disetujui.`
          : "Tidak ada enrollment yang menunggu persetujuan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyetujui semua enrollment.",
    };
  }
}

export async function approveAllPaymentsAction() {
  try {
    const adminProfileId =
  await getAdminProfileId();

    const payments =
      await paymentService
        .approveAllPendingPayments(
          adminProfileId,
        );

    revalidateEnrollment();

    return {
      success: true,
      message:
        payments.length > 0
          ? `${payments.length} payment berhasil disetujui.`
          : "Tidak ada payment yang menunggu persetujuan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyetujui semua payment.",
    };
  }
}

/* ========================================
   INDIVIDUAL PAYMENT ACTIONS
======================================== */

export async function approvePaymentAction(
  paymentId: string,
  enrollmentId: string,
) {
  try {
  const adminProfileId =
  await getAdminProfileId();

    await paymentService.approvePayment(
      paymentId,
      adminProfileId,
    );

    revalidateEnrollment(enrollmentId);

    return {
      success: true,
      message:
        "Payment berhasil disetujui dan enrollment telah diaktifkan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyetujui payment.",
    };
  }
}

export async function rejectPaymentAction(
  paymentId: string,
  enrollmentId: string,
  notes?: string,
) {
  try {
    const adminProfileId =
  await getAdminProfileId();

    await paymentService.rejectPayment(
      paymentId,
      adminProfileId,
      notes,
    );

    revalidateEnrollment(enrollmentId);

    return {
      success: true,
      message:
        "Payment berhasil ditolak.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menolak payment.",
    };
  }
}

/* ========================================
   INDIVIDUAL ENROLLMENT ACTIONS
======================================== */

export async function activateEnrollmentAction(
  enrollmentId: string,
) {
  try {
    await enrollmentService
      .activateEnrollment(enrollmentId);

    revalidateEnrollment(enrollmentId);

    return {
      success: true,
      message:
        "Enrollment berhasil diaktifkan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengaktifkan enrollment.",
    };
  }
}

export async function cancelEnrollmentAction(
  enrollmentId: string,
) {
  try {
    await enrollmentService
      .cancelEnrollment(enrollmentId);

    revalidateEnrollment(enrollmentId);

    return {
      success: true,
      message:
        "Enrollment berhasil dibatalkan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membatalkan enrollment.",
    };
  }
}

export async function updateEnrollmentCategoryAction(
  enrollmentId: string,
  category: EnrollmentCategory,
) {
  try {
    await enrollmentService.updateCategory(
      enrollmentId,
      category,
    );

    revalidateEnrollment(enrollmentId);

    return {
      success: true,
      message:
        "Kategori enrollment berhasil diperbarui.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui kategori.",
    };
  }
}