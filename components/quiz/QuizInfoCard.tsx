import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizInfoCardProps {
  quiz: Quiz;
}

export default function QuizInfoCard({
  quiz,
}: QuizInfoCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Quiz
        </h2>

        <div className="mt-6 space-y-6">

          <div>

            <p className="text-sm text-gray-500">
              Judul
            </p>

            <p className="mt-1 font-medium">
              {quiz.title}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Durasi
            </p>

            <p className="mt-1 font-medium">
              {quiz.duration} menit
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Jumlah Soal
            </p>

            <p className="mt-1 font-medium">
              {quiz.total_questions}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Passing Score
            </p>

            <p className="mt-1 font-medium">
              {quiz.passing_score}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Max Attempt
            </p>

            <p className="mt-1 font-medium">
              {quiz.max_attempt}
            </p>

          </div>

        </div>

      </div>

    </Card>

  );

}