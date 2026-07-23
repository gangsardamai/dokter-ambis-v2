"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateCourseMentorsAction(
  courseId: string,
  formData: FormData,
) {
  const mentorIds = formData
    .getAll("mentor_id")
    .map((value) => String(value))
    .filter(Boolean);
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "set_course_mentors",
    {
      target_course_id: courseId,
      target_mentor_ids: mentorIds,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/dashboard/admin/course/${courseId}`,
  );
  revalidatePath(
    `/dashboard/admin/course/${courseId}/mentors`,
  );

  redirect(`/dashboard/admin/course/${courseId}`);
}
