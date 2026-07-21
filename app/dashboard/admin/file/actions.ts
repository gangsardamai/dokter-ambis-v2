"use server";

import { revalidatePath } from "next/cache";

import { lessonFileService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type LessonFileInsert =
  Database["public"]["Tables"]["lesson_files"]["Insert"];

type LessonFileUpdate =
  Database["public"]["Tables"]["lesson_files"]["Update"];

export async function createFileAction(
  data: LessonFileInsert
) {

  await lessonFileService.createFile(data);

  revalidatePath("/dashboard/admin/file");

}

export async function updateFileAction(
  id: string,
  data: LessonFileUpdate
) {

  await lessonFileService.updateFile(
    id,
    data
  );

  revalidatePath("/dashboard/admin/file");
  revalidatePath(`/dashboard/admin/file/${id}`);

}

export async function deleteFileAction(
  id: string
) {

  await lessonFileService.deleteFile(id);

  revalidatePath("/dashboard/admin/file");

}