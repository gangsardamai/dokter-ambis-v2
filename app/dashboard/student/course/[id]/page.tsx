import Link from "next/link";
import { notFound } from "next/navigation";

import CourseDescription from "@/components/course/CourseDescription";
import { courseService } from "@/services";
import { enrollCourseAction } from "./actions";

interface StudentCourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function StudentCourseDetailPage({
  params,
}: StudentCourseDetailPageProps) {
  const { id } = await params;
  const course = await courseService.getAvailableCourseDetailById(id);

  if (!course) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/student"
        className="inline-flex min-h-11 items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
      >
        ← Kembali ke daftar blok
      </Link>

      <article className="mt-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-950/10">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-7 text-white sm:p-9">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-50">
              Aktif
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Universitas
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {course.organization?.title ?? "Universitas belum tersedia"}
              </p>
              {course.organization?.short_name && (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {course.organization.short_name}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-blue-50/70 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-400">
                Program
              </p>
              <p className="mt-2 text-lg font-black text-blue-950">
                {course.program?.title ?? "Program belum tersedia"}
              </p>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6">
            <h2 className="text-lg font-black text-slate-950">
              Tentang Kelas
            </h2>
            <CourseDescription description={course.description} />
          </section>

          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Harga blok
              </p>
              <p className="mt-1 text-2xl font-black text-blue-700">
                {course.is_free ? "Gratis" : formatRupiah(course.price)}
              </p>
            </div>

            <form
              action={enrollCourseAction.bind(null, course.id)}
              className="w-full sm:w-auto"
            >
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/10 transition hover:from-blue-700 hover:to-[#032f50] sm:w-auto"
              >
                Daftar Blok
              </button>
            </form>
          </div>
        </div>
      </article>
    </main>
  );
}
