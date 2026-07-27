"use server";

import { revalidatePath } from "next/cache";

import {
  enrollmentService,
  profileService,
  studentCourseProgressService,
} from "@/services";

export async function toggleLessonCompletionAction(
  courseId: string,
  lessonId: string,
): Promise<{ completed: boolean }> {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.role !== "student") {
    throw new Error("Sesi peserta tidak tersedia.");
  }

  const enrollment = await enrollmentService.getActiveCourseEnrollment(
    profile.id,
    courseId,
  );

  if (!enrollment) {
    throw new Error("Anda tidak memiliki akses aktif ke course ini.");
  }

  const completed =
    await studentCourseProgressService.toggleLessonCompletion(
      profile.id,
      courseId,
      lessonId,
    );

  revalidatePath(`/dashboard/student/my-course/${courseId}`);

  return { completed };
}
