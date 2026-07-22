import Link from "next/link";

import { EmptyState } from "@/components/admin";

import { deleteCourseFormAction } from "@/app/dashboard/admin/course/actions";

import CourseStatusBadge from "./CourseStatusBadge";

import type { Database } from "@/supabase/types/database.types";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface CourseTableProps {
  courses: Course[];
}

function CourseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
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

function formatRupiah(value: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function CourseTable({
  courses,
}: CourseTableProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="Belum ada Course"
        description="Silakan tambahkan course baru."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <article
          key={course.id}
          className="group min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus-within:ring-2 focus-within:ring-blue-200"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
              <CourseIcon />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                {course.title}
              </h2>
              <p className="mt-2 break-all rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1769cf]">
                {course.slug}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Harga
              </p>
              <p className="text-sm font-extrabold text-[#061827]">
                {formatRupiah(course.price)}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Gratis
              </p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                course.is_free
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
              >
                {course.is_free ? "Gratis" : "Tidak"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Status
              </p>
              <CourseStatusBadge status={course.status} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/admin/course/${course.id}/explorer`}
              className="inline-flex min-h-10 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              Explorer
            </Link>

            <Link
              href={`/dashboard/admin/course/${course.id}/edit`}
              className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Edit
            </Link>

            <form action={deleteCourseFormAction}>
              <input
                type="hidden"
                name="id"
                value={course.id}
              />

              <button
                type="submit"
                className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                Hapus
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
