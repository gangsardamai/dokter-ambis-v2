import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { tryoutService } from "@/services";

import { updateTryoutQuestionAction } from "../../../../actions";

interface EditTryoutQuestionPageProps {
  params: Promise<{ tryoutId: string; questionId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default async function EditTryoutQuestionPage({
  params,
  searchParams,
}: EditTryoutQuestionPageProps) {
  const { tryoutId, questionId } = await params;
  const query = await searchParams;
  const payload = await tryoutService.getEditorPayload(tryoutId);
  const question = payload?.questions.find((item) => item.id === questionId);

  if (!payload || !question) notFound();

  const action = updateTryoutQuestionAction.bind(
    null,
    tryoutId,
    questionId,
  );
  const correctIndex =
    question.options.findIndex((option) => option.is_correct) + 1;
  const optionValues = Array.from({ length: 5 }, (_, index) =>
    question.options[index]?.option_text ?? "",
  );

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/dashboard/admin/tryout/${tryoutId}/questions`}
        className="text-sm font-black text-blue-700 hover:underline"
      >
        ← Kembali ke daftar soal
      </Link>

      <PageHeader
        title={`Edit Soal ${question.question_order}`}
        description={payload.tryout.title}
      />

      {getParam(query.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(query.error)}
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <form action={action} className="space-y-5">
          <div>
            <label htmlFor="question" className="mb-1.5 block text-sm font-black text-slate-700">
              Pertanyaan
            </label>
            <textarea
              id="question"
              name="question"
              rows={6}
              required
              defaultValue={question.question}
              className={`${inputClass} py-3`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="topic" className="mb-1.5 block text-sm font-black text-slate-700">
                Topik
              </label>
              <input
                id="topic"
                name="topic"
                required
                defaultValue={question.topic}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="difficulty" className="mb-1.5 block text-sm font-black text-slate-700">
                Kesulitan
              </label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue={question.difficulty}
                className={inputClass}
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
            <div>
              <label htmlFor="points" className="mb-1.5 block text-sm font-black text-slate-700">
                Bobot
              </label>
              <input
                id="points"
                name="points"
                type="number"
                min={1}
                required
                defaultValue={question.points}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {optionValues.map((value, index) => {
              const letter = String.fromCharCode(65 + index);
              return (
                <div key={letter}>
                  <label
                    htmlFor={`option${letter}`}
                    className="mb-1.5 block text-sm font-black text-slate-700"
                  >
                    Pilihan {letter}
                  </label>
                  <input
                    id={`option${letter}`}
                    name={`option${letter}`}
                    required
                    defaultValue={value}
                    className={inputClass}
                  />
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="correctOptionIndex" className="mb-1.5 block text-sm font-black text-slate-700">
              Jawaban Benar
            </label>
            <select
              id="correctOptionIndex"
              name="correctOptionIndex"
              defaultValue={String(Math.max(correctIndex, 1))}
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <option key={index} value={index}>
                  {String.fromCharCode(64 + index)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="explanation" className="mb-1.5 block text-sm font-black text-slate-700">
              Pembahasan
            </label>
            <textarea
              id="explanation"
              name="explanation"
              rows={5}
              defaultValue={question.explanation ?? ""}
              className={`${inputClass} py-3`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-700"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
