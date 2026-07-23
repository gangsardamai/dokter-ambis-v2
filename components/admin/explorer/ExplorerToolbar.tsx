import Link from "next/link";

interface ExplorerToolbarProps {
  courseId: string;
}

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function ExplorerToolbar({
  courseId,
}: ExplorerToolbarProps) {
  return (
    <div className="rounded-3xl border border-blue-100/80 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={`/dashboard/admin/course/${courseId}/explorer/folder/create`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
        >
          <PlusIcon />
          Tambah Folder
        </Link>

        <button
          type="button"
          disabled
          className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-500 opacity-80 sm:w-auto"
        >
          <PlusIcon />
          Tambah Lesson
        </button>
      </div>
    </div>
  );
}
