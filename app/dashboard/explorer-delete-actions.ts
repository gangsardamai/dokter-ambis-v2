"use server";

import { revalidatePath } from "next/cache";

import {
  folderService,
  lessonFileService,
  lessonService,
  profileService,
} from "@/services";

type ManagerRole = "admin" | "mentor";
type ExplorerResourceType = "folder" | "lesson" | "file";

interface DeleteExplorerItemInput {
  managerRole: ManagerRole;
  resourceType: ExplorerResourceType;
  courseId: string;
  itemId: string;
}

export interface DeleteExplorerItemResult {
  success: boolean;
  message: string;
}

function getSuccessMessage(
  resourceType: ExplorerResourceType,
): string {
  switch (resourceType) {
    case "folder":
      return "Folder berhasil dihapus.";
    case "lesson":
      return "Lesson dan seluruh kontennya berhasil dihapus.";
    case "file":
      return "File berhasil dihapus.";
  }
}

export async function deleteExplorerItemAction(
  input: DeleteExplorerItemInput,
): Promise<DeleteExplorerItemResult> {
  try {
    const courseId = input.courseId.trim();
    const itemId = input.itemId.trim();
    const profile = await profileService.getCurrentProfile();

    if (!courseId || !itemId) {
      throw new Error("Data yang akan dihapus tidak lengkap.");
    }

    if (
      !profile ||
      profile.status !== "active" ||
      profile.role !== input.managerRole
    ) {
      throw new Error(
        "Anda tidak memiliki izin untuk melakukan penghapusan ini.",
      );
    }

    switch (input.resourceType) {
      case "folder":
        await folderService.deleteFolder(itemId, courseId);
        break;
      case "lesson":
        await lessonService.deleteLesson(itemId, courseId);
        break;
      case "file":
        await lessonFileService.deleteFile(itemId, courseId);
        break;
    }

    revalidatePath(
      `/dashboard/${input.managerRole}/course/${courseId}/explorer`,
    );

    if (input.resourceType === "file") {
      revalidatePath("/dashboard/admin/file");
      revalidatePath(`/dashboard/admin/file/${itemId}`);
    }

    return {
      success: true,
      message: getSuccessMessage(input.resourceType),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Data gagal dihapus.",
    };
  }
}
