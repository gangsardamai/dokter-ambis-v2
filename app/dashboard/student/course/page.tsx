import { redirect } from "next/navigation";

import {
  CourseDirectory,
  type DashboardCourseItem,
} from "@/components/dashboard";
import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function StudentCourseCatalogPage() {
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const [activeEnrollments, availableCourseDetails] = await Promise.all([
    enrollmentService.getActiveCourseEnrollments(profile.id),
    courseService.getAvailableCourseDetails(),
  ]);

  const ownedCourseIds = new Set(
    activeEnrollments.map((enrollment) => enrollment.course_id),
  );

  const courses: DashboardCourseItem[] = availableCourseDetails
    .filter((course) => !ownedCourseIds.has(course.id))
    .map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      organizationTitle:
        course.organization?.title ?? "Universitas belum tersedia",
      organizationShortName:
        course.organization?.short_name ?? null,
      programTitle:
        course.program?.title ?? "Program belum tersedia",
      statusLabel: "Tersedia",
      metaLabel: course.is_free ? "Course gratis" : "Harga course",
      priceLabel: course.is_free
        ? "Gratis"
        : formatRupiah(Number(course.price)),
      href: `/dashboard/student/course/${course.id}`,
      actionLabel: "Lihat Detail",
    }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Cari Course
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Temukan Course Berikutnya
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Jelajahi seluruh course DokterAmbis yang belum Anda miliki berdasarkan judul, universitas, dan program.
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 px-5 py-4 text-blue-900">
            <span className="block text-2xl font-black">{courses.length}</span>
            <span className="text-sm font-bold">course tersedia</span>
          </div>
        </div>
      </section>

      <CourseDirectory
        courses={courses}
        searchPlaceholder="Cari judul course, universitas, atau program..."
        emptyTitle="Course belum tersedia"
        emptyDescription="Semua course sudah Anda miliki atau belum ada course aktif yang sesuai dengan filter."
        showFilters
      />
    </main>
  );
}
