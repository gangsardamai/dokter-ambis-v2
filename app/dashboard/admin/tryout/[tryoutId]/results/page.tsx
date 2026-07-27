import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { tryoutService } from "@/services";

interface TryoutResultsPageProps {
  params: Promise<{ tryoutId: string }>;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function TryoutResultsPage({
  params,
}: TryoutResultsPageProps) {
  const { tryoutId } = await params;
  const [payload, results] = await Promise.all([
    tryoutService.getEditorPayload(tryoutId),
    tryoutService.getAdminResults(tryoutId),
  ]);

  if (!payload) notFound();

  const scored = results.filter((result) => result.score !== null);
  const averageScore =
    scored.length > 0
      ? scored.reduce((total, result) => total + (result.score ?? 0), 0) /
        scored.length
      : 0;
  const passedCount = scored.filter(
    (result) => (result.score ?? 0) >= payload.tryout.passing_score,
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/admin/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/edit`}
            className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
          >
            Pengaturan
          </Link>
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/questions`}
            className="inline-flex min-h-10 items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"
          >
            Kelola Soal
          </Link>
        </div>
      </div>

      <PageHeader
        title="Hasil Try Out"
        description={`${payload.tryout.title} · ${payload.course?.title ?? "Course"}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Attempt Selesai
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">{results.length}</p>
        </article>
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Rata-rata Nilai
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {Math.round(averageScore)}
          </p>
        </article>
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Peserta Lulus
          </p>
          <p className="mt-3 text-3xl font-black text-emerald-700">{passedCount}</p>
        </article>
        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Persentase Lulus
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {scored.length > 0 ? Math.round((passedCount / scored.length) * 100) : 0}%
          </p>
        </article>
      </section>

      {results.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
          <p className="font-black text-slate-900">Belum ada hasil peserta.</p>
          <p className="mt-2 text-sm text-slate-500">
            Hasil akan muncul setelah peserta menyelesaikan Try Out.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Peserta</th>
                  <th className="px-5 py-4">Attempt</th>
                  <th className="px-5 py-4">Nilai</th>
                  <th className="px-5 py-4">Benar</th>
                  <th className="px-5 py-4">Salah</th>
                  <th className="px-5 py-4">Kosong</th>
                  <th className="px-5 py-4">Durasi</th>
                  <th className="px-5 py-4">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => {
                  const passed =
                    (result.score ?? 0) >= payload.tryout.passing_score;

                  return (
                    <tr key={result.attemptId} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">
                          {result.studentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.universityOrigin ?? "Universitas belum diisi"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        #{result.attemptNumber}
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {result.status}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-black ${
                            passed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {result.score === null ? "-" : Math.round(result.score)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {result.totalCorrect}
                      </td>
                      <td className="px-5 py-4 font-black text-red-700">
                        {result.totalWrong}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-500">
                        {result.totalUnanswered}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDuration(result.durationSeconds)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(result.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
