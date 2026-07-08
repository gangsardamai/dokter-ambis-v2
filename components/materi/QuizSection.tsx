import type { Database } from "@/supabase/types/database.types";

import { QuizList } from "@/components/quiz";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizSectionProps {
  quizzes: Quiz[];
}

export default function QuizSection({
  quizzes,
}: QuizSectionProps) {
  return (
    <section className="mb-10">

      <h2 className="mb-4 text-2xl font-bold">
        📝 Quiz
      </h2>

      <QuizList
        quizzes={quizzes}
      />

    </section>
  );
}