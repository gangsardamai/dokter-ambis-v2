import type { Database } from "@/supabase/types/database.types";
import LessonItem from "./LessonItem";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonListProps {
  lessons: Lesson[];
}

export default function LessonList({
  lessons,
}: LessonListProps) {

  if (lessons.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center text-gray-500">
        Belum ada materi pada blok ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {lessons.map((lesson) => (
        <LessonItem
          key={lesson.id}
          lesson={lesson}
        />
      ))}

    </div>
  );
}