import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type CourseStatus =
  Database["public"]["Enums"]["course_status"];

interface Props {
  courseId: string;
  status: CourseStatus;
}

export default function CourseActionMenu({
  courseId,
  status,
}: Props) {

  return (

    <div className="flex justify-end gap-2">

      <Link
        href={`/dashboard/admin/course/${courseId}`}
        className="rounded border px-3 py-1 text-sm"
      >
        Detail
      </Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/edit`}
        className="rounded border px-3 py-1 text-sm"
      >
        Edit
      </Link>

      <button
        className="rounded border px-3 py-1 text-sm"
      >
        {status === "active"
          ? "Arsipkan"
          : "Aktifkan"}
      </button>

    </div>

  );

}