import type { QuizReviewPayload } from "@/types/course-explorer";

interface QuizReviewCardProps {
  review: QuizReviewPayload;
}

export default function QuizReviewCard({
  review,
}: QuizReviewCardProps) {
  return (
    <section className="mt-8 space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
          Percobaan Terakhir Selesai
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Kunci Jawaban dan Pembahasan
        </h2>
      </div>

      {review.questions.map((question, index) => (
        <article
          key={question.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Soal {index + 1}
          </p>
          <h3 className="mt-3 whitespace-pre-wrap font-black leading-7 text-slate-950">
            {question.question}
          </h3>

          <div className="mt-4 space-y-2">
            {question.options.map((option) => {
              const selected =
                option.id === question.selected_option_id;

              return (
                <div
                  key={option.id}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    option.is_correct
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : selected
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600"
                  }`}
                >
                  {option.option_text}
                  {option.is_correct && " · Jawaban benar"}
                  {selected && !option.is_correct && " · Jawaban Anda"}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              Pembahasan
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {question.explanation ??
                "Pembahasan belum ditambahkan."}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
