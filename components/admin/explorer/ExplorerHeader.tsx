import Link from "next/link";
import type { ReactNode } from "react";

import type { Database } from "@/supabase/types/database.types";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface ExplorerHeaderProps {
  course: Course;
  folderCount: number;
  lessonCount: number;
}

function CourseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 7l8 4 8-4-8-4Z" />
      <path d="m4 11 8 4 8-4" />
      <path d="m4 15 8 4 8-4" />
    </svg>
  );
}

function FolderIcon() {
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
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function LessonIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1769cf]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold tracking-[-0.04em] text-[#061827]">
            {value.toLocaleString("id-ID")}
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExplorerHeader({
  course,
  folderCount,
  lessonCount,
}: ExplorerHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />

      <div className="relative space-y-6">
        <Link
          href="/dashboard/admin/course"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Kembali ke Course
        </Link>

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm sm:h-16 sm:w-16">
            <CourseIcon />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769cf]">
              Course Explorer
            </p>
            <h1 className="mt-2 break-words text-2xl font-extrabold tracking-[-0.045em] text-[#061827] sm:text-3xl lg:text-4xl">
              {course.title}
            </h1>
            <span className="mt-3 inline-flex max-w-full break-all rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {course.slug}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <StatCard
            icon={<FolderIcon />}
            label="Folder"
            value={folderCount}
          />
          <StatCard
            icon={<LessonIcon />}
            label="Lesson"
            value={lessonCount}
          />
        </div>
      </div>
    </section>
  );
}
