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

  const slug = String(
    formData.get("slug") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const lessonOrder = Number(
    formData.get("lesson_order") ?? 1,
  );

  const duration = Number(
    formData.get("duration") ?? 1,
  );

  const isFree =
    formData.get("is_free") === "on";

  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!folderId) {
    throw new Error("Folder tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Judul Lesson wajib diisi.");
  }

  if (!slug) {
    throw new Error("Slug wajib diisi.");
  }

  await lessonService.updateLesson(
    lessonId,
    {
      folder_id: folderId,
      title,
      slug,
      description,
      lesson_order: lessonOrder,
      duration,
      is_free: isFree,
      is_required:
        formData.get("is_required") === "on",
      publication_status: String(
        formData.get("publication_status") ?? "draft",
      ),
    },
  );

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );

}