import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  courseService,
  enrollmentService,
  profileService,
} from "@/services";

interface StudentDashboardPageProps {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}

function formatRupiah(
  value: number,
): string {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
    },
  ).format(new Date(value));
}

function getMessage(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function StudentDashboardPage({
  searchParams,
}: StudentDashboardPageProps) {
  const profile =
    await profileService
      .getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const query =
    await searchParams;

  const errorMessage =
    getMessage(query.error);

  const [
    activeEnrollments,
    availableCourseDetails,
  ] = await Promise.all([
    enrollmentService
      .getActiveCourseEnrollments(
        profile.id,
      ),

    courseService
      .getAvailableCourseDetails(),
  ]);

  const activeCourseIds =
    new Set(
      activeEnrollments.map(
        (enrollment) =>
          enrollment.course_id,
      ),
    );

  const availableCourses =
    availableCourseDetails.filter(
      (course) =>
        !activeCourseIds.has(
          course.id,
        ),
    );

  return (
    <main className="mx-auto max-w-7xl p-8">
      <section className="mb-10 rounded-2xl bg-blue-600 p-8 text-white">
        <p className="text-sm font-medium text-blue-100">
          Selamat datang
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {profile.full_name}
        </h1>

        <p className="mt-3 max-w-2xl text-blue-100">
          Akses blok aktif Anda atau pilih blok pembelajaran baru.
        </p>
      </section>

      {errorMessage && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Blok Saya
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Blok yang pembayarannya telah disetujui dan sudah aktif.
          </p>
        </div>

        {activeEnrollments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="font-semibold text-gray-900">
              Belum ada blok aktif
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Blok akan muncul di sini setelah pembayaran disetujui admin.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeEnrollments.map(
              (enrollment) => {
                const course =
                  enrollment.courses;

                if (!course) {
                  return null;
                }

                return (
                  <article
                    key={enrollment.id}
                    className="flex flex-col rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
                  >
                    <div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Aktif
                      </span>

                      <h3 className="mt-4 text-xl font-bold text-gray-900">
                        {course.title}
                      </h3>

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        {course.organizations?.title ??
                          "Universitas belum tersedia"}
                      </p>

                      <p className="mt-1 text-sm text-blue-600">
                        {course.programs?.title ??
                          "Program belum tersedia"}
                      </p>
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <p className="text-xs text-gray-500">
                        Aktif sejak
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {formatDate(
                          enrollment.activated_at,
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/student/my-course/${course.id}`}
                      className="mt-6 block rounded-lg bg-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Buka Blok
                    </Link>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Blok Pembelajaran Tersedia
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Daftar blok aktif yang dapat Anda ikuti.
          </p>
        </div>

        {availableCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="font-semibold text-gray-900">
              Tidak ada blok lain
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Semua blok yang tersedia sudah Anda miliki atau belum ada blok baru.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {availableCourses.map(
              (course) => (
                <article
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex h-40 items-center justify-center bg-gray-100">
                    <span className="text-sm font-medium text-gray-400">
                      Dokter Ambis
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Tersedia
                    </span>

                    <h3 className="mt-4 text-xl font-bold text-gray-900">
                      {course.title}
                    </h3>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      {course.organization
                        ? `${course.organization.title} (${course.organization.short_name})`
                        : "Universitas belum tersedia"}
                    </p>

                    <p className="mt-1 text-sm text-blue-600">
                      {course.program?.title ??
                        "Program belum tersedia"}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                      {course.description ??
                        "Deskripsi blok pembelajaran belum tersedia."}
                    </p>

                    <div className="mt-auto pt-6">
                      <p className="mb-4 text-lg font-bold text-blue-600">
                        {course.is_free
                          ? "Gratis"
                          : formatRupiah(
                              course.price,
                            )}
                      </p>

                      <Link
                        href={`/dashboard/student/course/${course.id}`}
                        className="block rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}