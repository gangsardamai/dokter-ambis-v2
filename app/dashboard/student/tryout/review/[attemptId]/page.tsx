import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { profileService, tryoutService } from "@/services";

interface TryoutReviewPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function TryoutReviewPage({
  params,
}: TryoutReviewPageProps) {
  const { attemptId } = await params;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/dashboard");

  const review = await tryoutService.getReview(attemptId);

  if (!review.released) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href={`/dashboard/student/tryout/result/${attemptId}`}
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke hasil
        </Link>
        <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">
            Pembahasan Belum Tersedia
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            {review.message ??
              "Pembahasan akan tersedia sesuai jadwal yang ditetapkan Admin."}
          </p>
        </section>
      </main>
    );
  }

  const questions = review.questions ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/dashboard/student/tryout/result/${attemptId}`}
        className="text-sm font-black text-blue-700 hover:underline"
      >
        ← Kembali ke hasil
      </Link>

      <section className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
          Pembahasan Try Out
        </p>
        <h1 className="mt-3 text-3xl font-black">{review.title}</h1>
        <p className="mt-3 text-sm font-semibold text-blue-100">
          Nilai {Math.round(review.score ?? 0)} · {questions.length} soal
        </p>
      </section>

      <section className="space-y-5">
        {questions.map((question) => (
          <article
            key={question.id}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  Soal {question.question_order}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {question.topic}
                </span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  question.is_correct
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {question.is_correct ? "Benar" : "Salah / Kosong"}
              </span>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-base font-bold leading-8 text-slate-950">
              {question.question}
            </p>

            {question.image_path && review.tryout_id && (
              <Image
                src={`/api/tryout-images/${review.tryout_id}/${question.id}?kind=question&attemptId=${attemptId}`}
                alt={`Gambar soal ${question.question_order}`}
                width={1000}
                height={650}
                unoptimized
                className="mt-5 max-h-[32rem] w-auto rounded-2xl border border-blue-100 object-contain"
              />
            )}

            <div className="mt-6 space-y-3">
              {question.options.map((option, index) => {
                const selected = question.selected_option_id === option.id;
                return (
                  <div
                    key={option.id}
                    className={`rounded-2xl border p-4 text-sm font-semibold leading-6 ${
                      option.is_correct
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : selected
                          ? "border-red-300 bg-red-50 text-red-900"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="mr-2 font-black">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option.option_text}
                    {option.is_correct && (
                      <span className="ml-2 text-xs font-black">✓ Jawaban benar</span>
                    )}
                    {selected && !option.is_correct && (
                      <span className="ml-2 text-xs font-black">Pilihan Anda</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Pembahasan
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {question.explanation ?? "Pembahasan belum ditambahkan."}
              </p>
              {question.explanation_image_path && review.tryout_id && (
                <Image
                  src={`/api/tryout-images/${review.tryout_id}/${question.id}?kind=explanation&attemptId=${attemptId}`}
                  alt={`Gambar pembahasan ${question.question_order}`}
                  width={1000}
                  height={650}
                  unoptimized
                  className="mt-4 max-h-[32rem] w-auto rounded-2xl border border-blue-100 object-contain"
                />
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
