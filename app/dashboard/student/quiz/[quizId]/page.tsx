import Link from "next/link";
import { notFound } from "next/navigation";

import QuizAttemptCard from "@/components/quiz/QuizAttemptCard";
import QuizReviewCard from "@/components/quiz/QuizReviewCard";

import { createClient } from "@/lib/supabase/server";

import type {
  QuizAttemptPayload,
  QuizReviewPayload,
} from "@/types/course-explorer";

interface StudentQuizPageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function StudentQuizPage({
  params,
}: StudentQuizPageProps) {
  const { quizId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_quiz_for_attempt",
    {
      target_quiz_id: quizId,
    },
  );

  if (error || !data) {
    notFound();
  }

  const quiz = data as unknown as QuizAttemptPayload;
  let review: QuizReviewPayload | null = null;

  if (quiz.attempts_remaining === 0) {
    const reviewResult = await supabase.rpc(
      "get_quiz_review",
      {
        target_quiz_id: quizId,
      },
    );

    if (!reviewResult.error && reviewResult.data) {
      review =
        reviewResult.data as unknown as QuizReviewPayload;
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/student"
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        ← Kembali ke course
      </Link>

      <QuizAttemptCard quiz={quiz} />

      {review && (
        <QuizReviewCard review={review} />
      )}
    </main>
  );
}
