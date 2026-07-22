import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";
import CourseTable from "@/components/admin/course/CourseTable";

import { courseService } from "@/services";

export default async function CoursePage() {
  const courses = await courseService.getCourses();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Blok Pembelajaran"
        description="Kelola seluruh blok pembelajaran."
        actions={(
          <PrimaryButton
            href="/dashboard/admin/course/create"
            className="w-full sm:w-auto"
          >
            + Tambah Blok
          </PrimaryButton>
        )}
      />

      <CourseTable courses={courses} />
    </main>
  );
}
