import { redirect } from "next/navigation";

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

  const [assignedCourses, pinnedCourseIds] = await Promise.all([
    courseService.getCourseDetailsByIds(assignedCourseIds),
    coursePinService.getPinnedCourseIds(profile.id),
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
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              Course Ditugaskan
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Selamat datang, {profile.full_name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Kelola folder, lesson, file, video, dan quiz hanya pada course yang ditugaskan kepada Anda.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <span className="block text-2xl font-black">{courses.length}</span>
            <span className="text-sm font-bold text-blue-100">
              course ditugaskan
            </span>
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
