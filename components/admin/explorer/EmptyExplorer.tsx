import Link from "next/link";

interface EmptyExplorerProps {
  createFolderHref?: string;
}

function EmptyFolderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M12 11v5" />
      <path d="M9.5 13.5h5" />
    </svg>
  );
}

export function EmptyExplorer({
  createFolderHref,
}: EmptyExplorerProps) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-white px-5 py-16 text-center shadow-sm sm:px-8 sm:py-20">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-blue-50 text-[#1769cf]">
        <EmptyFolderIcon />
      </div>

      <h2 className="mt-6 max-w-2xl break-words text-2xl font-extrabold tracking-[-0.04em] text-[#061827]">
        Belum Ada Struktur Pembelajaran
      </h2>

      <p className="mt-3 max-w-lg break-words text-sm leading-7 text-slate-600 sm:text-base">
        Course ini belum memiliki Folder maupun Lesson. Mulailah dengan membuat Folder pertama untuk menyusun materi pembelajaran.
      </p>

      {createFolderHref && (
        <Link
          href={createFolderHref}
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
        >
          Tambah Folder
        </Link>
      )}
    </div>
  );
}
