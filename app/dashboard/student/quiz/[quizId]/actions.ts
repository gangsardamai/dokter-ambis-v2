"use server";

import { createClient } from "@/lib/supabase/server";

import type {
  QuizReviewPayload,
  QuizSubmissionResult,
} from "@/types/course-explorer";

interface SubmittedAnswer {
  question_id: string;
  selected_option_id: string | null;
}

export async function submitQuizAttemptAction(
  quizId: string,
  answers: SubmittedAnswer[],
): Promise<QuizSubmissionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "submit_quiz_attempt",
    {
      target_quiz_id: quizId,
      submitted_answers: answers,
    },
  );

  if (error) {
    throw new Error(
      error.message || "Jawaban quiz gagal dikirim.",
    );
  }

  return data as unknown as QuizSubmissionResult;
}

export async function getQuizReviewAction(
  quizId: string,
): Promise<QuizReviewPayload> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_quiz_review",
    {
      target_quiz_id: quizId,
    },
  );

  if (error) {
    throw new Error(
      error.message || "Pembahasan quiz belum tersedia.",
    );
  }

  return data as unknown as QuizReviewPayload;
}
