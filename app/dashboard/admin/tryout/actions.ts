"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { profileService, tryoutService } from "@/services";

import type {
  CreateTryoutInput,
  CreateTryoutQuestionInput,
  UpdateTryoutInput,
} from "@/types/tryout";
import type {
  TryoutDifficulty,
  TryoutPublicationStatus,
  TryoutResultReleaseMode,
  TryoutReviewReleaseMode,
} from "@/supabase/types/tryout.types";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getInteger(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const parsed = Number.parseInt(getString(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseWibDateTime(value: string): string | null {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+07:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal atau waktu tidak valid.");
  }

  return date.toISOString();
}

async function requireAdminProfile() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Akses Admin diperlukan.");
  }
  return profile;
}

function getTryoutInput(
  formData: FormData,
): Omit<CreateTryoutInput, "createdBy"> {
  const courseId = getString(formData, "courseId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const durationMinutes = getInteger(formData, "durationMinutes", 120);
  const maxAttempts = getInteger(formData, "maxAttempts", 1);
  const passingScore = getInteger(formData, "passingScore", 70);
  const openAt = parseWibDateTime(getString(formData, "openAt"));
  const closeAt = parseWibDateTime(getString(formData, "closeAt"));
  const resultReleaseMode = getString(
    formData,
    "resultReleaseMode",
  ) as TryoutResultReleaseMode;
  const reviewReleaseMode = getString(
    formData,
    "reviewReleaseMode",
  ) as TryoutReviewReleaseMode;
  const publicationStatus = getString(
    formData,
    "publicationStatus",
  ) as TryoutPublicationStatus;

  if (!courseId || !title) {
    throw new Error("Course dan judul Try Out wajib diisi.");
  }
  if (durationMinutes < 1 || durationMinutes > 600) {
    throw new Error("Durasi Try Out harus antara 1–600 menit.");
  }
  if (maxAttempts < 1 || maxAttempts > 10) {
    throw new Error("Jumlah percobaan harus antara 1–10.");
  }
  if (passingScore < 0 || passingScore > 100) {
    throw new Error("Nilai lulus harus antara 0–100.");
  }
  if (openAt && closeAt && new Date(closeAt) <= new Date(openAt)) {
    throw new Error("Waktu tutup harus setelah waktu buka.");
  }
  if (
    !closeAt &&
    (resultReleaseMode === "after_close" ||
      reviewReleaseMode === "after_close")
  ) {
    throw new Error(
      "Waktu tutup wajib diisi jika nilai atau pembahasan dirilis setelah periode berakhir.",
    );
  }

  return {
    courseId,
    title,
    description,
    durationMinutes,
    maxAttempts,
    passingScore,
    openAt,
    closeAt,
    resultReleaseMode,
    reviewReleaseMode,
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    publicationStatus,
  };
}

function getQuestionInput(
  tryoutId: string,
  formData: FormData,
): CreateTryoutQuestionInput {
  const options = ["optionA", "optionB", "optionC", "optionD", "optionE"]
    .map((key) => getString(formData, key))
    .filter(Boolean);
  const correctOptionIndex = getInteger(
    formData,
    "correctOptionIndex",
    1,
  );

  const input: CreateTryoutQuestionInput = {
    tryoutId,
    question: getString(formData, "question"),
    explanation: getString(formData, "explanation"),
    topic: getString(formData, "topic") || "Umum",
    difficulty: getString(formData, "difficulty") as TryoutDifficulty,
    points: getInteger(formData, "points", 1),
    options,
    correctOptionIndex,
  };

  if (!input.question) {
    throw new Error("Pertanyaan wajib diisi.");
  }
  if (options.length < 2) {
    throw new Error("Minimal dua pilihan jawaban wajib diisi.");
  }
  if (correctOptionIndex < 1 || correctOptionIndex > options.length) {
    throw new Error("Jawaban benar tidak sesuai pilihan yang tersedia.");
  }

  return input;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

export async function createTryoutAction(formData: FormData) {
  let tryoutId = "";

  try {
    const profile = await requireAdminProfile();
    const input = getTryoutInput(formData);
    const created = await tryoutService.createTryout({
      ...input,
      createdBy: profile.id,
    });
    tryoutId = created.id;
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/new?error=${encodeURIComponent(
        getErrorMessage(error),
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
    const input: UpdateTryoutInput = getTryoutInput(formData);
    await tryoutService.updateTryout(tryoutId, input);
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/${tryoutId}/edit?error=${encodeURIComponent(
        getErrorMessage(error),
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
) {
  try {
    await requireAdminProfile();
    await tryoutService.createQuestion(getQuestionInput(tryoutId, formData));
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/${tryoutId}/questions?error=${encodeURIComponent(
        getErrorMessage(error),
      )}`,
    );
  }

  revalidatePath(`/dashboard/admin/tryout/${tryoutId}/questions`);
  redirect(`/dashboard/admin/tryout/${tryoutId}/questions?added=true`);
}

export async function updateTryoutQuestionAction(
  tryoutId: string,
  questionId: string,
  formData: FormData,
) {
  try {
    await requireAdminProfile();
    const { tryoutId: _ignored, ...input } = getQuestionInput(
      tryoutId,
      formData,
    );
    void _ignored;
    await tryoutService.updateQuestion(questionId, input);
  } catch (error) {
    redirect(
      `/dashboard/admin/tryout/${tryoutId}/questions/${questionId}/edit?error=${encodeURIComponent(
        getErrorMessage(error),
      )}`,
    );
  }

  revalidatePath(`/dashboard/admin/tryout/${tryoutId}/questions`);
  redirect(`/dashboard/admin/tryout/${tryoutId}/questions?saved=true`);
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
