import { lessonService } from "@/services";

import LessonRow from "./LessonRow";

export default async function LessonTable() {

  const lessons =
    await lessonService.getLessons();

  if (lessons.length === 0) {

    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        Belum ada materi.
      </div>
    );

  }

  return (

    <div className="overflow-hidden rounded-xl border bg-white">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Materi
            </th>

            <th className="px-6 py-4 text-left">
              Durasi
            </th>

            <th className="px-6 py-4 text-left">
              Akses
            </th>

            <th className="px-6 py-4 text-right">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {lessons.map((lesson) => (

            <LessonRow
              key={lesson.id}
              lesson={lesson}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}