import { notFound, redirect } from "next/navigation";

import BackButton from "@/components/messages/BackButton";
import StudentReplyForm from "@/components/messages/StudentReplyForm";
import ThreadReadTracker from "@/components/messages/ThreadReadTracker";
import { lessonMessageService, profileService } from "@/services";

interface StudentMessageThreadPageProps {
  params: Promise<{ threadId: string }>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: "student" | "mentor" | "admin"): string {
  if (role === "mentor") return "Mentor";
  if (role === "admin") return "Admin";
  return "Peserta";
}

export default async function StudentMessageThreadPage({
  params,
}: StudentMessageThreadPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") redirect("/dashboard");

  const { threadId } = await params;
  const thread = await lessonMessageService.getStudentThreadDetail(
    profile.id,
    threadId,
  );
  if (!thread) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ThreadReadTracker
        threadId={thread.id}
        readThrough={thread.lastMessageAt}
      />
      <BackButton label="Kembali ke Kotak Pesan" />

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">
              {thread.lessonTitle ? "Pertanyaan dari lesson" : "Pertanyaan umum"}
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">
              {thread.courseTitle}
            </h1>
            {thread.lessonTitle && (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Lesson: {thread.lessonTitle}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
              thread.status === "open"
                ? "bg-amber-50 text-amber-700"
                : thread.status === "answered"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {thread.status === "open"
              ? "Menunggu Jawaban"
              : thread.status === "answered"
                ? "Dijawab"
                : "Selesai"}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Percakapan</h2>
        <div className="mt-5 max-h-[38rem] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4 sm:p-5">
          {thread.messages.map((entry) => {
            const mine = entry.sender_profile_id === profile.id;
            return (
              <article
                key={entry.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${
                  mine
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-white text-slate-700 ring-1 ring-blue-100"
                }`}
              >
                <p className="text-[11px] font-black uppercase tracking-wide opacity-75">
                  {mine ? "Anda" : entry.senderName} · {roleLabel(entry.sender_role)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                  {entry.message}
                </p>
                <p className="mt-2 text-[10px] font-semibold opacity-65">
                  {formatDate(entry.created_at)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-950">
          Kirim Balasan
        </h2>
        <StudentReplyForm threadId={thread.id} />
      </section>
    </main>
  );
}
