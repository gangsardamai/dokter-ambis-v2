import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonInfoCardProps {
  lesson: Lesson;
}

export default function LessonInfoCard({
  lesson,
}: LessonInfoCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Materi
        </h2>

        <div className="mt-6 space-y-6">

          <div>

            <p className="text-sm text-gray-500">
              Nama Materi
            </p>

            <p className="mt-1 font-medium">
              {lesson.title}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {lesson.slug}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Durasi
            </p>

            <p className="mt-1 font-medium">
              {lesson.duration} menit
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Urutan
            </p>

            <p className="mt-1 font-medium">
              {lesson.lesson_order}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Akses
            </p>

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

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Deskripsi
            </p>

            <p className="mt-1 leading-7 text-gray-700">
              {lesson.description ??
                "Belum ada deskripsi."}
            </p>

          </div>

        </div>

      </div>

    </Card>

  );

}