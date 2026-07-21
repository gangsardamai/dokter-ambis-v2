import Link from "next/link";

import {
  EmptyState,
} from "@/components/admin";

import {
  deleteCourseFormAction,
} from "@/app/dashboard/admin/course/actions";

import CourseStatusBadge
from "./CourseStatusBadge";

import type { Database }
from "@/supabase/types/database.types";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface CourseTableProps {

  courses: Course[];

}

export default function CourseTable({

  courses,

}: CourseTableProps) {

  if (courses.length === 0) {

    return (

      <EmptyState
        title="Belum ada Course"
        description="Silakan tambahkan course baru."
      />

    );

  }

  return (

    <div className="overflow-x-auto rounded-lg border">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-4 py-3 text-left">
              Course
            </th>

            <th className="px-4 py-3 text-center">
              Harga
            </th>

            <th className="px-4 py-3 text-center">
              Gratis
            </th>

            <th className="px-4 py-3 text-center">
              Status
            </th>

            <th className="px-4 py-3 text-center">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {

            courses.map((course) => (

              <tr
                key={course.id}
                className="border-t"
              >

                <td className="px-4 py-3">

                  {course.title}

                </td>

                <td className="px-4 py-3 text-center">

                  {Number(
                    course.price ?? 0
                  ).toLocaleString("id-ID")}

                </td>

                <td className="px-4 py-3 text-center">

                  {course.is_free
                    ? "Ya"
                    : "Tidak"}

                </td>

                <td className="px-4 py-3 text-center">

                  <CourseStatusBadge
                    status={course.status}
                  />

                </td>

                <td className="px-4 py-3">

                  <div className="flex justify-center gap-2">

  <Link
    href={`/dashboard/admin/course/${course.id}/explorer`}
    className="
      rounded
      bg-emerald-600
      px-3
      py-1
      text-white
      hover:bg-emerald-700
    "
  >
    🚀 Explorer TEST
  </Link>

  <Link
    href={`/dashboard/admin/course/${course.id}/edit`}
    className="
      rounded
      bg-blue-600
      px-3
      py-1
      text-white
      hover:bg-blue-700
    "
  >
    Edit
  </Link>

  <form
    action={deleteCourseFormAction}
  >
    <input
      type="hidden"
      name="id"
      value={course.id}
    />

    <button
      type="submit"
      className="
        rounded
        bg-red-600
        px-3
        py-1
        text-white
        hover:bg-red-700
      "
    >
      Delete
    </button>
  </form>

</div>

                </td>

              </tr>

            ))

          }

        </tbody>

      </table>

    </div>

  );

}