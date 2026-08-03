"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { lessonService } from "@/services";

export async function updateMentorLessonAction(
  courseId: string,
  lessonId: string,
  formData: FormData,
): Promise<void> {
  const title = String(
    formData.get("title") ?? "",
  ).trim();

  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!lessonId) {
    throw new Error("Lesson tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Judul Lesson wajib diisi.");
  }

  const lesson = await lessonService.getLessonById(lessonId);

  if (!lesson || lesson.course_id !== courseId) {
    throw new Error(
      "Lesson tidak ditemukan atau tidak termasuk dalam course ini.",
    );
  }

  await lessonService.updateLesson(lessonId, {
    title,
    description: String(
      formData.get("description") ?? "",
    ).trim(),
    lesson_order: Number(
      formData.get("lesson_order") ?? 1,
    ),
    is_free: formData.get("is_free") === "on",
    is_required:
      formData.get("is_required") === "on",
    publication_status: String(
      formData.get("publication_status") ?? "draft",
    ),
  });

  const explorerPath =
    `/dashboard/mentor/course/${courseId}/explorer`;

  revalidatePath(explorerPath);
  redirect(explorerPath);
}
