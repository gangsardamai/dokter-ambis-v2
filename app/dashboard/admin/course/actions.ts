"use server";

import { revalidatePath } from "next/cache";

import { courseService } from "@/services";

import { validateCourse } from "@/lib/validators/course.validator";

import {
  success,
  failure,
} from "@/lib/actions/result";

import type { ActionResult } from "@/types/action-result";
import type { Database } from "@/supabase/types/database.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

export async function createCourseAction(
  data: CourseInsert
): Promise<ActionResult> {

  const validation = validateCourse({
    title: data.title,
    slug: data.slug,
    organization_id: data.organization_id,
    program_id: data.program_id,
    price: Number(data.price),
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  await courseService.createCourse(data);

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil dibuat.");
}

export async function updateCourseAction(
  id: string,
  data: CourseUpdate
): Promise<ActionResult> {

  const validation = validateCourse({
    title: data.title ?? "",
    slug: data.slug ?? "",
    organization_id: data.organization_id ?? "",
    program_id: data.program_id ?? "",
    price: Number(data.price ?? 0),
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  await courseService.updateCourse(
    id,
    data
  );

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil diperbarui.");
}

export async function deleteCourseAction(
  id: string
): Promise<ActionResult> {

  await courseService.deleteCourse(id);

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil dihapus.");
}
export async function deleteCourseFormAction(
  formData: FormData
): Promise<void> {

  const id = formData.get("id") as string;

  await deleteCourseAction(id);

}