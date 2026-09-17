"use server";

import { revalidatePath } from "next/cache";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, name: string): string {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`${name} wajib diisi.`);
  }

  return text;
}

export async function saveMentorReviewAction(formData: FormData): Promise<void> {
  const courseId = getRequiredString(formData, "courseId");
  const mentorId = getRequiredString(formData, "mentorId");
  const rating = Number(getRequiredString(formData, "rating"));
  const suggestionValue = formData.get("suggestion");
  const suggestion =
    typeof suggestionValue === "string" ? suggestionValue.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Pilih bintang 1 sampai 5.");
  }

  if (suggestion.length > 500) {
    throw new Error("Saran maksimal 500 karakter.");
  }

  const supabase = await createClient();
  await callDynamicRpc<void>(supabase, "save_mentor_review", {
    target_course_id: courseId,
    target_mentor_id: mentorId,
    target_rating: rating,
    target_suggestion: suggestion || null,
  });

  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath(`/dashboard/admin/course/${courseId}`);
  revalidatePath("/dashboard/admin/mentor");
  revalidatePath("/dashboard/mentor/ratings");
}

export async function setMentorRatingEnabledAction(
  formData: FormData,
): Promise<void> {
  const courseId = getRequiredString(formData, "courseId");
  const enabled = getRequiredString(formData, "enabled") === "true";
  const supabase = await createClient();

  await callDynamicRpc<void>(supabase, "admin_set_mentor_rating_enabled", {
    target_course_id: courseId,
    target_enabled: enabled,
  });

  revalidatePath("/dashboard/admin/course");
  revalidatePath(`/dashboard/admin/course/${courseId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
}

export async function setMentorAssignmentAction(
  formData: FormData,
): Promise<void> {
  const mentorProfileId = getRequiredString(formData, "mentorProfileId");
  const courseId = getRequiredString(formData, "courseId");
  const active = getRequiredString(formData, "active") === "true";
  const supabase = await createClient();

  await callDynamicRpc<void>(supabase, "admin_set_mentor_assignment", {
    target_profile_id: mentorProfileId,
    target_course_id: courseId,
    target_active: active,
  });

  revalidatePath("/dashboard/admin/mentor");
  revalidatePath(`/dashboard/admin/mentor/${mentorProfileId}`);
  revalidatePath(`/dashboard/admin/course/${courseId}`);
  revalidatePath(`/dashboard/admin/course/${courseId}/mentors`);
  revalidatePath("/dashboard/mentor");
  revalidatePath("/dashboard/mentor/ratings");
}
