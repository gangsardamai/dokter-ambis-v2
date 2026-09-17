"use client";

import { FormEvent, useState } from "react";

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

function MentorReviewForm({
  courseId,
  mentor,
  onSaved,
}: {
  courseId: string;
  mentor: MentorRatingItem;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(mentor.rating ?? 0);
  const [savedRating, setSavedRating] = useState(mentor.rating);
  const [suggestion, setSuggestion] = useState(mentor.suggestion ?? "");
  const [savedSuggestion, setSavedSuggestion] = useState(mentor.suggestion ?? "");
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rating < 1 || rating > 5 || pending) return;

    setPending(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/mentor-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          mentorId: mentor.mentorId,
          rating,
          suggestion,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        rating?: number;
        suggestion?: string | null;
      };

      if (!response.ok) {
        throw new Error(result.message || "Penilaian gagal disimpan.");
      }

      setSavedRating(result.rating ?? rating);
      setSavedSuggestion(result.suggestion ?? "");
      setSuccessMessage(result.message || "Penilaian berhasil disimpan.");
      onSaved();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Penilaian gagal disimpan.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-64">
          <p className="font-extrabold text-slate-950">{mentor.fullName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {savedRating ? `Penilaian tersimpan: ${savedRating}/5` : "Belum dinilai"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1" aria-label={`Rating ${mentor.fullName}`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRating(value);
                setSuccessMessage("");
                setErrorMessage("");
              }}
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
            {savedSuggestion ? " · sudah terisi" : ""}
          </summary>
          <div className="border-t border-slate-200 p-3">
            <textarea
              maxLength={500}
              value={suggestion}
              onChange={(event) => {
                setSuggestion(event.target.value);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              rows={3}
              placeholder="Saran untuk mentor (opsional, maks. 500 karakter)"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </details>

        <button
          type="submit"
          disabled={pending || rating === 0}
          aria-busy={pending}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Mengirim..." : "Kirim Penilaian"}
        </button>
      </div>

      {rating === 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-600">
          Pilih bintang 1–5 sebelum mengirim penilaian.
        </p>
      )}
      {successMessage && (
        <p className="mt-2 text-xs font-bold text-emerald-600">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-xs font-bold text-red-600">{errorMessage}</p>
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
  const [ratedMentorIds, setRatedMentorIds] = useState(
    () => new Set(mentors.filter((mentor) => mentor.rating !== null).map((mentor) => mentor.mentorId)),
  );

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
    <details className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-200 sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Evaluasi
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <p className="mt-3 text-xs font-bold text-blue-700">
            {mentors.length} mentor · {ratedMentorIds.size} sudah dinilai
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 sm:inline-flex group-open:hidden">
            Buka Penilaian
          </span>
          <span className="hidden rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 sm:group-open:inline-flex">
            Tutup Penilaian
          </span>
          <span className="rounded-xl bg-blue-50 p-2 text-blue-700 transition-transform duration-200 group-open:rotate-180">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </summary>

      <div className="border-t border-blue-100 p-5 sm:p-6">
        <div className="space-y-4">
          {mentors.map((mentor) => (
            <MentorReviewForm
              key={mentor.mentorId}
              courseId={courseId}
              mentor={mentor}
              onSaved={() =>
                setRatedMentorIds((current) => {
                  const next = new Set(current);
                  next.add(mentor.mentorId);
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>
    </details>
  );
}
