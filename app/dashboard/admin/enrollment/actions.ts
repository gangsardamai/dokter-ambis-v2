"use server";

import { revalidatePath } from "next/cache";

import type { Database } from "@/supabase/types/database.extended.types";
import {
  courseService,
  enrollmentService,
  leaderAccessService,
  paymentService,
} from "@/services";

type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];
type PaymentTiming = Database["public"]["Enums"]["payment_timing"];

async function getEnrollmentStaffProfileId(): Promise<string> {
  const profile = await leaderAccessService.requireStaffPermission(
    "manage_enrollment",
  );

  return profile.id;
}

function revalidateEnrollment(enrollmentId?: string, courseId?: string) {
  revalidatePath("/dashboard/admin/enrollment");

  if (enrollmentId) {
    revalidatePath(`/dashboard/admin/enrollment/${enrollmentId}`);
    revalidatePath(`/dashboard/student/payment/${enrollmentId}`);
  }

  if (courseId) {
    revalidatePath(`/dashboard/student/my-course/${courseId}`);
  }

  revalidatePath("/dashboard/student");
}

export async function approveAllEnrollmentsAction() {
  try {
    await getEnrollmentStaffProfileId();
    const enrollments = await enrollmentService.approveAllPendingEnrollments();
    revalidateEnrollment();

    return {
      success: true,
      message:
        enrollments.length > 0
          ? `${enrollments.length} enrollment Bayar di Akhir berhasil disetujui.`
          : "Tidak ada enrollment Bayar di Akhir yang menunggu persetujuan.",
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
    const staffProfileId = await getEnrollmentStaffProfileId();
    const payments = await paymentService.approveAllPendingPayments(
      staffProfileId,
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

export async function approvePaymentAction(
  paymentId: string,
  enrollmentId: string,
) {
  try {
    const staffProfileId = await getEnrollmentStaffProfileId();
    await paymentService.approvePayment(paymentId, staffProfileId);
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    revalidateEnrollment(enrollmentId, enrollment?.course_id);

    return {
      success: true,
      message:
        enrollment?.payment_timing === "deferred"
          ? "Payment berhasil disetujui. Akses enrollment tetap aktif."
          : "Payment berhasil disetujui dan enrollment telah diaktifkan.",
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
    const staffProfileId = await getEnrollmentStaffProfileId();
    await paymentService.rejectPayment(paymentId, staffProfileId, notes);
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    revalidateEnrollment(enrollmentId, enrollment?.course_id);

    return {
      success: true,
      message:
        enrollment?.payment_timing === "deferred"
          ? "Payment berhasil ditolak. Akses course peserta tetap aktif."
          : "Payment berhasil ditolak.",
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

export async function activateEnrollmentAction(enrollmentId: string) {
  try {
    await leaderAccessService.requireStaffPermission("manage_enrollment");
    const enrollment = await enrollmentService.activateEnrollment(enrollmentId);
    revalidateEnrollment(enrollmentId, enrollment.course_id);

    return {
      success: true,
      message: "Enrollment berhasil diaktifkan.",
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

export async function cancelEnrollmentAction(enrollmentId: string) {
  try {
    await leaderAccessService.requireStaffPermission("manage_enrollment");
    const enrollment = await enrollmentService.cancelEnrollment(enrollmentId);
    revalidateEnrollment(enrollmentId, enrollment.course_id);

    return {
      success: true,
      message: "Enrollment berhasil dibatalkan.",
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
    await leaderAccessService.requireStaffPermission("manage_enrollment");
    const enrollment = await enrollmentService.updateCategory(
      enrollmentId,
      category,
    );
    revalidateEnrollment(enrollmentId, enrollment.course_id);

    return {
      success: true,
      message: "Kategori enrollment berhasil diperbarui.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui kategori enrollment.",
    };
  }
}

export async function updateEnrollmentPaymentTimingAction(
  enrollmentId: string,
  paymentTiming: PaymentTiming,
) {
  try {
    await getEnrollmentStaffProfileId();
    const enrollment = await enrollmentService.updatePaymentTiming(
      enrollmentId,
      paymentTiming,
    );
    revalidateEnrollment(enrollmentId, enrollment.course_id);

    return {
      success: true,
      message: "Kategori pembayaran berhasil diperbarui dan dicatat.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui kategori pembayaran.",
    };
  }
}


export async function createEnrollmentAction(formData: FormData) {
  try {
    await leaderAccessService.requireStaffPermission("manage_enrollment");

    const phone = String(formData.get("phone") ?? "").trim();
    const courseId = String(formData.get("course_id") ?? "").trim();
    const category = String(formData.get("category") ?? "regular");
    const paymentTiming = String(
      formData.get("payment_timing") ?? "upfront",
    );

    if (!phone || !courseId) {
      throw new Error("Nomor WhatsApp dan Course wajib diisi.");
    }
    if (category !== "regular" && category !== "separated") {
      throw new Error("Kategori enrollment tidak valid.");
    }
    if (paymentTiming !== "upfront" && paymentTiming !== "deferred") {
      throw new Error("Kategori pembayaran tidak valid.");
    }

    const [student, course] = await Promise.all([
      leaderAccessService.findStudentForEnrollmentByPhone(phone),
      courseService.getCourseById(courseId),
    ]);

    if (!student) {
      throw new Error(
        "Peserta aktif dengan nomor WhatsApp tersebut tidak ditemukan.",
      );
    }
    if (!course || course.status !== "active") {
      throw new Error("Course aktif tidak ditemukan atau berada di luar scope.");
    }
    if (
      paymentTiming === "deferred" &&
      course.payment_policy !== "upfront_or_deferred"
    ) {
      throw new Error("Course ini hanya mendukung pembayaran di awal.");
    }

    const enrollment = await enrollmentService.createEnrollment({
      profile_id: student.id,
      course_id: course.id,
      price_snapshot: course.is_free ? 0 : course.price,
      discount_amount: 0,
      category,
      payment_timing: paymentTiming,
    });

    revalidateEnrollment(enrollment.id, enrollment.course_id);

    return {
      success: true,
      message: "Enrollment berhasil dibuat.",
      enrollmentId: enrollment.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Enrollment gagal dibuat.",
      enrollmentId: null,
    };
  }
}
