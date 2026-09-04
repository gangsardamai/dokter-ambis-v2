import Link from "next/link";

import type { StudentTryoutListItem } from "@/types/tryout";

interface StudentTryoutListProps {
  tryouts: StudentTryoutListItem[];
}

function formatDate(value: string | null): string {
  if (!value) return "Tidak dibatasi";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function StudentTryoutList({
  tryouts,
}: StudentTryoutListProps) {
  if (tryouts.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
        <p className="font-black text-slate-900">Try Out belum tersedia.</p>
        <p className="mt-2 text-sm text-slate-500">
          Try Out akan muncul setelah dijadwalkan oleh Admin.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {tryouts.map((tryout) => {
        const latestAttempt = tryout.completedAttempts.at(-1);
        const canOpenCompletedAttempt = Boolean(
          latestAttempt && (tryout.resultReleased || tryout.reviewReleased),
        );
        const canOpen = tryout.isAvailable || canOpenCompletedAttempt;

        return (
          <article
            key={tryout.id}
            className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5"
          >
          <div className="bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-50 ring-1 ring-white/20">
                  Try Out Course
                </span>
                <h3 className="mt-3 break-words text-xl font-black">
                  {tryout.title}
                </h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  tryout.isAvailable
                    ? "bg-emerald-300/20 text-emerald-50 ring-1 ring-emerald-200/30"
                    : "bg-white/10 text-blue-100 ring-1 ring-white/15"
                }`}
              >
                {tryout.availabilityLabel}
              </span>
            </div>

            {tryout.description && (
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-blue-100">
                {tryout.description}
              </p>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-black text-slate-900">
                  {tryout.duration_minutes}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  menit
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-black text-slate-900">
                  {tryout.attemptsUsed}/{tryout.max_attempts}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  percobaan
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-black text-slate-900">
                  {tryout.passing_score}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  nilai lulus
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 p-4 text-xs leading-6 text-slate-600">
              <p>
                <span className="font-black text-slate-800">Buka:</span>{" "}
                {formatDate(tryout.open_at)}
              </p>
              <p>
                <span className="font-black text-slate-800">Tutup:</span>{" "}
                {formatDate(tryout.close_at)}
              </p>
              {tryout.bestScore !== null && (
                <p className="mt-1">
                  <span className="font-black text-slate-800">
                    Nilai terbaik:
                  </span>{" "}
                  {Math.round(tryout.bestScore)}
                  {tryout.passed ? " · Lulus" : " · Belum lulus"}
                </p>
              )}
            </div>

            <Link
              href={
                tryout.activeAttemptId
                  ? `/dashboard/student/tryout/attempt/${tryout.activeAttemptId}`
                  : `/dashboard/student/tryout/${tryout.id}`
              }
              className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-black transition ${
                canOpen
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "pointer-events-none bg-slate-100 text-slate-400"
              }`}
              aria-disabled={!canOpen}
            >
              {tryout.activeAttemptId
                ? "Lanjutkan Try Out"
                : tryout.attemptsUsed >= tryout.max_attempts &&
                    canOpenCompletedAttempt
                  ? "Lihat Hasil & Pembahasan"
                  : "Lihat Try Out"}
            </Link>
          </div>
          </article>
        );
      })}
    </div>
  );
}
