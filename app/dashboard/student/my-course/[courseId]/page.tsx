import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  enrollmentService,
  folderService,
  lessonService,
  profileService,
} from "@/services";

interface StudentMyCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function StudentMyCoursePage({
  params,
}: StudentMyCoursePageProps) {
  const { courseId } =
    await params;

  const profile =
    await profileService
      .getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const enrollment =
    await enrollmentService
      .getActiveCourseEnrollment(
        profile.id,
        courseId,
      );

  if (
    !enrollment ||
    !enrollment.courses
  ) {
    redirect(
      `/dashboard/student?error=${encodeURIComponent(
        "Anda belum memiliki akses aktif ke blok tersebut.",
      )}`,
    );
  }

  const [
    folders,
    lessons,
  ] = await Promise.all([
    folderService
      .getFoldersByCourse(
        courseId,
      ),

    lessonService
      .getLessonsByCourse(
        courseId,
      ),
  ]);

  const lessonsByFolder =
    new Map<
      string | null,
      typeof lessons
    >();

  for (const lesson of lessons) {
    const folderId =
      lesson.folder_id ?? null;

    const currentLessons =
      lessonsByFolder.get(
        folderId,
      ) ?? [];

    currentLessons.push(
      lesson,
    );

    lessonsByFolder.set(
      folderId,
      currentLessons,
    );
  }

  const course =
    enrollment.courses;

  const lessonsWithoutFolder =
    lessonsByFolder.get(null) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href="/dashboard/student"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Kembali ke dashboard
      </Link>

      <section className="mt-6 rounded-2xl bg-blue-600 p-8 text-white">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          Blok Aktif
        </span>

        <h1 className="mt-5 text-3xl font-bold">
          {course.title}
        </h1>

        <p className="mt-3 text-blue-100">
          {course.organizations?.title ??
            "Universitas belum tersedia"}
        </p>

        <p className="mt-1 text-sm text-blue-100">
          {course.programs?.title ??
            "Program belum tersedia"}
        </p>
      </section>

      <section className="mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Materi Pembelajaran
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pilih materi sesuai urutan folder pembelajaran.
          </p>
        </div>

        {folders.length === 0 &&
        lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="font-semibold text-gray-900">
              Materi belum tersedia
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Admin atau mentor belum menambahkan materi pada blok ini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {folders.map(
              (folder) => {
                const folderLessons =
                  lessonsByFolder.get(
                    folder.id,
                  ) ?? [];

                return (
                  <section
                    key={folder.id}
                    className={`rounded-2xl border bg-white p-6 shadow-sm ${
                      folder.parent_folder_id
                        ? "ml-6"
                        : ""
                    }`}
                  >
                    <div className="border-b pb-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Folder {folder.folder_order}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-gray-900">
                        {folder.title}
                      </h3>

                      {folder.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                          {folder.description}
                        </p>
                      )}
                    </div>

                    {folderLessons.length ===
                    0 ? (
                      <p className="mt-5 text-sm text-gray-500">
                        Belum ada lesson di dalam folder ini.
                      </p>
                    ) : (
                      <div className="mt-5 divide-y">
                        {folderLessons.map(
                          (lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between gap-4 py-4"
                            >
                              <div>
                                <p className="text-xs font-medium text-gray-400">
                                  Materi {lesson.lesson_order}
                                </p>

                                <h4 className="mt-1 font-semibold text-gray-900">
                                  {lesson.title}
                                </h4>

                                <p className="mt-1 text-xs text-gray-500">
                                  {lesson.duration
                                    ? `${lesson.duration} menit`
                                    : "Durasi belum tersedia"}
                                </p>
                              </div>

                              <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
                                Materi
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </section>
                );
              },
            )}

            {lessonsWithoutFolder.length >
              0 && (
              <section className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900">
                  Materi Lainnya
                </h3>

                <div className="mt-5 divide-y">
                  {lessonsWithoutFolder.map(
                    (lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            Materi {lesson.lesson_order}
                          </p>

                          <h4 className="mt-1 font-semibold text-gray-900">
                            {lesson.title}
                          </h4>
                        </div>

                        <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
                          Materi
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}   