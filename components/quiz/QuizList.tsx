import type { Database } from "@/supabase/types/database.types";

import QuizCard from "./QuizCard";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizListProps {
  quizzes: Quiz[];
}

export default function QuizList({
  quizzes,
}: QuizListProps) {

  if (quizzes.length === 0) {

    return (

      <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">

        Belum ada quiz.

      </div>

    );

  }

  return (

    <div className="space-y-5">

      {quizzes.map((quiz) => (

        <QuizCard
          key={quiz.id}
          quiz={quiz}
        />

      ))}

    </div>

  );

}