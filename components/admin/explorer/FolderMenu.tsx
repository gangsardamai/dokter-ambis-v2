import Link from "next/link";

interface FolderMenuProps {
  courseId: string;
  folderId: string;
}

export function FolderMenu({
  courseId,
  folderId,
}: FolderMenuProps) {
  return (
    <div className="flex items-center gap-3">

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/folder/${folderId}/edit`}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </Link>

      <Link
  href={`/dashboard/admin/course/${courseId}/explorer/lesson/create?folderId=${folderId}`}
  className="text-sm text-green-600 hover:underline"
>
  + Lesson
</Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/folder/${folderId}/delete`}
        className="text-sm text-red-600 hover:underline"
      >
        Hapus
      </Link>

    </div>
  );
}