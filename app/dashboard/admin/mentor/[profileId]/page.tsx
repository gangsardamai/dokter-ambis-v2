import Link from "next/link";
import { notFound } from "next/navigation";

import { setMentorAssignmentAction } from "@/app/actions/mentor-rating.actions";
import PendingSubmitButton from "@/components/mentor/PendingSubmitButton";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

interface MentorAssignment {
  courseId: string;
  courseTitle: string;
  organizationTitle: string;
  programTitle: string;
  isActive: boolean;
  assignedAt: string;
  removedAt: string | null;
  averageRating: number;
  ratingCount: number;
}

interface MentorReview {
  id: string;
  courseId: string;
  courseTitle: string;
  reviewerName: string;
  reviewerType: "student" | "admin";
  rating: number;
  suggestion: string | null;
  updatedAt: string;
}

interface AdminMentorDetail {
  profileId: string;
  mentorId: string;
  fullName: string;
  email: string;
  status: string;
  averageRating: number;
  ratingCount: number;
  assignments: MentorAssignment[];
  reviews: MentorReview[];
}

interface CourseOption {
  id: string;
  title: string;
  organizationId: string;
  organizationTitle: string;
  organizationShortName: string;
  programId: string;
  programTitle: string;
}

interface MentorDirectory {
  courses: CourseOption[];
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
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

export default async function AdminMentorDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();
  const [detail, directory] = await Promise.all([
    callDynamicRpc<AdminMentorDetail | null>(
      supabase,
      "admin_get_mentor_detail",
      { target_profile_id: profileId },
    ),
    callDynamicRpc<MentorDirectory>(supabase, "admin_get_mentor_directory"),
  ]);

  if (!detail) notFound();

  const activeAssignments = detail.assignments.filter((assignment) => assignment.isActive);
  const historyAssignments = detail.assignments.filter((assignment) => !assignment.isActive);
  const activeCourseIds = new Set(activeAssignments.map((assignment) => assignment.courseId));
  const availableCourses = directory.courses.filter((course) => !activeCourseIds.has(course.id));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/admin/mentor"
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
      >
        ← Kembali ke Mentor
      </Link>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Detail Mentor</p>
            <h1 className="mt-3 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {detail.fullName}
            </h1>
            <p className="mt-2 break-all text-sm font-semibold text-blue-100">
              {detail.email || "Email tidak tersedia"}
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-blue-200">
              Status akun: {detail.status}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">Rating keseluruhan</p>
              <p className="mt-1 text-3xl font-black">★ {Number(detail.averageRating).toFixed(1)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-100">Total penilaian</p>
              <p className="mt-1 text-3xl font-black">{detail.ratingCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Course Aktif</h2>
            <p className="mt-1 text-sm text-slate-500">Course yang saat ini dapat dikelola mentor.</p>
          </div>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-xl bg-[#1769cf] px-4 py-2.5 text-sm font-black text-white">
              Tambahkan Tugas
            </summary>
            <form action={setMentorAssignmentAction} className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 lg:w-[28rem]">
              <input type="hidden" name="mentorProfileId" value={detail.profileId} />
              <input type="hidden" name="active" value="true" />
              <select
                name="courseId"
                required
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Pilih course...</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.organizationShortName} · {course.programTitle} · {course.title}
                  </option>
                ))}
              </select>
              <PendingSubmitButton className="mt-3 min-h-10 w-full rounded-xl bg-[#033b63] px-4 text-sm font-black text-white" label="Simpan Penugasan" pendingLabel="Menyimpan..." />
            </form>
          </details>
        </div>

        <div className="mt-5 space-y-3">
          {activeAssignments.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Belum ada course aktif.</p>
          ) : (
            activeAssignments.map((assignment) => (
              <div key={assignment.courseId} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-950">{assignment.courseTitle}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {assignment.organizationTitle} · {assignment.programTitle}
                  </p>
                  <p className="mt-2 text-sm font-bold text-amber-600">
                    ★ {Number(assignment.averageRating).toFixed(1)} · {assignment.ratingCount} penilaian
                  </p>
                </div>
                <form action={setMentorAssignmentAction}>
                  <input type="hidden" name="mentorProfileId" value={detail.profileId} />
                  <input type="hidden" name="courseId" value={assignment.courseId} />
                  <input type="hidden" name="active" value="false" />
                  <PendingSubmitButton className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 hover:bg-red-100" label="Hapus dari Course" pendingLabel="Menghapus..." />
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Riwayat Penugasan</h2>
        <p className="mt-1 text-sm text-slate-500">Course yang sudah dilepas tetap disimpan bersama data penilaiannya.</p>
        <div className="mt-5 space-y-3">
          {historyAssignments.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Belum ada riwayat penugasan.</p>
          ) : (
            historyAssignments.map((assignment) => (
              <div key={assignment.courseId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{assignment.courseTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{assignment.organizationTitle} · {assignment.programTitle}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Riwayat</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-slate-500">
                  <span>Dilepas: {formatDate(assignment.removedAt)}</span>
                  <span className="text-amber-600">★ {Number(assignment.averageRating).toFixed(1)} · {assignment.ratingCount} penilaian</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-xl font-black text-slate-950">Penilaian & Saran</h2>
          <p className="mt-1 text-sm text-slate-500">Nama peserta ditampilkan. Penilaian dari admin ditampilkan sebagai “Admin”.</p>
        </div>
        <div className="mt-5 space-y-3">
          {detail.reviews.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Belum ada penilaian.</p>
          ) : (
            detail.reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{review.reviewerName}</p>
                    <p className="mt-1 text-sm font-semibold text-blue-700">{review.courseTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Stars rating={review.rating} />
                    <span className="text-sm font-black text-slate-700">{review.rating}/5</span>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {review.suggestion || "Tidak ada saran tertulis."}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-400">Diperbarui {formatDate(review.updatedAt)}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
