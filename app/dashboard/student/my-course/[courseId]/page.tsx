import Link from "next/link";
import { redirect } from "next/navigation";

import CourseContentAccordion from "@/components/course-explorer/CourseContentAccordion";

import {
  courseExplorerService,
  enrollmentService,
  profileService,
} from "@/services";

interface StudentMyCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function StudentMyCoursePage({
  params,
}: StudentMyCoursePageProps) {
  const { courseId } = await params;

  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const enrollment =
    await enrollmentService.getActiveCourseEnrollment(
      profile.id,
      courseId,
    );

  if (!enrollment || !enrollment.courses) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Anda belum memiliki akses aktif ke blok tersebut.",
      )}`,
    );
  }

  const content =
    await courseExplorerService.getCourseContent(courseId);

  const course = enrollment.courses;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/student"
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        ← Kembali ke dashboard
      </Link>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-50 ring-1 ring-white/20">
          Blok Aktif
        </span>

        <h1 className="mt-5 break-words text-3xl font-black tracking-tight sm:text-4xl">
          {course.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-100">
          <span>
            {course.organizations?.title ??
              "Universitas belum tersedia"}
          </span>
          <span>
            {course.programs?.title ??
              "Program belum tersedia"}
          </span>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Course Explorer
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Materi Pembelajaran
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buka folder, pilih lesson, lalu akses file, video, atau quiz sesuai urutan pembelajaran.
          </p>
        </div>

        <CourseContentAccordion
          courseId={courseId}
          content={content}
          mode="student"
        />
      </section>
    </main>
  );
}
