import Link from "next/link";

interface ExplorerToolbarProps {
  courseId: string;
}

export function ExplorerToolbar({
  courseId,
}: ExplorerToolbarProps) {
  return (
    <div className="flex items-center gap-3">

      <Link
        href={`/dashboard/admin/course/${courseId}/explorer/folder/create`}
        className="
          rounded-lg
          bg-emerald-600
          px-4
          py-2
          font-medium
          text-white
          hover:bg-emerald-700
        "
      >
        + Folder
      </Link>

      <button
        disabled
        className="
          rounded-lg
          bg-gray-300
          px-4
          py-2
          text-gray-600
          cursor-not-allowed
        "
      >
        + Lesson
      </button>

    </div>
  );
}