"use server";

import { redirect } from "next/navigation";

import { folderService } from "@/services";

export async function createMentorFolderAction(
  formData: FormData,
): Promise<void> {
  const courseId = String(
    formData.get("course_id") ?? "",
  );
  const title = String(
    formData.get("title") ?? "",
  ).trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  if (!courseId) {
    throw new Error("Course tidak ditemukan.");
  }

  if (!title) {
    throw new Error("Nama Folder wajib diisi.");
  }

  await folderService.createFolder({
    course_id: courseId,
    title,
    slug: "",
    description,
    publication_status: "published",
  });

  redirect(
    `/dashboard/mentor/course/${courseId}/explorer`,
  );
}
