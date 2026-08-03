"use server";

import { redirect } from "next/navigation";

import { lessonService } from "@/services";

export async function createMentorLessonAction(
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
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  const publicationStatus = String(
    formData.get("publication_status") ?? "draft",
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

  await lessonService.createLessonWithNextOrder({
    course_id: courseId,
    folder_id: folderId,
    title,
    slug: "",
    description,
    duration: 1,
    is_free: formData.get("is_free") === "on",
    is_required:
      formData.get("is_required") === "on",
    publication_status: publicationStatus,
  });

  redirect(
    `/dashboard/mentor/course/${courseId}/explorer`,
  );
}
