import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import {
  lessonMessageService,
  profileService,
} from "@/services";
import type { LessonMessageThreadStatus } from "@/supabase/types/database.app.types";

interface AdminMessagesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isStatus(value: string): value is LessonMessageThreadStatus {
  return ["open", "answered", "closed"].includes(value);
}

function statusLabel(status: LessonMessageThreadStatus): string {
  return {
    open: "Belum Dijawab",
    answered: "Dijawab",
    closed: "Ditutup",
  }[status];
}

function statusClass(status: LessonMessageThreadStatus): string {
  return {
    open: "bg-amber-50 text-amber-700",
    answered: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
  }[status];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminMessagesPage({
  searchParams,
}: AdminMessagesPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = getParam(params.q).trim().toLowerCase();
  const rawStatus = getParam(params.status);
  const selectedStatus = isStatus(rawStatus) ? rawStatus : "all";

  const threads = await lessonMessageService.getAdminInbox();
  const filtered = threads.filter((thread) => {
    const matchesStatus =
      selectedStatus === "all" || thread.status === selectedStatus;
    const searchable = [
      thread.studentName,
      thread.studentUniversity,
      thread.courseUniversity,
      thread.programTitle,
      thread.courseTitle,
      thread.lessonTitle,
      thread.latestMessage,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!query || searchable.includes(query));
  });

  const openCount = threads.filter((thread) => thread.status === "open").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Kotak Pesan"
        description="Kelola pertanyaan dan saran peserta yang dikirim dari setiap lesson."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">
            Belum Dijawab
          </p>
          <p className="mt-2 text-3xl font-black text-amber-900">{openCount}</p>
        </article>
        <article className="rounded-2xl border border-blue-100 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Total Percakapan
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {threads.length}
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
            Sudah Dijawab
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-900">
            {threads.filter((thread) => thread.status === "answered").length}
          </p>
        </article>
      </section>

      <form
        method="GET"
        className="grid gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_15rem_auto]"
      >
        <div>
          <label htmlFor="q" className="mb-2 block text-sm font-black text-slate-700">
            Pencarian
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={getParam(params.q)}
            placeholder="Nama peserta, universitas, course, lesson, atau isi pesan"
            className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-black text-slate-700"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={selectedStatus}
            className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Semua status</option>
            <option value="open">Belum dijawab</option>
            <option value="answered">Dijawab</option>
            <option value="closed">Ditutup</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-700"
          >
            Terapkan
          </button>
          {(query || selectedStatus !== "all") && (
            <Link
              href="/dashboard/admin/messages"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
            <p className="font-black text-slate-800">Belum ada pesan yang sesuai.</p>
          </div>
        ) : (
          filtered.map((thread) => (
            <Link
              key={thread.id}
              href={`/dashboard/admin/messages/${thread.id}`}
              className="block rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-950">
                      {thread.studentName}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass(thread.status)}`}
                    >
                      {statusLabel(thread.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Universitas peserta: {thread.studentUniversity ?? "Belum diisi"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-blue-700">
                    <span>{thread.courseUniversity}</span>
                    <span>{thread.programTitle}</span>
                    <span>{thread.courseTitle}</span>
                    <span>{thread.lessonTitle}</span>
                  </div>
                  <p className="mt-4 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {thread.latestMessage}
                  </p>
                </div>
                <div className="shrink-0 text-xs font-semibold text-slate-400 lg:text-right">
                  <p>{formatDate(thread.lastMessageAt)}</p>
                  <p className="mt-1">
                    Pesan terakhir: {thread.latestSenderRole === "admin" ? "Admin" : "Peserta"}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
