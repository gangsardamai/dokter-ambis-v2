"use server";

import { revalidatePath } from "next/cache";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

export async function confirmWhatsAppJoinedAction(
  enrollmentId: string,
  courseId: string,
): Promise<void> {
  const supabase = await createClient();

  await callDynamicRpc<string>(supabase, "student_confirm_whatsapp_joined", {
    target_enrollment_id: enrollmentId,
  });

  revalidatePath(`/dashboard/student/my-course/${courseId}`);
}
