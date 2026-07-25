import Link from "next/link";
import { redirect } from "next/navigation";

import { profileService, tryoutService } from "@/services";

interface TryoutResultPageProps {
  params: Promise<{ attemptId: string }>;
}

function formatDuration(seconds: number | undefined): string {
  if (typeof seconds !== "number") return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} menit ${remainingSeconds} detik`;
}

export default async function TryoutResultPage({
  params,
}: TryoutResultPageProps) {
  const { attemptId } = await params;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/dashboard");

  const result = await tryoutService.getResult(attemptId);

  if (result.released === false) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/dashboard/student"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke dashboard
        </Link>
        <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-2xl">
            ⏳
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Nilai Belum Dipublikasikan
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            {result.message ??
              "Nilai akan tersedia setelah periode Try Out berakhir."}
          </p>
        </section>
      </main>
    );
  }

  const score = Math.round(result.score ?? 0);
  const passed = Boolean(result.passed);
  const detail = result.tryout_id
    ? await tryoutService.getStudentTryoutDetail(profile.id, result.tryout_id)
    : null;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href={
          detail
            ? `/dashboard/student/my-course/${detail.tryout.course_id}`
            : "/dashboard/student"
        }
        className="text-sm font-black text-blue-700 hover:underline"
      >
        ← Kembali ke course
      </Link>

      <section
        className={`overflow-hidden rounded-[2rem] text-white shadow-xl ${
          passed
            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#064e3b]"
            : "bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d]"
        }`}
      >
        <div className="p-7 text-center sm:p-10">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ring-1 ring-white/20">
            Hasil Try Out
          </span>
          <h1 className="mt-5 text-2xl font-black sm:text-3xl">
            {result.title ?? "Try Out"}
          </h1>
          <p className="mt-6 text-6xl font-black tabular-nums">{score}</p>
          <p className="mt-3 text-lg font-black">
            {passed ? "Lulus" : "Belum Mencapai Nilai Lulus"}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/75">
            Nilai lulus {result.passing_score ?? 70}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-emerald-100 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-emerald-700">
            {result.total_correct ?? 0}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            Benar
          </p>
        </article>
        <article className="rounded-3xl border border-red-100 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-red-700">
            {result.total_wrong ?? 0}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            Salah
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-slate-700">
            {result.total_unanswered ?? 0}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            Tidak Dijawab
          </p>
        </article>
        <article className="rounded-3xl border border-blue-100 bg-white p-5 text-center shadow-sm">
          <p className="text-lg font-black text-blue-700">
            {formatDuration(result.duration_seconds)}
          </p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            Durasi
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Pembahasan</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {result.review_available
            ? "Pembahasan sudah tersedia dan akan ditampilkan pada halaman review Try Out."
            : "Pembahasan belum tersedia. Admin dapat menjadwalkannya setelah periode Try Out berakhir."}
        </p>
      </section>
    </main>
  );
}
