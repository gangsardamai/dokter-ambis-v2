import Link from "next/link";

import PageTitle from "@/components/admin/page/PageTitle";
import CourseTable from "@/components/admin/course/CourseTable";

import { courseService } from "@/services";

export default async function CoursePage() {
  const courses = await courseService.getCourses();

  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle
          title="Blok Pembelajaran"
          description="Kelola seluruh blok pembelajaran."
        />

        <Link
          href="/dashboard/admin/course/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Tambah Blok
        </Link>
      </div>

      <CourseTable courses={courses} />
    </main>
  );
}