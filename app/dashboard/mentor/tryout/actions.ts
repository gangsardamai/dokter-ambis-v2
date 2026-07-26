"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getTryoutFormError,
  parseTryoutForm,
  parseTryoutQuestionForm,
} from "@/lib/forms/tryout";
import {
  mentorCourseAccessService,
  profileService,
  tryoutService,
} from "@/services";
import type { UpdateTryoutInput } from "@/types/tryout";

async function requireMentorProfile() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") {
    throw new Error("Akses Mentor diperlukan.");
  }
  return profile;
}

async function requireOwnedTryout(profileId: string, tryoutId: string) {
  return tryoutService.requireMentorTryoutAccess(profileId, tryoutId);
}

export async function createMentorTryoutAction(formData: FormData) {
  let tryoutId = "";

  try {
    const profile = await requireMentorProfile();
    const input = parseTryoutForm(formData);
    await mentorCourseAccessService.requireAssigned(profile.id, input.courseId);

    const created = await tryoutService.createTryout({
      ...input,
      createdBy: profile.id,
    });
    tryoutId = created.id;
  } catch (error) {
    redirect(
      `/dashboard/mentor/tryout/new?error=${encodeURIComponent(
        getTryoutFormError(error),
      )}`,
    );
  }

  revalidatePath("/dashboard/mentor/tryout");
  redirect(`/dashboard/mentor/tryout/${tryoutId}/questions?created=true`);
}

export async function updateMentorTryoutAction(
  tryoutId: string,
  formData: FormData,
) {
  try {
    const profile = await requireMentorProfile();
    await requireOwnedTryout(profile.id, tryoutId);
    const input: UpdateTryoutInput = parseTryoutForm(formData);
    await mentorCourseAccessService.requireAssigned(profile.id, input.courseId);
    await tryoutService.updateTryout(tryoutId, input);
  } catch (error) {
    redirect(
      `/dashboard/mentor/tryout/${tryoutId}/edit?error=${encodeURIComponent(
        getTryoutFormError(error),
      )}`,
    );
  }

  revalidatePath("/dashboard/mentor/tryout");
  revalidatePath(`/dashboard/mentor/tryout/${tryoutId}/edit`);
  redirect(`/dashboard/mentor/tryout/${tryoutId}/edit?saved=true`);
}

export async function deleteMentorTryoutAction(tryoutId: string) {
  const profile = await requireMentorProfile();
  await requireOwnedTryout(profile.id, tryoutId);
  await tryoutService.deleteTryout(tryoutId);
  revalidatePath("/dashboard/mentor/tryout");
  redirect("/dashboard/mentor/tryout?deleted=true");
}

export async function createMentorTryoutQuestionAction(
  tryoutId: string,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const profile = await requireMentorProfile();
    await requireOwnedTryout(profile.id, tryoutId);
    await tryoutService.createQuestion(
      parseTryoutQuestionForm(tryoutId, formData),
    );
    revalidatePath(`/dashboard/mentor/tryout/${tryoutId}/questions`);
    return { success: true, message: "Soal berhasil ditambahkan." };
  } catch (error) {
    return { success: false, message: getTryoutFormError(error) };
  }
}

export async function updateMentorTryoutQuestionAction(
  tryoutId: string,
  questionId: string,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const profile = await requireMentorProfile();
    await requireOwnedTryout(profile.id, tryoutId);
    const { tryoutId: _ignored, ...input } = parseTryoutQuestionForm(
      tryoutId,
      formData,
    );
    void _ignored;
    await tryoutService.updateQuestion(questionId, input);
    revalidatePath(`/dashboard/mentor/tryout/${tryoutId}/questions`);
    return { success: true, message: "Perubahan soal berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getTryoutFormError(error) };
  }
}

export async function deleteMentorTryoutQuestionAction(
  tryoutId: string,
  questionId: string,
) {
  const profile = await requireMentorProfile();
  await requireOwnedTryout(profile.id, tryoutId);
  await tryoutService.deleteQuestion(questionId);
  revalidatePath(`/dashboard/mentor/tryout/${tryoutId}/questions`);
  redirect(`/dashboard/mentor/tryout/${tryoutId}/questions?deleted=true`);
}
