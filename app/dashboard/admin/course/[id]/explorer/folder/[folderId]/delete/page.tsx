import Link from "next/link";
import { notFound } from "next/navigation";

import PageTitle from "@/components/admin/page/PageTitle";
import { folderService } from "@/services";

import { deleteFolderAction } from "./actions";

interface DeleteFolderPageProps {
  params: Promise<{
    id: string;
    folderId: string;
  }>;
}

export default async function DeleteFolderPage({
  params,
}: DeleteFolderPageProps) {
  const { id, folderId } = await params;
  const folder = await folderService.getFolderById(folderId);

  if (!folder || folder.course_id !== id) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <PageTitle
        title="Hapus Folder"
        description="Konfirmasi penghapusan folder kosong."
      />

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold">
          {folder.title}
        </h2>

        {folder.description && (
          <p className="mt-2 text-gray-600">
            {folder.description}
          </p>
        )}

        <div className="mt-6 rounded-lg bg-white p-4 text-red-700">
          Folder hanya dapat dihapus apabila sudah tidak memiliki
          lesson maupun subfolder. Sistem akan menolak penghapusan
          jika masih ada isi di dalamnya.
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <form
          action={async () => {
            "use server";
            await deleteFolderAction(id, folderId);
          }}
        >
          <button className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700">
            Ya, Hapus Folder
          </button>
        </form>

        <Link
          href={`/dashboard/admin/course/${id}/explorer`}
          className="rounded-lg border px-5 py-2 hover:bg-gray-100"
        >
          Batal
        </Link>
      </div>
    </main>
  );
}
