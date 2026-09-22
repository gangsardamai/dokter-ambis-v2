import Link from "next/link";

import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import {
  announcementService,
  courseService,
  organizationService,
} from "@/services";

import {
  deleteAnnouncementAction,
  moveAnnouncementAction,
} from "./actions";

interface AnnouncementAdminPageProps {
  searchParams: Promise<{
    organization?: string | string[];
    course?: string | string[];
    status?: string | string[];
  }>;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatDate(value: string | null): string {
  if (!value) return "Tanpa batas";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getState(
  announcement: {
    is_published: boolean;
    starts_at: string;
    ends_at: string | null;
  },
): "draft" | "scheduled" | "active" | "expired" {
  if (!announcement.is_published) return "draft";

  const now = Date.now();
  if (new Date(announcement.starts_at).getTime() > now) {
    return "scheduled";
  }

  if (
    announcement.ends_at &&
    new Date(announcement.ends_at).getTime() < now
  ) {
    return "expired";
  }

  return "active";
}

const stateLabel = {
  draft: "Draft",
  scheduled: "Dijadwalkan",
  active: "Aktif",
  expired: "Berakhir",
} as const;

export default async function AnnouncementAdminPage({
  searchParams,
}: AnnouncementAdminPageProps) {
  const query = await searchParams;
  const organizationFilter = first(query.organization);
  const courseFilter = first(query.course);
  const statusFilter = first(query.status);

  const [announcements, organizations, courses] =
    await Promise.all([
      announcementService.getAdminAnnouncements(),
      organizationService.getActiveUniversities(),
      courseService.getAvailableCourseDetails(),
    ]);

  const courseMap = new Map(
    courses.map((course) => [course.id, course]),
  );
  const organizationMap = new Map(
    organizations.map((organization) => [
      organization.id,
      organization,
    ]),
  );

  const filteredAnnouncements = announcements.filter(
    (announcement) => {
      if (organizationFilter) {
        const directMatch =
          announcement.organizationIds.includes(
            organizationFilter,
          );
        const courseMatch = announcement.courseIds.some(
          (courseId) =>
            courseMap.get(courseId)?.organization_id ===
            organizationFilter,
        );

        if (!directMatch && !courseMatch) return false;
      }

      if (
        courseFilter &&
        !announcement.courseIds.includes(courseFilter)
      ) {
        return false;
      }

      if (
        statusFilter &&
        statusFilter !== "all" &&
        getState(announcement) !== statusFilter
      ) {
        return false;
      }

      return true;
    },
  );

  const dashboardAnnouncements = announcements.filter(
    (announcement) => announcement.show_on_dashboard,
  );

  const filterCourses = organizationFilter
    ? courses.filter(
        (course) =>
          course.organization_id === organizationFilter,
      )
    : courses;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Pengumuman"
        description="Kelola isi, target peserta, periode tayang, dan urutan kartu pengumuman di dashboard peserta."
        actions={(
          <PrimaryButton
            href="/dashboard/admin/announcements/create"
            className="w-full sm:w-auto"
          >
            Buat Pengumuman
          </PrimaryButton>
        )}
      />

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1769cf]">
              Urutan Dashboard
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#061827]">
              Atur urutan carousel peserta
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Urutan bersifat global; peserta otomatis melewati pengumuman yang bukan targetnya.
          </p>
        </div>

        {dashboardAnnouncements.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Belum ada pengumuman yang dipilih untuk tampil di dashboard.
          </p>
        ) : (
          <div className="mt-5 space-y-2">
            {dashboardAnnouncements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-black text-[#1769cf]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900">
                    {announcement.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stateLabel[getState(announcement)]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await moveAnnouncementAction(
                        announcement.id,
                        "up",
                      );
                    }}
                  >
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Naikkan urutan"
                    >
                      ↑
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await moveAnnouncementAction(
                        announcement.id,
                        "down",
                      );
                    }}
                  >
                    <button
                      type="submit"
                      disabled={
                        index === dashboardAnnouncements.length - 1
                      }
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Turunkan urutan"
                    >
                      ↓
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          method="get"
          className="grid gap-4 md:grid-cols-4"
        >
          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Universitas</span>
            <select
              name="organization"
              defaultValue={organizationFilter}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Semua Universitas</option>
              {organizations.map((organization) => (
                <option
                  key={organization.id}
                  value={organization.id}
                >
                  {organization.short_name ??
                    organization.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Course</span>
            <select
              name="course"
              defaultValue={courseFilter}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Semua Course</option>
              {filterCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Status</span>
            <select
              name="status"
              defaultValue={statusFilter || "all"}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="scheduled">Dijadwalkan</option>
              <option value="draft">Draft</option>
              <option value="expired">Berakhir</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-xl bg-[#1769cf] px-4 text-sm font-bold text-white"
            >
              Terapkan Filter
            </button>
            <Link
              href="/dashboard/admin/announcements"
              className="grid min-h-11 place-items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-[#061827]">
            Daftar Pengumuman
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {filteredAnnouncements.length} pengumuman
          </span>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Tidak ada pengumuman yang cocok dengan filter.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredAnnouncements.map((announcement) => {
              const state = getState(announcement);
              const organizationLabels =
                announcement.organizationIds.map(
                  (id) =>
                    organizationMap.get(id)?.short_name ??
                    organizationMap.get(id)?.title ??
                    "Universitas",
                );
              const courseLabels = announcement.courseIds.map(
                (id) =>
                  courseMap.get(id)?.title ?? "Course",
              );

              return (
                <article
                  key={announcement.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-extrabold text-[#061827]">
                        {announcement.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {announcement.content}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1769cf]">
                      {stateLabel[state]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        Target
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {announcement.all_students ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            Semua Peserta
                          </span>
                        ) : (
                          <>
                            {organizationLabels.map((label, index) => (
                              <span
                                key={`org-${announcement.id}-${index}`}
                                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"
                              >
                                {label}
                              </span>
                            ))}
                            {courseLabels.map((label, index) => (
                              <span
                                key={`course-${announcement.id}-${index}`}
                                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700"
                              >
                                {label}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Mulai
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {formatDate(announcement.starts_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          Berakhir
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {formatDate(announcement.ends_at)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500">
                      Dashboard: {announcement.show_on_dashboard ? "Ya" : "Tidak"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/admin/announcements/${announcement.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] transition hover:bg-blue-100"
                    >
                      Edit
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAnnouncementAction(
                          announcement.id,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
