import Link from "next/link";

interface LessonMenuProps {
  courseId: string;
  lessonId: string;
}

const actionClass =
  "inline-flex min-h-9 items-center rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 sm:text-sm";

export function LessonMenu({
  courseId,
  lessonId,
}: LessonMenuProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lessonId}/edit`}
        className={`${actionClass} bg-blue-50 text-[#1769cf] hover:bg-blue-100 focus:ring-blue-200`}
      >
        Edit
      </Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lessonId}/delete`}
        className={`${actionClass} bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200`}
      >
        Hapus
      </Link>
    </div>
  );
}
