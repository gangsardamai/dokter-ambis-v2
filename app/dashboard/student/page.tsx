import { redirect } from "next/navigation";

import {
  CourseDirectory,
  type DashboardCourseItem,
} from "@/components/dashboard";
import {
  enrollmentService,
  profileService,
} from "@/services";

interface StudentDashboardPageProps {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}

function formatDate(value: string | null): string {
  if (!value) return "Aktif";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getMessage(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function StudentDashboardPage({
  searchParams,
}: StudentDashboardPageProps) {
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const query = await searchParams;
  const errorMessage = getMessage(query.error);
  const activeEnrollments =
    await enrollmentService.getActiveCourseEnrollments(profile.id);

  const courses: DashboardCourseItem[] = activeEnrollments.flatMap(
    (enrollment) => {
      const course = enrollment.courses;
      if (!course) return [];

      return [{
        id: course.id,
        title: course.title,
        description: course.description,
        organizationTitle:
          course.organizations?.title ?? "Universitas belum tersedia",
        organizationShortName:
          course.organizations?.short_name ?? null,
        programTitle:
          course.programs?.title ?? "Program belum tersedia",
        statusLabel: "Dimiliki",
        metaLabel: "Aktif sejak",
        priceLabel: formatDate(enrollment.activated_at),
        href: `/dashboard/student/my-course/${course.id}`,
        actionLabel: "Buka Course",
      }];
    },
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
            Course Dimiliki
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Halo, {profile.full_name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Akses seluruh course yang sudah aktif dan lanjutkan proses belajar Anda.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className="text-2xl font-black">{courses.length}</span>
            <span className="text-sm font-bold text-blue-100">course aktif</span>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
            Daftar Course Saya
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Cari berdasarkan judul course, universitas, atau program.
          </p>
        </div>

        <CourseDirectory
          courses={courses}
          searchPlaceholder="Cari judul course, universitas, atau program..."
          emptyTitle="Course tidak ditemukan"
          emptyDescription="Belum ada course aktif atau kata kunci pencarian tidak sesuai."
        />
      </section>
    </main>
  );
}
