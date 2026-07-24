"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import VideoPlayer from "@/components/video/VideoPlayer";
import { isGoogleDriveFilePath } from "@/lib/file/file-source";

import type {
  CourseExplorerContent,
  ExplorerFile,
  ExplorerLessonContent,
  ExplorerQuiz,
  ExplorerVideo,
} from "@/types/course-explorer";

type ExplorerMode = "manager" | "student";

interface CourseContentAccordionProps {
  courseId: string;
  content: CourseExplorerContent;
  mode: ExplorerMode;
}

interface ActionMenuProps {
  children: ReactNode;
  label: string;
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="m6 9 6 6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionMenu({
  children,
  label,
}: ActionMenuProps) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        •••
      </summary>

      <div className="absolute right-0 z-30 mt-2 min-w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
        {children}
      </div>
    </details>
  );
}

const menuLinkClass =
  "flex min-h-10 w-full items-center rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200";

function StatusBadge({
  status,
}: {
  status: string;
}) {
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

function ContentIcon({
  type,
}: {
  type: "file" | "video" | "quiz";
}) {
  const paths = {
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9 5 3-5 3Z" />
      </>
    ),
    quiz: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1-1.4 2.1M12 17h.01" />
      </>
    ),
  };

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[type]}
      </svg>
    </span>
  );
}

function ManagerItemMenu({
  type,
  id,
}: {
  type: "file" | "video" | "quiz";
  id: string;
}) {
  const basePath =
    type === "file"
      ? "/dashboard/admin/file"
      : type === "video"
        ? "/dashboard/admin/video"
        : "/dashboard/quiz";

  return (
    <ActionMenu label={`Aksi ${type}`}>
      <Link
        href={`${basePath}/${id}/edit`}
        className={menuLinkClass}
      >
        Edit
      </Link>
      <Link
        href={`${basePath}/${id}`}
        className={menuLinkClass}
      >
        Lihat Detail
      </Link>
    </ActionMenu>
  );
}

function FileItem({
  file,
  mode,
}: {
  file: ExplorerFile;
  mode: ExplorerMode;
}) {
  const isGoogleDrive =
    isGoogleDriveFilePath(file.file_path);

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <ContentIcon type="file" />
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-slate-950">
            {file.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{file.file_type.toUpperCase()}</span>
            {isGoogleDrive && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                Google Drive
              </span>
            )}
            {mode === "manager" && (
              <StatusBadge status={file.publication_status} />
            )}
          </div>
          {mode === "student" && isGoogleDrive && (
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
              Jika unduhan tidak dimulai atau Google Drive menampilkan error, silakan hubungi Admin Dokter Ambis.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/api/materials/${file.id}`}
          target={isGoogleDrive ? "_blank" : undefined}
          rel={
            isGoogleDrive
              ? "noopener noreferrer"
              : undefined
          }
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:flex-none"
        >
          Download
        </a>
        {mode === "manager" && (
          <ManagerItemMenu type="file" id={file.id} />
        )}
      </div>
    </article>
  );
}

function VideoItem({
  video,
  mode,
}: {
  video: ExplorerVideo;
  mode: ExplorerMode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex min-w-0 items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <ContentIcon type="video" />
          <div className="min-w-0">
            <p className="break-words text-sm font-black text-slate-950">
              {video.title}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span>{video.duration} menit</span>
              {mode === "manager" && (
                <StatusBadge status={video.publication_status} />
              )}
            </div>
          </div>
        </div>

        {mode === "manager" && (
          <ManagerItemMenu type="video" id={video.id} />
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-950 p-2 sm:p-3">
        <VideoPlayer
          provider={video.provider}
          videoId={video.provider_video_id}
        />
      </div>
    </article>
  );
}

function QuizItem({
  quiz,
  mode,
}: {
  quiz: ExplorerQuiz;
  mode: ExplorerMode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <ContentIcon type="quiz" />
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-slate-950">
            {quiz.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{quiz.total_questions} soal</span>
            <span>Nilai lulus {quiz.passing_score}</span>
            <span>Maks. {quiz.max_attempt} percobaan</span>
            {mode === "manager" && (
              <StatusBadge status={quiz.publication_status} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={
            mode === "student"
              ? `/dashboard/student/quiz/${quiz.id}`
              : `/dashboard/quiz/${quiz.id}`
          }
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:flex-none"
        >
          {mode === "student" ? "Kerjakan" : "Kelola Soal"}
        </Link>
        {mode === "manager" && (
          <ManagerItemMenu type="quiz" id={quiz.id} />
        )}
      </div>
    </article>
  );
}

function LessonPanel({
  courseId,
  content,
  mode,
}: {
  courseId: string;
  content: ExplorerLessonContent;
  mode: ExplorerMode;
}) {
  const { lesson, files, videos, quizzes } = content;
  const itemCount = files.length + videos.length + quizzes.length;

  return (
    <details className="group min-w-0 overflow-visible rounded-2xl border border-blue-100 bg-slate-50/80">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-200 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-sm font-black text-slate-950 sm:text-base">
              {lesson.title}
            </h3>
            {mode === "manager" && (
              <StatusBadge status={lesson.publication_status} />
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {itemCount} konten · {lesson.duration ?? 0} menit
          </p>
        </div>

        <span className="shrink-0 rounded-xl bg-white p-2 text-blue-700 shadow-sm ring-1 ring-blue-100">
          <ChevronIcon />
        </span>
      </summary>

      <div className="border-t border-blue-100 p-3 sm:p-4">
        {mode === "manager" && (
          <div className="mb-4 flex justify-end">
            <ActionMenu label={`Aksi lesson ${lesson.title}`}>
              <Link
                href={`/dashboard/admin/file/new?lessonId=${lesson.id}`}
                className={menuLinkClass}
              >
                Tambah File
              </Link>
              <Link
                href={`/dashboard/admin/video/new?lessonId=${lesson.id}`}
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
                href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lesson.id}/edit`}
                className={menuLinkClass}
              >
                Edit Lesson
              </Link>
              <Link
                href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lesson.id}/delete`}
                className={`${menuLinkClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
              >
                Hapus Lesson
              </Link>
            </ActionMenu>
          </div>
        )}

        {itemCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm font-bold text-slate-700">
              Belum ada konten dalam lesson ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <FileItem key={file.id} file={file} mode={mode} />
            ))}
            {videos.map((video) => (
              <VideoItem key={video.id} video={video} mode={mode} />
            ))}
            {quizzes.map((quiz) => (
              <QuizItem key={quiz.id} quiz={quiz} mode={mode} />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function CourseContentAccordion({
  courseId,
  content,
  mode,
}: CourseContentAccordionProps) {
  const isEmpty =
    content.folders.length === 0 &&
    content.ungroupedLessons.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
        <p className="font-black text-slate-900">
          Materi belum tersedia
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Folder dan lesson akan muncul di sini setelah ditambahkan.
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
          <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-200 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#063d67] text-white shadow-sm">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-base font-black text-slate-950 sm:text-lg">
                    {folder.title}
                  </h2>
                  {mode === "manager" && (
                    <StatusBadge status={folder.publication_status} />
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {lessons.length} lesson
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-xl bg-blue-50 p-2 text-blue-700">
              <ChevronIcon />
            </span>
          </summary>

          <div className="border-t border-blue-100 p-3 sm:p-5">
            {mode === "manager" && (
              <div className="mb-4 flex justify-end">
                <ActionMenu label={`Aksi folder ${folder.title}`}>
                  <Link
                    href={`/dashboard/admin/course/${courseId}/explorer/lesson/create?folderId=${folder.id}`}
                    className={menuLinkClass}
                  >
                    Tambah Lesson
                  </Link>
                  <Link
                    href={`/dashboard/admin/course/${courseId}/explorer/folder/${folder.id}/edit`}
                    className={menuLinkClass}
                  >
                    Edit Folder
                  </Link>
                  <Link
                    href={`/dashboard/admin/course/${courseId}/explorer/folder/${folder.id}/delete`}
                    className={`${menuLinkClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
                  >
                    Hapus Folder
                  </Link>
                </ActionMenu>
              </div>
            )}

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
                    mode={mode}
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
                mode={mode}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
