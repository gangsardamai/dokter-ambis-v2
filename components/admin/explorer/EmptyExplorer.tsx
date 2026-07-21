import Link from "next/link";

interface EmptyExplorerProps {
  createFolderHref?: string;
}

export function EmptyExplorer({
  createFolderHref,
}: EmptyExplorerProps) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        border-dashed
        border-gray-300
        bg-white
        px-8
        py-20
        text-center
      "
    >
      <div className="text-6xl">
        📂
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-gray-900">
        Belum Ada Struktur Pembelajaran
      </h2>

      <p className="mt-3 max-w-lg text-gray-500">
        Course ini belum memiliki Folder maupun Lesson.
        <br />
        Mulailah dengan membuat Folder pertama untuk menyusun materi
        pembelajaran.
      </p>

      {createFolderHref && (
        <Link
          href={createFolderHref}
          className="
            mt-8
            inline-flex
            items-center
            rounded-lg
            bg-emerald-600
            px-5
            py-3
            font-medium
            text-white
            transition
            hover:bg-emerald-700
          "
        >
          + Tambah Folder
        </Link>
      )}
    </div>
  );
}