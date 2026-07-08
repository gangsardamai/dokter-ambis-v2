"use server";

import { revalidatePath } from "next/cache";

import { lessonService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type LessonInsert =
  Database["public"]["Tables"]["lessons"]["Insert"];

type LessonUpdate =
  Database["public"]["Tables"]["lessons"]["Update"];

export async function createLessonAction(
  data: LessonInsert
) {

  await lessonService.createLesson(data);

  revalidatePath("/dashboard/admin/lesson");

}

export async function updateLessonAction(
  id: string,
  data: LessonUpdate
) {

  await lessonService.updateLesson(
    id,
    data
  );

  revalidatePath("/dashboard/admin/lesson");
  revalidatePath(
    `/dashboard/admin/lesson/${id}`
  );

}

export async function deleteLessonAction(
  id: string
) {

  await lessonService.deleteLesson(id);

  revalidatePath("/dashboard/admin/lesson");

}