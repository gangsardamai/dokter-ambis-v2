"use server";

import { redirect } from "next/navigation";

import { lessonService } from "@/services";

export async function createLessonFormAction(
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
  const duration = Number(
    formData.get("duration") ?? 1,
  );
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

  if (!slug) {
    throw new Error("Slug wajib diisi.");
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error(
      "Durasi Lesson harus lebih dari 0 menit.",
    );
  }

  await lessonService.createLessonWithNextOrder({
    course_id: courseId,
    folder_id: folderId,
    title,
    slug,
    description,
    duration,
    is_free: formData.get("is_free") === "on",
    is_required:
      formData.get("is_required") === "on",
    publication_status: publicationStatus,
  });

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );
}