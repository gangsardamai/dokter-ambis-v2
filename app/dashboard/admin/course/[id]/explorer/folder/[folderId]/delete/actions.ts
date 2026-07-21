"use server";

import { redirect } from "next/navigation";

import { folderService } from "@/services";

export async function deleteFolderAction(
  courseId: string,
  folderId: string
) {
  await folderService.deleteFolder(folderId);

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`
  );
}