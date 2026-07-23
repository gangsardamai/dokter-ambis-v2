"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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

export async function createQuestionAction(
  quizId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const question = requiredText(formData, "question");
  const explanation =
    String(formData.get("explanation") ?? "").trim() ||
    null;
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

  const { data: createdQuestion, error: questionError } =
    await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_order:
          (lastQuestion?.question_order ?? 0) + 1,
        question,
        explanation,
        question_type: "single_choice",
        points,
      })
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

  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId)
    .eq("quiz_id", quizId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/quiz/${quizId}`);
  revalidatePath(
    `/dashboard/quiz/${quizId}/questions`,
  );
}
