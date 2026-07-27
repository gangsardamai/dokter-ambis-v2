"use server";

import { redirect } from "next/navigation";

import { profileService, tryoutService } from "@/services";
import type { TryoutResultPayload } from "@/types/tryout";

async function requireStudent() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") {
    throw new Error("Akses peserta diperlukan.");
  }
  return profile;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

export async function startTryoutAction(tryoutId: string) {
  let attemptId = "";

  try {
    await requireStudent();
    const result = await tryoutService.startAttempt(tryoutId);
    attemptId = result.attempt_id;
  } catch (error) {
    redirect(
      `/dashboard/student/tryout/${tryoutId}?error=${encodeURIComponent(
        getErrorMessage(error),
      )}`,
    );
  }

  redirect(`/dashboard/student/tryout/attempt/${attemptId}`);
}

export async function saveTryoutAnswerAction(input: {
  attemptId: string;
  questionId: string;
  optionId: string | null;
  markedForReview: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireStudent();
    await tryoutService.saveAnswer(
      input.attemptId,
      input.questionId,
      input.optionId,
      input.markedForReview,
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function submitTryoutAction(
  attemptId: string,
): Promise<{
  success: boolean;
  result?: TryoutResultPayload;
  error?: string;
}> {
  try {
    await requireStudent();
    const result = await tryoutService.submitAttempt(attemptId);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
