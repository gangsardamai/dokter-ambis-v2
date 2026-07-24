"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { submitQuizAttemptAction } from "@/app/dashboard/student/quiz/[quizId]/actions";

import type {
  QuizAttemptPayload,
  QuizSubmissionResult,
} from "@/types/course-explorer";

interface QuizAttemptCardProps {
  quiz: QuizAttemptPayload;
}

export default function QuizAttemptCard({
  quiz,
}: QuizAttemptCardProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] =
    useState<QuizSubmissionResult | null>(null);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  async function handleSubmit() {
    if (!quiz.can_attempt || submitting) {
      return;
    }

    const confirmed = window.confirm(
      `Kirim jawaban sekarang? ${answeredCount} dari ${quiz.questions.length} soal telah dijawab.`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const submission =
        await submitQuizAttemptAction(
          quiz.id,
          quiz.questions.map((question) => ({
            question_id: question.id,
            selected_option_id:
              answers[question.id] ?? null,
          })),
        );
      setResult(submission);
      setAnswers({});

      if (submission.show_review) {
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Jawaban quiz gagal dikirim.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Quiz Pilihan Ganda
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              {quiz.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
              {quiz.questions.length} soal
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
              {quiz.duration} menit
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
              Sisa {quiz.attempts_remaining} percobaan
            </span>
          </div>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-3xl border p-5 ${
            result.passed
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="text-sm font-black text-slate-950">
            Nilai percobaan {result.attempt_number}:{" "}
            {result.score}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Nilai terbaik {result.best_score}.{" "}
            {result.show_review
              ? "Pembahasan jawaban kini tersedia di bawah."
              : `Anda masih memiliki ${result.attempts_remaining} percobaan.`}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {quiz.can_attempt ? (
        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <article
              key={question.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Soal {index + 1}
              </p>
              <h2 className="mt-3 whitespace-pre-wrap text-base font-black leading-7 text-slate-950 sm:text-lg">
                {question.question}
              </h2>

              {question.image_path && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image
                    src={`/api/quiz-images/${quiz.id}/${question.id}?kind=question`}
                    alt={`Gambar soal ${index + 1}`}
                    width={1200}
                    height={800}
                    unoptimized
                    className="h-auto max-h-[560px] w-full object-contain"
                  />
                </div>
              )}

              <div className="mt-5 space-y-3">
                {question.options.map((option) => {
                  const selected =
                    answers[question.id] === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        selected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={selected}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: option.id,
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />
                      <span className="text-sm font-semibold leading-6 text-slate-700">
                        {option.option_text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </article>
          ))}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Mengirim..." : "Kirim Jawaban"}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
          <p className="font-black text-slate-950">
            Batas percobaan telah tercapai.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Jawaban benar dan pembahasan ditampilkan setelah percobaan terakhir.
          </p>
        </div>
      )}
    </section>
  );
}
