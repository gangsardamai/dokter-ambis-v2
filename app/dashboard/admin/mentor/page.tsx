import Link from "next/link";

import { setMentorAssignmentAction } from "@/app/actions/mentor-rating.actions";
import PendingSubmitButton from "@/components/mentor/PendingSubmitButton";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

interface MentorCourse {
  id: string;
  title: string;
  organizationId: string;
  organizationTitle: string;
  organizationShortName: string;
  programId: string;
  programTitle: string;
  isActive: boolean;
  assignedAt: string;
  removedAt: string | null;
}

interface MentorDirectoryItem {
  profileId: string;
  mentorId: string;
  fullName: string;
  email: string;
  status: string;
  averageRating: number;
  ratingCount: number;
  courses: MentorCourse[];
}

interface CourseOption {
  id: string;
  title: string;
  organizationId: string;
  organizationTitle: string;
  organizationShortName: string;
  programId: string;
  programTitle: string;
}

interface OrganizationOption {
  id: string;
  title: string;
  shortName: string;
}

interface ProgramOption {
  id: string;
  title: string;
  organizationId: string;
}

interface MentorDirectory {
  mentors: MentorDirectoryItem[];
  courses: CourseOption[];
  organizations: OrganizationOption[];
  programs: ProgramOption[];
}

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M";
}

export default async function AdminMentorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = getParam(params.q).trim().toLowerCase();
  const organizationId = getParam(params.organization);
  const programId = getParam(params.program);
  const courseId = getParam(params.course);
  const supabase = await createClient();
  const directory = await callDynamicRpc<MentorDirectory>(
    supabase,
    "admin_get_mentor_directory",
  );

  const mentors = directory.mentors.filter((mentor) => {
    const activeCourses = mentor.courses.filter((course) => course.isActive);
    const matchesSearch =
      !query ||
      mentor.fullName.toLowerCase().includes(query) ||
      mentor.email.toLowerCase().includes(query);
    const matchesOrganization =
      !organizationId ||
      activeCourses.some((course) => course.organizationId === organizationId);
    const matchesProgram =
      !programId || activeCourses.some((course) => course.programId === programId);
    const matchesCourse =
      !courseId || activeCourses.some((course) => course.id === courseId);

    return matchesSearch && matchesOrganization && matchesProgram && matchesCourse;
  });

  const visiblePrograms = organizationId
    ? directory.programs.filter((program) => program.organizationId === organizationId)
    : directory.programs;
  const visibleCourses = directory.courses.filter((course) =>
    (!organizationId || course.organizationId === organizationId) &&
    (!programId || course.programId === programId),
  );
  const hasFilters = Boolean(query || organizationId || programId || courseId);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
          Master Data
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Mentor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Kelola penugasan course, lihat rating, dan baca saran peserta untuk setiap mentor.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3">
            <span className="text-2xl font-black">{mentors.length}</span>
            <span className="ml-2 text-sm font-bold text-blue-100">mentor ditemukan</span>
          </div>
        </div>
      </section>

      <form method="GET" className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm font-bold text-slate-700">
            Cari mentor
            <input
              name="q"
              type="search"
              defaultValue={getParam(params.q)}
              placeholder="Nama atau email..."
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Universitas
            <select name="organization" defaultValue={organizationId} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-500">
              <option value="">Semua universitas</option>
              {directory.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.title} · {organization.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Program
            <select name="program" defaultValue={programId} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-500">
              <option value="">Semua program</option>
              {visiblePrograms.map((program) => (
                <option key={program.id} value={program.id}>{program.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Course
            <select name="course" defaultValue={courseId} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-500">
              <option value="">Semua course</option>
              {visibleCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.organizationShortName} · {course.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="min-h-10 rounded-xl bg-[#1769cf] px-5 py-2 text-sm font-black text-white">
            Terapkan Filter
          </button>
          {hasFilters && (
            <Link href="/dashboard/admin/mentor" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-5 py-2 text-sm font-black text-slate-700">
              Reset
            </Link>
          )}
        </div>
      </form>

      {mentors.length === 0 ? (
        <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <p className="font-black text-slate-950">Tidak ada mentor yang sesuai filter.</p>
        </section>
      ) : (
        <section className="space-y-4">
          {mentors.map((mentor) => {
            const activeCourses = mentor.courses.filter((course) => course.isActive);
            const visibleAssignments = activeCourses.slice(0, 3);
            const remaining = Math.max(0, activeCourses.length - 3);
            const activeCourseIds = new Set(activeCourses.map((course) => course.id));
            const availableCourses = directory.courses.filter((course) => !activeCourseIds.has(course.id));

            return (
              <article key={mentor.profileId} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <Link href={`/dashboard/admin/mentor/${mentor.profileId}`} className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-sm font-black text-white">
                      {getInitials(mentor.fullName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-lg font-black text-slate-950">{mentor.fullName}</span>
                      <span className="mt-1 block break-all text-sm font-semibold text-slate-500">{mentor.email || "Email tidak tersedia"}</span>
                      <span className="mt-2 block text-sm font-bold text-amber-600">
                        ★ {Number(mentor.averageRating).toFixed(1)} · {mentor.ratingCount} penilaian
                      </span>
                    </span>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Course ditugaskan</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visibleAssignments.length === 0 ? (
                        <span className="text-sm font-semibold text-slate-400">Belum ada course aktif</span>
                      ) : (
                        visibleAssignments.map((course) => (
                          <span key={course.id} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {course.organizationShortName} · {course.title}
                          </span>
                        ))
                      )}
                      {remaining > 0 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">+{remaining} course lainnya</span>
                      )}
                    </div>
                  </div>

                  <details className="relative shrink-0">
                    <summary className="cursor-pointer list-none rounded-xl bg-[#1769cf] px-4 py-2.5 text-sm font-black text-white">
                      Tambahkan Tugas
                    </summary>
                    <form action={setMentorAssignmentAction} className="mt-3 w-full rounded-2xl border border-blue-100 bg-blue-50 p-3 xl:w-80">
                      <input type="hidden" name="mentorProfileId" value={mentor.profileId} />
                      <input type="hidden" name="active" value="true" />
                      <select name="courseId" required className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        <option value="">Pilih course...</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.organizationShortName} · {course.programTitle} · {course.title}
                          </option>
                        ))}
                      </select>
                      <PendingSubmitButton
                        className="mt-3 min-h-10 w-full rounded-xl bg-[#033b63] px-4 text-sm font-black text-white"
                        label="Simpan Penugasan"
                        pendingLabel="Menyimpan..."
                      />
                    </form>
                  </details>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
