"use server";

import { redirect } from "next/navigation";

import { folderService } from "@/services";

export async function createFolderFormAction(
  formData: FormData,
): Promise<void> {

  const courseId = String(
    formData.get("course_id") ?? "",
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

  const folderOrder = Number(
    formData.get("folder_order") ?? 1,
  );

  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Nama Folder wajib diisi.");
  }

  if (!slug) {
    throw new Error("Slug wajib diisi.");
  }

  await folderService.createFolder({
    course_id: courseId,
    title,
    slug,
    description,
    folder_order: folderOrder,
    publication_status: String(
      formData.get("publication_status") ?? "draft",
    ),
  });

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );
}