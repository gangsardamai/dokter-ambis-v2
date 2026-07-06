import type { Database } from "@/supabase/types/database.types";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizSectionProps {
  quizzes: Quiz[];
}

export default function QuizSection({
  quizzes,
}: QuizSectionProps) {

  return (
    <section>

      <h2 className="text-2xl font-bold mb-4">
        📝 Quiz
      </h2>

      {quizzes.length === 0 ? (

        <div className="rounded-xl border p-6 text-center text-gray-500">
          Belum ada quiz.
        </div>

      ) : (

        <div className="space-y-4">

          {quizzes.map((quiz) => (

            <div
              key={quiz.id}
              className="rounded-xl border p-5"
            >

              <h3 className="font-semibold text-lg">
                {quiz.title}
              </h3>

              <div className="mt-2 text-sm text-gray-500 space-y-1">

                <p>
                  Jumlah Soal : {quiz.total_questions}
                </p>

                <p>
                  Durasi : {quiz.duration} menit
                </p>

                <p>
                  Maksimal Percobaan : {quiz.max_attempt}
                </p>

                <p>
                  Passing Score : {quiz.passing_score ?? "-"}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}