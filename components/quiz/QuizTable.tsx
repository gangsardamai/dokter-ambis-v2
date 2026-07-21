import { quizService } from "@/services";

import QuizRow from "./QuizRow";

export default async function QuizTable() {

  const quizzes =
    await quizService.getQuizzes();

  return (

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-4 py-3 text-left">
              Judul
            </th>

            <th className="px-4 py-3 text-left">
              Soal
            </th>

            <th className="px-4 py-3 text-left">
              Passing
            </th>

            <th className="px-4 py-3 text-left">
              Attempt
            </th>

            <th className="px-4 py-3 text-left">
              Durasi
            </th>

            <th className="px-4 py-3 text-left">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {quizzes.map((quiz) => (

            <QuizRow
              key={quiz.id}
              quiz={quiz}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}