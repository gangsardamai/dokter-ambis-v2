import type { Database } from "@/supabase/types/database.types";

import LessonStatusBadge from "./LessonStatusBadge";
import LessonActionMenu from "./LessonActionMenu";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonRowProps {
  lesson: Lesson;
}

export default function LessonRow({
  lesson,
}: LessonRowProps) {
  return (
    <tr className="border-t">

      <td className="px-6 py-4">

        <div className="font-semibold">
          {lesson.title}
        </div>

        {lesson.description && (
          <div className="mt-1 text-sm text-gray-500">
            {lesson.description}
          </div>
        )}

      </td>

      <td className="px-6 py-4">
        {lesson.duration} menit
      </td>

      <td className="px-6 py-4">
        <LessonStatusBadge
          lesson={lesson}
        />
      </td>

      <td className="px-6 py-4 text-right">
        <LessonActionMenu
          lessonId={lesson.id}
        />
      </td>

    </tr>
  );
}