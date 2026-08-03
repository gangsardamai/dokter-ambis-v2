"use server";

import { redirect } from "next/navigation";

import { lessonService } from "@/services";

export async function updateLessonFormAction(
  lessonId: string,
  formData: FormData,
): Promise<void> {
  const courseId = String(
    formData.get("course_id") ?? "",
  );
  const folderId = String(
    formData.get("folder_id") ?? "",
  );
  const title = String(
    formData.get("title") ?? "",
  ).trim();
  const lessonOrder = Number(
    formData.get("lesson_order") ?? 1,
  );

  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!folderId) {
    throw new Error("Folder tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Judul Lesson wajib diisi.");
  }

  await lessonService.updateLesson(lessonId, {
    folder_id: folderId,
    title,
    description: String(
      formData.get("description") ?? "",
    ).trim(),
    lesson_order: lessonOrder,
    is_free: formData.get("is_free") === "on",
    is_required:
      formData.get("is_required") === "on",
    publication_status: String(
      formData.get("publication_status") ?? "draft",
    ),
  });

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );
}
