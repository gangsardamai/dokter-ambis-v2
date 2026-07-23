"use server";

import { redirect } from "next/navigation";

import { folderService } from "@/services";

export async function updateFolderFormAction(
  formData: FormData,
): Promise<void> {

  const id = String(
    formData.get("id") ?? "",
  );

  const courseId = String(
    formData.get("course_id") ?? "",
  );

  if (!id) {
    throw new Error("Folder tidak ditemukan.");
  }

  await folderService.updateFolder(
    id,
    {
      title: String(
        formData.get("title") ?? "",
      ).trim(),

      slug: String(
        formData.get("slug") ?? "",
      ).trim(),

      description: String(
        formData.get("description") ?? "",
      ).trim(),

      folder_order: Number(
        formData.get("folder_order") ?? 1,
      ),

      publication_status: String(
        formData.get("publication_status") ?? "draft",
      ),
    },
  );

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );

}