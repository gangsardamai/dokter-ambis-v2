import type { Database } from "@/supabase/types/database.types";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizCardProps {
  quiz: Quiz;
}

export default function QuizCard({
  quiz,
}: QuizCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-lg font-semibold">
            {quiz.title}
          </h3>

          <div className="mt-3 space-y-1 text-sm text-gray-500">

            <p>
              ⏱ Durasi : {quiz.duration} menit
            </p>

            <p>
              📚 Soal : {quiz.total_questions}
            </p>

            <p>
              ✅ Passing Score : {quiz.passing_score}
            </p>

            <p>
              🔁 Maks. Percobaan : {quiz.max_attempt}
            </p>

          </div>

        </div>

        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Kerjakan
        </button>

      </div>

    </div>
  );
}