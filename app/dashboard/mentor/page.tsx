import Link from "next/link";
import { redirect } from "next/navigation";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";

import {
  CourseDirectory,
  type DashboardCourseItem,
} from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import {
  coursePinService,
  courseService,
  profileService,
} from "@/services";

export default async function MentorDashboardPage() {
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: mentorDetail, error: mentorError } = await supabase
    .from("mentor_details")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (mentorError) throw mentorError;

  const { data: assignments, error: assignmentError } = mentorDetail
    ? await supabase
        .from("course_mentors")
        .select("course_id, is_active")
        .eq("mentor_id", mentorDetail.id)
    : { data: [], error: null };

  if (assignmentError) throw assignmentError;

  const assignmentRows = (assignments ?? []) as unknown as Array<{
    course_id: string;
    is_active: boolean;
  }>;
  const assignedCourseIds = assignmentRows
    .filter((assignment) => assignment.is_active)
    .map((assignment) => assignment.course_id);

  const [assignedCourses, pinnedCourseIds, ratingDashboard] = await Promise.all([
    courseService.getCourseDetailsByIds(assignedCourseIds),
    coursePinService.getPinnedCourseIds(profile.id),
    callDynamicRpc<{ overallAverage: number; totalRatings: number }>(
      supabase,
      "mentor_get_rating_dashboard",
    ),
  ]);

  const courses: DashboardCourseItem[] = assignedCourses
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "id-ID"))
    .map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    organizationTitle:
      course.organization?.title ?? "Universitas belum tersedia",
    organizationShortName: course.organization?.short_name ?? null,
    programTitle: course.program?.title ?? "Program belum tersedia",
    statusLabel:
      course.status === "active" ? "Aktif" : course.status,
    metaLabel: "Akses pengelolaan",
    priceLabel: "Mentor",
    href: `/dashboard/mentor/course/${course.id}/explorer`,
    actionLabel: "Buka Course Explorer",
  }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              Dashboard Mentor
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Selamat datang, {profile.full_name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Kelola folder, lesson, file, video, dan quiz hanya pada course yang ditugaskan kepada Anda.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm sm:px-5">
              <span className="text-2xl font-black">{courses.length}</span>
              <span className="mt-1 text-xs font-bold text-blue-100 sm:text-sm">Course Ditugaskan</span>
            </div>
            <Link
              href="/dashboard/mentor/ratings"
              className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm transition hover:bg-white/20 sm:px-5"
              aria-label="Lihat rincian rating mentor"
            >
              {ratingDashboard.totalRatings > 0 ? (
                <>
                  <span className="text-2xl font-black"><span className="text-amber-300">★</span> {Number(ratingDashboard.overallAverage).toFixed(1)}<span className="text-sm text-blue-100">/5</span></span>
                  <span className="mt-1 text-xs font-bold text-blue-100 sm:text-sm">Rating Mentor</span>
                  <span className="text-xs text-blue-100">{ratingDashboard.totalRatings} penilaian</span>
                </>
              ) : (
                <>
                  <span className="text-xl font-black text-amber-300">☆☆☆☆☆</span>
                  <span className="mt-1 text-xs font-bold text-blue-100 sm:text-sm">Rating Mentor</span>
                  <span className="text-xs text-blue-100">Belum ada penilaian</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </section>

      <CourseDirectory
        courses={courses}
        searchPlaceholder="Cari judul course, universitas, atau program..."
        emptyTitle="Belum ada course ditugaskan"
        emptyDescription="Course akan muncul setelah admin menugaskan Anda sebagai mentor pada course tersebut."
        showFilters
        pinnedCourseIds={pinnedCourseIds}
      />
    </main>
  );
}
