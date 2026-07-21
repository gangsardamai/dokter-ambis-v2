"use server";

import { redirect } from "next/navigation";

import { lessonService } from "@/services";

export async function deleteLessonAction(
  courseId: string,
  lessonId: string,
) {

  await lessonService.deleteLesson(
    lessonId,
  );

  redirect(
    `/dashboard/admin/course/${courseId}/explorer`,
  );

}