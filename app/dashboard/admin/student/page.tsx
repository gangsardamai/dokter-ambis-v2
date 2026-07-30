import Link from "next/link";

import { PageHeader } from "@/components/admin";
import { adminStudentService } from "@/services";

type SearchParams = Record<string, string | string[] | undefined>;

interface AdminStudentPageProps {
  searchParams: Promise<SearchParams>;
}

function getStringParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getPageParam(
  value: string | string[] | undefined,
): number {
  const parsed = Number.parseInt(getStringParam(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "M";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getWhatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }

  return `https://wa.me/${digits}`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Aktif",
    inactive: "Tidak Aktif",
    suspended: "Ditangguhkan",
  };

  return labels[status] ?? status;
}

function getStatusClassName(status: string): string {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "suspended") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function buildPageHref({
  query,
  organizationId,
  courseId,
  page,
}: {
  query: string;
  organizationId: string;
  courseId: string;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (organizationId) params.set("organization", organizationId);
  if (courseId) params.set("course", courseId);
  if (page > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString
    ? `/dashboard/admin/student?${queryString}`
    : "/dashboard/admin/student";
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z" />
      <path d="M9 8.5c.4 2.8 1.8 4.2 4.5 5" />
    </svg>
  );
}

export default async function AdminStudentPage({
  searchParams,
}: AdminStudentPageProps) {
  const params = await searchParams;
  const query = getStringParam(params.q).trim();
  const organizationId = getStringParam(params.organization);
  const courseId = getStringParam(params.course);
  const requestedPage = getPageParam(params.page);

  const directory = await adminStudentService.getDirectory({
    search: query,
    organizationId,
    courseId,
    page: requestedPage,
    pageSize: 25,
  });

  const currentPage = Math.min(directory.page, directory.totalPages);
  const hasFilters = Boolean(query || organizationId || courseId);
  const coursesByOrganization = new Map<
    string,
    {
      title: string;
      shortName: string;
      courses: typeof directory.courses;
    }
  >();

  directory.courses.forEach((course) => {
    const organization = course.organizations;
    const key = organization?.id ?? "unknown";
    const existing = coursesByOrganization.get(key) ?? {
      title: organization?.title ?? "Universitas tidak tersedia",
      shortName: organization?.short_name ?? "-",
      courses: [],
    };

    existing.courses.push(course);
    coursesByOrganization.set(key, existing);
  });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Mahasiswa"
        description="Lihat data mahasiswa, nomor WhatsApp, asal universitas, dan course yang pernah didaftarkan."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">
            Mahasiswa ditemukan
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#061827]">
            {directory.total}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Termasuk mahasiswa yang belum memiliki enrollment.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-[#1769cf] to-[#033b63] p-5 text-white shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
            Course tersedia
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
            {directory.courses.length}
          </p>
          <p className="mt-1 text-sm text-blue-100">
            Setiap course ditampilkan bersama universitasnya.
          </p>
        </div>
      </section>

      <form
        method="GET"
        className="rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1769cf]">
            <FilterIcon />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
              Filter Mahasiswa
            </h2>
            <p className="text-sm text-slate-500">
              Filter course mencakup semua status enrollment.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label
              htmlFor="q"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Nama atau WhatsApp
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Cari nama, nomor WhatsApp, universitas..."
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="organization"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Universitas Course
            </label>
            <select
              id="organization"
              name="organization"
              defaultValue={organizationId}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua universitas course</option>
              {directory.organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.title} · {organization.short_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="course"
              className="mb-1 block text-sm font-bold text-slate-700"
            >
              Course
            </label>
            <select
              id="course"
              name="course"
              defaultValue={courseId}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-[#1769cf] focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua course</option>
              {Array.from(coursesByOrganization.entries()).map(
                ([key, group]) => (
                  <optgroup
                    key={key}
                    label={`${group.title} · ${group.shortName}`}
                  >
                    {group.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </optgroup>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
          >
            Terapkan Filter
          </button>

          {hasFilters && (
            <Link
              href="/dashboard/admin/student"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
            >
              Reset
            </Link>
          )}

          <p className="text-sm text-slate-500 sm:ml-auto">
            Halaman <span className="font-bold text-[#061827]">{currentPage}</span>{" "}
            dari <span className="font-bold text-[#061827]">{directory.totalPages}</span>
          </p>
        </div>
      </form>

      {directory.students.length === 0 ? (
        <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-[#061827]">
            Tidak ada mahasiswa yang sesuai dengan filter.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Coba ganti universitas, course, atau kata pencarian.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {directory.students.map((student) => {
            const whatsappHref = getWhatsappHref(student.phone);
            const visibleCourses = student.courses.slice(0, 3);
            const remainingCourses = Math.max(
              0,
              student.courses.length - visibleCourses.length,
            );

            return (
              <article
                key={student.id}
                className="rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 items-start gap-4 xl:w-[30%]">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-sm font-black text-white shadow-sm">
                      {getInitials(student.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                          {student.full_name}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getStatusClassName(student.status)}`}
                        >
                          {getStatusLabel(student.status)}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                        {student.university_origin || "Asal universitas belum diisi"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 xl:w-[24%]">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      WhatsApp
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-bold text-slate-700">
                        {student.phone}
                      </span>
                      {whatsappHref && (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Hubungi ${student.full_name} melalui WhatsApp`}
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          <WhatsappIcon />
                          Hubungi
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Course yang pernah didaftarkan
                    </p>
                    {visibleCourses.length === 0 ? (
                      <p className="mt-2 text-sm font-semibold text-slate-400">
                        Belum memiliki course.
                      </p>
                    ) : (
                      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                        {visibleCourses.map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex max-w-full flex-col rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs"
                          >
                            <span className="break-words font-black text-blue-900">
                              {course.title}
                            </span>
                            <span className="mt-0.5 break-words font-semibold text-blue-600">
                              {course.organizations?.title ?? "Universitas tidak tersedia"}
                              {course.organizations?.short_name
                                ? ` · ${course.organizations.short_name}`
                                : ""}
                            </span>
                          </span>
                        ))}
                        {remainingCourses > 0 && (
                          <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                            +{remainingCourses} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/admin/student/${student.id}`}
                    className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-black text-[#1769cf] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 xl:w-auto"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {directory.totalPages > 1 && (
        <nav
          aria-label="Pagination mahasiswa"
          className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          {currentPage > 1 ? (
            <Link
              href={buildPageHref({
                query,
                organizationId,
                courseId,
                page: currentPage - 1,
              })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-100 px-4 py-2 text-sm font-bold text-slate-300">
              ← Sebelumnya
            </span>
          )}

          <p className="text-center text-sm font-semibold text-slate-500">
            Menampilkan maksimal {directory.pageSize} mahasiswa per halaman
          </p>

          {currentPage < directory.totalPages ? (
            <Link
              href={buildPageHref({
                query,
                organizationId,
                courseId,
                page: currentPage + 1,
              })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Berikutnya →
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-100 px-4 py-2 text-sm font-bold text-slate-300">
              Berikutnya →
            </span>
          )}
        </nav>
      )}
    </main>
  );
}
