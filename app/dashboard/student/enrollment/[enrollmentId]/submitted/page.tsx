import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

interface DeferredEnrollmentSubmittedPageProps {
  params: Promise<{ enrollmentId: string }>;
}

export default async function DeferredEnrollmentSubmittedPage({
  params,
}: DeferredEnrollmentSubmittedPageProps) {
  const { enrollmentId } = await params;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");

  const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);

  if (
    !enrollment ||
    enrollment.profile_id !== profile.id ||
    enrollment.payment_timing !== "deferred"
  ) {
    notFound();
  }

  const course = await courseService.getCourseById(enrollment.course_id);
  if (!course) notFound();

  if (enrollment.status === "active") {
    redirect(`/dashboard/student/my-course/${course.id}`);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center p-4 sm:p-6 lg:p-8">
      <section className="w-full rounded-[2rem] border border-blue-100 bg-white p-6 text-center shadow-xl shadow-blue-950/10 sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 7v5l3 2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Bayar di Akhir Course
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Pendaftaran berhasil diajukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Silakan tunggu persetujuan dari Admin untuk course
          <strong className="text-slate-950"> {course.title}</strong>. Setelah
          disetujui, course akan muncul sebagai aktif dan dapat langsung diakses.
        </p>

        <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-800">
          Status saat ini: Menunggu Persetujuan Admin
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/student"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/10"
          >
            Kembali ke Course Dimiliki
          </Link>
          <Link
            href={`/dashboard/student/course/${course.id}`}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-black text-blue-700"
          >
            Lihat Detail Course
          </Link>
        </div>
      </section>
    </main>
  );
}
