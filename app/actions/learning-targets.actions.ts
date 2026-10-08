"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileService, enrollmentService } from "@/services";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function saveLearningTargetsAction(courseId: string, folderIds: string[]): Promise<void> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.status !== "active") throw new Error("Sesi akun tidak aktif.");
  const enrollment = await enrollmentService.getActiveCourseEnrollment(profile.id, courseId);
  if (!enrollment) throw new Error("Tidak memiliki akses ke course ini.");
  if (!Array.isArray(folderIds) || folderIds.length > 100 || folderIds.some(id => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
    throw new Error("Pilihan folder tidak valid.");
  }
  const supabase = await createClient();
  const validFolders = await supabase.from("lesson_folders").select("id").eq("course_id", courseId).eq("publication_status", "published");
  if (validFolders.error) throw new Error("Gagal memvalidasi folder.");
  const allowed = new Set((validFolders.data ?? []).map(folder => folder.id));
  const unique = [...new Set(folderIds)];
  if (unique.some(id => !allowed.has(id))) throw new Error("Ada folder yang tidak tersedia.");
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.from("student_learning_targets").upsert({
    profile_id: profile.id, course_id: courseId, folder_ids: unique, updated_at: new Date().toISOString()
  }, { onConflict: "profile_id,course_id" });
  if (error) throw new Error("Gagal menyimpan pilihan monitoring.");
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
}
