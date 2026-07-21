import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface ExplorerHeaderProps {
  course: Course;
  folderCount: number;
  lessonCount?: number;
}

export function ExplorerHeader({
  course,
  folderCount,
  lessonCount = 0,
}: ExplorerHeaderProps) {
  return (
    <div className="space-y-5 border-b pb-6">

      <Link
        href="/dashboard/admin/course"
        className="
          inline-flex
          items-center
          text-sm
          text-blue-600
          hover:underline
        "
      >
        ← Kembali ke Course
      </Link>

      <div>
        <h1 className="text-3xl font-bold">
          {course.title}
        </h1>

        <p className="mt-1 text-gray-500">
          {course.slug}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">

        <div
          className="
            rounded-lg
            bg-gray-100
            px-4
            py-2
            text-sm
          "
        >
          📂 {folderCount} Folder
        </div>

        <div
          className="
            rounded-lg
            bg-gray-100
            px-4
            py-2
            text-sm
          "
        >
          📄 {lessonCount} Lesson
        </div>

      </div>

    </div>
  );
}