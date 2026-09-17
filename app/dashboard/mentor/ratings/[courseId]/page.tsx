import Link from "next/link";

import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

interface MentorCourseReview {
  id: string;
  reviewerName: string;
  reviewerType: "student" | "admin";
  rating: number;
  suggestion: string | null;
  updatedAt: string;
}

interface MentorCourseReviewResult {
  courseId: string;
  courseTitle: string;
  averageRating: number;
  ratingCount: number;
  reviews: MentorCourseReview[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="whitespace-nowrap font-black text-amber-500" aria-label={`${rating} dari 5 bintang`}>
      {"★".repeat(rounded)}
      <span className="text-slate-200">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export default async function MentorCourseRatingsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const result = await callDynamicRpc<MentorCourseReviewResult>(
    supabase,
    "mentor_get_course_reviews",
    { target_course_id: courseId },
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/mentor/ratings"
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
      >
        ← Kembali ke Penilaian
      </Link>

      <section className="rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Detail Penilaian</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl">{result.courseTitle}</h1>
            <p className="mt-2 text-sm text-blue-100">Daftar penilaian peserta dan evaluasi admin untuk course ini.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
            <p className="text-2xl font-black">★ {Number(result.averageRating).toFixed(1)}</p>
            <p className="mt-1 text-sm font-bold text-blue-100">{result.ratingCount} penilaian</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {result.reviews.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="font-black text-slate-950">Belum ada penilaian pada course ini.</p>
          </div>
        ) : (
          result.reviews.map((review) => (
            <article key={review.id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-950">{review.reviewerName}</h2>
                    {review.reviewerType === "admin" && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-700">Admin</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(review.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars rating={review.rating} />
                  <span className="text-sm font-black text-slate-700">{review.rating}/5</span>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {review.suggestion || "Tidak ada saran tertulis."}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
