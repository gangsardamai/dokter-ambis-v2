"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface DashboardCourseItem {
  id: string;
  title: string;
  description?: string | null;
  organizationTitle: string;
  organizationShortName?: string | null;
  programTitle: string;
  statusLabel: string;
  metaLabel?: string | null;
  priceLabel?: string | null;
  href: string;
  actionLabel: string;
}

interface CourseDirectoryProps {
  courses: DashboardCourseItem[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  showFilters?: boolean;
}

function normalize(value: string) {
  return value.toLocaleLowerCase("id-ID").trim();
}

export default function CourseDirectory({
  courses,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  showFilters = false,
}: CourseDirectoryProps) {
  const [query, setQuery] = useState("");
  const [organization, setOrganization] = useState("");
  const [program, setProgram] = useState("");

  const organizations = useMemo(
    () =>
      Array.from(
        new Set(courses.map((course) => course.organizationTitle)),
      ).sort((a, b) => a.localeCompare(b, "id-ID")),
    [courses],
  );

  const programs = useMemo(
    () =>
      Array.from(
        new Set(
          courses
            .filter(
              (course) =>
                !organization ||
                course.organizationTitle === organization,
            )
            .map((course) => course.programTitle),
        ),
      ).sort((a, b) => a.localeCompare(b, "id-ID")),
    [courses, organization],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = normalize(query);

    return courses.filter((course) => {
      const matchesQuery =
        !normalizedQuery ||
        normalize(
          [
            course.title,
            course.organizationTitle,
            course.organizationShortName ?? "",
            course.programTitle,
          ].join(" "),
        ).includes(normalizedQuery);
      const matchesOrganization =
        !organization ||
        course.organizationTitle === organization;
      const matchesProgram =
        !program || course.programTitle === program;

      return matchesQuery && matchesOrganization && matchesProgram;
    });
  }, [courses, organization, program, query]);

  function resetFilters() {
    setQuery("");
    setOrganization("");
    setProgram("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
        <div className={`grid gap-3 ${showFilters ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" : ""}`}>
          <label className="min-w-0">
            <span className="sr-only">Cari course</span>
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
              />
            </div>
          </label>

          {showFilters && (
            <>
              <select
                value={organization}
                onChange={(event) => {
                  setOrganization(event.target.value);
                  setProgram("");
                }}
                className="min-h-12 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-label="Filter universitas"
              >
                <option value="">Semua Universitas</option>
                {organizations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                className="min-h-12 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-label="Filter program"
              >
                <option value="">Semua Program</option>
                {programs.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="min-h-12 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Reset
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-xs font-bold text-slate-500" aria-live="polite">
          {filteredCourses.length} dari {courses.length} course ditampilkan
        </p>
      </section>

      {filteredCourses.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>
          <h2 className="mt-5 text-lg font-black text-slate-950">
            {emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {emptyDescription}
          </p>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <article
              key={course.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-5 text-white">
                <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
                <div className="absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-blue-50 backdrop-blur-sm">
                    {course.statusLabel}
                  </span>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/20 backdrop-blur-sm">
                    {course.title.slice(0, 1).toUpperCase()}
                  </span>
                </div>

                <h2 className="relative mt-6 break-words text-xl font-black tracking-[-0.03em]">
                  {course.title}
                </h2>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Universitas
                    </p>
                    <p className="mt-1 break-words font-black text-slate-900">
                      {course.organizationTitle}
                    </p>
                    {course.organizationShortName && (
                      <p className="mt-1 font-semibold text-slate-500">
                        {course.organizationShortName}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-blue-50/70 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-400">
                      Program
                    </p>
                    <p className="mt-1 break-words font-black text-blue-900">
                      {course.programTitle}
                    </p>
                  </div>
                </div>

                {course.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                    {course.description}
                  </p>
                )}

                <div className="mt-auto pt-5">
                  {(course.metaLabel || course.priceLabel) && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
                      <span className="font-semibold text-slate-500">
                        {course.metaLabel}
                      </span>
                      <span className="font-black text-blue-700">
                        {course.priceLabel}
                      </span>
                    </div>
                  )}

                  <Link
                    href={course.href}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/10 transition group-hover:shadow-blue-950/20 hover:from-blue-700 hover:to-[#032f50] focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {course.actionLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
