"use server";

import { revalidatePath } from "next/cache";

import {
  createR2PresignedUrl,
  getR2BucketName,
  isR2Configured,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

const MATERIAL_BUCKET = "course-materials";

type QuizImageKind = "question" | "explanation";

interface QuizQuestionImages {
  image_path: string | null;
  explanation_image_path: string | null;
}

function requiredText(
  formData: FormData,
  key: string,
): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi.`);
  }

  return value;
}

function isAuthorizedImagePath(
  filePath: string,
  courseId: string,
  quizId: string,
  kind: QuizImageKind,
): boolean {
  if (!filePath) return true;

  const r2Path = parseR2FilePath(filePath);
  const r2Prefix = [
    "courses",
    courseId,
    "quiz-images",
    quizId,
    kind,
    "",
  ].join("/");
  const supabasePrefix = [
    courseId,
    "quiz-images",
    quizId,
    kind,
    "",
  ].join("/");

  if (r2Path) {
    return (
      isR2Configured() &&
      r2Path.bucket === getR2BucketName() &&
      r2Path.key.startsWith(r2Prefix)
    );
  }

  return filePath.startsWith(supabasePrefix);
}

async function removeStoredImage(
  filePath: string | null,
): Promise<void> {
  if (!filePath) return;

  const r2Path = parseR2FilePath(filePath);

  if (r2Path) {
    if (
      !isR2Configured() ||
      r2Path.bucket !== getR2BucketName()
    ) {
      return;
    }

    const signed = createR2PresignedUrl({
      method: "DELETE",
      key: r2Path.key,
      expiresIn: 120,
    });
    const response = await fetch(signed.url, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error("Gambar R2 gagal dibersihkan.");
    }

    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}

async function getQuizCourseId(
  quizId: string,
): Promise<string> {
  const supabase = await createClient();
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("lesson_id")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError || !quiz) {
    throw new Error(
      quizError?.message ?? "Quiz tidak ditemukan.",
    );
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", quiz.lesson_id)
    .maybeSingle();

  if (lessonError || !lesson) {
    throw new Error(
      lessonError?.message ?? "Course quiz tidak ditemukan.",
    );
  }

  return lesson.course_id;
}

export async function createQuestionAction(
  quizId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const question = requiredText(formData, "question");
  const explanation =
    String(formData.get("explanation") ?? "").trim() ||
    null;
  const imagePath =
    String(formData.get("image_path") ?? "").trim() ||
    null;
  const explanationImagePath =
    String(
      formData.get("explanation_image_path") ?? "",
    ).trim() || null;
  const points = Number(formData.get("points") ?? 1);
  const correctOption = Number(
    formData.get("correct_option") ?? -1,
  );
  const options = [0, 1, 2, 3].map((index) =>
    requiredText(formData, `option_${index}`),
  );

  if (!Number.isInteger(points) || points < 1) {
    throw new Error("Skor soal minimal 1.");
  }

  if (
    !Number.isInteger(correctOption) ||
    correctOption < 0 ||
    correctOption > 3
  ) {
    throw new Error("Pilih satu kunci jawaban.");
  }

  const courseId = await getQuizCourseId(quizId);

  if (
    imagePath &&
    !isAuthorizedImagePath(
      imagePath,
      courseId,
      quizId,
      "question",
    )
  ) {
    throw new Error("Path foto soal tidak valid.");
  }

  if (
    explanationImagePath &&
    !isAuthorizedImagePath(
      explanationImagePath,
      courseId,
      quizId,
      "explanation",
    )
  ) {
    throw new Error("Path foto pembahasan tidak valid.");
  }

  const { data: lastQuestion, error: orderError } =
    await supabase
      .from("quiz_questions")
      .select("question_order")
      .eq("quiz_id", quizId)
      .order("question_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  const questionInsert = {
    quiz_id: quizId,
    question_order:
      (lastQuestion?.question_order ?? 0) + 1,
    question,
    explanation,
    image_path: imagePath,
    explanation_image_path: explanationImagePath,
    question_type: "single_choice",
    points,
  };

  const { data: createdQuestion, error: questionError } =
    await supabase
      .from("quiz_questions")
      // Runtime schema already includes explanation_image_path via migration 0059.
      // This bridge can be removed after regenerating local Supabase types.
      .insert(questionInsert as never)
      .select("id")
      .single();

  if (questionError || !createdQuestion) {
    throw new Error(
      questionError?.message ?? "Soal gagal disimpan.",
    );
  }

  const { error: optionsError } = await supabase
    .from("quiz_options")
    .insert(
      options.map((optionText, index) => ({
        question_id: createdQuestion.id,
        option_order: index + 1,
        option_text: optionText,
        is_correct: index === correctOption,
      })),
    );

  if (optionsError) {
    await supabase
      .from("quiz_questions")
      .delete()
      .eq("id", createdQuestion.id);

    await Promise.allSettled([
      removeStoredImage(imagePath),
      removeStoredImage(explanationImagePath),
    ]);

    throw new Error(optionsError.message);
  }

  revalidatePath(`/dashboard/quiz/${quizId}`);
  revalidatePath(
    `/dashboard/quiz/${quizId}/questions`,
  );
}

export async function deleteQuestionAction(
  quizId: string,
  questionId: string,
) {
  const supabase = await createClient();
  const { data: questionRecord, error: readError } =
    await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", questionId)
      .eq("quiz_id", quizId)
      .maybeSingle();

  if (readError || !questionRecord) {
    throw new Error(
      readError?.message ?? "Soal tidak ditemukan.",
    );
  }

  const questionImages = questionRecord as typeof questionRecord &
    QuizQuestionImages;
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId)
    .eq("quiz_id", quizId);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.allSettled([
    removeStoredImage(questionImages.image_path),
    removeStoredImage(
      questionImages.explanation_image_path,
    ),
  ]);

  revalidatePath(`/dashboard/quiz/${quizId}`);
  revalidatePath(
    `/dashboard/quiz/${quizId}/questions`,
  );
}
