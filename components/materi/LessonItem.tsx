import Link from "next/link";
import type { Database } from "@/supabase/types/database.types";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonItemProps {
  lesson: Lesson;
}

export default function LessonItem({
  lesson,
}: LessonItemProps) {
  return (
    <Link href={`/materi/${lesson.slug}`}>
      <div className="border rounded-xl p-5 hover:shadow-lg transition">

        <div className="flex justify-between items-start">

          <div className="flex-1">

            <h3 className="font-semibold text-lg">
              {lesson.lesson_order}. {lesson.title}
            </h3>

            {lesson.description && (
              <p className="text-gray-500 mt-2">
                {lesson.description}
              </p>
            )}

          </div>

          <div className="text-right text-sm text-gray-500">

            <div>
              ⏱ {lesson.duration} menit
            </div>

            {lesson.is_free && (
              <div className="text-green-600 font-semibold mt-1">
                Gratis
              </div>
            )}

          </div>

        </div>

      </div>
    </Link>
  );
}