"use server";

import { redirect } from "next/navigation";

import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

function getRoleDashboard(
  role: string,
): string {
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

export async function enrollCourseAction(
  courseId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (
    profile.status !== "active" ||
    profile.role !== "student"
  ) {
    redirect(
      getRoleDashboard(profile.role),
    );
  }

  const course =
    await courseService
      .getAvailableCourseDetailById(
        courseId,
      );

  if (!course) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Blok pembelajaran tidak ditemukan atau sudah tidak aktif.",
      )}`,
    );
  }

  const existingEnrollment =
    await enrollmentService
      .getExistingEnrollment(
        profile.id,
        course.id,
      );

  if (
    existingEnrollment &&
    existingEnrollment.status !== "cancelled" &&
    existingEnrollment.status !== "expired"
  ) {
    redirect(
      `/dashboard/student/payment/${existingEnrollment.id}`,
    );
  }

  const enrollment =
    await enrollmentService.createEnrollment({
      profile_id: profile.id,
      course_id: course.id,
      price_snapshot:
        course.is_free
          ? 0
          : course.price,
      discount_amount: 0,
      category: "regular",
      status: "pending_payment",
    });

  redirect(
    `/dashboard/student/payment/${enrollment.id}`,
  );
}