"use server";

import { revalidatePath } from "next/cache";

import { failure, success } from "@/lib/actions/result";
import {
  coursePinService,
  courseService,
  profileService,
} from "@/services";

import type { ActionResult } from "@/types/action-result";

export async function setCoursePinAction(
  courseId: string,
  pinned: boolean,
): Promise<ActionResult> {
  try {
    const profile = await profileService.getCurrentProfile();
    if (!profile) {
      return failure("Sesi tidak ditemukan. Silakan login kembali.");
    }

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return failure("Course tidak ditemukan.");
    }

    if (pinned) {
      await coursePinService.pinCourse(profile.id, courseId);
    } else {
      await coursePinService.unpinCourse(profile.id, courseId);
    }

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/mentor");
    revalidatePath("/dashboard/admin/course");

    return success(
      pinned
        ? "Course berhasil dipin."
        : "Pin course berhasil dilepas.",
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Gagal memperbarui pin course.",
    );
  }
}
