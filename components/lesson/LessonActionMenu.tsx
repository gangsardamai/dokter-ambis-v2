import Link from "next/link";

interface LessonActionMenuProps {
  lessonId: string;
}

export default function LessonActionMenu({
  lessonId,
}: LessonActionMenuProps) {

  return (

    <div className="flex justify-end gap-2">

      <Link
        href={`/dashboard/admin/lesson/${lessonId}`}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        Detail
      </Link>

      <Link
        href={`/dashboard/admin/lesson/${lessonId}/edit`}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        Edit
      </Link>

    </div>

  );

}