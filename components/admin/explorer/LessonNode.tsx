import type { Database } from "@/supabase/types/database.types";

import { LessonMenu } from "./LessonMenu";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonNodeProps {
  courseId: string;
  lesson: Lesson;
}

export function LessonNode({
  courseId,
  lesson,
}: LessonNodeProps) {

  return (

    <div
      className="
        ml-10
        mt-2
        flex
        items-center
        justify-between
        rounded-md
        border
        bg-gray-50
        px-4
        py-3
      "
    >

      <div className="flex items-center gap-3">

        <span>📄</span>

        <div>

          <p className="font-medium">
            {lesson.title}
          </p>

          <p className="text-xs text-gray-500">

            {lesson.duration} menit

            {lesson.is_free && " • Gratis"}

          </p>

        </div>

      </div>

      <LessonMenu
        courseId={courseId}
        lessonId={lesson.id}
      />

    </div>

  );

}