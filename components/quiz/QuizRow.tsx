import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

interface QuizRowProps {
  quiz: Quiz;
}

export default function QuizRow({
  quiz,
}: QuizRowProps) {

  return (

    <tr className="border-b">

      <td className="px-4 py-3">
        {quiz.title}
      </td>

      <td className="px-4 py-3">
        {quiz.total_questions}
      </td>

      <td className="px-4 py-3">
        {quiz.passing_score}
      </td>

      <td className="px-4 py-3">
        {quiz.max_attempt}
      </td>

      <td className="px-4 py-3">
        {quiz.duration} menit
      </td>

      <td className="px-4 py-3">

        <Link
          href={`/dashboard/admin/quiz/${quiz.id}`}
          className="text-blue-600 hover:underline"
        >
          Detail
        </Link>

      </td>

    </tr>

  );

}