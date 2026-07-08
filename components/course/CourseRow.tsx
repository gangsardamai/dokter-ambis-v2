import type { Database } from "@/supabase/types/database.types";

import CourseStatusBadge from "./CourseStatusBadge";
import CourseActionMenu from "./CourseActionMenu";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface CourseRowProps {
  course: Course;
}

export default function CourseRow({
  course,
}: CourseRowProps) {
  return (
    <tr className="border-t">

      <td className="px-6 py-4">

        <div className="font-semibold">
          {course.title}
        </div>

        {course.description && (
          <div className="mt-1 text-sm text-gray-500">
            {course.description}
          </div>
        )}

      </td>

      <td className="px-6 py-4">
        <CourseStatusBadge
          status={course.status}
        />
      </td>

      <td className="px-6 py-4 text-right">

        <CourseActionMenu
          courseId={course.id}
          status={course.status}
        />

      </td>

    </tr>
  );
}