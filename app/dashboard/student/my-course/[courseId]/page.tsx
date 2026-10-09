import Link from "next/link";
import { redirect } from "next/navigation";

import CourseContentAccordion from "@/components/course-explorer/CourseContentAccordion";
import MentorRatingSection, {
  type MentorRatingItem,
} from "@/components/mentor/MentorRatingSection";
import StudentLearningMonitor from "@/components/student/course/StudentLearningMonitor";
import type { SupabaseClient } from "@supabase/supabase-js";
import StudentTryoutList from "@/components/tryout/StudentTryoutList";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";
import { joinWhatsAppGroupAction } from "./actions";
import {
  courseCommunityLinkService,
  courseExplorerService,
  enrollmentService,
  lessonMessageService,
  profileService,
  studentCourseProgressService,
  tryoutService,
} from "@/services";

interface StudentMyCoursePageProps {
  params: Promise<{ courseId: string }>;
}

interface MentorRatingContext {
  enabled: boolean;
  mentors: MentorRatingItem[];
}

function getPaymentStatusLabel(status: string | null): string {
  if (!status) return "Belum Ada Pembayaran";
  const labels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    approved: "Sudah Dibayar",
    rejected: "Pembayaran Ditolak",
  };
  return labels[status] ?? status;
}

function getPaymentStatusClass(status: string | null): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-red-100 text-red-700";
}

export default async function StudentMyCoursePage({
  params,
}: StudentMyCoursePageProps) {
  const { courseId } = await params;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const enrollment = await enrollmentService.getActiveCourseEnrollment(
    profile.id,
    courseId,
  );

  if (!enrollment || !enrollment.courses) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Anda belum memiliki akses aktif ke blok tersebut.",
      )}`,
    );
  }

  const supabase = await createClient();
  const [
    content,
    progressSummary,
    lessonMessages,
    tryouts,
    whatsappGroupUrl,
    mentorRatingContext,
  ] = await Promise.all([
    courseExplorerService.getCourseContent(courseId),
    studentCourseProgressService.getCourseProgress(profile.id, courseId),
    lessonMessageService.getStudentCourseThreads(profile.id, courseId),
    tryoutService.getStudentTryouts(profile.id, courseId),
    courseCommunityLinkService.getWhatsAppGroupUrl(courseId),
    callDynamicRpc<MentorRatingContext>(
      supabase,
      "get_course_mentor_rating_context",
      { target_course_id: courseId },
    ),
  ]);

  const [monitorFoldersResult, monitorLessonsResult, monitorPreferenceResult] = await Promise.all([
    supabase.from("lesson_folders").select("id,title,parent_folder_id,folder_order").eq("course_id", courseId).eq("publication_status","published").order("folder_order"),
    supabase.from("lessons").select("id,folder_id").eq("course_id", courseId).eq("publication_status","published"),
    (supabase as unknown as SupabaseClient).from("student_learning_targets").select("folder_ids").eq("course_id",courseId).eq("profile_id",profile.id).maybeSingle(),
  ]);
  if (monitorFoldersResult.error || monitorLessonsResult.error || monitorPreferenceResult.error) {
    throw new Error("Gagal memuat target Monitoring Belajar.");
  }
  const monitorFolders = monitorFoldersResult.data ?? [];
  const monitorLessons = monitorLessonsResult.data ?? [];
  const savedFolderIds = (monitorPreferenceResult.data as {folder_ids?: string[]} | null)?.folder_ids ?? null;

  const course = enrollment.courses;
  const payment = enrollment.payments;
  const canPayNow =
    enrollment.payment_timing === "deferred" &&
    payment?.status !== "pending" &&
    payment?.status !== "approved";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/student"
        prefetch={false}
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        ← Kembali ke dashboard
      </Link>

      <section className="rounded-3xl border border-blue-100 bg-white px-5 py-4 shadow-sm shadow-blue-950/5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:flex-wrap lg:justify-start lg:gap-x-4 lg:gap-y-2">
            <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.06em] text-blue-600 sm:text-xs sm:tracking-[0.18em]">
              Kategori Pembayaran
            </p>
            <p className="shrink-0 whitespace-nowrap text-xs font-black text-slate-950 sm:text-base">
              {enrollment.payment_timing === "deferred"
                ? "Bayar di Akhir"
                : "Bayar di Awal"}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="hidden h-10 w-px shrink-0 bg-slate-200 lg:block"
          />

          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:flex-wrap lg:justify-start lg:gap-x-4 lg:gap-y-2">
            <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.06em] text-blue-600 sm:text-xs sm:tracking-[0.18em]">
              Status Pembayaran
            </p>
            <span
              className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-black sm:px-3 sm:text-sm ${getPaymentStatusClass(
                payment?.status ?? null,
              )}`}
            >
              {getPaymentStatusLabel(payment?.status ?? null)}
            </span>

            {payment?.status === "pending" && (
              <Link
                href={`/dashboard/student/payment/${enrollment.id}`}
                prefetch={false}
                className="text-sm font-black text-blue-700 hover:underline"
              >
                Lihat status pembayaran
              </Link>
            )}
          </div>

          {canPayNow && (
            <Link
              href={`/dashboard/student/payment/${enrollment.id}`}
              prefetch={false}
              className="inline-flex min-h-9 w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:ml-auto lg:w-auto"
            >
              Bayar Sekarang
            </Link>
          )}
        </div>

        {payment?.status === "rejected" && payment.notes && (
          <p className="mt-4 border-t border-red-100 pt-4 text-sm leading-6 text-red-600">
            {payment.notes}
          </p>
        )}
      </section>

      <section className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] p-4 text-white shadow-xl shadow-blue-950/10 sm:p-5">
        <div className="grid min-w-0 gap-3 lg:grid-cols-3 lg:items-stretch">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-50 ring-1 ring-white/20">
              Blok Aktif
            </span>

            <h1 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">
              {course.title}
            </h1>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-100">
              <span>
                {course.organizations?.title ?? "Universitas belum tersedia"}
              </span>

            </div>
          </div>

          <StudentLearningMonitor
            compact
            courseId={courseId}
            folders={monitorFolders}
            lessons={monitorLessons}
            completedLessonIds={progressSummary.completedLessonIds}
            initialFolderIds={savedFolderIds}
          />

          {whatsappGroupUrl && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner shadow-black/5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">
                    Grup WhatsApp Course
                  </p>
                  <p className="mt-1 text-sm leading-5 text-blue-100">
                    {enrollment.whatsapp_joined_at
                      ? "Anda sudah tercatat bergabung di grup WhatsApp."
                      : "Klik tombol di bawah untuk bergabung."}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${
                    enrollment.whatsapp_joined_at
                      ? "bg-emerald-400/15 text-emerald-100 ring-emerald-300/30"
                      : "bg-amber-300/15 text-amber-100 ring-amber-200/30"
                  }`}
                >
                  {enrollment.whatsapp_joined_at ? "✓ Sudah Gabung" : "Belum Gabung"}
                </span>
              </div>

              <div className="mt-2">
                <form
                  action={joinWhatsAppGroupAction.bind(
                    null,
                    enrollment.id,
                    courseId,
                  )}
                  className="w-full sm:w-auto"
                >
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:bg-[#20bd5a] sm:w-auto"
                    aria-label={`Gabung Grup WhatsApp ${course.title}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0"
                      fill="none"
                    >
                      <path
                        d="M20 11.6a8 8 0 0 1-11.9 7l-4.1 1.1 1.1-4A8 8 0 1 1 20 11.6Z"
                        fill="currentColor"
                        fillOpacity="0.18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.7 7.7c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.1.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .3-.1 1.3-.7 1.8-.5.5-1.2.8-2 .8-.6 0-1.4-.2-2.4-.6-1.4-.6-2.5-1.5-3.4-2.5-.8-.9-1.5-1.9-1.9-2.9-.4-.9-.5-1.6-.5-2.2 0-.8.3-1.4.6-1.8Z"
                        fill="currentColor"
                      />
                    </svg>
                    {enrollment.whatsapp_joined_at
                      ? "Buka Grup WhatsApp"
                      : "Gabung Group WhatsApp"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Course Explorer
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Materi Pembelajaran
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buka folder, pilih lesson, lalu akses file, video, quiz, atau kirim pertanyaan sesuai urutan pembelajaran.
          </p>
        </div>

        <CourseContentAccordion
          courseId={courseId}
          content={content}
          mode="student"
          completedLessonIds={progressSummary.completedLessonIds}
          lessonMessages={lessonMessages}
        />
      </section>

      <section>
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Simulasi Ujian
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            Try Out Course
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Kerjakan simulasi ujian dengan timer server, autosave jawaban, dan hasil sesuai kebijakan publikasi Admin.
          </p>
        </div>

        <StudentTryoutList tryouts={tryouts} />
      </section>

      {mentorRatingContext.enabled && (
        <MentorRatingSection
          courseId={courseId}
          mentors={mentorRatingContext.mentors}
          title="Nilai Mentor Course"
          description="Pilih bintang 1–5 untuk setiap mentor. Saran bersifat opsional dan penilaian dapat diperbarui selama akses course masih aktif."
        />
      )}
    </main>
  );
}
