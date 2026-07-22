import type { Database } from "@/supabase/types/database.types";

import { LessonMenu } from "./LessonMenu";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

interface LessonNodeProps {
  courseId: string;
  lesson: Lesson;
}

function LessonIcon() {
  return (
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

export function LessonNode({
  courseId,
  lesson,
}: LessonNodeProps) {
  return (
    <article className="ml-0 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:ml-8">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#1769cf] shadow-sm ring-1 ring-blue-100">
            <LessonIcon />
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-sm font-extrabold text-[#061827] sm:text-base">
              {lesson.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span>
                {lesson.duration ?? 0} menit
              </span>

              {lesson.is_free && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                  Gratis
                </span>
              )}
            </div>
          </div>
        </div>

        <LessonMenu
          courseId={courseId}
          lessonId={lesson.id}
        />
      </div>
    </article>
  );
}
