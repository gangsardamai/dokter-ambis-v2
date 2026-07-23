import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createQuestionAction,
  deleteQuestionAction,
} from "./actions";

import { createClient } from "@/lib/supabase/server";

interface QuizQuestionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default async function QuizQuestionsPage({
  params,
}: QuizQuestionsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [quizResult, questionsResult] =
    await Promise.all([
      supabase
        .from("quizzes")
        .select("id, title, publication_status")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("quiz_questions")
        .select(
          "id, question_order, question, explanation, points, quiz_options(id, option_order, option_text, is_correct)",
        )
        .eq("quiz_id", id)
        .order("question_order"),
    ]);

  if (
    quizResult.error ||
    !quizResult.data ||
    questionsResult.error
  ) {
    notFound();
  }

  const quiz = quizResult.data;
  const questions = questionsResult.data ?? [];
  const createAction =
    createQuestionAction.bind(null, quiz.id);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href={`/dashboard/quiz/${quiz.id}`}
          className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        >
          ← Kembali ke Quiz
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Bank Soal
            </p>
            <h1 className="mt-2 break-words text-3xl font-black text-slate-950">
              {quiz.title}
            </h1>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-700">
            {quiz.publication_status}
          </span>
        </div>
      </div>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-slate-950">
          Tambah Soal Pilihan Ganda
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Isi empat pilihan dan tandai tepat satu jawaban benar.
        </p>

        <form action={createAction} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Pertanyaan
            </span>
            <textarea
              name="question"
              required
              rows={4}
              className={`${inputClass} mt-2 resize-y`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Pilihan {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    name={`option_${index}`}
                    required
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold text-emerald-700">
                  <input
                    type="radio"
                    name="correct_option"
                    value={index}
                    required
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Jadikan kunci jawaban
                </label>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Pembahasan
              </span>
              <textarea
                name="explanation"
                rows={3}
                className={`${inputClass} mt-2 resize-y`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Skor
              </span>
              <input
                type="number"
                name="points"
                min={1}
                defaultValue={1}
                required
                className={`${inputClass} mt-2`}
              />
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
          >
            Simpan Soal
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Daftar Soal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {questions.length} soal tersimpan.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
            Belum ada soal.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              const sortedOptions = [
                ...(question.quiz_options ?? []),
              ].sort(
                (a, b) =>
                  a.option_order - b.option_order,
              );

              return (
                <article
                  key={question.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">
                        Soal {question.question_order} ·{" "}
                        {question.points} skor
                      </p>
                      <h3 className="mt-3 whitespace-pre-wrap break-words font-black leading-7 text-slate-950">
                        {question.question}
                      </h3>
                    </div>

                    <form
                      action={deleteQuestionAction.bind(
                        null,
                        quiz.id,
                        question.id,
                      )}
                    >
                      <button
                        type="submit"
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 sm:w-auto"
                      >
                        Hapus
                      </button>
                    </form>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {sortedOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                          option.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {option.option_text}
                        {option.is_correct &&
                          " · Kunci jawaban"}
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                      <span className="font-black text-blue-800">
                        Pembahasan:{" "}
                      </span>
                      {question.explanation}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
