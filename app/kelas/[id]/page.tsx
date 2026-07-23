import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import {
  authService,
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

export const dynamic = "force-dynamic";

interface PublicCourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PublicCourseDetailPage({
  params,
}: PublicCourseDetailPageProps) {
  const { id } = await params;
  const [course, authenticated] = await Promise.all([
    courseService.getAvailableCourseDetailById(id),
    authService.isAuthenticated(),
  ]);

  if (!course) {
    notFound();
  }

  const profile = authenticated
    ? await profileService.getCurrentProfile()
    : null;
  const ownedEnrollment =
    profile?.role === "student"
      ? await enrollmentService.getActiveCourseEnrollmentByCourse(
          profile.id,
          course.id,
        )
      : null;

  let actionHref = `/login?next=${encodeURIComponent(
    `/dashboard/student/course/${course.id}`,
  )}`;
  let actionLabel = "Daftar";

  if (profile?.role === "student") {
    actionHref = ownedEnrollment
      ? `/dashboard/student/my-course/${course.id}`
      : `/dashboard/student/course/${course.id}`;
    actionLabel = ownedEnrollment ? "Buka Course" : "Daftar";
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f8fd] pb-20 pt-28 sm:pt-32">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <Link
            href={`/kelas?organization=${encodeURIComponent(
              course.organization?.slug ?? "",
            )}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            ← Kembali ke Katalog
          </Link>

          <article className="mt-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-950/8">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-7 text-white sm:p-10">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative">
                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-50">
                  Pendaftaran Dibuka
                </span>
                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                  {course.title}
                </h1>
              </div>
            </div>

            <div className="p-6 sm:p-9">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Universitas
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {course.organization?.title ?? "Belum tersedia"}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50/70 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-400">
                    Program
                  </p>
                  <p className="mt-2 text-lg font-black text-blue-950">
                    {course.program?.title ?? "Belum tersedia"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-slate-950">
                  Tentang Kelas
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {course.description ??
                    "Deskripsi kelas akan segera diperbarui oleh tim DokterAmbis."}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Harga kelas
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-700">
                    {course.is_free
                      ? "Gratis"
                      : formatRupiah(Number(course.price))}
                  </p>
                </div>

                {profile?.role === "admin" ||
                profile?.role === "mentor" ? (
                  <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-black text-blue-700">
                    Mode Lihat Detail
                  </span>
                ) : (
                  <Link
                    href={actionHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/10 transition hover:from-blue-700 hover:to-[#032f50]"
                  >
                    {actionLabel}
                  </Link>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
