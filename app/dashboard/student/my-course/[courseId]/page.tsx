import Link from "next/link";
import { redirect } from "next/navigation";

import CourseContentAccordion from "@/components/course-explorer/CourseContentAccordion";
import StudentCourseInsights, {
  CourseProgressSummaryCards,
} from "@/components/student/course/StudentCourseStatistics";
import StudentTryoutList from "@/components/tryout/StudentTryoutList";
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
  return "bg-slate-100 text-slate-700";
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

  const [
    content,
    progressSummary,
    lessonMessages,
    tryouts,
    whatsappGroupUrl,
  ] = await Promise.all([
    courseExplorerService.getCourseContent(courseId),
    studentCourseProgressService.getCourseProgress(profile.id, courseId),
    lessonMessageService.getStudentCourseThreads(profile.id, courseId),
    tryoutService.getStudentTryouts(profile.id, courseId),
    courseCommunityLinkService.getWhatsAppGroupUrl(courseId),
  ]);

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
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        ← Kembali ke dashboard
      </Link>

      <section className="rounded-3xl border border-blue-100 bg-white px-5 py-4 shadow-sm shadow-blue-950/5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Kategori Pembayaran
            </p>
            <p className="text-sm font-black text-slate-950 sm:text-base">
              {enrollment.payment_timing === "deferred"
                ? "Bayar di Akhir"
                : "Bayar di Awal"}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="hidden h-10 w-px shrink-0 bg-slate-200 lg:block"
          />

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Status Pembayaran
            </p>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${getPaymentStatusClass(
                payment?.status ?? null,
              )}`}
            >
              {getPaymentStatusLabel(payment?.status ?? null)}
            </span>

            {canPayNow && (
              <Link
                href={`/dashboard/student/payment/${enrollment.id}`}
                className="inline-flex min-h-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Bayar Sekarang
              </Link>
            )}

            {payment?.status === "pending" && (
              <Link
                href={`/dashboard/student/payment/${enrollment.id}`}
                className="text-sm font-black text-blue-700 hover:underline"
              >
                Lihat status pembayaran
              </Link>
            )}
          </div>
        </div>

        {payment?.status === "rejected" && payment.notes && (
          <p className="mt-4 border-t border-red-100 pt-4 text-sm leading-6 text-red-600">
            {payment.notes}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-[#07528a] to-[#062d4d] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-50 ring-1 ring-white/20">
              Blok Aktif
            </span>

            <h1 className="mt-5 break-words text-3xl font-black tracking-tight sm:text-4xl">
              {course.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-100">
              <span>
                {course.organizations?.title ?? "Universitas belum tersedia"}
              </span>
              <span>{course.programs?.title ?? "Program belum tersedia"}</span>
            </div>

            {whatsappGroupUrl && (
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/70 sm:w-auto"
                aria-label={`Gabung Grup WhatsApp ${course.title}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 shrink-0"
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
                Gabung Grup WhatsApp
              </a>
            )}
          </div>

          <CourseProgressSummaryCards summary={progressSummary} />
        </div>
      </section>

      <details className="group rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-200 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
              Statistik Belajar
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Buka grafik nilai dan rekomendasi materi yang perlu dipelajari ulang.
            </p>
          </div>
          <span className="rounded-xl bg-blue-50 p-2 text-blue-700 transition-transform group-open:rotate-180">
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
        </summary>
        <div className="border-t border-blue-100 p-4 sm:p-5 [&>section>section:first-child]:hidden [&>section>div:nth-child(2)]:!mt-0">
          <StudentCourseInsights summary={progressSummary} />
        </div>
      </details>

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
    </main>
  );
}
