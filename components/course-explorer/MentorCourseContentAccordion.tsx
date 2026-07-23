"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import VideoPlayer from "@/components/video/VideoPlayer";
import type {
  CourseExplorerContent,
  ExplorerLessonContent,
} from "@/types/course-explorer";

interface MentorCourseContentAccordionProps {
  courseId: string;
  content: CourseExplorerContent;
}

const menuLinkClass =
  "flex min-h-10 w-full items-center rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200";

function ActionMenu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
      >
        •••
      </summary>
      <div className="absolute right-0 z-30 mt-2 min-w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
        {children}
      </div>
    </details>
  );
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
        published
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function LessonPanel({
  courseId,
  content,
}: {
  courseId: string;
  content: ExplorerLessonContent;
}) {
  const { lesson, files, videos, quizzes } = content;
  const itemCount = files.length + videos.length + quizzes.length;

  return (
    <details className="group min-w-0 overflow-visible rounded-2xl border border-blue-100 bg-slate-50/80">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-black text-slate-950 sm:text-base">
              {lesson.title}
            </h3>
            <StatusBadge status={lesson.publication_status} />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {itemCount} konten · {lesson.duration ?? 0} menit
          </p>
        </div>
        <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100">
          Buka
        </span>
      </summary>

      <div className="border-t border-blue-100 p-3 sm:p-4">
        <div className="mb-4 flex justify-end">
          <ActionMenu label={`Aksi lesson ${lesson.title}`}>
            <Link
              href={`/dashboard/mentor/file/new?lessonId=${lesson.id}`}
              className={menuLinkClass}
            >
              Tambah File
            </Link>
            <Link
              href={`/dashboard/mentor/video/new?lessonId=${lesson.id}`}
              className={menuLinkClass}
            >
              Tambah Video
            </Link>
            <Link
              href={`/dashboard/quiz/new?lessonId=${lesson.id}`}
              className={menuLinkClass}
            >
              Tambah Quiz
            </Link>
            <Link
              href={`/dashboard/mentor/course/${courseId}/explorer/lesson/${lesson.id}/edit`}
              className={menuLinkClass}
            >
              Edit Lesson
            </Link>
          </ActionMenu>
        </div>

        {itemCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-bold text-slate-500">
            Belum ada konten dalam lesson ini.
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <article
                key={file.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-black text-slate-950">
                      {file.title}
                    </p>
                    <StatusBadge status={file.publication_status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    File · {file.file_type.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/materials/${file.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
                  >
                    Download
                  </a>
                  <ActionMenu label={`Aksi file ${file.title}`}>
                    <Link
                      href={`/dashboard/mentor/file/${file.id}/edit`}
                      className={menuLinkClass}
                    >
                      Edit File
                    </Link>
                  </ActionMenu>
                </div>
              </article>
            ))}

            {videos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-sm font-black text-slate-950">
                        {video.title}
                      </p>
                      <StatusBadge status={video.publication_status} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Video · {video.duration} menit
                    </p>
                  </div>
                  <ActionMenu label={`Aksi video ${video.title}`}>
                    <Link
                      href={`/dashboard/mentor/video/${video.id}/edit`}
                      className={menuLinkClass}
                    >
                      Edit Video
                    </Link>
                  </ActionMenu>
                </div>
                <div className="border-t border-slate-100 bg-slate-950 p-2 sm:p-3">
                  <VideoPlayer
                    provider={video.provider}
                    videoId={video.provider_video_id}
                  />
                </div>
              </article>
            ))}

            {quizzes.map((quiz) => (
              <article
                key={quiz.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-black text-slate-950">
                      {quiz.title}
                    </p>
                    <StatusBadge status={quiz.publication_status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Quiz · {quiz.total_questions} soal · nilai lulus {quiz.passing_score}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/quiz/${quiz.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                  >
                    Kelola Soal
                  </Link>
                  <ActionMenu label={`Aksi quiz ${quiz.title}`}>
                    <Link
                      href={`/dashboard/quiz/${quiz.id}/edit`}
                      className={menuLinkClass}
                    >
                      Edit Quiz
                    </Link>
                  </ActionMenu>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function MentorCourseContentAccordion({
  courseId,
  content,
}: MentorCourseContentAccordionProps) {
  const isEmpty =
    content.folders.length === 0 &&
    content.ungroupedLessons.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
        <p className="font-black text-slate-900">Materi belum tersedia</p>
        <p className="mt-2 text-sm text-slate-500">
          Tambahkan folder dan lesson untuk mulai menyusun course.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {content.folders.map(({ folder, lessons }) => (
        <details
          key={folder.id}
          className="group min-w-0 overflow-visible rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5"
        >
          <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-base font-black text-slate-950 sm:text-lg">
                  {folder.title}
                </h2>
                <StatusBadge status={folder.publication_status} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {lessons.length} lesson
              </p>
            </div>
            <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
              Buka Folder
            </span>
          </summary>

          <div className="border-t border-blue-100 p-3 sm:p-5">
            <div className="mb-4 flex justify-end">
              <ActionMenu label={`Aksi folder ${folder.title}`}>
                <Link
                  href={`/dashboard/mentor/course/${courseId}/explorer/lesson/create?folderId=${folder.id}`}
                  className={menuLinkClass}
                >
                  Tambah Lesson
                </Link>
                <Link
                  href={`/dashboard/mentor/course/${courseId}/explorer/folder/${folder.id}/edit`}
                  className={menuLinkClass}
                >
                  Edit Folder
                </Link>
              </ActionMenu>
            </div>

            {lessons.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                Belum ada lesson di dalam folder ini.
              </p>
            ) : (
              <div className="space-y-3">
                {lessons.map((lessonContent) => (
                  <LessonPanel
                    key={lessonContent.lesson.id}
                    courseId={courseId}
                    content={lessonContent}
                  />
                ))}
              </div>
            )}
          </div>
        </details>
      ))}

      {content.ungroupedLessons.length > 0 && (
        <section className="rounded-3xl border border-blue-100 bg-white p-3 shadow-sm sm:p-5">
          <h2 className="px-1 pb-4 text-base font-black text-slate-950 sm:text-lg">
            Materi Lainnya
          </h2>
          <div className="space-y-3">
            {content.ungroupedLessons.map((lessonContent) => (
              <LessonPanel
                key={lessonContent.lesson.id}
                courseId={courseId}
                content={lessonContent}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
