import Link from "next/link";

import { EmptyState } from "@/components/admin";
import { deleteCourseFormAction } from "@/app/dashboard/admin/course/actions";
import CourseStatusBadge from "./CourseStatusBadge";
import type { CourseDetails } from "@/repositories/course.repository";

interface CourseTableProps { courses: CourseDetails[]; }

function formatRupiah(value: number | null) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value ?? 0);
}

export default function CourseTable({ courses }: CourseTableProps) {
  if (courses.length === 0) {
    return <EmptyState title="Course tidak ditemukan" description="Ubah kata kunci atau filter untuk melihat course yang sesuai." />;
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {courses.map((course) => (
        <article key={course.id} className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
          <div className="min-w-0 space-y-3">
            <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">{course.title}</h2>
            <div className="flex flex-wrap gap-2">
              {course.organization?.is_general ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">Umum / Nasional</span> : null}
              <CourseStatusBadge status={course.status} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 p-4 text-sm">
            <p className="min-w-0 break-words"><span className="font-bold text-slate-500">Organization:</span> <span className="font-extrabold text-[#061827]">{course.organization?.title ?? "-"}</span></p>
            <p className="min-w-0 break-words"><span className="font-bold text-slate-500">Program:</span> <span className="font-extrabold text-[#061827]">{course.program?.title ?? "-"}</span></p>
            <p className="min-w-0 break-all"><span className="font-bold text-slate-500">Slug:</span> <span className="font-extrabold text-[#1769cf]">{course.slug}</span></p>
            <p><span className="font-bold text-slate-500">Harga:</span> <span className="font-extrabold text-[#061827]">{course.is_free ? "Gratis" : formatRupiah(course.price)}</span></p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/dashboard/admin/course/${course.id}/explorer`} className="inline-flex min-h-10 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">Explorer</Link>
            <Link href={`/dashboard/admin/course/${course.id}/mentors`} className="inline-flex min-h-10 items-center rounded-xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100">Atur Mentor</Link>
            <Link href={`/dashboard/admin/course/${course.id}/edit`} className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] hover:bg-blue-100">Edit</Link>
            <form action={deleteCourseFormAction}>
              <input type="hidden" name="id" value={course.id} />
              <button type="submit" className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">Hapus</button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
