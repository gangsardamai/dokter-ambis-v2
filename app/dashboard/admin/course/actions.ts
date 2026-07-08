"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { courseService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

/* ========================================
   CREATE
======================================== */

export async function createCourseAction(
  data: CourseInsert
) {
  await courseService.createCourse(data);

  revalidatePath(
    "/dashboard/admin/course"
  );

  redirect(
    "/dashboard/admin/course"
  );
}

/* ========================================
   UPDATE
======================================== */

export async function updateCourseAction(
  id: string,
  data: CourseUpdate
) {
  await courseService.updateCourse(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/course"
  );

  redirect(
    "/dashboard/admin/course"
  );
}

/* ========================================
   DELETE
======================================== */

export async function deleteCourseAction(
  id: string
) {
  await courseService.deleteCourse(
    id
  );

  revalidatePath(
    "/dashboard/admin/course"
  );
}