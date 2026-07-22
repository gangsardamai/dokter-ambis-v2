import type { Database } from "@/supabase/types/database.types";

import { lessonService } from "@/services";

import {
  FolderMenu,
  LessonNode,
} from ".";

type Folder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

interface FolderNodeProps {
  courseId: string;
  folder: Folder;
}

function FolderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

export async function FolderNode({
  courseId,
  folder,
}: FolderNodeProps) {
  const lessons = await lessonService.getLessonsByFolder(
    folder.id,
  );

  return (
    <section className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1769cf]">
            <FolderIcon />
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
              {folder.title}
            </h2>

            {folder.description ? (
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                {folder.description}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Belum ada deskripsi folder.
              </p>
            )}
          </div>
        </div>

        <FolderMenu
          courseId={courseId}
          folderId={folder.id}
        />
      </div>

      {lessons.length > 0 && (
        <div className="mt-5 space-y-3">
          {lessons.map((lesson) => (
            <LessonNode
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
            />
          ))}
        </div>
      )}
    </section>
  );
}
