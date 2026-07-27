import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { replyLessonMessageAsMentorAction } from "@/app/actions/lesson-message.actions";
import {
  lessonMessageService,
  profileService,
} from "@/services";

interface MentorMessageThreadPageProps {
  params: Promise<{ threadId: string }>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function senderLabel(
  role: "student" | "mentor" | "admin",
  studentName: string,
): string {
  if (role === "admin") return "Admin Dokter Ambis";
  if (role === "mentor") return "Mentor Dokter Ambis";
  return studentName;
}

export default async function MentorMessageThreadPage({
  params,
}: MentorMessageThreadPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") redirect("/dashboard");

  const { threadId } = await params;
  const thread = await lessonMessageService.getMentorThreadDetail(
    profile.id,
    threadId,
  );
  if (!thread) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/mentor/messages"
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
      >
        ← Kembali ke Kotak Pesan
      </Link>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black text-slate-950">
            {thread.studentName}
          </h1>
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
              ? "Belum Dijawab"
              : thread.status === "answered"
                ? "Dijawab"
                : "Ditutup Admin"}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-black text-slate-500">Universitas peserta</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {thread.studentUniversity ?? "Belum diisi"}
            </dd>
          </div>
          <div>
            <dt className="font-black text-slate-500">Universitas course</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {thread.courseUniversity}
            </dd>
          </div>
          <div>
            <dt className="font-black text-slate-500">Program</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {thread.programTitle}
            </dd>
          </div>
          <div>
            <dt className="font-black text-slate-500">Course</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {thread.courseTitle}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-black text-slate-500">Lesson</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {thread.lessonTitle}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Percakapan</h2>
        <div className="mt-5 max-h-[36rem] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4 sm:p-5">
          {thread.messages.map((entry) => {
            const fromStaff = entry.sender_role !== "student";
            return (
              <article
                key={entry.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${
                  fromStaff
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-white text-slate-700 ring-1 ring-blue-100"
                }`}
              >
                <p className="text-[11px] font-black uppercase tracking-wide opacity-75">
                  {senderLabel(entry.sender_role, thread.studentName)}
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
        <h2 className="text-lg font-black text-slate-950">Kirim Jawaban</h2>
        {thread.status === "closed" ? (
          <p className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
            Thread ini sudah ditutup Admin. Mentor tidak dapat membuka atau
            menutup thread.
          </p>
        ) : (
          <form
            action={replyLessonMessageAsMentorAction.bind(null, thread.id)}
            className="mt-5"
          >
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-black text-slate-700"
            >
              Jawaban Mentor
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={2000}
              rows={6}
              placeholder="Tuliskan jawaban yang jelas dan sesuai konteks materi..."
              className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-700"
              >
                Kirim Jawaban
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
