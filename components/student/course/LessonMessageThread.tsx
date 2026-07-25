"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
} from "react";

import {
  sendLessonMessageAction,
  type LessonMessageActionResult,
} from "@/app/actions/lesson-message.actions";
import type { StudentLessonMessageThread } from "@/types/lesson-messages";

interface LessonMessageThreadProps {
  courseId: string;
  lessonId: string;
  thread?: StudentLessonMessageThread;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LessonMessageThread({
  courseId,
  lessonId,
  thread,
}: LessonMessageThreadProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [result, setResult] =
    useState<LessonMessageActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submitMessage() {
    const normalized = message.trim();
    if (!normalized || pending) return;

    setResult(null);
    startTransition(async () => {
      const nextResult = await sendLessonMessageAction(
        courseId,
        lessonId,
        normalized,
      );

      setResult(nextResult);
      if (nextResult.success) {
        setMessage("");
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">
            Pesan atau Pertanyaan
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Kirim saran atau pertanyaan yang berkaitan dengan lesson ini kepada Admin Dokter Ambis.
          </p>
        </div>

        {thread && (
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
                : "Ditutup"}
          </span>
        )}
      </div>

      {thread && thread.messages.length > 0 && (
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 sm:p-4">
          {thread.messages.map((entry) => {
            const fromAdmin = entry.sender_role === "admin";

            return (
              <article
                key={entry.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  fromAdmin
                    ? "mr-auto bg-white text-slate-700 ring-1 ring-blue-100"
                    : "ml-auto bg-blue-600 text-white"
                }`}
              >
                <p className="text-[11px] font-black uppercase tracking-wide opacity-75">
                  {fromAdmin ? "Admin Dokter Ambis" : "Anda"}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words leading-6">
                  {entry.message}
                </p>
                <p className="mt-2 text-[10px] font-semibold opacity-65">
                  {formatDate(entry.created_at)}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor={`lesson-message-${lessonId}`}
          className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600"
        >
          Tulis pesan
        </label>
        <textarea
          id={`lesson-message-${lessonId}`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Tuliskan pertanyaan atau saran terkait materi ini..."
          className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-400">
            {message.length}/2.000 karakter
          </p>
          <button
            type="button"
            disabled={pending || message.trim().length === 0}
            onClick={submitMessage}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Mengirim..." : "Kirim Pesan"}
          </button>
        </div>

        {result && (
          <p
            className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold ${
              result.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
}
