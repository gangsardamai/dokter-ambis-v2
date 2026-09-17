"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { saveMentorReviewAction } from "@/app/actions/mentor-rating.actions";

export interface MentorRatingItem {
  mentorId: string;
  profileId: string;
  fullName: string;
  rating: number | null;
  suggestion: string | null;
}

interface MentorRatingSectionProps {
  courseId: string;
  mentors: MentorRatingItem[];
  title?: string;
  description?: string;
}

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Mengirim..." : "Kirim Penilaian"}
    </button>
  );
}

function MentorReviewForm({
  courseId,
  mentor,
}: {
  courseId: string;
  mentor: MentorRatingItem;
}) {
  const [rating, setRating] = useState(mentor.rating ?? 0);

  return (
    <form
      action={saveMentorReviewAction}
      className="rounded-2xl border border-slate-200 p-4"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="mentorId" value={mentor.mentorId} />
      <input type="hidden" name="rating" value={rating || ""} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-64">
          <p className="font-extrabold text-slate-950">{mentor.fullName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {mentor.rating ? `Penilaian tersimpan: ${mentor.rating}/5` : "Belum dinilai"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1" aria-label={`Rating ${mentor.fullName}`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} bintang`}
              aria-pressed={rating === value}
              className={`text-2xl leading-none transition hover:scale-110 ${
                value <= rating ? "text-amber-400" : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs font-black text-slate-500">{rating}/5</span>
          )}
        </div>

        <details className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-black text-blue-700">
            Tulis saran
            {mentor.suggestion ? " · sudah terisi" : ""}
          </summary>
          <div className="border-t border-slate-200 p-3">
            <textarea
              name="suggestion"
              maxLength={500}
              defaultValue={mentor.suggestion ?? ""}
              rows={3}
              placeholder="Saran untuk mentor (opsional, maks. 500 karakter)"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </details>

        <SubmitButton disabled={rating === 0} />
      </div>

      {rating === 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-600">
          Pilih bintang 1–5 sebelum mengirim penilaian.
        </p>
      )}
    </form>
  );
}

export default function MentorRatingSection({
  courseId,
  mentors,
  title = "Penilaian Mentor",
  description = "Berikan bintang 1–5 dan saran opsional untuk mentor pada course ini.",
}: MentorRatingSectionProps) {
  if (mentors.length === 0) {
    return (
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Belum ada mentor aktif yang ditugaskan pada course ini.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Evaluasi
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="space-y-4">
        {mentors.map((mentor) => (
          <MentorReviewForm
            key={mentor.mentorId}
            courseId={courseId}
            mentor={mentor}
          />
        ))}
      </div>
    </section>
  );
}
