import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import TryoutQuestionForm from "@/components/tryout/TryoutQuestionForm";
import { profileService, tryoutService } from "@/services";

import {
  createMentorTryoutQuestionAction,
  deleteMentorTryoutQuestionAction,
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

export default async function MentorTryoutQuestionsPage({
  params,
  searchParams,
}: TryoutQuestionsPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") redirect("/dashboard");

  const { tryoutId } = await params;
  const query = await searchParams;
  const payload = await tryoutService.getMentorEditorPayload(
    profile.id,
    tryoutId,
  );

  if (!payload) notFound();

  const createAction = createMentorTryoutQuestionAction.bind(null, tryoutId);
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
          href="/dashboard/mentor/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/mentor/tryout/${tryoutId}/edit`}
            className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
          >
            Pengaturan
          </Link>
          <Link
            href={`/dashboard/mentor/tryout/${tryoutId}/results`}
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Soal Baru</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Tambahkan Pertanyaan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pilih format A-D atau A-E, tentukan satu jawaban benar, dan tambahkan gambar soal atau pembahasan bila diperlukan.
          </p>
        </div>
        <TryoutQuestionForm tryoutId={tryoutId} action={createAction} />
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
            const deleteAction = deleteMentorTryoutQuestionAction.bind(null, tryoutId, question.id);

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
                    {question.image_path && (
                      <Image
                        src={`/api/tryout-images/${tryoutId}/${question.id}?kind=question`}
                        alt={`Gambar soal ${question.question_order}`}
                        width={900}
                        height={520}
                        unoptimized
                        className="mt-4 max-h-72 w-auto rounded-2xl border border-blue-100 object-contain"
                      />
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/dashboard/mentor/tryout/${tryoutId}/questions/${question.id}/edit`}
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

                {(question.explanation || question.explanation_image_path) && (
                  <div className="mt-5 rounded-2xl bg-blue-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">Pembahasan</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{question.explanation}</p>
                    {question.explanation_image_path && (
                      <Image
                        src={`/api/tryout-images/${tryoutId}/${question.id}?kind=explanation`}
                        alt={`Gambar pembahasan ${question.question_order}`}
                        width={900}
                        height={520}
                        unoptimized
                        className="mt-4 max-h-72 w-auto rounded-2xl border border-blue-100 object-contain"
                      />
                    )}
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
