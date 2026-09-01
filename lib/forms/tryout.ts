import type {
  TryoutDifficulty,
  TryoutPublicationStatus,
  TryoutResultReleaseMode,
  TryoutReviewReleaseMode,
} from "@/supabase/types/tryout.types";
import type {
  CreateTryoutInput,
  CreateTryoutQuestionInput,
} from "@/types/tryout";

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

export function parseTryoutForm(
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

export function parseTryoutQuestionForm(
  tryoutId: string,
  formData: FormData,
): CreateTryoutQuestionInput {
  const optionCount = getInteger(formData, "optionCount", 4);
  if (optionCount !== 4 && optionCount !== 5) {
    throw new Error("Jumlah pilihan harus 4 atau 5.");
  }

  const options = Array.from({ length: optionCount }, (_, index) =>
    getString(formData, `option${String.fromCharCode(65 + index)}`),
  );
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
    imagePath: getString(formData, "imagePath"),
    explanationImagePath: getString(formData, "explanationImagePath"),
  };

  if (!input.question) {
    throw new Error("Pertanyaan wajib diisi.");
  }
  if (options.some((option) => !option)) {
    throw new Error(
      optionCount === 5
        ? "Pilihan A, B, C, D, dan E wajib diisi."
        : "Pilihan A, B, C, dan D wajib diisi.",
    );
  }
  if (correctOptionIndex < 1 || correctOptionIndex > optionCount) {
    throw new Error("Jawaban benar harus sesuai dengan jumlah pilihan.");
  }
  if (input.points < 1) {
    throw new Error("Bobot soal minimal 1.");
  }

  return input;
}

export function getTryoutFormError(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}
