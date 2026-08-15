"use server";

import { revalidatePath } from "next/cache";

import {
  courseExplorerService,
  mentorCourseAccessService,
  profileService,
} from "@/services";

export type ExplorerManagerRole = "admin" | "mentor";

export interface LessonOrderGroupInput {
  folderId: string | null;
  lessonIds: string[];
}

export interface SaveExplorerOrderInput {
  managerRole: ExplorerManagerRole;
  courseId: string;
  folderIds: string[];
  lessonGroups: LessonOrderGroupInput[];
}

export interface SaveExplorerOrderResult {
  success: boolean;
  message: string;
}

export async function saveExplorerOrderAction(
  input: SaveExplorerOrderInput,
): Promise<SaveExplorerOrderResult> {
  try {
    const courseId = input.courseId.trim();
    const profile = await profileService.getCurrentProfile();

    if (!courseId) {
      throw new Error("Course tidak ditemukan.");
    }

    if (
      !profile ||
      profile.status !== "active" ||
      profile.role !== input.managerRole
    ) {
      throw new Error(
        "Anda tidak memiliki izin untuk mengubah susunan course ini.",
      );
    }

    if (input.managerRole === "mentor") {
      await mentorCourseAccessService.requireAssigned(
        profile.id,
        courseId,
      );
    }

    await courseExplorerService.saveCourseStructureOrder(
      courseId,
      {
        folderIds: input.folderIds,
        lessonGroups: input.lessonGroups,
      },
    );

    revalidatePath(
      `/dashboard/admin/course/${courseId}/explorer`,
    );
    revalidatePath(
      `/dashboard/mentor/course/${courseId}/explorer`,
    );
    revalidatePath(`/dashboard/student/course/${courseId}`);

    return {
      success: true,
      message: "Urutan berhasil disimpan.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Urutan gagal disimpan.",
    };
  }
}
