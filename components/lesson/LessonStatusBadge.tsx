import type { Database } from "@/supabase/types/database.types";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonStatusBadgeProps {
  lesson: Lesson;
}

export default function LessonStatusBadge({
  lesson,
}: LessonStatusBadgeProps) {

  return (

    <span
      className={
        lesson.is_free
          ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
          : "inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
      }
    >
      {lesson.is_free
        ? "Gratis"
        : "Premium"}
    </span>

  );

}