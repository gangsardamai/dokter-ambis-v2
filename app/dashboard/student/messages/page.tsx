import { redirect } from "next/navigation";

import BackButton from "@/components/messages/BackButton";
import PendingLink from "@/components/navigation/PendingLink";
import { lessonMessageService, profileService } from "@/services";
import type { LessonMessageThreadStatus } from "@/supabase/types/database.app.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: LessonMessageThreadStatus): string {
  return {
    open: "Menunggu Jawaban",
    answered: "Dijawab",
    closed: "Selesai",
  }[status];
}

function statusClass(status: LessonMessageThreadStatus): string {
  return {
    open: "bg-amber-50 text-amber-700",
    answered: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
  }[status];
}

export default async function StudentMessagesPage() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") redirect("/dashboard");

  const threads = await lessonMessageService.getStudentInbox(profile.id);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton label="Kembali" />
        <PendingLink
          href="/dashboard/student/messages/new"
          pendingLabel="Memuat..."
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
        >
          + Buat Pertanyaan
        </PendingLink>
      </div>

      <section className="rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
          Bantuan Belajar
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
          Kotak Pesan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
          Semua pertanyaan yang dibuat dari halaman ini maupun dari lesson
          tersimpan dalam satu riwayat.
        </p>
      </section>

      <section className="space-y-3">
        {threads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-900">
              Belum ada percakapan.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Buat pertanyaan baru atau kirim pertanyaan dari lesson.
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <PendingLink
              key={thread.id}
              href={`/dashboard/student/messages/${thread.id}`}
              pendingLabel="Membuka..."
              contentClassName="flex w-full items-start gap-3"
              className="block rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-black text-slate-950">
                    {thread.courseTitle}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(thread.status)}`}
                  >
                    {statusLabel(thread.status)}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-400 px-2 py-1 text-[11px] font-black text-amber-950">
                      {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-bold text-blue-700">
                  {thread.lessonTitle
                    ? `Dari lesson: ${thread.lessonTitle}`
                    : "Pertanyaan umum course"}
                </p>
                <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {thread.latestMessage}
                </p>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-semibold text-slate-400">
                  <span>
                    {thread.latestSenderName} · {thread.latestSenderRole === "student"
                      ? "Peserta"
                      : thread.latestSenderRole === "mentor"
                        ? "Mentor"
                        : "Admin"}
                  </span>
                  <span>{formatDate(thread.lastMessageAt)}</span>
                </div>
              </div>
            </PendingLink>
          ))
        )}
      </section>
    </main>
  );
}
