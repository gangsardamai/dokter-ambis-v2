import { courseService } from "@/services";

import CourseRow from "./CourseRow";

export default async function CourseTable() {

  const courses =
    await courseService.getCourses();

  if (courses.length === 0) {

    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        Belum ada blok pembelajaran.
      </div>
    );

  }

  return (

    <div className="overflow-hidden rounded-xl border bg-white">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Blok
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-right">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {courses.map((course) => (

            <CourseRow
              key={course.id}
              course={course}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}