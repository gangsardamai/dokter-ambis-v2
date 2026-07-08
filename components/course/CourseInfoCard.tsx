import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface CourseInfoCardProps {
  course: Course;
}

export default function CourseInfoCard({
  course,
}: CourseInfoCardProps) {
  return (
    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Blok
        </h2>

        <div className="mt-6 space-y-6">

          <div>
            <p className="text-sm text-gray-500">
              Nama Blok
            </p>

            <p className="mt-1 font-medium">
              {course.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {course.slug}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <span
              className={
                course.status === "active"
                  ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                  : course.status === "draft"
                  ? "inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700"
                  : "inline-flex rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
              }
            >
              {course.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Thumbnail
            </p>

            <p className="mt-1 break-all text-gray-700">
              {course.thumbnail_path ||
                "Belum ada thumbnail."}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Deskripsi
            </p>

            <p className="mt-1 leading-7 text-gray-700">
              {course.description ||
                "Belum ada deskripsi."}
            </p>
          </div>

        </div>

      </div>

    </Card>
  );
}