"use server";

import { redirect } from "next/navigation";

import { folderService } from "@/services";

export async function updateMentorFolderAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const courseId = String(
    formData.get("course_id") ?? "",
  );
  const title = String(
    formData.get("title") ?? "",
  ).trim();

  if (!id) {
    throw new Error("Folder tidak ditemukan.");
  }

  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Nama Folder wajib diisi.");
  }

  await folderService.updateFolder(id, {
    title,
    description: String(
      formData.get("description") ?? "",
    ).trim(),
    folder_order: Number(
      formData.get("folder_order") ?? 1,
    ),
    publication_status: String(
      formData.get("publication_status") ?? "draft",
    ),
  });

  redirect(
    `/dashboard/mentor/course/${courseId}/explorer`,
  );
}
