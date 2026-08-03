"use server";

import { redirect } from "next/navigation";

import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";
import type { PaymentTiming } from "@/supabase/types/payment-account.types";

function getRoleDashboard(role: string): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "mentor":
      return "/dashboard/mentor";
    case "student":
      return "/dashboard/student";
    default:
      return "/login";
  }
}

function getRequestedPaymentTiming(
  formData: FormData,
): PaymentTiming {
  return formData.get("paymentTiming") === "deferred"
    ? "deferred"
    : "upfront";
}

export async function enrollCourseAction(
  courseId: string,
  formData: FormData,
): Promise<void> {
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  if (profile.status !== "active" || profile.role !== "student") {
    redirect(getRoleDashboard(profile.role));
  }

  const course = await courseService.getAvailableCourseDetailById(courseId);

  if (!course) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Blok pembelajaran tidak ditemukan atau sudah tidak aktif.",
      )}`,
    );
  }

  const existingEnrollment = await enrollmentService.getExistingEnrollment(
    profile.id,
    course.id,
  );

  if (
    existingEnrollment &&
    existingEnrollment.status !== "cancelled" &&
    existingEnrollment.status !== "expired"
  ) {
    if (existingEnrollment.status === "active") {
      redirect(`/dashboard/student/my-course/${course.id}`);
    }

    if (existingEnrollment.payment_timing === "deferred") {
      redirect(
        `/dashboard/student/enrollment/${existingEnrollment.id}/submitted`,
      );
    }

    redirect(`/dashboard/student/payment/${existingEnrollment.id}`);
  }

  const requestedTiming = getRequestedPaymentTiming(formData);
  const paymentTiming: PaymentTiming =
    course.payment_policy === "upfront_or_deferred"
      ? requestedTiming
      : "upfront";

  const enrollment = await enrollmentService.createEnrollment({
    profile_id: profile.id,
    course_id: course.id,
    price_snapshot: course.is_free ? 0 : course.price,
    discount_amount: 0,
    category: "regular",
    payment_timing: paymentTiming,
    status: paymentTiming === "deferred" ? "pending_approval" : "pending_payment",
  });

  if (paymentTiming === "deferred") {
    redirect(`/dashboard/student/enrollment/${enrollment.id}/submitted`);
  }

  redirect(`/dashboard/student/payment/${enrollment.id}`);
}
