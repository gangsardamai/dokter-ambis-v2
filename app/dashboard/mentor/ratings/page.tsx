import Link from "next/link";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

interface MentorRatingCourse {
  courseId: string;
  courseTitle: string;
  organizationTitle: string;
  programTitle: string;
  isActive: boolean;
  averageRating: number;
  ratingCount: number;
}

interface MentorRatingDashboard {
  overallAverage: number;
  totalRatings: number;
  courses: MentorRatingCourse[];
}

export default async function MentorRatingsPage() {
  const supabase = await createClient();
  const dashboard = await callDynamicRpc<MentorRatingDashboard>(
    supabase,
    "mentor_get_rating_dashboard",
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Penilaian Mentor</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Rekap Penilaian</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Lihat rata-rata bintang dan saran peserta pada setiap course yang pernah ditugaskan kepada Anda.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">Rata-rata</p>
              <p className="mt-1 text-3xl font-black">★ {Number(dashboard.overallAverage).toFixed(1)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">Total penilaian</p>
              <p className="mt-1 text-3xl font-black">{dashboard.totalRatings}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {dashboard.courses.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="font-black text-slate-950">Belum ada course dalam riwayat penugasan.</p>
          </div>
        ) : (
          dashboard.courses.map((course) => (
            <Link
              key={course.courseId}
              href={`/dashboard/mentor/ratings/${course.courseId}`}
              className="block rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-lg font-black text-slate-950">{course.courseTitle}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${course.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {course.isActive ? "Aktif" : "Riwayat"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {course.organizationTitle} · {course.programTitle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-amber-50 px-4 py-3">
                  <span className="text-lg font-black text-amber-600">★ {Number(course.averageRating).toFixed(1)}</span>
                  <span className="text-sm font-bold text-slate-500">{course.ratingCount} penilaian</span>
                  <span className="text-blue-700">→</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
