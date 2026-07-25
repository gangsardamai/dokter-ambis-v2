import Link from "next/link";

import { PageHeader } from "@/components/admin";
import { tryoutService } from "@/services";

interface TryoutAdminPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    deleted?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDate(value: string | null): string {
  if (!value) return "Tidak dibatasi";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function statusClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700";
    case "scheduled":
      return "bg-blue-50 text-blue-700";
    case "closed":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default async function TryoutAdminPage({
  searchParams,
}: TryoutAdminPageProps) {
  const params = await searchParams;
  const q = getParam(params.q).trim().toLowerCase();
  const selectedStatus = getParam(params.status) || "all";
  const tryouts = await tryoutService.getAdminTryouts();

  const filtered = tryouts.filter((tryout) => {
    const searchable = [
      tryout.title,
      tryout.course?.title,
      tryout.course?.organizationTitle,
      tryout.course?.programTitle,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!q || searchable.includes(q)) &&
      (selectedStatus === "all" ||
        tryout.publication_status === selectedStatus)
    );
  });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Try Out"
        description="Kelola simulasi ujian per course, jadwal, soal, dan hasil peserta."
        actions={
          <Link
            href="/dashboard/admin/tryout/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-[#033b63] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Tambah Try Out
          </Link>
        }
      />

      {getParam(params.deleted) === "true" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          Try Out berhasil dihapus.
        </div>
      )}

      <form
        method="GET"
        className="grid gap-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_15rem_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={getParam(params.q)}
          placeholder="Cari Try Out, course, universitas, atau program..."
          className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <select
          name="status"
          defaultValue={selectedStatus}
          className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Semua status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-blue-50 px-5 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
        >
          Terapkan
        </button>
      </form>

      {filtered.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
          <p className="font-black text-slate-900">Belum ada Try Out.</p>
          <p className="mt-2 text-sm text-slate-500">
            Tambahkan Try Out baru untuk course yang sudah tersedia.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {filtered.map((tryout) => (
            <article
              key={tryout.id}
              className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass(
                      tryout.publication_status,
                    )}`}
                  >
                    {tryout.publication_status}
                  </span>
                  <h2 className="mt-3 break-words text-xl font-black text-slate-950">
                    {tryout.title}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-blue-700">
                    {tryout.course?.title ?? "Course tidak tersedia"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {tryout.course?.organizationTitle} · {tryout.course?.programTitle}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <p className="text-2xl font-black text-slate-950">
                    {tryout.questionCount}
                  </p>
                  <p className="text-xs font-bold text-slate-500">soal</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black text-slate-900">
                    {tryout.duration_minutes} menit
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Durasi</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black text-slate-900">
                    {tryout.max_attempts} kali
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Percobaan</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black text-slate-900">
                    {tryout.passing_score}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Nilai lulus</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-black text-slate-900">
                    {tryout.participantCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Peserta</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 p-4 text-xs leading-6 text-slate-600">
                <p>
                  <span className="font-black text-slate-800">Buka:</span>{" "}
                  {formatDate(tryout.open_at)}
                </p>
                <p>
                  <span className="font-black text-slate-800">Tutup:</span>{" "}
                  {formatDate(tryout.close_at)}
                </p>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Link
                  href={`/dashboard/admin/tryout/${tryout.id}/edit`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                >
                  Pengaturan
                </Link>
                <Link
                  href={`/dashboard/admin/tryout/${tryout.id}/questions`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                >
                  Kelola Soal
                </Link>
                <Link
                  href={`/dashboard/admin/tryout/${tryout.id}/results`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                >
                  Lihat Hasil
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
