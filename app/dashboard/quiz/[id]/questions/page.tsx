import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import QuizQuestionCreateForm from "@/components/quiz/QuizQuestionCreateForm";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types/database.types";

import {
  createQuestionAction,
  deleteQuestionAction,
} from "./actions";

interface QuizQuestionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

type QuizQuestionRow =
  Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizOptionRow =
  Database["public"]["Tables"]["quiz_options"]["Row"];

interface QuizQuestionWithImages extends QuizQuestionRow {
  explanation_image_path: string | null;
  quiz_options: Array<
    Pick<
      QuizOptionRow,
      | "id"
      | "option_order"
      | "option_text"
      | "is_correct"
    >
  >;
}

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
          "*, quiz_options(id, option_order, option_text, is_correct)",
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
  const questions = (questionsResult.data ?? []) as unknown as
    QuizQuestionWithImages[];
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
          Isi empat pilihan, tandai satu jawaban benar, lalu tambahkan foto soal atau foto pembahasan bila diperlukan.
        </p>

        <QuizQuestionCreateForm
          quizId={quiz.id}
          action={createAction}
        />
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

                  {question.image_path && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <Image
                        src={`/api/quiz-images/${quiz.id}/${question.id}?kind=question`}
                        alt={`Gambar soal ${question.question_order}`}
                        width={1200}
                        height={800}
                        unoptimized
                        className="h-auto max-h-[560px] w-full object-contain"
                      />
                    </div>
                  )}

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

                  {(question.explanation ||
                    question.explanation_image_path) && (
                    <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">
                      <p>
                        <span className="font-black text-blue-800">
                          Pembahasan:{" "}
                        </span>
                        {question.explanation ??
                          "Pembahasan menggunakan gambar."}
                      </p>

                      {question.explanation_image_path && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-white">
                          <Image
                            src={`/api/quiz-images/${quiz.id}/${question.id}?kind=explanation`}
                            alt={`Gambar pembahasan soal ${question.question_order}`}
                            width={1200}
                            height={800}
                            unoptimized
                            className="h-auto max-h-[560px] w-full object-contain"
                          />
                        </div>
                      )}
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
