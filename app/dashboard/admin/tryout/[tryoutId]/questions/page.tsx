import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { tryoutService } from "@/services";

import {
  createTryoutQuestionAction,
  deleteTryoutQuestionAction,
} from "../../actions";

interface TryoutQuestionsPageProps {
  params: Promise<{ tryoutId: string }>;
  searchParams: Promise<{
    error?: string | string[];
    created?: string | string[];
    added?: string | string[];
    saved?: string | string[];
    deleted?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-black text-slate-700";
const optionFields = [
  ["optionA", "A"],
  ["optionB", "B"],
  ["optionC", "C"],
  ["optionD", "D"],
  ["optionE", "E"],
] as const;

export default async function TryoutQuestionsPage({
  params,
  searchParams,
}: TryoutQuestionsPageProps) {
  const { tryoutId } = await params;
  const query = await searchParams;
  const payload = await tryoutService.getEditorPayload(tryoutId);

  if (!payload) notFound();

  const createAction = createTryoutQuestionAction.bind(null, tryoutId);
  const successMessage =
    getParam(query.created) === "true"
      ? "Try Out berhasil dibuat. Silakan tambahkan soal."
      : getParam(query.added) === "true"
        ? "Soal berhasil ditambahkan."
        : getParam(query.saved) === "true"
          ? "Perubahan soal berhasil disimpan."
          : getParam(query.deleted) === "true"
            ? "Soal berhasil dihapus."
            : "";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/admin/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/edit`}
            className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
          >
            Pengaturan
          </Link>
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/results`}
            className="inline-flex min-h-10 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
          >
            Hasil
          </Link>
        </div>
      </div>

      <PageHeader
        title="Kelola Soal Try Out"
        description={`${payload.tryout.title} · ${payload.questions.length} soal`}
      />

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {successMessage}
        </div>
      )}
      {getParam(query.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(query.error)}
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Soal Baru
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Tambahkan Pertanyaan
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Isi pilihan A–E dan tentukan tepat satu jawaban benar. Konten soal terkunci setelah attempt pertama dimulai.
          </p>
        </div>

        <form action={createAction} className="space-y-5">
          <div>
            <label htmlFor="question" className={labelClass}>
              Pertanyaan
            </label>
            <textarea
              id="question"
              name="question"
              rows={5}
              required
              className={`${inputClass} py-3`}
              placeholder="Tuliskan vignette dan pertanyaan klinis..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="topic" className={labelClass}>Topik</label>
              <input id="topic" name="topic" required defaultValue="Umum" className={inputClass} />
            </div>
            <div>
              <label htmlFor="difficulty" className={labelClass}>Kesulitan</label>
              <select id="difficulty" name="difficulty" defaultValue="medium" className={inputClass}>
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
            <div>
              <label htmlFor="points" className={labelClass}>Bobot</label>
              <input id="points" name="points" type="number" min={1} defaultValue={1} required className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {optionFields.map(([name, label]) => (
              <div key={name}>
                <label htmlFor={name} className={labelClass}>Pilihan {label}</label>
                <input id={name} name={name} required className={inputClass} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="correctOptionIndex" className={labelClass}>Jawaban Benar</label>
              <select id="correctOptionIndex" name="correctOptionIndex" defaultValue="1" className={inputClass}>
                {[1, 2, 3, 4, 5].map((index) => (
                  <option key={index} value={index}>{String.fromCharCode(64 + index)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="explanation" className={labelClass}>Pembahasan</label>
              <textarea id="explanation" name="explanation" rows={3} className={`${inputClass} py-3`} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-blue-600 to-[#033b63] px-6 py-2.5 text-sm font-black text-white">
              Tambahkan Soal
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Daftar Soal</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">{payload.questions.length} Soal Tersimpan</h2>
        </div>

        {payload.questions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center">
            <p className="font-black text-slate-800">Belum ada soal.</p>
          </div>
        ) : (
          payload.questions.map((question) => {
            const deleteAction = deleteTryoutQuestionAction.bind(null, tryoutId, question.id);

            return (
              <article key={question.id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">Soal {question.question_order}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{question.topic}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{question.difficulty}</span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-900">{question.question}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/dashboard/admin/tryout/${tryoutId}/questions/${question.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
                    >
                      Edit
                    </Link>
                    <form action={deleteAction}>
                      <button type="submit" className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100">
                        Hapus
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                        option.is_correct
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="mr-2 font-black">{String.fromCharCode(65 + index)}.</span>
                      {option.option_text}
                      {option.is_correct && <span className="ml-2 text-xs font-black">✓ Benar</span>}
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-5 rounded-2xl bg-blue-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">Pembahasan</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{question.explanation}</p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
