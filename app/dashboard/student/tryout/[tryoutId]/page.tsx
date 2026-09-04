import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { profileService, tryoutService } from "@/services";

import { startTryoutAction } from "@/app/actions/tryout.actions";

interface StudentTryoutDetailPageProps {
  params: Promise<{ tryoutId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDate(value: string | null): string {
  if (!value) return "Tidak dibatasi";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatAttemptStatus(status: "submitted" | "expired"): string {
  return status === "expired" ? "Dikirim otomatis" : "Selesai";
}

export default async function StudentTryoutDetailPage({
  params,
  searchParams,
}: StudentTryoutDetailPageProps) {
  const { tryoutId } = await params;
  const query = await searchParams;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/dashboard");

  const payload = await tryoutService.getStudentTryoutDetail(
    profile.id,
    tryoutId,
  );

  if (!payload) notFound();

  const { tryout, course } = payload;
  const attemptsRemaining = Math.max(
    tryout.max_attempts - tryout.attemptsUsed,
    0,
  );
  const startAction = startTryoutAction.bind(null, tryoutId);
  const latestAttempt = tryout.completedAttempts.at(-1);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/dashboard/student/my-course/${tryout.course_id}`}
        className="text-sm font-black text-blue-700 hover:underline"
      >
        ← Kembali ke course
      </Link>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] text-white shadow-xl shadow-blue-950/10">
        <div className="p-6 sm:p-8">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-50 ring-1 ring-white/20">
            Try Out Course
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            {tryout.title}
          </h1>
          <p className="mt-3 text-sm font-bold text-blue-100">
            {course?.title} · {course?.organizationTitle}
          </p>
          {tryout.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-blue-100">
              {tryout.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 bg-white/5 text-center">
          <div className="p-4">
            <p className="text-2xl font-black">{tryout.duration_minutes}</p>
            <p className="mt-1 text-xs font-bold text-blue-100">menit</p>
          </div>
          <div className="border-x border-white/10 p-4">
            <p className="text-2xl font-black">{attemptsRemaining}</p>
            <p className="mt-1 text-xs font-bold text-blue-100">attempt tersisa</p>
          </div>
          <div className="p-4">
            <p className="text-2xl font-black">{tryout.passing_score}</p>
            <p className="mt-1 text-xs font-bold text-blue-100">nilai lulus</p>
          </div>
        </div>
      </section>

      {getParam(query.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(query.error)}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Jadwal</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-black text-slate-500">Dibuka</dt>
              <dd className="mt-1 font-bold text-slate-900">
                {formatDate(tryout.open_at)}
              </dd>
            </div>
            <div>
              <dt className="font-black text-slate-500">Ditutup</dt>
              <dd className="mt-1 font-bold text-slate-900">
                {formatDate(tryout.close_at)}
              </dd>
            </div>
            <div>
              <dt className="font-black text-slate-500">Status</dt>
              <dd className="mt-1 font-bold text-blue-700">
                {tryout.availabilityLabel}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl border border-amber-100 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-xl font-black text-amber-900">
            Sebelum Memulai
          </h2>
          <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-amber-900/80">
            <li>• Timer menggunakan waktu server dan terus berjalan setelah dimulai.</li>
            <li>• Jawaban tersimpan otomatis setiap kali pilihan diubah.</li>
            <li>• Refresh halaman tidak menghapus jawaban yang sudah tersimpan.</li>
            <li>• Attempt akan dikirim otomatis saat waktu habis.</li>
          </ul>
        </article>
      </section>

      {tryout.bestScore !== null && (
        <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
            Hasil Terbaik
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-900">
            {Math.round(tryout.bestScore)}
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-700">
            {tryout.passed ? "Lulus" : "Belum mencapai nilai lulus"}
          </p>
        </section>
      )}

      {tryout.completedAttempts.length > 0 &&
        (tryout.resultReleased || tryout.reviewReleased) && (
          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">
              Riwayat Percobaan
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pilih percobaan untuk melihat soal, jawaban Anda, kunci jawaban,
              dan pembahasan.
            </p>
            <div className="mt-5 space-y-3">
              {tryout.completedAttempts.map((attempt) => (
                <article
                  key={attempt.attemptId}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-slate-900">
                      Percobaan {attempt.attemptNumber}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatAttemptStatus(attempt.status)}
                      {attempt.score !== null
                        ? ` · Nilai ${Math.round(attempt.score)}`
                        : ""}
                      {attempt.submittedAt
                        ? ` · ${formatDate(attempt.submittedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tryout.resultReleased && (
                      <Link
                        href={`/dashboard/student/tryout/result/${attempt.attemptId}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-50"
                      >
                        Lihat Hasil
                      </Link>
                    )}
                    {tryout.reviewReleased && (
                      <Link
                        href={`/dashboard/student/tryout/review/${attempt.attemptId}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        Lihat Pembahasan
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        {tryout.activeAttemptId ? (
          <Link
            href={`/dashboard/student/tryout/attempt/${tryout.activeAttemptId}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white transition hover:bg-blue-700"
          >
            Lanjutkan Try Out
          </Link>
        ) : tryout.isAvailable && attemptsRemaining > 0 ? (
          <form action={startAction}>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white transition hover:bg-blue-700"
            >
              Mulai Try Out Sekarang
            </button>
          </form>
        ) : attemptsRemaining === 0 &&
          latestAttempt &&
          (tryout.resultReleased || tryout.reviewReleased) ? (
          <Link
            href={
              tryout.resultReleased
                ? `/dashboard/student/tryout/result/${latestAttempt.attemptId}`
                : `/dashboard/student/tryout/review/${latestAttempt.attemptId}`
            }
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white transition hover:bg-blue-700"
          >
            Lihat Hasil & Pembahasan
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-base font-black text-slate-400"
          >
            {attemptsRemaining === 0
              ? "Batas Percobaan Telah Habis"
              : tryout.availabilityLabel}
          </button>
        )}
      </section>
    </main>
  );
}
