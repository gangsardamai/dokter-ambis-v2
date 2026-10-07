"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";
import { courseCommunityLinkService } from "@/services";

export async function joinWhatsAppGroupAction(
  enrollmentId: string,
  courseId: string,
): Promise<void> {
  const [supabase, whatsappGroupUrl] = await Promise.all([
    createClient(),
    courseCommunityLinkService.getWhatsAppGroupUrl(courseId),
  ]);

  if (!whatsappGroupUrl) {
    throw new Error("Link grup WhatsApp course belum tersedia.");
  }

  await callDynamicRpc<string>(supabase, "student_confirm_whatsapp_joined", {
    target_enrollment_id: enrollmentId,
  });

  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  redirect(whatsappGroupUrl);
}
