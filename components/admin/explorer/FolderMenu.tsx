import Link from "next/link";

interface FolderMenuProps {
  courseId: string;
  folderId: string;
}

const actionClass =
  "inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2";

export function FolderMenu({
  courseId,
  folderId,
}: FolderMenuProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/folder/${folderId}/edit`}
        className={`${actionClass} bg-blue-50 text-[#1769cf] hover:bg-blue-100 focus:ring-blue-200`}
      >
        Edit
      </Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/lesson/create?folderId=${folderId}`}
        className={`${actionClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-200`}
      >
        Tambah Lesson
      </Link>

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/folder/${folderId}/delete`}
        className={`${actionClass} bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200`}
      >
        Hapus
      </Link>
    </div>
  );
}
