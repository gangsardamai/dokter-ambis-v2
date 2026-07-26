"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getTryoutFormError,
  parseTryoutForm,
  parseTryoutQuestionForm,
} from "@/lib/forms/tryout";
import { profileService, tryoutService } from "@/services";
import type { UpdateTryoutInput } from "@/types/tryout";

async function requireAdminProfile() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Akses Admin diperlukan.");
  }
  return profile;
}

export async function createTryoutAction(formData: FormData) {
  let tryoutId = "";

  try {
    const profile = await requireAdminProfile();
    const created = await tryoutService.createTryout({
      ...parseTryoutForm(formData),
      createdBy: profile.id,
    });
    tryoutId = created.id;
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/new?error=${encodeURIComponent(
        getTryoutFormError(error),
      )}`,
    );
  }

  revalidatePath("/dashboard/admin/tryout");
  redirect(`/dashboard/admin/tryout/${tryoutId}/questions?created=true`);
}

export async function updateTryoutAction(
  tryoutId: string,
  formData: FormData,
) {
  try {
    await requireAdminProfile();
    const input: UpdateTryoutInput = parseTryoutForm(formData);
    await tryoutService.updateTryout(tryoutId, input);
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/${tryoutId}/edit?error=${encodeURIComponent(
        getTryoutFormError(error),
      )}`,
    );
  }

  revalidatePath("/dashboard/admin/tryout");
  revalidatePath(`/dashboard/admin/tryout/${tryoutId}/edit`);
  redirect(`/dashboard/admin/tryout/${tryoutId}/edit?saved=true`);
}

export async function deleteTryoutAction(tryoutId: string) {
  await requireAdminProfile();
  await tryoutService.deleteTryout(tryoutId);
  revalidatePath("/dashboard/admin/tryout");
  redirect("/dashboard/admin/tryout?deleted=true");
}

export async function createTryoutQuestionAction(
  tryoutId: string,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminProfile();
    await tryoutService.createQuestion(
      parseTryoutQuestionForm(tryoutId, formData),
    );
    revalidatePath(`/dashboard/admin/tryout/${tryoutId}/questions`);
    return { success: true, message: "Soal berhasil ditambahkan." };
  } catch (error) {
    return { success: false, message: getTryoutFormError(error) };
  }
}

export async function updateTryoutQuestionAction(
  tryoutId: string,
  questionId: string,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminProfile();
    const { tryoutId: _ignored, ...input } = parseTryoutQuestionForm(
      tryoutId,
      formData,
    );
    void _ignored;
    await tryoutService.updateQuestion(questionId, input);
    revalidatePath(`/dashboard/admin/tryout/${tryoutId}/questions`);
    return { success: true, message: "Perubahan soal berhasil disimpan." };
  } catch (error) {
    return { success: false, message: getTryoutFormError(error) };
  }
}

export async function deleteTryoutQuestionAction(
  tryoutId: string,
  questionId: string,
) {
  await requireAdminProfile();
  await tryoutService.deleteQuestion(questionId);
  revalidatePath(`/dashboard/admin/tryout/${tryoutId}/questions`);
  redirect(`/dashboard/admin/tryout/${tryoutId}/questions?deleted=true`);
}
