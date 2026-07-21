import Link from "next/link";

import { lessonService } from "@/services";

interface Props {
  courseId: string;
}

export default async function LessonRelationTable({
  courseId,
}: Props) {

  const lessons =
    await lessonService.getLessonSummaries(
      courseId
    );

  if (lessons.length === 0) {

    return (

      <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">

        Belum ada materi pada blok ini.

      </div>

    );

  }

  return (

    <div className="overflow-hidden rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-5 py-3 text-left">
              Urutan
            </th>

            <th className="px-5 py-3 text-left">
              Materi
            </th>

            <th className="px-5 py-3 text-left">
              Durasi
            </th>

            <th className="px-5 py-3 text-left">
              Akses
            </th>

          </tr>

        </thead>

        <tbody>

          {lessons.map((lesson) => (

            <tr
              key={lesson.id}
              className="border-t"
            >

              <td className="px-5 py-4">
                {lesson.lesson_order}
              </td>

              <td className="px-5 py-4">

                <Link
                  href={`/dashboard/admin/lesson/${lesson.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {lesson.title}
                </Link>

              </td>

              <td className="px-5 py-4">
                {lesson.duration} menit
              </td>

              <td className="px-5 py-4">

                {lesson.is_free
                  ? "Gratis"
                  : "Premium"}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}