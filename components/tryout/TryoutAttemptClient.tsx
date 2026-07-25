"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  saveTryoutAnswerAction,
  submitTryoutAction,
} from "@/app/actions/tryout.actions";

import type {
  TryoutAttemptPayload,
  TryoutAttemptQuestion,
} from "@/types/tryout";

interface TryoutAttemptClientProps {
  payload: TryoutAttemptPayload;
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export default function TryoutAttemptClient({
  payload,
}: TryoutAttemptClientProps) {
  const router = useRouter();
  const attemptId = payload.attempt_id;
  const [questions, setQuestions] = useState<TryoutAttemptQuestion[]>(
    payload.questions ?? [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    payload.remaining_seconds ?? 0,
  );
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitStarted = useRef(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(
    (question) => question.selected_option_id,
  ).length;
  const markedCount = questions.filter(
    (question) => question.is_marked_for_review,
  ).length;

  const submitAttempt = useCallback(
    async (automatic = false) => {
      if (submitting) return;
      if (
        !automatic &&
        !window.confirm(
          `Kirim Try Out sekarang? ${questions.length - answeredCount} soal belum dijawab.`,
        )
      ) {
        return;
      }

      setSubmitting(true);
      setError("");
      const response = await submitTryoutAction(attemptId);

      if (!response.success) {
        setError(response.error ?? "Try Out gagal dikirim.");
        setSubmitting(false);
        return;
      }

      router.replace(`/dashboard/student/tryout/result/${attemptId}`);
      router.refresh();
    }, [answeredCount, attemptId, questions.length, router, submitting],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remainingSeconds > 0 || autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    void submitAttempt(true);
  }, [remainingSeconds, submitAttempt]);

  async function persistQuestion(
    questionId: string,
    optionId: string | null,
    markedForReview: boolean,
  ) {
    setSavingQuestionId(questionId);
    setError("");

    const response = await saveTryoutAnswerAction({
      attemptId,
      questionId,
      optionId,
      markedForReview,
    });

    if (!response.success) {
      setError(response.error ?? "Jawaban gagal disimpan.");
    }

    setSavingQuestionId(null);
  }

  function selectOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, selected_option_id: optionId }
          : question,
      ),
    );

    const question = questions.find((item) => item.id === questionId);
    void persistQuestion(
      questionId,
      optionId,
      question?.is_marked_for_review ?? false,
    );
  }

  function toggleMarked(questionId: string) {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    const nextMarked = !question.is_marked_for_review;
    setQuestions((current) =>
      current.map((item) =>
        item.id === questionId
          ? { ...item, is_marked_for_review: nextMarked }
          : item,
      ),
    );

    void persistQuestion(
      questionId,
      question.selected_option_id,
      nextMarked,
    );
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center font-bold text-red-700">
        Soal Try Out tidak tersedia.
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="min-w-0 space-y-5">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              {payload.title}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Soal {currentIndex + 1} dari {questions.length}
            </p>
          </div>
          <div
            className={`rounded-xl px-4 py-2 text-lg font-black tabular-nums ${
              remainingSeconds <= 300
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {formatTime(remainingSeconds)}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                Soal {currentIndex + 1}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {currentQuestion.topic}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleMarked(currentQuestion.id)}
              disabled={savingQuestionId === currentQuestion.id || submitting}
              className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-black transition ${
                currentQuestion.is_marked_for_review
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              {currentQuestion.is_marked_for_review
                ? "★ Ditandai Ragu-ragu"
                : "☆ Tandai Ragu-ragu"}
            </button>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-base font-bold leading-8 text-slate-950 sm:text-lg">
            {currentQuestion.question}
          </p>

          <div className="mt-7 space-y-3">
            {currentQuestion.options.map((option, index) => {
              const selected =
                currentQuestion.selected_option_id === option.id;

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={selected}
                    disabled={submitting}
                    onChange={() =>
                      selectOption(currentQuestion.id, option.id)
                    }
                    className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-blue-600"
                  />
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">
                    {option.option_text}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 min-h-5 text-xs font-bold text-slate-500">
            {savingQuestionId === currentQuestion.id
              ? "Menyimpan jawaban..."
              : currentQuestion.selected_option_id
                ? "Jawaban tersimpan otomatis."
                : "Belum dijawab."}
          </div>
        </article>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Sebelumnya
          </button>
          <button
            type="button"
            disabled={currentIndex === questions.length - 1 || submitting}
            onClick={() =>
              setCurrentIndex((index) =>
                Math.min(questions.length - 1, index + 1),
              )
            }
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya →
          </button>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-950">Navigasi Soal</h2>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const answered = Boolean(question.selected_option_id);
              const marked = question.is_marked_for_review;
              const active = index === currentIndex;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`grid h-10 w-full place-items-center rounded-xl text-sm font-black transition ${
                    active
                      ? "bg-blue-700 text-white ring-2 ring-blue-200"
                      : marked
                        ? "bg-amber-100 text-amber-800"
                        : answered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-xs font-bold text-slate-500">
            <p>Hijau: sudah dijawab</p>
            <p>Kuning: ditandai ragu-ragu</p>
            <p>Biru: soal yang sedang dibuka</p>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-2xl font-black text-emerald-700">
                {answeredCount}
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-600">Dijawab</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-2xl font-black text-amber-700">
                {markedCount}
              </p>
              <p className="mt-1 text-xs font-bold text-amber-600">Ragu-ragu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void submitAttempt(false)}
            disabled={submitting}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Mengirim Try Out..." : "Selesai dan Kirim"}
          </button>
        </section>
      </aside>
    </div>
  );
}
