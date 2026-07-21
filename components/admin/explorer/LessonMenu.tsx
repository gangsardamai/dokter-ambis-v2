import Link from "next/link";

interface LessonMenuProps {

  courseId: string;

  lessonId: string;

}

export function LessonMenu({
  courseId,
  lessonId,
}: LessonMenuProps) {

  return (

    <div className="flex items-center gap-3">

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lessonId}/edit`}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/lesson/${lessonId}/delete`}
        className="text-sm text-red-600 hover:underline"
      >
        Hapus
      </Link>

    </div>

  );

}